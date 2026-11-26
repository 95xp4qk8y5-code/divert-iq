import {
  MonteCarloSummary,
  StreamImpactRow,
  TippingPointSample,
  WarmScenarioInput,
  WarmSimulationResult,
} from './types';

/**
 * EPA WARM Version 16 (December 2023) published net GHG emission factors.
 * Converted cleanly from MTCO2e/short ton to MTCO2e/metric ton via factor 1.10231.
 * Negative values indicate net lifecycle GHG reductions (avoided virgin manufacturing / soil C).
 * Positive values indicate net lifecycle GHG emissions (e.g., landfill CH4 generation).
 */
const SHORT_TO_METRIC = 1.10231;

interface WarmStreamSpec {
  id: string;
  name: string;
  kind: 'recycle' | 'food_edible' | 'food_scraps' | 'yard' | 'ewaste';
  defaultSharePct: number;
  // Published EPA WARM v16 MTCO2e per short ton
  divertFactorShortTon: number;
  landfillFactorShortTon: number;
  commodityRebateUsdPerTon: number;
}

export const EPA_WARM_V16_STREAMS: WarmStreamSpec[] = [
  {
    id: 'food_edible',
    name: 'Surplus Edible Food (Donation)',
    kind: 'food_edible',
    defaultSharePct: 12,
    divertFactorShortTon: -3.66, // EPA WARM v16 Source Reduction / Donation
    landfillFactorShortTon: 0.58, // EPA WARM v16 Food Waste Landfilled (national avg LFG recovery)
    commodityRebateUsdPerTon: 0,
  },
  {
    id: 'food_scraps',
    name: 'Inedible Food Scraps (Compost)',
    kind: 'food_scraps',
    defaultSharePct: 22,
    divertFactorShortTon: -0.18, // EPA WARM v16 Food Waste Composted
    landfillFactorShortTon: 0.58,
    commodityRebateUsdPerTon: -18, // Compost hauling fee still cheaper than landfill
  },
  {
    id: 'cardboard',
    name: 'Corrugated Cardboard (OCC)',
    kind: 'recycle',
    defaultSharePct: 18,
    divertFactorShortTon: -3.14,
    landfillFactorShortTon: 0.18,
    commodityRebateUsdPerTon: 45,
  },
  {
    id: 'mixed_paper',
    name: 'Mixed Office & Packaging Paper',
    kind: 'recycle',
    defaultSharePct: 14,
    divertFactorShortTon: -3.55,
    landfillFactorShortTon: 0.08,
    commodityRebateUsdPerTon: 25,
  },
  {
    id: 'pet_plastic',
    name: 'PET Plastic Containers (#1)',
    kind: 'recycle',
    defaultSharePct: 7,
    divertFactorShortTon: -1.04,
    landfillFactorShortTon: 0.02,
    commodityRebateUsdPerTon: 85,
  },
  {
    id: 'hdpe_plastic',
    name: 'HDPE Plastic Containers (#2)',
    kind: 'recycle',
    defaultSharePct: 5,
    divertFactorShortTon: -0.76,
    landfillFactorShortTon: 0.02,
    commodityRebateUsdPerTon: 95,
  },
  {
    id: 'aluminum',
    name: 'Aluminum Beverage Cans',
    kind: 'recycle',
    defaultSharePct: 3,
    divertFactorShortTon: -9.13,
    landfillFactorShortTon: 0.02,
    commodityRebateUsdPerTon: 680,
  },
  {
    id: 'steel_cans',
    name: 'Steel Food Cans',
    kind: 'recycle',
    defaultSharePct: 3,
    divertFactorShortTon: -1.83,
    landfillFactorShortTon: 0.02,
    commodityRebateUsdPerTon: 120,
  },
  {
    id: 'glass',
    name: 'Glass Bottles & Jars',
    kind: 'recycle',
    defaultSharePct: 7,
    divertFactorShortTon: -0.28,
    landfillFactorShortTon: 0.02,
    commodityRebateUsdPerTon: 5,
  },
  {
    id: 'yard_ewaste',
    name: 'Small Campus E-Waste & Misc',
    kind: 'ewaste',
    defaultSharePct: 9,
    divertFactorShortTon: -2.45, // Personal electronics recycling average
    landfillFactorShortTon: 0.02,
    commodityRebateUsdPerTon: 35,
  },
];

