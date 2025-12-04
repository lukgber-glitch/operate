/**
 * US Tax Jurisdiction Types
 * Handles multi-jurisdictional tax calculations for US states
 */

/**
 * Tax jurisdiction levels in the US
 */
export enum TaxJurisdictionLevel {
  STATE = 'State',
  COUNTY = 'County',
  CITY = 'City',
  SPECIAL = 'Special', // Special tax districts (transportation, tourism, etc.)
}

/**
 * Tax origin/destination type
 * Some states use origin-based sourcing, others use destination-based
 */
export enum TaxSourcingType {
  ORIGIN = 'Origin', // Tax based on seller location
  DESTINATION = 'Destination', // Tax based on buyer location (most common)
}

/**
 * US Tax Jurisdiction
 */
export interface USTaxJurisdiction {
  jurisdictionCode: string;
  jurisdictionName: string;
  jurisdictionLevel: TaxJurisdictionLevel;
  rate: number; // Tax rate as decimal (e.g., 0.0825 for 8.25%)
  stateCode: string; // 2-letter state code
  countyName?: string;
  cityName?: string;
  effectiveDate: Date;
  endDate?: Date;
}

/**
 * US State Tax Configuration
 */
export interface USStateTaxConfig {
  stateCode: string;
  stateName: string;
  stateRate: number; // State-level tax rate
  hasLocalTax: boolean; // Whether counties/cities can impose additional tax
  sourcingType: TaxSourcingType;
  requiresNexus: boolean; // Whether nexus is required to collect tax
  nexusThreshold?: NexusThreshold;
  exemptCategories?: string[]; // Product categories exempt from tax
}

/**
 * Economic Nexus Threshold
 * States have different thresholds for when businesses must collect tax
 */
export interface NexusThreshold {
  salesAmount?: number; // Annual sales threshold (e.g., $100,000)
  transactionCount?: number; // Number of transactions threshold (e.g., 200)
  effectiveDate: Date;
}

/**
 * Product Taxability
 */
export enum ProductTaxability {
  PHYSICAL_GOODS = 'P0000000', // Physical tangible goods
  DIGITAL_GOODS = 'D0101000', // Digital products
  SAAS = 'D0301000', // Software as a Service
  SERVICES_PROFESSIONAL = 'S0101000', // Professional services
  SERVICES_REPAIR = 'S0201000', // Repair services
  CLOTHING = 'P0101000', // Clothing (may be exempt in some states)
  GROCERIES = 'P0201000', // Groceries (often exempt)
  PRESCRIPTION_DRUGS = 'P0301000', // Prescription drugs (usually exempt)
}

/**
 * Tax Exemption Certificate
 */
export interface TaxExemptionCertificate {
  certificateId: string;
  customerId: string;
  exemptionNumber: string;
  exemptionType: ExemptionType;
  issuingState: string;
  effectiveDate: Date;
  expirationDate?: Date;
  validatedAt?: Date;
}

/**
 * Types of tax exemptions
 */
export enum ExemptionType {
  RESALE = 'Resale', // Purchasing for resale
  MANUFACTURING = 'Manufacturing', // Manufacturing exemption
  NONPROFIT = 'Nonprofit', // Nonprofit organization
  GOVERNMENT = 'Government', // Government entity
  AGRICULTURAL = 'Agricultural', // Agricultural use
  INDUSTRIAL = 'Industrial', // Industrial use
}

/**
 * Nexus Configuration
 * Determines if a business has nexus (tax obligation) in a state
 */
export interface NexusConfiguration {
  stateCode: string;
  hasNexus: boolean;
  nexusType: NexusType[];
  effectiveDate: Date;
  notes?: string;
}

/**
 * Types of nexus
 */
export enum NexusType {
  PHYSICAL = 'Physical', // Physical presence (office, warehouse, employees)
  ECONOMIC = 'Economic', // Economic nexus (sales threshold exceeded)
  CLICK_THROUGH = 'ClickThrough', // Affiliate/referral nexus
  MARKETPLACE = 'Marketplace', // Marketplace facilitator nexus
}

/**
 * Tax calculation result with jurisdiction breakdown
 */
export interface TaxCalculationResult {
  totalTax: number;
  taxRate: number;
  jurisdictions: JurisdictionTaxDetail[];
  taxableAmount: number;
  exemptAmount: number;
  taxDate: Date;
  taxType: string;
}

/**
 * Detailed tax breakdown by jurisdiction
 */
export interface JurisdictionTaxDetail {
  jurisdictionLevel: TaxJurisdictionLevel;
  jurisdictionName: string;
  jurisdictionCode: string;
  rate: number;
  tax: number;
  taxableAmount: number;
  stateAssignedCode?: string;
}

/**
 * US Address for tax calculation
 */
export interface USTaxAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string; // 2-letter code
  postalCode: string; // ZIP or ZIP+4
  country: string; // 'US'
  latitude?: number;
  longitude?: number;
}

/**
 * State-specific sales tax rules
 */
export const US_STATE_TAX_RULES: Record<string, USStateTaxConfig> = {
  CA: {
    stateCode: 'CA',
    stateName: 'California',
    stateRate: 0.0725,
    hasLocalTax: true,
    sourcingType: TaxSourcingType.ORIGIN,
    requiresNexus: true,
    nexusThreshold: {
      salesAmount: 500000,
      effectiveDate: new Date('2019-04-01'),
    },
  },
  NY: {
    stateCode: 'NY',
    stateName: 'New York',
    stateRate: 0.04,
    hasLocalTax: true,
    sourcingType: TaxSourcingType.DESTINATION,
    requiresNexus: true,
    nexusThreshold: {
      salesAmount: 500000,
      transactionCount: 100,
      effectiveDate: new Date('2019-06-21'),
    },
  },
  TX: {
    stateCode: 'TX',
    stateName: 'Texas',
    stateRate: 0.0625,
    hasLocalTax: true,
    sourcingType: TaxSourcingType.DESTINATION,
    requiresNexus: true,
    nexusThreshold: {
      salesAmount: 500000,
      effectiveDate: new Date('2019-10-01'),
    },
  },
  FL: {
    stateCode: 'FL',
    stateName: 'Florida',
    stateRate: 0.06,
    hasLocalTax: true,
    sourcingType: TaxSourcingType.DESTINATION,
    requiresNexus: true,
    nexusThreshold: {
      salesAmount: 100000,
      effectiveDate: new Date('2021-07-01'),
    },
  },
  WA: {
    stateCode: 'WA',
    stateName: 'Washington',
    stateRate: 0.065,
    hasLocalTax: true,
    sourcingType: TaxSourcingType.DESTINATION,
    requiresNexus: true,
    nexusThreshold: {
      salesAmount: 100000,
      effectiveDate: new Date('2018-10-01'),
    },
  },
  // Add more states as needed
};
