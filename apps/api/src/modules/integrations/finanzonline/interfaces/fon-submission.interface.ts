/**
 * FinanzOnline Submission Interfaces
 * Defines structures for tax submissions to Austrian FinanzOnline
 */

/**
 * VAT return period types
 */
export enum VatPeriodType {
  /** Monthly return */
  MONTHLY = 'MONTHLY',
  /** Quarterly return */
  QUARTERLY = 'QUARTERLY',
  /** Annual return */
  ANNUAL = 'ANNUAL',
}

/**
 * Tax year period
 */
export interface TaxPeriod {
  /** Tax year */
  year: number;
  /** Period type */
  type: VatPeriodType;
  /** Period number (1-12 for monthly, 1-4 for quarterly) */
  period?: number;
  /** Start date */
  startDate: Date;
  /** End date */
  endDate: Date;
}

/**
 * VAT return line item
 */
export interface VatReturnLine {
  /** Line code (Kennzahl) */
  code: string;
  /** Amount in cents */
  amount: number;
  /** Description */
  description?: string;
}

/**
 * VAT return submission data
 */
export interface VatReturnSubmission {
  /** Tax ID (Steuernummer) */
  taxId: string;
  /** VAT ID (UID) */
  vatId?: string;
  /** Tax period */
  period: TaxPeriod;
  /** VAT return lines */
  lines: VatReturnLine[];
  /** Total output VAT */
  totalOutputVat: number;
  /** Total input VAT */
  totalInputVat: number;
  /** Net VAT payable/refundable */
  netVat: number;
  /** Declaration date */
  declarationDate: Date;
  /** Submitter name */
  submitterName?: string;
  /** Submitter phone */
  submitterPhone?: string;
  /** Special remarks */
  remarks?: string;
}

/**
 * Income tax return submission data
 */
export interface IncomeTaxSubmission {
  /** Tax ID (Steuernummer) */
  taxId: string;
  /** Tax year */
  taxYear: number;
  /** Personal information */
  personalInfo: PersonalInfo;
  /** Income details */
  income: IncomeDetails;
  /** Deductions */
  deductions: DeductionDetails;
  /** Special expenses */
  specialExpenses?: SpecialExpense[];
  /** Declaration date */
  declarationDate: Date;
  /** Tax advisor information */
  taxAdvisor?: TaxAdvisorInfo;
}

/**
 * Personal information
 */
export interface PersonalInfo {
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Date of birth */
  dateOfBirth: Date;
  /** Social security number */
  socialSecurityNumber?: string;
  /** Address */
  address: Address;
  /** Marital status */
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
}

/**
 * Address information
 */
export interface Address {
  /** Street and number */
  street: string;
  /** Postal code */
  postalCode: string;
  /** City */
  city: string;
  /** Country code (ISO 3166-1 alpha-2) */
  country: string;
}

/**
 * Income details
 */
export interface IncomeDetails {
  /** Employment income */
  employment?: number;
  /** Self-employment income */
  selfEmployment?: number;
  /** Rental income */
  rental?: number;
  /** Investment income */
  investment?: number;
  /** Other income */
  other?: number;
  /** Total gross income */
  totalGross: number;
}

/**
 * Deduction details
 */
export interface DeductionDetails {
  /** Business expenses */
  businessExpenses?: number;
  /** Home office deduction */
  homeOffice?: number;
  /** Commuting expenses */
  commuting?: number;
  /** Social security contributions */
  socialSecurity?: number;
  /** Insurance premiums */
  insurance?: number;
  /** Total deductions */
  total: number;
}

/**
 * Special expense
 */
export interface SpecialExpense {
  /** Expense type code */
  type: string;
  /** Amount */
  amount: number;
  /** Description */
  description: string;
  /** Supporting documents reference */
  documentsRef?: string;
}

/**
 * Tax advisor information
 */
export interface TaxAdvisorInfo {
  /** Tax advisor number */
  advisorNumber: string;
  /** Advisor name */
  name: string;
  /** Contact email */
  email?: string;
  /** Contact phone */
  phone?: string;
}

/**
 * Submission metadata
 */
export interface SubmissionMetadata {
  /** Internal submission ID */
  submissionId: string;
  /** Organization ID */
  organizationId: string;
  /** User ID who created the submission */
  createdBy: string;
  /** Submission timestamp */
  submittedAt: Date;
  /** FinanzOnline reference ID */
  fonReferenceId?: string;
  /** Submission status */
  status: string;
  /** Environment used */
  environment: 'production' | 'sandbox';
}