export const DEFAULT_WARM_INPUT: WarmScenarioInput = {
  facilityCount: 12,
  annualWasteTonsPerFacility: 95,
  baselineContaminationPct: 24,
  targetContaminationPct: 7,
  mrfRejectionThresholdPct: 12,
  foodRescueCapturePct: 68,
  compostAdoptionPct: 72,
  recyclingParticipationPct: 82,
  landfillTippingFeePerTon: 72,
  contaminationSurchargePerTon: 115,
  monteCarloSeed: 20261221,
};

/**
 * Smooth logistic MRF load rejection probability curve centered above the facility threshold.
 * Below threshold, isolated contamination only causes linear residue loss; above threshold,
 * haulers reject entire contaminated loads directly to landfill and levy contamination surcharges.
 */
export function computeMrfRejectionProb(
  contaminationPct: number,
  thresholdPct: number
): number {
  const excess = contaminationPct - thresholdPct;
  const logistic = 1 / (1 + Math.exp(-0.32 * (excess - 3.5)));
  return Math.max(0, Math.min(0.96, logistic));
}

function evaluateScenarioPoint(
  input: WarmScenarioInput,
  contaminationPct: number,
  isTarget: boolean,
  volumeMult = 1,
  methaneMult = 1,
  captureMult = 1
): {
  diversionRawPct: number;
  diversionEffectivePct: number;
  rejectionProb: number;
  netMtCo2e: number;
  annualCostUsd: number;
  divertedTonsByStream: number[];
  co2eByStream: number[];
} {
  const totalTons = input.facilityCount * input.annualWasteTonsPerFacility * volumeMult;
  const rejectionProb = computeMrfRejectionProb(contaminationPct, input.mrfRejectionThresholdPct);

  // Baseline assumptions represent typical unassisted campus/municipal operations
  const foodCapture = isTarget
    ? Math.min(0.95, (input.foodRescueCapturePct / 100) * captureMult)
    : 0.14;
  const compostCapture = isTarget
    ? Math.min(0.95, (input.compostAdoptionPct / 100) * captureMult)
    : 0.2;
  const recycleCapture = isTarget
    ? Math.min(0.95, (input.recyclingParticipationPct / 100) * captureMult)
    : 0.48;
  const ewasteCapture = isTarget ? Math.min(0.92, 0.78 * captureMult) : 0.25;

  let rawDivertedTons = 0;
  let effectiveDivertedTons = 0;
  let netMtCo2e = 0;
  let annualCostUsd = 0;
  const divertedTonsByStream: number[] = [];
  const co2eByStream: number[] = [];

  for (const stream of EPA_WARM_V16_STREAMS) {
    const tons = totalTons * (stream.defaultSharePct / 100);
    let capture = recycleCapture;
    if (stream.kind === 'food_edible') capture = foodCapture;
    else if (stream.kind === 'food_scraps') capture = compostCapture;
    else if (stream.kind === 'ewaste') capture = ewasteCapture;

    const attemptedDivert = tons * capture;
    rawDivertedTons += attemptedDivert;

    // Contamination degrades curbside recycling & compost streams:
    // direct contamination residue + rejected full loads diverted back to landfill
    let effectiveDivert = attemptedDivert;
    let surchargeTons = 0;
    if (stream.kind === 'recycle' || stream.kind === 'food_scraps') {
      const contaminationLossFrac = Math.min(0.85, (contaminationPct / 100) * 0.65);
      const loadSurvival = (1 - contaminationLossFrac) * (1 - rejectionProb * 0.72);
      effectiveDivert = attemptedDivert * Math.max(0.05, loadSurvival);
      surchargeTons = attemptedDivert * rejectionProb;
    }

    const landfilledTons = Math.max(0, tons - effectiveDivert);
    effectiveDivertedTons += effectiveDivert;

    const divertFactor = stream.divertFactorShortTon * SHORT_TO_METRIC;
    const landfillFactor =
      stream.landfillFactorShortTon * SHORT_TO_METRIC * (stream.landfillFactorShortTon > 0.1 ? methaneMult : 1);

    const streamCo2e = effectiveDivert * divertFactor + landfilledTons * landfillFactor;
    netMtCo2e += streamCo2e;

    // Cost: landfill tipping fee + contamination surcharges - clean commodity rebates
    const landfillCost = landfilledTons * input.landfillTippingFeePerTon;
    const surchargeCost = surchargeTons * input.contaminationSurchargePerTon;
    const rebateOrCompostFee = effectiveDivert * (-stream.commodityRebateUsdPerTon);
    annualCostUsd += Math.max(0, landfillCost + surchargeCost + rebateOrCompostFee);

    divertedTonsByStream.push(effectiveDivert);
    co2eByStream.push(streamCo2e);
  }

  return {
    diversionRawPct: totalTons > 0 ? (rawDivertedTons / totalTons) * 100 : 0,
    diversionEffectivePct: totalTons > 0 ? (effectiveDivertedTons / totalTons) * 100 : 0,
    rejectionProb,
    netMtCo2e,
    annualCostUsd,
    divertedTonsByStream,
    co2eByStream,
  };
}

