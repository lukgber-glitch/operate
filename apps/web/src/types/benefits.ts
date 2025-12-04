/**
 * Benefits Types for Benefits Enrollment System
 * Covers health insurance, 401k, life insurance, HSA/FSA, and dependents
 */

// ==================== Benefit Plan Types ====================

export enum BenefitType {
  HEALTH = 'health',
  DENTAL = 'dental',
  VISION = 'vision',
  LIFE = 'life',
  RETIREMENT = 'retirement',
  HSA = 'hsa',
  FSA = 'fsa',
  DISABILITY_SHORT = 'disability_short',
  DISABILITY_LONG = 'disability_long',
}

export enum BenefitStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  WAIVED = 'waived',
  TERMINATED = 'terminated',
  SUSPENDED = 'suspended',
}

export enum CoverageLevel {
  EMPLOYEE_ONLY = 'employee_only',
  EMPLOYEE_SPOUSE = 'employee_spouse',
  EMPLOYEE_CHILDREN = 'employee_children',
  FAMILY = 'family',
}

// ==================== Plan Details ====================

export interface BenefitPlan {
  id: string;
  name: string;
  type: BenefitType;
  provider: string;
  description: string;
  coverageLevels: CoverageLevel[];
  employeeMonthlyPremium: Record<CoverageLevel, number>;
  employerMonthlyContribution: Record<CoverageLevel, number>;
  deductible?: Record<CoverageLevel, number>;
  outOfPocketMax?: Record<CoverageLevel, number>;
  coInsurance?: number; // e.g., 80 = 80% covered by insurance
  copay?: {
    primaryCare?: number;
    specialist?: number;
    urgentCare?: number;
    emergencyRoom?: number;
  };
  features: string[];
  networkType?: 'PPO' | 'HMO' | 'EPO' | 'POS';
  isActive: boolean;
  enrollmentPeriod?: {
    startDate: string;
    endDate: string;
  };
}

// ==================== Health Insurance ====================

export interface HealthInsurancePlan extends BenefitPlan {
  type: BenefitType.HEALTH;
  prescriptionCoverage: {
    generic: number;
    brandName: number;
    specialty: number;
  };
  preventiveCare: boolean;
}

export interface DentalPlan extends BenefitPlan {
  type: BenefitType.DENTAL;
  preventive: number; // % coverage
  basic: number; // % coverage
  major: number; // % coverage
  orthodontia?: number; // % coverage
  annualMaximum: number;
}

export interface VisionPlan extends BenefitPlan {
  type: BenefitType.VISION;
  examCoverage: number;
  frameAllowance: number;
  contactLensAllowance: number;
  frequency: {
    exam: string; // e.g., "12 months"
    lenses: string;
    frames: string;
  };
}

// ==================== Retirement (401k) ====================

export interface RetirementPlan extends BenefitPlan {
  type: BenefitType.RETIREMENT;
  contributionLimits: {
    annual: number;
    catchUp?: number; // for age 50+
  };
  employerMatch: {
    percentage: number;
    upToPercentage: number;
  };
  vestingSchedule: {
    years: number;
    percentage: number;
  }[];
  investmentOptions: InvestmentOption[];
}

