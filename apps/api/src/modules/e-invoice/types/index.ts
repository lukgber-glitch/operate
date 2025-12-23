/**
 * E-Invoice Types Index
 *
 * Central export point for all E-Invoice type definitions.
 *
 * Note: Some types are defined in multiple files. We use explicit exports to avoid conflicts:
 * - InvoiceData, ValidationError, ValidationResult, ValidationWarning: defined in zugferd.types (canonical) and xrechnung.types
 */

// ZUGFeRD types (canonical source for shared types)
export * from './zugferd.types';

// XRechnung types - exclude duplicates that exist in zugferd.types
export {
  XRechnungSyntax,
  ComplianceResult,
  ComplianceIssue,
  InvoiceLineItem,
  BankDetails,
  XRechnungInvoice,
  XRECHNUNG_REQUIRED_FIELDS,
  XRECHNUNG_VERSION,
} from './xrechnung.types';

// Validation types
export * from './validation.types';
