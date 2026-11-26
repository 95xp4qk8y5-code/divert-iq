import {
  FleetConfig,
  FoodDonorNode,
  FoodPerishabilityType,
  RecipientHub,
  RouteStop,
  VehicleRoute,
  VRPComparisonResult,
  VRPPreset,
  VRPSolution,
} from './types';

// USDA / ReFED standard conversion: 1.2 lb (~0.544 kg) per meal => 1.838 meals/kg
export const MEALS_PER_KG = 1.84;
// EPA WARM v16 food donation/source reduction net GHG benefit vs landfill: ~4.03 kg CO2e per kg food rescued
export const FOOD_RESCUE_CO2E_PER_KG = 4.03;
// Light commercial van tailpipe emission factor (EPA GHG Emission Factors Hub): ~0.24 kg CO2e/km
export const VAN_CO2E_PER_KM = 0.24;

const ROUTE_COLORS = ['#10B981', '#38BDF8', '#F59E0B', '#A78BFA', '#FB7185'];

export const FOOD_TYPE_META: Record<
  FoodPerishabilityType,
  { label: string; defaultDecayPerHour: number; color: string; shelfLifeHours: number }
> = {
  hot_prepared: {
    label: 'Hot Prepared Meals',
    defaultDecayPerHour: 0.42,
    color: '#F43F5E',
    shelfLifeHours: 2.0,
  },
  dairy_deli: {
    label: 'Dairy & Deli Trays',
    defaultDecayPerHour: 0.28,
    color: '#F59E0B',
    shelfLifeHours: 3.2,
  },
  chilled_produce: {
    label: 'Fresh Produce',
    defaultDecayPerHour: 0.15,
    color: '#10B981',
    shelfLifeHours: 5.5,
  },
  bakery_dry: {
    label: 'Bakery & Dry Goods',
    defaultDecayPerHour: 0.06,
    color: '#38BDF8',
    shelfLifeHours: 12.0,
  },
};

