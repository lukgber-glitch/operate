/**
 * InvoiceNow Constants
 * Singapore-specific Peppol network constants and codes
 */

/**
 * Singapore Peppol Participant ID Scheme
 */
export const SINGAPORE_PEPPOL_SCHEME = '0195' as const;

/**
 * Singapore Country Code (ISO 3166-1 alpha-2)
 */
export const SINGAPORE_COUNTRY_CODE = 'SG' as const;

/**
 * Default Currency for Singapore
 */
export const SINGAPORE_CURRENCY = 'SGD' as const;

/**
 * PINT-SG (Peppol International Model - Singapore)
 * Customization and Profile IDs
 */
export const PINT_SG = {
  CUSTOMIZATION_ID:
    'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0#conformant#urn:fdc:peppol.sg:spec:1.0',
  PROFILE_ID: 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
  DOCUMENT_TYPE_INVOICE:
    'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0#conformant#urn:fdc:peppol.sg:spec:1.0::2.1',
  DOCUMENT_TYPE_CREDIT_NOTE:
    'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2::CreditNote##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0#conformant#urn:fdc:peppol.sg:spec:1.0::2.1',
} as const;

/**
 * Singapore GST Rates (as of 2024)
 * Updated from 7% to 8% effective 1 January 2024
 */
export const SINGAPORE_GST_RATES = {
  STANDARD: 8.0,
  ZERO: 0.0,
  EXEMPT: 0.0,
} as const;

/**
 * Singapore GST Tax Categories (UBL)
 */
export const SINGAPORE_GST_CATEGORIES = {
  STANDARD_RATED: 'SR', // 8% standard rate
  ZERO_RATED: 'ZR', // 0% for exports, international services
  EXEMPT: 'E', // Exempt supplies (financial services, residential property)
  OUT_OF_SCOPE: 'OS', // Out of scope (non-business transactions)
  DEEMED: 'DS', // Deemed supplies
} as const;

/**
 * UBL Tax Category IDs (mapped to Singapore GST categories)
 */
export const UBL_TAX_CATEGORY_IDS = {
  STANDARD_RATED: 'S', // Standard rate
  ZERO_RATED: 'Z', // Zero rated
  EXEMPT: 'E', // Exempt
  OUT_OF_SCOPE: 'O', // Not subject to tax
} as const;

/**
 * Payment Means Codes (UN/CEFACT 4461)
 */
export const PAYMENT_MEANS_CODES = {
  CREDIT_TRANSFER: '30', // Credit transfer (bank transfer)
  DEBIT_TRANSFER: '31', // Debit transfer
  PAYNOW: '42', // PayNow (Singapore's instant payment system)
  CREDIT_CARD: '48', // Bank card
  DIRECT_DEBIT: '49', // Direct debit
  CASH: '10', // Cash
  CHEQUE: '20', // Cheque
} as const;

/**
 * Invoice Type Codes (UBL)
 */
export const INVOICE_TYPE_CODES = {
  COMMERCIAL_INVOICE: '380',
  CREDIT_NOTE: '381',
  DEBIT_NOTE: '383',
  SELF_BILLED_INVOICE: '389',
} as const;

/**
 * Unit Codes (UN/ECE Recommendation 20)
 * Common units used in Singapore invoices
 */
export const UNIT_CODES = {
  PIECE: 'EA', // Each
  HOUR: 'HUR', // Hour
  DAY: 'DAY', // Day
  MONTH: 'MON', // Month
  KILOGRAM: 'KGM', // Kilogram
  METER: 'MTR', // Meter
  LITER: 'LTR', // Liter
  SET: 'SET', // Set
  BOX: 'BX', // Box
  PACKAGE: 'PK', // Package
} as const;

/**
 * Singapore UEN Validation Patterns
 */
export const UEN_PATTERNS = {
  // Business (ROB) - 9 digits + 1 letter (e.g., 53012345D)
  BUSINESS: /^[0-9]{8}[A-Z]$/,
  // Local Company (ROC) - 8 digits + 1 letter (e.g., 201234567A)
  LOCAL_COMPANY: /^[0-9]{9}[A-Z]$/,
  // Foreign Company (RFC) - Starts with T/S/R + 2 digits + 2 letters + 4 digits + 1 letter
  FOREIGN_COMPANY: /^[TSR][0-9]{2}[A-Z]{2}[0-9]{4}[A-Z]$/,
  // Other entities - Starts with T/S/R + 2 digits + 2 letters + 4 digits + 1 letter
  OTHER: /^[TSR][0-9]{2}[A-Z]{2}[0-9]{4}[A-Z]$/,
} as const;

/**
 * Singapore GST Registration Number Pattern
 * Format: M + 8 digits + 1 check letter (e.g., M12345678X)
 * Or: Standard UEN for GST registered entities
 */
export const GST_NUMBER_PATTERN = /^(M[0-9]{8}[A-Z]|[0-9]{8,10}[A-Z])$/;

/**
 * IMDA InvoiceNow Network Identifiers
 */
export const INVOICENOW_NETWORK = {
  SML_DOMAIN_PRODUCTION: 'sml.peppol.sg',
  SML_DOMAIN_TEST: 'test-sml.peppol.sg',
  NETWORK_NAME: 'InvoiceNow',
  AUTHORITY: 'IMDA', // Info-communications Media Development Authority
} as const;

