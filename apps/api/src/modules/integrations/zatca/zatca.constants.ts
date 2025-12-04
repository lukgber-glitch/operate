/**
 * ZATCA FATOORAH Constants
 * Saudi Arabian E-Invoicing System Constants
 *
 * Reference: ZATCA E-Invoicing SDK v3.3.5
 * https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/Pages/default.aspx
 */

/**
 * ZATCA API Endpoints
 */
export const ZATCA_ENDPOINTS = {
  SANDBOX: {
    COMPLIANCE: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance',
    PRODUCTION_CSID: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/production/csids',
    CLEARANCE: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/invoices/clearance/single',
    REPORTING: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/invoices/reporting/single',
  },
  PRODUCTION: {
    COMPLIANCE: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/compliance',
    PRODUCTION_CSID: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/production/csids',
    CLEARANCE: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/invoices/clearance/single',
    REPORTING: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/invoices/reporting/single',
  },
} as const;

/**
 * ZATCA Invoice Types
 * Aligned with UBL 2.1 Invoice Type Codes
 */
export const ZATCA_INVOICE_TYPES = {
  STANDARD_INVOICE: '388', // Standard Tax Invoice (B2B)
  STANDARD_DEBIT_NOTE: '383', // Standard Debit Note
  STANDARD_CREDIT_NOTE: '381', // Standard Credit Note
  SIMPLIFIED_INVOICE: '388', // Simplified Tax Invoice (B2C)
  SIMPLIFIED_DEBIT_NOTE: '383', // Simplified Debit Note
  SIMPLIFIED_CREDIT_NOTE: '381', // Simplified Credit Note
} as const;

/**
 * Invoice Transaction Type Codes
 * Determines clearance vs reporting flow
 */
export const INVOICE_TRANSACTION_TYPES = {
  STANDARD_INVOICE: '0100', // Standard Invoice - Requires clearance if > 1000 SAR
  SIMPLIFIED_INVOICE: '0200', // Simplified Invoice - Reporting only
  STANDARD_DEBIT_NOTE: '0100',
  STANDARD_CREDIT_NOTE: '0100',
  SIMPLIFIED_DEBIT_NOTE: '0200',
  SIMPLIFIED_CREDIT_NOTE: '0200',
} as const;

/**
 * Saudi Arabia VAT Rates (as of 2020)
 */
export const SAUDI_VAT_RATES = {
  STANDARD: 0.15, // 15% standard rate
  ZERO_RATED: 0.0, // 0% for exports, international transport
  EXEMPT: null, // Exempt supplies (financial services, real estate)
} as const;

/**
 * VAT Category Codes (UN/ECE 5305)
 */
export const VAT_CATEGORY_CODES = {
  STANDARD_RATE: 'S', // Standard rate 15%
  ZERO_RATED: 'Z', // Zero rated goods
  EXEMPT: 'E', // Exempt from tax
  OUTSIDE_SCOPE: 'O', // Not subject to VAT
} as const;

/**
 * VAT Exemption Reason Codes
 */
export const VAT_EXEMPTION_REASONS = {
  FINANCIAL_SERVICES: 'VATEX-SA-29', // Financial services
  LIFE_INSURANCE: 'VATEX-SA-29-1', // Life insurance services
  REAL_ESTATE_RESIDENTIAL: 'VATEX-SA-30', // Residential real estate
  EXPORT: 'VATEX-SA-32', // Export of goods
  INTERNATIONAL_TRANSPORT: 'VATEX-SA-33', // International transport
  GOODS_IN_TRANSIT: 'VATEX-SA-34-1', // Goods in transit
  MEDICINES: 'VATEX-SA-34-2', // Medicines and medical equipment
  GOLD_INVESTMENT: 'VATEX-SA-34-3', // Gold (investment grade)
  PRIVATE_EDUCATION: 'VATEX-SA-34-4', // Private education
  PRIVATE_HEALTH: 'VATEX-SA-34-5', // Private healthcare
} as const;

/**
 * TLV (Tag-Length-Value) Tags for QR Code
 * As per ZATCA specifications
 */
export const QR_TLV_TAGS = {
  SELLER_NAME: 1, // Tag 1: Seller name
  VAT_REGISTRATION_NUMBER: 2, // Tag 2: VAT registration number (TRN)
  TIMESTAMP: 3, // Tag 3: Invoice timestamp (ISO 8601)
  INVOICE_TOTAL: 4, // Tag 4: Invoice total (with VAT)
  VAT_TOTAL: 5, // Tag 5: VAT total amount
  INVOICE_HASH: 6, // Tag 6: Invoice hash (SHA-256)
  SIGNATURE: 7, // Tag 7: Cryptographic stamp (ECDSA signature)
  PUBLIC_KEY: 8, // Tag 8: Public key
  SIGNATURE_ALGORITHM: 9, // Tag 9: Signature algorithm
} as const;

/**
 * Payment Methods (UN/ECE 4461)
 */
export const PAYMENT_METHODS = {
  CASH: '10', // Cash
  CREDIT_CARD: '48', // Bank card (credit/debit)
  BANK_TRANSFER: '42', // Bank transfer
  CHEQUE: '20', // Cheque
  DEBIT_CARD: '48', // Debit card
  ONLINE_PAYMENT: '48', // Online payment gateway
  CREDIT: '1', // Credit (payment terms)
} as const;

