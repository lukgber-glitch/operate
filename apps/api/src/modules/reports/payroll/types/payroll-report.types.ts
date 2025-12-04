/**
 * Payroll Report Types
 * Comprehensive type definitions for payroll reporting
 */

// ==================== Report Types ====================

export enum PayrollReportType {
  PAYROLL_SUMMARY = 'payroll_summary',
  EMPLOYEE_EARNINGS = 'employee_earnings',
  TAX_LIABILITY = 'tax_liability',
  BENEFITS_DEDUCTION = 'benefits_deduction',
  YTD_REPORT = 'ytd_report',
  QUARTERLY_TAX = 'quarterly_tax',
  ANNUAL_W2_SUMMARY = 'annual_w2_summary',
  FOUR_OH_ONE_K = '401k_contribution',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
}

export enum ReportDeliveryMethod {
  DOWNLOAD = 'download',
  EMAIL = 'email',
  SCHEDULED = 'scheduled',
}

// ==================== Report Filters ====================

export interface PayrollReportFilters {
  companyUuid: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  employeeUuids?: string[];
  departmentIds?: string[];
  locationIds?: string[];
  payrollUuids?: string[];
}

// ==================== Report Metadata ====================

export interface ReportMetadata {
  reportId: string;
  reportType: PayrollReportType;
  generatedAt: Date;
  generatedBy: string;
  companyUuid: string;
  companyName: string;
  dateRange: {
    start: string;
    end: string;
  };
  filters: PayrollReportFilters;
  format: ReportFormat;
}

// ==================== Payroll Summary Report ====================

export interface PayrollSummaryReport {
  metadata: ReportMetadata;
  summary: PayrollPeriodSummary[];
  totals: PayrollTotals;
}

export interface PayrollPeriodSummary {
  payPeriodStart: string;
  payPeriodEnd: string;
  checkDate: string;
  payrollUuid: string;
  employeeCount: number;
  grossPay: number;
  netPay: number;
  employeeTaxes: number;
  employerTaxes: number;
  employeeDeductions: number;
  employerContributions: number;
  reimbursements: number;
  status: string;
}

export interface PayrollTotals {
  totalGrossPay: number;
  totalNetPay: number;
  totalEmployeeTaxes: number;
  totalEmployerTaxes: number;
  totalEmployeeDeductions: number;
  totalEmployerContributions: number;
  totalReimbursements: number;
  totalPayrollCount: number;
}

// ==================== Employee Earnings Report ====================

export interface EmployeeEarningsReport {
  metadata: ReportMetadata;
  employees: EmployeeEarningsDetail[];
  totals: EmployeeEarningsTotals;
}

export interface EmployeeEarningsDetail {
  employeeUuid: string;
  employeeName: string;
  employeeId: string;
  department?: string;
  jobTitle?: string;
  earnings: {
    regularPay: number;
    overtimePay: number;
    doublePay: number;
    bonus: number;
    commission: number;
    paidTimeOff: number;
    other: number;
    grossPay: number;
  };
  deductions: {
    federalIncomeTax: number;
    stateTax: number;
    socialSecurity: number;
    medicare: number;
    retirement401k: number;
    healthInsurance: number;
    dentalInsurance: number;
    visionInsurance: number;
    other: number;
    totalDeductions: number;
  };
  netPay: number;
  ytdGrossPay: number;
  ytdNetPay: number;
}

export interface EmployeeEarningsTotals {
  totalEmployees: number;
  totalRegularPay: number;
  totalOvertimePay: number;
  totalBonuses: number;
  totalCommissions: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
}

// ==================== Tax Liability Report ====================

export interface TaxLiabilityReport {
  metadata: ReportMetadata;
  taxLiabilities: TaxLiabilityDetail[];
  summary: TaxLiabilitySummary;
}

