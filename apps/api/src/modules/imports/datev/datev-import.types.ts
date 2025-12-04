/**
 * DATEV Import Types
 * TypeScript interfaces for DATEV ASCII CSV import functionality
 */

import { DatevSKRType } from '../../compliance/exports/datev/dto/datev-export.dto';

/**
 * DATEV Import File Type
 */
export enum DatevImportFileType {
  BUCHUNGSSTAPEL = 'BUCHUNGSSTAPEL', // Booking batches
  KONTENBESCHRIFTUNG = 'KONTENBESCHRIFTUNG', // Account labels
  STAMMDATEN = 'STAMMDATEN', // Master data (customers/suppliers)
  DEBITOREN = 'DEBITOREN', // Customers
  KREDITOREN = 'KREDITOREN', // Suppliers
  UNKNOWN = 'UNKNOWN',
}

/**
 * DATEV Import Status
 */
export enum DatevImportStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  VALIDATED = 'VALIDATED',
  IMPORTING = 'IMPORTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Parsed DATEV Header
 */
export interface ParsedDatevHeader {
  formatName: string; // "DATEV"
  formatVersion: string; // "7.0"
  dataCategory: number; // 21 = Buchungsstapel, 20 = Kontenbeschriftung, 16 = Debitoren/Kreditoren
  formatType: string; // "Buchungsstapel" / "Kontenbeschriftungen" / etc.
  formatVersion2: string;
  reserved1: string;
  createdBy: string;
  exportedBy: string;
  consultantNumber: number;
  clientNumber: number;
  fiscalYearStart: number; // YYYYMMDD
  accountLength: number;
  dateFrom: number; // YYYYMMDD
  dateTo: number; // YYYYMMDD
  label: string;
  reserved2: string;
  reserved3: string;
  reserved4: string;
  skr: DatevSKRType; // "03" or "04"
  reserved5: string;
  reserved6: string;
  origin: string; // Software name
  reserved7: string;
  reserved8: string;
  raw: string[]; // Original header fields
}

/**
 * Parsed DATEV Booking Entry
 */
export interface ParsedDatevBooking {
  amount: number; // Umsatz (ohne Soll/Haben-Kz)
  debitCredit: 'S' | 'H'; // Soll/Haben (S=Debit, H=Credit)
  currency: string; // WKZ Umsatz
  exchangeRate?: number; // Kurs
  baseAmount?: number; // Basis-Umsatz
  baseCurrency?: string; // WKZ Basis-Umsatz
  accountNumber: string; // Konto
  offsetAccount: string; // Gegenkonto
  taxKey?: string; // BU-Schlüssel
  bookingDate: string; // Belegdatum (DDMM)
  documentNumber: string; // Belegfeld 1
  documentField2?: string; // Belegfeld 2
  discount?: number; // Skonto
  postingText: string; // Buchungstext
  postingLock?: string; // Postensperre
  diverseAccountNumber?: string; // Diverse Adressnummer
  businessPartnerBank?: string; // Geschäftspartner-Bank
  sachverhalt?: string; // Sachverhalt
  interestLock?: string; // Zinssperre
  documentLink?: string; // Beleglink
  costCenter1?: string; // KOST1
  costCenter2?: string; // KOST2
  costAmount?: number; // Kost-Menge
  euCountryVatId?: string; // EU-Land u. UStID
  euTaxRate?: number; // EU-Steuersatz
  documentDate?: string; // Belegdatum (TTMMJJ format)
  serviceDate?: string; // Leistungsdatum
  taxPeriodDate?: string; // Datum Zuord. Steuerperiode
  raw: string[]; // Original CSV fields
  lineNumber: number; // Line number in file
  validationErrors: string[]; // Validation errors
}

/**
 * Parsed DATEV Account Label
 */
export interface ParsedDatevAccountLabel {
  accountNumber: string;
  accountName: string;
  languageId?: string;
  raw: string[];
  lineNumber: number;
  validationErrors: string[];
}

