import { describe, expect, it } from 'vitest';
import { compareVRPSolutions, VRP_PRESETS } from '../engine/vrpSolver';

describe('Perishability-Aware Food Rescue CVRPTW-P Solver', () => {
  it('outperforms or matches naive dispatch across all 3 scenarios with positive CO2e savings', () => {
    for (const preset of VRP_PRESETS) {
      const cmp = compareVRPSolutions(preset.donors, preset.recipients, preset.fleet);

      expect(cmp.optimized.totalRescuedKg).toBeGreaterThanOrEqual(cmp.baseline.totalRescuedKg);
      expect(cmp.optimized.totalSpoiledKg).toBeLessThanOrEqual(cmp.baseline.totalSpoiledKg + 0.1);
      expect(cmp.optimized.netCo2eAvoidedKg).toBeGreaterThan(100);
      expect(cmp.optimized.mealsRescued).toBeGreaterThan(100);

      // Verify vehicle cargo never exceeds configured capacity
      for (const route of cmp.optimized.routes) {
        for (const stop of route.stops) {
          expect(stop.loadAfterKg).toBeLessThanOrEqual(preset.fleet.vehicleCapacityKg + 0.01);
        }
      }
    }
  });

  it('meaningfully increases rescued meals in the high-perishability rush preset', () => {
    const crisis = VRP_PRESETS.find((p) => p.id === 'crisis-hot-window')!;
    const cmp = compareVRPSolutions(crisis.donors, crisis.recipients, crisis.fleet);
    expect(cmp.optimized.totalRescuedKg).toBeGreaterThan(cmp.baseline.totalRescuedKg);
    expect(cmp.deltaMeals).toBeGreaterThan(0);
  });

  it('reduces spoilage when refrigerated cold-chain vans are enabled', () => {
    const campus = VRP_PRESETS[0];
    const ambient = compareVRPSolutions(campus.donors, campus.recipients, {
      ...campus.fleet,
      refrigerated: false,
    });
    const chilled = compareVRPSolutions(campus.donors, campus.recipients, {
      ...campus.fleet,
      refrigerated: true,
    });

    expect(chilled.optimized.avgFreshnessPct).toBeGreaterThan(ambient.optimized.avgFreshnessPct);
    expect(chilled.optimized.totalRescuedKg).toBeGreaterThanOrEqual(ambient.optimized.totalRescuedKg);
  });
});
