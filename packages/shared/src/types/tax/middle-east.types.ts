/**
 * Middle East Tax Type Definitions (UAE & Saudi Arabia)
 * Task: W28-T4 - Middle East tax rules (VAT 5%/15%)
 */

/**
 * UAE Emirates
 */
export enum UAEEmirate {
  AUH = 'AUH', // Abu Dhabi
  DXB = 'DXB', // Dubai
  SHJ = 'SHJ', // Sharjah
  AJM = 'AJM', // Ajman
  UAQ = 'UAQ', // Umm Al Quwain
  RAK = 'RAK', // Ras Al Khaimah
  FUJ = 'FUJ', // Fujairah
}

/**
 * Saudi Arabia Administrative Regions
 */
export enum SaudiRegion {
  RIYADH = 'RIYADH', // Riyadh Region
  MAKKAH = 'MAKKAH', // Makkah Region
  MADINAH = 'MADINAH', // Madinah Region
  EASTERN = 'EASTERN', // Eastern Province
  ASIR = 'ASIR', // Asir Region
  TABUK = 'TABUK', // Tabuk Region
  HAIL = 'HAIL', // Hail Region
  NORTHERN_BORDERS = 'NORTHERN_BORDERS', // Northern Borders Region
  JAZAN = 'JAZAN', // Jazan Region
  NAJRAN = 'NAJRAN', // Najran Region
  AL_BAHA = 'AL_BAHA', // Al-Baha Region
  AL_JAWF = 'AL_JAWF', // Al-Jawf Region
  QASSIM = 'QASSIM', // Qassim Region
}

/**
 * UAE VAT Rates
 */
export enum UAEVATRate {
  STANDARD = 5, // Standard rate
  ZERO = 0, // Zero-rated (exports, healthcare, education, first sale residential)
  EXEMPT = -1, // Exempt (financial services, local transport, bare land)
}

/**
 * Saudi Arabia VAT Rates
 */
export enum SaudiVATRate {
  STANDARD = 15, // Standard rate
  ZERO = 0, // Zero-rated (exports, international transport)
  EXEMPT = -1, // Exempt (financial services, life insurance, residential real estate)
}

/**
 * UAE VAT Categories
 */
export enum UAEVATCategory {
  STANDARD = 'STANDARD', // 5% VAT
  ZERO_RATED = 'ZERO_RATED', // 0% - can claim input VAT
  EXEMPT = 'EXEMPT', // Exempt - cannot claim input VAT
  OUT_OF_SCOPE = 'OUT_OF_SCOPE', // Out of scope
}

/**
 * Saudi Arabia VAT Categories
 */
export enum SaudiVATCategory {
  STANDARD = 'STANDARD', // 15% VAT
  ZERO_RATED = 'ZERO_RATED', // 0% - can claim input VAT
  EXEMPT = 'EXEMPT', // Exempt - cannot claim input VAT
  OUT_OF_SCOPE = 'OUT_OF_SCOPE', // Out of scope
}

/**
 * Tax Registration Number (TRN) format
 */
export interface TRNFormat {
  trn: string; // 15-digit TRN
  formatted: string; // Formatted display
  valid: boolean;
  country: 'UAE' | 'SA';
  checkDigit?: string;
}

/**
 * UAE Tax Registration Number
 * Format: 100-XXXX-XXXX-XXX-XXX (15 digits)
 */
export interface UAETRN extends TRNFormat {
  country: 'UAE';
  // UAE TRN specific validations
}

/**
 * Saudi Arabia Tax Registration Number
 * Format: 3XXXXXXXXXXXXXX (15 digits starting with 3)
 * Uses Luhn algorithm for check digit
 */
export interface SaudiTRN extends TRNFormat {
  country: 'SA';
  // Saudi TRN specific validations
}

/**
 * UAE Free Zone types
 */
