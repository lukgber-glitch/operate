/**
 * UAE Federal Tax Authority (FTA) Constants
 * E-invoicing integration for UAE VAT compliance
 */

/**
 * FTA Environments
 */
export enum FTAEnvironment {
  PRODUCTION = 'production',
  SANDBOX = 'sandbox',
}

/**
 * FTA API Endpoints
 */
export const FTA_ENDPOINTS = {
  production: {
    baseUrl: 'https://api.tax.gov.ae/einvoicing',
    auth: '/oauth2/token',
    submit: '/api/v1/invoices/submit',
    validate: '/api/v1/invoices/validate',
    status: '/api/v1/invoices/status',
    cancel: '/api/v1/invoices/cancel',
    trnValidation: '/api/v1/taxpayer/validate',
  },
  sandbox: {
    baseUrl: 'https://sandbox-api.tax.gov.ae/einvoicing',
    auth: '/oauth2/token',
    submit: '/api/v1/invoices/submit',
    validate: '/api/v1/invoices/validate',
    status: '/api/v1/invoices/status',
    cancel: '/api/v1/invoices/cancel',
    trnValidation: '/api/v1/taxpayer/validate',
  },
};

/**
 * UAE VAT Rates
 */
export const UAE_VAT_RATES = {
  STANDARD: 0.05, // 5% standard rate
  ZERO_RATED: 0.0, // 0% for exports, international transport, etc.
  EXEMPT: null, // Exempt from VAT
} as const;

/**
 * UAE VAT Rate Codes
 */
export enum UAEVATRateCode {
  STANDARD = 'S', // 5% Standard rate
  ZERO_RATED = 'Z', // 0% Zero-rated
  EXEMPT = 'E', // Exempt
  OUT_OF_SCOPE = 'O', // Out of scope
}

/**
 * UAE Invoice Types (UBL 2.1 compliant)
 */
export enum UAEInvoiceType {
  INVOICE = '380', // Commercial invoice
  CREDIT_NOTE = '381', // Credit note (refund/correction)
  DEBIT_NOTE = '383', // Debit note (additional charges)
  TAX_INVOICE = '388', // Tax invoice
  SELF_BILLED_INVOICE = '389', // Self-billed invoice
}

/**
 * UAE Invoice Status
 */
