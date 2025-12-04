/**
 * Australian State-Specific Tax Rules Configuration
 * Task: W26-T4 - Canadian/Australian tax rules
 */

import { AustralianState } from '@operate/shared/types/tax/australia-tax.types';

/**
 * Payroll tax thresholds by state (2024)
 * Note: These are state-level taxes, separate from GST
 */
export const PAYROLL_TAX_THRESHOLDS = {
  [AustralianState.NSW]: {
    threshold: 1200000,
    rate: 5.45,
    description: 'New South Wales Payroll Tax',
  },
  [AustralianState.VIC]: {
    threshold: 700000,
    rate: 4.85,
    description: 'Victoria Payroll Tax',
  },
  [AustralianState.QLD]: {
    threshold: 1300000,
    rate: 4.75,
    description: 'Queensland Payroll Tax',
  },
  [AustralianState.SA]: {
    threshold: 1500000,
    rate: 4.95,
    description: 'South Australia Payroll Tax',
  },
  [AustralianState.WA]: {
    threshold: 1000000,
    rate: 5.5,
    description: 'Western Australia Payroll Tax',
  },
  [AustralianState.TAS]: {
    threshold: 1250000,
    rate: 4.0,
    description: 'Tasmania Payroll Tax',
  },
  [AustralianState.NT]: {
    threshold: 1500000,
    rate: 5.5,
    description: 'Northern Territory Payroll Tax',
  },
  [AustralianState.ACT]: {
    threshold: 2000000,
    rate: 6.85,
    description: 'Australian Capital Territory Payroll Tax',
  },
} as const;

/**
 * Land tax thresholds by state
 * Note: Land tax is a state-level tax on land ownership
 */
export const LAND_TAX_THRESHOLDS = {
  [AustralianState.NSW]: {
    threshold: 969000,
    description: 'NSW land tax threshold',
  },
  [AustralianState.VIC]: {
    threshold: 300000,
    description: 'Victoria land tax threshold',
  },
  [AustralianState.QLD]: {
    threshold: 600000,
    description: 'Queensland land tax threshold',
  },
  [AustralianState.SA]: {
    threshold: 450000,
    description: 'South Australia land tax threshold',
  },
  [AustralianState.WA]: {
    threshold: 300000,
    description: 'Western Australia land tax threshold',
  },
  [AustralianState.TAS]: {
    threshold: 50000,
    description: 'Tasmania land tax threshold',
  },
  [AustralianState.ACT]: {
    threshold: 0,
    description: 'ACT - No land tax (rates apply instead)',
  },
  [AustralianState.NT]: {
    threshold: 0,
    description: 'Northern Territory - No land tax',
  },
} as const;

/**
 * State government revenue offices
 */
export const REVENUE_OFFICES = {
  [AustralianState.NSW]: {
    name: 'Revenue NSW',
    website: 'https://www.revenue.nsw.gov.au',
    phone: '1300 139 814',
  },
  [AustralianState.VIC]: {
    name: 'State Revenue Office Victoria',
    website: 'https://www.sro.vic.gov.au',
    phone: '03 9628 0000',
  },
  [AustralianState.QLD]: {
    name: 'Queensland Revenue Office',
    website: 'https://www.treasury.qld.gov.au/revenue',
    phone: '1300 300 734',
  },
  [AustralianState.SA]: {
    name: 'RevenueSA',
    website: 'https://www.revenuesa.sa.gov.au',
    phone: '1300 366 150',
  },
  [AustralianState.WA]: {
    name: 'Revenue WA',
    website: 'https://www.wa.gov.au/organisation/department-of-finance',
    phone: '08 9262 1100',
  },
  [AustralianState.TAS]: {
    name: 'State Revenue Office Tasmania',
    website: 'https://www.sro.tas.gov.au',
    phone: '1300 135 513',
  },
  [AustralianState.NT]: {
    name: 'Territory Revenue Office',
    website: 'https://territorystories.nt.gov.au',
    phone: '08 8999 7368',
  },
  [AustralianState.ACT]: {
    name: 'ACT Revenue Office',
    website: 'https://www.revenue.act.gov.au',
    phone: '02 6207 0028',
  },
} as const;

/**
 * Stamp duty (transfer duty) rates by state
 * Note: These are state taxes on property transfers
 */
