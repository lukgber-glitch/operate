/**
 * FinanzOnline Response Interfaces
 * Defines response structures from the Austrian FinanzOnline WebService
 */

/**
 * FinanzOnline submission status
 */
export enum FonSubmissionStatus {
  /** Submission accepted and processing */
  ACCEPTED = 'ACCEPTED',
  /** Submission being processed */
  PROCESSING = 'PROCESSING',
  /** Submission successfully processed */
  COMPLETED = 'COMPLETED',
  /** Submission rejected */
  REJECTED = 'REJECTED',
  /** Submission failed */
  FAILED = 'FAILED',
  /** Submission pending manual review */
  PENDING_REVIEW = 'PENDING_REVIEW',
}

/**
 * FinanzOnline error codes
 */
export enum FonErrorCode {
  /** Authentication failed */
  AUTH_FAILED = 'AUTH_FAILED',
  /** Invalid certificate */
  INVALID_CERTIFICATE = 'INVALID_CERTIFICATE',
  /** Certificate expired */
  CERTIFICATE_EXPIRED = 'CERTIFICATE_EXPIRED',
  /** Session expired */
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  /** Invalid tax ID format */
  INVALID_TAX_ID = 'INVALID_TAX_ID',
  /** Invalid submission data */
  INVALID_DATA = 'INVALID_DATA',
  /** Missing required field */
  MISSING_FIELD = 'MISSING_FIELD',
  /** Service unavailable */
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  /** Timeout error */
  TIMEOUT = 'TIMEOUT',
  /** Rate limit exceeded */
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  /** Unknown error */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Base FinanzOnline response
 */
export interface FonBaseResponse {
  /** Success flag */
  success: boolean;
  /** Response timestamp */
  timestamp: Date;
  /** Reference ID for tracking */
  referenceId?: string;
  /** Error code if applicable */
  errorCode?: FonErrorCode;
  /** Error message */
  errorMessage?: string;
  /** Warning messages */
  warnings?: string[];
}

/**
 * Authentication response
 */
export interface FonAuthResponse extends FonBaseResponse {
  /** Session data */
  session?: {
    sessionId: string;
    token: string;
    expiresAt: Date;
  };
}

/**
 * VAT return submission response
 */
export interface FonVatReturnResponse extends FonBaseResponse {
  /** Submission status */
  status?: FonSubmissionStatus;
  /** Tax office reference number */
  taxOfficeReference?: string;
  /** Calculated tax amount */
  calculatedTaxAmount?: number;
  /** Payment due date */
  paymentDueDate?: Date;
  /** Payment reference */
  paymentReference?: string;
}

/**
 * Income tax submission response
 */
export interface FonIncomeTaxResponse extends FonBaseResponse {
  /** Submission status */
  status?: FonSubmissionStatus;
  /** Tax office reference number */
  taxOfficeReference?: string;
  /** Assessment notice available */
  assessmentAvailable?: boolean;
  /** Expected refund amount */
  expectedRefund?: number;
  /** Expected payment amount */
  expectedPayment?: number;
}

/**
 * Status query response
 */
export interface FonStatusResponse extends FonBaseResponse {
  /** Current submission status */
  status?: FonSubmissionStatus;
  /** Status description */
  statusDescription?: string;
  /** Last updated timestamp */
  lastUpdated?: Date;
  /** Processing messages */
  messages?: FonProcessingMessage[];
  /** Downloadable documents */
  documents?: FonDocument[];
}

/**
 * Processing message
 */
export interface FonProcessingMessage {
  /** Message type */
  type: 'INFO' | 'WARNING' | 'ERROR';
  /** Message code */
  code: string;
  /** Message text */
  message: string;
  /** Field reference if applicable */
  field?: string;
}

/**
 * Downloadable document
 */
export interface FonDocument {
  /** Document type */
  type: 'PDF' | 'XML';
  /** Document description */
  description: string;
  /** Download URL */
  downloadUrl: string;
  /** File size in bytes */
  size?: number;
  /** Document date */
  date?: Date;
}

/**
 * SOAP fault response
 */
export interface FonSoapFault {
  /** Fault code */
  faultcode: string;
  /** Fault string */
  faultstring: string;
  /** Fault detail */
  detail?: any;
}

/**
 * Generic FinanzOnline response wrapper
 */
export interface FonResponse<T = any> extends FonBaseResponse {
  /** Response data */
  data?: T;
}
