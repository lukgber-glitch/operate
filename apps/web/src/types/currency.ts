/**
 * Currency Types for Frontend
 *
 * Mirrors backend types from apps/api/src/modules/currency/types/currency.types.ts
 */

/**
 * ISO 4217 Currency Code
 */
export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CHF'
  | 'CAD'
  | 'AUD'
  | 'NZD'
  | 'SGD'
  | 'JPY'
  | 'CNY'
  | 'KRW'
  | 'INR'
  | 'HKD'
  | 'AED'
  | 'SAR'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'PLN'
  | 'CZK'
  | 'HUF'
  | 'RON'
  | 'MXN'
  | 'BRL'
  | 'RUB'
  | 'TRY'
  | 'THB'
  | 'MYR'
  | 'IDR'
  | 'PHP'
  | 'VND'
  | 'ZAR'
  | 'NGN'
  | 'ILS';

/**
 * Currency symbol position
 */
export type CurrencyFormat = 'before' | 'after';

/**
 * Currency rounding method
 */
export type CurrencyRounding = 'standard' | 'cash';

/**
 * Region grouping
 */
export type CurrencyRegion =
  | 'North America'
  | 'Europe'
  | 'Asia'
  | 'Oceania'
  | 'Middle East'
  | 'South America'
  | 'Africa';

/**
 * Currency metadata
 */
export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
  countries: string[];
  flag: string;
  format: CurrencyFormat;
  locale?: string;
  rounding?: CurrencyRounding;
  region?: CurrencyRegion;
}

/**
 * Multi-currency amount
 */
export interface MultiCurrencyAmount {
  amount: number;
  currency: CurrencyCode;
  formattedAmount?: string;
}

/**
 * Exchange rate
 */
export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  timestamp: Date | string;
  source?: string;
}

/**
 * Currency conversion result
 */
export interface CurrencyConversion {
  originalAmount: number;
  originalCurrency: CurrencyCode;
  convertedAmount: number;
  convertedCurrency: CurrencyCode;
  exchangeRate: number;
  conversionDate: Date | string;
}

/**
 * Currency formatting options
 */
export interface CurrencyFormatOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  compact?: boolean;
}

/**
 * Currency pair
 */
export type CurrencyPair = [CurrencyCode, CurrencyCode];
