import { describe, it, expect } from 'vitest';
import { findCrossovers, winProbability } from '../../src/lib/calculator';
import { PLANS } from '../../src/data/plans';
import type { PlanParams, UserSettings } from '../../src/data/types';

const baseSettings: UserSettings = {
  coverageTier: 'employee',
  oonPercent: 0,
  marginalTaxRate: 0.30,
  personalHsaContribution: 0,
  markedSpend: 3000,
};

// Minimal plan factory for controlled testing
function makePlan(id: string, premium: number, deductible: number, oopMax: number, coinsurance: number, hsaCredit = 0): PlanParams {
  const tiers = { employee: premium, employee_spouse: premium, employee_children: premium, family: premium } as const;
  const deductibles = { employee: deductible, employee_spouse: deductible, employee_children: deductible, family: deductible } as const;
  const oops = { employee: oopMax, employee_spouse: oopMax, employee_children: oopMax, family: oopMax } as const;
  const hsas = { employee: hsaCredit, employee_spouse: hsaCredit, employee_children: hsaCredit, family: hsaCredit } as const;
  return {
    id,
    name: id,
    carrier: 'Test',
    hsaEligible: hsaCredit > 0,
    premiums: tiers,
    employerHsaContribution: hsas,
    inNetwork: { deductible: deductibles, oopMax: oops, coinsuranceRate: coinsurance },
  };
}

describe('findCrossovers', () => {
  it('no crossover when plan1 is always cheaper', () => {
    // plan1: $0 premium, plan2: $100/mo premium, same OOP structure → plan1 always wins
    const plan1 = makePlan('cheap', 0, 1000, 5000, 0.20);
    const plan2 = makePlan('expensive', 100, 1000, 5000, 0.20);
    const result = findCrossovers(plan1, plan2, baseSettings);
    expect(result).toHaveLength(0);
  });

  it('no crossover when plan2 is always cheaper', () => {
    const plan1 = makePlan('expensive', 200, 1000, 5000, 0.20);
    const plan2 = makePlan('cheap', 0, 1000, 5000, 0.20);
    const result = findCrossovers(plan1, plan2, baseSettings);
    expect(result).toHaveLength(0);
  });

  it('finds a crossover: low-premium high-OOP vs high-premium low-OOP', () => {
    // plan1: $0/mo premium, $5000 OOP max, 50% coinsurance
    // plan2: $200/mo premium ($2400/yr), $1000 OOP max, 10% coinsurance
    // At $0 spend: plan1=$0, plan2=$2400 → plan1 cheaper
    // At $25000 spend: plan1=$5000, plan2=$2400+$1000=$3400 → plan1 still cheaper
    // Hmm, plan1 always cheaper here. Let me try different numbers.
    // plan1: $0/mo, $8000 OOP max, 50% coinsurance → at high spend hits $8000
    // plan2: $100/mo ($1200/yr), $2000 OOP max, 10% → hits $2000 OOP at some point, total ~$3200
    // At $0: plan1=$0 wins. At high spend: plan2=$3200 < plan1=$8000, plan2 wins → crossover exists
    const plan1 = makePlan('hdhp', 0, 3000, 8000, 0.50);
    const plan2 = makePlan('hmo', 100, 500, 2000, 0.10);
    const result = findCrossovers(plan1, plan2, baseSettings);
    expect(result.length).toBeGreaterThan(0);
    // At crossover, plan2 becomes cheaper (plan1 goes from cheaper to more expensive)
    const c = result[0];
    expect(c.cheaperAfter).toBe('plan2');
    expect(c.spend).toBeGreaterThan(0);
    expect(c.spend).toBeLessThan(25000);
  });

  it('direction: cheaperAfter reflects which plan wins after the crossover', () => {
    // plan1 starts cheaper, then plan2 takes over at some point
    const plan1 = makePlan('low-premium', 0, 5000, 10000, 0.50);
    const plan2 = makePlan('high-premium', 200, 0, 2000, 0.10);
    const crossovers = findCrossovers(plan1, plan2, baseSettings);
    // plan1 starts cheaper (no premium), plan2 should win at high spend (lower OOP max)
    const firstCross = crossovers.find(c => c.cheaperAfter === 'plan2');
    expect(firstCross).toBeDefined();
  });

  it('HDHP Premium loses to Kaiser HMO in a mid-range band (employee tier, no OON)', () => {
    // At low spend HDHP Premium wins (negative net cost from HSA), at very high spend it also wins
    // (Premium OOP max $3032 < Kaiser max $3094). But Kaiser is cheaper in the middle range
    // because Kaiser has low 8% coinsurance while Premium is in its 10% zone.
    const hdhpPremium = PLANS.find(p => p.id === 'hdhp-premium')!;
    const kaiser = PLANS.find(p => p.id === 'kaiser-hmo')!;
    const crossovers = findCrossovers(hdhpPremium, kaiser, baseSettings);
    // Should have two crossovers: Kaiser takes over, then HDHP Premium retakes
    expect(crossovers).toHaveLength(2);
    expect(crossovers[0].cheaperAfter).toBe('plan2'); // Kaiser becomes cheaper ~$14,600
    expect(crossovers[0].spend).toBeGreaterThan(14000);
    expect(crossovers[0].spend).toBeLessThan(15500);
    expect(crossovers[1].cheaperAfter).toBe('plan1'); // HDHP Premium reclaims ~$21,100
    expect(crossovers[1].spend).toBeGreaterThan(20000);
    expect(crossovers[1].spend).toBeLessThan(22000);
  });

  it('HDHP Premium has no crossover with EPO, PPO, or HDHP Standard (employee tier, no OON)', () => {
    const hdhpPremium = PLANS.find(p => p.id === 'hdhp-premium')!;
    for (const other of PLANS.filter(p => !['hdhp-premium', 'kaiser-hmo'].includes(p.id))) {
      const otherWins = findCrossovers(hdhpPremium, other, baseSettings)
        .filter(c => c.cheaperAfter === 'plan2');
      expect(otherWins).toHaveLength(0);
    }
  });
});

