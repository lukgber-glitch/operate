import { CraEndpoints } from './interfaces/cra.interface';

/**
 * CRA NetFile Constants and Configuration
 */

/**
 * Get CRA endpoints based on environment
 */
export function getCraEndpoints(environment: 'sandbox' | 'production'): CraEndpoints {
  if (environment === 'production') {
    return {
      netfileUrl: 'https://netfile.cra-arc.gc.ca/api/v1/submit',
      authUrl: 'https://netfile.cra-arc.gc.ca/api/v1/auth',
      statusUrl: 'https://netfile.cra-arc.gc.ca/api/v1/status',
      validationUrl: 'https://netfile.cra-arc.gc.ca/api/v1/validate',
    };
  } else {
    // Sandbox/Test environment
    return {
      netfileUrl: 'https://test-netfile.cra-arc.gc.ca/api/v1/submit',
      authUrl: 'https://test-netfile.cra-arc.gc.ca/api/v1/auth',
      statusUrl: 'https://test-netfile.cra-arc.gc.ca/api/v1/status',
      validationUrl: 'https://test-netfile.cra-arc.gc.ca/api/v1/validate',
    };
  }
}

/**
 * CRA Filing Types
 */
export const CRA_RETURN_TYPES = {
  GST34: 'GST34', // Regular GST/HST return
  GST62: 'GST62', // Non-resident registrant return
  GST106: 'GST106', // Selected listed financial institutions
} as const;

/**
 * CRA Business Number Format
 * Format: 9 digits + 2 letter program identifier + 4 digit reference
 * Example: 123456789RT0001
 */
export const CRA_BN_PATTERN = /^\d{9}[A-Z]{2}\d{4}$/;

/**
 * CRA Program Identifiers
 */
export const CRA_PROGRAM_IDENTIFIERS = {
  GST_HST: 'RT', // GST/HST account
  PAYROLL: 'RP', // Payroll deductions account
  IMPORT_EXPORT: 'RM', // Import-export account
  CORPORATION_TAX: 'RC', // Corporate income tax account
} as const;

/**
 * GST/HST Rates by Province (as of 2024)
 */
export const GST_HST_RATES = {
  // GST only (5%)
  AB: { gst: 5, pst: 0, hst: 0, total: 5 }, // Alberta
  BC: { gst: 5, pst: 7, hst: 0, total: 12 }, // British Columbia
  MB: { gst: 5, pst: 7, hst: 0, total: 12 }, // Manitoba
  SK: { gst: 5, pst: 6, hst: 0, total: 11 }, // Saskatchewan
  QC: { gst: 5, pst: 9.975, hst: 0, total: 14.975 }, // Quebec (QST)
  YT: { gst: 5, pst: 0, hst: 0, total: 5 }, // Yukon
  NT: { gst: 5, pst: 0, hst: 0, total: 5 }, // Northwest Territories
  NU: { gst: 5, pst: 0, hst: 0, total: 5 }, // Nunavut

  // HST provinces
  ON: { gst: 0, pst: 0, hst: 13, total: 13 }, // Ontario
  NB: { gst: 0, pst: 0, hst: 15, total: 15 }, // New Brunswick
  NL: { gst: 0, pst: 0, hst: 15, total: 15 }, // Newfoundland and Labrador
  NS: { gst: 0, pst: 0, hst: 15, total: 15 }, // Nova Scotia
  PE: { gst: 0, pst: 0, hst: 15, total: 15 }, // Prince Edward Island
} as const;

/**
 * GST/HST Filing Frequencies
 */
export const GST_FILING_FREQUENCIES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual',
} as const;

/**
 * GST/HST Filing Thresholds
 * Determines required filing frequency based on annual revenue
 */
export const GST_FILING_THRESHOLDS = {
  MONTHLY_THRESHOLD: 6000000, // $6M annual GST/HST
  QUARTERLY_THRESHOLD: 1500000, // $1.5M annual revenue
  // Below quarterly threshold = annual filing
} as const;

/**
 * CRA Error Messages
 */
export const CRA_ERROR_MESSAGES = {
  // Authentication
  'CRA-001': 'Invalid EFILE number',
  'CRA-002': 'Invalid Web Access Code',
  'CRA-003': 'Web Access Code has expired',
  'CRA-004': 'Authentication failed',

  // Validation
  'CRA-101': 'Invalid Business Number format',
  'CRA-102': 'Invalid reporting period',
  'CRA-103': 'Invalid return data',
  'CRA-104': 'Return validation failed',

  // Filing
  'CRA-201': 'Duplicate submission detected',
  'CRA-202': 'Filing period is not open',
  'CRA-203': 'Return already filed for this period',
  'CRA-204': 'Filing deadline has passed',

  // Network/System
  'CRA-301': 'Network error occurred',
  'CRA-302': 'CRA service temporarily unavailable',
  'CRA-303': 'Request timeout',
  'CRA-304': 'Internal server error',

  // Business
  'CRA-401': 'Business not registered for GST/HST',
  'CRA-402': 'GST/HST account is inactive',
  'CRA-403': 'Invalid GST registration number',
} as const;

/**
 * CRA Session Configuration
 */
