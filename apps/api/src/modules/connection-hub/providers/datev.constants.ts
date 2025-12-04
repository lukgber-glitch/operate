/**
 * DATEV Integration Constants
 * Constants for DATEV API integration, chart of accounts, and field mappings
 */

import { DATEVChartOfAccounts } from './datev.types';

/**
 * DATEV API Endpoints
 */
export const DATEV_API = {
  BASE_URL: 'https://api.datev.de',
  AUTH_URL: 'https://login.datev.de/openidconnect/authorize',
  TOKEN_URL: 'https://login.datev.de/openidconnect/token',
  USERINFO_URL: 'https://api.datev.de/userinfo',

  // API Endpoints
  ENDPOINTS: {
    BOOKINGS: '/accounting/v1/bookings',
    ACCOUNTS: '/accounting/v1/accounts',
    DOCUMENTS: '/documents/v1/files',
    MASTER_DATA: '/platform/v1/clients',
  },
} as const;

/**
 * DATEV OAuth Scopes
 */
export const DATEV_SCOPES = [
  'openid',
  'profile',
  'email',
  'accounting:bookings',
  'accounting:accounts',
  'documents:read',
  'documents:write',
] as const;

/**
 * DATEV ASCII Format Version
 */
export const DATEV_ASCII_FORMAT = {
  FORMAT_VERSION: 'EXTF',
  VERSION: '700',
  DATA_CATEGORY_BOOKINGS: 21,
  DATA_CATEGORY_ACCOUNTS: 20,
  FORMAT_NAME_BOOKINGS: 'Buchungsstapel',
  FORMAT_NAME_ACCOUNTS: 'Kontenbeschriftungen',
  FORMAT_VERSION_NUMBER: 9,
  ENCODING: 'windows-1252',
} as const;

/**
 * Standardkontenrahmen SKR03 (Einnahmen-Überschuss-Rechnung)
 * Häufig verwendete Konten für Kleinunternehmen und EÜR
 */
export const SKR03_ACCOUNTS = {
  // Aktiva
  BANK_ACCOUNTS: {
    BANK: '1200', // Bank
    GIRO: '1210', // Girokonto
    CASH: '1000', // Kasse
    PAYPAL: '1201', // PayPal
  },

  // Debitoren (Kunden)
  DEBTORS: {
    RECEIVABLES: '1400', // Forderungen aus Lieferungen und Leistungen
    RECEIVABLES_19: '8400', // Erlöse 19% USt
    RECEIVABLES_7: '8300', // Erlöse 7% USt
  },

  // Kreditoren (Lieferanten)
  CREDITORS: {
    PAYABLES: '1600', // Verbindlichkeiten aus Lieferungen und Leistungen
  },

  // Erlöse
  REVENUE: {
    SERVICES_19: '8400', // Erlöse 19% USt
    SERVICES_7: '8300', // Erlöse 7% USt
    SERVICES_0: '8100', // Steuerfreie Umsätze
    INNEREU: '8338', // Innergemeinschaftliche Lieferungen
    EXPORT: '8125', // Ausfuhrlieferungen
  },

  // Aufwendungen
  EXPENSES: {
    MATERIALS_19: '4400', // Waren 19% Vorsteuer
    MATERIALS_7: '4300', // Waren 7% Vorsteuer
    RENT: '4210', // Miete
    ELECTRICITY: '4240', // Strom
    PHONE: '4910', // Telefon/Internet
    OFFICE: '4980', // Büromaterial
    VEHICLE: '4520', // KFZ-Kosten
    INSURANCE: '4360', // Versicherungen
    WAGES: '4120', // Löhne und Gehälter
    SOCIAL: '4130', // Sozialversicherung
    TRAVEL: '4660', // Reisekosten
    ADVERTISING: '4630', // Werbekosten
    BANK_CHARGES: '4910', // Bankgebühren
    ACCOUNTING: '4945', // Buchführungskosten
    TAX_CONSULTING: '4946', // Steuerberatungskosten
  },

  // Steuern
  TAXES: {
    VAT_19: '1776', // Umsatzsteuer 19%
    VAT_7: '1771', // Umsatzsteuer 7%
    INPUT_TAX_19: '1576', // Vorsteuer 19%
    INPUT_TAX_7: '1571', // Vorsteuer 7%
    VAT_PAYABLE: '1780', // Umsatzsteuer-Zahllast
  },

  // Eigenkapital
  EQUITY: {
    PRIVATE: '1800', // Eigenkapital
    PRIVATE_WITHDRAWALS: '1890', // Privatentnahmen
    PRIVATE_DEPOSITS: '1880', // Privateinlagen
  },
} as const;

