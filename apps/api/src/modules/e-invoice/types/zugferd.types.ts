/**
 * ZUGFeRD/Factur-X Type Definitions
 *
 * ZUGFeRD (Zentraler User Guide des Forums elektronische Rechnung Deutschland)
 * is a hybrid e-invoice format combining PDF/A-3 with embedded XML data.
 */

/**
 * ZUGFeRD/Factur-X Profile Levels
 *
 * Each profile defines the level of detail required in the invoice data:
 * - MINIMUM: Minimal invoice data (payment info only)
 * - BASIC_WL: Basic Without Lines (no line item details)
 * - BASIC: Standard B2B invoices with line items
 * - EN16931: Full European standard compliance (recommended for DACH region)
 * - EXTENDED: Extended information including additional business data
 * - XRECHNUNG: German B2G compliance via Factur-X
 */
export enum ZugferdProfile {
  MINIMUM = 'MINIMUM',
  BASIC_WL = 'BASIC_WL',
  BASIC = 'BASIC',
  EN16931 = 'EN16931',
  EXTENDED = 'EXTENDED',
  XRECHNUNG = 'XRECHNUNG',
}

/**
 * Invoice data structure for ZUGFeRD generation
 * Maps our internal invoice format to ZUGFeRD requirements
 */
export interface InvoiceData {
  // Invoice identification
  number: string;
  issueDate: Date;
  dueDate: Date;
  type?: 'STANDARD' | 'CREDIT_NOTE' | 'DEBIT_NOTE';

  // Currency
  currency: string;

  // Seller information
  seller: {
    name: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      postalCode: string;
      country: string;
      subdivision?: string;
    };
    vatId?: string;
    taxId?: string;
    email?: string;
    phone?: string;
    legalRegistrationId?: string;
  };

  // Buyer information
  buyer: {
    name: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      postalCode: string;
      country: string;
      subdivision?: string;
    };
    vatId?: string;
    email?: string;
    phone?: string;
    legalRegistrationId?: string;
  };

  // Line items
  items: InvoiceItemData[];

  // Totals
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  vatRate?: number;
  reverseCharge?: boolean;

  // Payment information
  paymentTerms?: string;
  paymentMethod?: string;
  bankReference?: string;

  // Additional references
  purchaseOrderReference?: string;
  contractReference?: string;

  // Notes
  notes?: string;

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Invoice line item data
 */
export interface InvoiceItemData {
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
 * Validation result structure
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  profile?: ZugferdProfile;
  metadata?: {
    hasEmbeddedXml: boolean;
    isPdfA3: boolean;
    xmlValidated: boolean;
  };
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  severity: 'warning';
}

/**
 * ZUGFeRD invoice structure (mapped to @e-invoice-eu/core format)
 * This is the intermediate format before XML/PDF generation
 */
export interface ZugferdInvoice {
  number: string;
  issueDate: string; // ISO format
  dueDate?: string;
  typeCode: string;
  currency: string;

  seller: {
    name: string;
    address?: {
      line1: string;
      line2?: string;
      line3?: string;
      city: string;
      postalCode: string;
      countryCode: string;
      subdivision?: string;
    };
    vatId?: string;
    taxRegistrationId?: string;
    electronicAddress?: string;
    contact?: {
      name?: string;
      phone?: string;
      email?: string;
    };
  };

  buyer: {
    name: string;
    address?: {
      line1: string;
      line2?: string;
      line3?: string;
      city: string;
      postalCode: string;
      countryCode: string;
      subdivision?: string;
    };
    vatId?: string;
    electronicAddress?: string;
    contact?: {
      name?: string;
      phone?: string;
      email?: string;
    };
  };

  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    netAmount: number;
    vatRate?: number;
    vatAmount?: number;
    unit?: string;
    productCode?: string;
  }[];

  totals: {
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
    allowanceAmount?: number;
    chargeAmount?: number;
  };

  payment?: {
    terms?: string;
    means?: string;
    reference?: string;
    dueDate?: string;
  };

  references?: {
    purchaseOrder?: string;
    contract?: string;
    despatchAdvice?: string;
  };

  notes?: string[];
}

/**
 * Generation options for ZUGFeRD PDF
 */
export interface ZugferdGenerationOptions {
  profile: ZugferdProfile;
  includeVisualPdf?: boolean;
  embedAttachments?: boolean;
  validateBeforeGeneration?: boolean;
  pdfMetadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
  };
}

/**
 * Extraction options for ZUGFeRD XML
 */
export interface ZugferdExtractionOptions {
  validateXml?: boolean;
  parseToJson?: boolean;
}
