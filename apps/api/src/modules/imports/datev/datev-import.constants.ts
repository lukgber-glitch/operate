/**
 * DATEV Import Constants
 * Constants and mappings for DATEV ASCII CSV import
 */

import { DatevSKRType } from '../../compliance/exports/datev/dto/datev-export.dto';
import { DatevImportFileType } from './datev-import.types';

/**
 * DATEV Data Category to File Type Mapping
 */
export const DATEV_CATEGORY_FILE_TYPE_MAP: Record<number, DatevImportFileType> =
  {
    21: DatevImportFileType.BUCHUNGSSTAPEL,
    20: DatevImportFileType.KONTENBESCHRIFTUNG,
    16: DatevImportFileType.STAMMDATEN,
  };

/**
 * DATEV File Type to Data Category Mapping (reverse)
 */
export const DATEV_FILE_TYPE_CATEGORY_MAP: Record<DatevImportFileType, number> =
  {
    [DatevImportFileType.BUCHUNGSSTAPEL]: 21,
    [DatevImportFileType.KONTENBESCHRIFTUNG]: 20,
    [DatevImportFileType.STAMMDATEN]: 16,
    [DatevImportFileType.DEBITOREN]: 16,
    [DatevImportFileType.KREDITOREN]: 16,
    [DatevImportFileType.UNKNOWN]: 0,
  };

/**
 * DATEV Buchungsstapel Column Names (for validation)
 */
export const BUCHUNGSSTAPEL_COLUMNS = [
  'Umsatz (ohne Soll/Haben-Kz)',
  'Soll/Haben-Kennzeichen',
  'WKZ Umsatz',
  'Kurs',
  'Basis-Umsatz',
  'WKZ Basis-Umsatz',
  'Konto',
  'Gegenkonto (ohne BU-Schlüssel)',
  'BU-Schlüssel',
  'Belegdatum',
  'Belegfeld 1',
  'Belegfeld 2',
  'Skonto',
  'Buchungstext',
  'Postensperre',
  'Diverse Adressnummer',
  'Geschäftspartner-Bank',
  'Sachverhalt',
  'Zinssperre',
  'Beleglink',
];

/**
 * DATEV Kontenbeschriftung Column Names
 */
export const KONTENBESCHRIFTUNG_COLUMNS = [
  'Konto',
  'Kontenbeschriftung',
  'Sprach-ID',
];

/**
 * DATEV Stammdaten Column Names (Customers/Suppliers)
 */
export const STAMMDATEN_COLUMNS = [
  'Konto',
  'Name',
  'Adresstyp',
  'Kurzbezeichnung',
  'EU-Land',
  'EU-UStID',
  'Anrede',
  'Titel/Akad. Grad',
  'Vorname',
  'Name',
  'Strasse',
  'Postleitzahl',
  'Ort',
  'Land',
  'Telefon',
  'E-Mail',
];

/**
 * SKR03 to Internal Account Code Reverse Mapping
 * Maps SKR03 account numbers to internal Operate account codes
 */
export const SKR03_REVERSE_MAPPING: Record<string, string> = {
  // Assets - Cash & Bank
  '1000': 'CASH',
  '1200': 'BANK',
  '1240': 'BANK_EUR',

  // Assets - Receivables
  '1400': 'RECEIVABLES',
  '1406': 'RECEIVABLES_EU',

  // Assets - Inventory
  '1580': 'INVENTORY',

  // Assets - Tax
  '1570': 'INPUT_VAT',

  // Liabilities - Payables
  '1600': 'PAYABLES',
  '1610': 'PAYABLES_EU',

  // Liabilities - Tax
  '1780': 'VAT_PAYABLE',
  '1781': 'VAT_PAYABLE_19',
  '1776': 'VAT_PAYABLE_7',

  // Equity
  '2800': 'CAPITAL',
  '2850': 'RETAINED_EARNINGS',

  // Expenses - Personnel
  '4120': 'SALARIES',
  '4130': 'SOCIAL_SECURITY',

  // Expenses - Office
  '4210': 'RENT',
  '4240': 'ELECTRICITY',
  '4300': 'TELECOMMUNICATIONS',
  '4280': 'OFFICE_SUPPLIES',

  // Expenses - Cost of Goods
  '4400': 'COGS',

  // Expenses - Vehicle
  '4500': 'VEHICLE_COSTS',
  '4530': 'FUEL',

  // Expenses - Marketing
  '4600': 'ADVERTISING',

  // Expenses - Other
  '4700': 'INSURANCE',
  '4710': 'LEGAL_CONSULTING',
  '4760': 'DEPRECIATION',
  '4780': 'INTEREST_EXPENSE',

  // Revenue - Sales
  '8000': 'REVENUE',
  '8100': 'REVENUE_19',
  '8300': 'REVENUE_7',
  '8400': 'REVENUE_TAX_FREE',
  '8338': 'REVENUE_EU',
  '8125': 'REVENUE_EXPORT',

  // Revenue - Services
  '8500': 'SERVICE_REVENUE_19',
  '8600': 'SERVICE_REVENUE_7',
};

/**
 * SKR04 to Internal Account Code Reverse Mapping
 * Maps SKR04 account numbers to internal Operate account codes
 */
