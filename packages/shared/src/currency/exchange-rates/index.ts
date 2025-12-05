/**
 * Exchange Rates Module
 */

// Export ExchangeRatePair type from jpy-pairs as canonical
export type { ExchangeRatePair } from './jpy-pairs';

// JPY pairs
export {
  JPY_RATE_PAIRS,
  getJPYPair,
  getAllJPYPairs,
  convertCurrency as convertJPYCurrency,
  EXAMPLE_JPY_RATES,
  calculateCrossRate as calculateJPYCrossRate,
  getInverseRate as getJPYInverseRate,
  formatExchangeRate as formatJPYExchangeRate,
  isValidJPYPair,
} from './jpy-pairs';

// AED pairs
export {
  AED_RATE_PAIRS,
  getAEDPair,
  getAllAEDPairs,
  convertCurrency as convertAEDCurrency,
  EXAMPLE_AED_RATES,
  calculateCrossRate as calculateAEDCrossRate,
  getInverseRate as getAEDInverseRate,
  formatExchangeRate as formatAEDExchangeRate,
  isValidAEDPair,
  getPeggedRate as getAEDPeggedRate,
} from './aed-pairs';

// SAR pairs
export {
  SAR_RATE_PAIRS,
  getSARPair,
  getAllSARPairs,
  convertCurrency as convertSARCurrency,
  EXAMPLE_SAR_RATES,
  calculateCrossRate as calculateSARCrossRate,
  getInverseRate as getSARInverseRate,
  formatExchangeRate as formatSARExchangeRate,
  isValidSARPair,
  getPeggedRate as getSARPeggedRate,
} from './sar-pairs';

// INR pairs
export {
  INR_RATE_PAIRS,
  getINRPair,
  getAllINRPairs,
  convertCurrency as convertINRCurrency,
  EXAMPLE_INR_RATES,
  calculateCrossRate as calculateINRCrossRate,
  getInverseRate as getINRInverseRate,
  formatExchangeRate as formatINRExchangeRate,
  isValidINRPair,
  getHighVolumeINRPairs,
  convertWithSpread,
  getHistoricalRate,
  calculateRateChange,
} from './inr-pairs';
export type { HistoricalRate } from './inr-pairs';
