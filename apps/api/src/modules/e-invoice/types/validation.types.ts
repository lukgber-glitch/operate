/**
 * E-Invoice Validation Types
 *
 * Unified validation types for both ZUGFeRD/Factur-X and XRechnung formats.
 * Includes EN16931 business rule compliance checking.
 */

import { InvoiceData } from './zugferd.types';
import { ValidationResult } from './xrechnung.types';

/**
 * E-Invoice format detection
 */
export enum EInvoiceFormat {
  /** ZUGFeRD 1.0 / 2.0 / 2.1 */
  ZUGFERD = 'zugferd',
  /** Factur-X (French ZUGFeRD variant) */
  FACTURX = 'facturx',
  /** XRechnung UBL syntax */
  XRECHNUNG_UBL = 'xrechnung-ubl',
  /** XRechnung CII syntax */
  XRECHNUNG_CII = 'xrechnung-cii',
  /** Unknown/unsupported format */
  UNKNOWN = 'unknown',
}

/**
 * Recipient type determines mandatory field requirements
 */
export enum RecipientType {
  /** Business-to-Business */
  B2B = 'b2b',
  /** Business-to-Government (requires additional fields like Leitweg-ID) */
  B2G = 'b2g',
  /** Business-to-Consumer */
  B2C = 'b2c',
}

/**
 * EN16931 Business Rule validation result
 *
 * EN16931 is the European standard for electronic invoicing,
 * defining semantic data model and business rules (BR-01 to BR-65).
 */
export interface BusinessRuleResult {
  /** Whether all business rules passed */
  passed: boolean;
  /** List of business rule violations */
  violations: BusinessRuleViolation[];
}

/**
 * Individual business rule violation
 */
export interface BusinessRuleViolation {
  /** Business rule code (e.g., "BR-DE-01", "BR-EN-01") */
  rule: string;
  /** Human-readable violation message */
  message: string;
  /** Severity level */
  severity: 'error' | 'warning';
  /** Field path where violation occurred */
  field?: string;
  /** Expected value or format */
  expected?: string;
  /** Actual value found */
  actual?: string;
}

/**
 * Recipient-specific validation result
 *
 * Different recipient types (B2B, B2G, B2C) have different
 * mandatory field requirements.
 */
export interface RecipientValidationResult {
  /** Whether invoice is valid for recipient type */
  valid: boolean;
  /** Recipient type that was validated */
  recipientType: RecipientType;
  /** List of missing mandatory fields */
  missingFields: string[];
  /** List of validation warnings */
  warnings: string[];
  /** Additional recommendations */
  recommendations?: string[];
}

/**
 * Extended validation result with metadata
 */
export interface ExtendedValidationResult extends ValidationResult {
  /** Detected invoice format */
  format?: EInvoiceFormat;
  /** Business rule validation result */
  businessRules?: BusinessRuleResult;
  /** Schema validation details */
  schemaValidation?: {
    passed: boolean;
    schemaVersion?: string;
    validatedAt?: Date;
  };
  /** File/data characteristics */
  metadata?: {
    /** For PDFs: has embedded XML */
    hasEmbeddedXml?: boolean;
    /** For PDFs: is PDF/A-3 compliant */
    isPdfA3?: boolean;
    /** XML was successfully validated */
    xmlValidated?: boolean;
    /** Detected profile (for ZUGFeRD) */
    profile?: string;
    /** File size in bytes */
    size?: number;
  };
}

/**
 * EN16931 Business Rule Codes
 *
 * Reference: https://docs.peppol.eu/poacc/billing/3.0/bis/#_invoice_business_rules
 */
export enum BusinessRule {
  // Core rules (BR-01 to BR-65)
  BR_01 = 'BR-01', // Invoice must have invoice number
  BR_02 = 'BR-02', // Invoice must have issue date
  BR_03 = 'BR-03', // Invoice must have invoice type code
  BR_04 = 'BR-04', // Invoice must have currency code
  BR_05 = 'BR-05', // Invoice must have seller name
  BR_06 = 'BR-06', // Invoice must have seller postal address
  BR_07 = 'BR-07', // Seller postal address must have country code
  BR_08 = 'BR-08', // Invoice must have buyer name
  BR_09 = 'BR-09', // Invoice must have buyer postal address
  BR_10 = 'BR-10', // Buyer postal address must have country code
  BR_11 = 'BR-11', // Invoice must have at least one line item
  BR_12 = 'BR-12', // Invoice must have invoice total amount with VAT
  BR_13 = 'BR-13', // Invoice must have line extension amount
  BR_14 = 'BR-14', // Invoice must have tax exclusive amount
  BR_15 = 'BR-15', // Due date must not be before issue date
  BR_16 = 'BR-16', // Payment must have payment means type code

