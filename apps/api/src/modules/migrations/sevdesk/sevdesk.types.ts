/**
 * sevDesk Migration Types
 * TypeScript interfaces for sevDesk data structures
 */

export enum SevDeskEntityType {
  CONTACT = 'contact',
  INVOICE = 'invoice',
  EXPENSE = 'expense',
  PRODUCT = 'product',
}

export enum SevDeskMigrationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  VALIDATING = 'validating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

export interface SevDeskContact {
  id?: string;
  name: string;
  customerNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  taxNumber?: string;
  vatNumber?: string;
  category?: string;
  description?: string;
}

export interface SevDeskInvoiceLineItem {
  id?: string;
  name: string;
  text?: string;
  quantity: number;
  unity?: string;
  price: number;
  taxRate?: number;
  discount?: number;
  total?: number;
}

export interface SevDeskInvoice {
  id?: string;
  invoiceNumber: string;
  contact?: string;
  contactName?: string;
  contactId?: string;
  invoiceDate: Date | string;
  deliveryDate?: Date | string;
  status?: string;
  header?: string;
  headText?: string;
  footText?: string;
  addressName?: string;
  addressStreet?: string;
  addressZip?: string;
  addressCity?: string;
  addressCountry?: string;
  currency?: string;
  sumNet?: number;
  sumTax?: number;
  sumGross?: number;
  sumDiscount?: number;
  customerInternalNote?: string;
  showNet?: boolean;
  lineItems?: SevDeskInvoiceLineItem[];
}

export interface SevDeskExpense {
  id?: string;
  date: Date | string;
  supplier?: string;
  description?: string;
  category?: string;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  currency?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
}

export interface SevDeskProduct {
  id?: string;
  name: string;
  productNumber?: string;
  description?: string;
  price?: number;
  pricePurchase?: number;
  priceNet?: number;
  priceGross?: number;
  taxRate?: number;
  unity?: string;
  category?: string;
  stock?: number;
  stockEnabled?: boolean;
  active?: boolean;
}

export interface SevDeskFieldMapping {
  sevDeskField: string;
  operateField: string;
  transform?: (value: any) => any;
  required?: boolean;
}

export interface SevDeskMigrationResult {
  entityType: SevDeskEntityType;
  success: boolean;
  sevDeskId?: string;
  operateId?: string;
  error?: string;
  warnings?: string[];
}

export interface SevDeskMigrationSummary {
  totalRecords: number;
  successful: number;
  failed: number;
  skipped: number;
  warnings: number;
  results: SevDeskMigrationResult[];
  duration: number;
  startTime: Date;
  endTime: Date;
}

export interface SevDeskValidationError {
  row: number;
  field: string;
  value: any;
  error: string;
  entityType: SevDeskEntityType;
}

export interface SevDeskValidationReport {
  valid: boolean;
  errors: SevDeskValidationError[];
  warnings: string[];
  totalRecords: number;
  validRecords: number;
}

export interface SevDeskMigrationJob {
  id: string;
  organizationId: string;
  userId: string;
  status: SevDeskMigrationStatus;
  entityType: SevDeskEntityType;
  fileName: string;
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  validationReport?: SevDeskValidationReport;
  migrationSummary?: SevDeskMigrationSummary;
  dryRun: boolean;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface SevDeskDuplicateCheck {
  isDuplicate: boolean;
  existingId?: string;
  matchedOn: string[];
  confidence: number;
}

export interface ParsedSevDeskData {
  contacts: SevDeskContact[];
  invoices: SevDeskInvoice[];
  expenses: SevDeskExpense[];
  products: SevDeskProduct[];
  rawData?: any;
}
