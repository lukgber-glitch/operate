/**
 * Currency Configurations Index
 *
 * Exports all currency configuration modules
 */

export * from './cad-currency.config';
export * from './aud-currency.config';
export * from './sgd-currency.config';

import { CAD_CURRENCY_CONFIG, CAD_METADATA } from './cad-currency.config';
import { AUD_CURRENCY_CONFIG, AUD_METADATA } from './aud-currency.config';
import { SGD_CURRENCY_CONFIG, SGD_METADATA } from './sgd-currency.config';

/**
 * Registry of all extended currency configurations
 */
export const EXTENDED_CURRENCY_REGISTRY = {
  CAD: CAD_CURRENCY_CONFIG,
  AUD: AUD_CURRENCY_CONFIG,
  SGD: SGD_CURRENCY_CONFIG,
};

/**
 * Registry of all currency metadata
 */
export const CURRENCY_METADATA_REGISTRY = {
  CAD: CAD_METADATA,
  AUD: AUD_METADATA,
  SGD: SGD_METADATA,
};

/**
 * Get extended currency configuration by code
 */
export function getExtendedCurrencyConfig(code: string) {
  const upperCode = code.toUpperCase();
  return EXTENDED_CURRENCY_REGISTRY[upperCode as keyof typeof EXTENDED_CURRENCY_REGISTRY];
}

/**
 * Get currency metadata by code
 */
export function getCurrencyMetadata(code: string) {
  const upperCode = code.toUpperCase();
  return CURRENCY_METADATA_REGISTRY[upperCode as keyof typeof CURRENCY_METADATA_REGISTRY];
}
