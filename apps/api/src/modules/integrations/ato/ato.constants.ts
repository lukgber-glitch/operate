/**
 * ATO Integration Constants
 *
 * Australian Taxation Office API endpoints, codes, and configuration
 *
 * @see https://www.ato.gov.au/business/software-developers/
 */

/**
 * ATO API Base URLs
 */
export const ATO_API_URLS = {
  PRODUCTION: 'https://api.ato.gov.au',
  SANDBOX: 'https://api.sandbox.ato.gov.au',
  AUTH: 'https://ram.ato.gov.au/auth',
} as const;

/**
 * ATO API Endpoints
 */
export const ATO_ENDPOINTS = {
  // STP Phase 2
  STP_PAY_EVENT: '/stp/v1/payevents',
  STP_UPDATE_EVENT: '/stp/v1/updateevents',
  STP_FINALISATION: '/stp/v1/finalisation',

  // BAS
  BAS_SUBMIT: '/bas/v1/lodge',
  BAS_RETRIEVE: '/bas/v1/retrieve',
  BAS_PREFILL: '/bas/v1/prefill',
  BAS_OBLIGATIONS: '/bas/v1/obligations',

  // TPAR
  TPAR_SUBMIT: '/tpar/v1/lodge',
  TPAR_RETRIEVE: '/tpar/v1/retrieve',

  // General
  ABN_LOOKUP: '/abn/v1/lookup',
  STATUS_CHECK: '/v1/status',
} as const;

/**
 * BAS Label Codes (GST and Tax Labels)
 */
export const BAS_LABELS = {
  // GST Labels
  G1: 'Total sales',
  G2: 'Export sales',
  G3: 'Other GST-free sales',
  G4: 'Input taxed sales',
  G5: 'G2 + G3 + G4',
  G6: 'G1 - G5',
  G7: 'Adjustments (if applicable)',
  G8: 'G6 + G7',
  G9: 'G8 × 10%',
  G10: 'Capital purchases',
  G11: 'Non-capital purchases',
  G12: 'G10 + G11',
  G13: 'Purchases for making input taxed sales',
  G14: 'Purchases without GST in the price',
  G15: 'Estimated purchases for private use or not income tax deductible',
  G16: 'G13 + G14 + G15',
  G17: 'G12 - G16',
  G18: 'Adjustments (if applicable)',
  G19: 'G17 + G18',
  G20: 'G19 × 10%',
  G21: 'G9 - G20',

  // PAYG Withholding
  W1: 'Total salary, wages and other payments',
  W2: 'Amounts withheld from payments shown at W1',
  W3: 'Amounts withheld where no ABN quoted',
  W4: 'Amounts withheld from investment income',
  W5: 'Total amounts withheld (W2 + W3 + W4)',

  // PAYG Instalments
  T1: 'Instalment income',
  T2: 'New varied rate',
  T3: 'Reason code for variation',
  T4: 'PAYG instalment amount',

  // FBT
  F1: 'FBT instalment amount',
  F2: 'Estimated total FBT liability',
  F3: 'Varied FBT instalment rate',
  F4: 'Reason for FBT variation',
} as const;

/**
 * STP Event Types
 */
export const STP_EVENT_TYPES = {
  PAY_EVENT: 'PAY',
  UPDATE_EVENT: 'UPDATE',
  FINALISATION: 'FINALISATION',
  FULL_FILE_REPLACEMENT: 'FFR',
} as const;

/**
 * STP Employment Types
 */
export const STP_EMPLOYMENT_TYPES = {
  FULL_TIME: 'F',
  PART_TIME: 'P',
  CASUAL: 'C',
  LABOUR_HIRE: 'L',
  DEATH_BENEFICIARY: 'D',
  SUPERANNUATION: 'S',
} as const;

/**
 * STP Tax Treatment Codes
 */
export const STP_TAX_TREATMENT = {
  REGULAR: 'R',
  BACK_PAYMENT: 'B',
  COMMISSION: 'C',
  DIRECTOR: 'D',
  SEASONAL_WORKER: 'S',
  WORKING_HOLIDAY_MAKER: 'H',
  NO_TFN: 'N',
  SENIOR_AUSTRALIAN: 'A',
} as const;

/**
 * BAS Lodgement Periods
 */
export const BAS_PERIODS = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  ANNUAL: 'ANNUAL',
} as const;

/**
 * BAS Quarter Months
 */
