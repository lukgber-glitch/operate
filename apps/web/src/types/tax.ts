/**
 * Tax API Types for ELSTER Integration
 */

// VAT Return Preview
export interface VatReturnPreview {
  period: string; // "2025-Q1" or "2025-01"
  periodLabel: string; // "Q1 2025" or "January 2025"
  periodType: 'monthly' | 'quarterly' | 'yearly';
  outputVat: {
    total: number;
    invoices: VatInvoiceItem[];
  };
  inputVat: {
    total: number;
    expenses: VatExpenseItem[];
  };
  netVat: number;
  dueDate: string;
  status: 'draft' | 'ready' | 'submitted';
}

export interface VatInvoiceItem {
  id: string;
  customer: string;
  amount: number;
  vat: number;
  date: string;
  invoiceNumber?: string;
}

export interface VatExpenseItem {
  id: string;
  vendor: string;
  amount: number;
  vat: number;
  date: string;
  reference?: string;
}

// VAT Return Submission
export interface VatReturnSubmission {
  organizationId: string;
  period: string; // "2025-Q1" or "2025-01"
  periodType: 'monthly' | 'quarterly' | 'yearly';
  outputVat: number;
  inputVat: number;
  netVat: number;
  transactions: VatTransaction[];
}

export interface VatTransaction {
  id: string;
  amount: number;
  vat: number;
  type: 'income' | 'expense';
  date?: string;
  description?: string;
}

// ELSTER Submission Result
export interface ElsterSubmissionResult {
  success: boolean;
  transferTicket?: string;
  receiptId?: string;
  timestamp: string;
  errors?: ElsterError[];
  warnings?: ElsterWarning[];
}

export interface ElsterError {
  code: string;
  message: string;
  field?: string;
}

export interface ElsterWarning {
  code: string;
  message: string;
  field?: string;
}

// VAT Return Status
export interface VatReturnStatus {
  submissionId: string;
  status: 'pending' | 'processing' | 'accepted' | 'rejected' | 'error';
  transferTicket?: string;
  receiptAvailable: boolean;
  submittedAt: string;
  processedAt?: string;
  errors?: ElsterError[];
  warnings?: ElsterWarning[];
}

// Validation Result
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code?: string;
}

// Submission History
export interface VatReturnHistory {
  submissions: VatReturnHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VatReturnHistoryItem {
  id: string;
  period: string;
  periodLabel: string;
  submittedAt: string;
  status: VatReturnStatus['status'];
  netVat: number;
  transferTicket?: string;
}

// ELSTER Error Code Mappings
export const ELSTER_ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'ERIC-610001001': 'Invalid certificate. Please check your ELSTER authentication.',
  'ERIC-610001002': 'Certificate expired. Please renew your ELSTER certificate.',
  'ERIC-610001003': 'Certificate not found. Please upload your ELSTER certificate.',

  // Schema validation errors
  'XML-001': 'Invalid data format. Please check your input.',
  'XML-002': 'Missing required field.',
  'XML-003': 'Invalid field value.',

  // Transmission errors
  'TRANSFER-001': 'Connection to ELSTER server failed. Please try again.',
  'TRANSFER-002': 'Timeout while submitting to ELSTER. Please try again.',
  'TRANSFER-003': 'ELSTER server unavailable. Please try again later.',

  // Generic errors
  'UNKNOWN': 'An unknown error occurred. Please contact support.',
};

/**
 * Get user-friendly error message for ELSTER error code
 */
export function getElsterErrorMessage(code: string): string {
  return ELSTER_ERROR_MESSAGES[code] ?? ELSTER_ERROR_MESSAGES['UNKNOWN'] ?? 'An unknown error occurred.';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(code: string): boolean {
  return code.startsWith('TRANSFER-') || code === 'TRANSFER-002';
}
