import { describe, expect, it } from 'vitest';
import {
  computeMrfRejectionProb,
  DEFAULT_WARM_INPUT,
  EPA_WARM_V16_STREAMS,
  runWarmSimulation,
} from '../engine/warmEngine';

describe('EPA WARM v16 Lifecycle GHG & MRF Contamination Engine', () => {
  it('stream shares sum strictly to 100%', () => {
    const totalShare = EPA_WARM_V16_STREAMS.reduce((s, r) => s + r.defaultSharePct, 0);
    expect(totalShare).toBe(100);
  });

  it('models logistic MRF rejection probability monotonically increasing across threshold', () => {
    const low = computeMrfRejectionProb(5, 12);
    const mid = computeMrfRejectionProb(15, 12);
    const high = computeMrfRejectionProb(28, 12);
    expect(low).toBeLessThan(0.15);
    expect(mid).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(0.85);
  });

  it('produces positive GHG and budget savings with deterministic ordered Monte Carlo quantiles', () => {
    const r1 = runWarmSimulation(DEFAULT_WARM_INPUT, 500);
    const r2 = runWarmSimulation(DEFAULT_WARM_INPUT, 500);

    // Deterministic given fixed seed
    expect(r1.monteCarlo).toEqual(r2.monteCarlo);

    expect(r1.netMtCo2eAvoided).toBeGreaterThan(500);
    expect(r1.annualDollarSavingsUsd).toBeGreaterThan(15000);
    expect(r1.targetEffectiveDiversionPct).toBeGreaterThan(r1.baselineEffectiveDiversionPct);
    expect(r1.targetRejectionRiskPct).toBeLessThan(r1.baselineRejectionRiskPct);

    // Strictly ordered P10 <= P50 <= P90
    expect(r1.monteCarlo.mtCo2eSaved.p10).toBeLessThanOrEqual(r1.monteCarlo.mtCo2eSaved.p50);
    expect(r1.monteCarlo.mtCo2eSaved.p50).toBeLessThanOrEqual(r1.monteCarlo.mtCo2eSaved.p90);
    expect(r1.monteCarlo.annualSavingsUsd.p10).toBeLessThanOrEqual(r1.monteCarlo.annualSavingsUsd.p50);
    expect(r1.monteCarlo.annualSavingsUsd.p50).toBeLessThanOrEqual(r1.monteCarlo.annualSavingsUsd.p90);
  });
});