export const CRA_SESSION_CONFIG = {
  // Session expires after 30 minutes of inactivity
  sessionTtl: 30 * 60,
  // Refresh session 5 minutes before expiry
  refreshBuffer: 5 * 60,
} as const;

/**
 * CRA TLS Configuration
 */
export const CRA_TLS_CONFIG = {
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',
  ciphers: [
    'TLS_AES_128_GCM_SHA256',
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
  ].join(':'),
} as const;

/**
 * CRA API Rate Limits
 */
export const CRA_RATE_LIMITS = {
  // Conservative rate limiting
  requestsPerSecond: 2,
  requestsPerMinute: 60,
  burstSize: 5,
} as const;

/**
 * CRA Validation Rules for GST/HST Return
 */
export const CRA_VALIDATION_RULES = {
  // Line 101: Sales and revenue must be >= 0
  MIN_SALES_REVENUE: 0,
  // Maximum reasonable value (10 billion)
  MAX_SALES_REVENUE: 10000000000,

  // Line 103: Tax collected must be >= 0
  MIN_TAX_COLLECTED: 0,
  MAX_TAX_COLLECTED: 10000000000,

  // Net tax range (can be negative for refunds)
  MIN_NET_TAX: -10000000000,
  MAX_NET_TAX: 10000000000,

  // Business number validation
  BN_LENGTH: 15, // 9 digits + 2 letters + 4 digits
} as const;

/**
 * CRA Line Number Descriptions
 */
export const CRA_LINE_DESCRIPTIONS = {
  101: 'Total sales and other revenue',
  103: 'GST/HST collected or collectible',
  104: 'Adjustments',
  105: 'Total GST/HST to remit (line 103 + line 104)',
  106: 'Input tax credits (ITCs) for current period',
  107: 'ITC adjustments',
  108: 'Total ITCs (line 106 + line 107)',
  109: 'Net tax (line 105 minus line 108)',
  110: 'Installment and refund claimed for this period',
  111: 'Other credits',
  112: 'Total credits (line 110 + line 111)',
  113: 'Amount owing or refund claimed',
  114: 'Provincial rebate claimed',
} as const;

/**
 * CRA HTTP Headers
 */
export const CRA_HEADERS = {
  CONTENT_TYPE: 'application/xml',
  ACCEPT: 'application/xml',
  USER_AGENT: 'Operate-CoachOS/1.0',
} as const;

/**
 * CRA Audit Actions
 */
export const CRA_AUDIT_ACTIONS = {
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',
  VALIDATE_RETURN: 'VALIDATE_RETURN',
  SUBMIT_RETURN: 'SUBMIT_RETURN',
  CHECK_STATUS: 'CHECK_STATUS',
  API_CALL: 'API_CALL',
  ERROR: 'ERROR',
} as const;

/**
 * CRA Test Business Numbers (Sandbox only)
 */
export const CRA_TEST_BUSINESS_NUMBERS = {
  // Valid test BN for GST/HST
  VALID_GST: '123456789RT0001',
  // Invalid BN for testing error scenarios
  INVALID: '000000000RT0000',
  // Non-resident registrant
  NON_RESIDENT: '987654321RT0001',
} as const;

/**
 * XML Namespaces for CRA NetFile
 */
export const CRA_XML_NAMESPACES = {
  NETFILE: 'http://www.cra-arc.gc.ca/xmlns/gst',
  GST34: 'http://www.cra-arc.gc.ca/xmlns/gst/gst34',
  COMMON: 'http://www.cra-arc.gc.ca/xmlns/common',
} as const;

/**
 * Validate CRA configuration
 */
export function validateCraConfig(config: {
  efileNumber: string;
  environment: string;
}): void {
  const errors: string[] = [];

  if (!config.efileNumber || config.efileNumber.length < 8) {
    errors.push('CRA_EFILE_NUMBER is required and must be at least 8 characters');
  }

  if (!config.environment || !['sandbox', 'production'].includes(config.environment)) {
    errors.push('CRA_ENVIRONMENT must be either "sandbox" or "production"');
  }

  if (errors.length > 0) {
    throw new Error(`CRA configuration invalid:\n${errors.join('\n')}`);
  }
}

/**
 * Calculate GST/HST due date
 * Returns the last day of the month following the reporting period end
 */
export function calculateGstDueDate(periodEnd: Date): Date {
  const dueDate = new Date(periodEnd);
  // Set to the first day of the next month
  dueDate.setMonth(dueDate.getMonth() + 1, 1);
  // Set to the last day of that month
  dueDate.setMonth(dueDate.getMonth() + 1, 0);
  return dueDate;
}

/**
 * Format Business Number for CRA
 */
export function formatBusinessNumber(bn: string): string {
  // Remove any spaces or dashes
  const cleaned = bn.replace(/[\s-]/g, '');

  // Validate format
  if (!CRA_BN_PATTERN.test(cleaned)) {
    throw new Error(`Invalid Business Number format: ${bn}`);
  }

  // Return with standard formatting: 123456789 RT 0001
  return `${cleaned.slice(0, 9)} ${cleaned.slice(9, 11)} ${cleaned.slice(11)}`;
}

/**
 * Validate Business Number
 */
export function isValidBusinessNumber(bn: string): boolean {
  const cleaned = bn.replace(/[\s-]/g, '');
  return CRA_BN_PATTERN.test(cleaned);
}
