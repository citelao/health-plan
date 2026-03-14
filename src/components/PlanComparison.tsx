import React, { useState } from 'react';
import type { PlanParams, UserSettings } from '../data/types';
import { PLANS } from '../data/plans';
import { SettingsPanel } from './SettingsPanel';
import { PlanSummaryTable } from './PlanSummaryTable';
import styles from './PlanComparison.module.css';

const DEFAULT_SETTINGS: UserSettings = {
  coverageTier: 'employee',
  oonPercent: 0,
  marginalTaxRate: 0.30,
  personalHsaContribution: 0,
  markedSpend: 3000,
};

export function PlanComparison() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [customPlans, setCustomPlans] = useState<PlanParams[]>([]);

  const allPlans = [...PLANS, ...customPlans];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>2026 Salesforce Health Plan Comparison</h1>
        <p>Compare your true cost across all medical plan options</p>
      </header>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <SettingsPanel settings={settings} onChange={setSettings} />
        </aside>
        <main className={styles.main}>
          <PlanSummaryTable plans={allPlans} settings={settings} />
        </main>
      </div>
    </div>
  );
}