export interface TaxLiabilityDetail {
  payPeriodStart: string;
  payPeriodEnd: string;
  checkDate: string;
  federal: {
    incomeTax: number;
    socialSecurityEmployee: number;
    socialSecurityEmployer: number;
    medicareEmployee: number;
    medicareEmployer: number;
    additionalMedicare: number;
    futa: number;
    totalFederal: number;
  };
  state: {
    incomeTax: number;
    unemploymentTax: number;
    disabilityInsurance: number;
    totalState: number;
  };
  local?: {
    incomeTax: number;
    totalLocal: number;
  };
  totalTaxLiability: number;
}

export interface TaxLiabilitySummary {
  totalFederalIncomeTax: number;
  totalSocialSecurity: number;
  totalMedicare: number;
  totalFUTA: number;
  totalStateIncomeTax: number;
  totalSUTA: number;
  totalLocalTax: number;
  grandTotalTaxLiability: number;
}

// ==================== 401(k) Contribution Report ====================

export interface FourOhOneKReport {
  metadata: ReportMetadata;
  contributions: FourOhOneKContribution[];
  summary: FourOhOneKSummary;
}

export interface FourOhOneKContribution {
  employeeUuid: string;
  employeeName: string;
  employeeId: string;
  socialSecurityNumber?: string; // Masked: XXX-XX-1234
  employeeContribution: {
    traditional: number;
    roth: number;
    catchUp: number;
    total: number;
  };
  employerMatch: {
    amount: number;
    percentage: number;
  };
  ytdContributions: {
    employee: number;
    employer: number;
    total: number;
  };
  vestingPercentage: number;
  vestedAmount: number;
}

export interface FourOhOneKSummary {
  totalParticipants: number;
  totalEmployeeContributions: number;
  totalEmployerMatch: number;
  totalContributions: number;
  ytdTotalContributions: number;
  averageContributionRate: number;
}

// ==================== Benefits Deduction Report ====================

export interface BenefitsDeductionReport {
  metadata: ReportMetadata;
  deductions: BenefitsDeductionDetail[];
  summary: BenefitsDeductionSummary;
}

export interface BenefitsDeductionDetail {
  employeeUuid: string;
  employeeName: string;
  employeeId: string;
  healthInsurance: {
    medical: number;
    dental: number;
    vision: number;
    total: number;
  };
  retirement: {
    traditional401k: number;
    roth401k: number;
    total: number;
  };
  flexibleSpendingAccounts: {
    healthcare: number;
    dependentCare: number;
    total: number;
  };
  other: {
    lifeInsurance: number;
    disabilityInsurance: number;
    hsa: number;
    commuterBenefits: number;
    total: number;
  };
  totalDeductions: number;
  ytdDeductions: number;
}

export interface BenefitsDeductionSummary {
  totalEmployees: number;
  totalHealthInsurance: number;
  totalRetirement: number;
  totalFSA: number;
  totalOther: number;
  grandTotalDeductions: number;
}

// ==================== YTD Report ====================

export interface YTDReport {
  metadata: ReportMetadata;
  employees: YTDEmployeeDetail[];
  totals: YTDTotals;
}

export interface YTDEmployeeDetail {
  employeeUuid: string;
  employeeName: string;
  employeeId: string;
  department?: string;
  ytdEarnings: {
    regularPay: number;
    overtimePay: number;
    bonus: number;
    commission: number;
    paidTimeOff: number;
    reimbursements: number;
    grossPay: number;
  };
  ytdTaxes: {
    federalIncomeTax: number;
    socialSecurity: number;
    medicare: number;
    stateIncomeTax: number;
    localTax: number;
    totalTaxes: number;
  };
  ytdDeductions: {
    retirement401k: number;
    healthInsurance: number;
    dentalInsurance: number;
    visionInsurance: number;
    fsa: number;
    hsa: number;
    other: number;
    totalDeductions: number;
  };
  ytdNetPay: number;
  payrollsProcessed: number;
}

export interface YTDTotals {
  totalEmployees: number;
  totalGrossPay: number;
  totalTaxes: number;
  totalDeductions: number;
  totalNetPay: number;
  totalPayrollsProcessed: number;
}