export enum UAEFreeZoneType {
  FREE_ZONE = 'FREE_ZONE', // Standard free zone
  DESIGNATED_ZONE = 'DESIGNATED_ZONE', // Designated zone for VAT
  SPECIAL_DEVELOPMENT_ZONE = 'SPECIAL_DEVELOPMENT_ZONE', // Special development zone
}

/**
 * Saudi Arabia Special Zone types
 */
export enum SaudiSpecialZoneType {
  ECONOMIC_CITY = 'ECONOMIC_CITY', // Economic city
  INDUSTRIAL_ZONE = 'INDUSTRIAL_ZONE', // Industrial zone
  SPECIAL_ZONE = 'SPECIAL_ZONE', // Special economic zone
}

/**
 * Middle East Tax Configuration
 */
export interface MiddleEastTaxConfig {
  countryId: string;
  // UAE specific
  emirate?: UAEEmirate;
  isFreeZone?: boolean;
  freeZoneName?: string;
  isDesignatedZone?: boolean;
  // Saudi Arabia specific
  region?: SaudiRegion;
  isSpecialZone?: boolean;
  specialZoneName?: string;
  // Common settings
  vatReturnPeriod: 'MONTHLY' | 'QUARTERLY';
  fiscalYearType: 'GREGORIAN' | 'HIJRI';
  fiscalYearStartMonth: number; // 1-12
  fiscalYearStartDay: number; // 1-31
  // E-invoicing
  eInvoicingEnabled: boolean;
  eInvoicingMandateDate?: Date;
  eInvoicingFormat?: string;
  // Compliance
  requiresAudit: boolean;
  auditThreshold?: number;
  requiresExciseTax: boolean;
  notes?: string;
}

/**
 * UAE IBAN structure
 * Format: AE + 2-digit check + 3-digit bank code + 16-digit account number (23 chars total)
 * Example: AE070331234567890123456
 */
export interface UAEIBAN {
  iban: string;
  formatted: string; // Display format with spaces
  valid: boolean;
  countryCode: 'AE';
  checkDigits: string;
  bankCode: string;
  accountNumber: string;
}

/**
 * Saudi Arabia IBAN structure
 * Format: SA + 2-digit check + 2-digit bank code + 18-digit account number (24 chars total)
 * Example: SA0380000000608010167519
 */
export interface SaudiIBAN {
  iban: string;
  formatted: string;
  valid: boolean;
  countryCode: 'SA';
  checkDigits: string;
  bankCode: string;
  accountNumber: string;
}

/**
 * UAE Trade License structure
 */
export interface UAETradeLicense {
  licenseNumber: string;
  emirate: UAEEmirate;
  issueDate: Date;
  expiryDate: Date;
  authority: string; // DED, ADDED, etc.
  activityType: string;
  valid: boolean;
}

/**
 * Saudi Commercial Registration (CR) structure
 */
export interface SaudiCommercialRegistration {
  crNumber: string; // 10 digits
  formatted: string;
  valid: boolean;
  region: SaudiRegion;
  issueDate: Date;
  expiryDate: Date;
  legalForm: string;
}

/**
 * Tax calculation result for Middle East
 */
export interface MiddleEastTaxCalculation {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  country: 'UAE' | 'SA';
  category: UAEVATCategory | SaudiVATCategory;
  rate: number;
  description: string;
}

/**
 * UAE VAT exempt supplies
 */
export const UAE_VAT_EXEMPT_SUPPLIES = [
  'Financial services (lending, credit, insurance)',
  'Residential property (leasing > 6 months)',
  'Local passenger transport',
  'Bare land',
  'Life insurance',
] as const;

/**
 * UAE VAT zero-rated supplies
 */
export const UAE_VAT_ZERO_RATED_SUPPLIES = [
  'Exports of goods outside GCC',
  'International transportation of goods and passengers',
  'Supply of international transportation services',
  'Supply of means of transport (ships, aircraft)',
  'Healthcare and medical services',
  'Education services',
  'First supply of residential buildings (within 3 years)',
  'Precious investment metals (gold, silver, platinum >99% purity)',
] as const;

