/**
 * GoBD Document Interface
 * Defines structure for documents included in GoBD exports
 */

/**
 * Document metadata
 */
export interface DocumentMetadata {
  /** Document ID */
  id: string;
  /** Document type */
  type: string;
  /** Original filename */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** SHA-256 hash */
  hash: string;
  /** Creation date */
  createdAt: Date;
  /** Related transaction/invoice ID */
  relatedId?: string;
  /** Document description */
  description?: string;
}

/**
 * Document package structure
 */
export interface DocumentPackage {
  /** Base directory */
  baseDir: string;
  /** Categorized documents */
  categories: {
    /** Category name (e.g., 'invoices', 'receipts') */
    [category: string]: DocumentMetadata[];
  };
  /** Total document count */
  totalCount: number;
  /** Total size in bytes */
  totalSize: number;
}

/**
 * Account master data
 */
export interface AccountData {
  /** Account number */
  accountNumber: string;
  /** Account name/description */
  accountName: string;
  /** Account type */
  accountType: string;
  /** Opening balance */
  openingBalance: number;
  /** Closing balance */
  closingBalance: number;
  /** Currency code */
  currency: string;
}

/**
 * Transaction/Journal entry data
 */
export interface TransactionData {
  /** Transaction ID */
  id: string;
  /** Booking date */
  date: string;
  /** Debit account */
  debitAccount: string;
  /** Credit account */
  creditAccount: string;
  /** Amount */
  amount: number;
  /** Currency */
  currency: string;
  /** Transaction text/description */
  text: string;
  /** Document number */
  documentNumber?: string;
  /** Reference to source document */
  documentReference?: string;
  /** Cost center */
  costCenter?: string;
  /** Tax code */
  taxCode?: string;
  /** Tax amount */
  taxAmount?: number;
}

/**
 * Invoice data
 */
export interface InvoiceData {
  /** Invoice ID */
  id: string;
  /** Invoice number */
  invoiceNumber: string;
  /** Invoice date */
  date: string;
  /** Due date */
  dueDate?: string;
  /** Customer ID */
  customerId: string;
  /** Net amount */
  netAmount: number;
  /** Tax amount */
  taxAmount: number;
  /** Gross amount */
  grossAmount: number;
  /** Currency */
  currency: string;
  /** Tax rate */
  taxRate: number;
  /** Payment status */
  status: string;
  /** Document reference */
  documentPath?: string;
}

/**
 * Customer master data
 */
export interface CustomerData {
  /** Customer ID */
  id: string;
  /** Customer number */
  customerNumber: string;
  /** Company name */
  name: string;
  /** Tax ID/VAT number */
  taxId?: string;
  /** Address */
  address: {
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
  /** Contact information */
  contact?: {
    email?: string;
    phone?: string;
  };
}

/**
 * Supplier master data
 */
export interface SupplierData {
  /** Supplier ID */
  id: string;
  /** Supplier number */
  supplierNumber: string;
  /** Company name */
  name: string;
  /** Tax ID/VAT number */
  taxId?: string;
  /** Address */
  address: {
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
  /** Contact information */
  contact?: {
    email?: string;
    phone?: string;
  };
}

/**
 * Data tables collection
 */
export interface DataTables {
  /** Account master data */
  accounts: AccountData[];
  /** Transaction journal */
  transactions: TransactionData[];
  /** Invoice data */
  invoices: InvoiceData[];
  /** Customer master data */
  customers: CustomerData[];
  /** Supplier master data */
  suppliers: SupplierData[];
}

/**
 * Checksum file entry
 */
export interface ChecksumEntry {
  /** File path (relative) */
  path: string;
  /** SHA-256 hash */
  hash: string;
}

/**
 * Complete checksum file
 */
export interface ChecksumFile {
  /** Algorithm used */
  algorithm: 'SHA-256';
  /** Checksum entries */
  entries: ChecksumEntry[];
  /** Generation timestamp */
  generatedAt: Date;
}
