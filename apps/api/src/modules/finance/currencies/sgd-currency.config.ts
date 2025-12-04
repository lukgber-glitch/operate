/**
 * Singapore Dollar (SGD) Currency Configuration
 *
 * Complete configuration for Singapore Dollar.
 *
 * Key Features:
 * - Standard 2 decimal places
 * - Standard cent rounding (100 cents = 1 SGD)
 * - Symbol: S$ or $
 * - Used in Singapore
 */

import { ExtendedCurrencyConfig, CurrencyLocaleConfig } from './cad-currency.config';

export const SGD_CURRENCY_CONFIG: ExtendedCurrencyConfig = {
  code: 'SGD',
  name: 'Singapore Dollar',
  decimals: 2,
  minorUnit: 'cents',
  minorUnitRatio: 100, // 100 cents = 1 SGD

  // Primary locale: Singapore English
  primaryLocale: {
    locale: 'en-SG',
    symbol: 'S$',
    format: 'before', // S$1,234.56
    decimalSeparator: '.',
    thousandsSeparator: ',',
    exampleFormat: 'S$1,234.56',
  },

  // Alternate locales (Chinese, Malay, Tamil also official but use same format)
  alternateLocales: [
    {
      locale: 'zh-SG',
      symbol: 'S$',
      format: 'before',
      decimalSeparator: '.',
      thousandsSeparator: ',',
      exampleFormat: 'S$1,234.56',
    },
  ],

  // Standard rounding (no special cash rounding)
  rounding: {
    type: 'standard',
    rules: 'Round to nearest cent (0.01)',
  },

  countries: ['SG'], // Singapore
  flag: '🇸🇬',
};

/**
 * SGD Formatting Rules:
 *
 * Singapore English (en-SG):
 * - Symbol: S$ or $ (before amount)
 * - Decimal: . (period)
 * - Thousands: , (comma)
 * - Example: S$1,234.56 or $1,234.56
 *
 * Validation:
 * - All amounts must have exactly 2 decimal places
 * - Minimum amount: 0.01 SGD
 * - Maximum amount: No practical limit
 */

/**
 * SGD Currency Metadata
 */
export const SGD_METADATA = {
  /**
   * Monetary Authority of Singapore (MAS) is the central bank
   */
  centralBank: 'Monetary Authority of Singapore',

  /**
   * ISO 4217 currency code
   */
  isoCode: 'SGD',

  /**
   * Numeric ISO code
   */
  isoNumeric: '702',

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
  coins: [0.05, 0.10, 0.20, 0.50, 1],

  /**
   * Notes in circulation
   */
  notes: [2, 5, 10, 50, 100, 1000, 10000],

  /**
   * Important notes
   */
  notes_special: [
    'Singapore uses polymer banknotes for durability',
    'SGD is one of the most traded currencies in Asia',
    'Singapore eliminated 1c coins in 2002',
    'Cash transactions round to nearest 5 cents',
    'Electronic transactions use exact cents',
  ],

  /**
   * Common symbol variations
   */
  symbolVariations: ['$', 'S$', 'SG$', 'SGD'],

  /**
   * Official languages
   */
  officialLanguages: ['English', 'Mandarin', 'Malay', 'Tamil'],

  /**
   * Cash rounding (similar to AUD)
   */
  cashRounding: {
    enabled: true,
    increment: 0.05,
    note: 'Cash transactions round to nearest 5 cents since 2002',
  },
};

/**
 * Get locale-specific configuration
 */
export function getSGDLocaleConfig(locale?: string): CurrencyLocaleConfig {
  const normalizedLocale = locale?.toLowerCase() || 'en-sg';

  // Chinese locale
  if (normalizedLocale.startsWith('zh')) {
    return SGD_CURRENCY_CONFIG.alternateLocales[0];
  }

  // Default to English
  return SGD_CURRENCY_CONFIG.primaryLocale;
}

/**
 * Validate SGD amount
 */
export function validateSGDAmount(amount: number, isCash: boolean = false): boolean {
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
 * Apply cash rounding for SGD
 * Rounds to nearest 5 cents for cash transactions
 * (Singapore eliminated 1c coins in 2002)
 *
 * Algorithm same as AUD:
 * 1. Multiply by 20 to convert to 5-cent units
 * 2. Round to nearest integer
 * 3. Divide by 20 to get back to dollars
 */
export function applySGDCashRounding(amount: number): number {
  return Math.round(amount * 20) / 20;
}

/**
 * Check if amount needs rounding for cash
 */
export function needsSGDCashRounding(amount: number): boolean {
  const cents = Math.round(amount * 100) % 100;
  const lastDigit = cents % 10;
  return lastDigit !== 0 && lastDigit !== 5;
}

/**
 * Get rounding adjustment
 * Returns the difference between original and rounded amount
 */
export function getSGDRoundingAdjustment(amount: number): number {
  const rounded = applySGDCashRounding(amount);
  return rounded - amount;
}

/**
 * Format SGD amount with proper locale
 */
export function formatSGDAmount(
  amount: number,
  options?: {
    locale?: string;
    showSymbol?: boolean;
    showCode?: boolean;
    isCash?: boolean;
  }
): string {
  const locale = options?.locale || 'en-SG';
  const showSymbol = options?.showSymbol !== false;
  const showCode = options?.showCode || false;
  const isCash = options?.isCash || false;

  // Apply cash rounding if needed
  const finalAmount = isCash ? applySGDCashRounding(amount) : amount;

  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'SGD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let formatted = formatter.format(finalAmount);

  if (showCode && !showSymbol) {
    formatted = `${formatted} SGD`;
  } else if (showCode && showSymbol) {
    formatted = `${formatted} (SGD)`;
  }

  return formatted;
}
