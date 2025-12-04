/**
 * GST IRP Constants
 *
 * Configuration constants for India's e-invoicing system
 */

import { IrpRateLimits } from './gst-irp.types';

/**
 * IRP API Endpoints (Sandbox)
 */
export const IRP_SANDBOX_ENDPOINTS = {
  BASE_URL: 'https://gsp.adaequare.com/test/enriched/ei/api',
  AUTH: '/auth',
  GENERATE_IRN: '/invoice',
  CANCEL_IRN: '/invoice/cancel',
  GET_IRN: '/invoice/irn',
  GET_IRN_BY_DOC: '/invoice/irnbydocdetails',
} as const;

/**
 * IRP API Endpoints (Production)
 */
export const IRP_PRODUCTION_ENDPOINTS = {
  BASE_URL: 'https://gsp.adaequare.com/enriched/ei/api',
  AUTH: '/auth',
  GENERATE_IRN: '/invoice',
  CANCEL_IRN: '/invoice/cancel',
  GET_IRN: '/invoice/irn',
  GET_IRN_BY_DOC: '/invoice/irnbydocdetails',
} as const;

/**
 * Alternative GSP Providers
 * Organizations can choose from multiple GSP providers
 */
export const GSP_PROVIDERS = {
  ADAEQUARE: {
    name: 'Adaequare Technologies',
    sandbox: 'https://gsp.adaequare.com/test/enriched/ei/api',
    production: 'https://gsp.adaequare.com/enriched/ei/api',
  },
  TERA: {
    name: 'Tera Software',
    sandbox: 'https://einvoicetest.terasoft.in/api',
    production: 'https://einvoice.terasoft.in/api',
  },
  IRIS: {
    name: 'Iris Business Services',
    sandbox: 'https://einv-apisandbox.irisgst.com/v1.03',
    production: 'https://einv-api.irisgst.com/v1.03',
  },
  CLEARTAX: {
    name: 'ClearTax',
    sandbox: 'https://einvoicing-sandbox.cleartax.in/v1',
    production: 'https://einvoicing.cleartax.in/v1',
  },
} as const;

/**
 * IRP Rate Limits (as per NIC guidelines)
 */
export const IRP_RATE_LIMITS: IrpRateLimits = {
  requestsPerSecond: 10,
  requestsPerMinute: 500,
  requestsPerHour: 10000,
  dailyLimit: 100000,
};

/**
 * GST State Codes
 */
export const GST_STATE_CODES = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
} as const;

/**
 * Unit Quantity Codes (UQC)
 */
export const UQC_CODES = {
  BAG: 'BAGS',
  BAL: 'BALE',
  BDL: 'BUNDLES',
  BKL: 'BUCKLES',
  BOU: 'BILLION OF UNITS',
  BOX: 'BOX',
  BTL: 'BOTTLES',
  BUN: 'BUNCHES',
  CAN: 'CANS',
  CBM: 'CUBIC METERS',
  CCM: 'CUBIC CENTIMETERS',
  CMS: 'CENTIMETERS',
  CTN: 'CARTONS',
  DOZ: 'DOZENS',
  DRM: 'DRUMS',
  GGK: 'GREAT GROSS',
  GMS: 'GRAMMES',
  GRS: 'GROSS',
  GYD: 'GROSS YARDS',
  KGS: 'KILOGRAMS',
  KLR: 'KILOLITRE',
  KME: 'KILOMETRE',
  LTR: 'LITRES',
  MLT: 'MILLILITRE',
  MTR: 'METERS',
  MTS: 'METRIC TON',
  NOS: 'NUMBERS',
  OTH: 'OTHERS',
  PAC: 'PACKS',
  PCS: 'PIECES',
  PRS: 'PAIRS',
  QTL: 'QUINTAL',
  ROL: 'ROLLS',
  SET: 'SETS',
  SQF: 'SQUARE FEET',
  SQM: 'SQUARE METERS',
  SQY: 'SQUARE YARDS',
  TBS: 'TABLETS',
  TGM: 'TEN GROSS',
  THD: 'THOUSANDS',
  TON: 'TONNES',
  TUB: 'TUBES',
  UGS: 'US GALLONS',
  UNT: 'UNITS',
  YDS: 'YARDS',
} as const;

/**
 * Cancellation Reasons
 */
