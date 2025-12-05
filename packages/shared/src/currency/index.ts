/**
 * Currency Module
 */

// JPY exports
export * from './jpy';

// AED exports (ARABIC_NUMERALS renamed to avoid conflict with SAR)
export {
  AED_CONSTANTS,
  AED_EXCHANGE_PAIRS,
  AED_RANGES,
  ARABIC_NUMERALS as AED_ARABIC_NUMERALS,
} from './aed/aed.constants';
export type { AEDExchangePair } from './aed/aed.constants';
export {
  formatAED,
  parseAED,
  formatAEDCompact,
  validateAEDAmount,
  formatAEDInWords,
} from './aed/aed.formatter';
export type { AEDFormattingOptions } from './aed/aed.formatter';

// SAR exports (ARABIC_NUMERALS renamed to avoid conflict with AED)
export {
  SAR_CONSTANTS,
  SAR_EXCHANGE_PAIRS,
  SAR_RANGES,
  ARABIC_NUMERALS as SAR_ARABIC_NUMERALS,
} from './sar/sar.constants';
export type { SARExchangePair } from './sar/sar.constants';
export {
  formatSAR,
  parseSAR,
  formatSARCompact,
  validateSARAmount,
  formatSARInWords,
} from './sar/sar.formatter';
export type { SARFormattingOptions } from './sar/sar.formatter';

// INR exports
export * from './inr';

// Exchange rates
export * from './exchange-rates';