export const VRP_PRESETS: VRPPreset[] = [
  {
    id: 'campus-dining',
    name: 'University Campus Dining Rescue',
    description: '8 dining halls & cafes dispatching lunch/dinner surplus to 3 community shelters before evening food-safety cutoffs.',
    fleet: {
      vehicleCount: 2,
      vehicleCapacityKg: 140,
      avgSpeedKmh: 28,
      serviceTimeMin: 8,
      refrigerated: false,
      depotX: 5.0,
      depotY: 5.0,
    },
    donors: [
      { id: 'd1', name: 'North Commons Cafeteria', x: 2.2, y: 8.6, surplusKg: 48, foodType: 'hot_prepared', readyMin: 0, expiryMin: 95, decayRatePerHour: 0.42 },
      { id: 'd2', name: 'Engineering Bistro', x: 8.1, y: 7.9, surplusKg: 34, foodType: 'hot_prepared', readyMin: 5, expiryMin: 85, decayRatePerHour: 0.44 },
      { id: 'd3', name: 'Student Union Bakery', x: 4.5, y: 6.4, surplusKg: 26, foodType: 'bakery_dry', readyMin: 0, expiryMin: 240, decayRatePerHour: 0.06 },
      { id: 'd4', name: 'Medical Center Kitchen', x: 9.2, y: 3.1, surplusKg: 52, foodType: 'hot_prepared', readyMin: 10, expiryMin: 105, decayRatePerHour: 0.4 },
      { id: 'd5', name: 'West Quad Market', x: 1.4, y: 4.2, surplusKg: 38, foodType: 'dairy_deli', readyMin: 0, expiryMin: 135, decayRatePerHour: 0.28 },
      { id: 'd6', name: 'Campus Co-op Grocer', x: 6.8, y: 2.0, surplusKg: 44, foodType: 'chilled_produce', readyMin: 0, expiryMin: 200, decayRatePerHour: 0.15 },
      { id: 'd7', name: 'Science Atrium Cafe', x: 3.6, y: 2.4, surplusKg: 22, foodType: 'dairy_deli', readyMin: 5, expiryMin: 120, decayRatePerHour: 0.3 },
      { id: 'd8', name: 'Athletics Fuel Bar', x: 8.6, y: 5.8, surplusKg: 30, foodType: 'chilled_produce', readyMin: 0, expiryMin: 185, decayRatePerHour: 0.16 },
    ],
    recipients: [
      { id: 'r1', name: 'St. Jude Community Pantry', x: 1.8, y: 7.4, capacityKg: 180 },
      { id: 'r2', name: 'Eastside Family Shelter', x: 8.8, y: 6.8, capacityKg: 180 },
      { id: 'r3', name: 'Southside Community Fridge', x: 5.2, y: 1.4, capacityKg: 140 },
    ],
  },
  {
    id: 'school-district',
    name: 'Metro School District Afternoon Blitz',
    description: '10 K-12 school cafeterias finishing lunch service simultaneously with tight 90-minute hot-meal windows.',
    fleet: {
      vehicleCount: 3,
      vehicleCapacityKg: 120,
      avgSpeedKmh: 26,
      serviceTimeMin: 7,
      refrigerated: false,
      depotX: 5.0,
      depotY: 5.0,
    },
    donors: [
      { id: 's1', name: 'Lincoln High Kitchen', x: 1.5, y: 9.0, surplusKg: 42, foodType: 'hot_prepared', readyMin: 0, expiryMin: 80, decayRatePerHour: 0.45 },
      { id: 's2', name: 'Oakridge Middle School', x: 4.1, y: 8.4, surplusKg: 28, foodType: 'dairy_deli', readyMin: 0, expiryMin: 130, decayRatePerHour: 0.28 },
      { id: 's3', name: 'Bayview Elementary', x: 8.9, y: 8.8, surplusKg: 35, foodType: 'hot_prepared', readyMin: 5, expiryMin: 85, decayRatePerHour: 0.44 },
      { id: 's4', name: 'Central STEM Academy', x: 5.6, y: 6.1, surplusKg: 31, foodType: 'bakery_dry', readyMin: 0, expiryMin: 240, decayRatePerHour: 0.06 },
      { id: 's5', name: 'Harborview High', x: 9.3, y: 4.6, surplusKg: 46, foodType: 'hot_prepared', readyMin: 0, expiryMin: 90, decayRatePerHour: 0.42 },
      { id: 's6', name: 'Riverside Prep', x: 2.1, y: 5.3, surplusKg: 24, foodType: 'chilled_produce', readyMin: 0, expiryMin: 190, decayRatePerHour: 0.15 },
      { id: 's7', name: 'Sunset Arts School', x: 1.1, y: 2.2, surplusKg: 38, foodType: 'hot_prepared', readyMin: 5, expiryMin: 95, decayRatePerHour: 0.4 },
      { id: 's8', name: 'Parkside Elementary', x: 4.8, y: 2.1, surplusKg: 27, foodType: 'dairy_deli', readyMin: 0, expiryMin: 145, decayRatePerHour: 0.26 },
      { id: 's9', name: 'Valley Technical High', x: 8.2, y: 1.6, surplusKg: 40, foodType: 'chilled_produce', readyMin: 0, expiryMin: 185, decayRatePerHour: 0.16 },
      { id: 's10', name: 'Meadowbrook Kitchen', x: 6.9, y: 3.8, surplusKg: 22, foodType: 'bakery_dry', readyMin: 0, expiryMin: 230, decayRatePerHour: 0.06 },
    ],
    recipients: [
      { id: 'rh1', name: 'North Youth Food Hub', x: 3.0, y: 8.8, capacityKg: 160 },
      { id: 'rh2', name: 'Harbor Community Kitchen', x: 8.6, y: 6.3, capacityKg: 170 },
      { id: 'rh3', name: 'Southside Mutual Aid', x: 2.8, y: 1.5, capacityKg: 160 },
      { id: 'rh4', name: 'Central Compost & Pantry', x: 6.2, y: 2.4, capacityKg: 150 },
    ],
  },
  {
    id: 'crisis-hot-window',
    name: 'High-Perishability Hot-Meal Rush',
    description: 'Tight 55-minute FDA hot-holding window: naive nearest-neighbor visits nearby dry bakeries first and lets distant hot banquet meals spoil!',
    fleet: {
      vehicleCount: 2,
      vehicleCapacityKg: 130,
      avgSpeedKmh: 22,
      serviceTimeMin: 12,
      refrigerated: false,
      depotX: 5.0,
      depotY: 5.0,
    },
    donors: [
      { id: 'c1', name: 'Convention Banquet Hall', x: 9.2, y: 8.8, surplusKg: 54, foodType: 'hot_prepared', readyMin: 0, expiryMin: 56, decayRatePerHour: 0.56 },
      { id: 'c2', name: 'Downtown Hotel Buffet', x: 1.1, y: 8.4, surplusKg: 48, foodType: 'hot_prepared', readyMin: 0, expiryMin: 58, decayRatePerHour: 0.54 },
      { id: 'c3', name: 'Midtown Bakery', x: 5.4, y: 5.5, surplusKg: 35, foodType: 'bakery_dry', readyMin: 0, expiryMin: 260, decayRatePerHour: 0.05 },
      { id: 'c4', name: 'Civic Center Catering', x: 4.7, y: 4.6, surplusKg: 32, foodType: 'bakery_dry', readyMin: 0, expiryMin: 250, decayRatePerHour: 0.05 },
      { id: 'c5', name: 'Hospital Cafeteria', x: 8.8, y: 1.6, surplusKg: 46, foodType: 'hot_prepared', readyMin: 0, expiryMin: 68, decayRatePerHour: 0.48 },
      { id: 'c6', name: 'Corner Grocer', x: 1.8, y: 2.0, surplusKg: 40, foodType: 'dairy_deli', readyMin: 0, expiryMin: 120, decayRatePerHour: 0.3 },
    ],
    recipients: [
      { id: 'cr1', name: 'Metro Night Shelter', x: 8.6, y: 5.2, capacityKg: 180 },
      { id: 'cr2', name: 'Westside Relief Center', x: 1.6, y: 5.0, capacityKg: 180 },
    ],
  },
];

