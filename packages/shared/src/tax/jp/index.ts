/**
 * Japanese Tax Configuration Exports
 * Task: W27-T4 - Japanese tax configuration
 */

// Consumption Tax Configuration
export * from './consumption-tax.config';

// Prefecture Configuration
export * from './prefecture.config';

// Entity Types
export * from './entity-types.config';

// Validators
export * from './invoice-registration.validator';

// Re-export commonly used items for convenience
export {
  JAPAN_CONSUMPTION_TAX_RATES,
  JAPAN_QUALIFIED_INVOICE_SYSTEM,
  JAPAN_TAX_PERIODS,
  JAPAN_FILING_THRESHOLDS,
  JAPAN_REDUCED_RATE_ITEMS,
  JAPAN_TAX_EXEMPT_ITEMS,
  JAPAN_PRICING_DISPLAY,
} from './consumption-tax.config';

export {
  JAPAN_PREFECTURES,
  JAPAN_REGIONS,
  JAPAN_PREFECTURE_LOOKUP,
  type Prefecture,
} from './prefecture.config';

export {
  JAPAN_ENTITY_TYPES,
  JAPAN_CORPORATE_NUMBER,
  JAPAN_INVOICE_REGISTRATION_NUMBER,
  type EntityType,
} from './entity-types.config';

export {
  CorporateNumberValidator,
  InvoiceRegistrationNumberValidator,
  JapanTaxNumberValidator,
  type ValidationResult,
} from './invoice-registration.validator';