/**
 * Saudi Arabia VAT exempt supplies
 */
export const SAUDI_VAT_EXEMPT_SUPPLIES = [
  'Financial services (credit, lending)',
  'Life insurance and reinsurance',
  'Sale or lease of residential real estate',
  'Bare land (not designated for construction)',
] as const;

/**
 * Saudi Arabia VAT zero-rated supplies
 */
export const SAUDI_VAT_ZERO_RATED_SUPPLIES = [
  'Exports of goods outside GCC',
  'International transportation services',
  'Supply of transportation services for goods export',
  'Qualifying means of transport (ships, aircraft)',
  'Supply of medicines and medical equipment',
  'Precious investment metals (gold, silver, platinum >99% purity)',
] as const;

/**
 * UAE major free zones
 */
export const UAE_MAJOR_FREE_ZONES = [
  { code: 'DIFC', name: 'Dubai International Financial Centre', emirate: UAEEmirate.DXB },
  { code: 'JAFZA', name: 'Jebel Ali Free Zone', emirate: UAEEmirate.DXB },
  { code: 'DMCC', name: 'Dubai Multi Commodities Centre', emirate: UAEEmirate.DXB },
  { code: 'DAFZA', name: 'Dubai Airport Free Zone', emirate: UAEEmirate.DXB },
  { code: 'RAKFTZ', name: 'Ras Al Khaimah Free Trade Zone', emirate: UAEEmirate.RAK },
  { code: 'ADGM', name: 'Abu Dhabi Global Market', emirate: UAEEmirate.AUH },
  { code: 'SHAMS', name: 'Sharjah Airport International Free Zone', emirate: UAEEmirate.SHJ },
  { code: 'SAIF', name: 'Sharjah Airport International Free Zone', emirate: UAEEmirate.SHJ },
  { code: 'HAMRIYAH', name: 'Hamriyah Free Zone', emirate: UAEEmirate.SHJ },
  { code: 'AJMAN_FZ', name: 'Ajman Free Zone', emirate: UAEEmirate.AJM },
  { code: 'FUJAIRAH_FZ', name: 'Fujairah Free Zone', emirate: UAEEmirate.FUJ },
] as const;

/**
 * Saudi Arabia banks for IBAN validation
 */
export const SAUDI_BANKS = [
  { code: '03', name: 'Al Rajhi Bank' },
  { code: '05', name: 'Alinma Bank' },
  { code: '10', name: 'National Commercial Bank (NCB)' },
  { code: '15', name: 'Bank AlJazira' },
  { code: '20', name: 'Riyad Bank' },
  { code: '40', name: 'SAMBA Financial Group' },
  { code: '45', name: 'Saudi British Bank (SABB)' },
  { code: '55', name: 'Banque Saudi Fransi' },
  { code: '60', name: 'Arab National Bank' },
  { code: '65', name: 'Saudi Investment Bank' },
  { code: '71', name: 'Al Bilad Bank' },
  { code: '76', name: 'Bank AlBilad' },
  { code: '80', name: 'Saudi Hollandi Bank' },
] as const;

/**
 * UAE banks for IBAN validation
 */
export const UAE_BANKS = [
  { code: '033', name: 'Emirates NBD' },
  { code: '023', name: 'National Bank of Abu Dhabi' },
  { code: '044', name: 'Dubai Islamic Bank' },
  { code: '004', name: 'First Abu Dhabi Bank' },
  { code: '021', name: 'Abu Dhabi Commercial Bank' },
  { code: '046', name: 'Abu Dhabi Islamic Bank' },
  { code: '030', name: 'Mashreq Bank' },
  { code: '026', name: 'Emirates Islamic Bank' },
  { code: '002', name: 'Commercial Bank of Dubai' },
  { code: '065', name: 'National Bank of Fujairah' },
  { code: '061', name: 'National Bank of Ras Al Khaimah' },
  { code: '057', name: 'National Bank of Umm Al Qaiwain' },
] as const;

