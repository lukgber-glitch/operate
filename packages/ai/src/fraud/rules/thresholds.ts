/**
 * Country-Specific Threshold Configurations
 *
 * Conservative limits based on tax regulations and typical business expenses.
 */

import { ThresholdConfig } from '../types';

/**
 * German (DE) thresholds
 */
export const GERMANY_THRESHOLDS: ThresholdConfig[] = [
  // Business Meals (Bewirtungskosten)
  {
    countryCode: 'DE',
    categoryCode: 'BUSINESS_MEALS',
    perTransactionLimit: 25000, // €250 per meal (generous)
    annualLimit: 500000, // €5,000 annual (conservative)
    warningThreshold: 0.8,
  },

  // Work Equipment (Arbeitsmittel) - Below GWG limit
  {
    countryCode: 'DE',
    categoryCode: 'WORK_EQUIPMENT',
    perTransactionLimit: 80000, // €800 (GWG limit)
    warningThreshold: 0.9,
  },

  // Home Office (Häusliches Arbeitszimmer)
  {
    countryCode: 'DE',
    categoryCode: 'HOME_OFFICE',
    annualLimit: 126000, // €1,260 (legal limit)
    warningThreshold: 1.0, // Warn immediately at limit
  },

  // Vehicle - Business Use (Fahrtkosten)
  {
    countryCode: 'DE',
    categoryCode: 'VEHICLE_BUSINESS',
    monthlyLimit: 200000, // €2,000 monthly
    annualLimit: 2400000, // €24,000 annual
    warningThreshold: 0.85,
  },

  // Travel - Accommodation
  {
    countryCode: 'DE',
    categoryCode: 'TRAVEL_ACCOMMODATION',
    perTransactionLimit: 30000, // €300 per night
    monthlyLimit: 200000, // €2,000 monthly
    warningThreshold: 0.8,
  },

  // Travel - Meals (while traveling)
  {
    countryCode: 'DE',
    categoryCode: 'TRAVEL_MEALS',
    dailyLimit: 7000, // €70 per day (generous)
    monthlyLimit: 150000, // €1,500 monthly
    warningThreshold: 0.8,
  },

  // Professional Services
  {
    countryCode: 'DE',
    categoryCode: 'PROFESSIONAL_SERVICES',
    perTransactionLimit: 500000, // €5,000 per service
    annualLimit: 5000000, // €50,000 annual
    warningThreshold: 0.85,
  },

  // Office Supplies
  {
    countryCode: 'DE',
    categoryCode: 'OFFICE_SUPPLIES',
    monthlyLimit: 50000, // €500 monthly
    annualLimit: 600000, // €6,000 annual
    warningThreshold: 0.8,
  },

  // Telephone & Internet
  {
    countryCode: 'DE',
    categoryCode: 'TELEPHONE_INTERNET',
    monthlyLimit: 15000, // €150 monthly
    annualLimit: 180000, // €1,800 annual
    warningThreshold: 0.9,
  },

  // Professional Development
  {
    countryCode: 'DE',
    categoryCode: 'PROFESSIONAL_DEVELOPMENT',
    perTransactionLimit: 300000, // €3,000 per course
    annualLimit: 1000000, // €10,000 annual
    warningThreshold: 0.85,
  },

  // Insurance - Business
  {
    countryCode: 'DE',
    categoryCode: 'INSURANCE_BUSINESS',
    monthlyLimit: 50000, // €500 monthly
    annualLimit: 600000, // €6,000 annual
    warningThreshold: 0.9,
  },

  // Marketing & Advertising
  {
    countryCode: 'DE',
    categoryCode: 'MARKETING_ADVERTISING',
    monthlyLimit: 300000, // €3,000 monthly
    annualLimit: 3600000, // €36,000 annual
    warningThreshold: 0.85,
  },

  // Software & Subscriptions
  {
    countryCode: 'DE',
    categoryCode: 'SOFTWARE_SUBSCRIPTIONS',
    monthlyLimit: 100000, // €1,000 monthly
    annualLimit: 1200000, // €12,000 annual
    warningThreshold: 0.9,
  },

  // Bank Fees
  {
    countryCode: 'DE',
    categoryCode: 'BANK_FEES',
    monthlyLimit: 10000, // €100 monthly
    annualLimit: 120000, // €1,200 annual
    warningThreshold: 0.8,
  },
];

