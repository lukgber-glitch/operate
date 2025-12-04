/**
 * SAF-T Header Interfaces
 * Defines the header section structure of SAF-T XML
 */

/**
 * Company address structure
 */
export interface SaftAddress {
  buildingNumber?: string;
  streetName: string;
  addressDetail?: string;
  city: string;
  postalCode: string;
  region?: string;
  country: string;
}

/**
 * Company contact information
 */
export interface SaftContact {
  contactPerson?: string;
  telephone?: string;
  fax?: string;
  email?: string;
  website?: string;
}

/**
 * Company information for SAF-T header
 */
export interface SaftCompanyInfo {
  companyID: string;
  taxRegistrationNumber: string;
  companyName: string;
  companyAddress: SaftAddress;
  contact?: SaftContact;
  vatNumber?: string;
  commercialRegistrationNumber?: string;
  taxEntity?: string;
  taxAccountingBasis?: 'I' | 'C' | 'S'; // Invoice, Cash, Self-billing
}

/**
 * Software/system information
 */
export interface SaftSoftwareInfo {
  softwareCompanyName: string;
  softwareID: string;
  softwareVersion: string;
  softwareValidationNumber?: string; // Required in some countries
  productID?: string;
  productVersion?: string;
}

/**
 * Fiscal period selection criteria
 */
export interface SaftSelectionCriteria {
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  periodStartYear?: number;
  periodEndYear?: number;
  selectionStartDate?: string;
  selectionEndDate?: string;
  taxReportingPeriod?: string;
}

/**
 * Complete SAF-T header structure
 */
export interface SaftHeader {
  auditFileVersion: string; // e.g., "2.00"
  auditFileCountry: string; // ISO 3166-1 alpha-2
  auditFileDateCreated: string; // YYYY-MM-DD
  auditFileProductCompanyTaxID?: string;
  auditFileProductID?: string;
  auditFileProductVersion?: string;

  company: SaftCompanyInfo;
  software: SaftSoftwareInfo;

  defaultCurrencyCode: string; // ISO 4217
  selectionCriteria: SaftSelectionCriteria;

  taxAccountingBasis?: string;
  taxEntity?: string;

  headerComment?: string;
  telephone?: string;
  fax?: string;
  email?: string;
  website?: string;

  businessName?: string;
  companyNameRegistration?: string;

  // Country-specific extensions
  extensions?: Record<string, any>;
}

/**
 * Header generation parameters
 */
export interface HeaderGenerationParams {
  organizationId: string;
  fiscalYear: number;
  periodStart: Date;
  periodEnd: Date;
  variant: string;
  auditFileVersion?: string;
  includeExtensions?: boolean;
}
