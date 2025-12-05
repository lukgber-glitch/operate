/**
 * Canadian Tax Type Definitions
 * Task: W26-T4 - Canadian/Australian tax rules
 */

/**
 * Canadian provinces and territories
 */
export enum CanadianProvince {
  AB = 'AB', // Alberta
  BC = 'BC', // British Columbia
  MB = 'MB', // Manitoba
  NB = 'NB', // New Brunswick
  NL = 'NL', // Newfoundland and Labrador
  NS = 'NS', // Nova Scotia
  NT = 'NT', // Northwest Territories
  NU = 'NU', // Nunavut
  ON = 'ON', // Ontario
  PE = 'PE', // Prince Edward Island
  QC = 'QC', // Quebec
  SK = 'SK', // Saskatchewan
  YT = 'YT', // Yukon
}

/**
 * Canadian tax types
 */
export enum CanadianTaxType {
  GST = 'GST', // Goods and Services Tax (Federal)
  HST = 'HST', // Harmonized Sales Tax
  PST = 'PST', // Provincial Sales Tax
  QST = 'QST', // Quebec Sales Tax
}

/**
 * Canadian tax categories
 */
export enum CanadianTaxCategory {
  STANDARD = 'STANDARD',
  ZERO_RATED = 'ZERO_RATED', // Basic groceries, prescription drugs, exports
  EXEMPT = 'EXEMPT', // Healthcare, education, financial services
}

/**
 * Provinces that use HST
 */
export type HSTProvince =
  | CanadianProvince.ON
  | CanadianProvince.NB
  | CanadianProvince.NL
  | CanadianProvince.NS
  | CanadianProvince.PE;

/**
 * Provinces that use PST
 */
export type PSTProvince =
  | CanadianProvince.BC
  | CanadianProvince.MB
  | CanadianProvince.SK;

/**
 * Provinces with no provincial tax (GST only)
 */
export type GSTOnlyProvince =
  | CanadianProvince.AB
  | CanadianProvince.NT
  | CanadianProvince.NU
  | CanadianProvince.YT;

/**
 * Canadian tax rate configuration
 */
export interface CanadianTaxRate {
  province: CanadianProvince;
  taxType: CanadianTaxType;
  rate: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  description: string;
}

/**
 * Combined tax rates for a province
 */
export interface CanadianProvinceTaxRates {
  province: CanadianProvince;
  provinceName: string;
  gst?: number;
  hst?: number;
  pst?: number;
  qst?: number;
  combinedRate: number;
  taxTypes: CanadianTaxType[];
}

/**
 * Canadian Business Number (BN) structure
 * Format: 123456789 (9 digits)
 * Can be extended with program identifiers:
 * - RC (GST/HST): 123456789 RC 0001
 * - RP (Payroll): 123456789 RP 0001
 * - RT (Corporate Income Tax): 123456789 RT 0001
 */
export interface CanadianBusinessNumber {
  bn: string; // 9-digit base number
  programIdentifier?: 'RC' | 'RP' | 'RT' | 'RZ' | 'RM';
  referenceNumber?: string; // 4-digit reference
  formatted: string; // Full formatted number
  valid: boolean;
}

/**
 * GST/HST registration information
 */
export interface GSTHSTRegistration {
  businessNumber: string; // 9-digit BN
  gstHstNumber: string; // Full number with RC identifier
  province: CanadianProvince;
  registrationDate: Date;
  effectiveDate: Date;
  reportingPeriod: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
}

/**
 * Tax calculation result for Canada
 */
export interface CanadianTaxCalculation {
  netAmount: number;
  gst?: number;
  hst?: number;
  pst?: number;
  qst?: number;
  totalTax: number;
  grossAmount: number;
  province: CanadianProvince;
  category: CanadianTaxCategory;
  breakdown: Array<{
    type: CanadianTaxType;
    rate: number;
    amount: number;
  }>;
}

/**
 * Zero-rated supplies (0% GST/HST but can claim input tax credits)
 */
export const ZERO_RATED_SUPPLIES = [
  'Basic groceries',
  'Prescription drugs',
  'Medical devices',
  'Exports',
  'International transportation services',
] as const;

/**
 * Exempt supplies (no GST/HST and cannot claim input tax credits)
 */
export const CANADA_EXEMPT_SUPPLIES = [
  'Long-term residential rent',
  'Most healthcare services',
  'Educational services',
  'Daycare services',
  'Financial services',
  'Legal aid services',
  'Music lessons',
] as const;

/**
 * Provincial tax rules
 */
export interface CanadianProvinceTaxRules {
  province: CanadianProvince;
  provinceName: string;
  taxSystem: 'HST' | 'GST_PST' | 'GST_QST' | 'GST_ONLY';
  rates: {
    federal?: number; // GST rate
    provincial?: number; // PST/QST rate or HST provincial component
    combined: number; // Total rate
  };
  registrationThreshold: number; // Annual revenue threshold for registration
  smallSupplierThreshold: number; // Small supplier exemption
  filingFrequency: {
    annual?: { maxRevenue: number };
    quarterly?: { maxRevenue: number };
    monthly?: { minRevenue: number };
  };
  specialRules?: string[];
}

/**
 * Filing period types
 */
export type CanadianFilingPeriod = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

/**
 * GST/HST filing deadline
 */
export interface CanadianFilingDeadline {
  period: CanadianFilingPeriod;
  year: number;
  quarter?: number;
  month?: number;
  filingDeadline: Date;
  paymentDeadline: Date;
}
