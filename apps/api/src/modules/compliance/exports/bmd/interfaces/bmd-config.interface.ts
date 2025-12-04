/**
 * BMD Export Configuration Interfaces
 * Defines data structures for Austrian BMD accounting software exports
 */

/**
 * Export status enum
 */
export enum ExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  DOWNLOADED = 'DOWNLOADED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

/**
 * BMD Export Types
 */
export enum BmdExportType {
  BOOKING_JOURNAL = 'BOOKING_JOURNAL', // Buchungsjournal
  CHART_OF_ACCOUNTS = 'CHART_OF_ACCOUNTS', // Kontenstamm
  CUSTOMERS = 'CUSTOMERS', // Kundenstamm
  SUPPLIERS = 'SUPPLIERS', // Lieferantenstamm
  TAX_ACCOUNTS = 'TAX_ACCOUNTS', // Steuerkonto-Zuordnung
}

/**
 * BMD Export Formats
 */
export enum BmdExportFormat {
  CSV = 'CSV', // Semicolon-separated CSV
  FIXED_WIDTH = 'FIXED_WIDTH', // Fixed-width format
}

/**
 * Austrian Accounting Framework
 */
export enum AustrianAccountingFramework {
  EKR = 'EKR', // Einheits-Kontenrahmen (Standard)
  BAB = 'BAB', // Betriebsabrechnungsbogen
  CUSTOM = 'CUSTOM', // Custom chart of accounts
}

/**
 * BMD Export Configuration
 */
export interface BmdConfig {
  orgId: string;
  exportTypes: BmdExportType[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  format: BmdExportFormat;
  options: {
    useSemicolon: boolean;
    includeHeader: boolean;
    useIsoEncoding: boolean;
    postedOnly: boolean;
    accountingFramework: string;
  };
  includeArchived: boolean;
}

/**
 * BMD Booking Journal Entry
 */
export interface BmdBookingEntry {
  buchungsnummer: string; // Booking number
  belegdatum: string; // Document date (DD.MM.YYYY)
  buchungsdatum: string; // Booking date (DD.MM.YYYY)
  sollkonto: string; // Debit account (4-digit)
  habenkonto: string; // Credit account (4-digit)
  betrag: string; // Amount (1.234,56 format)
  waehrung: string; // Currency (EUR)
  steuercode?: string; // Tax code
  steuersatz?: string; // Tax rate (%)
  steuerbetrag?: string; // Tax amount
  kostenstelleId?: string; // Cost center ID
  belegnummer: string; // Document number
  belegtext: string; // Document text/description
  uidNummer?: string; // VAT ID number
  gegenkontoTyp?: string; // Counter-account type (K=Customer, L=Supplier)
  gegenkontoNummer?: string; // Counter-account number
}

/**
 * BMD Chart of Accounts Entry
 */
export interface BmdAccountEntry {
  kontonummer: string; // Account number (4-digit)
  kontobezeichnung: string; // Account name
  kontotyp: string; // Account type (A=Asset, L=Liability, E=Equity, I=Income, X=Expense)
  eroeffnungsbilanz: string; // Opening balance
  steuercode?: string; // Tax code
  kostenstelleZuordnung?: boolean; // Cost center assignment allowed
  automatikKonto?: boolean; // Automatic posting account
  saldoVortrag: string; // Balance carried forward
}

/**
 * BMD Customer Entry
 */
export interface BmdCustomerEntry {
  kundennummer: string; // Customer number
  name: string; // Customer name
  adresse: string; // Address
  plz: string; // Postal code
  ort: string; // City
  land: string; // Country code (AT, DE, etc.)
  uidNummer?: string; // VAT ID number
  debitorenkonto: string; // Accounts receivable account
  zahlungsziel: number; // Payment terms (days)
  steuerzone?: string; // Tax zone
  waehrung: string; // Currency
  email?: string; // Email address
  telefon?: string; // Phone number
}

/**
 * BMD Supplier Entry
 */
export interface BmdSupplierEntry {
  lieferantennummer: string; // Supplier number
  name: string; // Supplier name
  adresse: string; // Address
  plz: string; // Postal code
  ort: string; // City
  land: string; // Country code (AT, DE, etc.)
  uidNummer?: string; // VAT ID number
  kreditorenkonto: string; // Accounts payable account
  zahlungsziel: number; // Payment terms (days)
  steuerzone?: string; // Tax zone
  waehrung: string; // Currency
  email?: string; // Email address
  telefon?: string; // Phone number
  iban?: string; // IBAN
  bic?: string; // BIC/SWIFT
}

/**
 * BMD Tax Account Mapping
 */
export interface BmdTaxAccountMapping {
  steuercode: string; // Tax code
  steuersatz: string; // Tax rate (20.00 for 20%)
  vorsteuerKonto?: string; // Input VAT account
  umsatzsteuerKonto?: string; // Output VAT account
  beschreibung: string; // Description
}

/**
 * BMD Export Metadata
 */
export interface BmdExportMetadata {
  totalBookings?: number;
  totalAccounts?: number;
  totalCustomers?: number;
  totalSuppliers?: number;
  totalAmount?: string;
  exportDate: string;
  fiscalYear: number;
  accountingFramework: string;
}
