/**
 * INR Exchange Rate Pairs
 * Common currency pairs involving Indian Rupee
 */

import { INR_EXCHANGE_PAIRS, INRExchangePair } from '../inr/inr.constants';

export interface ExchangeRatePair {
  pair: string;
  baseCurrency: string;
  quoteCurrency: string;
  description: string;
  typicalVolume?: 'high' | 'medium' | 'low';
  marketHours?: string;
}

/**
 * INR exchange rate pair definitions
 */
export const INR_RATE_PAIRS: Record<string, ExchangeRatePair> = {
  'INR/USD': {
    pair: 'INR/USD',
    baseCurrency: 'INR',
    quoteCurrency: 'USD',
    description: 'Indian Rupee to US Dollar',
    typicalVolume: 'high',
    marketHours: '9:00 AM - 5:00 PM IST',
  },
  'USD/INR': {
    pair: 'USD/INR',
    baseCurrency: 'USD',
    quoteCurrency: 'INR',
    description: 'US Dollar to Indian Rupee',
    typicalVolume: 'high',
    marketHours: '9:00 AM - 5:00 PM IST',
  },
  'INR/EUR': {
    pair: 'INR/EUR',
    baseCurrency: 'INR',
    quoteCurrency: 'EUR',
    description: 'Indian Rupee to Euro',
    typicalVolume: 'high',
  },
  'EUR/INR': {
    pair: 'EUR/INR',
    baseCurrency: 'EUR',
    quoteCurrency: 'INR',
    description: 'Euro to Indian Rupee',
    typicalVolume: 'high',
  },
  'INR/GBP': {
    pair: 'INR/GBP',
    baseCurrency: 'INR',
    quoteCurrency: 'GBP',
    description: 'Indian Rupee to British Pound',
    typicalVolume: 'high',
  },
  'GBP/INR': {
    pair: 'GBP/INR',
    baseCurrency: 'GBP',
    quoteCurrency: 'INR',
    description: 'British Pound to Indian Rupee',
    typicalVolume: 'high',
  },
  'INR/AED': {
    pair: 'INR/AED',
    baseCurrency: 'INR',
    quoteCurrency: 'AED',
    description: 'Indian Rupee to UAE Dirham',
    typicalVolume: 'high',
    marketHours: 'India-UAE trade corridor',
  },
  'AED/INR': {
    pair: 'AED/INR',
    baseCurrency: 'AED',
    quoteCurrency: 'INR',
    description: 'UAE Dirham to Indian Rupee',
    typicalVolume: 'high',
    marketHours: 'India-UAE trade corridor',
  },
  'INR/SAR': {
    pair: 'INR/SAR',
    baseCurrency: 'INR',
    quoteCurrency: 'SAR',
    description: 'Indian Rupee to Saudi Riyal',
    typicalVolume: 'high',
    marketHours: 'India-Saudi Arabia trade corridor',
  },
  'SAR/INR': {
    pair: 'SAR/INR',
    baseCurrency: 'SAR',
    quoteCurrency: 'INR',
    description: 'Saudi Riyal to Indian Rupee',
    typicalVolume: 'high',
    marketHours: 'India-Saudi Arabia trade corridor',
  },
  'INR/JPY': {
    pair: 'INR/JPY',
    baseCurrency: 'INR',
    quoteCurrency: 'JPY',
    description: 'Indian Rupee to Japanese Yen',
    typicalVolume: 'medium',
  },
  'JPY/INR': {
    pair: 'JPY/INR',
    baseCurrency: 'JPY',
    quoteCurrency: 'INR',
    description: 'Japanese Yen to Indian Rupee',
    typicalVolume: 'medium',
  },
  'INR/SGD': {
    pair: 'INR/SGD',
    baseCurrency: 'INR',
    quoteCurrency: 'SGD',
    description: 'Indian Rupee to Singapore Dollar',
    typicalVolume: 'high',
  },
  'SGD/INR': {
    pair: 'SGD/INR',
    baseCurrency: 'SGD',
    quoteCurrency: 'INR',
    description: 'Singapore Dollar to Indian Rupee',
    typicalVolume: 'high',
  },
  'INR/AUD': {
    pair: 'INR/AUD',
    baseCurrency: 'INR',
    quoteCurrency: 'AUD',
    description: 'Indian Rupee to Australian Dollar',
    typicalVolume: 'medium',
  },
  'INR/CAD': {
    pair: 'INR/CAD',
    baseCurrency: 'INR',
    quoteCurrency: 'CAD',
    description: 'Indian Rupee to Canadian Dollar',
    typicalVolume: 'medium',
  },
  'INR/CHF': {
    pair: 'INR/CHF',
    baseCurrency: 'INR',
    quoteCurrency: 'CHF',
    description: 'Indian Rupee to Swiss Franc',
    typicalVolume: 'low',
  },
  'INR/CNY': {
    pair: 'INR/CNY',
    baseCurrency: 'INR',
    quoteCurrency: 'CNY',
    description: 'Indian Rupee to Chinese Yuan',
    typicalVolume: 'medium',
  },
};

/**
 * Get exchange rate pair information
 */
export function getINRPair(pair: string): ExchangeRatePair | undefined {
  return INR_RATE_PAIRS[pair];
}

/**
 * Get all INR exchange pairs
 */
