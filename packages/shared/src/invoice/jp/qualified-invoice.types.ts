/**
 * Types for Japan's Qualified Invoice System (適格請求書等保存方式 - インボイス制度)
 * Implemented: October 1, 2023
 */

/**
 * Tax rates applicable in Japan's Qualified Invoice System
 */
export enum JapanTaxRate {
  STANDARD = 10, // Standard consumption tax rate (標準税率)
  REDUCED = 8,   // Reduced tax rate for food and newspapers (軽減税率)
}

/**
 * Registration number for qualified invoice issuers
 * Format: T + 13 numeric digits (Corporate Number - 法人番号)
 */
export interface RegistrationNumber {
  /** Full registration number including 'T' prefix */
  value: string;
  /** Corporate number (13 digits) */
  corporateNumber: string;
  /** Whether the number is valid */
  isValid: boolean;
  /** Validation error if invalid */
  error?: string;
}

/**
 * Line item for a qualified invoice
 */
export interface QualifiedInvoiceLineItem {
  /** Item description */
  description: string;
  /** Quantity */
  quantity: number;
  /** Unit price (tax-exclusive) */
  unitPrice: number;
  /** Applicable tax rate */
  taxRate: JapanTaxRate;
  /** Tax-exclusive amount */
  taxExclusiveAmount: number;
  /** Tax amount */
  taxAmount: number;
  /** Tax-inclusive amount */
  taxInclusiveAmount: number;
}

/**
 * Tax summary by rate
 */
export interface TaxSummary {
  /** Tax rate */
  rate: JapanTaxRate;
  /** Total tax-exclusive amount for this rate */
  taxExclusiveAmount: number;
  /** Total tax amount for this rate */
  taxAmount: number;
  /** Total tax-inclusive amount for this rate */
  taxInclusiveAmount: number;
}

/**
 * Qualified invoice data structure
 * Required fields per Japanese tax law
 */
export interface QualifiedInvoice {
  /** Invoice number */
  invoiceNumber: string;
  /** Issue date */
  issueDate: Date;

  /** Issuer (seller) information */
  issuer: {
    /** Qualified invoice issuer registration number */
    registrationNumber: string;
    /** Company/business name */
    name: string;
    /** Address */
    address: string;
  };

  /** Recipient (buyer) information */
  recipient: {
    /** Company/business name */
    name: string;
    /** Address */
    address?: string;
  };

  /** Line items */
  lineItems: QualifiedInvoiceLineItem[];

  /** Tax summaries by rate */
  taxSummaries: TaxSummary[];

  /** Total amounts */
  totals: {
    /** Total tax-exclusive amount */
    taxExclusiveAmount: number;
    /** Total tax amount */
    taxAmount: number;
    /** Total tax-inclusive amount */
    taxInclusiveAmount: number;
  };

  /** Additional notes */
  notes?: string;
}

/**
 * Invoice number format configuration
 */
export interface InvoiceNumberFormat {
  /** Company-specific prefix */
  prefix: string;
  /** Include year in format */
  includeYear: boolean;
  /** Include month in format */
  includeMonth: boolean;
  /** Sequence number length (with zero padding) */
  sequenceLength: number;
  /** Separator character */
  separator: string;
}

/**
 * Default invoice number format: {Prefix}-{YYYYMM}-{NNNN}
 */
export const DEFAULT_INVOICE_NUMBER_FORMAT: InvoiceNumberFormat = {
  prefix: 'INV',
  includeYear: true,
  includeMonth: true,
  sequenceLength: 4,
  separator: '-',
};

/**
 * Validation result for registration numbers
 */
export interface RegistrationNumberValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Details about the validation */
  details?: {
    /** Whether format is correct */
    formatValid: boolean;
    /** Whether check digit is correct */
    checkDigitValid: boolean;
    /** Calculated check digit */
    calculatedCheckDigit?: number;
  };
}