/**
 * Standardkontenrahmen SKR04 (Bilanz)
 * Häufig verwendete Konten für Bilanzierung
 */
export const SKR04_ACCOUNTS = {
  // Aktiva
  BANK_ACCOUNTS: {
    BANK: '1800', // Bank
    GIRO: '1810', // Girokonto
    CASH: '1600', // Kasse
    PAYPAL: '1801', // PayPal
  },

  // Debitoren (Kunden)
  DEBTORS: {
    RECEIVABLES: '1200', // Forderungen aus Lieferungen und Leistungen
    RECEIVABLES_19: '4400', // Erlöse 19% USt
    RECEIVABLES_7: '4300', // Erlöse 7% USt
  },

  // Kreditoren (Lieferanten)
  CREDITORS: {
    PAYABLES: '3300', // Verbindlichkeiten aus Lieferungen und Leistungen
  },

  // Erlöse
  REVENUE: {
    SERVICES_19: '4400', // Erlöse 19% USt
    SERVICES_7: '4300', // Erlöse 7% USt
    SERVICES_0: '4120', // Steuerfreie Umsätze
    INNEREU: '4338', // Innergemeinschaftliche Lieferungen
    EXPORT: '4125', // Ausfuhrlieferungen
  },

  // Aufwendungen
  EXPENSES: {
    MATERIALS_19: '5400', // Waren 19% Vorsteuer
    MATERIALS_7: '5300', // Waren 7% Vorsteuer
    RENT: '6210', // Miete
    ELECTRICITY: '6240', // Strom
    PHONE: '6910', // Telefon/Internet
    OFFICE: '6980', // Büromaterial
    VEHICLE: '6520', // KFZ-Kosten
    INSURANCE: '6360', // Versicherungen
    WAGES: '6120', // Löhne und Gehälter
    SOCIAL: '6130', // Sozialversicherung
    TRAVEL: '6660', // Reisekosten
    ADVERTISING: '6630', // Werbekosten
    BANK_CHARGES: '6910', // Bankgebühren
    ACCOUNTING: '6945', // Buchführungskosten
    TAX_CONSULTING: '6946', // Steuerberatungskosten
  },

  // Steuern
  TAXES: {
    VAT_19: '1776', // Umsatzsteuer 19%
    VAT_7: '1771', // Umsatzsteuer 7%
    INPUT_TAX_19: '1406', // Vorsteuer 19%
    INPUT_TAX_7: '1401', // Vorsteuer 7%
    VAT_PAYABLE: '1780', // Umsatzsteuer-Zahllast
  },

  // Eigenkapital
  EQUITY: {
    PRIVATE: '2100', // Eigenkapital
    PRIVATE_WITHDRAWALS: '2170', // Privatentnahmen
    PRIVATE_DEPOSITS: '2160', // Privateinlagen
  },
} as const;

/**
 * DATEV BU-Schlüssel (Steuerschlüssel)
 * Mapping für Umsatzsteuer/Vorsteuer
 */
export const DATEV_TAX_KEYS = {
  // Umsatzsteuer
  VAT_19: '3', // Umsatzsteuer 19%
  VAT_7: '2', // Umsatzsteuer 7%
  VAT_0: '0', // Steuerfrei
  VAT_REVERSE_CHARGE: '9', // Reverse Charge (§13b UStG)

  // Vorsteuer
  INPUT_TAX_19: '8', // Vorsteuer 19%
  INPUT_TAX_7: '7', // Vorsteuer 7%

  // Innergemeinschaftlich
  INNEREU_DELIVERY: '41', // Innergemeinschaftliche Lieferung
  INNEREU_ACQUISITION: '93', // Innergemeinschaftlicher Erwerb 19%

  // Export
  EXPORT: '48', // Ausfuhrlieferung

  // Sonstige
  SMALL_BUSINESS: '0', // Kleinunternehmer (§19 UStG)
} as const;

