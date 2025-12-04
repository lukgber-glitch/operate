/**
 * SAR Currency Constants
 * Saudi Riyal formatting and configuration
 */

export const SAR_CONSTANTS = {
  code: 'SAR',
  symbol: 'ر.س',
  symbolAlt: 'SAR',
  name: 'Saudi Riyal',
  namePlural: 'Saudi riyals',
  nameArabic: 'ريال سعودي',
  namePluralArabic: 'ريالات سعودية',

  // ISO 4217
  numericCode: 682,

  // SAR has 2 decimal places
  decimalDigits: 2,

  // Formatting
  symbolNative: 'ر.س',
  symbolPosition: 'suffix', // 100.00 ر.س
  thousandSeparator: ',',
  decimalSeparator: '.',

  // Minor unit
  minorUnit: {
    name: 'Halala',
    nameArabic: 'هللة',
    namePlural: 'Halalas',
    namePluralArabic: 'هللات',
    ratio: 100, // 100 halala = 1 SAR
  },

  // Exchange rate
  peggedTo: 'USD',
  peggedRate: 3.75, // Fixed since 1986
  isPegged: true,
} as const;

/**
 * Exchange rate pairs for SAR
 */
export const SAR_EXCHANGE_PAIRS = [
  'SAR/USD',
  'SAR/EUR',
  'SAR/GBP',
  'SAR/AED',
  'SAR/JPY',
  'SAR/AUD',
  'SAR/CAD',
  'SAR/CHF',
  'SAR/CNY',
  'SAR/INR',
  'USD/SAR',
  'EUR/SAR',
  'GBP/SAR',
  'AED/SAR',
  'JPY/SAR',
] as const;

/**
 * Typical SAR amount ranges for validation
 */
export const SAR_RANGES = {
  minAmount: 0.01, // 1 halala
  maxAmount: 999999999.99, // ~1 billion SAR

  // Common business thresholds
  smallTransaction: 100, // SAR 100
  mediumTransaction: 1000, // SAR 1,000
  largeTransaction: 10000, // SAR 10,000

  // Saudi Arabia specific thresholds
  vat_registration_threshold: 375000, // SAR 375,000
  vat_voluntary_threshold: 187500, // SAR 187,500
  zakat_threshold: 85000, // SAR 85,000 (Nisab for gold)
} as const;

/**
 * Arabic numerals for invoice formatting
 */
export const ARABIC_NUMERALS = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
} as const;

export type SARExchangePair = typeof SAR_EXCHANGE_PAIRS[number];
