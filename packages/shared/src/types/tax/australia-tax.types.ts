/**
 * Australian Tax Type Definitions
 * Task: W26-T4 - Canadian/Australian tax rules
 */

/**
 * Australian states and territories
 */
export enum AustralianState {
  NSW = 'NSW', // New South Wales
  VIC = 'VIC', // Victoria
  QLD = 'QLD', // Queensland
  SA = 'SA', // South Australia
  WA = 'WA', // Western Australia
  TAS = 'TAS', // Tasmania
  NT = 'NT', // Northern Territory
  ACT = 'ACT', // Australian Capital Territory
}

/**
 * Australian tax types
 */
export enum AustralianTaxType {
  GST = 'GST', // Goods and Services Tax
  GST_FREE = 'GST_FREE', // GST-free supplies
  INPUT_TAXED = 'INPUT_TAXED', // Input-taxed supplies
}

/**
 * Australian GST categories
 */
export enum AustralianGSTCategory {
  STANDARD = 'STANDARD', // 10% GST
  GST_FREE = 'GST_FREE', // 0% - basic food, health, education
  INPUT_TAXED = 'INPUT_TAXED', // Financial services, residential rent
  EXEMPT = 'EXEMPT', // Fully exempt
}

/**
 * Australian tax rate configuration
 */
export interface AustralianTaxRate {
  state: AustralianState;
  category: AustralianGSTCategory;
  rate: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  description: string;
}

/**
 * Australian Business Number (ABN) structure
 * Format: 11 digits with modulus 89 check
 * Example: 51 824 753 556
 */
export interface AustralianBusinessNumber {
  abn: string; // 11-digit ABN
  formatted: string; // Formatted as XX XXX XXX XXX
  valid: boolean;
  isActive?: boolean;
  entityName?: string;
  entityType?: string;
  gstRegistered?: boolean;
}

/**
 * Australian Company Number (ACN) structure
 * Format: 9 digits with check digit
 * Example: 123 456 789
 */
export interface AustralianCompanyNumber {
  acn: string; // 9-digit ACN
  formatted: string; // Formatted as XXX XXX XXX
  valid: boolean;
  companyName?: string;
  companyType?: string;
}

/**
 * GST registration information for Australia
 */
export interface AustralianGSTRegistration {
  abn: string;
  gstRegistrationDate: Date;
  effectiveDate: Date;
  reportingPeriod: 'MONTHLY' | 'QUARTERLY';
  accountingBasis: 'CASH' | 'ACCRUAL';
}

/**
 * Tax calculation result for Australia
 */
export interface AustralianTaxCalculation {
  netAmount: number;
  gstAmount: number;
  grossAmount: number;
  state: AustralianState;
  category: AustralianGSTCategory;
  rate: number;
  taxType: AustralianTaxType;
}

/**
 * GST-free supplies (0% GST but can claim credits)
 */
export const GST_FREE_SUPPLIES = [
  'Basic food (bread, milk, meat, vegetables, fruit)',
  'Health services (medical, hospital, dental)',
  'Medical aids and appliances',
  'Prescription medicines',
  'Education courses',
  'Childcare services',
  'Exports',
  'International transport',
  'Precious metals',
  'Water, sewerage, drainage',
] as const;

/**
 * Input-taxed supplies (no GST, cannot claim credits)
 */
export const INPUT_TAXED_SUPPLIES = [
  'Financial supplies (lending, credit)',
  'Residential rent and accommodation (>28 days)',
  'Residential premises sales',
  'Precious metals (as investment)',
  'School tuckshop and canteen supplies',
] as const;

/**
 * Exempt supplies
 */
export const AUSTRALIA_EXEMPT_SUPPLIES = [
  'Second-hand goods bought from unregistered entities',
  'Government grants and donations',
] as const;

/**
 * State tax rules for Australia
 */
export interface AustralianStateTaxRules {
  state: AustralianState;
  stateName: string;
  gstRate: number;
  registrationThreshold: number; // Annual turnover threshold for GST registration
  simpleGSTThreshold: number; // Threshold for simplified accounting
  hasStateTax: boolean; // Some states may have additional levies
  specialRules?: string[];
}

/**
 * Filing period types
 */
export type AustralianFilingPeriod = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

/**
 * BAS (Business Activity Statement) filing deadline
 */
export interface AustralianFilingDeadline {
  period: AustralianFilingPeriod;
  year: number;
  quarter?: number;
  month?: number;
  lodgmentDeadline: Date; // Lodgment deadline
  paymentDeadline: Date; // Payment deadline
  description: string;
}

/**
 * PAYG (Pay As You Go) withholding categories
 */
export enum PAYGWithholdingCategory {
  SALARY_WAGES = 'SALARY_WAGES',
  DIRECTORS_FEES = 'DIRECTORS_FEES',
  CONTRACTOR = 'CONTRACTOR',
  VOLUNTARY_AGREEMENT = 'VOLUNTARY_AGREEMENT',
}

/**
 * ABN lookup result from ABR (Australian Business Register)
 */
export interface ABNLookupResult {
  abn: string;
  abnStatus: 'Active' | 'Cancelled';
  entityName: string;
  entityType: string;
  gstRegistered: boolean;
  gstFromDate?: Date;
  dgr?: boolean; // Deductible Gift Recipient
  acnc?: boolean; // Australian Charities and Not-for-profits Commission
  businessNames?: string[];
  tradingNames?: string[];
}

/**
 * GST calculation method
 */
export enum GSTCalculationMethod {
  STANDARD = 'STANDARD', // Calculate GST on all taxable supplies
  MARGIN_SCHEME = 'MARGIN_SCHEME', // Calculate GST on margin only
  SIMPLIFIED = 'SIMPLIFIED', // Simplified calculation for small business
}

/**
 * Australian GST scheme types
 */
export interface AustralianGSTScheme {
  type: 'STANDARD' | 'MARGIN_SCHEME' | 'SIMPLIFIED' | 'INPUT_TAXED';
  description: string;
  eligibilityCriteria: string[];
  advantages: string[];
  disadvantages: string[];
}

/**
 * Capital purchases threshold for GST
 */
export const CAPITAL_PURCHASES_THRESHOLD = 1000; // AUD

/**
 * Taxable importation threshold
 */
export const TAXABLE_IMPORTATION_THRESHOLD = 1000; // AUD

/**
 * GST registration threshold
 */
export const GST_REGISTRATION_THRESHOLD = 75000; // Annual turnover in AUD
export const GST_REGISTRATION_THRESHOLD_NON_PROFIT = 150000; // For non-profit organizations
