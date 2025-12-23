/**
 * VAT Return Types Barrel Export
 *
 * Note: Some types are defined in multiple files. We use explicit exports:
 * - VatReturnPreview: defined in both files, use vat-return.types as canonical
 * - CreateVatReturnDto, ApproveVatReturnDto, SubmitVatReturnDto: interfaces here, but classes in dto/ folder
 */

// Export elster.types except VatReturnPreview (conflicts with vat-return.types)
export {
  ElsterKennzahlen,
  ElsterSubmissionRequest,
  ElsterSubmissionResponse,
  ElsterSubmissionStatus,
  VatPeriodType,
  ElsterCertificate,
  ElsterFiling,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ELSTER_KENNZAHLEN_REFERENCE,
} from './elster.types';
// Export vat-return.types except DTO interfaces (conflicts with dto/ classes)
export {
  InvoiceVatItem,
  ExpenseVatItem,
  VatRateBreakdown,
  OutputVatSummary,
  InputVatSummary,
  VatReturnPreview,
  VatReturnStatus,
  PeriodInfo,
} from './vat-return.types';