/**
 * Emirate information
 */
export interface EmirateInfo {
  code: UAEEmirate;
  name: string;
  nameArabic: string;
  capital: string;
  hasFreeZones: boolean;
}

/**
 * Saudi region information
 */
export interface SaudiRegionInfo {
  code: SaudiRegion;
  name: string;
  nameArabic: string;
  capital: string;
}

/**
 * Emirate details
 */
export const EMIRATE_INFO: Record<UAEEmirate, EmirateInfo> = {
  [UAEEmirate.AUH]: {
    code: UAEEmirate.AUH,
    name: 'Abu Dhabi',
    nameArabic: 'أبو ظبي',
    capital: 'Abu Dhabi',
    hasFreeZones: true,
  },
  [UAEEmirate.DXB]: {
    code: UAEEmirate.DXB,
    name: 'Dubai',
    nameArabic: 'دبي',
    capital: 'Dubai',
    hasFreeZones: true,
  },
  [UAEEmirate.SHJ]: {
    code: UAEEmirate.SHJ,
    name: 'Sharjah',
    nameArabic: 'الشارقة',
    capital: 'Sharjah',
    hasFreeZones: true,
  },
  [UAEEmirate.AJM]: {
    code: UAEEmirate.AJM,
    name: 'Ajman',
    nameArabic: 'عجمان',
    capital: 'Ajman',
    hasFreeZones: true,
  },
  [UAEEmirate.UAQ]: {
    code: UAEEmirate.UAQ,
    name: 'Umm Al Quwain',
    nameArabic: 'أم القيوين',
    capital: 'Umm Al Quwain',
    hasFreeZones: false,
  },
  [UAEEmirate.RAK]: {
    code: UAEEmirate.RAK,
    name: 'Ras Al Khaimah',
    nameArabic: 'رأس الخيمة',
    capital: 'Ras Al Khaimah',
    hasFreeZones: true,
  },
  [UAEEmirate.FUJ]: {
    code: UAEEmirate.FUJ,
    name: 'Fujairah',
    nameArabic: 'الفجيرة',
    capital: 'Fujairah',
    hasFreeZones: true,
  },
};

/**
 * Saudi region details
 */
export const SAUDI_REGION_INFO: Record<SaudiRegion, SaudiRegionInfo> = {
  [SaudiRegion.RIYADH]: {
    code: SaudiRegion.RIYADH,
    name: 'Riyadh Region',
    nameArabic: 'منطقة الرياض',
    capital: 'Riyadh',
  },
  [SaudiRegion.MAKKAH]: {
    code: SaudiRegion.MAKKAH,
    name: 'Makkah Region',
    nameArabic: 'منطقة مكة المكرمة',
    capital: 'Makkah',
  },
  [SaudiRegion.MADINAH]: {
    code: SaudiRegion.MADINAH,
    name: 'Madinah Region',
    nameArabic: 'منطقة المدينة المنورة',
    capital: 'Madinah',
  },
  [SaudiRegion.EASTERN]: {
    code: SaudiRegion.EASTERN,
    name: 'Eastern Province',
    nameArabic: 'المنطقة الشرقية',
    capital: 'Dammam',
  },
  [SaudiRegion.ASIR]: {
    code: SaudiRegion.ASIR,
    name: 'Asir Region',
    nameArabic: 'منطقة عسير',
    capital: 'Abha',
  },
  [SaudiRegion.TABUK]: {
    code: SaudiRegion.TABUK,
    name: 'Tabuk Region',
    nameArabic: 'منطقة تبوك',
    capital: 'Tabuk',
  },
  [SaudiRegion.HAIL]: {
    code: SaudiRegion.HAIL,
    name: 'Hail Region',
    nameArabic: 'منطقة حائل',
    capital: 'Hail',
  },
  [SaudiRegion.NORTHERN_BORDERS]: {
    code: SaudiRegion.NORTHERN_BORDERS,
    name: 'Northern Borders Region',
    nameArabic: 'منطقة الحدود الشمالية',
    capital: 'Arar',
  },
  [SaudiRegion.JAZAN]: {
    code: SaudiRegion.JAZAN,
    name: 'Jazan Region',
    nameArabic: 'منطقة جازان',
    capital: 'Jazan',
  },
  [SaudiRegion.NAJRAN]: {
    code: SaudiRegion.NAJRAN,
    name: 'Najran Region',
    nameArabic: 'منطقة نجران',
    capital: 'Najran',
  },
  [SaudiRegion.AL_BAHA]: {
    code: SaudiRegion.AL_BAHA,
    name: 'Al-Baha Region',
    nameArabic: 'منطقة الباحة',
    capital: 'Al-Baha',
  },
  [SaudiRegion.AL_JAWF]: {
    code: SaudiRegion.AL_JAWF,
    name: 'Al-Jawf Region',
    nameArabic: 'منطقة الجوف',
    capital: 'Sakaka',
  },
  [SaudiRegion.QASSIM]: {
    code: SaudiRegion.QASSIM,
    name: 'Qassim Region',
    nameArabic: 'منطقة القصيم',
    capital: 'Buraidah',
  },
};

