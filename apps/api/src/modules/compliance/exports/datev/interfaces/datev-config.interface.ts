import { DatevSKRType, DatevFormatVersion } from '../dto/datev-export.dto';

/**
 * DATEV Export Configuration
 */
export interface DatevConfig {
  orgId: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  companyConfig: DatevCompanyConfig;
  options: DatevExportOptions;
}

/**
 * DATEV Company Configuration
 */
export interface DatevCompanyConfig {
  consultantNumber: number;
  clientNumber: number;
  fiscalYearStart: number;
  skrType: DatevSKRType;
  accountLength?: number;
  companyName?: string;
}

/**
 * DATEV Export Options
 */
export interface DatevExportOptions {
  includeAccountLabels?: boolean;
  includeCustomers?: boolean;
  includeSuppliers?: boolean;
  includeTransactions?: boolean;
  formatVersion?: DatevFormatVersion;
  origin?: string;
  label?: string;
}

/**
 * DATEV Header Fields
 * Format: "DATEV";version;category;format;reserved;reserved;created_by;exported_by;
 *         consultant_no;client_no;fiscal_year_start;account_length;date_from;date_to;
 *         label;reserved;reserved;reserved;skr;reserved;reserved;origin;...
 */
export interface DatevHeader {
  formatName: string; // "DATEV"
  formatVersion: string; // "7.0"
  dataCategory: number; // 21 = Buchungsstapel
  formatType: string; // "Buchungsstapel"
  formatVersion2: string; // Version again
  reserved1: string;
  createdBy: string;
  exportedBy: string;
  consultantNumber: number;
  clientNumber: number;
  fiscalYearStart: number;
  accountLength: number;
  dateFrom: number; // YYYYMMDD
  dateTo: number; // YYYYMMDD
  label: string;
  reserved2: string;
  reserved3: string;
  reserved4: string;
  skr: string; // "03" or "04"
  reserved5: string;
  reserved6: string;
  origin: string; // Software name
  reserved7: string;
  reserved8: string;
}

/**
 * DATEV Booking Entry (Buchungsstapel)
 */
export interface DatevBookingEntry {
  amount: number; // Umsatz (ohne Soll/Haben-Kz)
  debitCredit: 'S' | 'H'; // Soll/Haben-Kennzeichen (S=Soll/Debit, H=Haben/Credit)
  currency: string; // WKZ Umsatz (EUR, USD, etc.)
  exchangeRate?: number; // Kurs
  baseAmount?: number; // Basis-Umsatz
  accountNumber: string; // Konto
  offsetAccount: string; // Gegenkonto (Debitor/Kreditor)
  taxKey?: string; // BU-Schlüssel (tax key)
  bookingDate: string; // Belegdatum (DDMM)
  documentNumber: string; // Belegfeld 1 (document number)
  postingText: string; // Buchungstext
  postingNumber?: string; // Postensperre
  diverseAccountNumber?: string; // Diverse Adressnummer
  businessPartner?: string; // Geschäftspartner-Bank
  postingReason?: string; // Buchungsgrund
  taxRate?: number; // Steuersatz
  country?: string; // Ländercode
  documentDate?: string; // Belegdatum (TTMMJJ format)
  costCenter?: string; // Kostenstelle
  costUnit?: string; // Kostenträger
  additionalInfo?: string; // Zusatzinformation
}

/**
 * DATEV Account Label Entry (Kontenbeschriftung)
 */
export interface DatevAccountLabel {
  accountNumber: string;
  accountName: string;
  accountType?: 'D' | 'K' | 'S'; // D=Debitor, K=Kreditor, S=Sachkonto
  language?: string;
}

/**
 * DATEV Customer/Supplier Entry (Debitoren/Kreditoren)
 */
export interface DatevBusinessPartner {
  accountNumber: string;
  name: string;
  shortName?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  vatId?: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
  bankCode?: string;
  iban?: string;
  bic?: string;
  language?: string;
  paymentTerms?: number;
}

/**
 * DATEV Export Status
 */
export enum DatevExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
  DOWNLOADED = 'DOWNLOADED',
}

/**
 * DATEV Data Category Codes
 */
export enum DatevDataCategory {
  BUCHUNGSSTAPEL = 21, // Booking stack
  KONTENBESCHRIFTUNG = 20, // Account labels
  DEBITOREN_KREDITOREN = 16, // Customers/Suppliers
}
