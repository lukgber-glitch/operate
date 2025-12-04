/**
 * Canadian Dollar (CAD) Currency Configuration
 *
 * Complete configuration for Canadian Dollar with support for both
 * English Canadian and French Canadian (Quebec) locales.
 *
 * Key Features:
 * - Dual locale support (en-CA, fr-CA)
 * - Different formatting for English vs French regions
 * - Standard cent rounding (100 cents = 1 CAD)
 * - Symbol variations: C$, CA$, or $
 */

export interface CurrencyLocaleConfig {
  locale: string;
  symbol: string;
  format: 'before' | 'after';
  decimalSeparator: string;
  thousandsSeparator: string;
  exampleFormat: string;
}

export interface ExtendedCurrencyConfig {
  code: string;
  name: string;
  decimals: number;
  minorUnit: string;
  minorUnitRatio: number;
  primaryLocale: CurrencyLocaleConfig;
  alternateLocales: CurrencyLocaleConfig[];
  rounding: {
    type: 'standard' | 'cash' | 'custom';
    increment?: number; // For cash rounding (e.g., 0.05)
    rules?: string;
  };
  countries: string[];
  flag: string;
}

export const CAD_CURRENCY_CONFIG: ExtendedCurrencyConfig = {
  code: 'CAD',
  name: 'Canadian Dollar',
  decimals: 2,
  minorUnit: 'cents',
  minorUnitRatio: 100, // 100 cents = 1 CAD

  // Primary locale: English Canada
  primaryLocale: {
    locale: 'en-CA',
    symbol: 'C$',
    format: 'before', // C$1,234.56
    decimalSeparator: '.',
    thousandsSeparator: ',',
    exampleFormat: 'C$1,234.56',
  },

  // Alternate locale: French Canada (Quebec)
  alternateLocales: [
    {
      locale: 'fr-CA',
      symbol: '$',
      format: 'after', // 1 234,56 $
      decimalSeparator: ',',
      thousandsSeparator: ' ', // non-breaking space
      exampleFormat: '1 234,56 $',
    },
  ],

  // Standard rounding (no special cash rounding like CHF)
  rounding: {
    type: 'standard',
    rules: 'Round to nearest cent (0.01)',
  },

  countries: ['CA'], // Canada
  flag: '🇨🇦',
};

/**
 * CAD Formatting Rules:
 *
 * English Canada (en-CA):
 * - Symbol: C$ or CA$ (before amount)
 * - Decimal: . (period)
 * - Thousands: , (comma)
 * - Example: C$1,234.56 or CA$1,234.56
 *
 * French Canada (fr-CA):
 * - Symbol: $ (after amount)
 * - Decimal: , (comma)
 * - Thousands: (space)
 * - Example: 1 234,56 $ or 1 234,56 $CA
 *
 * Validation:
 * - All amounts must have exactly 2 decimal places
 * - Minimum amount: 0.01 CAD
 * - Maximum amount: No practical limit
 */

/**
 * CAD Currency Metadata
 */
export const CAD_METADATA = {
  /**
   * Bank of Canada (BOC) is the central bank
   */
  centralBank: 'Bank of Canada',

  /**
   * ISO 4217 currency code
   */
  isoCode: 'CAD',

  /**
   * Numeric ISO code
   */
  isoNumeric: '124',

  /**
   * Official subdivisions
   */
  subdivisions: {
    major: 'Dollar',
    minor: 'Cent',
    ratio: 100,
  },

  /**
   * Coin denominations in circulation
   */
  coins: [0.05, 0.10, 0.25, 1, 2],

  /**
   * Notes in circulation
   */
  notes: [5, 10, 20, 50, 100],

  /**
   * Important notes
   */
  notes_special: [
    'Canada eliminated the penny (1¢) in 2013',
    'Cash transactions are rounded to nearest 5 cents',
    'Electronic transactions still use exact cents',
  ],

  /**
   * Common symbol variations
   */
  symbolVariations: ['$', 'C$', 'CA$', 'CAD'],
};

/**
 * Get locale-specific configuration
 */
export function getCADLocaleConfig(locale?: string): CurrencyLocaleConfig {
  const normalizedLocale = locale?.toLowerCase() || 'en-ca';

  if (normalizedLocale.startsWith('fr')) {
    return CAD_CURRENCY_CONFIG.alternateLocales[0];
  }

  return CAD_CURRENCY_CONFIG.primaryLocale;
}

/**
 * Validate CAD amount
 */
export function validateCADAmount(amount: number): boolean {
  // Check if amount is a valid number
  if (isNaN(amount) || !isFinite(amount)) {
    return false;
  }

  // Check if amount has no more than 2 decimal places
  const decimals = (amount.toString().split('.')[1] || '').length;
  if (decimals > 2) {
    return false;
  }

  // Check minimum amount (0.01 CAD)
  if (amount < 0.01 && amount !== 0) {
    return false;
  }

  return true;
}

/**
 * Apply cash rounding for CAD
 * Note: Canada eliminated pennies in 2013, so cash transactions
 * should be rounded to nearest 5 cents
 */
export function applyCADCashRounding(amount: number): number {
  // For electronic transactions, return exact amount
  // For cash, round to nearest 0.05
  return Math.round(amount * 20) / 20;
}
