import React, { useState } from 'react';
import type { PlanParams, UserSettings } from '../data/types';
import { costAtSpend, findCrossovers, winProbability } from '../lib/calculator';
import { formatCurrency, formatPercent } from '../lib/format';
import styles from './WinnerCallout.module.css';

interface Props {
  plans: PlanParams[];
  settings: UserSettings;
  mode: 'medical-need' | 'oop-spend';
}

export function WinnerCallout({ plans, settings, mode }: Props) {
  if (mode === 'oop-spend') return null;
  const refPlan = plans.find(p => p.id === 'hdhp-premium');
  if (!refPlan) return null;

  const refCost = costAtSpend(refPlan, settings, settings.markedSpend).totalCost;
  const otherCosts = plans
    .filter(p => p.id !== 'hdhp-premium')
    .map(p => ({ plan: p, cost: costAtSpend(p, settings, settings.markedSpend).totalCost }))
    .sort((a, b) => a.cost - b.cost);

  const bestOther = otherCosts[0];
  const savings = bestOther.cost - refCost;
  const hdhpWinsHere = savings >= 0;

  // Find crossovers where another plan becomes cheaper than HDHP Premium
  const crossovers = plans
    .filter(p => p.id !== 'hdhp-premium')
    .flatMap(p =>
      findCrossovers(refPlan, p, settings)
        .filter(c => c.cheaperAfter === 'plan2')
        .map(c => ({ plan: p, spend: c.spend }))
    )
    .sort((a, b) => a.spend - b.spend);

  // Spend range for probability
  const [loSpend, setLoSpend] = useState(0);
  const [hiSpend, setHiSpend] = useState(10000);

  const prob = winProbability(refPlan, plans, settings, loSpend, hiSpend);

  return (
    <div className={styles.callout}>
      <div className={hdhpWinsHere ? styles.header : styles.headerLosing}>
        <div className={styles.headline}>
          {hdhpWinsHere
            ? <>HDHP Premium saves you <strong>{formatCurrency(savings)}</strong> vs {bestOther.plan.name} at this spend level</>
            : <>{bestOther.plan.name} saves you <strong>{formatCurrency(-savings)}</strong> vs HDHP Premium at this spend level</>
          }
        </div>
      </div>

      <div className={styles.body}>
        {crossovers.length === 0 ? (
          <p className={styles.noCrossover}>
            HDHP Premium wins at every spend level shown — there is no crossover point.
          </p>
        ) : (
          <div className={styles.crossovers}>
            <p className={styles.crossoverLabel}>Crossover points (where another plan becomes cheaper than HDHP Premium):</p>
            {crossovers.map(({ plan, spend }) => (
              <div key={`${plan.id}-${spend}`} className={styles.crossoverItem}>
                <span className={styles.crossoverPlan}>{plan.name}</span>
                <span>becomes cheaper above <strong>{formatCurrency(spend)}</strong>/yr total spend</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.probability}>
          <p className={styles.probLabel}>
            If your spend is somewhere between these values, what's the chance HDHP Premium wins?
          </p>
          <div className={styles.probInputs}>
            <label>
              Low estimate
              <input
                type="number"
                min={0}
                max={25000}
                step={500}
                value={loSpend}
                onChange={e => setLoSpend(+e.target.value || 0)}
              />
            </label>
            <span className={styles.probTo}>to</span>
            <label>
              High estimate
              <input
                type="number"
                min={0}
                max={25000}
                step={500}
                value={hiSpend}
                onChange={e => setHiSpend(+e.target.value || 0)}
              />
            </label>
          </div>
          <div className={styles.probResult}>
            <span className={styles.probNumber}>{formatPercent(prob)}</span>
            <span className={styles.probDesc}>
              chance HDHP Premium is cheapest across that range
              {prob === 1 && ' — it wins at every point in this range'}
              {prob === 0 && ' — it loses at every point in this range'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
