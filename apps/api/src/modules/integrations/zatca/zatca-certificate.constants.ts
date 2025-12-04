/**
 * ZATCA Certificate Constants
 *
 * Constants for Saudi Arabia ZATCA (Zakat, Tax and Customs Authority) e-invoicing
 * Based on ZATCA SDK requirements and technical specifications
 */

export const ZATCA_CONSTANTS = {
  // API Endpoints
  ENDPOINTS: {
    SANDBOX: {
      BASE_URL: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal',
      COMPLIANCE_CSID: '/compliance',
      PRODUCTION_CSID: '/production/csids',
      COMPLIANCE_CHECK: '/compliance/invoices',
      REPORTING: '/invoices/reporting/single',
      CLEARANCE: '/invoices/clearance/single',
    },
    PRODUCTION: {
      BASE_URL: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core',
      COMPLIANCE_CSID: '/compliance',
      PRODUCTION_CSID: '/production/csids',
      COMPLIANCE_CHECK: '/compliance/invoices',
      REPORTING: '/invoices/reporting/single',
      CLEARANCE: '/invoices/clearance/single',
    },
  },

  // Cryptographic Settings
  CRYPTO: {
    // ECDSA Curve (ZATCA requirement)
    CURVE: 'secp256k1',
    KEY_SIZE: 256,

    // Signature Algorithm
    SIGNATURE_ALGORITHM: 'ECDSA-SHA256',
    HASH_ALGORITHM: 'SHA256',

    // Encryption for private key storage
    ENCRYPTION: {
      ALGORITHM: 'aes-256-gcm',
      KEY_LENGTH: 32, // 256 bits
      IV_LENGTH: 16,  // 128 bits
      AUTH_TAG_LENGTH: 16, // 128 bits
    },
  },

  // Certificate Settings
  CERTIFICATE: {
    VERSION: 3, // X.509 v3
    VALIDITY_DAYS: {
      COMPLIANCE: 365, // 1 year for testing
      PRODUCTION: 365, // 1 year for production
    },

    // Certificate Extensions (OIDs)
    EXTENSIONS: {
      KEY_USAGE: '2.5.29.15', // digitalSignature
      EXTENDED_KEY_USAGE: '2.5.29.37',
      SUBJECT_ALT_NAME: '2.5.29.17',
      AUTHORITY_KEY_ID: '2.5.29.35',
      SUBJECT_KEY_ID: '2.5.29.14',
    },

    // Subject Distinguished Name (DN) fields
    DN_FIELDS: {
      C: 'SA', // Country (always Saudi Arabia)
      O: 'organizationName', // Organization Name
      OU: 'organizationUnit', // Tax Registration Number (TRN)
      CN: 'commonName', // Common Name
    },

    // Subject Attributes (ZATCA specific)
    SUBJECT_ATTRIBUTES: {
      SERIAL_NUMBER: '2.5.4.5', // Certificate serial number
      UID: '0.9.2342.19200300.100.1.1', // Solution Name/ID
      TITLE: '2.5.4.12', // Invoice Type (0100 or 0200)
      REGISTERED_ADDRESS: '2.5.4.26', // Registered Address
      BUSINESS_CATEGORY: '2.5.4.15', // Business Category
    },
  },

  // Invoice Types
  INVOICE_TYPE: {
    TAX_INVOICE: '0100', // Standard tax invoice (B2B)
    SIMPLIFIED_INVOICE: '0200', // Simplified invoice (B2C)
    TAX_DEBIT_NOTE: '0110',
    TAX_CREDIT_NOTE: '0120',
    SIMPLIFIED_DEBIT_NOTE: '0210',
    SIMPLIFIED_CREDIT_NOTE: '0220',
  },

  // Certificate Renewal
  RENEWAL: {
    WARNING_DAYS: 30, // Alert 30 days before expiry
    GRACE_PERIOD_DAYS: 7, // Grace period after new cert activation
  },

  // Validation Rules
  VALIDATION: {
    TRN_PATTERN: /^[0-9]{15}$/, // 15 digits
    COMMON_NAME_MAX_LENGTH: 64,
    OU_MAX_LENGTH: 64,
    ORGANIZATION_MAX_LENGTH: 64,
    SOLUTION_NAME_MAX_LENGTH: 64,
  },

  // CSID Request Types
  CSID_TYPE: {
    COMPLIANCE: 'compliance',
    PRODUCTION: 'production',
  },

  // Error Codes
  ERROR_CODES: {
    INVALID_CSR: 'ZATCA_INVALID_CSR',
    INVALID_SIGNATURE: 'ZATCA_INVALID_SIGNATURE',
    CSID_REQUEST_FAILED: 'ZATCA_CSID_REQUEST_FAILED',
    CERTIFICATE_EXPIRED: 'ZATCA_CERTIFICATE_EXPIRED',
    CERTIFICATE_REVOKED: 'ZATCA_CERTIFICATE_REVOKED',
    INVALID_OTP: 'ZATCA_INVALID_OTP',
    ENCRYPTION_FAILED: 'ZATCA_ENCRYPTION_FAILED',
    DECRYPTION_FAILED: 'ZATCA_DECRYPTION_FAILED',
    KEY_GENERATION_FAILED: 'ZATCA_KEY_GENERATION_FAILED',
    CERTIFICATE_NOT_FOUND: 'ZATCA_CERTIFICATE_NOT_FOUND',
    KMS_ERROR: 'ZATCA_KMS_ERROR',
  },

  // HTTP Headers
  HEADERS: {
    ACCEPT_VERSION: 'V2',
    CONTENT_TYPE: 'application/json',
    ACCEPT_LANGUAGE: 'en',
  },

  // Retry Configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_MS: 1000,
    MAX_BACKOFF_MS: 10000,
  },

  // Audit Actions
  AUDIT_ACTIONS: {
    KEY_PAIR_GENERATED: 'key_pair_generated',
    CSR_CREATED: 'csr_created',
    CSID_REQUESTED: 'csid_requested',
    CSID_APPROVED: 'csid_approved',
    CSID_REJECTED: 'csid_rejected',
    CERTIFICATE_ACTIVATED: 'certificate_activated',
    CERTIFICATE_DEACTIVATED: 'certificate_deactivated',
    CERTIFICATE_REVOKED: 'certificate_revoked',
    CERTIFICATE_RENEWED: 'certificate_renewed',
    INVOICE_SIGNED: 'invoice_signed',
    PRIVATE_KEY_ACCESSED: 'private_key_accessed',
    CERTIFICATE_EXPORTED: 'certificate_exported',
    ROTATION_STARTED: 'rotation_started',
    ROTATION_COMPLETED: 'rotation_completed',
    ROTATION_FAILED: 'rotation_failed',
  },
} as const;