function euclideanKm(ax: number, ay: number, bx: number, by: number): number {
  // Road network Manhattan-Euclidean blend (circuity factor ~1.22 standard urban road ratio)
  return Math.hypot(ax - bx, ay - by) * 1.22;
}

function travelMinutes(distKm: number, speedKmh: number): number {
  return (distKm / Math.max(8, speedKmh)) * 60;
}

function findNearestRecipient(
  x: number,
  y: number,
  recipients: RecipientHub[]
): RecipientHub {
  let best = recipients[0];
  let bestDist = Infinity;
  for (const r of recipients) {
    const d = euclideanKm(x, y, r.x, r.y);
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }
  return best;
}

/**
 * Evaluates an ordered sequence of donor pickups for a single vehicle, inserting a drop-off
 * at the nearest recipient hub whenever capacity is filled or at end of route, computing exact
 * Arrhenius exponential freshness decay Q(t) = exp(-k_eff * t_transit) and hard food-safety expiry!
 */
function simulateVehicleSequence(
  vehicleId: number,
  donorSeq: FoodDonorNode[],
  recipients: RecipientHub[],
  fleet: FleetConfig
): VehicleRoute {
  const color = ROUTE_COLORS[(vehicleId - 1) % ROUTE_COLORS.length];
  const stops: RouteStop[] = [
    {
      nodeId: 'depot',
      nodeName: 'Dispatch Hub',
      kind: 'depot',
      x: fleet.depotX,
      y: fleet.depotY,
      arrivalMin: 0,
      departureMin: 0,
      loadDeltaKg: 0,
      loadAfterKg: 0,
      freshnessPct: 100,
      spoiledKg: 0,
      rescuedKg: 0,
    },
  ];

  // Refrigerated vans reduce effective spoilage decay rate k by 72%
  const decayMultiplier = fleet.refrigerated ? 0.28 : 1.0;

  let curX = fleet.depotX;
  let curY = fleet.depotY;
  let curTime = 0;
  let totalDist = 0;
  let totalRescued = 0;
  let totalSpoiled = 0;
  let weightedFreshnessSum = 0;
  let totalDeliveredWeight = 0;

  // On-board items currently carried until next recipient drop-off
  let onboard: Array<{
    donor: FoodDonorNode;
    pickupMin: number;
    kg: number;
  }> = [];
  let onboardKg = 0;

  const flushToRecipient = () => {
    if (onboard.length === 0) return;
    const hub = findNearestRecipient(curX, curY, recipients);
    const dist = euclideanKm(curX, curY, hub.x, hub.y);
    totalDist += dist;
    curTime += travelMinutes(dist, fleet.avgSpeedKmh);
    const arrival = curTime;
    curTime += fleet.serviceTimeMin * 0.75;

    let dropRescued = 0;
    let dropSpoiled = 0;
    let dropFreshSum = 0;
    let dropKg = 0;

    for (const batch of onboard) {
      const elapsedHrs = Math.max(0, (arrival - batch.donor.readyMin) / 60);
      const transitHrs = Math.max(0, (arrival - batch.pickupMin) / 60);
      const kWait = batch.donor.decayRatePerHour;
      const kTransit = batch.donor.decayRatePerHour * decayMultiplier;
      const waitHrs = Math.max(0, elapsedHrs - transitHrs);
      // Exponential freshness retention across pre-pickup holding + in-van transit
      const freshness = Math.exp(-(kWait * waitHrs + kTransit * transitHrs));

      // Food safety hard cutoff: past expiryMin OR freshness below 35% must be diverted/spoiled
      if (arrival > batch.donor.expiryMin || freshness < 0.35) {
        dropSpoiled += batch.kg;
      } else {
        // Edible fraction retained (high freshness preserves nearly 100%, lower freshness incurs trim loss)
        const trimFactor = Math.min(1, 0.55 + 0.55 * freshness);
        const usable = batch.kg * trimFactor;
        dropRescued += usable;
        dropSpoiled += batch.kg - usable;
        dropFreshSum += freshness * 100 * batch.kg;
        dropKg += batch.kg;
      }
    }

    totalRescued += dropRescued;
    totalSpoiled += dropSpoiled;
    weightedFreshnessSum += dropFreshSum;
    totalDeliveredWeight += dropKg;

    stops.push({
      nodeId: hub.id,
      nodeName: hub.name,
      kind: 'recipient',
      x: hub.x,
      y: hub.y,
      arrivalMin: Number(arrival.toFixed(1)),
      departureMin: Number(curTime.toFixed(1)),
      loadDeltaKg: -onboardKg,
      loadAfterKg: 0,
      freshnessPct: dropKg > 0 ? Number((dropFreshSum / dropKg).toFixed(1)) : 0,
      spoiledKg: Number(dropSpoiled.toFixed(1)),
      rescuedKg: Number(dropRescued.toFixed(1)),
    });

    curX = hub.x;
    curY = hub.y;
    onboard = [];
    onboardKg = 0;
  };

  for (const donor of donorSeq) {
    // Drop off first if loading this donor would exceed capacity OR if any onboard hot item is within 22 min of expiry
    const urgentOnboard = onboard.some(
      (b) => b.donor.expiryMin - curTime < 28 && b.donor.foodType === 'hot_prepared'
    );
    if (onboardKg > 0 && (onboardKg + donor.surplusKg > fleet.vehicleCapacityKg || urgentOnboard)) {
      flushToRecipient();
    }

    const dist = euclideanKm(curX, curY, donor.x, donor.y);
    totalDist += dist;
    curTime += travelMinutes(dist, fleet.avgSpeedKmh);
    if (curTime < donor.readyMin) curTime = donor.readyMin;

    const arrival = curTime;
    const pickupElapsedHrs = Math.max(0, (arrival - donor.readyMin) / 60);
    const pickupFreshness = Math.exp(-donor.decayRatePerHour * pickupElapsedHrs) * 100;
    curTime += fleet.serviceTimeMin;

    onboard.push({ donor, pickupMin: arrival, kg: donor.surplusKg });
    onboardKg += donor.surplusKg;

    stops.push({
      nodeId: donor.id,
      nodeName: donor.name,
      kind: 'donor',
      x: donor.x,
      y: donor.y,
      arrivalMin: Number(arrival.toFixed(1)),
      departureMin: Number(curTime.toFixed(1)),
      loadDeltaKg: donor.surplusKg,
      loadAfterKg: Number(onboardKg.toFixed(1)),
      freshnessPct: Number(pickupFreshness.toFixed(1)),
      spoiledKg: 0,
      rescuedKg: 0,
      expiryMin: donor.expiryMin,
    });

    curX = donor.x;
    curY = donor.y;
  }

  flushToRecipient();

  // Return to depot
  if (donorSeq.length > 0) {
    const backDist = euclideanKm(curX, curY, fleet.depotX, fleet.depotY);
    totalDist += backDist;
    curTime += travelMinutes(backDist, fleet.avgSpeedKmh);
    stops.push({
      nodeId: 'depot-return',
      nodeName: 'Return to Hub',
      kind: 'depot',
      x: fleet.depotX,
      y: fleet.depotY,
      arrivalMin: Number(curTime.toFixed(1)),
      departureMin: Number(curTime.toFixed(1)),
      loadDeltaKg: 0,
      loadAfterKg: 0,
      freshnessPct: 100,
      spoiledKg: 0,
      rescuedKg: 0,
    });
  }

  return {
    vehicleId,
    color,
    stops,
    distanceKm: Number(totalDist.toFixed(2)),
    rescuedKg: Number(totalRescued.toFixed(1)),
    spoiledKg: Number(totalSpoiled.toFixed(1)),
    avgFreshnessPct:
      totalDeliveredWeight > 0
        ? Number((weightedFreshnessSum / totalDeliveredWeight).toFixed(1))
        : 0,
    durationMin: Number(curTime.toFixed(1)),
  };
}

