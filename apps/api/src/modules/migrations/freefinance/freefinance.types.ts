/**
 * TypeScript types for FreeFinance data structures
 * Supports CSV/Excel imports from FreeFinance (Austrian competitor)
 */

export enum FreeFinanceMigrationType {
  CUSTOMERS = 'customers',
  VENDORS = 'vendors',
  OUTGOING_INVOICES = 'outgoing_invoices',
  INCOMING_INVOICES = 'incoming_invoices',
  PRODUCTS = 'products',
}

export enum FreeFinanceCustomerType {
  BUSINESS = 'business',
  PRIVATE = 'private',
  EU = 'eu',
  THIRD_COUNTRY = 'third_country',
}

export enum FreeFinanceInvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum FreeFinancePaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CARD = 'card',
  PAYPAL = 'paypal',
  SEPA = 'sepa',
  OTHER = 'other',
}

export interface FreeFinanceCustomer {
  // Identifier
  customerNumber: string;

  // Company info
  companyName?: string;
  firstName?: string;
  lastName?: string;

  // Type and classification
  type: FreeFinanceCustomerType;

  // Contact details
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;

  // Address
  street?: string;
  zip?: string;
  city?: string;
  country: string; // ISO code

  // Austrian tax identifiers
  uidNummer?: string; // Austrian VAT ID (ATU...)
  steuernummer?: string; // Austrian tax number
  finanzamt?: string; // Tax office

  // Banking
  iban?: string;
  bic?: string;
  bankName?: string;

  // Business details
  registrationNumber?: string; // Firmenbuchnummer
  commercialRegisterCourt?: string; // Handelsgericht

  // Payment terms
  paymentTermDays?: number;
  discount?: number;
  discountDays?: number;

  // Notes
  notes?: string;

  // Metadata
  isActive?: boolean;
  createdAt?: string;
  _rawData?: Record<string, any>;
}

export interface FreeFinanceVendor {
  // Identifier
  vendorNumber: string;

  // Company info
  companyName?: string;
  firstName?: string;
  lastName?: string;

  // Contact details
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;

  // Address
  street?: string;
  zip?: string;
  city?: string;
  country: string;

  // Tax identifiers
  uidNummer?: string;
  steuernummer?: string;

  // Banking
  iban?: string;
  bic?: string;
  bankName?: string;

  // Payment terms
  paymentTermDays?: number;

  // Notes
  notes?: string;

  // Metadata
  isActive?: boolean;
  _rawData?: Record<string, any>;
}

export interface FreeFinanceInvoiceItem {
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  discountPercent?: number;
  vatRate: number; // Austrian rates: 20%, 13%, 10%, 0%
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  productNumber?: string;
  accountingCode?: string; // SKR03/SKR04 codes
}

export interface FreeFinanceOutgoingInvoice {
  // Identifier
  invoiceNumber: string;
  type: 'invoice' | 'credit_note' | 'proforma' | 'cancellation';

  // Status
  status: FreeFinanceInvoiceStatus;

  // Customer reference
  customerNumber: string;
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  customerUidNummer?: string;

  // Dates (Austrian DD.MM.YYYY format)
  invoiceDate: string;
  dueDate: string;
  serviceDate?: string; // Leistungsdatum
  paidDate?: string;

  // Amounts in EUR
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  paidAmount?: number;
  openAmount?: number;
  currency: string;

  // VAT breakdown (Austrian multi-rate support)
  vatBreakdown?: Array<{
    rate: number;
    netAmount: number;
    vatAmount: number;
  }>;

  // Payment details
  paymentTermDays?: number;
  paymentMethod?: FreeFinancePaymentMethod;
  discount?: number;
  discountDays?: number;

  // Line items
  items: FreeFinanceInvoiceItem[];

  // Austrian specific
  reverseCharge?: boolean; // Reverse-Charge Verfahren
  innerCommunitySupply?: boolean; // Innergemeinschaftliche Lieferung
  exportDelivery?: boolean; // Ausfuhrlieferung

  // Notes
  headerText?: string;
  footerText?: string;
  notes?: string;

  // References
  orderNumber?: string;
  deliveryNoteNumber?: string;

  // Accounting
  bookingDate?: string;
  bookingPeriod?: string;

  // Metadata
  _rawData?: Record<string, any>;
}

export interface FreeFinanceIncomingInvoice {
  // Identifier
  invoiceNumber: string;
  vendorInvoiceNumber?: string; // Creditor's invoice number

  // Vendor reference
  vendorNumber?: string;
  vendorName: string;
  vendorUidNummer?: string;

  // Dates
  invoiceDate: string;
  dueDate?: string;
  receiptDate?: string; // Date received
  serviceDate?: string;
  paidDate?: string;

