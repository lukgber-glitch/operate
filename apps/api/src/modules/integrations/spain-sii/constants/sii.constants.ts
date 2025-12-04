/**
 * Spain SII (Suministro Inmediato de Información) Constants
 * Real-time VAT reporting system for Spanish Tax Agency (AEAT)
 */

/**
 * SII Environments
 */
export enum SiiEnvironment {
  PRODUCTION = 'production',
  TEST = 'test',
}

/**
 * SII API Endpoints
 */
export const SII_ENDPOINTS = {
  production: {
    baseUrl: 'https://www1.agenciatributaria.gob.es/wlpl/SSII-FACT/ws/fe',
    issuedInvoices: '/SiiFactFEV1SOAP',
    receivedInvoices: '/SiiFactFEV1SOAP',
    payment: '/SiiFactCobrosV1SOAP',
    collections: '/SiiFactCobrosV1SOAP',
  },
  test: {
    baseUrl: 'https://www7.aeat.es/wlpl/SSII-FACT/ws/fe',
    issuedInvoices: '/SiiFactFEV1SOAP',
    receivedInvoices: '/SiiFactFEV1SOAP',
    payment: '/SiiFactCobrosV1SOAP',
    collections: '/SiiFactCobrosV1SOAP',
  },
};

/**
 * SII Book Types
 * A = Issued invoices
 * B = Received invoices
 */
export enum SiiBookType {
  // Issued invoices (Facturas Emitidas)
  A1_ISSUED = 'A1', // Standard issued invoices
  A2_RECTIFICATIONS = 'A2', // Rectifications of issued invoices
  A3_ASSETS = 'A3', // Assets register (Bienes de Inversión)

  // Received invoices (Facturas Recibidas)
  B1_RECEIVED = 'B1', // Standard received invoices
  B2_CORRECTIONS = 'B2', // Corrections of received invoices
  B3_INTRACOMMUNITY = 'B3', // Intracommunity acquisitions
  B4_IMPORT_VAT = 'B4', // Import VAT
}

/**
 * SII Invoice Types
 */
export enum SiiInvoiceType {
  F1_STANDARD = 'F1', // Standard invoice
  F2_SIMPLIFIED = 'F2', // Simplified invoice (ticket)
  F3_SUBSTITUTE_SIMPLIFIED = 'F3', // Invoice substituting simplified invoices
  F4_SUMMARY = 'F4', // Summary invoice
  F5_IMPORTS = 'F5', // Imports (DUA)
  F6_ACCOUNTING_SUPPORT = 'F6', // Other accounting support documents

  // Rectifications
  R1_RECTIFICATION_ERROR = 'R1', // Rectification: Error founded in basis
  R2_RECTIFICATION_BASE_TAXABLE = 'R2', // Rectification: Art 80.1, 80.2 and 80.6 LIVA
  R3_RECTIFICATION_BAD_DEBT = 'R3', // Rectification: Bad debts
  R4_RECTIFICATION_OTHER = 'R4', // Rectification: Other
  R5_RECTIFICATION_BANKRUPTCY = 'R5', // Rectification in bankruptcy proceedings
}

/**
 * SII VAT Key Codes
 */
export enum SiiVatKey {
  GENERAL = '01', // General regime
  EXPORT = '02', // Export
  TRANSACTIONS_OSS = '03', // Transactions for which recipient is liable for VAT
  EXEMPT_ART20 = '04', // Exempt pursuant to Art. 20
  EXEMPT_ART21 = '05', // Exempt pursuant to Art. 21
  EXEMPT_OTHER = '06', // Exempt: other
  SIMPLE = '07', // Simplified regime
  SIMPLE_INVOICE = '08', // Simplified regime invoices
  AGRICULTURE = '09', // Agriculture, livestock and fishing regime
  TRAVEL_AGENCIES = '10', // Special regime for travel agencies
  SECOND_HAND = '11', // Special regime for second-hand goods
  GOLD_INVESTMENT = '12', // Special regime for gold investment
  CASH_BASIS = '13', // Special regime for cash-basis VAT
  INTRACOMMUNITY = '14', // Intracommunity acquisitions
  IMPORT_VAT = '15', // Import VAT
  REVERSE_CHARGE = '16', // Reverse charge
  SERVICES_RECEIVED = '17', // Services received
  IMPORT_DUA = '18', // Import with DUA
  IMPORT_NO_DUA = '19', // Import without DUA
}

