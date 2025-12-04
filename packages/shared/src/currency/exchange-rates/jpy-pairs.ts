/**
 * JPY Exchange Rate Pairs
 * Common currency pairs involving Japanese Yen
 */

import { JPY_EXCHANGE_PAIRS, JPYExchangePair } from '../jpy/jpy.constants';

export interface ExchangeRatePair {
  pair: string;
  baseCurrency: string;
  quoteCurrency: string;
  description: string;
}

/**
 * JPY exchange rate pair definitions
 */
export const JPY_RATE_PAIRS: Record<JPYExchangePair, ExchangeRatePair> = {
  'USD/JPY': {
    pair: 'USD/JPY',
    baseCurrency: 'USD',
    quoteCurrency: 'JPY',
    description: 'US Dollar to Japanese Yen',
  },
  'EUR/JPY': {
    pair: 'EUR/JPY',
    baseCurrency: 'EUR',
    quoteCurrency: 'JPY',
    description: 'Euro to Japanese Yen',
  },
  'GBP/JPY': {
    pair: 'GBP/JPY',
    baseCurrency: 'GBP',
    quoteCurrency: 'JPY',
    description: 'British Pound to Japanese Yen',
  },
  'AUD/JPY': {
    pair: 'AUD/JPY',
    baseCurrency: 'AUD',
    quoteCurrency: 'JPY',
    description: 'Australian Dollar to Japanese Yen',
  },
  'CAD/JPY': {
    pair: 'CAD/JPY',
    baseCurrency: 'CAD',
    quoteCurrency: 'JPY',
    description: 'Canadian Dollar to Japanese Yen',
  },
  'CHF/JPY': {
    pair: 'CHF/JPY',
    baseCurrency: 'CHF',
    quoteCurrency: 'JPY',
    description: 'Swiss Franc to Japanese Yen',
  },
  'CNY/JPY': {
    pair: 'CNY/JPY',
    baseCurrency: 'CNY',
    quoteCurrency: 'JPY',
    description: 'Chinese Yuan to Japanese Yen',
  },
  'HKD/JPY': {
    pair: 'HKD/JPY',
    baseCurrency: 'HKD',
    quoteCurrency: 'JPY',
    description: 'Hong Kong Dollar to Japanese Yen',
  },
  'NZD/JPY': {
    pair: 'NZD/JPY',
    baseCurrency: 'NZD',
    quoteCurrency: 'JPY',
    description: 'New Zealand Dollar to Japanese Yen',
  },
  'SGD/JPY': {
    pair: 'SGD/JPY',
    baseCurrency: 'SGD',
    quoteCurrency: 'JPY',
    description: 'Singapore Dollar to Japanese Yen',
  },
};

/**
 * Get exchange rate pair information
 */
export function getJPYPair(pair: JPYExchangePair): ExchangeRatePair {
  return JPY_RATE_PAIRS[pair];
}

/**
 * Get all JPY exchange pairs
 */
export function getAllJPYPairs(): ExchangeRatePair[] {
  return Object.values(JPY_RATE_PAIRS);
}

/**
 * Convert amount between currencies using exchange rate
 * @param amount - Amount in base currency
 * @param exchangeRate - Exchange rate (base/quote)
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 */
export function convertCurrency(
  amount: number,
  exchangeRate: number,
  fromCurrency: string,
  toCurrency: string
): number {
  // Find the pair
  const pair = `${fromCurrency}/${toCurrency}`;
  const reversePair = `${toCurrency}/${fromCurrency}`;

  if (JPY_EXCHANGE_PAIRS.includes(pair as JPYExchangePair)) {
    // Direct conversion (e.g., USD/JPY)
    const result = amount * exchangeRate;
    // Round to whole number if converting to JPY
    return toCurrency === 'JPY' ? Math.round(result) : result;
  } else if (JPY_EXCHANGE_PAIRS.includes(reversePair as JPYExchangePair)) {
    // Inverse conversion (e.g., JPY/USD)
    const result = amount / exchangeRate;
    return result;
  }

  throw new Error(`Exchange pair ${pair} not supported`);
}

/**
 * Example exchange rates (for testing/demo purposes)
 * In production, these should come from a real-time API
 */
export const EXAMPLE_JPY_RATES: Record<JPYExchangePair, number> = {
  'USD/JPY': 149.85, // 1 USD = 149.85 JPY
  'EUR/JPY': 162.45, // 1 EUR = 162.45 JPY
  'GBP/JPY': 189.30, // 1 GBP = 189.30 JPY
  'AUD/JPY': 97.82, // 1 AUD = 97.82 JPY
  'CAD/JPY': 109.45, // 1 CAD = 109.45 JPY
  'CHF/JPY': 168.90, // 1 CHF = 168.90 JPY
  'CNY/JPY': 20.65, // 1 CNY = 20.65 JPY
  'HKD/JPY': 19.20, // 1 HKD = 19.20 JPY
  'NZD/JPY': 90.15, // 1 NZD = 90.15 JPY
  'SGD/JPY': 111.25, // 1 SGD = 111.25 JPY
};

/**
 * Calculate cross rates for JPY pairs
 * @param baseRate - Base exchange rate
 * @param quoteRate - Quote exchange rate
 */
export function calculateCrossRate(baseRate: number, quoteRate: number): number {
  return baseRate / quoteRate;
}

/**
 * Get inverse rate (e.g., JPY/USD from USD/JPY)
 */
export function getInverseRate(rate: number): number {
  return 1 / rate;
}

/**
 * Format exchange rate for display
 */
export function formatExchangeRate(
  rate: number,
  pair: JPYExchangePair,
  decimals: number = 2
): string {
  const pairInfo = JPY_RATE_PAIRS[pair];
  return `${pairInfo.baseCurrency}/${pairInfo.quoteCurrency}: ${rate.toFixed(decimals)}`;
}

/**
 * Validate exchange rate pair
 */
export function isValidJPYPair(pair: string): pair is JPYExchangePair {
  return JPY_EXCHANGE_PAIRS.includes(pair as JPYExchangePair);
}
