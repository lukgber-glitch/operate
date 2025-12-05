/**
 * Currency Library
 *
 * Currency data, utilities, and API client
 */

// Static currency data and utilities
export {
  CURRENCY_DATA,
  POPULAR_CURRENCIES,
  getCurrenciesByRegion,
  getCurrency,
  getAllCurrencies,
  searchCurrencies,
} from './currency-data';

// API client - renamed to avoid conflict with static getCurrency
export {
  getCurrencies as fetchCurrencies,
  getCurrency as fetchCurrency,
  getExchangeRate,
  getExchangeRates,
  convertCurrency,
  convertCurrencyBatch,
  currencyApi,
} from './currency-api';

export type { BatchConversionRequest } from './currency-api';
