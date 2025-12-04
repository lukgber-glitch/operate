/**
 * Employee Onboarding Types
 * Types for the multi-step employee onboarding wizard
 */

export interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  ssn: string;
  dateOfBirth: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface EmploymentDetails {
  jobTitle: string;
  department: string;
  startDate: string;
  employmentType: 'full-time' | 'part-time' | 'contractor';
  compensationType: 'salary' | 'hourly';
  compensationAmount: number;
  paymentUnit: 'Hour' | 'Week' | 'Month' | 'Year';
  flsaStatus: 'Exempt' | 'Nonexempt';
  workLocationId?: string;
}

export interface TaxInfo {
  filingStatus: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household';
  multipleJobs: boolean;
  dependentsAmount: number;
  otherIncome: number;
  deductions: number;
  extraWithholding: number;
  claimExemption: boolean;
}

export interface DirectDeposit {
  accountType: 'checking' | 'savings';
  routingNumber: string;
  accountNumber: string;
  accountNumberConfirm: string;
  bankName: string;
}

export interface Benefits {
  enrollInHealthInsurance: boolean;
  healthPlanId?: string;
  dependentsCovered?: number;
  enrollIn401k: boolean;
  contributionPercentage?: number;
  contributionAmount?: number;
}

export interface Documents {
  i9FormId?: string;
  w4FormId?: string;
  otherDocuments?: string[];
}

export interface EmployeeOnboardingData {
  personalInfo?: PersonalInfo;
  employmentDetails?: EmploymentDetails;
  taxInfo?: TaxInfo;
  directDeposit?: DirectDeposit;
  benefits?: Benefits;
  documents?: Documents;
}

export type OnboardingStep =
  | 'personal-info'
  | 'employment-details'
  | 'tax-info'
  | 'direct-deposit'
  | 'benefits'
  | 'documents'
  | 'review';

export interface StepConfig {
  id: OnboardingStep;
  title: string;
  description: string;
  isOptional?: boolean;
}

export const ONBOARDING_STEPS: StepConfig[] = [
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Basic personal details',
  },
  {
    id: 'employment-details',
    title: 'Employment Details',
    description: 'Job title and compensation',
  },
  {
    id: 'tax-info',
    title: 'Tax Information',
    description: 'W-4 withholding details',
  },
  {
    id: 'direct-deposit',
    title: 'Direct Deposit',
    description: 'Bank account information',
  },
  {
    id: 'benefits',
    title: 'Benefits Selection',
    description: 'Health insurance and 401k',
    isOptional: true,
  },
  {
    id: 'documents',
    title: 'Document Upload',
    description: 'Required forms and documents',
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Confirm all information',
  },
];
