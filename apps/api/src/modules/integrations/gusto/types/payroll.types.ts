/**
 * Gusto Payroll API TypeScript Types
 * Reference: https://docs.gusto.com/embedded-payroll/docs/payrolls
 */

// ==================== Pay Period Types ====================

export enum PayScheduleFrequency {
  WEEKLY = 'Weekly',
  BIWEEKLY = 'Every other week',
  SEMIMONTHLY = 'Twice per month',
  MONTHLY = 'Monthly',
}

export interface GustoPayPeriod {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  payroll_deadline?: string; // YYYY-MM-DD
  check_date?: string; // YYYY-MM-DD
}

export interface GustoPaySchedule {
  uuid: string;
  version: string;
  frequency: PayScheduleFrequency;
  anchor_pay_date?: string;
  anchor_end_of_pay_period?: string;
  day_1?: number; // For semimonthly
  day_2?: number; // For semimonthly
  auto_pilot?: boolean;
}

// ==================== Payroll Status ====================

export enum PayrollStatus {
  DRAFT = 'draft', // Created but not calculated
  CALCULATED = 'calculated', // Calculated but not submitted
  SUBMITTED = 'submitted', // Submitted for processing
  PROCESSING = 'processing', // Being processed
  PROCESSED = 'processed', // Successfully processed
  CANCELLED = 'cancelled', // Cancelled
  FAILED = 'failed', // Processing failed
}

// ==================== Payroll Types ====================

export interface GustoPayrollDetails {
  uuid: string;
  version: string;
  company_uuid: string;
  pay_period: GustoPayPeriod;
  payroll_deadline: string;
  check_date: string;
  processed: boolean;
  processed_date?: string;
  calculated_at?: string;
  payroll_totals?: GustoPayrollTotals;
  employee_compensations: GustoEmployeeCompensation[];
  totals?: GustoPayrollTotals;
  off_cycle?: boolean;
  off_cycle_reason?: string;
}

export interface GustoPayrollTotals {
  company_uuid: string;
  employee_compensations_total: string;
  employer_taxes_total: string;
  employee_taxes_total: string;
  employee_benefits_deductions_total?: string;
  employer_benefits_total?: string;
  net_pay_total: string;
  gross_pay_total: string;
  reimbursements_total: string;
  check_amount: string;
  additional_earnings_total?: string;
}

export interface GustoEmployeeCompensation {
  employee_uuid: string;
  fixed_compensations: GustoFixedCompensation[];
  hourly_compensations: GustoHourlyCompensation[];
  paid_time_off: GustoPaidTimeOffHours[];
}

export interface GustoFixedCompensation {
  name: string;
  amount: string;
  job_uuid: string;
}

export interface GustoHourlyCompensation {
  name: string;
  hours: string;
  job_uuid: string;
  compensation_multiplier: number;
}

export interface GustoPaidTimeOffHours {
  name: string;
  hours: string;
}

// ==================== Pay Stub Types ====================

export interface GustoPayStub {
  employee_uuid: string;
  payroll_uuid: string;
  company_uuid: string;
  pay_period: GustoPayPeriod;
  check_date: string;
  gross_pay: string;
  net_pay: string;
  employee_taxes: GustoTaxLine[];
  employer_taxes: GustoTaxLine[];
  employee_deductions: GustoDeductionLine[];
  employer_contributions: GustoContributionLine[];
  wages: GustoWageLine[];
  reimbursements?: GustoReimbursementLine[];
  employee_benefits?: GustoEmployeeBenefitLine[];
  pdf_url?: string;
}

export interface GustoWageLine {
  name: string;
  hours?: string;
  amount: string;
  rate?: string;
  job_title?: string;
}

export interface GustoTaxLine {
  name: string;
  amount: string;
  employer?: boolean;
}

export interface GustoDeductionLine {
  name: string;
  amount: string;
  pretax?: boolean;
}

export interface GustoContributionLine {
  name: string;
  amount: string;
}

export interface GustoReimbursementLine {
  name: string;
  amount: string;
}

export interface GustoEmployeeBenefitLine {
  name: string;
  employee_deduction?: string;
  employer_contribution?: string;
}

// ==================== Tax Types ====================

export enum TaxType {
  FEDERAL_INCOME = 'Federal Income Tax',
  STATE_INCOME = 'State Income Tax',
  LOCAL_INCOME = 'Local Income Tax',
  SOCIAL_SECURITY = 'Social Security',
  MEDICARE = 'Medicare',
  STATE_UNEMPLOYMENT = 'State Unemployment',
  FEDERAL_UNEMPLOYMENT = 'Federal Unemployment',
  STATE_DISABILITY = 'State Disability Insurance',
}

export interface GustoTaxCalculation {
  employee_uuid: string;
  federal_income_tax: string;
  state_income_tax: string;
  local_income_tax?: string;
  social_security_employee: string;
  social_security_employer: string;
  medicare_employee: string;
  medicare_employer: string;
  state_unemployment_employer?: string;
  federal_unemployment_employer?: string;
  additional_medicare?: string; // For high earners
  total_employee_taxes: string;
  total_employer_taxes: string;
}

