/**
 * CRA NetFile Shared Types
 * Shared types for CRA integration across frontend and backend
 */

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
 * CRA Connection Status
 */
export enum CraConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  EXPIRED = 'EXPIRED',
  ERROR = 'ERROR',
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
 * GST/HST Filing Frequency
 */
export type GstFilingFrequency = 'monthly' | 'quarterly' | 'annual';

/**
 * GST/HST Reporting Period
 */
export interface GstHstPeriod {
  /** Reporting period start date */
  startDate: Date;
  /** Reporting period end date */
  endDate: Date;
  /** Filing frequency */
  frequency: GstFilingFrequency;
  /** Due date for this period */
  dueDate: Date;
}

/**
 * Schedule A - Adjustments
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

  /** Schedule A (if applicable) */
  scheduleA?: GstHstScheduleA;

  /** Declaration - certifier name */
  certifierName: string;
  /** Declaration - certifier capacity */
  certifierCapacity: string;
  /** Declaration date */
  declarationDate: Date;
}

/**
 * CRA Filing Request
 */
export interface CraFilingRequest {
  organizationId: string;
  gstHstReturn: GstHstReturn;
  transmitterInfo: {
    name: string;
    efileNumber: string;
    contactPhone: string;
    contactEmail: string;
  };
}

/**
 * CRA Filing Error
 */
export interface CraFilingError {
  code: string;
  message: string;
  field?: string;
  severity?: 'error' | 'warning';
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
  /** Processed timestamp */
  processedAt?: Date;
  /** Validation errors if any */
  errors?: CraFilingError[];
  /** Warnings */
  warnings?: Array<{
    code: string;
    message: string;
  }>;
  /** CRA reference number */
  referenceNumber?: string;
  /** Refund amount if applicable */
  refundAmount?: number;
  /** Payment amount if applicable */
  paymentAmount?: number;
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
 * CRA Web Access Code
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
 * CRA Validation Result
 */
export interface CraValidationResult {
  valid: boolean;
  errors: CraFilingError[];
  warnings?: Array<{
    code: string;
    message: string;
  }>;
}

/**
 * CRA Filing History Item
 */
export interface CraFilingHistoryItem {
  id: string;
  organizationId: string;
  businessNumber: string;
  returnType: GstHstReturnType;
  reportingPeriod: GstHstPeriod;
  status: CraFilingStatus;
  confirmationNumber?: string;
  netTax: number;
  submittedAt: Date;
  processedAt?: Date;
}

/**
 * Provincial GST/HST Rates
 */
export interface ProvincialTaxRates {
  provinceCode: string;
  provinceName: string;
  gst: number;
  pst: number;
  hst: number;
  total: number;
}

/**
 * CRA Error Codes
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
 * Helper type for Business Number validation
 */
export type BusinessNumber = string; // Format: 9 digits + 2 letters + 4 digits

/**
 * CRA Constants for Frontend
 */
export const CRA_CONSTANTS = {
  /** Business Number pattern */
  BN_PATTERN: /^\d{9}[A-Z]{2}\d{4}$/,
  /** Business Number length */
  BN_LENGTH: 15,
  /** GST/HST program identifier */
  GST_PROGRAM_ID: 'RT',
} as const;

/**
 * Format Business Number with spaces
 */
export function formatBusinessNumber(bn: string): string {
  const cleaned = bn.replace(/[\s-]/g, '');
  if (cleaned.length === 15) {
    return `${cleaned.slice(0, 9)} ${cleaned.slice(9, 11)} ${cleaned.slice(11)}`;
  }
  return bn;
}

/**
 * Validate Business Number format
 */
export function isValidBusinessNumber(bn: string): boolean {
  const cleaned = bn.replace(/[\s-]/g, '');
  return CRA_CONSTANTS.BN_PATTERN.test(cleaned);
}

/**
 * Calculate GST/HST due date
 * Returns the last day of the month following the reporting period end
 */
export function calculateGstDueDate(periodEnd: Date): Date {
  const dueDate = new Date(periodEnd);
  dueDate.setMonth(dueDate.getMonth() + 1, 1);
  dueDate.setMonth(dueDate.getMonth() + 1, 0);
  return dueDate;
}
