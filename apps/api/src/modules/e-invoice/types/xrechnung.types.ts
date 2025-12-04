/**
 * XRechnung Types
 * XRechnung is the mandatory e-invoice format for German B2G (Business-to-Government) contracts
 */

/**
 * XRechnung supports two XML syntaxes
 */
export enum XRechnungSyntax {
  /** Universal Business Language - More common internationally */
  UBL = 'UBL',
  /** Cross Industry Invoice - UN/CEFACT standard */
  CII = 'CII',
}

/**
 * Result of XRechnung validation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** List of validation errors */
  errors: ValidationError[];
  /** List of validation warnings */
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Field/path where error occurred */
  field?: string;
  /** Severity level */
  severity: 'error';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Field/path where warning occurred */
  field?: string;
  /** Severity level */
  severity: 'warning';
}

/**
 * Result of compliance check
 */
export interface ComplianceResult {
  /** Whether invoice meets XRechnung requirements */
  compliant: boolean;
  /** List of missing required fields */
  missingFields: string[];
  /** List of compliance issues */
  issues: ComplianceIssue[];
}

/**
 * Compliance issue
 */
export interface ComplianceIssue {
  /** Issue code */
  code: string;
  /** Issue description */
  message: string;
  /** Field affected */
  field: string;
  /** Severity */
  severity: 'error' | 'warning';
}

/**
 * Internal invoice data structure
 * Maps to our Prisma Invoice model
 */
export interface InvoiceData {
  // Basic info
  number: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;

  // Amounts
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  vatRate?: number;

  // Seller
  seller: {
    name: string;
    vatId: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    email?: string;
    phone?: string;
  };

  // Buyer
  buyer: {
    name: string;
    vatId?: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    email?: string;
    buyerReference?: string; // Contract/PO reference
  };

  // Line items
  items: InvoiceLineItem[];

  // XRechnung specific
  leitwegId?: string; // Mandatory routing identifier for B2G
  purchaseOrderReference?: string;
  contractReference?: string;

  // Payment info
  paymentTerms?: string;
  bankDetails?: BankDetails;
}

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  unit?: string;
  productCode?: string;
}

/**
 * Bank details for payment
 */
export interface BankDetails {
  accountHolder: string;
  iban: string;
  bic?: string;
  bankName?: string;
}

/**
 * XRechnung-specific invoice structure
 * This represents the formatted data ready for XML generation
 */
export interface XRechnungInvoice {
  syntax: XRechnungSyntax;
  invoice: InvoiceData;
  // Additional metadata for generation
  customizationId?: string;
  processId?: string;
}

/**
 * XRechnung required fields for B2G compliance
 */
export const XRECHNUNG_REQUIRED_FIELDS = [
  'number',
  'issueDate',
  'dueDate',
  'currency',
  'seller.name',
  'seller.vatId',
  'seller.address.street',
  'seller.address.city',
  'seller.address.postalCode',
  'seller.address.country',
  'buyer.name',
  'buyer.address.street',
  'buyer.address.city',
  'buyer.address.postalCode',
  'buyer.address.country',
  'buyer.buyerReference', // Mandatory for B2G
  'items',
  'totalAmount',
] as const;

/**
 * XRechnung version identifiers
 */
export const XRECHNUNG_VERSION = {
  SPECIFICATION: 'urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0',
  PROCESS_ID: 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
} as const;