describe('winProbability', () => {
  it('returns 1 when refPlan is always cheapest in range', () => {
    const free = makePlan('free', 0, 0, 100, 0.10);
    const expensive = makePlan('exp', 500, 0, 100, 0.10);
    const prob = winProbability(free, [free, expensive], baseSettings, 0, 10000);
    expect(prob).toBe(1);
  });

  it('returns 0 when refPlan always loses in range', () => {
    const expensive = makePlan('exp', 500, 0, 100, 0.10);
    const free = makePlan('free', 0, 0, 100, 0.10);
    const prob = winProbability(expensive, [expensive, free], baseSettings, 0, 10000);
    expect(prob).toBe(0);
  });

  it('returns ~0.5 when refPlan wins half the range', () => {
    // plan1 (ref): $0 premium, high OOP max → cheap at low spend, expensive at high
    // plan2: $100/mo ($1200/yr), very low OOP max → expensive at low spend, cheap at high
    const plan1 = makePlan('hdhp', 0, 3000, 8000, 0.50);
    const plan2 = makePlan('hmo', 100, 500, 2000, 0.10);
    const crossovers = findCrossovers(plan1, plan2, baseSettings);
    expect(crossovers.length).toBeGreaterThan(0);
    const cross = crossovers[0].spend;
    // range centered on crossover → should be near 50/50
    const prob = winProbability(plan1, [plan1, plan2], baseSettings, 0, cross * 2);
    expect(prob).toBeGreaterThan(0.4);
    expect(prob).toBeLessThan(0.6);
  });

  it('loSpend === hiSpend returns 1 if refPlan wins at that point', () => {
    const free = makePlan('free', 0, 0, 1000, 0.10);
    const expensive = makePlan('exp', 200, 0, 1000, 0.10);
    expect(winProbability(free, [free, expensive], baseSettings, 5000, 5000)).toBe(1);
    expect(winProbability(expensive, [free, expensive], baseSettings, 5000, 5000)).toBe(0);
  });

  it('HDHP Premium wins ~74% at employee tier, no OON, full $0-$25k range (Kaiser wins in mid-range)', () => {
    // Kaiser HMO is cheaper from ~$14,600 to ~$21,100 — about 26% of the range
    const hdhpPremium = PLANS.find(p => p.id === 'hdhp-premium')!;
    const prob = winProbability(hdhpPremium, PLANS, baseSettings, 0, 25000);
    expect(prob).toBeGreaterThan(0.70);
    expect(prob).toBeLessThan(0.80);
  });

  it('HDHP Premium wins 100% at low spend (below Kaiser crossover)', () => {
    const hdhpPremium = PLANS.find(p => p.id === 'hdhp-premium')!;
    const prob = winProbability(hdhpPremium, PLANS, baseSettings, 0, 14000);
    expect(prob).toBe(1);
  });

  it('HDHP Premium wins 100% at very high spend (above Kaiser reclaim point)', () => {
    const hdhpPremium = PLANS.find(p => p.id === 'hdhp-premium')!;
    const prob = winProbability(hdhpPremium, PLANS, baseSettings, 22000, 25000);
    expect(prob).toBe(1);
  });
});