/**
 * Parsed DATEV Business Partner (Customer/Supplier)
 */
export interface ParsedDatevBusinessPartner {
  accountNumber: string;
  name: string;
  addressType?: string; // 1 = Customer, 2 = Supplier
  shortName?: string;
  euCountry?: string;
  euVatId?: string;
  salutation?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
  bankCode?: string;
  iban?: string;
  bic?: string;
  raw: string[];
  lineNumber: number;
  validationErrors: string[];
}

/**
 * DATEV Import Analysis Result
 */
export interface DatevImportAnalysis {
  fileType: DatevImportFileType;
  header: ParsedDatevHeader;
  columnNames: string[];
  recordCount: number;
  skrType: DatevSKRType;
  dateRange: {
    from: Date;
    to: Date;
  };
  companyConfig: {
    consultantNumber: number;
    clientNumber: number;
    fiscalYearStart: number;
  };
  estimatedImportTime: number; // in seconds
  warnings: string[];
  errors: string[];
}

/**
 * DATEV Import Preview
 */
export interface DatevImportPreview {
  analysis: DatevImportAnalysis;
  sampleRecords: Array<
    ParsedDatevBooking | ParsedDatevAccountLabel | ParsedDatevBusinessPartner
  >;
  mapping: DatevImportMapping;
  validationSummary: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    warnings: number;
  };
}

/**
 * DATEV Import Mapping
 * Maps DATEV accounts to internal Operate accounts
 */
export interface DatevImportMapping {
  skrType: DatevSKRType;
  accountMappings: Array<{
    datevAccount: string;
    datevAccountName: string;
    operateAccountCode: string;
    operateAccountName: string;
    confidence: number; // 0.0 - 1.0
    mappingType: 'automatic' | 'manual' | 'suggestion';
  }>;
  unmappedAccounts: Array<{
    datevAccount: string;
    datevAccountName?: string;
    suggestions: Array<{
      operateAccountCode: string;
      operateAccountName: string;
      confidence: number;
      reason: string;
    }>;
  }>;
}

/**
 * DATEV Import Job
 */
export interface DatevImportJob {
  id: string;
  orgId: string;
  fileType: DatevImportFileType;
  filename: string;
  status: DatevImportStatus;
  progress: number; // 0-100
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  warnings: string[];
  errors: string[];
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  metadata: {
    skrType: DatevSKRType;
    dateRange: {
      from: Date;
      to: Date;
    };
    consultantNumber: number;
    clientNumber: number;
  };
}

/**
 * DATEV Import Result
 */
export interface DatevImportResult {
  jobId: string;
  status: DatevImportStatus;
  summary: {
    totalRecords: number;
    imported: number;
    skipped: number;
    failed: number;
    warnings: number;
  };
  details: {
    transactions?: {
      created: number;
      updated: number;
      skipped: number;
    };
    accounts?: {
      created: number;
      updated: number;
      skipped: number;
    };
    businessPartners?: {
      customers: {
        created: number;
        updated: number;
        skipped: number;
      };
      suppliers: {
        created: number;
        updated: number;
        skipped: number;
      };
    };
  };
  errors: Array<{
    lineNumber: number;
    field?: string;
    message: string;
    record?: any;
  }>;
  warnings: Array<{
    lineNumber: number;
    message: string;
  }>;
  processingTime: number; // milliseconds
}

/**
 * DATEV Import Options
 */
export interface DatevImportOptions {
  dryRun?: boolean; // Preview only, don't actually import
  skipValidation?: boolean; // Skip validation (not recommended)
  updateExisting?: boolean; // Update existing records
  skipDuplicates?: boolean; // Skip duplicate records
  mapping?: DatevImportMapping; // Custom account mapping
  batchSize?: number; // Number of records to process in a batch (default: 100)
  continueOnError?: boolean; // Continue importing even if some records fail
}
