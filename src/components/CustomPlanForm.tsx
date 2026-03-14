import React, { useState } from 'react';
import type { PlanParams, CoverageTier } from '../data/types';
import styles from './CustomPlanForm.module.css';

interface Props {
  onAdd: (plan: PlanParams) => void;
}

export function CustomPlanForm({ onAdd }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [monthlyPremium, setMonthlyPremium] = useState(200);
  const [deductible, setDeductible] = useState(1000);
  const [oopMax, setOopMax] = useState(5000);
  const [coinsurance, setCoinsurance] = useState(20);
  const [hsaEligible, setHsaEligible] = useState(false);
  const [employerHsa, setEmployerHsa] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Use 2x multipliers for family tiers
    const makeTiers = (individual: number, multiplier = 2): Record<CoverageTier, number> => ({
      employee: individual,
      employee_spouse: individual * multiplier,
      employee_children: individual * multiplier,
      family: individual * multiplier,
    });

    const plan: PlanParams = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      carrier: 'Custom',
      custom: true,
      hsaEligible,
      premiums: makeTiers(monthlyPremium),
      employerHsaContribution: makeTiers(employerHsa),
      inNetwork: {
        deductible: makeTiers(deductible),
        oopMax: makeTiers(oopMax),
        coinsuranceRate: coinsurance / 100,
      },
    };

    onAdd(plan);
    setName('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button className={styles.addButton} onClick={() => setIsOpen(true)}>
        + Add Custom Plan
      </button>
    );
  }

  return (
    <div className={styles.form}>
      <h3 className={styles.title}>Add Custom Plan</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label>Plan Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required placeholder="My Plan" />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Monthly Premium ($)</label>
            <input type="number" min={0} value={monthlyPremium} onChange={e => setMonthlyPremium(+e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Deductible ($)</label>
            <input type="number" min={0} value={deductible} onChange={e => setDeductible(+e.target.value)} />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>OOP Max ($)</label>
            <input type="number" min={0} value={oopMax} onChange={e => setOopMax(+e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Coinsurance (%)</label>
            <input type="number" min={0} max={100} value={coinsurance} onChange={e => setCoinsurance(+e.target.value)} />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.checkLabel}>
            <input type="checkbox" checked={hsaEligible} onChange={e => setHsaEligible(e.target.checked)} />
            HSA Eligible
          </label>
        </div>
        {hsaEligible && (
          <div className={styles.field}>
            <label>Employer HSA Contribution (annual, $)</label>
            <input type="number" min={0} value={employerHsa} onChange={e => setEmployerHsa(+e.target.value)} />
          </div>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={() => setIsOpen(false)}>Cancel</button>
          <button type="submit" className={styles.submitButton}>Add Plan</button>
        </div>
      </form>
    </div>
  );
}
