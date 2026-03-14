import React, { useState } from 'react';
import type { PlanParams, UserSettings } from '../data/types';
import { PLANS } from '../data/plans';
import { SettingsPanel } from './SettingsPanel';
import { PlanSummaryTable } from './PlanSummaryTable';
import { CostCurveChart, type ChartMode } from './CostCurveChart';
import { CustomPlanForm } from './CustomPlanForm';
import { PlanDetailsTable } from './PlanDetailsTable';
import { WinnerCallout } from './WinnerCallout';
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
  const [chartMode, setChartMode] = useState<ChartMode>('medical-need');

  React.useEffect(() => {
    if (window.location.hash === '#oop-spend') setChartMode('oop-spend');
  }, []);

  const switchMode = (mode: ChartMode) => {
    setChartMode(mode);
    window.location.hash = mode;
  };

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
          <div className={styles.tabs}>
            <button
              className={chartMode === 'medical-need' ? styles.tabActive : styles.tab}
              onClick={() => switchMode('medical-need')}
            >
              By Medical Need
            </button>
            <button
              className={chartMode === 'oop-spend' ? styles.tabActive : styles.tab}
              onClick={() => switchMode('oop-spend')}
            >
              By Your OOP Spend
            </button>
          </div>
          <CostCurveChart
            plans={allPlans}
            settings={settings}
            onMarkedSpendChange={(spend) => setSettings(s => ({ ...s, markedSpend: spend }))}
            mode={chartMode}
          />
          <WinnerCallout plans={allPlans} settings={settings} mode={chartMode} />
          <PlanSummaryTable plans={allPlans} settings={settings} />
          <PlanDetailsTable plans={allPlans} settings={settings} />
        </main>
      </div>
    </div>
  );
}