export enum UAEInvoiceStatus {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

/**
 * UAE Emirates Codes
 */
export const UAE_EMIRATES = {
  ABU_DHABI: { code: 'AZ', name: 'Abu Dhabi' },
  AJMAN: { code: 'AJ', name: 'Ajman' },
  DUBAI: { code: 'DU', name: 'Dubai' },
  FUJAIRAH: { code: 'FU', name: 'Fujairah' },
  RAS_AL_KHAIMAH: { code: 'RK', name: 'Ras Al Khaimah' },
  SHARJAH: { code: 'SH', name: 'Sharjah' },
  UMM_AL_QUWAIN: { code: 'UQ', name: 'Umm Al Quwain' },
} as const;

/**
 * UAE Business Activity Codes (Sample - expand based on FTA classification)
 */
export const UAE_BUSINESS_ACTIVITIES = {
  MANUFACTURING: '1000',
  CONSTRUCTION: '2000',
  WHOLESALE_TRADE: '3000',
  RETAIL_TRADE: '4000',
  TRANSPORTATION: '5000',
  ACCOMMODATION_FOOD: '6000',
  INFORMATION_COMMUNICATION: '7000',
  FINANCIAL_INSURANCE: '8000',
  REAL_ESTATE: '9000',
  PROFESSIONAL_SERVICES: '10000',
  EDUCATION: '11000',
  HEALTHCARE: '12000',
} as const;

/**
 * UAE Currency Codes (ISO 4217)
 */
export const UAE_CURRENCIES = {
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£' },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
} as const;

/**
 * FTA Error Codes
 */
export const FTA_ERROR_CODES = {
  // Authentication errors
  AUTH_001: 'Invalid credentials',
  AUTH_002: 'Token expired',
  AUTH_003: 'Insufficient permissions',

  // Validation errors
  VAL_001: 'Invalid TRN format',
  VAL_002: 'Invalid invoice format',
  VAL_003: 'Invalid VAT calculation',
  VAL_004: 'Missing required fields',
  VAL_005: 'Invalid date format',
  VAL_006: 'Invalid currency code',
  VAL_007: 'Invalid amount',

  // Submission errors
  SUB_001: 'Invoice already submitted',
  SUB_002: 'Duplicate invoice number',
  SUB_003: 'Invoice submission failed',
  SUB_004: 'Rate limit exceeded',

  // Business rule errors
  BUS_001: 'TRN not registered',
  BUS_002: 'TRN suspended',
  BUS_003: 'Invalid supplier TRN',
  BUS_004: 'Invalid buyer TRN',
  BUS_005: 'VAT registration required',
} as const;

/**
 * FTA Rate Limiting
 */
export const FTA_RATE_LIMITS = {
  REQUESTS_PER_MINUTE: 100,
  REQUESTS_PER_HOUR: 5000,
  REQUESTS_PER_DAY: 50000,
  CONCURRENT_REQUESTS: 10,
} as const;

/**
 * TRN (Tax Registration Number) Format
 * Format: 100-XXXX-XXXX-XXX-XXX (15 digits total)
 */
export const TRN_REGEX = /^100\d{12}$/;
export const TRN_FORMATTED_REGEX = /^100-\d{4}-\d{4}-\d{3}-\d{3}$/;

/**
 * Emirates ID Format
 * Format: XXX-XXXX-XXXXXXX-X (15 digits)
 */
export const EMIRATES_ID_REGEX = /^\d{3}-\d{4}-\d{7}-\d{1}$/;

/**
 * UAE Fiscal Year
 */
export const UAE_FISCAL_YEAR = {
  START_MONTH: 1, // January
  END_MONTH: 12, // December
} as const;

/**
 * VAT Return Filing Periods
 */
export enum VATFilingPeriod {
  MONTHLY = 'MONTHLY', // For businesses with taxable supplies/expenses > AED 150M
  QUARTERLY = 'QUARTERLY', // Standard filing period
}

/**
 * VAT Return Due Date Offset (in days)
 */
export const VAT_RETURN_DUE_DATE_OFFSET = 28; // 28 days after period end

/**
 * Invoice Retention Period (years)
 */
export const INVOICE_RETENTION_PERIOD = 5;

/**
 * Zero-rated Supply Categories
 */
export const ZERO_RATED_CATEGORIES = [
  'EXPORT_GOODS', // Exports of goods outside GCC
  'EXPORT_SERVICES', // Exports of services
  'INTERNATIONAL_TRANSPORT', // International transportation
  'INTERNATIONAL_TRANSPORT_SERVICES', // Services related to international transport
  'PRECIOUS_METALS_INVESTMENT', // Investment-grade precious metals
  'FIRST_RESIDENTIAL_SUPPLY', // First supply of residential property within 3 years
  'EDUCATION_SERVICES', // Education services (specific conditions)
  'HEALTHCARE_SERVICES', // Preventive and basic healthcare
] as const;

/**
 * Exempt Supply Categories
 */
export const EXEMPT_CATEGORIES = [
  'FINANCIAL_SERVICES', // Specific financial services
  'RESIDENTIAL_PROPERTY', // Supply of residential property (except first supply)
  'BARE_LAND', // Supply of bare land
  'LOCAL_TRANSPORT', // Local passenger transport
] as const;

/**
 * Reverse Charge Mechanism
 * Applies when non-resident supplier provides services to UAE recipient
 */
export const REVERSE_CHARGE_SCENARIOS = [
  'IMPORTED_SERVICES', // Services from outside UAE
  'DIGITAL_SERVICES', // Digital services from non-resident
  'GCC_SERVICES', // Services from GCC suppliers
] as const;

/**
 * Tourist VAT Refund
 */
export const TOURIST_VAT_REFUND = {
  MIN_PURCHASE_AMOUNT: 250, // AED per retailer
  MAX_REFUND_DAYS: 90, // Days from purchase
  REFUND_PROCESSING_FEE_RATE: 0.044, // 4.4% processing fee
  ADMIN_FEE: 4.8, // AED admin fee per refund
} as const;

/**
 * UBL 2.1 Namespaces for XML generation
 */
export const UBL_NAMESPACES = {
  invoice: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
  creditNote: 'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2',
  debitNote: 'urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2',
  cac: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
  cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
  ext: 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
} as const;

/**
 * Retry Configuration
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 30000, // 30 seconds
  BACKOFF_MULTIPLIER: 2,
} as const;

/**
 * Timeout Configuration (milliseconds)
 */
export const TIMEOUT_CONFIG = {
  AUTH: 10000, // 10 seconds
  SUBMIT: 30000, // 30 seconds
  VALIDATE: 15000, // 15 seconds
  STATUS: 10000, // 10 seconds
} as const;
