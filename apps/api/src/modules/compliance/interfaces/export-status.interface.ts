/**
 * Export Status Enumeration
 * Represents the lifecycle states of a compliance export
 */
export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Export Progress Information
 * Tracks the progress of an export operation
 */
export interface ExportProgress {
  /**
   * Current status of the export
   */
  status: ExportStatus;

  /**
   * Progress percentage (0-100)
   */
  percentage: number;

  /**
   * Current step or phase description
   */
  currentStep?: string;

  /**
   * Total number of records to process
   */
  totalRecords?: number;

  /**
   * Number of records processed so far
   */
  processedRecords?: number;

  /**
   * Error message if status is FAILED
   */
  errorMessage?: string;

  /**
   * Error details or stack trace
   */
  errorDetails?: any;

  /**
   * Last updated timestamp
   */
  updatedAt: Date;
}

/**
 * Validation Result
 * Results from validating an export against its schema
 */
export interface ValidationResult {
  /**
   * Whether the export is valid
   */
  isValid: boolean;

  /**
   * List of validation errors
   */
  errors: ValidationError[];

  /**
   * List of validation warnings
   */
  warnings: ValidationWarning[];

  /**
   * Validation timestamp
   */
  validatedAt: Date;

  /**
   * Schema version used for validation
   */
  schemaVersion: string;
}

/**
 * Validation Error
 */
export interface ValidationError {
  /**
   * Error code
   */
  code: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Path to the field with the error
   */
  path?: string;

  /**
   * Severity level
   */
  severity: 'error' | 'critical';
}

/**
 * Validation Warning
 */
export interface ValidationWarning {
  /**
   * Warning code
   */
  code: string;

  /**
   * Warning message
   */
  message: string;

  /**
   * Path to the field with the warning
   */
  path?: string;
}
