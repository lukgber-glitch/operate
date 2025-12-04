/**
 * India GST (Goods and Services Tax) Configuration Exports
 * Task: W29-T4 - India GST configuration
 */

// GST Rates and Configuration
export * from './gst-rates.config';

// States and Union Territories
export * from './in-states.config';

// Validators
export * from './gstin.validator';

// Re-export commonly used items for convenience
export {
  INDIA_GST_RATES,
  INDIA_GST_RATE_BREAKDOWN,
  INDIA_GST_CATEGORIES,
  INDIA_GST_REGISTRATION_THRESHOLDS,
  INDIA_GST_RETURN_PERIODS,
  INDIA_PLACE_OF_SUPPLY_RULES,
  INDIA_REVERSE_CHARGE_MECHANISM,
  INDIA_ITC_RULES,
  INDIA_E_INVOICING,
  INDIA_E_WAY_BILL,
  INDIA_GSTIN_FORMAT,
  INDIA_HSN_SAC,
  INDIA_GST_PENALTIES,
  INDIA_TAX_AUTHORITY,
  INDIA_GST_TDS_TCS,
  INDIA_GST_REFUND,
  INDIA_ZERO_RATE_ITEMS,
  INDIA_FIVE_PERCENT_ITEMS,
  INDIA_TWELVE_PERCENT_ITEMS,
  INDIA_EIGHTEEN_PERCENT_ITEMS,
  INDIA_TWENTY_EIGHT_PERCENT_ITEMS,
  INDIA_GST_EXEMPT_ITEMS,
  INDIA_ZERO_RATED_SUPPLIES,
  INDIA_GST_CESS_RATES,
} from './gst-rates.config';

export {
  INDIA_STATES,
  INDIA_REGIONS,
  INDIA_STATE_LOOKUP,
  INDIA_SPECIAL_CATEGORY_STATES,
  INDIA_UNION_TERRITORIES,
  INDIA_GST_STATE_CODES,
  INDIA_MAJOR_CITIES,
  INDIA_STATE_TAX_DEPARTMENTS,
  type IndianState,
} from './in-states.config';

export {
  GSTINValidator,
  PANValidator,
  GSTTransactionTypeValidator,
  HSNSACValidator,
  IndiaGSTValidators,
  type GSTINValidationResult,
} from './gstin.validator';
