/**
 * ELSTER Response Interfaces
 * Defines response structures from ELSTER API
 */

/**
 * ELSTER response status codes
 */
export enum ElsterResponseStatus {
  /** Submission successful */
  SUCCESS = 'SUCCESS',
  /** Submission accepted, processing */
  ACCEPTED = 'ACCEPTED',
  /** Submission rejected due to errors */
  REJECTED = 'REJECTED',
  /** Submission failed due to technical error */
  ERROR = 'ERROR',
  /** Submission in progress */
  PROCESSING = 'PROCESSING',
  /** Submission pending review */
  PENDING = 'PENDING',
}

/**
 * ELSTER error severity levels
 */
export enum ElsterErrorSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

/**
 * ELSTER error details
 */
export interface ElsterError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Error severity */
  severity: ElsterErrorSeverity;

  /** Field name (if field-specific error) */
  field?: string;

  /** Additional error details */
  details?: Record<string, any>;
}

/**
 * ELSTER validation result
 */
export interface ElsterValidationResult {
  /** Is data valid */
  valid: boolean;

  /** Validation errors */
  errors: ElsterError[];

  /** Validation warnings */
  warnings: ElsterError[];
}

/**
 * ELSTER submission response
 */
export interface ElsterResponse {
  /** Submission status */
  status: ElsterResponseStatus;

  /** Transfer ticket ID for tracking */
  transferTicket: string;

  /** Data transfer number (Datenübermittlungsnummer) */
  dataTransferNumber?: string;

  /** Response timestamp */
  timestamp: Date;

  /** Response errors */
  errors: ElsterError[];

  /** Response warnings */
  warnings: ElsterError[];

  /** Server response code */
  serverResponseCode?: string;

  /** Server response message */
  serverResponseMessage?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * ELSTER submission status response
 */
export interface ElsterSubmissionStatus {
  /** Transfer ticket ID */
  transferTicket: string;

  /** Current status */
  status: ElsterResponseStatus;

  /** Status description */
  statusDescription: string;

  /** Last update timestamp */
  lastUpdate: Date;

  /** Processing progress (0-100) */
  progress?: number;

  /** Errors encountered */
  errors: ElsterError[];

  /** Tax office processing result */
  taxOfficeResult?: {
    /** Tax office name */
    office: string;

    /** Processing date */
    processedDate: Date;

    /** Reference number */
    referenceNumber: string;

    /** Additional notes */
    notes?: string;
  };
}


/**
 * ELSTER test submission response
 */
export interface ElsterTestResponse extends ElsterResponse {
  /** Test mode indicator */
  testMode: true;

  /** Test result summary */
  testResult: {
    /** Validation passed */
    validationPassed: boolean;

    /** Format check passed */
    formatCheckPassed: boolean;

    /** Test warnings */
    testWarnings: string[];
  };
}

/**
 * Bulk submission result
 */
export interface ElsterBulkSubmissionResult {
  /** Total submissions */
  total: number;

  /** Successful submissions */
  successful: number;

  /** Failed submissions */
  failed: number;

  /** Individual results */
  results: Array<{
    /** Submission identifier */
    id: string;

    /** Response */
    response: ElsterResponse;

    /** Success flag */
    success: boolean;
  }>;
}