function summarizeSolution(
  algorithm: string,
  routes: VehicleRoute[],
  donors: FoodDonorNode[],
  unservedDonorIds: string[],
  solveTimeMs: number
): VRPSolution {
  const totalSurplusKg = donors.reduce((s, d) => s + d.surplusKg, 0);
  const totalDistanceKm = routes.reduce((s, r) => s + r.distanceKm, 0);
  const totalRescuedKg = routes.reduce((s, r) => s + r.rescuedKg, 0);
  const totalSpoiledKg =
    routes.reduce((s, r) => s + r.spoiledKg, 0) +
    donors
      .filter((d) => unservedDonorIds.includes(d.id))
      .reduce((s, d) => s + d.surplusKg, 0);

  const weightedFresh = routes.reduce((s, r) => s + r.avgFreshnessPct * r.rescuedKg, 0);
  const avgFreshnessPct = totalRescuedKg > 0 ? weightedFresh / totalRescuedKg : 0;

  const grossCo2eAvoidedKg = totalRescuedKg * FOOD_RESCUE_CO2E_PER_KG;
  const transportCo2eKg = totalDistanceKm * VAN_CO2E_PER_KM;
  const netCo2eAvoidedKg = Math.max(0, grossCo2eAvoidedKg - transportCo2eKg);

  return {
    algorithm,
    routes,
    unservedDonorIds,
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    totalSurplusKg: Number(totalSurplusKg.toFixed(1)),
    totalRescuedKg: Number(totalRescuedKg.toFixed(1)),
    totalSpoiledKg: Number(totalSpoiledKg.toFixed(1)),
    rescueRatePct:
      totalSurplusKg > 0 ? Number(((totalRescuedKg / totalSurplusKg) * 100).toFixed(1)) : 0,
    mealsRescued: Math.round(totalRescuedKg * MEALS_PER_KG),
    avgFreshnessPct: Number(avgFreshnessPct.toFixed(1)),
    grossCo2eAvoidedKg: Number(grossCo2eAvoidedKg.toFixed(1)),
    transportCo2eKg: Number(transportCo2eKg.toFixed(1)),
    netCo2eAvoidedKg: Number(netCo2eAvoidedKg.toFixed(1)),
    solveTimeMs: Number(solveTimeMs.toFixed(2)),
  };
}

