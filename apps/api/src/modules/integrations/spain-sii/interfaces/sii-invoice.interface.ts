import {
  SiiInvoiceType,
  SiiVatKey,
  SiiOperationType,
  SiiSpecialCircumstance,
} from '../constants/sii.constants';

/**
 * SII Invoice Identification
 */
export interface SiiInvoiceId {
  invoiceNumber: string;
  issueDate: Date;
  invoiceType: SiiInvoiceType;
}

/**
 * SII Party Information (Issuer/Recipient)
 */
export interface SiiParty {
  nif: string; // Tax ID
  name: string;
  countryCode?: string; // ISO 3166-1 alpha-2 (for non-Spanish parties)
}

/**
 * SII VAT Line Item
 */
export interface SiiVatLine {
  vatKey: SiiVatKey;
  taxableBase: number; // Base imponible
  vatRate: number; // Tipo impositivo (percentage)
  vatAmount: number; // Cuota
  equivalenceSurchargeRate?: number; // Tipo recargo de equivalencia
  equivalenceSurchargeAmount?: number; // Cuota recargo de equivalencia
}

/**
 * SII Issued Invoice (Factura Emitida)
 */
export interface SiiIssuedInvoice {
  // Invoice identification
  invoiceId: SiiInvoiceId;

  // Parties
  issuer: SiiParty;
  recipient: SiiParty;

  // Operation details
  operationType: SiiOperationType;
  specialCircumstance?: SiiSpecialCircumstance;

  // Invoice details
  invoiceDescription: string;
  totalInvoiceAmount: number; // Total factura

  // VAT breakdown
  vatLines: SiiVatLine[];

  // Optional fields
  internalReference?: string; // Internal reference
  externalReference?: string; // External reference
  simplifiedInvoice?: boolean;
  issuedByThirdParty?: boolean;
  thirdPartyIssuer?: SiiParty;

  // Rectification details (for R1-R5 invoice types)
  rectification?: {
    originalInvoiceNumber: string;
    originalIssueDate: Date;
    rectificationType: 'S' | 'I'; // S = Substitution, I = Differences
    rectificationBase?: number;
    rectificationVat?: number;
    rectificationReason?: string;
  };

  // Cash basis
  isCashBasis?: boolean;
  collectionDate?: Date;

  // Intracommunity operations
  isIntracommunity?: boolean;
  destinationCountry?: string;

  // Related invoices
  relatedInvoices?: Array<{
    invoiceNumber: string;
    issueDate: Date;
  }>;

  // Additional info
  remarks?: string;
}

/**
 * SII Received Invoice (Factura Recibida)
 */
export interface SiiReceivedInvoice {
  // Invoice identification
  invoiceId: SiiInvoiceId;

  // Parties
  issuer: SiiParty;
  recipient: SiiParty;

  // Operation details
  operationType: SiiOperationType;
  specialCircumstance?: SiiSpecialCircumstance;

  // Invoice details
  invoiceDescription: string;
  totalInvoiceAmount: number;

  // VAT breakdown
  vatLines: SiiVatLine[];

  // Deductibility
  deductibleAmount?: number; // Cuota deducible
  deductionPercentage?: number; // Porcentaje de deducción

  // Optional fields
  internalReference?: string;
  registrationDate?: Date; // Date of accounting registration

  // Reverse charge
  isReverseCharge?: boolean;

  // Intracommunity
  isIntracommunity?: boolean;
  originCountry?: string;

  // Import
  isImport?: boolean;
  duaReference?: string; // DUA (Documento Único Administrativo) reference

  // Rectification details
  rectification?: {
    originalInvoiceNumber: string;
    originalIssueDate: Date;
    rectificationType: 'S' | 'I';
    rectificationBase?: number;
    rectificationVat?: number;
    rectificationReason?: string;
  };

  // Related invoices
  relatedInvoices?: Array<{
    invoiceNumber: string;
    issueDate: Date;
  }>;

  // Additional info
  remarks?: string;
}

/**
 * SII Invoice Submission Batch
 */
export interface SiiInvoiceBatch {
  holder: SiiParty; // Tax ID holder submitting the invoices
  fiscalYear: number;
  period: string; // Format: MM or 1T, 2T, 3T, 4T
  invoices: SiiIssuedInvoice[] | SiiReceivedInvoice[];
}

/**
 * SII Collection/Payment Record
 */
export interface SiiPaymentRecord {
  invoiceId: SiiInvoiceId;
  holder: SiiParty;
  paymentDate: Date;
  paymentAmount: number;
  paymentMethod: SiiPaymentMethod;
  accountOrReference?: string;
}

/**
 * SII Payment Methods
 */
export enum SiiPaymentMethod {
  TRANSFER = '01', // Bank transfer
  CHECK = '02', // Check
  PROMISSORY_NOTE = '03', // Promissory note
  OTHER = '04', // Other
  DIRECT_DEBIT = '05', // Direct debit
}

/**
 * SII Query Filters
 */
export interface SiiQueryFilter {
  holder: SiiParty;
  fiscalYear: number;
  period?: string;
  invoiceId?: SiiInvoiceId;
  dateFrom?: Date;
  dateTo?: Date;
  issuerNif?: string;
  recipientNif?: string;
}
