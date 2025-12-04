/**
 * JPY Currency Constants
 * Japanese Yen formatting and configuration
 */

export const JPY_CONSTANTS = {
  code: 'JPY',
  symbol: '¥',
  name: 'Japanese Yen',
  namePlural: 'Japanese yen',

  // JPY has no decimal places
  decimalDigits: 0,

  // Formatting
  symbolNative: '¥',
  symbolPosition: 'prefix', // ¥1,234,567
  thousandSeparator: ',',
  decimalSeparator: '', // No decimals

  // Large number formatting (optional)
  largeNumbers: {
    man: 10000, // 万 (man) = 10,000
    oku: 100000000, // 億 (oku) = 100,000,000
    cho: 1000000000000, // 兆 (cho) = 1,000,000,000,000
  },

  // Kanji representations
  kanji: {
    man: '万',
    oku: '億',
    cho: '兆',
    yen: '円',
  },
} as const;

/**
 * Exchange rate pairs for JPY
 */
export const JPY_EXCHANGE_PAIRS = [
  'USD/JPY',
  'EUR/JPY',
  'GBP/JPY',
  'AUD/JPY',
  'CAD/JPY',
  'CHF/JPY',
  'CNY/JPY',
  'HKD/JPY',
  'NZD/JPY',
  'SGD/JPY',
] as const;

/**
 * Typical JPY amount ranges for validation
 */
export const JPY_RANGES = {
  minAmount: 1, // ¥1
  maxAmount: 999999999999, // ¥999,999,999,999 (999 billion)

  // Common business thresholds
  smallTransaction: 10000, // ¥10,000
  mediumTransaction: 100000, // ¥100,000
  largeTransaction: 1000000, // ¥1,000,000

  // Tax thresholds (examples)
  consumptionTaxThreshold: 10000000, // ¥10,000,000
  invoiceSystemThreshold: 10000000, // ¥10,000,000
} as const;

export type JPYExchangePair = typeof JPY_EXCHANGE_PAIRS[number];
