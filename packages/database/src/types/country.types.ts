/**
 * Country Context TypeScript Types
 *
 * Type definitions for country-related entities exported from Prisma schema.
 * These types are used across the application for type safety.
 */

import type {
  Country,
  Region,
  TaxAuthority,
  VatRate,
  DeductionCategory,
  GovernmentApi,
  CountryFeature,
  EmploymentType,
  OrganisationCountry,
  TaxCredential,
  TaxCredentialType,
} from '@prisma/client';

export type {
  Country,
  Region,
  TaxAuthority,
  VatRate,
  DeductionCategory,
  GovernmentApi,
  CountryFeature,
  EmploymentType,
  OrganisationCountry,
  TaxCredential,
  TaxCredentialType,
};

// ============================================================================
// CUSTOM TYPES
// ============================================================================

/**
 * Country with all related data
 */
export interface CountryWithRelations {
  id: string;
  code: string;
  code3: string;
  name: string;
  nameNative: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  timezone: string;
  fiscalYearStart: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  regions?: Region[];
  taxAuthorities?: TaxAuthority[];
  vatRates?: VatRate[];
  deductionCategories?: DeductionCategory[];
  governmentApis?: GovernmentApi[];
  features?: CountryFeature[];
  employmentTypes?: EmploymentType[];
}

/**
 * VAT rate with country information
 */
export interface VatRateWithCountry {
  id: string;
  countryId: string;
  name: string;
  rate: number;
  validFrom: Date;
  validTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
  country: {
    code: string;
    name: string;
  };
}

/**
 * Deduction category with country information
 */
export interface DeductionCategoryWithCountry {
  id: string;
  countryId: string;
  code: string;
  name: string;
  description: string | null;
  maxAmount: number | null;
  legalBasis: string | null;
  requiresProof: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  country: {
    code: string;
    name: string;
  };
}

/**
 * Employment type with country information
 */
export interface EmploymentTypeWithCountry {
  id: string;
  countryId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  country: {
    code: string;
    name: string;
  };
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Create country input
 */
export interface CreateCountryInput {
  code: string;
  code3: string;
  name: string;
  nameNative: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  timezone: string;
  fiscalYearStart: string;
}

/**
 * Update country input
 */
export interface UpdateCountryInput {
  name?: string;
  nameNative?: string;
  currency?: string;
  currencySymbol?: string;
  locale?: string;
  timezone?: string;
  fiscalYearStart?: string;
  isActive?: boolean;
}

/**
 * Create VAT rate input
 */
export interface CreateVatRateInput {
  countryId: string;
  name: string;
  rate: number;
  validFrom: Date;
  validTo?: Date;
}

/**
 * Create deduction category input
 */
export interface CreateDeductionCategoryInput {
  countryId: string;
  code: string;
  name: string;
  description?: string;
  maxAmount?: number;
  legalBasis?: string;
  requiresProof?: boolean;
}

/**
 * Create government API input
 */
export interface CreateGovernmentApiInput {
  countryId: string;
  name: string;
  baseUrl: string;
  sandboxUrl?: string;
  authType: string;
}

/**
 * Create country feature input
 */
export interface CreateCountryFeatureInput {
  countryId: string;
  feature: string;
  enabled: boolean;
  config?: any;
}

/**
 * Create employment type input
 */
export interface CreateEmploymentTypeInput {
  countryId: string;
  code: string;
  name: string;
  description?: string;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * Country filter options
 */
export interface CountryFilter {
  code?: string;
  codes?: string[];
  isActive?: boolean;
  search?: string;
}

/**
 * VAT rate query options
 */
export interface VatRateQuery {
  countryCode: string;
  effectiveDate?: Date;
  rateName?: string;
}

/**
 * Deduction category query options
 */
export interface DeductionCategoryQuery {
  countryCode: string;
  isActive?: boolean;
  code?: string;
}

/**
 * Employment type query options
 */
export interface EmploymentTypeQuery {
  countryCode: string;
  isActive?: boolean;
  code?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Country response with summary data
 */
export interface CountrySummary {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  timezone: string;
  regionsCount: number;
  vatRatesCount: number;
  deductionCategoriesCount: number;
  featuresEnabled: string[];
}

/**
 * Active VAT rates for a country
 */
export interface ActiveVatRates {
  countryCode: string;
  effectiveDate: Date;
  rates: {
    name: string;
    rate: number;
    validFrom: Date;
    validTo: Date | null;
  }[];
}