/**
 * Currency Codes (ISO 4217)
 */
export const CURRENCIES = {
  SAR: 'SAR', // Saudi Riyal (primary)
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  AED: 'AED',
} as const;

/**
 * ZATCA Error Codes
 */
export const ZATCA_ERROR_CODES = {
  // Authentication Errors
  INVALID_CSID: 'AUTH001',
  EXPIRED_CSID: 'AUTH002',
  MISSING_AUTHORIZATION: 'AUTH003',

  // Validation Errors
  INVALID_XML_STRUCTURE: 'VAL001',
  INVALID_UBL_SCHEMA: 'VAL002',
  INVALID_INVOICE_HASH: 'VAL003',
  INVALID_SIGNATURE: 'VAL004',
  INVALID_QR_CODE: 'VAL005',
  INVALID_VAT_NUMBER: 'VAL006',
  DUPLICATE_INVOICE_NUMBER: 'VAL007',

  // Business Rule Violations
  CLEARANCE_REQUIRED: 'BUS001', // Invoice > 1000 SAR requires clearance
  INVALID_INVOICE_TYPE: 'BUS002',
  INVALID_VAT_CALCULATION: 'BUS003',
  MISSING_REQUIRED_FIELD: 'BUS004',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE001', // Max 1000 requests/hour

  // System Errors
  ZATCA_SERVICE_UNAVAILABLE: 'SYS001',
  NETWORK_TIMEOUT: 'SYS002',
  INTERNAL_SERVER_ERROR: 'SYS003',
} as const;

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMITS = {
  MAX_REQUESTS_PER_HOUR: 1000,
  RETRY_AFTER_SECONDS: 60,
  MAX_RETRY_ATTEMPTS: 3,
  BACKOFF_MULTIPLIER: 2, // Exponential backoff: 1s, 2s, 4s
  INITIAL_RETRY_DELAY_MS: 1000,
} as const;

/**
 * Invoice Hash Algorithm
 */
export const HASH_ALGORITHM = 'SHA-256' as const;

/**
 * Digital Signature Algorithm
 */
export const SIGNATURE_ALGORITHM = 'ECDSA' as const;

/**
 * Supported Elliptic Curves for ECDSA
 */
export const ELLIPTIC_CURVES = {
  SECP256R1: 'secp256r1', // P-256 (NIST curve)
} as const;

/**
 * UBL Version
 */
export const UBL_VERSION = '2.1' as const;

/**
 * PIH (Previous Invoice Hash) Algorithm
 */
export const PIH_ALGORITHM = 'SHA-256' as const;

/**
 * Default Values
 */
export const DEFAULTS = {
  COUNTRY_CODE: 'SA', // Saudi Arabia
  CURRENCY: 'SAR',
  LANGUAGE: 'ar', // Arabic (primary)
  SECONDARY_LANGUAGE: 'en', // English
  VAT_RATE: 0.15, // 15%
  TIMEZONE: 'Asia/Riyadh',
} as const;

/**
 * TRN (Tax Registration Number) Format
 * Must be 15 digits starting with '3'
 */
export const TRN_REGEX = /^3\d{14}$/;

/**
 * National ID Format (Iqama/National ID)
 * 10 digits
 */
export const NATIONAL_ID_REGEX = /^\d{10}$/;

/**
 * Commercial Registration Number Format
 * 10 digits
 */
export const CR_NUMBER_REGEX = /^\d{10}$/;

/**
 * Invoice Number Format
 * Alphanumeric, max 127 characters
 */
export const INVOICE_NUMBER_REGEX = /^[A-Za-z0-9\-_\/]{1,127}$/;

/**
 * HTTP Headers for ZATCA API
 */
export const ZATCA_HTTP_HEADERS = {
  ACCEPT_VERSION: 'V2', // API version
  ACCEPT_LANGUAGE: 'ar', // Arabic (can be 'en' for English)
  CONTENT_TYPE: 'application/json',
  ACCEPT: 'application/json',
} as const;

/**
 * CSID (Cryptographic Stamp Identifier) Types
 */
export const CSID_TYPES = {
  COMPLIANCE: 'compliance', // For testing/onboarding
  PRODUCTION: 'production', // For live invoicing
} as const;

/**
 * Certificate Algorithm
 */
export const CERTIFICATE_ALGORITHM = 'RSA-2048' as const;

/**
 * Timeout Configuration (milliseconds)
 */
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  CLEARANCE_REQUEST: 45000, // 45 seconds
  CONNECTION: 10000, // 10 seconds
} as const;

/**
 * Clearance Threshold
 * Invoices above this amount require real-time clearance
 */
export const CLEARANCE_THRESHOLD_SAR = 1000;

/**
 * Document Reference Types
 */
export const DOCUMENT_REFERENCE_TYPES = {
  ORIGINAL_INVOICE: '388', // Reference to original invoice (for credit notes)
  CONTRACT: '1', // Contract reference
  PURCHASE_ORDER: '50', // Purchase order
  DELIVERY_NOTE: '270', // Delivery note
} as const;
