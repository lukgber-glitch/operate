/**
 * JP-PINT (Japan Peppol International) Types
 *
 * TypeScript types for Japanese Peppol integration
 */

import {
  PeppolParticipantId,
  PeppolDocumentId,
  PeppolProcessId,
  UBLInvoice,
  UBLParty,
  PeppolValidationError,
} from '../types/peppol.types';

/**
 * Japanese Corporate Number (法人番号)
 * 13-digit identifier with check digit
 */
export interface JapaneseCorporateNumber {
  raw: string; // 13 digits
  formatted: string; // With separators if needed
  checkDigit: number; // Last digit
  isValid: boolean;
}

/**
 * Japanese Invoice Registry Number
 * Format: T + 13-digit Corporate Number
 */
export interface JapaneseInvoiceRegistryNumber {
  raw: string; // T + 13 digits
  corporateNumber: string; // 13 digits without 'T'
  isValid: boolean;
}

/**
 * Japanese Peppol Participant
 */
export interface JPPeppolParticipant extends PeppolParticipantId {
  scheme: '9912'; // Japan Corporate Number scheme
  identifier: string; // 13-digit Corporate Number
  invoiceRegistryNumber?: string; // T + 13 digits (optional)
  formatted: string; // 9912:1234567890123
}

/**
 * Japanese Tax Information
 */
export interface JapaneseTaxInfo {
  category: 'S' | 'AA' | 'E' | 'Z' | 'AE';
  rate: number; // 10.0 or 8.0
  amount: number;
  baseAmount: number;
  description?: string;
}

/**
 * Japanese Address
 */
export interface JapaneseAddress {
  postalCode: string; // xxx-xxxx format
  prefecture: string; // 都道府県
  city: string; // 市区町村
  addressLine1: string; // 番地
  addressLine2?: string; // ビル・マンション名
  countryCode: 'JP';
}

/**
 * Japanese Party (Supplier/Customer)
 */
export interface JapaneseParty extends Omit<UBLParty, 'participantId' | 'address'> {
  participantId: JPPeppolParticipant;
  address: JapaneseAddress;
  corporateNumber: string; // 法人番号
  invoiceRegistryNumber?: string; // 適格請求書発行事業者登録番号
  registeredName: string; // 登録事業者名
}

/**
 * JP-PINT Invoice
 */
export interface JPPINTInvoice extends Omit<UBLInvoice, 'supplier' | 'customer' | 'currency'> {
  customizationId: string; // urn:peppol:pint:billing-1@jp-1
  profileId: string; // urn:peppol:bis:billing
  currency: 'JPY';
  supplier: JapaneseParty;
  customer: JapaneseParty;
  timestamp: Date; // Required for Japanese invoices
  taxBreakdown: JapaneseTaxInfo[];
  consumptionTaxTotal: number; // Total consumption tax (消費税)
  invoiceRegistryNumberSupplier: string; // Supplier's registry number
}

/**
 * JP-PINT Document Metadata
 */
export interface JPPINTDocumentMetadata {
  documentId: PeppolDocumentId;
  processId: PeppolProcessId;
  customizationId: string;
  profileId: string;
  version: string; // JP-PINT version
  timestamp: Date;
}

/**
 * JP-PINT Validation Result
 */
export interface JPPINTValidationResult {
  valid: boolean;
  errors: PeppolValidationError[];
  warnings: PeppolValidationError[];
  jpSpecificErrors?: JPPINTValidationError[];
}

/**
 * JP-PINT Validation Error
 */
export interface JPPINTValidationError extends PeppolValidationError {
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
  code: string;
  jpSpecific?: boolean; // Indicates Japan-specific validation
  japaneseMessage?: string; // Error message in Japanese
}

/**
 * JP-PINT Configuration
 */
export interface JPPINTConfig {
  enableStrictValidation: boolean;
  requireInvoiceRegistryNumber: boolean;
  requireTimestamp: boolean;
  validateCorporateNumber: boolean;
  validateCheckDigit: boolean;
  defaultTaxRate: number; // Default: 10.0
  reducedTaxRate: number; // Default: 8.0
}

/**
 * Corporate Number Validation Result
 */
export interface CorporateNumberValidation {
  isValid: boolean;
  number: string;
  checkDigit: number;
  calculatedCheckDigit: number;
  error?: string;
}

/**
 * Invoice Registry Number Validation Result
 */
export interface InvoiceRegistryValidation {
  isValid: boolean;
  registryNumber: string;
  corporateNumber: string;
  hasPrefix: boolean;
  error?: string;
}

/**
 * Japanese Tax Breakdown Item
 */
export interface JapaneseTaxBreakdownItem {
  category: string;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
}

/**
 * JP-PINT Send Document DTO extension
 */
export interface JPPINTSendDocumentDto {
  organizationId: string;
  documentType: 'Invoice';
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  currency: 'JPY';
  timestamp: string; // ISO 8601 timestamp
  supplier: {
    participantId: {
      scheme: '9912';
      identifier: string; // 13-digit Corporate Number
    };
    name: string;
    registeredName: string;
    corporateNumber: string;
    invoiceRegistryNumber: string; // T + 13 digits
    address: JapaneseAddress;
    contact?: {
      name?: string;
      telephone?: string;
      email?: string;
    };
  };
  customer: {
    participantId: {
      scheme: '9912';
      identifier: string;
    };
    name: string;
    registeredName: string;
    corporateNumber: string;
    invoiceRegistryNumber?: string;
    address: JapaneseAddress;
    contact?: {
      name?: string;
      telephone?: string;
      email?: string;
    };
  };
  lines: Array<{
    id: string;
    quantity: number;
    unitCode: string;
    description: string;
    priceAmount: number;
    lineExtensionAmount: number;
    taxCategory: 'S' | 'AA' | 'E' | 'Z' | 'AE';
    taxPercent: number;
    taxAmount: number;
  }>;
  taxTotal: number;
  taxBreakdown: JapaneseTaxBreakdownItem[];
  totalAmount: number;
  paymentMeans?: {
    paymentMeansCode: string;
    paymentId?: string;
    bankAccount?: {
      accountNumber: string;
      bankCode: string;
      branchCode: string;
      accountName: string;
    };
  };
}