export function getAllINRPairs(): ExchangeRatePair[] {
  return Object.values(INR_RATE_PAIRS);
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
  const pair = `${fromCurrency}/${toCurrency}`;
  const pairInfo = INR_RATE_PAIRS[pair];

  if (!pairInfo) {
    throw new Error(`Exchange pair ${pair} not supported`);
  }

  return amount * exchangeRate;
}

/**
 * Example exchange rates (for testing/demo purposes)
 * Note: These are approximate rates as of 2024
 * In production, rates should come from a real-time API
 */
export const EXAMPLE_INR_RATES: Record<string, number> = {
  // Major currencies
  'USD/INR': 83.25, // 1 USD = 83.25 INR (approximate)
  'INR/USD': 0.012, // 1/83.25
  'EUR/INR': 90.5, // 1 EUR = 90.5 INR (approximate)
  'INR/EUR': 0.011, // 1/90.5
  'GBP/INR': 105.75, // 1 GBP = 105.75 INR (approximate)
  'INR/GBP': 0.0095, // 1/105.75

  // Middle East currencies (important for remittances)
  'AED/INR': 22.65, // 1 AED = 22.65 INR (cross rate via USD)
  'INR/AED': 0.044, // 1/22.65
  'SAR/INR': 22.2, // 1 SAR = 22.2 INR (cross rate via USD)
  'INR/SAR': 0.045, // 1/22.2

  // Asian currencies
  'JPY/INR': 0.56, // 1 JPY = 0.56 INR
  'INR/JPY': 1.79, // 1/0.56
  'SGD/INR': 61.5, // 1 SGD = 61.5 INR
  'INR/SGD': 0.016, // 1/61.5
  'CNY/INR': 11.5, // 1 CNY = 11.5 INR
  'INR/CNY': 0.087, // 1/11.5

  // Other currencies
  'AUD/INR': 54.5, // 1 AUD = 54.5 INR
  'INR/AUD': 0.018, // 1/54.5
  'CAD/INR': 61.2, // 1 CAD = 61.2 INR
  'INR/CAD': 0.016, // 1/61.2
  'CHF/INR': 93.5, // 1 CHF = 93.5 INR
  'INR/CHF': 0.011, // 1/93.5
};

/**
 * Calculate cross rates for INR pairs
 * @param baseRate - Base exchange rate (e.g., USD/INR)
 * @param quoteRate - Quote exchange rate (e.g., USD/EUR)
 * @returns Cross rate (INR/EUR)
 */
export function calculateCrossRate(baseRate: number, quoteRate: number): number {
  return baseRate * quoteRate;
}

/**
 * Get inverse rate (e.g., INR/USD from USD/INR)
 */
export function getInverseRate(rate: number): number {
  if (rate === 0) {
    throw new Error('Cannot calculate inverse of zero rate');
  }
  return 1 / rate;
}

/**
 * Format exchange rate for display
 */
export function formatExchangeRate(rate: number, pair: string, decimals: number = 4): string {
  const pairInfo = INR_RATE_PAIRS[pair];
  if (!pairInfo) {
    return `${pair}: ${rate.toFixed(decimals)}`;
  }
  return `${pairInfo.baseCurrency}/${pairInfo.quoteCurrency}: ${rate.toFixed(decimals)}`;
}

/**
 * Validate exchange rate pair
 */
export function isValidINRPair(pair: string): boolean {
  return pair in INR_RATE_PAIRS;
}

/**
 * Get high-volume INR pairs (important for India's trade)
 */
export function getHighVolumeINRPairs(): ExchangeRatePair[] {
  return Object.values(INR_RATE_PAIRS).filter((pair) => pair.typicalVolume === 'high');
}

/**
 * Calculate conversion with spread (buy/sell rates)
 * @param amount - Amount to convert
 * @param midRate - Mid-market rate
 * @param spreadPercent - Spread percentage (e.g., 0.5 for 0.5%)
 * @param isBuy - True if buying quote currency, false if selling
 */
export function convertWithSpread(
  amount: number,
  midRate: number,
  spreadPercent: number = 0.5,
  isBuy: boolean = true
): { convertedAmount: number; effectiveRate: number; spread: number } {
  const spreadMultiplier = 1 + spreadPercent / 100;
  const effectiveRate = isBuy ? midRate * spreadMultiplier : midRate / spreadMultiplier;
  const convertedAmount = amount * effectiveRate;
  const spread = Math.abs(effectiveRate - midRate) * amount;

  return {
    convertedAmount,
    effectiveRate,
    spread,
  };
}

/**
 * Historical rate support (placeholder for historical data)
 */
export interface HistoricalRate {
  date: string; // ISO 8601 date
  rate: number;
  pair: string;
}

/**
 * Get historical rate (placeholder implementation)
 * In production, this would fetch from a database or API
 */
export function getHistoricalRate(
  pair: string,
  date: string
): HistoricalRate | null {
  // Placeholder implementation
  // In production, fetch from historical data source
  if (!isValidINRPair(pair)) {
    return null;
  }

  return {
    date,
    rate: EXAMPLE_INR_RATES[pair] || 0,
    pair,
  };
}

/**
 * Calculate percentage change in exchange rate
 */
export function calculateRateChange(
  currentRate: number,
  previousRate: number
): { change: number; percentChange: number } {
  const change = currentRate - previousRate;
  const percentChange = (change / previousRate) * 100;

  return {
    change,
    percentChange,
  };
}
