/**
 * ELSTER Submission Interfaces
 * Defines submission data structures for various tax forms
 */

/**
 * ELSTER submission types
 */
export enum ElsterSubmissionType {
  /** Umsatzsteuervoranmeldung (VAT return) */
  VAT_RETURN = 'UStVA',
  /** Einkommensteuererklärung (Income tax return) */
  INCOME_TAX = 'ESt',
  /** Lohnsteueranmeldung (Employee tax) */
  EMPLOYEE_TAX = 'Lohn',
  /** Gewerbesteuererklärung (Trade tax) */
  TRADE_TAX = 'GewSt',
  /** Körperschaftsteuererklärung (Corporate tax) */
  CORPORATE_TAX = 'KSt',
}

/**
 * Base submission interface
 */
export interface ElsterBaseSubmission {
  /** Submission type */
  type: ElsterSubmissionType;

  /** Organization ID */
  organizationId: string;

  /** Tax ID (Steuernummer) */
  taxId: string;

  /** Tax year */
  taxYear: number;

  /** Test submission flag */
  testSubmission: boolean;

  /** Created by user ID */
  createdBy: string;

  /** Submission timestamp */
  submittedAt?: Date;
}

/**
 * VAT return submission data (Umsatzsteuervoranmeldung)
 */
export interface VATReturnSubmission extends ElsterBaseSubmission {
  type: ElsterSubmissionType.VAT_RETURN;

  /** Tax period (quarter: 'Q1', 'Q2', 'Q3', 'Q4' or month: '01'-'12') */
  taxPeriod: string;

  /** Taxable sales at 19% (Kz 81) */
  taxableSales19: number;

  /** VAT at 19% (Kz 81) */
  vat19: number;

  /** Taxable sales at 7% (Kz 86) */
  taxableSales7: number;

  /** VAT at 7% (Kz 86) */
  vat7: number;

  /** Intra-community acquisitions (Kz 91) */
  intraCommunityAcquisitions: number;

  /** VAT on intra-community acquisitions (Kz 91) */
  vatIntraCommunity: number;

  /** Input tax deduction (Kz 66) */
  inputTaxDeduction: number;

  /** Other taxable sales */
  otherTaxableSales?: number;

  /** Other input tax */
  otherInputTax?: number;

  /** Total VAT payable/refundable (Kz 83) */
  totalVat: number;

  /** Previous advance payments */
  previousAdvancePayments?: number;

  /** Special circumstances note */
  specialCircumstances?: string;
}

/**
 * Income tax return submission data (Einkommensteuererklärung)
 */
export interface IncomeTaxSubmission extends ElsterBaseSubmission {
  type: ElsterSubmissionType.INCOME_TAX;

  /** Taxpayer information */
  taxpayer: {
    /** First name */
    firstName: string;

    /** Last name */
    lastName: string;

    /** Date of birth */
    dateOfBirth: Date;

    /** Tax ID (Identifikationsnummer) */
    taxId: string;

    /** Address */
    address: {
      street: string;
      houseNumber: string;
      postalCode: string;
      city: string;
    };
  };

  /** Spouse information (if married filing jointly) */
  spouse?: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    taxId: string;
  };

  /** Income from employment */
  employmentIncome: number;

  /** Income from self-employment */
  selfEmploymentIncome?: number;

  /** Capital income */
  capitalIncome?: number;

  /** Rental income */
  rentalIncome?: number;

  /** Other income */
  otherIncome?: number;

  /** Special expenses deductions */
  specialExpenses?: number;

  /** Extraordinary expenses */
  extraordinaryExpenses?: number;

  /** Business expenses */
  businessExpenses?: number;

  /** Church tax applicable */
  churchTaxApplicable: boolean;

  /** Supporting documents attached */
  supportingDocuments: string[];
}

/**
 * Employee tax submission data (Lohnsteueranmeldung)
 */
export interface EmployeeTaxSubmission extends ElsterBaseSubmission {
  type: ElsterSubmissionType.EMPLOYEE_TAX;

  /** Tax period (month: '01'-'12') */
  taxPeriod: string;

  /** Employer information */
  employer: {
    /** Company name */
    companyName: string;

    /** Tax number */
    taxNumber: string;

    /** Operating number (Betriebsnummer) */
    operatingNumber: string;
  };

  /** Total gross wages */
  totalGrossWages: number;

  /** Total wage tax withheld */
  totalWageTax: number;

  /** Solidarity surcharge */
  solidaritySurcharge: number;

  /** Church tax withheld */
  churchTax?: number;

  /** Number of employees */
  numberOfEmployees: number;

  /** Social security contributions */
  socialSecurityContributions: {
    /** Health insurance */
    healthInsurance: number;

    /** Pension insurance */
    pensionInsurance: number;

    /** Unemployment insurance */
    unemploymentInsurance: number;

    /** Long-term care insurance */
    careInsurance: number;
  };

  /** Special payments (bonuses, etc.) */
  specialPayments?: number;
}

/**
 * Submission audit trail
 */
export interface ElsterSubmissionAudit {
  /** Audit entry ID */
  id: string;

  /** Organization ID */
  organizationId: string;

  /** Submission type */
  submissionType: ElsterSubmissionType;

  /** Transfer ticket */
  transferTicket: string;

  /** Submission status */
  status: string;

  /** Submitted by user */
  submittedBy: string;

  /** Submission timestamp */
  submittedAt: Date;

  /** Response received at */
  respondedAt?: Date;

  /** Request payload (sanitized) */
  requestPayload: Record<string, any>;

  /** Response payload (sanitized) */
  responsePayload?: Record<string, any>;

  /** IP address */
  ipAddress: string;

  /** User agent */
  userAgent: string;

  /** Errors encountered */
  errors?: string[];
}
