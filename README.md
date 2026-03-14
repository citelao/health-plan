# Health Plan Comparison Tool

An interactive tool for comparing 2026 Salesforce medical plan options. Built with Astro, React, and D3.

## What it does

The tool renders cost curves for each plan: given a total annual healthcare spend, it computes what you actually pay (premiums + out-of-pocket costs − HSA credits − tax savings). A draggable marker lets you set your expected spend level and see a ranked cost breakdown.

Two chart views:

- **By Medical Need** — X axis = total annual healthcare spend ($0–$25k). This is the primary view. The Y axis shows your net annual cost; it can go negative because employer HSA contributions and tax savings can exceed premiums at low spend.
- **By Your OOP Spend** — X axis = what you pay at the doctor ($0–plan OOP max). Useful for reasoning about worst-case exposure.

**HDHP Premium win analysis** (shown in "By Medical Need" mode): a callout shows whether HDHP Premium wins at your marked spend level, where crossover points occur with other plans, and a probability calculator for "if my spend is somewhere in this range, what fraction of that range does HDHP Premium win?"

## Plans modeled

| Plan | Type | INN Deductible (ind/fam) | INN OOP Max (ind/fam) | Employer HSA |
|------|------|--------------------------|----------------------|--------------|
| Kaiser HMO | HMO | $0 / $0 | $1,750 / $3,500 | — |
| Aetna EPO | EPO | $200 / $400 | $2,200 / $4,400 | — |
| Aetna PPO | PPO | $500 / $1,500 | $2,500 / $5,000 | — |
| HDHP Premium | HDHP | $1,800 / $3,600 | $3,600 / $7,200 | $1,000 / $2,000 |
| HDHP Standard | HDHP | $2,250 / $4,500 | $4,500 / $9,000 | $0 |

Premiums vary by coverage tier (employee, employee+spouse, employee+children, family).

Copay-based plans (Kaiser, EPO, PPO) use a blended effective coinsurance rate derived from an average service mix (approx. 60% office/Rx, 20% imaging/labs, 20% hospital). This is an approximation.

## Settings

- **Coverage tier** — employee, employee+spouse, employee+children, family
- **Out-of-network %** — portion of spend assumed out-of-network (0–50%)
- **Marginal tax rate** — federal + state combined, used to compute HSA tax savings
- **Personal HSA contribution** — annual amount you contribute; 2026 IRS limit is $4,300 including employer contributions
- **Usage presets** — Healthy ($500), Moderate ($3k), High-use ($8k), Chronic ($15k)

You can also add a custom plan with arbitrary premium, deductible, OOP max, and coinsurance rate.

## Key insight

HDHP Premium almost always wins, but **Kaiser HMO is cheaper in the ~$14,600–$21,100 total spend band** (employee tier, no out-of-network). This happens because Kaiser's blended coinsurance (~8%) is lower than HDHP Premium's 10% in that range, before Premium's lower OOP max kicks in. The win-probability calculator makes this tradeoff explicit.

## Development

```bash
npm install
npm run dev        # dev server at localhost:4321
npm test           # Vitest unit tests
npm run typecheck  # tsc --noEmit
npm run build      # production build
```

## Project structure

```
src/
├── components/
│   ├── PlanComparison.tsx     # Root React island (client:load)
│   ├── CostCurveChart.tsx     # D3 cost-curve chart with draggable marker
│   ├── WinnerCallout.tsx      # HDHP Premium win analysis + probability tool
│   ├── SettingsPanel.tsx      # Coverage tier, OON%, tax rate, HSA contribution
│   ├── PlanSummaryTable.tsx   # Cost breakdown at marker spend
│   ├── PlanDetailsTable.tsx   # Plan parameters reference table
│   └── CustomPlanForm.tsx     # Add a custom plan
├── data/
│   ├── types.ts               # Shared types (PlanParams, UserSettings, etc.)
│   └── plans.ts               # 2026 plan data
└── lib/
    ├── calculator.ts          # Cost math, crossover detection, win probability
    └── format.ts              # formatCurrency, formatPercent
tests/unit/
├── calculator.test.ts         # oopForSpend, costAtSpend, costCurve
├── plans.test.ts              # Plan data shape validation
└── crossover.test.ts          # findCrossovers, winProbability
```

## Modeling notes

- **OOP formula**: spend ≤ deductible → pay in full; spend > deductible → deductible + (spend − deductible) × coinsuranceRate, capped at OOP max.
- **HSA tax savings**: (employer HSA + personal HSA contribution) × marginal tax rate. Models the contribution deduction only — investment growth is not projected.
- **Custom plans**: family/tier values derived from individual inputs using 2× multipliers.
- **Crossover detection**: sampled at 400 points over $0–$25k; linear interpolation between sign-change segments.
