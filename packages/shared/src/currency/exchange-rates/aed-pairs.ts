/**
 * AED Exchange Rate Pairs
 * Common currency pairs involving UAE Dirham
 */

import { AED_CONSTANTS } from '../aed/aed.constants';

export interface ExchangeRatePair {
  pair: string;
  baseCurrency: string;
  quoteCurrency: string;
  description: string;
  isPegged?: boolean;
  peggedRate?: number;
}

/**
 * AED exchange rate pair definitions
 */
export const AED_RATE_PAIRS: Record<string, ExchangeRatePair> = {
  'AED/USD': {
    pair: 'AED/USD',
    baseCurrency: 'AED',
    quoteCurrency: 'USD',
    description: 'UAE Dirham to US Dollar',
    isPegged: true,
    peggedRate: 1 / AED_CONSTANTS.peggedRate, // ~0.2723
  },
  'USD/AED': {
    pair: 'USD/AED',
    baseCurrency: 'USD',
    quoteCurrency: 'AED',
    description: 'US Dollar to UAE Dirham',
    isPegged: true,
    peggedRate: AED_CONSTANTS.peggedRate, // 3.6725
  },
  'AED/EUR': {
    pair: 'AED/EUR',
    baseCurrency: 'AED',
    quoteCurrency: 'EUR',
    description: 'UAE Dirham to Euro',
  },
  'EUR/AED': {
    pair: 'EUR/AED',
    baseCurrency: 'EUR',
    quoteCurrency: 'AED',
    description: 'Euro to UAE Dirham',
  },
  'AED/GBP': {
    pair: 'AED/GBP',
    baseCurrency: 'AED',
    quoteCurrency: 'GBP',
    description: 'UAE Dirham to British Pound',
  },
  'GBP/AED': {
    pair: 'GBP/AED',
    baseCurrency: 'GBP',
    quoteCurrency: 'AED',
    description: 'British Pound to UAE Dirham',
  },
  'AED/SAR': {
    pair: 'AED/SAR',
    baseCurrency: 'AED',
    quoteCurrency: 'SAR',
    description: 'UAE Dirham to Saudi Riyal',
    // Cross rate: AED/USD * USD/SAR = (1/3.6725) * 3.75 = ~1.0211
  },
  'SAR/AED': {
    pair: 'SAR/AED',
    baseCurrency: 'SAR',
    quoteCurrency: 'AED',
    description: 'Saudi Riyal to UAE Dirham',
    // Cross rate: SAR/USD * USD/AED = (1/3.75) * 3.6725 = ~0.9793
  },
  'AED/JPY': {
    pair: 'AED/JPY',
    baseCurrency: 'AED',
    quoteCurrency: 'JPY',
    description: 'UAE Dirham to Japanese Yen',
  },
  'JPY/AED': {
    pair: 'JPY/AED',
    baseCurrency: 'JPY',
    quoteCurrency: 'AED',
    description: 'Japanese Yen to UAE Dirham',
  },
  'AED/AUD': {
    pair: 'AED/AUD',
    baseCurrency: 'AED',
    quoteCurrency: 'AUD',
    description: 'UAE Dirham to Australian Dollar',
  },
  'AED/CAD': {
    pair: 'AED/CAD',
    baseCurrency: 'AED',
    quoteCurrency: 'CAD',
    description: 'UAE Dirham to Canadian Dollar',
  },
  'AED/CHF': {
    pair: 'AED/CHF',
    baseCurrency: 'AED',
    quoteCurrency: 'CHF',
    description: 'UAE Dirham to Swiss Franc',
  },
  'AED/CNY': {
    pair: 'AED/CNY',
    baseCurrency: 'AED',
    quoteCurrency: 'CNY',
    description: 'UAE Dirham to Chinese Yuan',
  },
  'AED/INR': {
    pair: 'AED/INR',
    baseCurrency: 'AED',
    quoteCurrency: 'INR',
    description: 'UAE Dirham to Indian Rupee',
  },
};

/**
 * Get exchange rate pair information
 */
export function getAEDPair(pair: string): ExchangeRatePair | undefined {
  return AED_RATE_PAIRS[pair];
}

/**
 * Get all AED exchange pairs
 */
export function getAllAEDPairs(): ExchangeRatePair[] {
  return Object.values(AED_RATE_PAIRS);
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
  const pairInfo = AED_RATE_PAIRS[pair];

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
 * Note: AED is pegged to USD at 3.6725
 * In production, non-pegged rates should come from a real-time API
 */
export const EXAMPLE_AED_RATES: Record<string, number> = {
  'USD/AED': 3.6725, // Fixed peg
  'AED/USD': 0.2723, // 1/3.6725
  'EUR/AED': 4.05, // Example: 1 EUR = 4.05 AED
  'AED/EUR': 0.247, // 1/4.05
  'GBP/AED': 4.68, // Example: 1 GBP = 4.68 AED
  'AED/GBP': 0.214, // 1/4.68
  'SAR/AED': 0.9793, // Cross rate via USD
  'AED/SAR': 1.0211, // Cross rate via USD
  'JPY/AED': 0.0245, // Example
  'AED/JPY': 40.82, // 1/0.0245
  'AED/AUD': 0.42, // Example
  'AED/CAD': 0.38, // Example
  'AED/CHF': 0.24, // Example
  'AED/CNY': 1.97, // Example
  'AED/INR': 22.75, // Example
};

/**
 * Calculate cross rates for AED pairs
 * @param baseRate - Base exchange rate
 * @param quoteRate - Quote exchange rate
 */
export function calculateCrossRate(baseRate: number, quoteRate: number): number {
  return baseRate / quoteRate;
}

/**
 * Get inverse rate (e.g., AED/USD from USD/AED)
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
  const pairInfo = AED_RATE_PAIRS[pair];
  if (!pairInfo) {
    return `${pair}: ${rate.toFixed(decimals)}`;
  }
  return `${pairInfo.baseCurrency}/${pairInfo.quoteCurrency}: ${rate.toFixed(decimals)}`;
}

/**
 * Validate exchange rate pair
 */
export function isValidAEDPair(pair: string): boolean {
  return pair in AED_RATE_PAIRS;
}

/**
 * Get pegged rate if currency is pegged
 */
export function getPeggedRate(pair: string): number | null {
  const pairInfo = AED_RATE_PAIRS[pair];
  if (pairInfo?.isPegged && pairInfo.peggedRate) {
    return pairInfo.peggedRate;
  }
  return null;
}