export interface GustoTaxWithholding {
  employee_uuid: string;
  version: string;
  federal_withholding: {
    filing_status: 'Single' | 'Married' | 'Married, but withhold at higher Single rate' | 'Head of Household';
    allowances?: number; // Pre-2020
    extra_withholding?: string;
    w4_data_on_file?: boolean;
    two_jobs?: boolean; // Post-2020 W-4
    dependents_amount?: string; // Post-2020 W-4
    other_income?: string; // Post-2020 W-4
    deductions?: string; // Post-2020 W-4
  };
  state_withholding?: {
    filing_status?: string;
    allowances?: number;
    extra_withholding?: string;
    exempt?: boolean;
  };
}

// ==================== Benefits & Deductions Types ====================

export enum BenefitType {
  HEALTH_INSURANCE = 'Health Insurance',
  DENTAL_INSURANCE = 'Dental Insurance',
  VISION_INSURANCE = 'Vision Insurance',
  RETIREMENT_401K = '401(k)',
  RETIREMENT_SIMPLE_IRA = 'Simple IRA',
  RETIREMENT_ROTH_401K = 'Roth 401(k)',
  FSA = 'FSA',
  HSA = 'HSA',
  COMMUTER_BENEFITS = 'Commuter Benefits',
  LIFE_INSURANCE = 'Life Insurance',
  DISABILITY_INSURANCE = 'Disability Insurance',
}

export interface GustoBenefit {
  uuid: string;
  version: string;
  company_uuid: string;
  company_benefit_uuid?: string;
  employee_uuid: string;
  active: boolean;
  benefit_type: BenefitType | string;
  employee_deduction?: string;
  employee_deduction_annual_maximum?: string;
  employer_contribution?: string;
  employer_contribution_annual_maximum?: string;
  elective?: boolean;
  pretax?: boolean;
  catch_up?: boolean;
  deduct_as_percentage?: boolean;
  contribute_as_percentage?: boolean;
}

export interface GustoCompanyBenefit {
  uuid: string;
  version: string;
  company_uuid: string;
  benefit_type: BenefitType | string;
  name: string;
  description?: string;
  responsible_for_employee_w2?: boolean;
  responsible_for_employer_taxes?: boolean;
}

export interface GustoDeduction {
  uuid: string;
  version: string;
  employee_uuid: string;
  active: boolean;
  amount: string;
  description: string;
  annual_maximum?: string;
  deduct_as_percentage: boolean;
  pretax?: boolean;
}

// ==================== Time Off Accrual Types ====================

export interface GustoTimeOffAccrual {
  name: string;
  hours_accrued: string;
  hours_used: string;
  hours_available: string;
  max_hours?: string;
}

// ==================== Bank Account Types ====================

export enum AccountType {
  CHECKING = 'Checking',
  SAVINGS = 'Savings',
}

export interface GustoBankAccount {
  uuid: string;
  version: string;
  employee_uuid?: string;
  routing_number: string;
  account_number: string; // Last 4 digits only in responses
  account_type: AccountType;
  name?: string;
  verified?: boolean;
}

// ==================== Payroll Creation Request ====================

export interface CreatePayrollRequest {
  company_uuid: string;
  start_date?: string; // If not provided, uses next scheduled pay period
  end_date?: string;
  check_date?: string;
  off_cycle?: boolean;
  off_cycle_reason?: string;
  employee_compensations?: Partial<GustoEmployeeCompensation>[];
}

export interface UpdatePayrollRequest {
  version: string;
  employee_compensations?: Partial<GustoEmployeeCompensation>[];
}

export interface CalculatePayrollRequest {
  version: string;
}

export interface SubmitPayrollRequest {
  version: string;
}

export interface CancelPayrollRequest {
  version: string;
}

// ==================== Payroll Processing Result ====================

export interface PayrollProcessingResult {
  success: boolean;
  payroll_uuid: string;
  status: PayrollStatus;
  check_date: string;
  processed_date?: string;
  total_net_pay: string;
  total_gross_pay: string;
  employee_count: number;
  errors?: string[];
  warnings?: string[];
}

// ==================== Historical Payroll Query ====================

export interface PayrollQueryOptions {
  start_date?: string;
  end_date?: string;
  processed?: boolean;
  include_off_cycle?: boolean;
  page?: number;
  per_page?: number;
}

export interface PayrollListResponse {
  payrolls: GustoPayrollDetails[];
  total: number;
  page: number;
  per_page: number;
}

// ==================== Payroll Reversal ====================

export interface GustoPayrollReversal {
  uuid: string;
  payroll_uuid: string;
  reversed_at: string;
  reason?: string;
  reversal_payroll_uuid?: string; // If a reversal payroll was created
}

// ==================== Year-to-Date Totals ====================

export interface GustoYTDTotals {
  employee_uuid: string;
  year: number;
  gross_pay: string;
  net_pay: string;
  federal_income_tax: string;
  state_income_tax: string;
  social_security_tax: string;
  medicare_tax: string;
  retirement_contributions: string;
  benefits_deductions: string;
  reimbursements: string;
}

// ==================== Contractor Payment Types ====================

export interface GustoContractor {
  uuid: string;
  version: string;
  first_name: string;
  last_name: string;
  email?: string;
  business_name?: string;
  ein?: string;
  company_uuid: string;
  is_active: boolean;
  wage_type: 'Hourly' | 'Fixed';
  hourly_rate?: string;
}

export interface GustoContractorPayment {
  uuid: string;
  contractor_uuid: string;
  company_uuid: string;
  date: string;
  payment_method: 'Check' | 'Direct Deposit';
  wage: string;
  reimbursement?: string;
  bonus?: string;
  hours?: string;
}