/**
 * Peppol AS4 Transport Profile
 */
export const PEPPOL_TRANSPORT_PROFILE = 'peppol-transport-as4-v2_0' as const;

/**
 * Peppol Document ID Scheme
 */
export const PEPPOL_DOCUMENT_ID_SCHEME = 'busdox-docid-qns' as const;

/**
 * Peppol Process ID Scheme
 */
export const PEPPOL_PROCESS_ID_SCHEME = 'cenbii-procid-ubl' as const;

/**
 * InvoiceNow Validation Rules (PINT-SG specific)
 */
export const VALIDATION_RULES = {
  // Invoice number must be unique and non-empty
  INVOICE_NUMBER_REQUIRED: 'PINT-SG-R001',
  // Issue date is mandatory
  ISSUE_DATE_REQUIRED: 'PINT-SG-R002',
  // Currency must be ISO 4217 (typically SGD)
  CURRENCY_REQUIRED: 'PINT-SG-R003',
  // Supplier UEN is required
  SUPPLIER_UEN_REQUIRED: 'PINT-SG-R004',
  // Customer UEN is required
  CUSTOMER_UEN_REQUIRED: 'PINT-SG-R005',
  // At least one invoice line is required
  INVOICE_LINE_REQUIRED: 'PINT-SG-R006',
  // GST calculation must be accurate
  GST_CALCULATION_ACCURATE: 'PINT-SG-R007',
  // Total amount must match sum of lines and tax
  TOTAL_AMOUNT_ACCURATE: 'PINT-SG-R008',
  // UEN format must be valid
  UEN_FORMAT_VALID: 'PINT-SG-R009',
  // GST number format must be valid
  GST_NUMBER_FORMAT_VALID: 'PINT-SG-R010',
  // Payment means must be valid for Singapore
  PAYMENT_MEANS_VALID: 'PINT-SG-R011',
  // Postal code must be 6 digits
  POSTAL_CODE_FORMAT: 'PINT-SG-R012',
} as const;

/**
 * Singapore Postal Code Pattern
 * Format: 6 digits (e.g., 018956)
 */
export const POSTAL_CODE_PATTERN = /^[0-9]{6}$/;

/**
 * Retry Configuration
 */
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  BACKOFF_MULTIPLIER: 2,
} as const;

/**
 * Timeout Configuration
 */
export const TIMEOUT_CONFIG = {
  SMP_LOOKUP: 30000, // 30 seconds
  MESSAGE_SEND: 60000, // 60 seconds
  RECEIPT_WAIT: 300000, // 5 minutes
} as const;

/**
 * InvoiceNow Error Messages
 */
export const ERROR_MESSAGES = {
  INVALID_UEN: 'Invalid Singapore UEN format',
  INVALID_GST_NUMBER: 'Invalid Singapore GST registration number',
  UEN_NOT_REGISTERED: 'UEN is not registered in the InvoiceNow network',
  DOCUMENT_VALIDATION_FAILED: 'Document validation failed against PINT-SG rules',
  GST_CALCULATION_ERROR: 'GST calculation does not match expected amount',
  PEPPOL_LOOKUP_FAILED: 'Failed to lookup participant in Peppol SMP',
  TRANSMISSION_FAILED: 'Failed to transmit invoice via Peppol network',
  RECEIPT_TIMEOUT: 'Timeout waiting for delivery receipt',
  UNSUPPORTED_CURRENCY: 'Currency is not supported for Singapore invoices',
  INVALID_PAYMENT_MEANS: 'Payment means is not valid for Singapore',
  INVALID_POSTAL_CODE: 'Postal code must be 6 digits',
} as const;

/**
 * Business Rules for Singapore Invoices
 */
export const BUSINESS_RULES = {
  // For domestic invoices, currency should be SGD
  DOMESTIC_CURRENCY: 'SGD',
  // GST is mandatory for taxable supplies above SGD 1 million annual turnover
  GST_REGISTRATION_THRESHOLD: 1000000,
  // Payment terms typically 30 days in Singapore
  DEFAULT_PAYMENT_TERMS: 'Net 30',
  // Maximum invoice amount (for validation purposes)
  MAX_INVOICE_AMOUNT: 999999999.99,
  // Minimum invoice amount
  MIN_INVOICE_AMOUNT: 0.01,
} as const;

/**
 * Supported Document Types in InvoiceNow
 */
export const SUPPORTED_DOCUMENT_TYPES = [
  'Invoice',
  'CreditNote',
  'DebitNote',
  'SelfBilledInvoice',
] as const;

/**
 * InvoiceNow API Endpoints (for mock/testing)
 */
export const API_ENDPOINTS = {
  VALIDATE_UEN: '/api/v1/validate/uen',
  VALIDATE_GST: '/api/v1/validate/gst',
  SEND_INVOICE: '/api/v1/invoice/send',
  RECEIVE_INVOICE: '/api/v1/invoice/receive',
  GET_STATUS: '/api/v1/invoice/status',
  WEBHOOK: '/api/v1/webhook/invoicenow',
} as const;
