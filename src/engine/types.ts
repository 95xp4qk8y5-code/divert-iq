export type BinCategory = 'recycle' | 'compost' | 'landfill' | 'hazardous' | 'dropoff';

export type MaterialClass =
  | 'aluminum'
  | 'pet_clear'
  | 'hdpe_opaque'
  | 'cardboard'
  | 'paper'
  | 'glass'
  | 'organics'
  | 'contaminated_film';

export type MunicipalityId = 'sf' | 'nyc' | 'seattle' | 'austin' | 'beijing' | 'tokyo';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface MunicipalityProfile {
  id: MunicipalityId;
  name: string;
  region: string;
  agency: string;
  mrfThresholdPct: number;
  binLabels: Record<BinCategory, string>;
  notes: string;
}

export interface CityOverride {
  bin: BinCategory;
  note?: string;
}

export interface WasteItemRule {
  id: string;
  name: string;
  materialClass: MaterialClass;
  resinOrCode: string;
  defaultBin: BinCategory;
  avgWeightKg: number;
  co2eSavedKg: number;
  wishCyclingRisk: RiskLevel;
  prepSteps: string;
  mrfImpactNote: string;
  keywords: string[];
  cityOverrides?: Partial<Record<MunicipalityId, CityOverride>>;
}

export interface ResolvedWasteRule {
  item: WasteItemRule;
  city: MunicipalityProfile;
  bin: BinCategory;
  binLabel: string;
  citySpecificNote: string | null;
}

export interface CVFeatures {
  meanL: number;
  meanA: number;
  meanB: number;
  meanSat: number;
  meanVal: number;
  edgeDensity: number;
  luminanceEntropy: number;
  specularRatio: number;
  warmBrownRatio: number;
  organicChromaRatio: number;
  colorVariance: number;
  darkSpotRatio: number;
}

export interface CVPrediction {
  materialClass: MaterialClass;
  label: string;
  probability: number;
  representativeItemId: string;
}

export interface FeatureAttribution {
  name: string;
  valueLabel: string;
  normalized: number;
  interpretation: string;
}

export interface CVClassificationResult {
  topClass: MaterialClass;
  topLabel: string;
  confidence: number;
  uncertain: boolean;
  representativeItemId: string;
  predictions: CVPrediction[];
  features: CVFeatures;
  attributions: FeatureAttribution[];
  boundingBox: { x: number; y: number; width: number; height: number };
  inferenceMs: number;
  pixelCount: number;
}

export interface TestSpecimen {
  id: string;
  label: string;
  subtitle: string;
  expectedClass: MaterialClass;
  linkedItemId: string;
  badge: string;
}

export type FoodPerishabilityType =
  | 'hot_prepared'
  | 'chilled_produce'
  | 'dairy_deli'
  | 'bakery_dry';

export interface FoodDonorNode {
  id: string;
  name: string;
  x: number; // km east of origin
  y: number; // km north of origin
  surplusKg: number;
  foodType: FoodPerishabilityType;
  readyMin: number; // minutes from shift start (e.g. 0 = 14:00)
  expiryMin: number; // food-safety hard deadline in minutes
  decayRatePerHour: number; // exponential quality loss constant k (1/hr)
}

export interface RecipientHub {
  id: string;
  name: string;
  x: number;
  y: number;
  capacityKg: number;
  isCompostFallback?: boolean;
}

export interface FleetConfig {
  vehicleCount: number;
  vehicleCapacityKg: number;
  avgSpeedKmh: number;
  serviceTimeMin: number;
  refrigerated: boolean;
  depotX: number;
  depotY: number;
}

export interface RouteStop {
  nodeId: string;
  nodeName: string;
  kind: 'depot' | 'donor' | 'recipient';
  x: number;
  y: number;
  arrivalMin: number;
  departureMin: number;
  loadDeltaKg: number;
  loadAfterKg: number;
  freshnessPct: number;
  spoiledKg: number;
  rescuedKg: number;
  expiryMin?: number;
}

