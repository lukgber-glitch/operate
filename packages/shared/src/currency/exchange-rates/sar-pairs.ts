/**
 * SAR Exchange Rate Pairs
 * Common currency pairs involving Saudi Riyal
 */

import { SAR_CONSTANTS } from '../sar/sar.constants';

export interface ExchangeRatePair {
  pair: string;
  baseCurrency: string;
  quoteCurrency: string;
  description: string;
  isPegged?: boolean;
  peggedRate?: number;
}

/**
 * SAR exchange rate pair definitions
 */
export const SAR_RATE_PAIRS: Record<string, ExchangeRatePair> = {
  'SAR/USD': {
    pair: 'SAR/USD',
    baseCurrency: 'SAR',
    quoteCurrency: 'USD',
    description: 'Saudi Riyal to US Dollar',
    isPegged: true,
    peggedRate: 1 / SAR_CONSTANTS.peggedRate, // ~0.2667
  },
  'USD/SAR': {
    pair: 'USD/SAR',
    baseCurrency: 'USD',
    quoteCurrency: 'SAR',
    description: 'US Dollar to Saudi Riyal',
    isPegged: true,
    peggedRate: SAR_CONSTANTS.peggedRate, // 3.75
  },
  'SAR/EUR': {
    pair: 'SAR/EUR',
    baseCurrency: 'SAR',
    quoteCurrency: 'EUR',
    description: 'Saudi Riyal to Euro',
  },
  'EUR/SAR': {
    pair: 'EUR/SAR',
    baseCurrency: 'EUR',
    quoteCurrency: 'SAR',
    description: 'Euro to Saudi Riyal',
  },
  'SAR/GBP': {
    pair: 'SAR/GBP',
    baseCurrency: 'SAR',
    quoteCurrency: 'GBP',
    description: 'Saudi Riyal to British Pound',
  },
  'GBP/SAR': {
    pair: 'GBP/SAR',
    baseCurrency: 'GBP',
    quoteCurrency: 'SAR',
    description: 'British Pound to Saudi Riyal',
  },
  'SAR/AED': {
    pair: 'SAR/AED',
    baseCurrency: 'SAR',
    quoteCurrency: 'AED',
    description: 'Saudi Riyal to UAE Dirham',
    // Cross rate: SAR/USD * USD/AED = (1/3.75) * 3.6725 = ~0.9793
  },
  'AED/SAR': {
    pair: 'AED/SAR',
    baseCurrency: 'AED',
    quoteCurrency: 'SAR',
    description: 'UAE Dirham to Saudi Riyal',
    // Cross rate: AED/USD * USD/SAR = (1/3.6725) * 3.75 = ~1.0211
  },
  'SAR/JPY': {
    pair: 'SAR/JPY',
    baseCurrency: 'SAR',
    quoteCurrency: 'JPY',
    description: 'Saudi Riyal to Japanese Yen',
  },
  'JPY/SAR': {
    pair: 'JPY/SAR',
    baseCurrency: 'JPY',
    quoteCurrency: 'SAR',
    description: 'Japanese Yen to Saudi Riyal',
  },
  'SAR/AUD': {
    pair: 'SAR/AUD',
    baseCurrency: 'SAR',
    quoteCurrency: 'AUD',
    description: 'Saudi Riyal to Australian Dollar',
  },
  'SAR/CAD': {
    pair: 'SAR/CAD',
    baseCurrency: 'SAR',
    quoteCurrency: 'CAD',
    description: 'Saudi Riyal to Canadian Dollar',
  },
  'SAR/CHF': {
    pair: 'SAR/CHF',
    baseCurrency: 'SAR',
    quoteCurrency: 'CHF',
    description: 'Saudi Riyal to Swiss Franc',
  },
  'SAR/CNY': {
    pair: 'SAR/CNY',
    baseCurrency: 'SAR',
    quoteCurrency: 'CNY',
    description: 'Saudi Riyal to Chinese Yuan',
  },
  'SAR/INR': {
    pair: 'SAR/INR',
    baseCurrency: 'SAR',
    quoteCurrency: 'INR',
    description: 'Saudi Riyal to Indian Rupee',
  },
};

/**
 * Get exchange rate pair information
 */
export function getSARPair(pair: string): ExchangeRatePair | undefined {
  return SAR_RATE_PAIRS[pair];
}

/**
 * Get all SAR exchange pairs
 */
export function getAllSARPairs(): ExchangeRatePair[] {
  return Object.values(SAR_RATE_PAIRS);
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
  const pairInfo = SAR_RATE_PAIRS[pair];

  if (!pairInfo) {
    throw new Error(`Exchange pair ${pair} not supported`);
  }

  // For pegged currencies, use the fixed rate if available
  if (pairInfo.isPegged && pairInfo.peggedRate) {
    return amount * pairInfo.peggedRate;
  }

  // Otherwise use provided exchange rate
  return amount * exchangeRate;
}

/**
 * Example exchange rates (for testing/demo purposes)
 * Note: SAR is pegged to USD at 3.75
 * In production, non-pegged rates should come from a real-time API
 */
export const EXAMPLE_SAR_RATES: Record<string, number> = {
  'USD/SAR': 3.75, // Fixed peg
  'SAR/USD': 0.2667, // 1/3.75
  'EUR/SAR': 4.14, // Example: 1 EUR = 4.14 SAR
  'SAR/EUR': 0.242, // 1/4.14
  'GBP/SAR': 4.78, // Example: 1 GBP = 4.78 SAR
  'SAR/GBP': 0.209, // 1/4.78
  'AED/SAR': 1.0211, // Cross rate via USD
  'SAR/AED': 0.9793, // Cross rate via USD
  'JPY/SAR': 0.025, // Example
  'SAR/JPY': 40.0, // 1/0.025
  'SAR/AUD': 0.43, // Example
  'SAR/CAD': 0.37, // Example
  'SAR/CHF': 0.23, // Example
  'SAR/CNY': 1.93, // Example
  'SAR/INR': 22.25, // Example
};

/**
 * Calculate cross rates for SAR pairs
 * @param baseRate - Base exchange rate
 * @param quoteRate - Quote exchange rate
 */
export function calculateCrossRate(baseRate: number, quoteRate: number): number {
  return baseRate / quoteRate;
}

/**
 * Get inverse rate (e.g., SAR/USD from USD/SAR)
 */
export function getInverseRate(rate: number): number {
  return 1 / rate;
}

/**
 * Format exchange rate for display
 */
export function formatExchangeRate(
  rate: number,
  pair: string,
  decimals: number = 4
): string {
  const pairInfo = SAR_RATE_PAIRS[pair];
  if (!pairInfo) {
    return `${pair}: ${rate.toFixed(decimals)}`;
  }
  return `${pairInfo.baseCurrency}/${pairInfo.quoteCurrency}: ${rate.toFixed(decimals)}`;
}

/**
 * Validate exchange rate pair
 */
export function isValidSARPair(pair: string): boolean {
  return pair in SAR_RATE_PAIRS;
}

/**
 * Get pegged rate if currency is pegged
 */
export function getPeggedRate(pair: string): number | null {
  const pairInfo = SAR_RATE_PAIRS[pair];
  if (pairInfo?.isPegged && pairInfo.peggedRate) {
    return pairInfo.peggedRate;
  }
  return null;
}
