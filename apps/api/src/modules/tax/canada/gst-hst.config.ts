/**
 * Canadian GST/HST Configuration
 * Task: W26-T4 - Canadian/Australian tax rules
 */

import { CanadianProvince } from '@operate/shared/types/tax/canada-tax.types';

/**
 * Current GST/HST rates by province (as of 2024)
 */
export const GST_HST_RATES = {
  FEDERAL_GST: 5,
  HST: {
    [CanadianProvince.ON]: 13,
    [CanadianProvince.NB]: 15,
    [CanadianProvince.NL]: 15,
    [CanadianProvince.NS]: 15,
    [CanadianProvince.PE]: 15,
  },
  GST_ONLY: {
    [CanadianProvince.AB]: 5,
    [CanadianProvince.BC]: 5,
    [CanadianProvince.MB]: 5,
    [CanadianProvince.QC]: 5,
    [CanadianProvince.SK]: 5,
    [CanadianProvince.NT]: 5,
    [CanadianProvince.NU]: 5,
    [CanadianProvince.YT]: 5,
  },
} as const;

/**
 * HST breakdown into federal and provincial components
 */
export const HST_BREAKDOWN = {
  [CanadianProvince.ON]: {
    total: 13,
    federal: 5,
    provincial: 8,
  },
  [CanadianProvince.NB]: {
    total: 15,
    federal: 5,
    provincial: 10,
  },
  [CanadianProvince.NL]: {
    total: 15,
    federal: 5,
    provincial: 10,
  },
  [CanadianProvince.NS]: {
    total: 15,
    federal: 5,
    provincial: 10,
  },
  [CanadianProvince.PE]: {
    total: 15,
    federal: 5,
    provincial: 10,
  },
} as const;

/**
 * GST/HST registration thresholds
 */
export const GST_HST_THRESHOLDS = {
  SMALL_SUPPLIER: 30000, // Annual taxable supplies threshold
  TAXI_DRIVER: 30000,
  PUBLIC_SERVICE_BODY: 50000, // For charities, non-profits, municipalities
  RIDESHARE_DRIVER: 30000,
} as const;

/**
 * Filing frequencies based on annual revenue
 */
export const GST_HST_FILING_FREQUENCY = {
  ANNUAL: {
    description: 'Annual filing',
    maxRevenue: 1500000,
    filingDeadline: 'June 15 (or 3 months after fiscal year-end)',
    paymentDeadline: 'Same as filing deadline',
  },
  QUARTERLY: {
    description: 'Quarterly filing',
    maxRevenue: 6000000,
    filingDeadline: 'One month after quarter end',
    paymentDeadline: 'Same as filing deadline',
  },
  MONTHLY: {
    description: 'Monthly filing',
    minRevenue: 6000000,
    filingDeadline: 'One month after period end',
    paymentDeadline: 'Same as filing deadline',
  },
} as const;

/**
 * GST/HST return forms
 */
export const GST_HST_FORMS = {
  GST34: {
    name: 'GST34',
    description: 'GST/HST Return for Registrants',
    applicableTo: ['Regular filers'],
  },
  GST62: {
    name: 'GST62',
    description: 'GST/HST Return (Non-personalized)',
    applicableTo: ['Businesses without a personalized return'],
  },
  RC7200: {
    name: 'RC7200',
    description: 'GST/HST Rebate Application',
    applicableTo: ['Public service bodies'],
  },
  RC7066: {
    name: 'RC7066',
    description: 'GST/HST Public Service Bodies Rebate',
    applicableTo: ['Charities, non-profits'],
  },
} as const;

/**
 * Input Tax Credit (ITC) rules
 */
export const ITC_RULES = {
  DESCRIPTION:
    'Input Tax Credits allow businesses to recover GST/HST paid on business expenses',
  ELIGIBILITY: [
    'Must be registered for GST/HST',
    'Expense must be for commercial activities',
    'Must have proper documentation',
  ],
  DOCUMENTATION_REQUIREMENTS: {
    UNDER_30: 'Business name of supplier',
    BETWEEN_30_AND_149:
      'Business name, invoice date, total amount paid or payable',
    BETWEEN_150_AND_999:
      'Supplier registration number, terms of payment, description of goods/services',
    OVER_1000: 'All above plus recipient information and supplier information',
  },
  TIME_LIMIT: '4 years from the due date of the return',
} as const;

/**
 * Zero-rated supplies (0% GST/HST but can claim ITCs)
 */
export const ZERO_RATED_SUPPLIES = [
  'Basic groceries',
  'Most farm livestock',
  'Most fishery products',
  'Prescription drugs and drug-dispensing services',
  'Feminine hygiene products',
  'Certain medical devices',
  'Exports',
  'International transportation services',
] as const;

/**
 * Exempt supplies (no GST/HST, cannot claim ITCs)
 */
export const EXEMPT_SUPPLIES = [
  'Long-term residential rent (>30 days)',
  'Most health, medical, and dental services',
  'Educational services (lesson, course, program)',
  'Childcare services',
  'Legal aid services',
  'Music lessons',
  'Most financial services',
  'Ferry, road, and bridge tolls',
] as const;

/**
 * Point-of-sale rebates
 */
export const POINT_OF_SALE_REBATES = {
  CHILDREN_PRODUCTS: {
    description: 'Point-of-sale rebate for children\'s products',
    applicableProvinces: [
      CanadianProvince.ON,
      CanadianProvince.NB,
      CanadianProvince.NL,
      CanadianProvince.NS,
      CanadianProvince.PE,
    ],
    items: [
      'Children\'s clothing (under size 14)',
      'Children\'s footwear (under size 6)',
      'Children\'s diapers',
      'Children\'s car seats and car booster seats',
    ],
    rebateAmount: 'Provincial portion of HST',
  },
  PRINTED_BOOKS: {
    description: 'Point-of-sale rebate for printed books',
    applicableProvinces: [CanadianProvince.ON],
    items: ['Printed books (excluding materials primarily directed at children)'],
    rebateAmount: 'Provincial portion of HST',
  },
} as const;

/**
 * Quick Method of Accounting
 */
export const QUICK_METHOD = {
  DESCRIPTION:
    'Simplified accounting method for small businesses to calculate net tax',
  ELIGIBILITY: {
    maxAnnualRevenue: 400000,
    excludedBusinesses: ['Lawyers', 'Accountants', 'Bookkeepers'],
  },
  REMITTANCE_RATES: {
    [CanadianProvince.ON]: {
      firstSupplier: 8.8,
      other: 10.8,
    },
    [CanadianProvince.BC]: {
      firstSupplier: 3.6,
      other: 5.6,
    },
    [CanadianProvince.QC]: {
      firstSupplier: 3.6,
      other: 5.6,
    },
    // Add other provinces as needed
  },
} as const;

/**
 * Special quick method for public service bodies
 */
export const PSB_QUICK_METHOD = {
  DESCRIPTION: 'Special quick method for eligible public service bodies',
  RATE: 'Varies by type of organization',
} as const;
