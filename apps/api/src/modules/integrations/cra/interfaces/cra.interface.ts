/**
 * CRA NetFile Integration Interfaces
 * Canada Revenue Agency e-filing types and interfaces
 */

/**
 * CRA Configuration
 */
export interface CraConfig {
  /** CRA EFILE number */
  efileNumber: string;
  /** CRA Web Access Code for authentication */
  webAccessCode?: string;
  /** Environment: sandbox or production */
  environment: 'sandbox' | 'production';
  /** Organization identifier */
  organizationId: string;
  /** Enable TLS 1.2+ */
  tlsVersion: '1.2' | '1.3';
}

/**
 * CRA API Endpoints
 */
export interface CraEndpoints {
  /** NetFile submission endpoint */
  netfileUrl: string;
  /** Authentication endpoint */
  authUrl: string;
  /** Status check endpoint */
  statusUrl: string;
  /** Validation endpoint */
  validationUrl: string;
}

/**
 * CRA Web Access Code Credentials
 */
export interface CraWebAccessCode {
  /** Business Number (BN) */
  businessNumber: string;
  /** Web Access Code */
  accessCode: string;
  /** Expiry date */
  expiryDate?: Date;
}

/**
 * CRA Authentication Credentials
 */
export interface CraAuthCredentials {
  /** EFILE certification number */
  efileNumber: string;
  /** Web Access Code */
  webAccessCode?: string;
  /** Business Number */
  businessNumber: string;
  /** Session token */
  sessionToken?: string;
  /** Token expiry */
  expiresAt?: Date;
}

/**
 * CRA Session Info
 */
export interface CraSessionInfo {
  sessionId: string;
  organizationId: string;
  businessNumber: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * CRA Filing Status
 */
export enum CraFilingStatus {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
}

/**
 * CRA Error Code
 */
export enum CraErrorCode {
  // Authentication errors
  INVALID_EFILE_NUMBER = 'CRA-001',
  INVALID_ACCESS_CODE = 'CRA-002',
  EXPIRED_ACCESS_CODE = 'CRA-003',
  AUTHENTICATION_FAILED = 'CRA-004',

  // Validation errors
  INVALID_BUSINESS_NUMBER = 'CRA-101',
  INVALID_REPORTING_PERIOD = 'CRA-102',
  INVALID_RETURN_DATA = 'CRA-103',
  VALIDATION_FAILED = 'CRA-104',

  // Filing errors
  DUPLICATE_SUBMISSION = 'CRA-201',
  PERIOD_NOT_OPEN = 'CRA-202',
  RETURN_ALREADY_FILED = 'CRA-203',
  FILING_DEADLINE_PASSED = 'CRA-204',

  // Network/System errors
  NETWORK_ERROR = 'CRA-301',
  SERVICE_UNAVAILABLE = 'CRA-302',
  TIMEOUT = 'CRA-303',
  INTERNAL_ERROR = 'CRA-304',

  // Business errors
  BUSINESS_NOT_REGISTERED = 'CRA-401',
  GST_ACCOUNT_INACTIVE = 'CRA-402',
  INVALID_GST_NUMBER = 'CRA-403',
}

/**
 * GST/HST Return Type
 */
export enum GstHstReturnType {
  /** Regular GST/HST return (RC7200) */
  GST34 = 'GST34',
  /** Non-resident return */
  GST62 = 'GST62',
  /** Selected listed financial institutions */
  GST106 = 'GST106',
}

/**
 * GST/HST Reporting Period
 */
export interface GstHstPeriod {
  /** Reporting period start date */
  startDate: Date;
  /** Reporting period end date */
  endDate: Date;
  /** Filing frequency */
  frequency: 'monthly' | 'quarterly' | 'annual';
  /** Due date for this period */
  dueDate: Date;
}

/**
 * GST/HST Return Data
 */
export interface GstHstReturn {
  /** Business Number (9 digits + 2 letter program identifier + 4 digit reference) */
  businessNumber: string;
  /** Reporting period */
  reportingPeriod: GstHstPeriod;
  /** Return type */
  returnType: GstHstReturnType;