export const CANCELLATION_REASONS = {
  '1': 'Duplicate',
  '2': 'Data entry mistake',
  '3': 'Order cancelled',
  '4': 'Others',
} as const;

/**
 * E-Invoice Schema Versions
 */
export const SCHEMA_VERSIONS = {
  V1_0: '1.0',
  V1_1: '1.1',
  CURRENT: '1.1',
} as const;

/**
 * GST Rates
 */
export const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28] as const;

/**
 * Timeout Settings
 */
export const TIMEOUT_CONFIG = {
  AUTH: 10000, // 10 seconds
  GENERATE_IRN: 30000, // 30 seconds
  CANCEL_IRN: 15000, // 15 seconds
  GET_IRN: 10000, // 10 seconds
  BULK: 120000, // 2 minutes
  DEFAULT: 30000, // 30 seconds
} as const;

/**
 * Retry Configuration
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  BACKOFF_MULTIPLIER: 2,
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
  RETRYABLE_ERROR_CODES: ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED'],
} as const;

/**
 * Validation Patterns
 */
export const VALIDATION_PATTERNS = {
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  PINCODE: /^[0-9]{6}$/,
  IRN: /^[0-9a-f]{64}$/i,
  DOCUMENT_NUMBER: /^[A-Z0-9\/-]{1,16}$/,
  HSN_CODE: /^[0-9]{4,8}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[0-9]{10}$/,
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  INVALID_GSTIN: 'Invalid GSTIN format',
  INVALID_IRN: 'Invalid IRN format',
  INVALID_DOCUMENT_NUMBER: 'Invalid document number format',
  INVALID_DATE_FORMAT: 'Date must be in DD/MM/YYYY format',
  INVALID_HSN_CODE: 'Invalid HSN/SAC code format',
  AUTHENTICATION_FAILED: 'GSP authentication failed',
  TOKEN_EXPIRED: 'Authentication token expired',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  DUPLICATE_IRN: 'IRN already generated for this invoice',
  CANCELLATION_WINDOW_EXPIRED: 'Cancellation window (24 hours) expired',
  INVOICE_NOT_FOUND: 'Invoice not found in IRP',
  INVALID_SIGNATURE: 'Digital signature validation failed',
  NETWORK_ERROR: 'Network error occurred',
  TIMEOUT_ERROR: 'Request timeout',
  VALIDATION_ERROR: 'Validation error',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  IRN_GENERATED: 'IRN generated successfully',
  IRN_CANCELLED: 'IRN cancelled successfully',
  IRN_FETCHED: 'IRN details fetched successfully',
  AUTHENTICATION_SUCCESS: 'Authentication successful',
} as const;

/**
 * Audit Event Types
 */
export const AUDIT_EVENTS = {
  GENERATE_IRN: 'GENERATE_IRN',
  CANCEL_IRN: 'CANCEL_IRN',
  FETCH_IRN: 'FETCH_IRN',
  AUTHENTICATION: 'AUTHENTICATION',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  API_ERROR: 'API_ERROR',
} as const;

/**
 * TLS Configuration
 */
export const TLS_CONFIG = {
  MIN_VERSION: 'TLSv1.3',
  CIPHERS: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256',
  ].join(':'),
  REJECT_UNAUTHORIZED: true,
} as const;

/**
 * Cache TTL (Time To Live)
 */
export const CACHE_TTL = {
  AUTH_TOKEN: 3600, // 1 hour
  IRN_DETAILS: 86400, // 24 hours
  GSP_CONFIG: 300, // 5 minutes
} as const;

/**
 * Batch Processing Limits
 */
export const BATCH_LIMITS = {
  MAX_BATCH_SIZE: 100,
  MAX_CONCURRENT_REQUESTS: 10,
  BATCH_TIMEOUT: 300000, // 5 minutes
} as const;

/**
 * Invoice Value Limits
 */
export const INVOICE_LIMITS = {
  MIN_VALUE: 0.01,
  MAX_VALUE: 99999999.99,
  MAX_ITEMS: 1000,
  E_INVOICE_THRESHOLD: 500, // Rs. 500 Crores for some states
} as const;

/**
 * Date Formats
 */
export const DATE_FORMATS = {
  GST_DATE: 'DD/MM/YYYY',
  ISO_DATE: 'YYYY-MM-DD',
  TIMESTAMP: 'YYYY-MM-DD HH:mm:ss',
} as const;