/**
 * VAT filing period types
 */
export type VATFilingPeriod = 'MONTHLY' | 'QUARTERLY';

/**
 * Fiscal year types
 */
export type FiscalYearType = 'GREGORIAN' | 'HIJRI';

/**
 * VAT return deadline configuration
 */
export interface VATReturnDeadline {
  period: VATFilingPeriod;
  deadlineDays: number; // Days after period end
  description: string;
}

/**
 * UAE VAT return deadlines
 */
export const UAE_VAT_RETURN_DEADLINES: VATReturnDeadline[] = [
  {
    period: 'MONTHLY',
    deadlineDays: 28,
    description: 'VAT return due 28 days after the end of the tax period',
  },
  {
    period: 'QUARTERLY',
    deadlineDays: 28,
    description: 'VAT return due 28 days after the end of the tax period',
  },
];

/**
 * Saudi Arabia VAT return deadlines
 */
export const SAUDI_VAT_RETURN_DEADLINES: VATReturnDeadline[] = [
  {
    period: 'MONTHLY',
    deadlineDays: 30,
    description: 'VAT return due by the end of the month following the tax period',
  },
  {
    period: 'QUARTERLY',
    deadlineDays: 30,
    description: 'VAT return due by the end of the month following the tax period',
  },
];

/**
 * GCC Member States for zero-rated exports
 */
export const GCC_MEMBER_STATES = [
  { code: 'SA', name: 'Saudi Arabia', nameArabic: 'المملكة العربية السعودية' },
  { code: 'AE', name: 'United Arab Emirates', nameArabic: 'الإمارات العربية المتحدة' },
  { code: 'BH', name: 'Bahrain', nameArabic: 'البحرين' },
  { code: 'KW', name: 'Kuwait', nameArabic: 'الكويت' },
  { code: 'OM', name: 'Oman', nameArabic: 'عُمان' },
  { code: 'QA', name: 'Qatar', nameArabic: 'قطر' },
] as const;

/**
 * E-invoicing mandate dates
 */
export const EINVOICING_MANDATES = {
  UAE: {
    phase1: new Date('2026-01-01'), // Planned - not yet confirmed
    description: 'E-invoicing expected to be mandated for B2B and B2G transactions',
  },
  SAUDI: {
    phase1: new Date('2021-12-04'), // Generation phase (completed)
    phase2: new Date('2023-01-01'), // Integration phase (ongoing)
    description: 'ZATCA e-invoicing mandate in effect',
  },
} as const;
