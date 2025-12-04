/**
 * Tax rate constants for Germany and Austria
 * Updated for 2024 tax year
 */

export const GERMAN_TAX_BRACKETS_2024 = [
  {
    min: 0,
    max: 11604,
    rate: 0,
    description: 'Grundfreibetrag (Basic Tax-Free Allowance)',
  },
  {
    min: 11604,
    max: 17005,
    rate: 14,
    description: 'Progressive Zone 1',
  },
  {
    min: 17005,
    max: 66760,
    rate: 24,
    description: 'Progressive Zone 2',
  },
  {
    min: 66760,
    max: 277825,
    rate: 42,
    description: 'Top Tax Rate',
  },
  {
    min: 277825,
    max: null,
    rate: 45,
    description: 'Reichensteuer (Rich Tax)',
  },
];

export const AUSTRIAN_TAX_BRACKETS_2024 = [
  {
    min: 0,
    max: 12816,
    rate: 0,
    description: 'Tax-Free Amount',
  },
  {
    min: 12816,
    max: 20818,
    rate: 20,
    description: 'First Bracket',
  },
  {
    min: 20818,
    max: 34513,
    rate: 30,
    description: 'Second Bracket',
  },
  {
    min: 34513,
    max: 66612,
    rate: 40,
    description: 'Third Bracket',
  },
  {
    min: 66612,
    max: 99266,
    rate: 48,
    description: 'Fourth Bracket',
  },
  {
    min: 99266,
    max: 1000000,
    rate: 50,
    description: 'Top Rate',
  },
  {
    min: 1000000,
    max: null,
    rate: 55,
    description: "Millionaire's Tax",
  },
];

export const GERMAN_VAT_RATES = {
  standard: 19,
  reduced: 7,
  zero: 0,
  description: {
    standard: 'Standard rate for most goods and services',
    reduced: 'Reduced rate for food, books, newspapers, public transport',
    zero: 'Zero-rated exports and intra-EU supplies',
  },
};

export const AUSTRIAN_VAT_RATES = {
  standard: 20,
  reduced: 10,
  superReduced: 13,
  zero: 0,
  description: {
    standard: 'Standard rate for most goods and services',
    reduced: 'Reduced rate for food, books, cultural events',
    superReduced: 'Super-reduced rate for accommodation, wine from farmers',
    zero: 'Zero-rated exports and intra-EU supplies',
  },
};

export const GERMAN_TRADE_TAX = {
  baseRate: 3.5, // Steuermesszahl
  defaultMultiplier: 400, // Average Hebesatz
  exemptionThreshold: 24500, // Freibetrag for sole proprietors
  description: 'Gewerbesteuer - Municipal business tax',
};

export const DEDUCTION_LIMITS_GERMANY = {
  homeOffice: {
    dailyRate: 6, // EUR per day
    maxDays: 210, // Maximum 210 days per year
    maxAnnual: 1260, // 6 * 210 = 1260 EUR
    description: 'Home office flat rate (Homeoffice-Pauschale)',
  },
  mileage: {
    rate: 0.30, // EUR per km
    commutingRate: 0.30, // First 20km
    longDistanceRate: 0.38, // Above 20km (from 2024)
    description: 'Business mileage deduction',
  },
  entertainment: {
    deductiblePercent: 70,
    nonDeductiblePercent: 30,
    description: 'Business meals and entertainment - 70% deductible',
  },
  workingMaterials: {
    lowValueAssets: 800, // GWG (Geringwertige Wirtschaftsgüter) threshold
    description: 'Low-value assets can be fully expensed',
  },
};

export const DEDUCTION_LIMITS_AUSTRIA = {
  homeOffice: {
    maxAnnual: 1200, // EUR per year (simplified)
    detailedCalculation: true, // Can claim actual costs with proof
    description: 'Home office deduction',
  },
  mileage: {
    rate: 0.42, // EUR per km
    description: 'Business mileage deduction',
  },
  entertainment: {
    deductiblePercent: 50,
    nonDeductiblePercent: 50,
    description: 'Business meals and entertainment - 50% deductible',
  },
  workingMaterials: {
    lowValueAssets: 1000, // Can be fully expensed
    description: 'Low-value assets threshold',
  },
};

export const TAX_DEADLINES_GERMANY = {
  incomeTax: {
    withoutAdvisor: '07-31', // July 31 of following year
    withAdvisor: '02-28', // February 28, 2 years after tax year
    description: 'Einkommensteuererklärung filing deadline',
  },
  vat: {
    monthly: 10, // 10th of following month
    quarterly: 10, // 10th of month following quarter
    annual: '01-31', // January 31 of following year
    description: 'Umsatzsteuer-Voranmeldung deadlines',
  },
  tradeTax: {
    prepayments: ['02-15', '05-15', '08-15', '11-15'],
    description: 'Quarterly prepayments for Gewerbesteuer',
  },
};

export const TAX_DEADLINES_AUSTRIA = {
  incomeTax: {
    withoutAdvisor: '06-30', // June 30 of following year
    withAdvisor: '09-30', // September 30 of following year
    description: 'Einkommensteuererklärung filing deadline',
  },
  vat: {
    monthly: 15, // 15th of following month
    quarterly: 15, // 15th of month following quarter
    annual: '01-31', // January 31 of following year
    description: 'Umsatzsteuer-Voranmeldung deadlines',
  },
};

export const SOCIAL_SECURITY_RATES_GERMANY = {
  pension: 18.6, // Rentenversicherung (split employer/employee)
  health: 14.6, // Krankenversicherung base rate
  unemployment: 2.6, // Arbeitslosenversicherung
  longTermCare: 3.4, // Pflegeversicherung
  description: 'Social security contribution rates (2024)',
};

export const SOCIAL_SECURITY_RATES_AUSTRIA = {
  pension: 22.8, // Pensionsversicherung
  health: 7.65, // Krankenversicherung
  unemployment: 6.0, // Arbeitslosenversicherung
  accident: 1.2, // Unfallversicherung
  description: 'Social security contribution rates (2024)',
};

/**
 * EU countries for intra-community VAT validation
 */
export const EU_COUNTRIES = [
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czech Republic
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
];

/**
 * VAT registration thresholds by country
 */
export const VAT_REGISTRATION_THRESHOLDS = {
  DE: 22000, // Germany: €22,000 (Kleinunternehmerregelung)
  AT: 35000, // Austria: €35,000
};

/**
 * Depreciation periods for common asset classes (Germany)
 */
export const DEPRECIATION_PERIODS_GERMANY = {
  computers: 1, // 1 year (accelerated since 2021)
  software: 1, // 1 year
  office_furniture: 13, // 13 years
  vehicles: 6, // 6 years
  machinery: 8, // 8 years (varies)
  buildings_commercial: 33, // 33 years
  buildings_residential: 50, // 50 years
};

/**
 * Depreciation periods for common asset classes (Austria)
 */
export const DEPRECIATION_PERIODS_AUSTRIA = {
  computers: 3, // 3 years
  software: 4, // 4 years
  office_furniture: 10, // 10 years
  vehicles: 8, // 8 years
  machinery: 8, // 8 years
  buildings_commercial: 33, // 33 years
  buildings_residential: 67, // 67 years
};
