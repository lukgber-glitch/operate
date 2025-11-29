/**
 * SAF-T General Ledger Entries and Source Documents Interfaces
 * Defines transaction and document structures
 */

import { SaftCustomerAddress, SaftSupplierAddress } from './saft-master.interface';

// Re-export address types for convenience
export type { SaftCustomerAddress, SaftSupplierAddress };

/**
 * Journal/Transaction type
 */
export enum JournalType {
  SALES = 'Sales',
  PURCHASES = 'Purchases',
  CASH_RECEIPT = 'CashReceipt',
  CASH_PAYMENT = 'CashPayment',
  BANK = 'Bank',
  GENERAL = 'General',
  PAYROLL = 'Payroll',
  INVENTORY = 'Inventory',
  FIXED_ASSETS = 'FixedAssets',
  OTHER = 'Other',
}

/**
 * Transaction type indicator
 */
export enum TransactionType {
  NORMAL = 'N',
  REGULARIZATION = 'R',
  ADJUSTMENT = 'A',
}

/**
 * Debit/Credit indicator
 */
export enum DebitCreditIndicator {
  DEBIT = 'D',
  CREDIT = 'C',
}

/**
 * Journal entry line
 */
export interface SaftTransactionLine {
  recordID: string;
  accountID: string;
  analysisTypeCode?: string[];
  analysisID?: string[];
  analysisAmount?: number[];
  customerID?: string;
  supplierID?: string;
  description?: string;
  debitAmount?: number;
  creditAmount?: number;
  taxInformation?: SaftTaxInformation[];
  referenceNumber?: string;
  reconciliationDate?: string;
  reconciliationAmount?: number;
}

/**
 * Tax information for transaction line
 */
export interface SaftTaxInformation {
  taxType: string;
  taxCode: string;
  taxPercentage?: number;
  taxBase?: number;
  taxAmount?: number;
  taxExemptionReason?: string;
  taxExemptionCode?: string;
}

/**
 * Journal transaction
 */
export interface SaftTransaction {
  transactionID: string;
  period: string; // Period number
  periodYear: string;
  transactionDate: string; // YYYY-MM-DD
  sourceID?: string;
  description: string;
  docArchivalNumber?: string;
  transactionType?: TransactionType;
  glPostingDate?: string;
  customerID?: string;
  supplierID?: string;
  lines: SaftTransactionLine[];
}

/**
 * Journal (collection of transactions)
 */
export interface SaftJournal {
  journalID: string;
  description: string;
  type?: JournalType;
  transactions: SaftTransaction[];
}

/**
 * General Ledger Entries structure
 */
export interface SaftGeneralLedgerEntries {
  numberOfEntries: number;
  totalDebit: number;
  totalCredit: number;
  journal: SaftJournal[];
}

/**
 * Invoice status
 */
export enum InvoiceStatus {
  NORMAL = 'N',
  CANCELLED = 'A',
  FINAL = 'F',
  SELF_BILLED = 'S',
}

/**
 * Invoice type
 */
export enum InvoiceType {
  INVOICE = 'FT',
  SIMPLIFIED_INVOICE = 'FS',
  CREDIT_NOTE = 'NC',
  DEBIT_NOTE = 'ND',
  RECEIPT = 'FR',
  CONSIGNMENT_NOTE = 'GT',
  SELF_BILLED = 'FA',
}

/**
 * Payment mechanism
 */
export enum PaymentMechanism {
  CASH = 'CC',
  CHECK = 'CH',
  BANK_TRANSFER = 'TB',
  CREDIT_CARD = 'CD',
  DEBIT_CARD = 'DD',
  OTHER = 'OU',
}

/**
 * Invoice line
 */
export interface SaftInvoiceLine {
  lineNumber: number;
  productCode?: string;
  productDescription: string;
  quantity?: number;
  unitOfMeasure?: string;
  unitPrice?: number;
  taxPointDate?: string;
  description?: string;
  debitAmount?: number;
  creditAmount?: number;
  tax: SaftLineTax;
  taxExemptionReason?: string;
  taxExemptionCode?: string;
  settlementAmount?: number;
  customsInformation?: {
    arcNo?: string;
    iecAmount?: number;
  };
}

/**
 * Line-level tax information
 */
export interface SaftLineTax {
  taxType: string;
  taxCountryRegion: string;
  taxCode: string;
  taxPercentage?: number;
  taxBase?: number;
  taxAmount?: number;
}

