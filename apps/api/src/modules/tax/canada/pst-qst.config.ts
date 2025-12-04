/**
 * Canadian PST/QST Configuration
 * Task: W26-T4 - Canadian/Australian tax rules
 */

import { CanadianProvince } from '@operate/shared/types/tax/canada-tax.types';

/**
 * Provincial Sales Tax (PST) rates
 */
export const PST_RATES = {
  [CanadianProvince.BC]: 7,
  [CanadianProvince.MB]: 7,
  [CanadianProvince.SK]: 6,
} as const;

/**
 * Quebec Sales Tax (QST) rate
 * Note: QST is calculated on GST-inclusive amount
 */
export const QST_RATE = 9.975;

/**
 * BC PST Configuration
 */
export const BC_PST_CONFIG = {
  rate: 7,
  registrationThreshold: 10000, // Annual revenue from taxable sales in BC
  exemptions: [
    'Food for human consumption (with exceptions)',
    'Books, newspapers, magazines',
    'Children\'s clothing and footwear',
    'Bicycles (under $1,000)',
    'Most services',
    'Production machinery and equipment',
  ],
  taxableItems: [
    'Alcohol',
    'Tobacco products',
    'Motor vehicles (7-20% depending on price)',
    'Software (unless downloaded)',
    'Telecommunication services',
    'Legal services',
    'Accommodation (hotel tax)',
  ],
  specialRates: {
    PASSENGER_VEHICLES: {
      under_55000: 7,
      from_55000_to_56000: 8,
      from_56000_to_57000: 9,
      // ... progressive rates up to 20%
      over_125000: 20,
    },
    LIQUOR: 10,
  },
};

/**
 * Manitoba PST (RST) Configuration
 */
export const MB_PST_CONFIG = {
  rate: 7,
  officialName: 'Retail Sales Tax (RST)',
  registrationThreshold: 10000,
  exemptions: [
    'Most services',
    'Prescription drugs',
    'Children\'s clothing and footwear',
    'Books',
  ],
  taxableItems: [
    'Tangible personal property',
    'Insurance premiums',
    'Telecommunications services',
    'Accommodation',
  ],
};

/**
 * Saskatchewan PST Configuration
 */
export const SK_PST_CONFIG = {
  rate: 6,
  registrationThreshold: 10000,
  exemptions: [
    'Most services',
    'Children\'s clothing and footwear (under size 7)',
    'Basic groceries',
    'Prescription drugs',
    'Books and magazines',
  ],
  taxableItems: [
    'Tangible personal property',
    'Accommodation',
    'Prepared meals',
    'Insurance premiums',
  ],
};

/**
 * Quebec QST Configuration
 */
export const QC_QST_CONFIG = {
  rate: 9.975,
  registrationThreshold: 30000, // Same as GST threshold
  calculationMethod: 'ON_GST_INCLUSIVE_AMOUNT',
  description: 'QST is calculated on the price including GST',
  example: {
    basePrice: 100,
    gst: 5, // 5% of $100
    gstInclusivePrice: 105,
    qst: 10.47, // 9.975% of $105
    total: 115.47,
  },
  forms: {
    registration: 'LM-1',
    return: 'FPZ-500',
    filingFrequency: 'Quarterly or monthly, depending on revenue',
  },
  specialRules: [
    'Separate registration required with Revenu Quebec',
    'QST number format: 1234567890 TQ 0001',
    'Different rules for prepared food vs. groceries',
    'Special rules for books',
  ],
  exemptions: [
    'Basic groceries',
    'Prescription drugs',
    'Residential rent',
    'Most health and dental services',
    'Daycare services',
    'Educational services',
  ],
  reducedRates: {
    description: 'Some items may have reduced QST rates',
    examples: [
      'Meals under $4 (exempt)',
      'Books (special treatment)',
    ],
  },
};

/**
 * PST/QST Registration Numbers
 */
export const PST_QST_NUMBER_FORMATS = {
  BC_PST: {
    format: 'PST-XXXX-XXXX',
    length: 12,
    example: 'PST-1234-5678',
  },
  MB_RST: {
    format: 'XXX-XXX-XXX-RT-XXXX',
    description: 'Manitoba RST number',
  },
  SK_PST: {
    format: 'XXXXXXX',
    length: 7,
    example: '1234567',
  },
  QC_QST: {
    format: 'XXXXXXXXXX TQ XXXX',
    description: '10-digit number + TQ + 4-digit reference',
    example: '1234567890 TQ 0001',
  },
};

/**
 * Filing frequencies for PST/QST
 */
export const PST_QST_FILING = {
  BC: {
    monthly: { minRevenue: 120000 },
    quarterly: { maxRevenue: 120000 },
    annual: { maxRevenue: 12000 },
  },
  MB: {
    monthly: { minRevenue: 120000 },
    quarterly: { maxRevenue: 120000 },
    annual: { special: 'Available by application' },
  },
  SK: {
    monthly: { minRevenue: 120000 },
    quarterly: { maxRevenue: 120000 },
    annual: { special: 'Available by application' },
  },
  QC: {
    monthly: { minRevenue: 6000000 },
    quarterly: { maxRevenue: 6000000 },
    annual: { maxRevenue: 1500000 },
  },
};

/**
 * Combined GST + PST/QST effective rates
 */
export const COMBINED_RATES = {
  [CanadianProvince.BC]: {
    gst: 5,
    pst: 7,
    combined: 12,
    calculation: 'Separate (GST + PST both on base price)',
  },
  [CanadianProvince.MB]: {
    gst: 5,
    pst: 7,
    combined: 12,
    calculation: 'Separate (GST + PST both on base price)',
  },
  [CanadianProvince.SK]: {
    gst: 5,
    pst: 6,
    combined: 11,
    calculation: 'Separate (GST + PST both on base price)',
  },
  [CanadianProvince.QC]: {
    gst: 5,
    qst: 9.975,
    combined: 14.975,
    calculation: 'QST calculated on GST-inclusive amount',
    example: 'On $100: GST=$5, QST=$10.47 (9.975% of $105), Total=$115.47',
  },
};

/**
 * Get PST/QST rate for a province
 */
export function getPSTQSTRate(province: CanadianProvince): number | null {
  if (province === CanadianProvince.QC) {
    return QST_RATE;
  }
  return PST_RATES[province as keyof typeof PST_RATES] ?? null;
}

/**
 * Check if province has PST/QST
 */
export function hasPSTQST(province: CanadianProvince): boolean {
  return (
    province === CanadianProvince.BC ||
    province === CanadianProvince.MB ||
    province === CanadianProvince.SK ||
    province === CanadianProvince.QC
  );
}

/**
 * Get provincial tax name
 */
export function getProvincialTaxName(province: CanadianProvince): string | null {
  switch (province) {
    case CanadianProvince.BC:
    case CanadianProvince.SK:
      return 'PST';
    case CanadianProvince.MB:
      return 'RST';
    case CanadianProvince.QC:
      return 'QST';
    default:
      return null;
  }
}