export const STAMP_DUTY_INFO = {
  [AustralianState.NSW]: {
    description: 'NSW transfer (stamp) duty on property',
    calculator: 'https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/transfer-duty',
    firstHomeBuyerConcession: true,
  },
  [AustralianState.VIC]: {
    description: 'Victoria stamp duty on property',
    calculator: 'https://www.sro.vic.gov.au/duty',
    firstHomeBuyerConcession: true,
  },
  [AustralianState.QLD]: {
    description: 'Queensland transfer duty',
    calculator: 'https://www.qld.gov.au/housing/buying-owning-home/transfer-duty',
    firstHomeBuyerConcession: true,
  },
  [AustralianState.SA]: {
    description: 'South Australia stamp duty',
    calculator: 'https://www.revenuesa.sa.gov.au/stampduty',
    firstHomeBuyerConcession: true,
  },
  [AustralianState.WA]: {
    description: 'Western Australia transfer duty',
    calculator: 'https://www.wa.gov.au/service/financial-management/taxation/calculate-transfer-duty',
    firstHomeBuyerConcession: true,
  },
  [AustralianState.TAS]: {
    description: 'Tasmania stamp duty',
    calculator: 'https://www.sro.tas.gov.au/property-taxes/property-duty',
    firstHomeBuyerConcession: true,
  },
  [AustralianState.NT]: {
    description: 'Northern Territory stamp duty',
    calculator: 'https://nt.gov.au/property/buying-property/stamp-duty',
    firstHomeBuyerConcession: true,
  },
  [AustralianState.ACT]: {
    description: 'ACT conveyance duty',
    calculator: 'https://www.revenue.act.gov.au/duties/conveyance-duty',
    firstHomeBuyerConcession: true,
  },
} as const;

/**
 * Workers compensation schemes by state
 */
export const WORKERS_COMPENSATION = {
  [AustralianState.NSW]: {
    name: 'icare NSW',
    website: 'https://www.icare.nsw.gov.au',
    mandatory: true,
  },
  [AustralianState.VIC]: {
    name: 'WorkSafe Victoria',
    website: 'https://www.worksafe.vic.gov.au',
    mandatory: true,
  },
  [AustralianState.QLD]: {
    name: 'WorkCover Queensland',
    website: 'https://www.worksafe.qld.gov.au',
    mandatory: true,
  },
  [AustralianState.SA]: {
    name: 'ReturnToWorkSA',
    website: 'https://www.rtwsa.com',
    mandatory: true,
  },
  [AustralianState.WA]: {
    name: 'WorkCover WA',
    website: 'https://www.workcover.wa.gov.au',
    mandatory: true,
  },
  [AustralianState.TAS]: {
    name: 'WorkSafe Tasmania',
    website: 'https://worksafe.tas.gov.au',
    mandatory: true,
  },
  [AustralianState.NT]: {
    name: 'NT WorkSafe',
    website: 'https://worksafe.nt.gov.au',
    mandatory: true,
  },
  [AustralianState.ACT]: {
    name: 'WorkSafe ACT',
    website: 'https://www.worksafe.act.gov.au',
    mandatory: true,
  },
} as const;

/**
 * State business registration portals
 */
export const BUSINESS_REGISTRATION = {
  FEDERAL: {
    name: 'Australian Business Register (ABR)',
    website: 'https://www.abr.gov.au',
    description: 'Register for ABN, GST, and other federal business registrations',
  },
  ASIC: {
    name: 'Australian Securities & Investments Commission',
    website: 'https://www.asic.gov.au',
    description: 'Register companies and business names',
  },
} as const;

/**
 * Get state-specific tax information
 */
export function getStateInfo(state: AustralianState): {
  stateName: string;
  revenueOffice: typeof REVENUE_OFFICES[AustralianState];
  hasPayrollTax: boolean;
  hasLandTax: boolean;
  hasStampDuty: boolean;
} {
  const stateNames: Record<AustralianState, string> = {
    [AustralianState.NSW]: 'New South Wales',
    [AustralianState.VIC]: 'Victoria',
    [AustralianState.QLD]: 'Queensland',
    [AustralianState.SA]: 'South Australia',
    [AustralianState.WA]: 'Western Australia',
    [AustralianState.TAS]: 'Tasmania',
    [AustralianState.NT]: 'Northern Territory',
    [AustralianState.ACT]: 'Australian Capital Territory',
  };

  return {
    stateName: stateNames[state],
    revenueOffice: REVENUE_OFFICES[state],
    hasPayrollTax: true,
    hasLandTax: state !== AustralianState.NT,
    hasStampDuty: true,
  };
}