  // Amounts
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  paidAmount?: number;
  openAmount?: number;
  currency: string;

  // VAT breakdown
  vatBreakdown?: Array<{
    rate: number;
    netAmount: number;
    vatAmount: number;
  }>;

  // Payment
  paymentMethod?: FreeFinancePaymentMethod;
  paymentTermDays?: number;

  // Line items
  items?: FreeFinanceInvoiceItem[];

  // Classification
  category?: string;
  expenseCategory?: string;
  accountingCode?: string;

  // Austrian specific
  reverseCharge?: boolean;
  deductibleVat?: number; // Vorsteuerabzug

  // Notes
  description?: string;
  notes?: string;

  // Attachment
  hasAttachment?: boolean;
  attachmentPath?: string;

  // Accounting
  bookingDate?: string;
  bookingPeriod?: string;

  // Metadata
  _rawData?: Record<string, any>;
}

export interface FreeFinanceProduct {
  // Identifier
  productNumber: string;

  // Basic info
  name: string;
  description?: string;

  // Pricing
  unitPrice: number;
  currency: string;

  // Austrian VAT
  vatRate: number; // 20%, 13%, 10%, 0%

  // Unit
  unit: string;

  // Category
  category?: string;
  productGroup?: string;

  // Accounting
  accountingCode?: string;
  revenueAccount?: string;

  // Stock
  trackStock?: boolean;
  stockQuantity?: number;
  minStockLevel?: number;

  // Status
  isActive: boolean;
  isService?: boolean; // Dienstleistung vs. Ware

  // EAN/Barcode
  ean?: string;
  sku?: string;

  // Metadata
  _rawData?: Record<string, any>;
}

export interface ParsedMigrationData {
  type: FreeFinanceMigrationType;
  customers?: FreeFinanceCustomer[];
  vendors?: FreeFinanceVendor[];
  outgoingInvoices?: FreeFinanceOutgoingInvoice[];
  incomingInvoices?: FreeFinanceIncomingInvoice[];
  products?: FreeFinanceProduct[];
  errors: MigrationError[];
  warnings: MigrationWarning[];
}

export interface MigrationError {
  row: number;
  column?: string;
  field?: string;
  message: string;
  value?: any;
  severity: 'error' | 'critical';
}

export interface MigrationWarning {
  row: number;
  column?: string;
  field?: string;
  message: string;
  value?: any;
  suggestion?: string;
}

export interface MigrationValidationResult {
  isValid: boolean;
  errors: MigrationError[];
  warnings: MigrationWarning[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicates: number;
    emptyRows: number;
  };
  dataQuality: {
    completeness: number; // 0-100
    accuracy: number; // 0-100
    consistency: number; // 0-100
  };
}

export interface MigrationPreview {
  type: FreeFinanceMigrationType;
  fileName: string;
  fileSize: number;
  encoding: string;
  delimiter: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: MigrationError[];
  warnings: MigrationWarning[];
  sampleData: any[]; // First 10 records
  detectedColumns: string[];
  fieldMapping: Record<string, string>;
  suggestedMappings: Record<string, string[]>;
  stats: {
    currencies: string[];
    dateFormats: string[];
    countries: string[];
    vatRates: number[];
  };
}

export interface MigrationProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'validating' | 'importing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentPhase: string;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  failureCount: number;
  warningCount: number;
  errors: MigrationError[];
  warnings: MigrationWarning[];
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  processingRate?: number; // records per second
}

export interface MigrationResult {
  jobId: string;
  type: FreeFinanceMigrationType;
  status: 'completed' | 'partial' | 'failed';
  totalRecords: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: MigrationError[];
  warnings: MigrationWarning[];
  duration: number; // milliseconds
  createdIds?: string[]; // IDs of created records
  summary: {
    customers?: number;
    vendors?: number;
    invoices?: number;
    products?: number;
  };
  rollbackAvailable: boolean;
  reportUrl?: string;
}

export interface MigrationConfig {
  dryRun: boolean;
  batchSize: number;
  skipDuplicates: boolean;
  updateExisting: boolean;
  validateOnly: boolean;
  strictMode: boolean; // Fail on warnings
  createMissingReferences: boolean; // Auto-create customers/vendors if not found
  defaultCountry?: string;
  defaultCurrency?: string;
  dateFormat?: string;
  encoding?: string;
  delimiter?: string;
  customFieldMapping?: Record<string, string>;
}

export interface FreeFinanceFileInfo {
  originalName: string;
  mimeType: string;
  size: number;
  encoding?: string;
  delimiter?: string;
  rowCount?: number;
  columnCount?: number;
  detectedType?: FreeFinanceMigrationType;
}
