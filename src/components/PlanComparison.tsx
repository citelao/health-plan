import React, { useState } from 'react';
import type { PlanParams, UserSettings } from '../data/types';
import { PLANS } from '../data/plans';
import { SettingsPanel } from './SettingsPanel';
import { PlanSummaryTable } from './PlanSummaryTable';
import { CostCurveChart } from './CostCurveChart';
import { CustomPlanForm } from './CustomPlanForm';
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

  const addCustomPlan = (plan: PlanParams) => setCustomPlans(prev => [...prev, plan]);
  const removeCustomPlan = (id: string) => setCustomPlans(prev => prev.filter(p => p.id !== id));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>2026 Salesforce Health Plan Comparison</h1>
        <p>Compare your true cost across all medical plan options</p>
      </header>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <SettingsPanel settings={settings} onChange={setSettings} />
          <div className={styles.customSection}>
            <CustomPlanForm onAdd={addCustomPlan} />
            {customPlans.map(plan => (
              <div key={plan.id} className={styles.customPlanTag}>
                <span>{plan.name}</span>
                <button onClick={() => removeCustomPlan(plan.id)} className={styles.removeButton}>×</button>
              </div>
            ))}
          </div>
        </aside>
        <main className={styles.main}>
          <CostCurveChart
            plans={allPlans}
            settings={settings}
            onMarkedSpendChange={(spend) => setSettings(s => ({ ...s, markedSpend: spend }))}
          />
          <PlanSummaryTable plans={allPlans} settings={settings} />
        </main>
      </div>
    </div>
  );
}