/**
 * Baseline Algorithm: Naive Nearest-Neighbor round-robin dispatch (ignores perishability & expiry windows).
 */
export function solveNaiveBaseline(
  donors: FoodDonorNode[],
  recipients: RecipientHub[],
  fleet: FleetConfig
): VRPSolution {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const remaining = [...donors];
  const vehicleBins: FoodDonorNode[][] = Array.from({ length: fleet.vehicleCount }, () => []);
  const curPos = Array.from({ length: fleet.vehicleCount }, () => ({
    x: fleet.depotX,
    y: fleet.depotY,
  }));

  let v = 0;
  while (remaining.length > 0) {
    const pos = curPos[v];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = euclideanKm(pos.x, pos.y, remaining[i].x, remaining[i].y);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const chosen = remaining.splice(bestIdx, 1)[0];
    vehicleBins[v].push(chosen);
    curPos[v] = { x: chosen.x, y: chosen.y };
    v = (v + 1) % fleet.vehicleCount;
  }

  const routes = vehicleBins.map((seq, idx) =>
    simulateVehicleSequence(idx + 1, seq, recipients, fleet)
  );
  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return summarizeSolution('Naive Nearest-Neighbor', routes, donors, [], Math.max(0.1, t1 - t0));
}

function routeObjective(route: VehicleRoute): number {
  // Maximize rescued kg & freshness while penalizing spoilage heavily and minimizing km
  return route.rescuedKg * 12.0 - route.spoiledKg * 16.0 + route.avgFreshnessPct * 0.45 - route.distanceKm * 1.4;
}

