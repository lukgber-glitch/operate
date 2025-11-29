/**
 * SV-Meldung Response Interfaces
 * Interfaces for processing responses from social security carriers
 */

/**
 * Response status enumeration
 */
export enum SvResponseStatus {
  /** Message accepted */
  ACCEPTED = 'ACCEPTED',

  /** Message rejected */
  REJECTED = 'REJECTED',

  /** Message pending review */
  PENDING = 'PENDING',

  /** Processing error */
  ERROR = 'ERROR',

  /** Partially accepted (some records failed) */
  PARTIAL = 'PARTIAL',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  /** Warning - message accepted with warnings */
  WARNING = 'WARNING',

  /** Error - message rejected */
  ERROR = 'ERROR',

  /** Fatal - cannot process */
  FATAL = 'FATAL',
}

/**
 * Individual error detail
 */
export interface SvError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Error severity */
  severity: ErrorSeverity;

  /** Field that caused the error */
  field?: string;

  /** Line number in DEÜV file */
  line?: number;

  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Processed SV response
 */
export interface SvResponse {
  /** Unique submission ID */
  submissionId: string;

  /** Response status */
  status: SvResponseStatus;

  /** Submission timestamp */
  submittedAt: Date;

  /** Response timestamp */
  respondedAt?: Date;

  /** Carrier ID */
  carrierId: string;

  /** Message type (ANMELDUNG, ABMELDUNG, etc.) */
  messageType: string;

  /** Number of records submitted */
  recordsSubmitted: number;

  /** Number of records accepted */
  recordsAccepted: number;

  /** Number of records rejected */
  recordsRejected: number;

  /** Errors and warnings */
  errors: SvError[];

  /** Confirmation number from carrier */
  confirmationNumber?: string;

  /** Raw response data */
  rawResponse?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Carrier response acknowledgment
 */
export interface CarrierAcknowledgment {
  /** Acknowledgment ID */
  acknowledgmentId: string;

  /** Original submission ID */
  submissionId: string;

  /** Acknowledgment type */
  type: 'RECEIVED' | 'PROCESSED' | 'REJECTED';

  /** Acknowledgment timestamp */
  timestamp: Date;

  /** Processing notes */
  notes?: string;
}

/**
 * Batch submission result
 */
export interface BatchSubmissionResult {
  /** Batch ID */
  batchId: string;

  /** Total messages in batch */
  totalMessages: number;

  /** Successfully submitted */
  successfulSubmissions: number;

  /** Failed submissions */
  failedSubmissions: number;

  /** Individual results */
  results: SvResponse[];

  /** Batch submission timestamp */
  submittedAt: Date;

  /** Overall batch status */
  overallStatus: SvResponseStatus;
}

/**
 * Cached submission for tracking
 */
export interface CachedSubmission {
  /** Submission ID */
  submissionId: string;

  /** Employee ID */
  employeeId: string;

  /** Message type */
  messageType: string;

  /** Submission data hash */
  dataHash: string;

  /** Submission timestamp */
  submittedAt: string;

  /** Response status */
  status: SvResponseStatus;

  /** Cache expiry */
  expiresAt: string;
}
