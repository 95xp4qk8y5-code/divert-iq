import { describe, expect, it } from 'vitest';
import {
  getItemById,
  MUNICIPALITIES,
  resolveItemRule,
  searchWasteItems,
  WASTE_ITEMS,
} from '../engine/municipalRules';

describe('Municipal Waste Rules Matrix', () => {
  it('covers 6 municipalities and 30 distinct real-world items', () => {
    expect(MUNICIPALITIES).toHaveLength(6);
    expect(WASTE_ITEMS.length).toBeGreaterThanOrEqual(30);
    const ids = new Set(WASTE_ITEMS.map((i) => i.id));
    expect(ids.size).toBe(WASTE_ITEMS.length);
  });

  it('applies real city-specific overrides for tricky items', () => {
    const pizza = getItemById('greasy-pizza-box');
    const sfRule = resolveItemRule(pizza, 'sf');
    const bjRule = resolveItemRule(pizza, 'beijing');
    expect(sfRule.bin).toBe('compost');
    expect(bjRule.bin).toBe('landfill');
    expect(bjRule.citySpecificNote).toBeTruthy();

    const coffeeCup = getItemById('coffee-cup-pe');
    expect(resolveItemRule(coffeeCup, 'seattle').bin).toBe('recycle');
    expect(resolveItemRule(coffeeCup, 'nyc').bin).toBe('landfill');
  });

  it('flags critical MRF contamination hazards accurately', () => {
    const bag = getItemById('plastic-grocery-bag');
    const battery = getItemById('lithium-battery');
    const pla = getItemById('pla-compostable-cup');
    expect(bag.wishCyclingRisk).toBe('critical');
    expect(battery.wishCyclingRisk).toBe('critical');
    expect(pla.wishCyclingRisk).toBe('critical');
  });

  it('filters search queries and stream filters correctly', () => {
    const filmMatches = searchWasteItems('film', 'all', 'sf');
    expect(filmMatches.some((m) => m.item.id === 'plastic-grocery-bag')).toBe(true);

    const hazOnly = searchWasteItems('', 'hazardous', 'beijing');
    expect(hazOnly.length).toBeGreaterThanOrEqual(3);
    expect(hazOnly.every((m) => m.bin === 'hazardous')).toBe(true);
  });
});
