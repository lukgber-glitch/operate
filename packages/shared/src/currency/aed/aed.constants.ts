/**
 * AED Currency Constants
 * United Arab Emirates Dirham formatting and configuration
 */

export const AED_CONSTANTS = {
  code: 'AED',
  symbol: 'د.إ',
  symbolAlt: 'AED',
  name: 'UAE Dirham',
  namePlural: 'UAE dirhams',
  nameArabic: 'درهم إماراتي',
  namePluralArabic: 'دراهم إماراتية',

  // ISO 4217
  numericCode: 784,

  // AED has 2 decimal places
  decimalDigits: 2,

  // Formatting
  symbolNative: 'د.إ',
  symbolPosition: 'suffix', // 100.00 د.إ
  thousandSeparator: ',',
  decimalSeparator: '.',

  // Minor unit
  minorUnit: {
    name: 'Fils',
    nameArabic: 'فلس',
    ratio: 100, // 100 fils = 1 AED
  },

  // Exchange rate
  peggedTo: 'USD',
  peggedRate: 3.6725, // Fixed since 1997
  isPegged: true,
} as const;

/**
 * Exchange rate pairs for AED
 */
export const AED_EXCHANGE_PAIRS = [
  'AED/USD',
  'AED/EUR',
  'AED/GBP',
  'AED/SAR',
  'AED/JPY',
  'AED/AUD',
  'AED/CAD',
  'AED/CHF',
  'AED/CNY',
  'AED/INR',
  'USD/AED',
  'EUR/AED',
  'GBP/AED',
  'SAR/AED',
  'JPY/AED',
] as const;

/**
 * Typical AED amount ranges for validation
 */
export const AED_RANGES = {
  minAmount: 0.01, // 1 fils
  maxAmount: 999999999.99, // ~1 billion AED

  // Common business thresholds
  smallTransaction: 100, // AED 100
  mediumTransaction: 1000, // AED 1,000
  largeTransaction: 10000, // AED 10,000

  // UAE specific thresholds
  vat_registration_threshold: 375000, // AED 375,000
  vat_voluntary_threshold: 187500, // AED 187,500
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

export type AEDExchangePair = typeof AED_EXCHANGE_PAIRS[number];
