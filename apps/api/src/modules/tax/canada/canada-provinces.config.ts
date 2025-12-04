/**
 * Canadian Province-Specific Tax Rules Configuration
 * Task: W26-T4 - Canadian/Australian tax rules
 */

import {
  CanadianProvince,
  CanadianProvinceTaxRules,
} from '@operate/shared/types/tax/canada-tax.types';

/**
 * Detailed tax rules for each Canadian province/territory
 */
export const CANADIAN_PROVINCE_TAX_RULES: Record<
  CanadianProvince,
  CanadianProvinceTaxRules
> = {
  [CanadianProvince.ON]: {
    province: CanadianProvince.ON,
    provinceName: 'Ontario',
    taxSystem: 'HST',
    rates: {
      provincial: 8,
      federal: 5,
      combined: 13,
    },
    registrationThreshold: 30000,
    smallSupplierThreshold: 30000,
    filingFrequency: {
      annual: { maxRevenue: 1500000 },
      quarterly: { maxRevenue: 6000000 },
      monthly: { minRevenue: 6000000 },
    },
    specialRules: [
      'Point-of-sale rebates available for printed books',
      'First Nations tax exemptions apply on reserves',
    ],
  },
  [CanadianProvince.QC]: {
    province: CanadianProvince.QC,
    provinceName: 'Quebec',
    taxSystem: 'GST_QST',
    rates: {
      federal: 5,
      provincial: 9.975,
      combined: 14.975,
    },
    registrationThreshold: 30000,
    smallSupplierThreshold: 30000,
    filingFrequency: {
      annual: { maxRevenue: 1500000 },
      quarterly: { maxRevenue: 6000000 },
      monthly: { minRevenue: 6000000 },
    },
    specialRules: [
      'QST is calculated on GST-inclusive price',
      'Separate QST registration required from Revenu Quebec',
      'QST number format: 1234567890 TQ 0001',
      'Special rules for food and beverages',
    ],
  },
  [CanadianProvince.BC]: {
    province: CanadianProvince.BC,
    provinceName: 'British Columbia',
    taxSystem: 'GST_PST',
    rates: {
      federal: 5,
      provincial: 7,
      combined: 12,
    },
    registrationThreshold: 30000,
    smallSupplierThreshold: 30000,
    filingFrequency: {
      annual: { maxRevenue: 1500000 },
      quarterly: { maxRevenue: 6000000 },
      monthly: { minRevenue: 6000000 },
    },
    specialRules: [
      'PST applies to tangible personal property and software',
      'Services generally not subject to PST',
      'Motor vehicle PST rate is 7-20% depending on price',
      'PST exemptions for production machinery and equipment',
    ],
  },
  [CanadianProvince.AB]: {
    province: CanadianProvince.AB,
    provinceName: 'Alberta',
    taxSystem: 'GST_ONLY',
    rates: {
      federal: 5,
      combined: 5,
    },
    registrationThreshold: 30000,
    smallSupplierThreshold: 30000,
    filingFrequency: {
      annual: { maxRevenue: 1500000 },
      quarterly: { maxRevenue: 6000000 },
      monthly: { minRevenue: 6000000 },
    },
    specialRules: [
      'No provincial sales tax',
      'Tourism levy in some municipalities',
    ],
  },
  [CanadianProvince.MB]: {
    province: CanadianProvince.MB,
    provinceName: 'Manitoba',
    taxSystem: 'GST_PST',
    rates: {
      federal: 5,
      provincial: 7,
      combined: 12,
    },
    registrationThreshold: 30000,
    smallSupplierThreshold: 30000,
    filingFrequency: {
      annual: { maxRevenue: 1500000 },
      quarterly: { maxRevenue: 6000000 },
      monthly: { minRevenue: 6000000 },
    },
    specialRules: [
      'PST called Retail Sales Tax (RST)',
      'Most services exempt from PST',
      'Insurance premiums subject to PST',
    ],
  },
  [CanadianProvince.SK]: {
    province: CanadianProvince.SK,
    provinceName: 'Saskatchewan',
    taxSystem: 'GST_PST',
    rates: {
      federal: 5,
      provincial: 6,
      combined: 11,
    },
    registrationThreshold: 30000,
    smallSupplierThreshold: 30000,
    filingFrequency: {
      annual: { maxRevenue: 1500000 },
      quarterly: { maxRevenue: 6000000 },
      monthly: { minRevenue: 6000000 },
    },
    specialRules: [
      'PST applies to goods and some services',
      'Accommodation subject to PST',
      'Children\'s clothing and footwear exempt',
    ],
  },
  [CanadianProvince.NB]: {
    province: CanadianProvince.NB,
    provinceName: 'New Brunswick',
    taxSystem: 'HST',
    rates: {
      federal: 5,
      provincial: 10,
      combined: 15,
    },
    registrationThreshold: 30000,
    smallSupplierThreshold: 30000,
    filingFrequency: {
      annual: { maxRevenue: 1500000 },
      quarterly: { maxRevenue: 6000000 },
      monthly: { minRevenue: 6000000 },
    },
    specialRules: [
      'Point-of-sale rebates for children\'s products',
      'Special rules for First Nations',
    ],
  },
  [CanadianProvince.NS]: {
    province: CanadianProvince.NS,
    provinceName: 'Nova Scotia',
    taxSystem: 'HST',
    rates: {
      federal: 5,
      provincial: 10,
      combined: 15,
    },
    registrationThreshold: 30000,
    smallSupplierThreshold: 30000,
    filingFrequency: {
      annual: { maxRevenue: 1500000 },
      quarterly: { maxRevenue: 6000000 },
      monthly: { minRevenue: 6000000 },
    },
    specialRules: [
      'Point-of-sale rebates for children\'s products',
      'Special rules for First Nations',
    ],
  },
  [CanadianProvince.PE]: {
    province: CanadianProvince.PE,
    provinceName: 'Prince Edward Island',
    taxSystem: 'HST',
    rates: {
      federal: 5,
      provincial: 10,
      combined: 15,
    },
    registrationThreshold: 30000,
    smallSupplierThreshold: 30000,
    filingFrequency: {
      annual: { maxRevenue: 1500000 },
      quarterly: { maxRevenue: 6000000 },
      monthly: { minRevenue: 6000000 },
    },
    specialRules: [
      'Point-of-sale rebates for children\'s products',
      'Special rules for First Nations',
    ],
  },
  [CanadianProvince.NL]: {
    province: CanadianProvince.NL,
    provinceName: 'Newfoundland and Labrador',
    taxSystem: 'HST',
    rates: {
      federal: 5,
      provincial: 10,
      combined: 15,
    },
    registrationThreshold: 30000,
    smallSupplierThreshold: 30000,
    filingFrequency: {
      annual: { maxRevenue: 1500000 },
      quarterly: { maxRevenue: 6000000 },
      monthly: { minRevenue: 6000000 },
    },
    specialRules: [
      'Point-of-sale rebates for children\'s products',
      'Special rules for First Nations',
    ],
  },
  [CanadianProvince.NT]: {
    province: CanadianProvince.NT,
    provinceName: 'Northwest Territories',
    taxSystem: 'GST_ONLY',
    rates: {
      federal: 5,
      combined: 5,
    },
    registrationThreshold: 30000,
    smallSupplierThreshold: 30000,
    filingFrequency: {
      annual: { maxRevenue: 1500000 },
      quarterly: { maxRevenue: 6000000 },
      monthly: { minRevenue: 6000000 },
    },
    specialRules: [
      'No territorial sales tax',
      'Special considerations for remote communities',
    ],
  },
  [CanadianProvince.NU]: {
    province: CanadianProvince.NU,
    provinceName: 'Nunavut',
    taxSystem: 'GST_ONLY',
    rates: {
      federal: 5,
      combined: 5,
    },
    registrationThreshold: 30000,
    smallSupplierThreshold: 30000,
    filingFrequency: {
      annual: { maxRevenue: 1500000 },
      quarterly: { maxRevenue: 6000000 },
      monthly: { minRevenue: 6000000 },
    },
    specialRules: [
      'No territorial sales tax',
      'Special considerations for remote communities',
    ],
  },
  [CanadianProvince.YT]: {
    province: CanadianProvince.YT,
    provinceName: 'Yukon',
    taxSystem: 'GST_ONLY',
    rates: {
      federal: 5,
      combined: 5,
    },
    registrationThreshold: 30000,
    smallSupplierThreshold: 30000,
    filingFrequency: {
      annual: { maxRevenue: 1500000 },
      quarterly: { maxRevenue: 6000000 },
      monthly: { minRevenue: 6000000 },
    },
    specialRules: [
      'No territorial sales tax',
      'Special considerations for remote communities',
    ],
  },
};

/**
 * Get tax rules for a specific province
 */
export function getProvinceTaxRules(
  province: CanadianProvince,
): CanadianProvinceTaxRules {
  return CANADIAN_PROVINCE_TAX_RULES[province];
}

/**
 * Get all provinces with a specific tax system
 */
export function getProvincesByTaxSystem(
  taxSystem: 'HST' | 'GST_PST' | 'GST_QST' | 'GST_ONLY',
): CanadianProvince[] {
  return Object.values(CanadianProvince).filter(
    (province) => CANADIAN_PROVINCE_TAX_RULES[province].taxSystem === taxSystem,
  );
}
