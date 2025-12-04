/**
 * Employee Onboarding Validation Schemas
 * Zod schemas for form validation
 */

import * as z from 'zod';

// SSN validation (XXX-XX-XXXX format)
const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;

// Routing number validation (9 digits)
const routingNumberRegex = /^\d{9}$/;

// Account number validation (4-17 digits)
const accountNumberRegex = /^\d{4,17}$/;

// Personal Information Schema
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  ssn: z
    .string()
    .regex(ssnRegex, 'SSN must be in format XXX-XX-XXXX')
    .min(1, 'SSN is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  street1: z.string().min(1, 'Street address is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2-letter code'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
});

// Employment Details Schema
export const employmentDetailsSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  startDate: z.string().min(1, 'Start date is required'),
  employmentType: z.enum(['full-time', 'part-time', 'contractor']),
  compensationType: z.enum(['salary', 'hourly']),
  compensationAmount: z
    .number()
    .positive('Compensation must be greater than 0')
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !isNaN(val as number) && val > 0, {
      message: 'Compensation must be a valid positive number',
    }),
  paymentUnit: z.enum(['Hour', 'Week', 'Month', 'Year']),
  flsaStatus: z.enum(['Exempt', 'Nonexempt']),
  workLocationId: z.string().optional(),
});

// Tax Information Schema (W-4)
export const taxInfoSchema = z.object({
  filingStatus: z.enum([
    'single',
    'married_filing_jointly',
    'married_filing_separately',
    'head_of_household',
  ]),
  multipleJobs: z.boolean(),
  dependentsAmount: z.number().min(0).default(0),
  otherIncome: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  extraWithholding: z.number().min(0).default(0),
  claimExemption: z.boolean().default(false),
});

// Direct Deposit Schema
export const directDepositSchema = z
  .object({
    accountType: z.enum(['checking', 'savings']),
    routingNumber: z
      .string()
      .regex(routingNumberRegex, 'Routing number must be 9 digits'),
    accountNumber: z
      .string()
      .regex(accountNumberRegex, 'Account number must be 4-17 digits'),
    accountNumberConfirm: z.string(),
    bankName: z.string().min(1, 'Bank name is required'),
  })
  .refine((data) => data.accountNumber === data.accountNumberConfirm, {
    message: 'Account numbers do not match',
    path: ['accountNumberConfirm'],
  });

// Benefits Schema
export const benefitsSchema = z
  .object({
    enrollInHealthInsurance: z.boolean(),
    healthPlanId: z.string().optional(),
    dependentsCovered: z.number().min(0).optional(),
    enrollIn401k: z.boolean(),
    contributionPercentage: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .or(z.string().optional()),
    contributionAmount: z
      .number()
      .min(0)
      .optional()
      .or(z.string().optional()),
  })
  .refine(
    (data) => {
      if (data.enrollInHealthInsurance && !data.healthPlanId) {
        return false;
      }
      return true;
    },
    {
      message: 'Health plan is required when enrolling in health insurance',
      path: ['healthPlanId'],
    }
  )
  .refine(
    (data) => {
      if (data.enrollIn401k) {
        const hasPercentage = data.contributionPercentage !== undefined && data.contributionPercentage !== '';
        const hasAmount = data.contributionAmount !== undefined && data.contributionAmount !== '';
        return hasPercentage || hasAmount;
      }
      return true;
    },
    {
      message: 'Either contribution percentage or amount is required for 401k enrollment',
      path: ['contributionPercentage'],
    }
  );

// Documents Schema
export const documentsSchema = z.object({
  i9FormId: z.string().optional(),
  w4FormId: z.string().optional(),
  otherDocuments: z.array(z.string()).optional(),
});

// Complete onboarding schema (for final submission)
export const completeOnboardingSchema = z.object({
  personalInfo: personalInfoSchema,
  employmentDetails: employmentDetailsSchema,
  taxInfo: taxInfoSchema,
  directDeposit: directDepositSchema,
  benefits: benefitsSchema,
  documents: documentsSchema,
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
export type EmploymentDetailsFormData = z.infer<typeof employmentDetailsSchema>;
export type TaxInfoFormData = z.infer<typeof taxInfoSchema>;
export type DirectDepositFormData = z.infer<typeof directDepositSchema>;
export type BenefitsFormData = z.infer<typeof benefitsSchema>;
export type DocumentsFormData = z.infer<typeof documentsSchema>;
export type CompleteOnboardingFormData = z.infer<typeof completeOnboardingSchema>;
