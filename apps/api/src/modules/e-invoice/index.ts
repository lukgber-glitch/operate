/**
 * E-Invoice Module Exports
 *
 * This module provides electronic invoice generation and processing services
 * including ZUGFeRD/Factur-X, XRechnung, and other European e-invoice formats.
 */

// Services
export { ZugferdService } from './services/zugferd.service';
export { XRechnungService } from './services/xrechnung.service';
export { EInvoiceValidationService } from './services/e-invoice-validation.service';

// ZUGFeRD Types
export {
  ZugferdProfile,
  InvoiceData as ZugferdInvoiceData,
  InvoiceItemData,
  ValidationResult as ZugferdValidationResult,
  ValidationError as ZugferdValidationError,
  ValidationWarning as ZugferdValidationWarning,
  ZugferdInvoice,
  ZugferdGenerationOptions,
  ZugferdExtractionOptions,
} from './types/zugferd.types';

// XRechnung Types
export {
  XRechnungSyntax,
  InvoiceData,
  InvoiceLineItem,
  BankDetails,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ComplianceResult,
  ComplianceIssue,
  XRechnungInvoice,
  XRECHNUNG_REQUIRED_FIELDS,
  XRECHNUNG_VERSION,
} from './types/xrechnung.types';

// Validation Types
export {
  EInvoiceFormat,
  RecipientType,
  BusinessRuleResult,
  BusinessRuleViolation,
  RecipientValidationResult,
  ExtendedValidationResult,
  FormatDetectionResult,
  ValidationContext,
  BusinessRule,
} from './types/validation.types';