  // German-specific rules (BR-DE-01 to BR-DE-21)
  BR_DE_01 = 'BR-DE-01', // Invoice must have buyer reference (Leitweg-ID for B2G)
  BR_DE_02 = 'BR-DE-02', // Seller must have VAT identifier or tax registration identifier
  BR_DE_03 = 'BR-DE-03', // Payment means must have IBAN if payment means code is 58
  BR_DE_04 = 'BR-DE-04', // BIC should be provided if IBAN is present
  BR_DE_05 = 'BR-DE-05', // Invoice must not contain attachment if ZUGFeRD profile is BASIC
  BR_DE_06 = 'BR-DE-06', // Leitweg-ID must be valid format for B2G
  BR_DE_07 = 'BR-DE-07', // Reverse charge must be properly indicated
  BR_DE_08 = 'BR-DE-08', // VAT breakdown must match total
  BR_DE_09 = 'BR-DE-09', // Document currency must be EUR for German B2G
  BR_DE_10 = 'BR-DE-10', // Payment terms must be specified
  BR_DE_11 = 'BR-DE-11', // Invoice lines must have unique IDs
  BR_DE_12 = 'BR-DE-12', // Item price must not be negative
  BR_DE_13 = 'BR-DE-13', // Quantity must be greater than zero
  BR_DE_14 = 'BR-DE-14', // Line extension amount must equal quantity * price
  BR_DE_15 = 'BR-DE-15', // Tax category code must be valid
  BR_DE_16 = 'BR-DE-16', // Tax percentage must be provided for standard rate
  BR_DE_17 = 'BR-DE-17', // Tax amount must equal tax base amount * tax percentage
  BR_DE_18 = 'BR-DE-18', // Sum of line amounts must equal invoice line extension
  BR_DE_19 = 'BR-DE-19', // Tax exclusive amount plus tax amount must equal tax inclusive amount
  BR_DE_20 = 'BR-DE-20', // Allowances and charges must be calculated correctly
  BR_DE_21 = 'BR-DE-21', // Rounding of amounts must follow standard rules

  // Austrian-specific rules (BR-AT-01 to BR-AT-10)
  BR_AT_01 = 'BR-AT-01', // Seller VAT ID must be valid Austrian format
  BR_AT_02 = 'BR-AT-02', // Invoice must have payment reference for Austrian B2G
  BR_AT_03 = 'BR-AT-03', // Tax point date must be specified
  BR_AT_04 = 'BR-AT-04', // Payment means must be provided
  BR_AT_05 = 'BR-AT-05', // Invoice must use EUR currency
  BR_AT_06 = 'BR-AT-06', // Reverse charge must comply with Austrian regulations
  BR_AT_07 = 'BR-AT-07', // VAT breakdown must be complete
  BR_AT_08 = 'BR-AT-08', // Delivery date must not be after issue date
  BR_AT_09 = 'BR-AT-09', // Contract reference must be provided for framework agreements
  BR_AT_10 = 'BR-AT-10', // Electronic address must be valid format
}

/**
 * Validation context for recipient-specific checks
 */
export interface ValidationContext {
  /** Country code (ISO 3166-1 alpha-2) */
  country?: string;
  /** Recipient type */
  recipientType: RecipientType;
  /** Whether to apply strict validation */
  strict?: boolean;
  /** Additional context data */
  metadata?: Record<string, any>;
}

/**
 * Format detection hints
 */
export interface FormatDetectionResult {
  /** Detected format */
  format: EInvoiceFormat;
  /** Confidence level (0-1) */
  confidence: number;
  /** Detection method used */
  method: 'magic-bytes' | 'xml-root' | 'pdf-attachment' | 'content-analysis';
  /** Additional hints */
  hints?: {
    /** XML namespace detected */
    namespace?: string;
    /** PDF attachment filename */
    attachmentName?: string;
    /** XML root element */
    rootElement?: string;
  };
}
