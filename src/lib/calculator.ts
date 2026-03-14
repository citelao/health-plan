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
export interface Crossover {
  spend: number;
  /** Which plan is cheaper *after* this crossover point */
  cheaperAfter: 'plan1' | 'plan2';
}

/**
 * Returns crossover points where the cheaper plan changes between plan1 and plan2.
 * diff = cost_plan1 - cost_plan2:
 *   negative → plan1 is cheaper; positive → plan2 is cheaper
 */
export function findCrossovers(
  plan1: PlanParams,
  plan2: PlanParams,
  settings: UserSettings,
  points = 400,
): Crossover[] {
  const curve1 = costCurve(plan1, settings, points);
  const curve2 = costCurve(plan2, settings, points);
  const crossovers: Crossover[] = [];
  for (let i = 1; i < points; i++) {
    const prev = curve1[i - 1].cost - curve2[i - 1].cost;
    const curr = curve1[i].cost - curve2[i].cost;
    if (prev * curr < 0) {
      const t = prev / (prev - curr);
      const spend = curve1[i - 1].spend + t * (curve1[i].spend - curve1[i - 1].spend);
      // curr < 0 means plan1 is now cheaper (diff went negative)
      crossovers.push({ spend, cheaperAfter: curr < 0 ? 'plan1' : 'plan2' });
    }
  }
  return crossovers;
}

// P(refPlan is cheapest) assuming spend is uniform over [loSpend, hiSpend]
export function winProbability(
  refPlan: PlanParams,
  allPlans: PlanParams[],
  settings: UserSettings,
  loSpend: number,
  hiSpend: number,
  points = 400,
): number {
  if (loSpend >= hiSpend) {
    const costs = allPlans.map(p => costAtSpend(p, settings, loSpend).totalCost);
    const refCost = costAtSpend(refPlan, settings, loSpend).totalCost;
    return refCost <= Math.min(...costs) ? 1 : 0;
  }
  let wins = 0;
  for (let i = 0; i < points; i++) {
    const spend = loSpend + (i / (points - 1)) * (hiSpend - loSpend);
    const refCost = costAtSpend(refPlan, settings, spend).totalCost;
    const bestCost = Math.min(...allPlans.map(p => costAtSpend(p, settings, spend).totalCost));
    if (refCost <= bestCost + 0.01) wins++;
  }
  return wins / points;
}

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
