import { describe, it, expect } from 'vitest';
import { PLANS } from '../../src/data/plans';

const TIERS = ['employee', 'employee_spouse', 'employee_children', 'family'] as const;

describe('plans data', () => {
  it('all plans have premiums for all 4 tiers', () => {
    for (const plan of PLANS) {
      for (const tier of TIERS) {
        expect(typeof plan.premiums[tier]).toBe('number');
      }
    }
  });

  it('OOP max >= deductible for all plans and tiers', () => {
    for (const plan of PLANS) {
      for (const tier of TIERS) {
        expect(plan.inNetwork.oopMax[tier]).toBeGreaterThanOrEqual(plan.inNetwork.deductible[tier]);
        if (plan.outOfNetwork) {
          expect(plan.outOfNetwork.oopMax[tier]).toBeGreaterThanOrEqual(plan.outOfNetwork.deductible[tier]);
        }
      }
    }
  });

  it('only HDHPs have hsaEligible: true', () => {
    for (const plan of PLANS) {
      if (plan.id.startsWith('hdhp')) {
        expect(plan.hsaEligible).toBe(true);
      } else {
        expect(plan.hsaEligible).toBe(false);
      }
    }
  });
});
