export type CoverageTier = "employee" | "employee_spouse" | "employee_children" | "family";

export type ChartMode = "medical-need" | "oop-spend";

export interface PlanParams {
  id: string;
  name: string;
  carrier: string;
  custom?: boolean;
  availableStates?: string[];
  hsaEligible: boolean;
  premiums: Record<CoverageTier, number>;           // monthly
  employerHsaContribution: Record<CoverageTier, number>;  // annual
  inNetwork: NetworkParams;
  outOfNetwork?: NetworkParams;
}

export interface NetworkParams {
  deductible: Record<CoverageTier, number>;
  oopMax: Record<CoverageTier, number>;
  coinsuranceRate: number;               // 0–1, applied after deductible
}

export interface UserSettings {
  coverageTier: CoverageTier;
  oonPercent: number;                    // 0–1
  marginalTaxRate: number;              // 0–1, for HSA tax advantage
  personalHsaContribution: number;      // annual, user-chosen
  markedSpend: number;                  // draggable marker position ($)
}

export interface PlanCostAtSpend {
  planId: string;
  annualPremium: number;
  oopCost: number;
  employerHsaCredit: number;
  hsaTaxSavings: number;
  totalCost: number;
}