// ==================== Quarterly Tax Report (Form 941) ====================

export interface QuarterlyTaxReport {
  metadata: ReportMetadata;
  quarter: number;
  year: number;
  form941Data: Form941Data;
}

export interface Form941Data {
  employerInfo: {
    ein: string;
    legalName: string;
    tradeName?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  quarterInfo: {
    quarter: number;
    year: number;
    startDate: string;
    endDate: string;
  };
  wages: {
    numberOfEmployees: number;
    totalWages: number;
    taxableWages: number;
    federalIncomeTaxWithheld: number;
  };
  socialSecurityAndMedicare: {
    taxableWages: number;
    socialSecurityTax: number;
    medicareWages: number;
    medicareTax: number;
    additionalMedicareTax: number;
  };
  taxLiability: {
    totalTaxes: number;
    totalDeposits: number;
    balanceDue: number;
    overpayment: number;
  };
  monthlyLiability: {
    month1: number;
    month2: number;
    month3: number;
    total: number;
  };
}

// ==================== Annual W-2 Summary Report ====================

export interface AnnualW2SummaryReport {
  metadata: ReportMetadata;
  year: number;
  employees: W2SummaryDetail[];
  totals: W2SummaryTotals;
}

export interface W2SummaryDetail {
  employeeUuid: string;
  employeeName: string;
  employeeId: string;
  socialSecurityNumber?: string; // Masked
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  w2Data: {
    box1_wages: number; // Wages, tips, other compensation
    box2_federalIncomeTax: number;
    box3_socialSecurityWages: number;
    box4_socialSecurityTax: number;
    box5_medicareWages: number;
    box6_medicareTax: number;
    box7_socialSecurityTips: number;
    box8_allocatedTips: number;
    box10_dependentCareBenefits: number;
    box11_nonqualifiedPlans: number;
    box12_codes: W2Box12Code[];
    box13_flags: W2Box13Flags;
    box14_other?: W2Box14Item[];
    stateInfo?: W2StateInfo[];
    localInfo?: W2LocalInfo[];
  };
}

export interface W2Box12Code {
  code: string; // D, DD, E, G, etc.
  amount: number;
  description: string;
}

export interface W2Box13Flags {
  statutoryEmployee: boolean;
  retirementPlan: boolean;
  thirdPartySickPay: boolean;
}

export interface W2Box14Item {
  description: string;
  amount: number;
}

export interface W2StateInfo {
  state: string;
  stateIdNumber: string;
  stateWages: number;
  stateIncomeTax: number;
}

export interface W2LocalInfo {
  locality: string;
  localWages: number;
  localIncomeTax: number;
}

export interface W2SummaryTotals {
  totalEmployees: number;
  totalWages: number;
  totalFederalIncomeTax: number;
  totalSocialSecurityWages: number;
  totalSocialSecurityTax: number;
  totalMedicareWages: number;
  totalMedicareTax: number;
}

// ==================== Report Generation Options ====================

export interface ReportGenerationOptions {
  format: ReportFormat;
  includeCharts?: boolean;
  includeDetailedBreakdown?: boolean;
  groupBy?: 'employee' | 'department' | 'location' | 'pay-period';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pageSize?: 'letter' | 'legal' | 'a4';
  orientation?: 'portrait' | 'landscape';
  includeConfidential?: boolean; // SSN, etc.
}

// ==================== Report Schedule ====================

export interface ReportSchedule {
  id: string;
  reportType: PayrollReportType;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  monthOfYear?: number; // 1-12 for annually
  recipients: string[]; // Email addresses
  format: ReportFormat;
  filters: PayrollReportFilters;
  enabled: boolean;
  nextRunDate: Date;
  lastRunDate?: Date;
}

// ==================== Report Cache ====================

export interface CachedReport {
  cacheKey: string;
  reportType: PayrollReportType;
  filters: PayrollReportFilters;
  data: any;
  generatedAt: Date;
  expiresAt: Date;
  format: ReportFormat;
  sizeBytes: number;
}