export const BAS_QUARTERS = {
  Q1: ['07', '08', '09'], // Jul-Sep
  Q2: ['10', '11', '12'], // Oct-Dec
  Q3: ['01', '02', '03'], // Jan-Mar
  Q4: ['04', '05', '06'], // Apr-Jun
} as const;

/**
 * ATO Error Codes
 */
export const ATO_ERROR_CODES = {
  // Authentication
  INVALID_TOKEN: 'ATO_E001',
  TOKEN_EXPIRED: 'ATO_E002',
  INVALID_CREDENTIALS: 'ATO_E003',
  RAM_AUTH_FAILED: 'ATO_E004',

  // Validation
  INVALID_ABN: 'ATO_E101',
  INVALID_TFN: 'ATO_E102',
  INVALID_PERIOD: 'ATO_E103',
  INVALID_BAS_DATA: 'ATO_E104',
  INVALID_STP_DATA: 'ATO_E105',

  // Business Logic
  DUPLICATE_SUBMISSION: 'ATO_E201',
  OBLIGATION_NOT_FOUND: 'ATO_E202',
  PERIOD_NOT_READY: 'ATO_E203',
  ALREADY_LODGED: 'ATO_E204',

  // System
  API_UNAVAILABLE: 'ATO_E301',
  RATE_LIMITED: 'ATO_E302',
  TIMEOUT: 'ATO_E303',
  NETWORK_ERROR: 'ATO_E304',
} as const;

/**
 * ATO Error Messages
 */
export const ATO_ERROR_MESSAGES = {
  [ATO_ERROR_CODES.INVALID_TOKEN]: 'Invalid or missing authentication token',
  [ATO_ERROR_CODES.TOKEN_EXPIRED]: 'Authentication token has expired',
  [ATO_ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid myGovID or RAM credentials',
  [ATO_ERROR_CODES.RAM_AUTH_FAILED]: 'Relationship Authorisation Manager authentication failed',

  [ATO_ERROR_CODES.INVALID_ABN]: 'Invalid Australian Business Number (ABN)',
  [ATO_ERROR_CODES.INVALID_TFN]: 'Invalid Tax File Number (TFN)',
  [ATO_ERROR_CODES.INVALID_PERIOD]: 'Invalid lodgement period',
  [ATO_ERROR_CODES.INVALID_BAS_DATA]: 'BAS data validation failed',
  [ATO_ERROR_CODES.INVALID_STP_DATA]: 'STP data validation failed',

  [ATO_ERROR_CODES.DUPLICATE_SUBMISSION]: 'Duplicate submission detected',
  [ATO_ERROR_CODES.OBLIGATION_NOT_FOUND]: 'Tax obligation not found',
  [ATO_ERROR_CODES.PERIOD_NOT_READY]: 'Lodgement period not yet available',
  [ATO_ERROR_CODES.ALREADY_LODGED]: 'Return already lodged for this period',

  [ATO_ERROR_CODES.API_UNAVAILABLE]: 'ATO API is temporarily unavailable',
  [ATO_ERROR_CODES.RATE_LIMITED]: 'Rate limit exceeded',
  [ATO_ERROR_CODES.TIMEOUT]: 'Request timeout',
  [ATO_ERROR_CODES.NETWORK_ERROR]: 'Network connection error',
} as const;

/**
 * STP Validation Rules
 */
export const STP_VALIDATION = {
  MAX_EMPLOYEES_PER_EVENT: 1000,
  MAX_FILE_SIZE_MB: 50,
  MIN_GROSS_AMOUNT: 0,
  MAX_GROSS_AMOUNT: 999999999.99,
} as const;

/**
 * BAS Validation Rules
 */
export const BAS_VALIDATION = {
  MIN_AMOUNT: -999999999.99,
  MAX_AMOUNT: 999999999.99,
  DECIMAL_PLACES: 2,
} as const;

/**
 * ATO TLS Requirements
 */
export const ATO_TLS_CONFIG = {
  MIN_VERSION: 'TLSv1.2',
  CIPHERS: [
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'DHE-RSA-AES256-GCM-SHA384',
    'DHE-RSA-AES128-GCM-SHA256',
  ].join(':'),
} as const;

/**
 * API Rate Limits
 */
export const ATO_RATE_LIMITS = {
  STP_SUBMISSIONS_PER_HOUR: 100,
  BAS_SUBMISSIONS_PER_HOUR: 50,
  API_CALLS_PER_MINUTE: 60,
} as const;

/**
 * Retry Configuration
 */
export const ATO_RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 10000,
  BACKOFF_MULTIPLIER: 2,
} as const;