/**
 * DATEV Feldlängen (Field Lengths)
 * Maximale Längen für DATEV ASCII Felder
 */
export const DATEV_FIELD_LENGTHS = {
  AMOUNT: 13, // Betrag (Format: 0,00-999999999,99)
  ACCOUNT: 8, // Kontonummer (4 oder 8 stellig)
  DOCUMENT_NUMBER: 36, // Belegnummer
  BOOKING_TEXT: 60, // Buchungstext
  CURRENCY: 3, // Währung (ISO 4217)
  TAX_KEY: 2, // BU-Schlüssel
  DATE: 4, // Datum (DDMM)
  CONSULTANT_NUMBER: 7, // Beraternummer
  CLIENT_NUMBER: 5, // Mandantennummer
  COST_CENTER: 8, // Kostenstelle
} as const;

/**
 * DATEV Datumsformate
 */
export const DATEV_DATE_FORMATS = {
  DOCUMENT_DATE: 'DDMM', // Belegdatum (Tag + Monat)
  DOCUMENT_DATE_YEAR: 'DDMMYY', // Belegdatum mit Jahr (2-stellig)
  FULL_DATE: 'DDMMYYYY', // Vollständiges Datum
  HEADER_DATE: 'YYYYMMDD', // Kopfzeilen-Datum
  ISO_DATE: 'YYYY-MM-DD', // ISO Format für API
} as const;

/**
 * DATEV Buchungstypen
 */
export const DATEV_BOOKING_TYPES = {
  FINANCIAL_ACCOUNTING: 1, // Finanzbuchführung
  ANNUAL_STATEMENT: 2, // Jahresabschluss
} as const;

/**
 * DATEV Fehler-Codes
 */
export const DATEV_ERROR_CODES = {
  INVALID_CREDENTIALS: 'DATEV_001',
  INVALID_ACCOUNT: 'DATEV_002',
  INVALID_AMOUNT: 'DATEV_003',
  INVALID_DATE: 'DATEV_004',
  INVALID_TAX_KEY: 'DATEV_005',
  EXPORT_FAILED: 'DATEV_006',
  IMPORT_FAILED: 'DATEV_007',
  API_ERROR: 'DATEV_008',
  AUTH_FAILED: 'DATEV_009',
  MISSING_CONSULTANT_NUMBER: 'DATEV_010',
  MISSING_CLIENT_NUMBER: 'DATEV_011',
} as const;

/**
 * DATEV Kontenrahmen Mapping
 */
export const DATEV_CHART_OF_ACCOUNTS_MAP = {
  [DATEVChartOfAccounts.SKR03]: SKR03_ACCOUNTS,
  [DATEVChartOfAccounts.SKR04]: SKR04_ACCOUNTS,
} as const;

/**
 * DATEV ASCII Feldtrennzeichen
 */
export const DATEV_DELIMITERS = {
  FIELD: ';', // Feldtrennzeichen
  TEXT: '"', // Textbegrenzer
  DECIMAL: ',', // Dezimaltrennzeichen
  THOUSAND: '.', // Tausendertrennzeichen (nicht verwendet in Ausgabe)
  LINE: '\r\n', // Zeilenumbruch
} as const;

/**
 * DATEV Standardwerte
 */
export const DATEV_DEFAULTS = {
  CURRENCY: 'EUR',
  EXCHANGE_RATE: '1,0000',
  FISCAL_YEAR_START: '0101', // 1. Januar
  ACCOUNT_LENGTH: 4 as const,
  ENCODING: 'windows-1252',
  ORIGIN: 'Operate/CoachOS',
  BOOKING_TYPE: DATEV_BOOKING_TYPES.FINANCIAL_ACCOUNTING,
  LOCKED: 0 as const, // Nicht festgeschrieben
  ACCOUNTING_PURPOSE: 0, // Standard
} as const;
