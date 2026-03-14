import type { PlanParams, UserSettings, PlanCostAtSpend } from '../data/types';

export function oopForSpend(spend: number, deductible: number, oopMax: number, coinsuranceRate: number): number {
  if (spend <= deductible) return spend;
  const postDeductible = spend - deductible;
  const coinsurance = postDeductible * coinsuranceRate;
  return Math.min(deductible + coinsurance, oopMax);
}

export function costAtSpend(plan: PlanParams, settings: UserSettings, totalSpend: number): PlanCostAtSpend {
  const tier = settings.coverageTier;
  const innSpend = totalSpend * (1 - settings.oonPercent);
  const oonSpend = totalSpend * settings.oonPercent;

  const innOOP = oopForSpend(
    innSpend,
    plan.inNetwork.deductible[tier],
    plan.inNetwork.oopMax[tier],
    plan.inNetwork.coinsuranceRate
  );

  const oonOOP = plan.outOfNetwork
    ? oopForSpend(
        oonSpend,
        plan.outOfNetwork.deductible[tier],
        plan.outOfNetwork.oopMax[tier],
        plan.outOfNetwork.coinsuranceRate
      )
    : oonSpend;  // no OON coverage → pay full cost

  const annualPremium = plan.premiums[tier] * 12;
  const employerHsaCredit = plan.employerHsaContribution[tier];
  const hsaTaxSavings = plan.hsaEligible
    ? (employerHsaCredit + settings.personalHsaContribution) * settings.marginalTaxRate
    : 0;
  const totalCost = annualPremium + innOOP + oonOOP - employerHsaCredit - hsaTaxSavings;

  return { planId: plan.id, annualPremium, oopCost: innOOP + oonOOP, employerHsaCredit, hsaTaxSavings, totalCost };
}

export function costCurve(plan: PlanParams, settings: UserSettings, points = 200): { spend: number; cost: number }[] {
  return Array.from({ length: points }, (_, i) => {
    const spend = (i / (points - 1)) * 25000;
    return { spend, cost: costAtSpend(plan, settings, spend).totalCost };
  });
}

// X = what you actually pay out-of-pocket for medical bills (0 → plan OOP max)
// Y = total annual cost (OOP + premiums − HSA credits)
export function oopCurve(plan: PlanParams, settings: UserSettings, maxX: number, points = 200): { spend: number; cost: number }[] {
  const tier = settings.coverageTier;
  const annualPremium = plan.premiums[tier] * 12;
  const employerHsaCredit = plan.employerHsaContribution[tier];
  const hsaTaxSavings = plan.hsaEligible
    ? (employerHsaCredit + settings.personalHsaContribution) * settings.marginalTaxRate
    : 0;
  const base = annualPremium - employerHsaCredit - hsaTaxSavings;

  const oopMax = plan.inNetwork.oopMax[tier];

  return Array.from({ length: points }, (_, i) => {
    const oop = (i / (points - 1)) * maxX;
    const cappedOop = Math.min(oop, oopMax);
    return { spend: oop, cost: base + cappedOop };
  });
}
