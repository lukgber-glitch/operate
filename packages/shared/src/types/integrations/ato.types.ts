/**
 * Shared ATO Integration Types
 *
 * Type definitions for Australian Taxation Office integrations
 * Shared between frontend and backend
 */

/**
 * ATO Filing Status
 */
export enum AtoFilingStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
}

/**
 * ATO Report Type
 */
export enum AtoReportType {
  BAS = 'BAS',
  STP_PAY_EVENT = 'STP_PAY_EVENT',
  STP_UPDATE_EVENT = 'STP_UPDATE_EVENT',
  STP_FINALISATION = 'STP_FINALISATION',
  TPAR = 'TPAR',
}

/**
 * BAS Period Type
 */
export enum BasPeriodType {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

/**
 * STP Employment Type
 */
export enum StpEmploymentType {
  FULL_TIME = 'F',
  PART_TIME = 'P',
  CASUAL = 'C',
  LABOUR_HIRE = 'L',
  DEATH_BENEFICIARY = 'D',
  SUPERANNUATION = 'S',
}

/**
 * ATO Connection Status
 */
export interface AtoConnectionStatus {
  connected: boolean;
  abn: string;
  lastSync?: Date;
  tokenExpiry?: Date;
  errors?: string[];
}

/**
 * ATO Filing Summary
 */
export interface AtoFilingSummary {
  filingId: string;
  reportType: AtoReportType;
  status: AtoFilingStatus;
  period?: string;
  submittedAt?: Date;
  receiptNumber?: string;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

/**
 * BAS Summary for Display
 */
export interface BasSummaryDisplay {
  period: string;
  periodType: BasPeriodType;
  dueDate: Date;
  status: AtoFilingStatus;
  gstPayable?: number;
  paygWithholding?: number;
  totalAmount?: number;
  lodgedDate?: Date;
}

/**
 * STP Submission Summary
 */
export interface StpSubmissionSummary {
  filingId: string;
  payPeriod: {
    startDate: Date;
    endDate: Date;
  };
  employeeCount: number;
  totalGross: number;
  totalWithholding: number;
  totalSuperannuation: number;
  status: AtoFilingStatus;
  submittedAt?: Date;
}

/**
 * TPAR Summary
 */
export interface TparSummary {
  filingId: string;
  financialYear: string;
  industryCode: string;
  contractorCount: number;
  totalPayments: number;
  totalGst: number;
  status: AtoFilingStatus;
  lodgedDate?: Date;
}

/**
 * ATO Obligation Display
 */
export interface AtoObligationDisplay {
  type: 'BAS' | 'IAS' | 'TPAR' | 'STP';
  period: string;
  dueDate: Date;
  status: 'DUE' | 'OVERDUE' | 'LODGED' | 'NOT_DUE';
  lodgedDate?: Date;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * ATO Dashboard Stats
 */
export interface AtoDashboardStats {
  obligations: {
    total: number;
    due: number;
    overdue: number;
    lodged: number;
  };
  filings: {
    thisMonth: number;
    thisQuarter: number;
    thisYear: number;
  };
  recentSubmissions: AtoFilingSummary[];
  upcomingDeadlines: AtoObligationDisplay[];
}