/**
 * Austrian (AT) thresholds
 */
export const AUSTRIA_THRESHOLDS: ThresholdConfig[] = [
  // Business Meals
  {
    countryCode: 'AT',
    categoryCode: 'BUSINESS_MEALS',
    perTransactionLimit: 25000, // €250 per meal
    annualLimit: 500000, // €5,000 annual
    warningThreshold: 0.8,
  },

  // Home Office
  {
    countryCode: 'AT',
    categoryCode: 'HOME_OFFICE',
    annualLimit: 130000, // €1,300 (typical limit)
    warningThreshold: 1.0,
  },

  // Work Equipment - Below immediate write-off limit
  {
    countryCode: 'AT',
    categoryCode: 'WORK_EQUIPMENT',
    perTransactionLimit: 100000, // €1,000 (conservative)
    warningThreshold: 0.9,
  },

  // Vehicle - Business Use
  {
    countryCode: 'AT',
    categoryCode: 'VEHICLE_BUSINESS',
    monthlyLimit: 200000, // €2,000 monthly
    annualLimit: 2400000, // €24,000 annual
    warningThreshold: 0.85,
  },

  // Professional Services
  {
    countryCode: 'AT',
    categoryCode: 'PROFESSIONAL_SERVICES',
    perTransactionLimit: 500000, // €5,000 per service
    annualLimit: 5000000, // €50,000 annual
    warningThreshold: 0.85,
  },
];

/**
 * Get thresholds for a country
 */
export function getCountryThresholds(countryCode: string): ThresholdConfig[] {
  switch (countryCode.toUpperCase()) {
    case 'DE':
      return GERMANY_THRESHOLDS;
    case 'AT':
      return AUSTRIA_THRESHOLDS;
    default:
      // Return conservative defaults for unknown countries
      return getDefaultThresholds(countryCode);
  }
}

/**
 * Get threshold for specific category
 */
export function getCategoryThreshold(
  countryCode: string,
  categoryCode: string,
): ThresholdConfig | undefined {
  const countryThresholds = getCountryThresholds(countryCode);
  return countryThresholds.find((t) => t.categoryCode === categoryCode);
}

/**
 * Get default thresholds for unknown countries
 */
function getDefaultThresholds(countryCode: string): ThresholdConfig[] {
  return [
    {
      countryCode,
      categoryCode: 'BUSINESS_MEALS',
      perTransactionLimit: 20000, // €200 (conservative)
      annualLimit: 400000, // €4,000 annual
      warningThreshold: 0.75,
    },
    {
      countryCode,
      categoryCode: 'WORK_EQUIPMENT',
      perTransactionLimit: 50000, // €500 (very conservative)
      warningThreshold: 0.85,
    },
    {
      countryCode,
      categoryCode: 'VEHICLE_BUSINESS',
      monthlyLimit: 150000, // €1,500 monthly
      annualLimit: 1800000, // €18,000 annual
      warningThreshold: 0.8,
    },
    {
      countryCode,
      categoryCode: 'PROFESSIONAL_SERVICES',
      perTransactionLimit: 300000, // €3,000
      annualLimit: 3000000, // €30,000 annual
      warningThreshold: 0.8,
    },
  ];
}

/**
 * Check if category has strict limits
 */
export function hasStrictLimits(categoryCode: string): boolean {
  const strictCategories = [
    'HOME_OFFICE',
    'BUSINESS_MEALS',
    'WORK_EQUIPMENT',
  ];

  return strictCategories.includes(categoryCode);
}
