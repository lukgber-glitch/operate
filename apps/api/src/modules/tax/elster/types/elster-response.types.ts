/**
 * ELSTER Response Parser Types
 * Types for parsing and interpreting ELSTER responses from tigerVAT
 */

/**
 * Raw tigerVAT response structure
 */
export interface TigerVATResponse {
  success: boolean;
  transferTicket?: string; // On success - ELSTER confirmation number
  elsterRequestId?: string; // ELSTER internal reference
  timestamp?: string; // ISO 8601 timestamp

  errors?: TigerVATError[];
  warnings?: TigerVATWarning[];

  status?: {
    code: string; // Status code (e.g., "SUCCESS", "ERROR", "PENDING")
    message: string; // Human-readable status message
    details?: any; // Additional status details
  };

  // Raw ELSTER response (for debugging)
  rawResponse?: any;
}

/**
 * tigerVAT error structure
 */
export interface TigerVATError {
  code: string; // Error code (e.g., "ELSTER_VAL_001")
  field?: string; // Field that caused the error
  message: string; // German error message from ELSTER
  severity: 'error' | 'warning';
  technicalMessage?: string; // Technical details for debugging
}

/**
 * tigerVAT warning structure
 */
export interface TigerVATWarning {
  code: string;
  field?: string;
  message: string;
  severity: 'info' | 'warning';
}

/**
 * Parsed ELSTER response
 */
export interface ParsedElsterResponse {
  success: boolean;
  transferTicket?: string; // ELSTER transfer ticket
  elsterReference?: string; // ELSTER request ID

  // Human-readable summary
  summary: string;

  // Structured errors and warnings
  errors: ElsterError[];
  warnings: ElsterWarning[];

  // Categorized for UI display
  displayMessages: DisplayMessage[];

  // Suggested next actions
  suggestedActions: SuggestedAction[];

  // Processing status
  status: ProcessingStatus;

  // Timestamp
  timestamp?: Date;

  // Raw response (for debugging)
  rawResponse?: any;
}

/**
 * Structured ELSTER error
 */
export interface ElsterError {
  code: string; // Error code
  field?: string; // Field name (e.g., "taxNumber")
  fieldLabel?: string; // German field label (e.g., "Steuernummer")
  message: string; // Original message
  localizedMessage: string; // Translated/improved message
  helpUrl?: string; // Link to help documentation
  isRetryable: boolean; // Whether retrying might help
  category: ErrorCategory; // Error category
}

/**
 * Structured ELSTER warning
 */
export interface ElsterWarning {
  code: string;
  field?: string;
  fieldLabel?: string;
  message: string;
  localizedMessage: string;
  category: WarningCategory;
}

/**
 * Display message for UI
 */
export interface DisplayMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  details?: string;
  field?: string;
  action?: SuggestedAction;
}

/**
 * Suggested action for user
 */
export interface SuggestedAction {
  type: ActionType;
  message: string;
  field?: string; // Field to fix
  value?: string; // Suggested value
  url?: string; // External link
  priority: 'high' | 'medium' | 'low';
}

/**
 * Action type enum
 */
export enum ActionType {
  FIX_FIELD = 'fix_field',
  RETRY = 'retry',
  CONTACT_SUPPORT = 'contact_support',
  CHECK_CERTIFICATE = 'check_certificate',
  VERIFY_TAX_NUMBER = 'verify_tax_number',
  UPDATE_PERIOD = 'update_period',
  CHECK_AMOUNTS = 'check_amounts',
  REVIEW_DATA = 'review_data',
  WAIT = 'wait',
}

/**
 * Error category enum
 */
export enum ErrorCategory {
  VALIDATION = 'validation', // Data validation error
  CERTIFICATE = 'certificate', // Certificate-related error
  AUTHENTICATION = 'authentication', // Auth error
  TECHNICAL = 'technical', // Technical/system error
  BUSINESS = 'business', // Business logic error
  NETWORK = 'network', // Network/connectivity error
}

/**
 * Warning category enum
 */
export enum WarningCategory {
  DATA_QUALITY = 'data_quality',
  RECOMMENDATION = 'recommendation',
  INFORMATIONAL = 'informational',
}

/**
 * Processing status
 */
export interface ProcessingStatus {
  code: StatusCode;
  message: string;
  isRetryable: boolean;
  isFinal: boolean; // Whether this is a final status
}

/**
 * Status code enum
 */
export enum StatusCode {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CERTIFICATE_ERROR = 'CERTIFICATE_ERROR',
  TECHNICAL_ERROR = 'TECHNICAL_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error code metadata
 */
export interface ErrorCodeMetadata {
  field?: string; // Field name in our system
  fieldLabel?: string; // German field label
  message: string; // English explanation
  localizedMessage?: string; // Improved German message
  category: ErrorCategory;
  isRetryable: boolean;
  helpUrl?: string;
  suggestedFix?: string;
}

/**
 * Display response for frontend
 */
export interface DisplayResponse {
  success: boolean;
  title: string;
  message: string;
  transferTicket?: string;
  errors: DisplayError[];
  warnings: DisplayWarning[];
  actions: DisplayAction[];
  timestamp: Date;
}

/**
 * Display error
 */
export interface DisplayError {
  title: string;
  message: string;
  field?: string;
  fieldLabel?: string;
  canRetry: boolean;
}

/**
 * Display warning
 */
export interface DisplayWarning {
  title: string;
  message: string;
  field?: string;
}

/**
 * Display action
 */
export interface DisplayAction {
  label: string;
  type: ActionType;
  field?: string;
  description?: string;
  isPrimary: boolean;
}

/**
 * Response parser configuration
 */
export interface ParserConfig {
  includeRawResponse?: boolean; // Include raw response in parsed output
  translateMessages?: boolean; // Attempt to translate messages
  includeHelpUrls?: boolean; // Include help URLs
  detailedErrors?: boolean; // Include all error details
}
