/**
 * Payroll Types for Pay Run Wizard
 * Frontend types mapped from Gusto API backend types
 */

// ==================== Pay Period Types ====================

export enum PayScheduleFrequency {
  WEEKLY = 'Weekly',
  BIWEEKLY = 'Every other week',
  SEMIMONTHLY = 'Twice per month',
  MONTHLY = 'Monthly',
}

export interface PayPeriod {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  payrollDeadline?: string; // YYYY-MM-DD
  checkDate?: string; // YYYY-MM-DD
}

export interface PaySchedule {
  uuid: string;
  version: string;
  frequency: PayScheduleFrequency;
  anchorPayDate?: string;
  autoPilot?: boolean;
}

// ==================== Payroll Status ====================

export enum PayrollStatus {
  DRAFT = 'draft',
  CALCULATED = 'calculated',
  SUBMITTED = 'submitted',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

// ==================== Employee Types ====================

export interface PayrollEmployee {
  employeeUuid: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department?: string;
  compensationType: 'hourly' | 'salary';
  hourlyRate?: string;
  salaryAmount?: string;
  isActive: boolean;
  currentPeriodHours?: number;
}

export interface EmployeeCompensation {
  employeeUuid: string;
  fixedCompensations: FixedCompensation[];
  hourlyCompensations: HourlyCompensation[];
  paidTimeOff: PaidTimeOffHours[];
}

export interface FixedCompensation {
  name: string;
  amount: string;
  jobUuid: string;
}

export interface HourlyCompensation {
  name: string;
  hours: string;
  jobUuid: string;
  compensationMultiplier: number;
}

export interface PaidTimeOffHours {
  name: string;
  hours: string;
}

// ==================== Additions & Deductions ====================

export interface Addition {
  id: string;
  employeeUuid: string;
  type: 'bonus' | 'commission' | 'reimbursement' | 'other';
  description: string;
  amount: string;
  taxable: boolean;
}

export interface Deduction {
  id: string;
  employeeUuid: string;
  type: 'loan' | 'advance' | 'garnishment' | 'other';
  description: string;
  amount: string;
  pretax: boolean;
}

// ==================== Tax Calculation ====================

export interface TaxBreakdown {
  employeeUuid: string;
  federalIncomeTax: string;
  stateIncomeTax: string;
  localIncomeTax?: string;
  socialSecurityEmployee: string;
  socialSecurityEmployer: string;
  medicareEmployee: string;
  medicareEmployer: string;
  stateUnemploymentEmployer?: string;
  federalUnemploymentEmployer?: string;
  additionalMedicare?: string;
  totalEmployeeTaxes: string;
  totalEmployerTaxes: string;
}

export interface PayrollTotals {
  companyUuid: string;
  employeeCompensationsTotal: string;
  employerTaxesTotal: string;
  employeeTaxesTotal: string;
  employeeBenefitsDeductionsTotal?: string;
  employerBenefitsTotal?: string;
  netPayTotal: string;
  grossPayTotal: string;
  reimbursementsTotal: string;
  checkAmount: string;
  additionalEarningsTotal?: string;
}

// ==================== Payroll Details ====================

export interface PayrollDetails {
  uuid: string;
  version: string;
  companyUuid: string;
  payPeriod: PayPeriod;
  payrollDeadline: string;
  checkDate: string;
  processed: boolean;
  processedDate?: string;
  calculatedAt?: string;
  payrollTotals?: PayrollTotals;
  employeeCompensations: EmployeeCompensation[];
  totals?: PayrollTotals;
  offCycle?: boolean;
  offCycleReason?: string;
  status: PayrollStatus;
}

// ==================== Pay Run State ====================

export interface PayRunState {
  // Step 1: Pay Period
  selectedPayPeriod: PayPeriod | null;
  payPeriods: PayPeriod[];

  // Step 2: Employees
  employees: PayrollEmployee[];
  selectedEmployees: string[]; // employee UUIDs

  // Step 3: Hours
  hoursData: Record<string, number>; // employeeUuid -> hours
  ptoData: Record<string, Record<string, number>>; // employeeUuid -> { ptoType: hours }

  // Step 4: Additions & Deductions
  additions: Addition[];
  deductions: Deduction[];

  // Step 5: Tax Preview
  taxBreakdowns: TaxBreakdown[];

  // Current payroll being edited/created
  currentPayroll: PayrollDetails | null;

  // Wizard state
  currentStep: number;
  isLoading: boolean;
  error: string | null;
}

// ==================== API Request/Response Types ====================

export interface CreatePayrollRequest {
  companyUuid: string;
  startDate?: string;
  endDate?: string;
  checkDate?: string;
  offCycle?: boolean;
  offCycleReason?: string;
  employeeCompensations?: Partial<EmployeeCompensation>[];
}

export interface UpdatePayrollRequest {
  version: string;
  employeeCompensations?: Partial<EmployeeCompensation>[];
}

export interface CalculatePayrollRequest {
  version: string;
}

export interface SubmitPayrollRequest {
  version: string;
}

export interface PayrollListResponse {
  payrolls: PayrollDetails[];
  total: number;
  page: number;
  perPage: number;
}

export interface PayrollProcessingResult {
  success: boolean;
  payrollUuid: string;
  status: PayrollStatus;
  checkDate: string;
  processedDate?: string;
  totalNetPay: string;
  totalGrossPay: string;
  employeeCount: number;
  errors?: string[];
  warnings?: string[];
}

// ==================== Helper Types ====================

export interface WizardStep {
  id: number;
  name: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

export const PAY_RUN_STEPS: WizardStep[] = [
  { id: 1, name: 'Pay Period', description: 'Select pay period', isComplete: false, isActive: true },
  { id: 2, name: 'Employees', description: 'Review employees', isComplete: false, isActive: false },
  { id: 3, name: 'Hours', description: 'Enter hours', isComplete: false, isActive: false },
  { id: 4, name: 'Adjustments', description: 'Add/deduct amounts', isComplete: false, isActive: false },
  { id: 5, name: 'Taxes', description: 'Preview taxes', isComplete: false, isActive: false },
  { id: 6, name: 'Review', description: 'Review and submit', isComplete: false, isActive: false },
];
