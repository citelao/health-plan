import { describe, it, expect } from 'vitest';
import { oopForSpend, costAtSpend } from '../../src/lib/calculator';
import { PLANS } from '../../src/data/plans';
import type { UserSettings } from '../../src/data/types';

const defaultSettings: UserSettings = {
  coverageTier: 'employee',
  oonPercent: 0,
  marginalTaxRate: 0.30,
  personalHsaContribution: 0,
  markedSpend: 3000,
};

describe('oopForSpend', () => {
  it('spend below deductible', () => {
    expect(oopForSpend(500, 1000, 5000, 0.20)).toBe(500);
  });

  it('spend at deductible', () => {
    expect(oopForSpend(1000, 1000, 5000, 0.20)).toBe(1000);
  });

  it('spend above deductible applies coinsurance', () => {
    // spend=2000, ded=1000, post=1000, coins=200, total=1200
    expect(oopForSpend(2000, 1000, 5000, 0.20)).toBe(1200);
  });

  it('spend at OOP max', () => {
    // large spend, should cap at OOP max
    expect(oopForSpend(100000, 1000, 5000, 0.20)).toBe(5000);
  });

  it('spend beyond OOP max', () => {
    expect(oopForSpend(200000, 1000, 5000, 0.20)).toBe(5000);
  });
});

describe('costAtSpend', () => {
  const hdhpStandard = PLANS.find(p => p.id === 'hdhp-standard')!;
  const hdhpPremium = PLANS.find(p => p.id === 'hdhp-premium')!;
  const kaiserHmo = PLANS.find(p => p.id === 'kaiser-hmo')!;

  it('HDHP Standard at $0 spend = $0 annual premium (free plan)', () => {
    const result = costAtSpend(hdhpStandard, defaultSettings, 0);
    expect(result.annualPremium).toBe(0);
    expect(result.oopCost).toBe(0);
    expect(result.totalCost).toBe(0);
  });

  it('HDHP Premium with HSA credit reduces total', () => {
    const result = costAtSpend(hdhpPremium, defaultSettings, 0);
    // premium - hsaCredit - taxSavings
    const expectedPremium = 61 * 12;  // 732
    const hsaCredit = 1000;
    const hsaTaxSavings = (1000 + 0) * 0.30;  // 300
    expect(result.annualPremium).toBe(expectedPremium);
    expect(result.employerHsaCredit).toBe(hsaCredit);
    expect(result.hsaTaxSavings).toBe(hsaTaxSavings);
    expect(result.totalCost).toBe(expectedPremium - hsaCredit - hsaTaxSavings);
  });

  it('OON on Kaiser = full OON cost (no OON coverage)', () => {
    const settingsWithOON: UserSettings = { ...defaultSettings, oonPercent: 0.5 };
    const result = costAtSpend(kaiserHmo, settingsWithOON, 2000);
    // 50% = $1000 OON → full cost, 50% = $1000 INN → capped at OOP max (deductible=0, coins=8%, oopMax=1750)
    const innOOP = oopForSpend(1000, 0, 1750, 0.08);  // 1000*0.08=80
    expect(result.oopCost).toBe(innOOP + 1000);  // full OON cost
  });

  it('HSA tax savings = 0 for non-HDHP plans', () => {
    const result = costAtSpend(kaiserHmo, defaultSettings, 1000);
    expect(result.hsaTaxSavings).toBe(0);
  });
});
