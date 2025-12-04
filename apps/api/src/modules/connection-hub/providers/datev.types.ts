/**
 * DATEV Integration Service Types
 * Type definitions for DATEV Unternehmen Online API integration
 *
 * DATEV is the leading accounting software used by German tax advisors (Steuerberater).
 * This integration supports data exchange in DATEV-compatible formats.
 */

/**
 * DATEV OAuth 2.0 Token Response
 */
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

/**
 * DATEV API Credentials
 * Erforderliche Zugangsdaten für DATEV-Integration
 */
export interface DATEVCredentials {
  /** OAuth Client ID */
  client_id: string;

  /** OAuth Client Secret */
  client_secret: string;

  /** Beraternummer (4-7 stellig) - Consultant number */
  consultant_number: string;

  /** Mandantennummer (1-5 stellig) - Client number */
  client_number: string;

  /** Optionale Wirtschaftsjahr-Start (Standard: 101 für 1. Januar) */
  fiscal_year_start?: string;

  /** Sachkontenlänge (4 oder 8 stellig) */
  account_length?: 4 | 8;
}

/**
 * DATEV Buchungssatz (Booking Record)
 * Einzelne Buchung im DATEV-Format
 */
export interface DATEVBookingRecord {
  /** Umsatz (brutto) in EUR mit Komma als Dezimaltrennzeichen */
  amount: string;

  /** Soll/Haben-Kennzeichen: 'S' = Soll, 'H' = Haben */
  debit_credit: 'S' | 'H';

  /** WKZ Umsatz (Währungskennzeichen, z.B. 'EUR') */
  currency: string;

  /** Kurs */
  exchange_rate?: string;

  /** Basis-Umsatz */
  base_amount?: string;

  /** WKZ Basis-Umsatz */
  base_currency?: string;

  /** Konto (SKR03/SKR04) */
  account: string;

  /** Gegenkonto (ohne BU-Schlüssel) */
  contra_account: string;

  /** BU-Schlüssel (Steuerschlüssel) */
  tax_key?: string;

  /** Belegdatum (Format: DDMM oder DDMMYY) */
  document_date: string;

  /** Belegfeld 1 (Belegnummer) */
  document_number: string;

  /** Belegfeld 2 */
  document_field_2?: string;

  /** Buchungstext */
  booking_text: string;

  /** Postensperre bis (Format: TTMMJJ) */
  locked_until?: string;

  /** Diverse Adressnummer */
  address_number?: string;

  /** Geschäftspartnerbank */
  business_partner_bank?: string;

  /** Sachverhalt */
  business_case?: string;

  /** Festschreibung (0 oder 1) */
  locked?: '0' | '1';

  /** Leistungsdatum (Format: TTMMJJ) */
  service_date?: string;

  /** Datum Zuord. Steuerperiode (Format: TTMMJJ) */
  tax_period_date?: string;

  /** Fälligkeit (Format: TTMMJJ) */
  due_date?: string;

  /** USt-Schlüssel (Versteuerungsart) */
  vat_key?: string;

  /** EU-Land u. UStID */
  eu_country_vat_id?: string;

  /** Sachkontorahmen */
  chart_of_accounts?: string;
}

/**
 * DATEV Konto (Account)
 * Kontoinformation aus Kontenrahmen
 */
export interface DATEVAccount {
  /** Kontonummer */
  account_number: string;

  /** Kontobezeichnung */
  account_name: string;

  /** Kontotyp: 'S' = Sachkonto, 'D' = Debitor, 'K' = Kreditor */
  account_type: 'S' | 'D' | 'K';

  /** Kontenrahmen (z.B. 'SKR03', 'SKR04') */
  chart_of_accounts: string;

  /** Steuerschlüssel */
  tax_key?: string;

  /** USt-IdNr. */
  vat_id?: string;

  /** Automatikkonto */
  automatic_account?: string;

  /** Kontogruppe */
  account_group?: string;
}

/**
 * DATEV Export Format
 * Unterstützte Export-Formate
 */
export enum DATEVExportFormat {
  /** DATEV ASCII Format (Standard für Buchungen) */
  ASCII = 'ASCII',

  /** DATEV CSV Format */
  CSV = 'CSV',

  /** DATEV XML Format (für Belege) */
  XML = 'XML',
}

/**
 * DATEV Kontenrahmen (Chart of Accounts)
 */
export enum DATEVChartOfAccounts {
  /** Standardkontenrahmen 03 (Einnahmen-Überschuss-Rechnung) */
  SKR03 = 'SKR03',

