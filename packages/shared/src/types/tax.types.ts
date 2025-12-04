/**
 * Tax Configuration Types
 * Task: W24-T5 - EU Country Tax Configurations
 */

/**
 * Tax period types for filing and reporting
 */
export enum TaxPeriodType {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  BI_MONTHLY = 'BI_MONTHLY',
}

/**
 * Tax categories based on EU VAT harmonization
 */
export enum TaxCategory {
  STANDARD = 'STANDARD',
  REDUCED = 'REDUCED',
  SUPER_REDUCED = 'SUPER_REDUCED',
  ZERO = 'ZERO',
  EXEMPT = 'EXEMPT',
  PARKING = 'PARKING',
  INTERMEDIATE = 'INTERMEDIATE',
}

/**
 * Invoice numbering type requirements
 */
export enum InvoiceNumberingType {
  SEQUENTIAL = 'SEQUENTIAL',
  YEAR_PREFIX = 'YEAR_PREFIX',
  CUSTOM_PREFIX = 'CUSTOM_PREFIX',
  FREE_FORMAT = 'FREE_FORMAT',
}

/**
 * Country-specific tax configuration
 */
export interface CountryTaxConfig {
  id: string;
  countryId: string;

  // Tax periods
  vatPeriodType: TaxPeriodType;
  corporateTaxPeriodType: TaxPeriodType;

  // Filing deadlines (days after period end)
  vatFilingDeadlineDays: number;
  vatPaymentDeadlineDays: number;
  corporateTaxFilingDays: number;
  corporateTaxPaymentDays: number;

  // Invoice requirements
  invoiceNumberingType: InvoiceNumberingType;
  invoiceNumberingFormat?: string;
  requiresDigitalSignature: boolean;
  requiresQrCode: boolean;

  // E-invoicing
  requiresEInvoicing: boolean;
  eInvoicingMandateDate?: Date;
  eInvoicingFormat?: string;
  eInvoicingNetwork?: string;

  // Intra-community
  viesValidationRequired: boolean;
  intraCommunityThreshold?: number;

  // Additional requirements
  fiscalRepresentativeRequired: boolean;
  fiscalRepThreshold?: number;

  // SAF-T reporting
  requiresSaftT: boolean;
  saftTFrequency?: TaxPeriodType;

  // Metadata
  notes?: string;
  legalBasis?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * VAT rate configuration with category
 */
export interface VatRateConfig {
  id: string;
  taxConfigId: string;

  // Rate details
  category: TaxCategory;
  rate: number;
  description: string;

  // Applicability
  validFrom: Date;
  validTo?: Date;

  // Conditions and exemptions
  conditions?: string; // JSON string
  exemptions?: string; // JSON string
  examples?: string; // JSON array

  // Legal reference
  legalBasis?: string;
  euDirectiveRef?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tax filing deadline for a specific period
 */
export interface TaxFilingDeadline {
  id: string;
  countryId: string;

  // Deadline details
  taxType: string; // VAT, Corporate, Withholding, etc.
  periodType: TaxPeriodType;
  year: number;
  period: number;

  // Dates
  filingDate: Date;
  paymentDate: Date;

  // Additional info
  description?: string;
  isExtended: boolean;
  notes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * VAT rate information for display and calculation
 */
export interface VatRateInfo {
  category: TaxCategory;
  rate: number;
  description: string;
  examples?: string[];
}

/**
 * Country tax summary for quick reference
 */
export interface CountryTaxSummary {
  countryCode: string;
  countryName: string;
  currency: string;
  vatRates: VatRateInfo[];
  vatPeriodType: TaxPeriodType;
  requiresEInvoicing: boolean;
  eInvoicingMandateDate?: Date;
  requiresSaftT: boolean;
}

/**
 * Tax calculation result
 */
export interface TaxCalculation {
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  grossAmount: number;
  category: TaxCategory;
  countryCode: string;
}

/**
 * E-invoicing configuration
 */
export interface EInvoicingConfig {
  enabled: boolean;
  mandateDate?: Date;
  format: string; // Peppol, FatturaPA, Chorus Pro, etc.
  network: string; // Peppol, SDI, etc.
  testMode: boolean;
  credentials?: {
    participantId?: string;
    apiKey?: string;
    certificate?: string;
  };
}

/**
 * VIES validation result
 */
export interface ViesValidationResult {
  valid: boolean;
  vatNumber: string;
  countryCode: string;
  companyName?: string;
  companyAddress?: string;
  requestDate: Date;
  validationDate?: Date;
  error?: string;
}

/**
 * Intra-community supply configuration
 */
export interface IntraCommunityConfig {
  enabled: boolean;
  viesValidationRequired: boolean;
  threshold?: number;
  exemptionCertificateRequired: boolean;
  recapitulativeStatementRequired: boolean;
  recapPeriodType: TaxPeriodType;
}

/**
 * Fiscal representative requirements
 */
export interface FiscalRepresentativeRequirement {
  required: boolean;
  threshold?: number;
  countries: string[]; // Country codes where FR is required
  reason?: string;
}
