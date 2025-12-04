/**
 * TypeScript types for lexoffice data structures
 * Supports CSV/Excel imports from lexoffice competitor
 */

export enum LexofficeMigrationType {
  CONTACTS = 'contacts',
  INVOICES = 'invoices',
  VOUCHERS = 'vouchers',
  PRODUCTS = 'products',
}

export enum LexofficeContactType {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  BOTH = 'both',
}

export enum LexofficeInvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

export interface LexofficeContact {
  // Identifier
  contactNumber?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;

  // Type
  type: LexofficeContactType;

  // Contact details
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;

  // Address
  street?: string;
  zip?: string;
  city?: string;
  country?: string;

  // Tax
  vatId?: string;
  taxNumber?: string;

  // Banking
  iban?: string;
  bic?: string;
  bankName?: string;

  // Notes
  notes?: string;

  // Metadata from CSV
  _rawData?: Record<string, any>;
}

export interface LexofficeInvoiceItem {
  position?: number;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discount?: number;
  taxRate: number;
  amount: number;
  taxAmount: number;
  productNumber?: string;
}

export interface LexofficeInvoice {
  // Identifier
  invoiceNumber: string;
  type?: 'invoice' | 'credit_note' | 'proforma';

  // Status
  status: LexofficeInvoiceStatus;

  // Customer
  customerNumber?: string;
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  customerVatId?: string;

  // Dates (as strings from CSV)
  invoiceDate: string;
  dueDate?: string;
  deliveryDate?: string;
  paidDate?: string;

  // Amounts
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;

  // Payment
  paymentTerms?: string;
  paymentMethod?: string;

  // Line items
  items: LexofficeInvoiceItem[];

  // Notes
  introduction?: string;
  notes?: string;

  // Metadata
  _rawData?: Record<string, any>;
}

export interface LexofficeVoucher {
  // Identifier
  voucherNumber?: string;
  receiptNumber?: string;

  // Type
  type: 'expense' | 'receipt' | 'other';

  // Vendor
  vendorName?: string;
  vendorVatId?: string;

  // Date and amounts
  date: string;
  amount: number;
  currency: string;
  taxAmount?: number;
  taxRate?: number;

  // Category
  category?: string;

  // Description
  description: string;

  // Payment
  paymentMethod?: string;

  // Status
  status?: 'pending' | 'approved' | 'rejected';

  // File reference
  attachmentUrl?: string;

  // Metadata
  _rawData?: Record<string, any>;
}

export interface LexofficeProduct {
  // Identifier
  productNumber?: string;

  // Basic info
  name: string;
  description?: string;

  // Pricing
  unitPrice: number;
  currency: string;

  // Tax
  taxRate: number;

  // Unit
  unit?: string;

  // Category
  category?: string;

  // Stock
  stockQuantity?: number;

  // Status
  isActive?: boolean;

  // Metadata
  _rawData?: Record<string, any>;
}

export interface ParsedMigrationData {
  type: LexofficeMigrationType;
  contacts?: LexofficeContact[];
  invoices?: LexofficeInvoice[];
  vouchers?: LexofficeVoucher[];
  products?: LexofficeProduct[];
  errors: MigrationError[];
  warnings: MigrationWarning[];
}

export interface MigrationError {
  row: number;
  field?: string;
  message: string;
  value?: any;
}

export interface MigrationWarning {
  row: number;
  field?: string;
  message: string;
  value?: any;
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
  };
}

export interface MigrationPreview {
  type: LexofficeMigrationType;
  totalRecords: number;
  validRecords: number;
  errors: MigrationError[];
  warnings: MigrationWarning[];
  sampleData: any[];
  fieldMapping: Record<string, string>;
}

export interface MigrationProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  failureCount: number;
  errors: MigrationError[];
  startedAt?: Date;
  completedAt?: Date;
}

export interface MigrationResult {
  jobId: string;
  type: LexofficeMigrationType;
  status: 'completed' | 'partial' | 'failed';
  totalRecords: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: MigrationError[];
  warnings: MigrationWarning[];
  duration: number; // milliseconds
  createdIds?: string[]; // IDs of created records
}
