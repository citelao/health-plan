import React from 'react';
import type { PlanParams, UserSettings, PlanCostAtSpend } from '../data/types';
import { costAtSpend } from '../lib/calculator';
import { formatCurrency } from '../lib/format';
import styles from './PlanSummaryTable.module.css';

interface Props {
  plans: PlanParams[];
  settings: UserSettings;
}

export function PlanSummaryTable({ plans, settings }: Props) {
  const costs: PlanCostAtSpend[] = plans.map(plan =>
    costAtSpend(plan, settings, settings.markedSpend)
  );

  costs.sort((a, b) => a.totalCost - b.totalCost);

  const minCost = Math.min(...costs.map(c => c.totalCost));

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>
        Cost at {formatCurrency(settings.markedSpend)} annual spend
      </h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Annual Premium</th>
            <th>Out-of-Pocket</th>
            <th>Employer HSA</th>
            <th>HSA Tax Savings</th>
            <th>Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {costs.map(cost => {
            const plan = plans.find(p => p.id === cost.planId)!;
            const isBest = cost.totalCost === minCost;
            return (
              <tr key={cost.planId} className={isBest ? styles.bestRow : undefined}>
                <td>
                  {plan.name}
                  {isBest && <span className={styles.bestBadge}>Best</span>}
                </td>
                <td>{formatCurrency(cost.annualPremium)}</td>
                <td>{formatCurrency(cost.oopCost)}</td>
                <td>−{formatCurrency(cost.employerHsaCredit)}</td>
                <td>−{formatCurrency(cost.hsaTaxSavings)}</td>
                <td className={styles.totalCell}>{formatCurrency(cost.totalCost)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