  // Line items from GST34 return
  /** Line 101: Sales and other revenue */
  line101_salesRevenue: number;
  /** Line 103: GST/HST collected or collectible */
  line103_taxCollected: number;
  /** Line 104: Adjustments */
  line104_adjustments?: number;
  /** Line 105: Total GST/HST to remit */
  line105_totalTaxToRemit: number;

  /** Line 106: ITCs for current period */
  line106_currentITCs: number;
  /** Line 107: ITC adjustments */
  line107_itcAdjustments?: number;
  /** Line 108: Total ITCs */
  line108_totalITCs: number;

  /** Line 109: Net tax (remittance or refund) */
  line109_netTax: number;

  /** Line 110: Installment refund claimed */
  line110_installmentRefund?: number;
  /** Line 111: Other credits */
  line111_otherCredits?: number;
  /** Line 112: Total credits */
  line112_totalCredits?: number;

  /** Line 113A: Amount owing */
  line113A_amountOwing?: number;
  /** Line 113B: Refund claimed */
  line113B_refundClaimed?: number;

  /** Line 114: Rebate claimed */
  line114_rebateClaimed?: number;

  // Schedule A (if applicable)
  scheduleA?: GstHstScheduleA;

  /** Declaration - certifier name */
  certifierName: string;
  /** Declaration - certifier capacity */
  certifierCapacity: string;
  /** Declaration date */
  declarationDate: Date;
}

/**
 * GST/HST Schedule A - Adjustments
 */
export interface GstHstScheduleA {
  /** Bad debt recoveries */
  badDebtRecoveries?: number;
  /** Provincial rebates */
  provincialRebates?: number;
  /** Other adjustments */
  otherAdjustments?: Array<{
    description: string;
    amount: number;
  }>;
}

/**
 * CRA Filing Request
 */
export interface CraFilingRequest {
  organizationId: string;
  gstHstReturn: GstHstReturn;
  /** Transmitter information */
  transmitterInfo: {
    name: string;
    efileNumber: string;
    contactPhone: string;
    contactEmail: string;
  };
}

/**
 * CRA Filing Response
 */
export interface CraFilingResponse {
  /** Filing status */
  status: CraFilingStatus;
  /** CRA confirmation number */
  confirmationNumber?: string;
  /** Timestamp of filing */
  filedAt?: Date;
  /** Validation errors if any */
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
  /** Warnings */
  warnings?: Array<{
    code: string;
    message: string;
  }>;
  /** CRA reference number */
  referenceNumber?: string;
}

/**
 * CRA Filing Status Check
 */
export interface CraFilingStatusCheck {
  confirmationNumber: string;
  status: CraFilingStatus;
  submittedAt: Date;
  processedAt?: Date;
  refundAmount?: number;
  paymentAmount?: number;
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

/**
 * CRA Connection Info
 */
export interface CraConnectionInfo {
  organizationId: string;
  businessNumber: string;
  efileNumber: string;
  status: CraConnectionStatus;
  connectedAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
}

/**
 * CRA Connection Status
 */
export enum CraConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  EXPIRED = 'EXPIRED',
  ERROR = 'ERROR',
}

/**
 * CRA Audit Log
 */
export interface CraAuditLog {
  organizationId: string;
  action: CraAuditAction;
  details: Record<string, any>;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
}

/**
 * CRA Audit Action
 */
export enum CraAuditAction {
  CONNECT = 'CONNECT',
  DISCONNECT = 'DISCONNECT',
  VALIDATE_RETURN = 'VALIDATE_RETURN',
  SUBMIT_RETURN = 'SUBMIT_RETURN',
  CHECK_STATUS = 'CHECK_STATUS',
  API_CALL = 'API_CALL',
  ERROR = 'ERROR',
}

/**
 * CRA Validation Result
 */
export interface CraValidationResult {
  valid: boolean;
  errors: Array<{
    code: string;
    message: string;
    field?: string;
    severity: 'error' | 'warning';
  }>;
  warnings?: Array<{
    code: string;
    message: string;
  }>;
}

/**
 * Encrypted CRA Credentials
 */
export interface EncryptedCraCredentials {
  encryptedData: string;
  iv: string;
  authTag: string;
  version: string;
}