/**
 * SII VAT Rates (Spain 2024)
 */
export const SII_VAT_RATES = {
  GENERAL: 21.0, // Type General (21%)
  REDUCED: 10.0, // Type Reducido (10%)
  SUPER_REDUCED: 4.0, // Type Superreducido (4%)
  ZERO: 0.0, // Type Cero (0%)
  EXEMPT: 0.0, // Exento
};

/**
 * SII Operation Types
 */
export enum SiiOperationType {
  A0 = 'A0', // Registration of invoice/operation
  A1 = 'A1', // Modification of invoice/operation (errors in registration)
  A4 = 'A4', // Correction invoice
  A5 = 'A5', // Cancellation of invoice
}

/**
 * SII Error Codes
 */
export enum SiiErrorCode {
  // Authentication errors
  INVALID_CERTIFICATE = '1001',
  CERTIFICATE_EXPIRED = '1002',
  CERTIFICATE_REVOKED = '1003',
  UNAUTHORIZED = '1004',

  // Validation errors
  INVALID_NIF = '2001',
  INVALID_INVOICE_NUMBER = '2002',
  INVALID_DATE = '2003',
  INVALID_AMOUNT = '2004',
  DUPLICATE_INVOICE = '2005',
  INVOICE_NOT_FOUND = '2006',
  INVALID_VAT_KEY = '2007',
  INVALID_OPERATION_TYPE = '2008',

  // Business logic errors
  OUTSIDE_SUBMISSION_WINDOW = '3001', // Invoice must be submitted within 4 days
  PERIOD_CLOSED = '3002',
  RECTIFICATION_WITHOUT_ORIGINAL = '3003',
  INCONSISTENT_DATA = '3004',

  // System errors
  SERVICE_UNAVAILABLE = '5001',
  TIMEOUT = '5002',
  INTERNAL_ERROR = '5003',
  RATE_LIMIT_EXCEEDED = '5004',
}

/**
 * SII XML Namespaces
 */
export const SII_NAMESPACES = {
  sii: 'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroInformacion.xsd',
  siiLR: 'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroLR.xsd',
  soap: 'http://schemas.xmlsoap.org/soap/envelope/',
};

/**
 * SII Submission Window
 * Invoices must be submitted within 4 days (or 8 days for large companies)
 */
export const SII_SUBMISSION_WINDOW = {
  STANDARD: 4, // days
  LARGE_COMPANY: 8, // days
};

/**
 * SII Retry Configuration
 */
export const SII_RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 30000, // 30 seconds
  BACKOFF_MULTIPLIER: 2,
};

/**
 * SII Cache TTL
 */
export const SII_CACHE_TTL = {
  SUBMISSION_STATUS: 3600, // 1 hour
  INVOICE_QUERY: 1800, // 30 minutes
  ERROR_STATE: 300, // 5 minutes
};

/**
 * SII Certificate Requirements
 */
export const SII_CERTIFICATE_REQUIREMENTS = {
  MIN_KEY_LENGTH: 2048,
  SUPPORTED_ALGORITHMS: ['RSA', 'ECDSA'],
  TLS_VERSION: 'TLSv1.3',
};

/**
 * SII Communication Period
 */
export enum SiiPeriod {
  MONTHLY = '01',
  QUARTERLY_Q1 = '1T',
  QUARTERLY_Q2 = '2T',
  QUARTERLY_Q3 = '3T',
  QUARTERLY_Q4 = '4T',
  ANNUAL = '0A',
}

/**
 * SII Special Circumstances
 */
export enum SiiSpecialCircumstance {
  NONE = '00',
  SIMPLIFIED_REGIME_ARTICLE_122_123 = '01',
  TRAVEL_AGENCIES = '02',
  SECOND_HAND_ART_ANTIQUES = '03',
  GOLD_INVESTMENT = '04',
  CASH_BASIS = '05',
  AGRICULTURE_LIVESTOCK_FISHING = '06',
  SIMPLIFIED_INVOICE = '07',
  REVERSE_CHARGE = '08',
  INTRACOMMUNITY_ACQUISITION = '09',
  IMPORT_SUBJECT_TO_VAT = '10',
}

/**
 * NIF Validation Patterns
 */
export const SII_NIF_PATTERNS = {
  DNI: /^[0-9]{8}[A-Z]$/, // Spanish DNI
  NIE: /^[XYZ][0-9]{7}[A-Z]$/, // NIE for foreigners
  CIF: /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/, // Company tax ID
};