// Deterministic Mulberry32 PRNG for reproducible Monte Carlo simulations
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussianSample(rng: () => number, mean: number, std: number): number {
  const u1 = Math.max(1e-9, rng());
  const u2 = rng();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * std;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor((p / 100) * (sorted.length - 1))));
  return Number(sorted[idx].toFixed(1));
}

export function runWarmSimulation(input: WarmScenarioInput, mcTrials = 500): WarmSimulationResult {
  const totalAnnualTons = input.facilityCount * input.annualWasteTonsPerFacility;

  const baseEval = evaluateScenarioPoint(input, input.baselineContaminationPct, false);
  const targetEval = evaluateScenarioPoint(input, input.targetContaminationPct, true);

  const netMtCo2eAvoided = Number((baseEval.netMtCo2e - targetEval.netMtCo2e).toFixed(1));
  const annualDollarSavingsUsd = Math.round(baseEval.annualCostUsd - targetEval.annualCostUsd);

  // EPA Greenhouse Gas Equivalencies Calculator: 1 passenger car ~ 4.6 MTCO2e/year
  const carsOffRoadEquivalent = Math.max(0, Math.round(netMtCo2eAvoided / 4.6));

  // Rescued edible food delta -> meals/year (1000 kg/metric ton * 1.84 meals/kg)
  const edibleDeltaTons = Math.max(
    0,
    targetEval.divertedTonsByStream[0] - baseEval.divertedTonsByStream[0]
  );
  const mealsEquivalentPerYear = Math.round(edibleDeltaTons * 1000 * 1.84);

  const streams: StreamImpactRow[] = EPA_WARM_V16_STREAMS.map((spec, idx) => {
    const tonsTotal = Number((totalAnnualTons * (spec.defaultSharePct / 100)).toFixed(1));
    const bCo2 = Number(baseEval.co2eByStream[idx].toFixed(1));
    const tCo2 = Number(targetEval.co2eByStream[idx].toFixed(1));
    return {
      id: spec.id,
      name: spec.name,
      sharePct: spec.defaultSharePct,
      tonsTotal,
      tonsDivertedBaseline: Number(baseEval.divertedTonsByStream[idx].toFixed(1)),
      tonsDivertedTarget: Number(targetEval.divertedTonsByStream[idx].toFixed(1)),
      baselineMtCo2e: bCo2,
      targetMtCo2e: tCo2,
      netMtCo2eSaved: Number((bCo2 - tCo2).toFixed(1)),
      warmRecycleOrDivertFactor: Number((spec.divertFactorShortTon * SHORT_TO_METRIC).toFixed(2)),
      warmLandfillFactor: Number((spec.landfillFactorShortTon * SHORT_TO_METRIC).toFixed(2)),
    };
  });

  // Contamination Tipping-Point Curve from 0% to 35% in 2.5% steps
  const tippingCurve: TippingPointSample[] = [];
  for (let c = 0; c <= 35; c += 2.5) {
    const pt = evaluateScenarioPoint(input, c, true);
    tippingCurve.push({
      contaminationPct: c,
      loadRejectionProbPct: Number((pt.rejectionProb * 100).toFixed(1)),
      annualCostUsd: Math.round(pt.annualCostUsd),
      annualNetMtCo2e: Number(pt.netMtCo2e.toFixed(1)),
      effectiveDiversionPct: Number(pt.diversionEffectivePct.toFixed(1)),
    });
  }

  // Seeded Monte Carlo Uncertainty Engine
  const rng = mulberry32(input.monteCarloSeed || 20261221);
  const co2Samples: number[] = [];
  const costSamples: number[] = [];
  const tonsSamples: number[] = [];

  for (let i = 0; i < mcTrials; i++) {
    const volMult = Math.max(0.65, gaussianSample(rng, 1.0, 0.11));
    const methaneMult = Math.max(0.6, gaussianSample(rng, 1.0, 0.14));
    const captureMult = Math.max(0.7, gaussianSample(rng, 1.0, 0.08));
    const baseContam = Math.max(
      2,
      Math.min(45, gaussianSample(rng, input.baselineContaminationPct, 3.0))
    );
    const targetContam = Math.max(
      1,
      Math.min(30, gaussianSample(rng, input.targetContaminationPct, 1.8))
    );

    const bRun = evaluateScenarioPoint(input, baseContam, false, volMult, methaneMult, 1);
    const tRun = evaluateScenarioPoint(input, targetContam, true, volMult, methaneMult, captureMult);

    co2Samples.push(bRun.netMtCo2e - tRun.netMtCo2e);
    costSamples.push(bRun.annualCostUsd - tRun.annualCostUsd);
    tonsSamples.push(
      ((tRun.diversionEffectivePct - bRun.diversionEffectivePct) / 100) *
        totalAnnualTons *
        volMult
    );
  }

  co2Samples.sort((a, b) => a - b);
  costSamples.sort((a, b) => a - b);
  tonsSamples.sort((a, b) => a - b);

  const monteCarlo: MonteCarloSummary = {
    trials: mcTrials,
    mtCo2eSaved: {
      p10: percentile(co2Samples, 10),
      p50: percentile(co2Samples, 50),
      p90: percentile(co2Samples, 90),
    },
    annualSavingsUsd: {
      p10: Math.round(percentile(costSamples, 10)),
      p50: Math.round(percentile(costSamples, 50)),
      p90: Math.round(percentile(costSamples, 90)),
    },
    tonsDivertedDelta: {
      p10: percentile(tonsSamples, 10),
      p50: percentile(tonsSamples, 50),
      p90: percentile(tonsSamples, 90),
    },
  };

  return {
    totalAnnualTons: Number(totalAnnualTons.toFixed(1)),
    baselineDiversionPct: Number(baseEval.diversionRawPct.toFixed(1)),
    targetDiversionPct: Number(targetEval.diversionRawPct.toFixed(1)),
    baselineEffectiveDiversionPct: Number(baseEval.diversionEffectivePct.toFixed(1)),
    targetEffectiveDiversionPct: Number(targetEval.diversionEffectivePct.toFixed(1)),
    baselineRejectionRiskPct: Number((baseEval.rejectionProb * 100).toFixed(1)),
    targetRejectionRiskPct: Number((targetEval.rejectionProb * 100).toFixed(1)),
    baselineAnnualCostUsd: Math.round(baseEval.annualCostUsd),
    targetAnnualCostUsd: Math.round(targetEval.annualCostUsd),
    annualDollarSavingsUsd,
    baselineMtCo2e: Number(baseEval.netMtCo2e.toFixed(1)),
    targetMtCo2e: Number(targetEval.netMtCo2e.toFixed(1)),
    netMtCo2eAvoided,
    carsOffRoadEquivalent,
    mealsEquivalentPerYear,
    streams,
    tippingCurve,
    monteCarlo,
  };
}
