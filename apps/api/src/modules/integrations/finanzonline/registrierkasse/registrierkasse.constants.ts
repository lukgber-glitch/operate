/**
 * Registrierkasse Constants
 * Constants for Austrian RKSV (Registrierkassensicherheitsverordnung) compliance
 */

/**
 * RKSV version
 */
export const RKSV_VERSION = '2017';

/**
 * DEP format version (current standard)
 */
export const DEP_VERSION = 'DEP7';

/**
 * Default currency
 */
export const DEFAULT_CURRENCY = 'EUR';

/**
 * Austrian VAT rates (as of 2024)
 */
export const AUSTRIAN_VAT_RATES = {
  /** Standard rate */
  STANDARD: 20,
  /** Reduced rate 1 (food, books, etc.) */
  REDUCED_1: 10,
  /** Reduced rate 2 (specific products) */
  REDUCED_2: 13,
  /** Special rate (agriculture) */
  SPECIAL: 19,
  /** Zero rate */
  ZERO: 0,
} as const;

/**
 * Signature algorithms supported
 */
export const SUPPORTED_SIGNATURE_ALGORITHMS = ['ES256', 'RS256'] as const;

/**
 * Default signature algorithm
 */
export const DEFAULT_SIGNATURE_ALGORITHM = 'ES256';

/**
 * AES key length (bits)
 */
export const AES_KEY_LENGTH = 256;

/**
 * Maximum receipt items per receipt
 */
export const MAX_RECEIPT_ITEMS = 1000;

/**
 * Maximum description length
 */
export const MAX_DESCRIPTION_LENGTH = 255;

/**
 * Receipt number format
 */
export const RECEIPT_NUMBER_FORMAT = {
  /** Minimum value */
  MIN: 1,
  /** Maximum value (reset after this) */
  MAX: 999999999,
} as const;

/**
 * QR code configuration
 */
export const QR_CODE_CONFIG = {
  /** QR code version */
  VERSION: 'QR1',
  /** Error correction level */
  ERROR_CORRECTION: 'M',
  /** Maximum data length */
  MAX_LENGTH: 500,
} as const;

/**
 * OCR code configuration
 */
export const OCR_CODE_CONFIG = {
  /** OCR code version */
  VERSION: 'OCR1',
  /** Total length */
  LENGTH: 32,
  /** Checksum length */
  CHECKSUM_LENGTH: 4,
} as const;

/**
 * DEP export limits
 */
export const DEP_EXPORT_LIMITS = {
  /** Maximum receipts per export */
  MAX_RECEIPTS: 100000,
  /** Maximum period in days */
  MAX_PERIOD_DAYS: 366,
} as const;

/**
 * Closing receipt requirements
 */
export const CLOSING_RECEIPT_REQUIREMENTS = {
  /** Daily closing - required after this many hours */
  DAILY_MAX_HOURS: 24,
  /** Monthly closing - required after this many days */
  MONTHLY_MAX_DAYS: 31,
  /** Annual closing - required after this many days */
  ANNUAL_MAX_DAYS: 366,
} as const;

/**
 * Null receipt (Nullbeleg) requirements
 */
export const NULL_RECEIPT_REQUIREMENTS = {
  /** Required if no receipts for X hours */
  HOURS_WITHOUT_RECEIPTS: 24,
  /** Maximum interval between null receipts (hours) */
  MAX_INTERVAL_HOURS: 24,
} as const;

/**
 * Receipt validation rules
 */
export const RECEIPT_VALIDATION_RULES = {
  /** Minimum total amount (in cents) - can be negative for voids */
  MIN_TOTAL_AMOUNT: -999999999,
  /** Maximum total amount (in cents) */
  MAX_TOTAL_AMOUNT: 999999999,
  /** Minimum quantity */
  MIN_QUANTITY: 0.001,
  /** Maximum quantity */
  MAX_QUANTITY: 999999,
  /** Price precision (decimal places) */
  PRICE_PRECISION: 2,
} as const;

/**
 * Signature counter limits
 */
export const SIGNATURE_COUNTER_LIMITS = {
  /** Initial value */
  INITIAL: 0,
  /** Maximum value */
  MAX: 999999999,
} as const;

/**
 * Turnover counter limits (in cents)
 */
export const TURNOVER_COUNTER_LIMITS = {
  /** Initial value */
  INITIAL: 0,
  /** Maximum value before overflow */
  MAX: Number.MAX_SAFE_INTEGER,
} as const;

/**
 * JWS header for RKSV signatures
 */
export const JWS_HEADER = {
  /** Algorithm */
  alg: 'ES256',
  /** Type */
  typ: 'JWT',
} as const;

/**
 * FinanzOnline cash register endpoints
 */
export const FINANZONLINE_CASH_REGISTER_ENDPOINTS = {
  /** Register new cash register */
  REGISTER: 'registerCashRegister',
  /** Deregister cash register */
  DEREGISTER: 'deregisterCashRegister',
  /** Update cash register */
  UPDATE: 'updateCashRegister',
  /** Get cash register status */
  STATUS: 'getCashRegisterStatus',
} as const;

/**
 * Error codes specific to Registrierkasse
 */
