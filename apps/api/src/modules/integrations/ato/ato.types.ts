/**
 * ATO Integration Type Definitions
 *
 * TypeScript interfaces for Australian Taxation Office integrations
 */

import {
  STP_EMPLOYMENT_TYPES,
  STP_TAX_TREATMENT,
  BAS_PERIODS,
  ATO_ERROR_CODES,
} from './ato.constants';

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
 * ATO Authentication Credentials
 */
export interface AtoAuthCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
  ramUserId?: string; // Relationship Authorisation Manager User ID
  abn: string;
}

/**
 * ATO OAuth Token Response
 */
export interface AtoTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
  issuedAt: Date;
}

/**
 * ATO API Request Headers
 */
export interface AtoApiHeaders {
  Authorization: string;
  'Content-Type': string;
  'X-ATO-Client-ID': string;
  'X-ATO-Request-ID': string;
  'X-ATO-Correlation-ID'?: string;
}

/**
 * Business Activity Statement (BAS) Label
 */
export interface BasLabel {
  label: string;
  amount: number;
  description?: string;
}

/**
 * BAS GST Calculation
 */
export interface BasGstCalculation {
  g1TotalSales: number;
  g2ExportSales: number;
  g3OtherGstFreeSales: number;
  g4InputTaxedSales: number;
  g7Adjustments?: number;
  g10CapitalPurchases: number;
  g11NonCapitalPurchases: number;
  g13InputTaxedPurchases?: number;
  g14PurchasesWithoutGst?: number;
  g15PrivatePurchases?: number;
  g18Adjustments?: number;
}

/**
 * BAS PAYG Withholding
 */
export interface BasPaygWithholding {
  w1TotalPayments: number;
  w2WithheldFromPayments: number;
  w3WithheldNoAbn?: number;
  w4WithheldInvestmentIncome?: number;
}

/**
 * BAS PAYG Instalments
 */
export interface BasPaygInstalments {
  t1InstalmentIncome?: number;
  t2VariedRate?: number;
  t3VariationReason?: string;
  t4InstalmentAmount: number;
}

/**
 * BAS FBT (Fringe Benefits Tax)
 */
export interface BasFbt {
  f1InstalmentAmount?: number;
  f2EstimatedLiability?: number;
  f3VariedRate?: number;
  f4VariationReason?: string;
}

/**
 * Complete Business Activity Statement
 */
export interface BusinessActivityStatement {
  abn: string;
  period: string; // Format: YYYY-MM or YYYY-Q1/Q2/Q3/Q4 or YYYY
  periodType: keyof typeof BAS_PERIODS;
  dueDate: Date;
  gst?: BasGstCalculation;
  paygWithholding?: BasPaygWithholding;
  paygInstalments?: BasPaygInstalments;
  fbt?: BasFbt;
  additionalLabels?: BasLabel[];
  declarationName: string;
  declarationDate: Date;
}

/**
 * BAS Filing Request
 */
export interface BasFilingRequest {
  organizationId: string;
  abn: string;
  statement: BusinessActivityStatement;
  isDraft?: boolean;
}

/**
 * BAS Filing Response
 */
export interface BasFilingResponse {
  filingId: string;
  status: AtoFilingStatus;
  submittedAt?: Date;
  receiptNumber?: string;
  errors?: AtoError[];
  warnings?: AtoWarning[];
}

/**
 * STP Employee Details
 */
export interface StpEmployee {
  tfn?: string; // Optional if employee hasn't provided TFN
  employeeId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender?: 'M' | 'F' | 'X';
  address?: {
    line1: string;
    line2?: string;
    suburb: string;
    state: string;
    postcode: string;
    country?: string;
  };
}

/**
 * STP Employment Details
 */
export interface StpEmployment {
  employmentType: keyof typeof STP_EMPLOYMENT_TYPES;
  startDate: Date;
  endDate?: Date;
  payrollId: string;
  taxTreatment: keyof typeof STP_TAX_TREATMENT;
  taxFileNumberProvided: boolean;
  claimsTaxFreeThreshold: boolean;
  hasHelpDebt: boolean;
  hasSfssDebt: boolean;
  seniorAustralian?: boolean;
  taxOffsetClaim?: number;
}

/**
 * STP Pay Event Income
 */
export interface StpIncome {
  gross: number;
  paygWithholding: number;
  allowances?: number;
  bonuses?: number;
  commissions?: number;
  directors?: number;
  lumpSumE?: number; // Unused leave on termination
  taxExemptComponent?: number;
}

/**
 * STP Pay Event Deductions
 */
export interface StpDeductions {
  unionFees?: number;
  workplaceGiving?: number;
}

/**
 * STP Superannuation
 */
