import type { PlanParams } from './types';

export const PLANS: PlanParams[] = [
  {
    id: 'kaiser-hmo',
    name: 'Kaiser HMO',
    carrier: 'Kaiser',
    hsaEligible: false,
    premiums: {
      employee: 112,
      employee_spouse: 324,
      employee_children: 295,
      family: 512,
    },
    employerHsaContribution: {
      employee: 0,
      employee_spouse: 0,
      employee_children: 0,
      family: 0,
    },
    inNetwork: {
      deductible: {
        employee: 0,
        employee_spouse: 0,
        employee_children: 0,
        family: 0,
      },
      oopMax: {
        employee: 1750,
        employee_spouse: 3500,
        employee_children: 3500,
        family: 3500,
      },
      coinsuranceRate: 0.08,
    },
    // No OON coverage
  },
  {
    id: 'aetna-epo',
    name: 'Aetna EPO',
    carrier: 'Aetna',
    hsaEligible: false,
    premiums: {
      employee: 140,
      employee_spouse: 397,
      employee_children: 342,
      family: 641,
    },
    employerHsaContribution: {
      employee: 0,
      employee_spouse: 0,
      employee_children: 0,
      family: 0,
    },
    inNetwork: {
      deductible: {
        employee: 200,
        employee_spouse: 400,
        employee_children: 400,
        family: 400,
      },
      oopMax: {
        employee: 2200,
        employee_spouse: 4400,
        employee_children: 4400,
        family: 4400,
      },
      coinsuranceRate: 0.12,
    },
    // No OON coverage
  },
  {
    id: 'aetna-ppo',
    name: 'Aetna PPO',
    carrier: 'Aetna',
    hsaEligible: false,
    premiums: {
      employee: 112,
      employee_spouse: 356,
      employee_children: 308,
      family: 588,
    },
    employerHsaContribution: {
      employee: 0,
      employee_spouse: 0,
      employee_children: 0,
      family: 0,
    },
    inNetwork: {
      deductible: {
        employee: 500,
        employee_spouse: 1500,
        employee_children: 1500,
        family: 1500,
      },
      oopMax: {
        employee: 2500,
        employee_spouse: 5000,
        employee_children: 5000,
        family: 5000,
      },
      coinsuranceRate: 0.10,
    },
    outOfNetwork: {
      deductible: {
        employee: 1000,
        employee_spouse: 3000,
        employee_children: 3000,
        family: 3000,
      },
      oopMax: {
        employee: 5000,
        employee_spouse: 10000,
        employee_children: 10000,
        family: 10000,
      },
      coinsuranceRate: 0.30,
    },
  },
  {
    id: 'hdhp-premium',
    name: 'HDHP Premium',
    carrier: 'Aetna',
    hsaEligible: true,
    premiums: {
      employee: 61,
      employee_spouse: 185,
      employee_children: 156,
      family: 323,
    },
    employerHsaContribution: {
      employee: 1000,
      employee_spouse: 2000,
      employee_children: 2000,
      family: 2000,
    },
    inNetwork: {
      deductible: {
        employee: 1800,
        employee_spouse: 3600,
        employee_children: 3600,
        family: 3600,
      },
      oopMax: {
        employee: 3600,
        employee_spouse: 7200,
        employee_children: 7200,
        family: 7200,
      },
      coinsuranceRate: 0.10,
    },
    outOfNetwork: {
      deductible: {
        employee: 3600,
        employee_spouse: 7200,
        employee_children: 7200,
        family: 7200,
      },
      oopMax: {
        employee: 7200,
        employee_spouse: 14400,
        employee_children: 14400,
        family: 14400,
      },
      coinsuranceRate: 0.30,
    },
  },
  {
    id: 'hdhp-standard',
    name: 'HDHP Standard',
    carrier: 'Aetna',
    hsaEligible: true,
    premiums: {
      employee: 0,
      employee_spouse: 0,
      employee_children: 0,
      family: 0,
    },
    employerHsaContribution: {
      employee: 0,
      employee_spouse: 0,
      employee_children: 0,
      family: 0,
    },
    inNetwork: {
      deductible: {
        employee: 2250,
        employee_spouse: 4500,
        employee_children: 4500,
        family: 4500,
      },
      oopMax: {
        employee: 4500,
        employee_spouse: 9000,
        employee_children: 9000,
        family: 9000,
      },
      coinsuranceRate: 0.20,
    },
    outOfNetwork: {
      deductible: {
        employee: 4500,
        employee_spouse: 9000,
        employee_children: 9000,
        family: 9000,
      },
      oopMax: {
        employee: 9000,
        employee_spouse: 18000,
        employee_children: 18000,
        family: 18000,
      },
      coinsuranceRate: 0.40,
    },
  },
];