  /** Standardkontenrahmen 04 (Bilanz) */
  SKR04 = 'SKR04',

  /** Standardkontenrahmen 49 (Vereine) */
  SKR49 = 'SKR49',

  /** Standardkontenrahmen 51 (Ärzte) */
  SKR51 = 'SKR51',

  /** Standardkontenrahmen 14 (Land- und Forstwirtschaft) */
  SKR14 = 'SKR14',
}

/**
 * DATEV Sync Result
 * Ergebnis einer Synchronisation
 */
export interface DATEVSyncResult {
  /** Erfolgreich verarbeitete Datensätze */
  success_count: number;

  /** Fehlgeschlagene Datensätze */
  error_count: number;

  /** Fehlermeldungen */
  errors: DATEVError[];

  /** Zeitstempel der Synchronisation */
  synced_at: Date;

  /** Exportierte Datei (Base64 oder Pfad) */
  export_file?: string;

  /** Importierte Datensätze */
  imported_records?: number;
}

/**
 * DATEV Error
 * Fehlerinformation
 */
export interface DATEVError {
  /** Fehlercode */
  code: string;

  /** Fehlermeldung */
  message: string;

  /** Datensatz, der den Fehler verursacht hat */
  record?: Partial<DATEVBookingRecord>;

  /** Zeile in der Datei */
  line?: number;
}

/**
 * DATEV API Error Response
 */
export interface DATEVErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

/**
 * DATEV Export Request
 * Parameter für Datenexport
 */
export interface DATEVExportRequest {
  /** Format (ASCII, CSV, XML) */
  format: DATEVExportFormat;

  /** Start-Datum (Format: YYYY-MM-DD) */
  start_date: string;

  /** End-Datum (Format: YYYY-MM-DD) */
  end_date: string;

  /** Kontenrahmen */
  chart_of_accounts: DATEVChartOfAccounts;

  /** Beraternummer */
  consultant_number: string;

  /** Mandantennummer */
  client_number: string;

  /** Wirtschaftsjahresbeginn (Format: DDMM) */
  fiscal_year_start: string;

  /** Sachkontenlänge */
  account_length: 4 | 8;

  /** Datum von (Format: DDMMYYYY) */
  date_from: string;

  /** Datum bis (Format: DDMMYYYY) */
  date_to: string;

  /** Bezeichnung Abgabe */
  submission_name?: string;

  /** Diktatkürzel */
  dictation_code?: string;
}

/**
 * DATEV Import Result
 * Ergebnis eines Datenimports
 */
export interface DATEVImportResult {
  /** Anzahl importierter Konten */
  accounts_imported: number;

  /** Anzahl importierter Buchungen */
  bookings_imported: number;

  /** Fehler beim Import */
  errors: DATEVError[];

  /** Importzeitstempel */
  imported_at: Date;
}

/**
 * DATEV ASCII Header
 * Kopfzeile für DATEV ASCII-Dateien
 */
export interface DATEVASCIIHeader {
  /** DATEV-Format-KZ (z.B. 'EXTF') */
  format_version: string;

  /** Versionsnummer (z.B. '700') */
  version: string;

  /** Datenkategorie (21 = Buchungsstapel) */
  data_category: number;

  /** Formatname (z.B. 'Buchungsstapel') */
  format_name: string;

  /** Formatversion */
  format_version_number: number;

  /** Erzeugt am (Format: YYYYMMDD) */
  created_date: string;

  /** Importiert */
  imported?: string;

  /** Herkunft */
  origin: string;

  /** Exportiert von */
  exported_by: string;

  /** Importiert von */
  imported_by?: string;

  /** Beraternummer */
  consultant_number: string;

  /** Mandantennummer */
  client_number: string;

  /** Wirtschaftsjahresbeginn */
  fiscal_year_start: string;

  /** Sachkontenlänge */
  account_length: 4 | 8;

  /** Datum von */
  date_from: string;

  /** Datum bis */
  date_to: string;

  /** Bezeichnung */
  description: string;

  /** Diktatkürzel */
  dictation_code: string;

  /** Buchungstyp (1 = Finanzbuchführung, 2 = Jahresabschluss) */
  booking_type: 1 | 2;

  /** Rechnungslegungszweck */
  accounting_purpose: number;

  /** Festschreibung (0 = nicht festgeschrieben, 1 = festgeschrieben) */
  locked: 0 | 1;

  /** WKZ */
  currency: string;

  /** Reserviert */
  reserved?: string;

  /** Bezeichnung Abgabe */
  submission_name?: string;
}