export const REGISTRIERKASSE_ERROR_CODES = {
  /** Invalid cash register ID */
  INVALID_CASH_REGISTER_ID: 'RK001',
  /** Cash register not found */
  CASH_REGISTER_NOT_FOUND: 'RK002',
  /** Cash register already registered */
  CASH_REGISTER_ALREADY_REGISTERED: 'RK003',
  /** Invalid signature */
  INVALID_SIGNATURE: 'RK004',
  /** Signature device error */
  SIGNATURE_DEVICE_ERROR: 'RK005',
  /** Invalid receipt data */
  INVALID_RECEIPT_DATA: 'RK006',
  /** Receipt chain broken */
  RECEIPT_CHAIN_BROKEN: 'RK007',
  /** Counter overflow */
  COUNTER_OVERFLOW: 'RK008',
  /** Invalid VAT breakdown */
  INVALID_VAT_BREAKDOWN: 'RK009',
  /** DEP export error */
  DEP_EXPORT_ERROR: 'RK010',
  /** Registration failed */
  REGISTRATION_FAILED: 'RK011',
  /** Cash register inactive */
  CASH_REGISTER_INACTIVE: 'RK012',
  /** Invalid closing period */
  INVALID_CLOSING_PERIOD: 'RK013',
  /** Missing null receipt */
  MISSING_NULL_RECEIPT: 'RK014',
  /** Invalid QR code */
  INVALID_QR_CODE: 'RK015',
} as const;

/**
 * Cache keys for Registrierkasse
 */
export const REGISTRIERKASSE_CACHE_KEYS = {
  /** Cash register data */
  CASH_REGISTER: 'rk:register:',
  /** Receipt counter */
  RECEIPT_COUNTER: 'rk:counter:receipt:',
  /** Signature counter */
  SIGNATURE_COUNTER: 'rk:counter:signature:',
  /** Turnover counter */
  TURNOVER_COUNTER: 'rk:counter:turnover:',
  /** Last receipt hash */
  LAST_RECEIPT_HASH: 'rk:hash:last:',
  /** Statistics */
  STATISTICS: 'rk:stats:',
} as const;

/**
 * Cache TTL for Registrierkasse (seconds)
 */
export const REGISTRIERKASSE_CACHE_TTL = {
  /** Cash register data (24 hours) */
  CASH_REGISTER: 86400,
  /** Counters (1 hour) */
  COUNTER: 3600,
  /** Statistics (1 hour) */
  STATISTICS: 3600,
} as const;

/**
 * Software information
 */
export const SOFTWARE_INFO = {
  /** Manufacturer/Vendor */
  MANUFACTURER: 'CoachOS/Operate',
  /** Software name */
  NAME: 'Operate Registrierkasse',
  /** Version */
  VERSION: '1.0.0',
  /** Certification number (to be obtained) */
  CERTIFICATION_NUMBER: 'PENDING',
} as const;

/**
 * Training mode marker
 */
export const TRAINING_MODE_MARKER = 'SCHULUNG';

/**
 * Receipt type markers for DEP export
 */
export const RECEIPT_TYPE_MARKERS = {
  STANDARD: 'Standard-Beleg',
  TRAINING: 'Schulungs-Beleg',
  VOID: 'Storno-Beleg',
  NULL: 'Null-Beleg',
  START: 'Start-Beleg',
  DAILY_CLOSING: 'Tagesabschluss',
  MONTHLY_CLOSING: 'Monatsabschluss',
  ANNUAL_CLOSING: 'Jahresabschluss',
} as const;

/**
 * Date and time formats
 */
export const DATE_TIME_FORMATS = {
  /** ISO 8601 format */
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  /** Receipt format */
  RECEIPT: 'DD.MM.YYYY HH:mm:ss',
  /** Date code for OCR */
  OCR_DATE: 'YYMMDD',
  /** Time code for OCR */
  OCR_TIME: 'HHmm',
  /** DEP export format */
  DEP: 'YYYY-MM-DDTHH:mm:ss',
} as const;

/**
 * Validation regex patterns
 */
export const VALIDATION_PATTERNS = {
  /** Cash register ID (alphanumeric, 1-20 chars) */
  CASH_REGISTER_ID: /^[A-Z0-9]{1,20}$/,
  /** Tax number (Austrian format) */
  TAX_NUMBER: /^\d{2}-\d{3}\/\d{4}$/,
  /** VAT ID (Austrian format) */
  VAT_ID: /^ATU\d{8}$/,
  /** Certificate serial (hex) */
  CERTIFICATE_SERIAL: /^[0-9A-F]+$/i,
} as const;

/**
 * Default values
 */
export const DEFAULTS = {
  /** Currency */
  CURRENCY: 'EUR',
  /** Training mode */
  TRAINING_MODE: false,
  /** Signature algorithm */
  SIGNATURE_ALGORITHM: 'ES256' as const,
  /** DEP format */
  DEP_FORMAT: 'DEP7',
} as const;

/**
 * HSM/A-Trust configuration
 */
export const SIGNATURE_DEVICE_CONFIG = {
  /** A-Trust production endpoint */
  ATRUST_PRODUCTION: 'https://www.a-trust.at/rkssignature',
  /** A-Trust test endpoint */
  ATRUST_TEST: 'https://test.a-trust.at/rkssignature',
  /** Request timeout (ms) */
  TIMEOUT: 30000,
  /** Maximum retries */
  MAX_RETRIES: 3,
} as const;

/**
 * Receipt chain validation
 */
export const CHAIN_VALIDATION = {
  /** Enable chain validation */
  ENABLED: true,
  /** Allow chain breaks (for recovery) */
  ALLOW_BREAKS: false,
  /** Maximum gap in receipt numbers */
  MAX_RECEIPT_GAP: 1000,
} as const;