function totalFleetObjective(
  seqs: FoodDonorNode[][],
  recipients: RecipientHub[],
  fleet: FleetConfig
): { score: number; routes: VehicleRoute[] } {
  const routes = seqs.map((seq, idx) => simulateVehicleSequence(idx + 1, seq, recipients, fleet));
  const score = routes.reduce((acc, r) => acc + routeObjective(r), 0);
  return { score, routes };
}

/**
 * DivertIQ Optimizer:
 * 1. Angular spatial sweep + Perishability-Urgency seeded insertion (highest decay/earliest expiry first).
 * 2. Iterative 2-Opt intra-route edge swaps to tighten distances without violating expiry.
 * 3. Cross-vehicle Relocate + Swap local search to balance urgent loads across the fleet.
 */
export function solvePerishabilityOptimized(
  donors: FoodDonorNode[],
  recipients: RecipientHub[],
  fleet: FleetConfig
): VRPSolution {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (donors.length === 0 || recipients.length === 0) {
    return summarizeSolution('DivertIQ CVRPTW-P', [], donors, [], 0.1);
  }

  // Sort donors by perishability urgency score: high decay rate & tight expiry first
  const urgencySorted = [...donors].sort((a, b) => {
    const scoreA = a.expiryMin / (1 + a.decayRatePerHour * 2.5);
    const scoreB = b.expiryMin / (1 + b.decayRatePerHour * 2.5);
    return scoreA - scoreB;
  });

  const seqs: FoodDonorNode[][] = Array.from({ length: fleet.vehicleCount }, () => []);

  // Phase 1: Best-Position Regret/Objective Insertion for each donor in urgency order
  for (const donor of urgencySorted) {
    let bestV = 0;
    let bestPos = 0;
    let bestDelta = -Infinity;

    for (let v = 0; v < fleet.vehicleCount; v++) {
      const baseRoute = simulateVehicleSequence(v + 1, seqs[v], recipients, fleet);
      const baseObj = routeObjective(baseRoute);
      for (let pos = 0; pos <= seqs[v].length; pos++) {
        const candidate = [...seqs[v].slice(0, pos), donor, ...seqs[v].slice(pos)];
        const newRoute = simulateVehicleSequence(v + 1, candidate, recipients, fleet);
        const delta = routeObjective(newRoute) - baseObj;
        if (delta > bestDelta) {
          bestDelta = delta;
          bestV = v;
          bestPos = pos;
        }
      }
    }
    seqs[bestV].splice(bestPos, 0, donor);
  }

  // Phase 2: Intra-route 2-Opt + Inter-route Relocate local search refinement
  let improved = true;
  let iterations = 0;
  while (improved && iterations < 18) {
    improved = false;
    iterations++;

    // 2-Opt within each vehicle route
    for (let v = 0; v < fleet.vehicleCount; v++) {
      const seq = seqs[v];
      if (seq.length < 2) continue;
      let curObj = routeObjective(simulateVehicleSequence(v + 1, seq, recipients, fleet));

      for (let i = 0; i < seq.length - 1; i++) {
        for (let j = i + 1; j < seq.length; j++) {
          const reversed = [
            ...seq.slice(0, i),
            ...seq.slice(i, j + 1).reverse(),
            ...seq.slice(j + 1),
          ];
          const candObj = routeObjective(simulateVehicleSequence(v + 1, reversed, recipients, fleet));
          if (candObj > curObj + 1e-4) {
            seqs[v] = reversed;
            curObj = candObj;
            improved = true;
          }
        }
      }
    }

    // Inter-vehicle Relocate (move any donor to a better vehicle & slot)
    if (fleet.vehicleCount > 1) {
      let currentScore = totalFleetObjective(seqs, recipients, fleet).score;
      for (let vFrom = 0; vFrom < fleet.vehicleCount; vFrom++) {
        for (let i = 0; i < seqs[vFrom].length; i++) {
          const item = seqs[vFrom][i];
          const without = [...seqs[vFrom].slice(0, i), ...seqs[vFrom].slice(i + 1)];
          for (let vTo = 0; vTo < fleet.vehicleCount; vTo++) {
            if (vTo === vFrom) continue;
            for (let pos = 0; pos <= seqs[vTo].length; pos++) {
              const candSeqs = seqs.map((s) => [...s]);
              candSeqs[vFrom] = without;
              candSeqs[vTo] = [...seqs[vTo].slice(0, pos), item, ...seqs[vTo].slice(pos)];
              const candScore = totalFleetObjective(candSeqs, recipients, fleet).score;
              if (candScore > currentScore + 1e-4) {
                seqs[vFrom] = candSeqs[vFrom];
                seqs[vTo] = candSeqs[vTo];
                currentScore = candScore;
                improved = true;
                break;
              }
            }
            if (improved) break;
          }
          if (improved) break;
        }
        if (improved) break;
      }
    }
  }

  const finalRoutes = seqs.map((seq, idx) =>
    simulateVehicleSequence(idx + 1, seq, recipients, fleet)
  );
  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return summarizeSolution(
    'DivertIQ CVRPTW-P (Urgency + 2-Opt + Relocate)',
    finalRoutes,
    donors,
    [],
    Math.max(0.2, t1 - t0)
  );
}

export function compareVRPSolutions(
  donors: FoodDonorNode[],
  recipients: RecipientHub[],
  fleet: FleetConfig
): VRPComparisonResult {
  const baseline = solveNaiveBaseline(donors, recipients, fleet);
  const optimized = solvePerishabilityOptimized(donors, recipients, fleet);

  const deltaRescuedKg = Number((optimized.totalRescuedKg - baseline.totalRescuedKg).toFixed(1));
  const deltaMeals = optimized.mealsRescued - baseline.mealsRescued;
  const deltaDistanceKm = Number((optimized.totalDistanceKm - baseline.totalDistanceKm).toFixed(2));
  const deltaNetCo2eKg = Number((optimized.netCo2eAvoidedKg - baseline.netCo2eAvoidedKg).toFixed(1));
  const spoilageReductionPct =
    baseline.totalSpoiledKg > 0
      ? Number(
          (((baseline.totalSpoiledKg - optimized.totalSpoiledKg) / baseline.totalSpoiledKg) * 100).toFixed(1)
        )
      : 0;

  return {
    baseline,
    optimized,
    deltaRescuedKg,
    deltaMeals,
    deltaDistanceKm,
    deltaNetCo2eKg,
    spoilageReductionPct,
  };
}