/**
 * Document totals
 */
export interface SaftDocumentTotals {
  taxPayable: number;
  netTotal: number;
  grossTotal: number;
  currency?: SaftCurrency;
  settlement?: SaftSettlement[];
  payment?: SaftPayment[];
}

/**
 * Currency information
 */
export interface SaftCurrency {
  currencyCode: string;
  currencyAmount: number;
  exchangeRate?: number;
}

/**
 * Settlement information
 */
export interface SaftSettlement {
  settlementDiscount?: string;
  settlementAmount?: number;
  settlementDate?: string;
  paymentTerms?: string;
}

/**
 * Payment information
 */
export interface SaftPayment {
  paymentMechanism: PaymentMechanism;
  paymentAmount: number;
  paymentDate?: string;
}

/**
 * Sales Invoice
 */
export interface SaftSalesInvoice {
  invoiceNo: string;
  documentStatus: SaftDocumentStatus;
  hash?: string;
  hashControl?: string;
  period?: string;
  invoiceDate: string; // YYYY-MM-DD
  invoiceType: InvoiceType;
  selfBillingIndicator?: boolean;
  systemEntryDate?: string;
  transactionID?: string;
  customerID: string;
  shipTo?: SaftShipTo;
  shipFrom?: SaftShipFrom;
  movementEndTime?: string;
  movementStartTime?: string;
  line: SaftInvoiceLine[];
  documentTotals: SaftDocumentTotals;
}

/**
 * Document status
 */
export interface SaftDocumentStatus {
  invoiceStatus: InvoiceStatus;
  invoiceStatusDate: string; // YYYY-MM-DD
  reason?: string;
  sourceID: string;
  sourceBilling: 'P' | 'I' | 'M'; // Paper, Invoice software, Manual
}

/**
 * Shipping information
 */
export interface SaftShipTo {
  deliveryID?: string;
  deliveryDate?: string;
  address?: SaftCustomerAddress;
}

export interface SaftShipFrom {
  deliveryID?: string;
  deliveryDate?: string;
  address?: SaftSupplierAddress;
}

/**
 * Purchase Invoice (similar to Sales Invoice)
 */
export interface SaftPurchaseInvoice {
  invoiceNo: string;
  documentStatus: SaftDocumentStatus;
  hash?: string;
  period?: string;
  invoiceDate: string;
  invoiceType: InvoiceType;
  selfBillingIndicator?: boolean;
  systemEntryDate?: string;
  transactionID?: string;
  supplierID: string;
  line: SaftInvoiceLine[];
  documentTotals: SaftDocumentTotals;
}

/**
 * Payment document
 */
export interface SaftPaymentDocument {
  paymentRefNo: string;
  period?: string;
  transactionID?: string;
  transactionDate: string;
  paymentType: string;
  description?: string;
  systemID?: string;
  documentStatus: SaftDocumentStatus;
  paymentMethod: SaftPaymentMethod[];
  sourceID: string;
  systemEntryDate: string;
  customerID?: string;
  supplierID?: string;
  documentTotals: SaftDocumentTotals;
  line: SaftPaymentLine[];
}

/**
 * Payment method
 */
export interface SaftPaymentMethod {
  paymentMechanism: PaymentMechanism;
  paymentAmount: number;
  paymentDate: string;
}

/**
 * Payment line
 */
export interface SaftPaymentLine {
  lineNumber: number;
  sourceDocumentID?: string[];
  settlementAmount?: number;
  debitAmount?: number;
  creditAmount?: number;
  tax?: SaftLineTax;
}

/**
 * Source Documents structure
 */
export interface SaftSourceDocuments {
  salesInvoices?: {
    numberOfEntries: number;
    totalDebit: number;
    totalCredit: number;
    invoice: SaftSalesInvoice[];
  };
  purchaseInvoices?: {
    numberOfEntries: number;
    totalDebit: number;
    totalCredit: number;
    invoice: SaftPurchaseInvoice[];
  };
  payments?: {
    numberOfEntries: number;
    totalDebit: number;
    totalCredit: number;
    payment: SaftPaymentDocument[];
  };
}

/**
 * Complete audit file structure
 */
export interface SaftAuditFile {
  header: any; // SaftHeader from saft-header.interface.ts
  masterFiles: any; // SaftMasterFiles from saft-master.interface.ts
  generalLedgerEntries?: SaftGeneralLedgerEntries;
  sourceDocuments?: SaftSourceDocuments;
}
