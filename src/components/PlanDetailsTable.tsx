import React from 'react';
import type { PlanParams, UserSettings } from '../data/types';
import { formatCurrency, formatPercent } from '../lib/format';
import styles from './PlanDetailsTable.module.css';

interface Props {
  plans: PlanParams[];
  settings: UserSettings;
}

export function PlanDetailsTable({ plans, settings }: Props) {
  const tier = settings.coverageTier;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Plan Details</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Monthly Premium</th>
            <th>Deductible</th>
            <th>OOP Max</th>
            <th>Coinsurance</th>
            <th>HSA Eligible</th>
            <th>Employer HSA</th>
          </tr>
        </thead>
        <tbody>
          {plans.map(plan => (
            <tr key={plan.id}>
              <td>{plan.name}</td>
              <td>{formatCurrency(plan.premiums[tier])}/mo</td>
              <td>{formatCurrency(plan.inNetwork.deductible[tier])}</td>
              <td>{formatCurrency(plan.inNetwork.oopMax[tier])}</td>
              <td>{formatPercent(plan.inNetwork.coinsuranceRate)}</td>
              <td>{plan.hsaEligible ? 'Yes' : 'No'}</td>
              <td>{plan.hsaEligible ? formatCurrency(plan.employerHsaContribution[tier]) + '/yr' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
