/**
 * ELSTER VAT (UStVA) Service Types
 * German VAT return (Umsatzsteuervoranmeldung) data structures and types
 */

/**
 * Tax period for VAT returns
 */
export interface TaxPeriod {
  year: number; // Tax year (e.g., 2024)
  month?: number; // 1-12 for monthly returns
  quarter?: number; // 1-4 for quarterly returns
}

/**
 * Period type for VAT filing
 */
export enum VATFilingPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

/**
 * UStVA data structure
 * All monetary amounts are in cents to avoid floating-point issues
 */
export interface UStVAData {
  // Period information
  period: TaxPeriod;

  // Tax identification
  taxNumber: string; // Steuernummer (format: XXX/XXX/XXXXX)
  vatId?: string; // USt-IdNr. (DE followed by 9 digits)

  // Revenue figures (in cents)
  domesticRevenue19: number; // Kennzahl 81: 19% domestic revenue
  domesticRevenue7: number; // Kennzahl 86: 7% reduced rate revenue
  taxFreeRevenue: number; // Kennzahl 48: Tax-free with input tax deduction
  euDeliveries: number; // Kennzahl 41: Intra-EU deliveries (tax-free)
  euAcquisitions19: number; // Kennzahl 89: Intra-EU acquisitions (19%)
  euAcquisitions7: number; // Kennzahl 93: Intra-EU acquisitions (7%)

  // Reverse charge (§13b UStG)
  reverseChargeRevenue: number; // Kennzahl 60: Reverse charge §13b

  // Input tax (Vorsteuer) in cents
  inputTax: number; // Kennzahl 66: Deductible input tax
  importVat: number; // Kennzahl 62: Import VAT
  euAcquisitionsInputTax: number; // Kennzahl 61: Input tax from EU acquisitions

  // Special cases
  specialPrepayment?: number; // Sondervorauszahlung (annual only, in cents)
  previousYearRefund?: number; // Überschuss aus Vorjahr

  // Calculated fields (set by service)
  outputVat?: number; // Total output VAT (calculated)
  totalInputTax?: number; // Total input tax (calculated)
  vatPayable?: number; // VAT payable/refundable (output - input)
}

/**
 * Submission options for ELSTER filing
 */
export interface SubmitOptions {
  testMode?: boolean; // Submit to ELSTER test environment
  dryRun?: boolean; // Validate only, don't submit
  autoCalculate?: boolean; // Auto-calculate totals from invoices (default: true)
}

/**
 * ELSTER submission result
 */
export interface ElsterSubmissionResult {
  success: boolean;
  submissionId: string; // Our internal ID
  transferTicket?: string; // ELSTER transfer ticket
  timestamp: Date;
  status: ElsterFilingStatus;
  errors?: string[];
  warnings?: string[];
  data?: UStVAData; // Submitted data
}

/**
 * ELSTER submission status
 */
export interface ElsterSubmissionStatus {
  id: string;
  status: ElsterFilingStatus;
  submittedAt?: Date;
  responseAt?: Date;
  transferTicket?: string;
  errors?: string[];
  warnings?: string[];
  response?: any; // ELSTER response data
}

/**
 * Filing status enum
 */
export enum ElsterFilingStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}

/**
 * Validation result for UStVA data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

/**
 * ELSTER filing record
 */
export interface ElsterFiling {
  id: string;
  organisationId: string;
  type: string; // USTVA, ZM, UST
  year: number;
  period: number; // Month (1-12) or Quarter (1-4)
  periodType: VATFilingPeriod;
  status: ElsterFilingStatus;
  submissionId?: string; // External reference from ELSTER
  submittedAt?: Date;
  responseAt?: Date;
  data: UStVAData;
  response?: any;
  errors?: any;
  certificateId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Filing history query options
 */
export interface HistoryOptions {
  year?: number;
  periodType?: VATFilingPeriod;
  status?: ElsterFilingStatus;
  limit?: number;
  offset?: number;
}

/**
 * TigerVAT API request structure
 */
export interface TigerVATRequest {
  organisationId: string;
  certificateId: string;
  data: UStVAData;
  testMode: boolean;
}

/**
 * TigerVAT API response structure
 */
export interface TigerVATResponse {
  success: boolean;
  transferTicket?: string;
  status: string;
  errors?: string[];
  warnings?: string[];
  timestamp: Date;
  rawResponse?: any;
}

/**
 * Tax filing provider interface
 * Allows swapping between tigerVAT, ERiC, or other providers
 */
export interface TaxFilingProvider {
  submitVATReturn(data: VATReturnData): Promise<SubmissionResult>;
  getStatus(id: string): Promise<StatusResult>;
  testConnection(): Promise<boolean>;
}

/**
 * Generic VAT return data
 */
export interface VATReturnData {
  organisationId: string;
  period: TaxPeriod;
  data: UStVAData;
  certificateId: string;
  testMode: boolean;
}

/**
 * Generic submission result
 */
export interface SubmissionResult {
  success: boolean;
  id: string;
  transferTicket?: string;
  status: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * Generic status result
 */
export interface StatusResult {
  id: string;
  status: string;
  submittedAt?: Date;
  responseAt?: Date;
  errors?: string[];
  warnings?: string[];
  response?: any;
}

/**
 * VAT calculation from invoices
 */
export interface VATCalculation {
  period: TaxPeriod;
  domesticRevenue19: number;
  domesticRevenue7: number;
  taxFreeRevenue: number;
  euDeliveries: number;
  euAcquisitions19: number;
  euAcquisitions7: number;
  reverseChargeRevenue: number;
  inputTax: number;
  importVat: number;
  euAcquisitionsInputTax: number;
  outputVat: number;
  totalInputTax: number;
  vatPayable: number;
  invoiceCount: number;
  expenseCount: number;
}

/**
 * Error types for ELSTER VAT operations
 */
export class ElsterVATError extends Error {
  constructor(
    message: string,
    public readonly code: ElsterVATErrorCode,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'ElsterVATError';
  }
}

export enum ElsterVATErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  SUBMISSION_FAILED = 'SUBMISSION_FAILED',
  CERTIFICATE_NOT_FOUND = 'CERTIFICATE_NOT_FOUND',
  CERTIFICATE_EXPIRED = 'CERTIFICATE_EXPIRED',
  INVALID_PERIOD = 'INVALID_PERIOD',
  DUPLICATE_SUBMISSION = 'DUPLICATE_SUBMISSION',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  API_ERROR = 'API_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
}