export interface VehicleRoute {
  vehicleId: number;
  color: string;
  stops: RouteStop[];
  distanceKm: number;
  rescuedKg: number;
  spoiledKg: number;
  avgFreshnessPct: number;
  durationMin: number;
}

export interface VRPSolution {
  algorithm: string;
  routes: VehicleRoute[];
  unservedDonorIds: string[];
  totalDistanceKm: number;
  totalSurplusKg: number;
  totalRescuedKg: number;
  totalSpoiledKg: number;
  rescueRatePct: number;
  mealsRescued: number;
  avgFreshnessPct: number;
  grossCo2eAvoidedKg: number;
  transportCo2eKg: number;
  netCo2eAvoidedKg: number;
  solveTimeMs: number;
}

export interface VRPComparisonResult {
  baseline: VRPSolution;
  optimized: VRPSolution;
  deltaRescuedKg: number;
  deltaMeals: number;
  deltaDistanceKm: number;
  deltaNetCo2eKg: number;
  spoilageReductionPct: number;
}

export interface VRPPreset {
  id: string;
  name: string;
  description: string;
  donors: FoodDonorNode[];
  recipients: RecipientHub[];
  fleet: FleetConfig;
}

export interface WarmScenarioInput {
  facilityCount: number; // e.g., 1 to 50 schools/buildings
  annualWasteTonsPerFacility: number; // metric tons/year per facility
  baselineContaminationPct: number; // e.g., 24%
  targetContaminationPct: number; // e.g., 7%
  mrfRejectionThresholdPct: number; // e.g., 12%
  foodRescueCapturePct: number; // % of edible surplus food donated
  compostAdoptionPct: number; // % of non-edible organics composted
  recyclingParticipationPct: number; // % of recyclables captured in blue bin
  landfillTippingFeePerTon: number; // USD / metric ton
  contaminationSurchargePerTon: number; // USD / metric ton penalty above threshold
  monteCarloSeed: number;
}

export interface StreamImpactRow {
  id: string;
  name: string;
  sharePct: number;
  tonsTotal: number;
  tonsDivertedBaseline: number;
  tonsDivertedTarget: number;
  baselineMtCo2e: number;
  targetMtCo2e: number;
  netMtCo2eSaved: number;
  warmRecycleOrDivertFactor: number;
  warmLandfillFactor: number;
}

export interface TippingPointSample {
  contaminationPct: number;
  loadRejectionProbPct: number;
  annualCostUsd: number;
  annualNetMtCo2e: number;
  effectiveDiversionPct: number;
}

export interface MonteCarloSummary {
  trials: number;
  mtCo2eSaved: { p10: number; p50: number; p90: number };
  annualSavingsUsd: { p10: number; p50: number; p90: number };
  tonsDivertedDelta: { p10: number; p50: number; p90: number };
}

export interface WarmSimulationResult {
  totalAnnualTons: number;
  baselineDiversionPct: number;
  targetDiversionPct: number;
  baselineEffectiveDiversionPct: number;
  targetEffectiveDiversionPct: number;
  baselineRejectionRiskPct: number;
  targetRejectionRiskPct: number;
  baselineAnnualCostUsd: number;
  targetAnnualCostUsd: number;
  annualDollarSavingsUsd: number;
  baselineMtCo2e: number;
  targetMtCo2e: number;
  netMtCo2eAvoided: number;
  carsOffRoadEquivalent: number;
  mealsEquivalentPerYear: number;
  streams: StreamImpactRow[];
  tippingCurve: TippingPointSample[];
  monteCarlo: MonteCarloSummary;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  source: 'vision_scan' | 'rule_lookup' | 'food_dispatch' | 'manual_audit';
  municipalityId: MunicipalityId;
  itemName: string;
  binAssigned: BinCategory;
  weightKg: number;
  co2eSavedKg: number;
  contaminationPrevented: boolean;
  notes: string;
}

export interface DailyTrendPoint {
  dayLabel: string;
  contaminationPct: number;
  diversionPct: number;
  rescuedMeals: number;
}
