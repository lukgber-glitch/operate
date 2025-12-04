/**
 * Australian Dollar (AUD) Currency Configuration
 *
 * Complete configuration for Australian Dollar with cash rounding rules.
 *
 * Key Features:
 * - Standard 2 decimal places
 * - Cash rounding to 5 cents (no 1c/2c coins since 1992)
 * - Electronic transactions use exact cents
 * - Symbol: A$ or $
 */

import { ExtendedCurrencyConfig, CurrencyLocaleConfig } from './cad-currency.config';

export const AUD_CURRENCY_CONFIG: ExtendedCurrencyConfig = {
  code: 'AUD',
  name: 'Australian Dollar',
  decimals: 2,
  minorUnit: 'cents',
  minorUnitRatio: 100, // 100 cents = 1 AUD

  // Primary locale: Australian English
  primaryLocale: {
    locale: 'en-AU',
    symbol: 'A$',
    format: 'before', // A$1,234.56
    decimalSeparator: '.',
    thousandsSeparator: ',',
    exampleFormat: 'A$1,234.56',
  },

  // No alternate locales for AUD
  alternateLocales: [],

  // Cash rounding to 5 cents
  rounding: {
    type: 'cash',
    increment: 0.05,
    rules: 'Cash transactions round to nearest 5 cents. Electronic transactions use exact cents.',
  },

  countries: ['AU', 'CX', 'CC', 'NF'], // Australia, Christmas Island, Cocos Islands, Norfolk Island
  flag: '🇦🇺',
};

/**
 * AUD Formatting Rules:
 *
 * Australian English (en-AU):
 * - Symbol: A$ or $ (before amount)
 * - Decimal: . (period)
 * - Thousands: , (comma)
 * - Example: A$1,234.56 or $1,234.56
 *
 * Cash Rounding:
 * - 0.01-0.02 → 0.00
 * - 0.03-0.07 → 0.05
 * - 0.08-0.12 → 0.10
 * - Pattern continues for all amounts
 *
 * Validation:
 * - Electronic: exactly 2 decimal places
 * - Cash: rounded to nearest 0.05
 * - Minimum amount: 0.01 AUD (electronic), 0.05 AUD (cash)
 */

/**
 * AUD Currency Metadata
 */
export const AUD_METADATA = {
  /**
   * Reserve Bank of Australia (RBA) is the central bank
   */
  centralBank: 'Reserve Bank of Australia',

  /**
   * ISO 4217 currency code
   */
  isoCode: 'AUD',

  /**
   * Numeric ISO code
   */
  isoNumeric: '036',

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
   * Note: 1c and 2c coins were withdrawn in 1992
   */
  coins: [0.05, 0.10, 0.20, 0.50, 1, 2],

  /**
   * Notes in circulation (polymer notes)
   */
  notes: [5, 10, 20, 50, 100],

  /**
   * Important notes
   */
  notes_special: [
    'Australia eliminated 1c and 2c coins in 1992',
    'Cash transactions round to nearest 5 cents',
    'Electronic transactions (EFTPOS, cards, bank transfers) use exact cents',
    'Australia was the first country to use polymer banknotes',
  ],

  /**
   * Common symbol variations
   */
  symbolVariations: ['$', 'A$', 'AU$', 'AUD'],

  /**
   * Cash rounding rules
   */
  cashRoundingRules: {
    description: 'Round to nearest 5 cents for cash transactions',
    examples: [
      { original: 1.01, rounded: 1.00 },
      { original: 1.02, rounded: 1.00 },
      { original: 1.03, rounded: 1.05 },
      { original: 1.04, rounded: 1.05 },
      { original: 1.05, rounded: 1.05 },
      { original: 1.06, rounded: 1.05 },
      { original: 1.07, rounded: 1.05 },
      { original: 1.08, rounded: 1.10 },
    ],
  },
};

/**
 * Get locale-specific configuration
 */
export function getAUDLocaleConfig(locale?: string): CurrencyLocaleConfig {
  return AUD_CURRENCY_CONFIG.primaryLocale;
}

/**
 * Validate AUD amount
 */
export function validateAUDAmount(amount: number, isCash: boolean = false): boolean {
  // Check if amount is a valid number
  if (isNaN(amount) || !isFinite(amount)) {
    return false;
  }

  // Check if amount has no more than 2 decimal places
  const decimals = (amount.toString().split('.')[1] || '').length;
  if (decimals > 2) {
    return false;
  }

  // For cash transactions, check if properly rounded to 5 cents
  if (isCash) {
    const cents = Math.round(amount * 100) % 100;
    const lastDigit = cents % 10;
    if (lastDigit !== 0 && lastDigit !== 5) {
      return false;
    }
  }

  // Check minimum amount
  const minAmount = isCash ? 0.05 : 0.01;
  if (amount < minAmount && amount !== 0) {
    return false;
  }

  return true;
}

/**
 * Apply cash rounding for AUD
 * Rounds to nearest 5 cents for cash transactions
 *
 * Algorithm:
 * 1. Multiply by 20 to convert to 5-cent units
 * 2. Round to nearest integer
 * 3. Divide by 20 to get back to dollars
 *
 * Examples:
 * - 1.01 → 1.00
 * - 1.02 → 1.00
 * - 1.03 → 1.05
 * - 1.07 → 1.05
 * - 1.08 → 1.10
 */
export function applyAUDCashRounding(amount: number): number {
  return Math.round(amount * 20) / 20;
}

/**
 * Check if amount needs rounding for cash
 */
export function needsAUDCashRounding(amount: number): boolean {
  const cents = Math.round(amount * 100) % 100;
  const lastDigit = cents % 10;
  return lastDigit !== 0 && lastDigit !== 5;
}

/**
 * Get rounding adjustment
 * Returns the difference between original and rounded amount
 */
export function getAUDRoundingAdjustment(amount: number): number {
  const rounded = applyAUDCashRounding(amount);
  return rounded - amount;
}