export interface StpSuperannuation {
  fund: {
    abn: string;
    name: string;
    usi?: string; // Unique Superannuation Identifier
    memberNumber?: string;
  };
  ordinaryTime: number;
  superGuarantee: number;
  salary?: number;
  personalContributions?: number;
}

/**
 * STP Pay Event
 */
export interface StpPayEvent {
  employee: StpEmployee;
  employment: StpEmployment;
  payPeriod: {
    startDate: Date;
    endDate: Date;
    paymentDate: Date;
  };
  income: StpIncome;
  deductions?: StpDeductions;
  superannuation?: StpSuperannuation[];
  ytdValues?: {
    gross: number;
    paygWithholding: number;
    superannuation: number;
  };
}

/**
 * STP Pay Event Submission
 */
export interface StpPayEventSubmission {
  abn: string;
  payPeriod: {
    startDate: Date;
    endDate: Date;
  };
  employees: StpPayEvent[];
}

/**
 * STP Update Event
 */
export interface StpUpdateEvent {
  employee: StpEmployee;
  originalPayPeriod: {
    startDate: Date;
    endDate: Date;
  };
  correctionReason: string;
  updatedFields: Partial<StpPayEvent>;
}

/**
 * STP Update Event Submission
 */
export interface StpUpdateEventSubmission {
  abn: string;
  updates: StpUpdateEvent[];
}

/**
 * STP Finalisation Event
 */
export interface StpFinalisationEvent {
  abn: string;
  financialYear: string; // Format: YYYY-YYYY (e.g., "2023-2024")
  employees: {
    tfn?: string;
    employeeId: string;
    finalised: boolean;
    cessationDate?: Date;
    cessationReason?: 'RESIGNATION' | 'TERMINATION' | 'REDUNDANCY' | 'DEATH' | 'OTHER';
    employmentIncome: {
      gross: number;
      paygWithholding: number;
      allowances?: number;
      lumpSumE?: number;
    };
    superannuation: {
      total: number;
      funds: Array<{
        abn: string;
        amount: number;
      }>;
    };
  }[];
}

/**
 * STP Filing Response
 */
export interface StpFilingResponse {
  filingId: string;
  status: AtoFilingStatus;
  submittedAt?: Date;
  receiptNumber?: string;
  processedEmployees: number;
  errors?: AtoError[];
  warnings?: AtoWarning[];
}

/**
 * TPAR (Taxable Payments Annual Report) Payment
 */
export interface TparPayment {
  abn?: string;
  tfn?: string;
  contractorName: string;
  address: {
    line1: string;
    line2?: string;
    suburb: string;
    state: string;
    postcode: string;
  };
  totalPayments: number;
  gstIncluded: number;
}

/**
 * TPAR Submission
 */
export interface TparSubmission {
  abn: string;
  financialYear: string; // Format: YYYY-YYYY
  industryCode: string;
  payments: TparPayment[];
  declarationName: string;
  declarationDate: Date;
}

/**
 * TPAR Filing Response
 */
export interface TparFilingResponse {
  filingId: string;
  status: AtoFilingStatus;
  submittedAt?: Date;
  receiptNumber?: string;
  processedPayments: number;
  errors?: AtoError[];
  warnings?: AtoWarning[];
}

/**
 * ATO Error
 */
export interface AtoError {
  code: keyof typeof ATO_ERROR_CODES | string;
  message: string;
  field?: string;
  details?: any;
}

/**
 * ATO Warning
 */
export interface AtoWarning {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

/**
 * ATO API Response
 */
export interface AtoApiResponse<T = any> {
  success: boolean;
  data?: T;
  errors?: AtoError[];
  warnings?: AtoWarning[];
  requestId: string;
  timestamp: Date;
}

/**
 * ATO Obligation
 */
export interface AtoObligation {
  abn: string;
  obligationType: 'BAS' | 'IAS' | 'TPAR' | 'STP';
  period: string;
  periodType: string;
  dueDate: Date;
  status: 'DUE' | 'OVERDUE' | 'LODGED' | 'NOT_DUE';
  lodgedDate?: Date;
}

/**
 * ATO Audit Log Entry
 */
export interface AtoAuditLog {
  organizationId: string;
  abn: string;
  action: 'SUBMIT_BAS' | 'SUBMIT_STP' | 'SUBMIT_TPAR' | 'RETRIEVE' | 'AUTH';
  status: 'SUCCESS' | 'FAILURE';
  requestId: string;
  userId?: string;
  timestamp: Date;
  details?: any;
  errors?: AtoError[];
}

/**
 * ABN Lookup Result
 */
export interface AbnLookupResult {
  abn: string;
  abnStatus: 'Active' | 'Cancelled';
  entityName: string;
  entityType: string;
  gstRegistered: boolean;
  gstFromDate?: Date;
  address?: {
    state: string;
    postcode: string;
  };
}