export interface InvestmentOption {
  id: string;
  name: string;
  ticker?: string;
  type: 'stock' | 'bond' | 'mixed' | 'target_date' | 'money_market';
  expenseRatio: number;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RetirementContribution {
  contributionType: 'percentage' | 'fixed';
  contributionPercentage?: number; // % of salary
  contributionAmount?: number; // fixed dollar amount per paycheck
  rothContribution: boolean;
  investmentAllocations: {
    optionId: string;
    percentage: number;
  }[];
}

// ==================== Life Insurance ====================

export interface LifeInsurancePlan extends BenefitPlan {
  type: BenefitType.LIFE;
  basicCoverage: number; // e.g., 1x annual salary
  supplementalOptions: number[]; // e.g., [50000, 100000, 250000]
  maxCoverage: number;
  beneficiaryRequired: boolean;
  medicalExamRequired: boolean;
  ageRestrictions?: {
    min: number;
    max: number;
  };
}

export interface Beneficiary {
  id?: string;
  firstName: string;
  lastName: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  dateOfBirth: string;
  ssn?: string;
  percentage: number;
  isPrimary: boolean;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

// ==================== HSA/FSA ====================

export interface HSAPlan extends BenefitPlan {
  type: BenefitType.HSA;
  annualContributionLimits: {
    individual: number;
    family: number;
    catchUp: number; // for age 55+
  };
  employerContribution?: number;
  minimumBalance?: number;
  investmentThreshold?: number;
  rollover: boolean;
}

export interface FSAPlan extends BenefitPlan {
  type: BenefitType.FSA;
  annualContributionLimits: {
    healthcare: number;
    dependentCare: number;
  };
  gracePeriod?: number; // days
  carryoverAmount?: number;
  rollover: false; // FSA doesn't rollover (use it or lose it)
}

// ==================== Dependents ====================

export interface Dependent {
  id?: string;
  firstName: string;
  lastName: string;
  relationship: 'spouse' | 'child' | 'domestic_partner';
  dateOfBirth: string;
  ssn?: string;
  gender?: 'male' | 'female' | 'other';
  isStudent?: boolean;
  isDisabled?: boolean;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

// ==================== Employee Enrollment ====================

export interface EmployeeBenefitEnrollment {
  id: string;
  employeeId: string;
  planId: string;
  benefitType: BenefitType;
  status: BenefitStatus;
  coverageLevel: CoverageLevel;
  startDate: string;
  endDate?: string;
  dependents?: string[]; // dependent IDs
  beneficiaries?: Beneficiary[];
  retirementContribution?: RetirementContribution;
  hsaContribution?: number;
  fsaHealthcareContribution?: number;
  fsaDependentCareContribution?: number;
  costPerPayPeriod: number;
  employeeMonthlyPremium: number;
  employerMonthlyContribution: number;
  enrolledAt: string;
  updatedAt?: string;
  waiveReason?: string;
}

// ==================== Enrollment Period ====================

export interface EnrollmentPeriod {
  id: string;
  name: string;
  type: 'open' | 'new_hire' | 'qualifying_event';
  startDate: string;
  endDate: string;
  eligibleEmployeeIds?: string[];
  description: string;
  isActive: boolean;
}

// ==================== Enrollment Summary ====================

export interface EnrollmentSummary {
  employeeId: string;
  enrollmentPeriodId: string;
  enrollments: EmployeeBenefitEnrollment[];
  dependents: Dependent[];
  totalMonthlyPremium: number;
  totalEmployerContribution: number;
  totalCostPerPaycheck: number;
  payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  effectiveDate: string;
  isComplete: boolean;
  submittedAt?: string;
}

// ==================== Wizard State ====================

export interface BenefitsEnrollmentState {
  // Step 1: Employee info & eligibility
  employeeId: string;
  enrollmentPeriod: EnrollmentPeriod | null;

  // Step 2: Health insurance
  healthPlan: string | null; // plan ID
  healthCoverageLevel: CoverageLevel | null;
  dentalPlan: string | null;
  dentalCoverageLevel: CoverageLevel | null;
  visionPlan: string | null;
  visionCoverageLevel: CoverageLevel | null;

  // Step 3: 401k
  retirementPlan: string | null;
  retirementContribution: RetirementContribution | null;

  // Step 4: Life insurance
  lifePlan: string | null;
  supplementalLifeCoverage?: number;
  beneficiaries: Beneficiary[];

  // Step 5: HSA/FSA
  hsaPlan: string | null;
  hsaContribution?: number;
  fsaPlan: string | null;
  fsaHealthcareContribution?: number;
  fsaDependentCareContribution?: number;

  // Step 6: Dependents
  dependents: Dependent[];

  // Navigation
  currentStep: number;
  completedSteps: number[];
  isLoading: boolean;
  error: string | null;
}

// ==================== API Types ====================

export interface GetBenefitPlansRequest {
  benefitType?: BenefitType;
  isActive?: boolean;
}

export interface GetBenefitPlansResponse {
  plans: BenefitPlan[];
  total: number;
}

export interface EnrollBenefitRequest {
  employeeId: string;
  planId: string;
  coverageLevel: CoverageLevel;
  dependentIds?: string[];
  beneficiaries?: Beneficiary[];
  retirementContribution?: RetirementContribution;
  hsaContribution?: number;
  fsaHealthcareContribution?: number;
  fsaDependentCareContribution?: number;
  effectiveDate: string;
}

export interface UpdateEnrollmentRequest extends Partial<EnrollBenefitRequest> {
  enrollmentId: string;
}

export interface WaiveBenefitRequest {
  employeeId: string;
  benefitType: BenefitType;
  reason: string;
}

export interface SubmitEnrollmentRequest {
  employeeId: string;
  enrollmentPeriodId: string;
  enrollments: EnrollBenefitRequest[];
  dependents: Dependent[];
}

export interface GetEnrollmentSummaryResponse {
  summary: EnrollmentSummary;
  availablePlans: BenefitPlan[];
}

// ==================== Helper Types ====================

export interface BenefitsComparisonData {
  plans: BenefitPlan[];
  selectedPlans: string[];
  comparisonFields: string[];
}

export interface CostCalculation {
  planId: string;
  coverageLevel: CoverageLevel;
  monthlyPremium: number;
  employerContribution: number;
  employeeCost: number;
  annualCost: number;
  costPerPaycheck: number;
  payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
}

export const ENROLLMENT_STEPS = [
  { id: 1, name: 'Overview', description: 'Benefits overview' },
  { id: 2, name: 'Health', description: 'Medical, dental, vision' },
  { id: 3, name: 'Retirement', description: '401(k) setup' },
  { id: 4, name: 'Life Insurance', description: 'Coverage & beneficiaries' },
  { id: 5, name: 'HSA/FSA', description: 'Health savings' },
  { id: 6, name: 'Dependents', description: 'Add dependents' },
  { id: 7, name: 'Review', description: 'Review & submit' },
];