export const SKR04_REVERSE_MAPPING: Record<string, string> = {
  // Assets - Cash & Bank
  '1600': 'CASH',
  '1800': 'BANK',
  '1840': 'BANK_EUR',

  // Assets - Receivables
  '1200': 'RECEIVABLES',
  '1205': 'RECEIVABLES_EU',

  // Assets - Inventory
  '3300': 'INVENTORY',

  // Assets - Tax
  '1570': 'INPUT_VAT',

  // Liabilities - Payables
  '3300': 'PAYABLES',
  '3310': 'PAYABLES_EU',

  // Liabilities - Tax
  '1770': 'VAT_PAYABLE',
  '1771': 'VAT_PAYABLE_19',
  '1776': 'VAT_PAYABLE_7',

  // Equity
  '0800': 'CAPITAL',
  '0850': 'RETAINED_EARNINGS',

  // Expenses - Personnel
  '6000': 'SALARIES',
  '6100': 'SOCIAL_SECURITY',

  // Expenses - Office
  '6210': 'RENT',
  '6240': 'ELECTRICITY',
  '6300': 'TELECOMMUNICATIONS',
  '6280': 'OFFICE_SUPPLIES',

  // Expenses - Cost of Goods
  '5400': 'COGS',

  // Expenses - Vehicle
  '6500': 'VEHICLE_COSTS',
  '6530': 'FUEL',

  // Expenses - Marketing
  '6600': 'ADVERTISING',

  // Expenses - Other
  '6700': 'INSURANCE',
  '6710': 'LEGAL_CONSULTING',
  '6760': 'DEPRECIATION',
  '6780': 'INTEREST_EXPENSE',

  // Revenue - Sales
  '4000': 'REVENUE',
  '4100': 'REVENUE_19',
  '4300': 'REVENUE_7',
  '4400': 'REVENUE_TAX_FREE',
  '4338': 'REVENUE_EU',
  '4120': 'REVENUE_EXPORT',

  // Revenue - Services
  '4500': 'SERVICE_REVENUE_19',
  '4600': 'SERVICE_REVENUE_7',
};

/**
 * Get reverse mapping for SKR type
 */
export function getReverseMappingForSKR(
  skrType: DatevSKRType,
): Record<string, string> {
  return skrType === DatevSKRType.SKR03
    ? SKR03_REVERSE_MAPPING
    : SKR04_REVERSE_MAPPING;
}

/**
 * DATEV Tax Key to VAT Rate Mapping
 */
export const TAX_KEY_VAT_RATE_MAP: Record<string, number> = {
  '0': 0, // Tax-free
  '1': 19, // 19% standard rate (domestic)
  '2': 7, // 7% reduced rate
  '3': 19, // 19% output tax
  '4': 0, // Tax-free domestic
  '5': 16, // 16% (reduced rate 2020-2021)
  '6': 5, // 5% reduced rate
  '7': 19, // 19% acquisition tax
  '8': 0, // Tax-free intra-community
  '9': 19, // 19% intra-community
  '10': 7, // 7% intra-community
  '11': 0, // EU reverse charge
  '12': 0, // Export
  '13': 0, // Tax-free third country
  '14': 7, // 7% output tax
};

/**
 * DATEV Date Format Patterns
 */
export const DATEV_DATE_FORMATS = {
  DDMM: /^(\d{2})(\d{2})$/, // Day + Month (e.g., 3112 for Dec 31)
  TTMMJJ: /^(\d{2})(\d{2})(\d{2})$/, // Day + Month + 2-digit Year (e.g., 311224 for Dec 31, 2024)
  YYYYMMDD: /^(\d{4})(\d{2})(\d{2})$/, // Full date (e.g., 20241231)
};

/**
 * DATEV Encoding
 */
export const DATEV_ENCODING = 'win1252'; // CP1252 / Windows-1252

/**
 * DATEV CSV Delimiter
 */
export const DATEV_CSV_DELIMITER = ';';

/**
 * DATEV CSV Text Qualifier
 */
export const DATEV_CSV_TEXT_QUALIFIER = '"';

/**
 * DATEV Decimal Separator
 */
export const DATEV_DECIMAL_SEPARATOR = ',';

/**
 * Default Import Batch Size
 */
export const DEFAULT_IMPORT_BATCH_SIZE = 100;

/**
 * Maximum File Size (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Supported File Extensions
 */
export const SUPPORTED_FILE_EXTENSIONS = ['.csv', '.txt'];

/**
 * DATEV Address Type Mapping
 */
export const ADDRESS_TYPE_MAP: Record<string, string> = {
  '1': 'CUSTOMER',
  '2': 'SUPPLIER',
  '3': 'OTHER',
};

/**
 * DATEV Debit/Credit Indicators
 */
export const DEBIT_CREDIT_INDICATORS = {
  DEBIT: 'S', // Soll
  CREDIT: 'H', // Haben
};

/**
 * DATEV Account Number Validation
 */
export const ACCOUNT_NUMBER_REGEX = /^\d{4,8}$/;

/**
 * DATEV Document Number Max Length
 */
export const DOCUMENT_NUMBER_MAX_LENGTH = 36;

/**
 * DATEV Posting Text Max Length
 */
export const POSTING_TEXT_MAX_LENGTH = 60;
