/**
 * Currency Types
 *
 * Type definitions for multi-currency operations
 * Can be exported to @operate/shared for use across the monorepo
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
 * Multi-currency amount
 * Used for storing amounts with currency information
 */
export interface MultiCurrencyAmount {
  amount: number;
  currency: CurrencyCode;
  formattedAmount?: string;
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
  conversionDate: Date;
}

/**
 * Currency exchange rate
 */
export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  timestamp: Date;
  source?: string;
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
}

/**
 * Currency metadata for UI components
 */
export interface CurrencyMetadata {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
  flag: string;
}

/**
 * Multi-currency transaction
 * Used in Invoice, Expense, Payment models
 */
export interface MultiCurrencyTransaction {
  // Original amounts
  amount: number;
  currency: CurrencyCode;

  // Conversion (if applicable)
  convertedAmount?: number;
  convertedCurrency?: CurrencyCode;
  exchangeRate?: number;
  exchangeRateDate?: Date;

  // For audit trail
  originalAmount?: number;
  originalCurrency?: CurrencyCode;
}

/**
 * Currency pair for exchange rates
 */
export type CurrencyPair = [CurrencyCode, CurrencyCode];

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