// Type exports for TypeScript
export type ZatcaEnvironment = 'sandbox' | 'production';
export type ZatcaCertificateType = 'COMPLIANCE' | 'PRODUCTION';
export type ZatcaCsidStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'RENEWAL_PENDING' | 'FAILED';
export type ZatcaInvoiceType = 'TAX_INVOICE' | 'SIMPLIFIED_INVOICE';

/**
 * ZATCA API Response Types
 */
export interface ZatcaApiResponse<T = any> {
  requestID?: string;
  dispositionMessage?: string;
  binarySecurityToken?: string;
  secret?: string;
  errors?: Array<{
    type: string;
    code: string;
    category: string;
    message: string;
    status: string;
  }>;
  warnings?: Array<{
    type: string;
    code: string;
    category: string;
    message: string;
    status: string;
  }>;
  reportingStatus?: string;
  clearanceStatus?: string;
  clearedInvoice?: string;
  validationResults?: {
    status: string;
    infoMessages?: string[];
    warningMessages?: string[];
    errorMessages?: string[];
  };
}

/**
 * CSR Subject Attributes
 */
export interface CsrSubjectAttributes {
  C: string; // Country (SA)
  O: string; // Organization Name
  OU: string; // Tax Registration Number (TRN)
  CN: string; // Common Name
  serialNumber?: string; // Invoice Type
  UID?: string; // Solution Name
  title?: string; // Additional identifier
  registeredAddress?: string;
  businessCategory?: string;
}

/**
 * Certificate Signing Request (CSR) Configuration
 */
export interface CsrConfig {
  commonName: string;
  organizationName: string;
  organizationUnit: string; // TRN
  country: string;
  invoiceType: string; // 0100 or 0200
  solutionName?: string;
  registeredAddress?: string;
  businessCategory?: string;
}

/**
 * CSID Request Configuration
 */
export interface CsidRequestConfig {
  csr: string; // Base64 encoded CSR
  otp?: string; // For production CSID
  complianceCsid?: string; // For production CSID request
}
