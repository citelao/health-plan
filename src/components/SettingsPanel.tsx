import React from 'react';
import type { UserSettings, CoverageTier } from '../data/types';
import styles from './SettingsPanel.module.css';

interface Props {
  settings: UserSettings;
  onChange: (settings: UserSettings) => void;
}

const TIERS: { value: CoverageTier; label: string }[] = [
  { value: 'employee', label: 'Employee Only' },
  { value: 'employee_spouse', label: 'Employee + Spouse' },
  { value: 'employee_children', label: 'Employee + Children' },
  { value: 'family', label: 'Family' },
];

const OON_OPTIONS = [
  { value: 0, label: '0%' },
  { value: 0.10, label: '10%' },
  { value: 0.25, label: '25%' },
  { value: 0.50, label: '50%' },
];

const PRESETS = [
  { label: 'Healthy', spend: 500 },
  { label: 'Moderate', spend: 3000 },
  { label: 'High-Use', spend: 8000 },
  { label: 'Chronic', spend: 15000 },
];

export function SettingsPanel({ settings, onChange }: Props) {
  const update = (partial: Partial<UserSettings>) => onChange({ ...settings, ...partial });

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Settings</h2>

      <fieldset className={styles.fieldset}>
        <legend>Coverage Tier</legend>
        {TIERS.map(tier => (
          <label key={tier.value} className={styles.radioLabel}>
            <input
              type="radio"
              name="coverageTier"
              value={tier.value}
              checked={settings.coverageTier === tier.value}
              onChange={() => update({ coverageTier: tier.value })}
            />
            {tier.label}
          </label>
        ))}
      </fieldset>

      <div className={styles.field}>
        <label>Out-of-Network %</label>
        <select
          value={settings.oonPercent}
          onChange={e => update({ oonPercent: parseFloat(e.target.value) })}
        >
          {OON_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label>Federal + State Marginal Tax Rate</label>
        <input
          type="number"
          min={0}
          max={60}
          value={Math.round(settings.marginalTaxRate * 100)}
          onChange={e => update({ marginalTaxRate: parseInt(e.target.value, 10) / 100 })}
        />
        <span className={styles.unit}>%</span>
      </div>

      <div className={styles.hsaNote}>
        <strong>HSA Triple-Tax Advantage:</strong> Contributions are pre-tax, growth is tax-free, and qualified withdrawals are tax-free. This tool models the contribution deduction; investment growth is noted but not modeled.
      </div>

      <div className={styles.field}>
        <label>Personal HSA Contribution (annual)</label>
        <input
          type="number"
          min={0}
          max={10000}
          step={100}
          value={settings.personalHsaContribution}
          onChange={e => update({ personalHsaContribution: parseInt(e.target.value, 10) || 0 })}
        />
        {settings.personalHsaContribution > 4300
          ? <span className={styles.hsaWarning}>Above the 2026 limit of $4,300/yr (including employer contributions). Excess may incur a 6% penalty.</span>
          : <span className={styles.hsaHint}>2026 limit: $4,300/yr total including employer HSA</span>
        }
      </div>

      <div className={styles.presets}>
        <span>Usage Presets:</span>
        {PRESETS.map(preset => (
          <button
            key={preset.label}
            className={settings.markedSpend === preset.spend ? styles.presetActive : styles.preset}
            onClick={() => update({ markedSpend: preset.spend })}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
