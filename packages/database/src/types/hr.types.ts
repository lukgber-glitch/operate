/**
 * HR TypeScript Types
 *
 * Type definitions for HR-related entities exported from Prisma schema.
 * These types are used across the application for type safety.
 */

import type {
  Employee,
  EmploymentContract,
  LeaveEntitlement,
  LeaveRequest,
  TimeEntry,
  PayrollPeriod,
  Payslip,
  SocialSecurityRegistration,
  HrAuditLog,
  Gender,
  EmploymentStatus,
  ContractType,
  SalaryPeriod,
  LeaveType,
  LeaveRequestStatus,
  TimeEntryStatus,
  PayrollStatus,
  SocialSecurityType,
  SSRegistrationStatus,
} from '@prisma/client';

export type {
  Employee,
  EmploymentContract,
  LeaveEntitlement,
  LeaveRequest,
  TimeEntry,
  PayrollPeriod,
  Payslip,
  SocialSecurityRegistration,
  HrAuditLog,
  Gender,
  EmploymentStatus,
  ContractType,
  SalaryPeriod,
  LeaveType,
  LeaveRequestStatus,
  TimeEntryStatus,
  PayrollStatus,
  SocialSecurityType,
  SSRegistrationStatus,
};

// ============================================================================
// CUSTOM TYPES WITH RELATIONS
// ============================================================================

/**
 * Employee with all related data
 */
export interface EmployeeWithRelations {
  id: string;
  orgId: string;
  userId: string | null;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: Date;
  gender: string | null;
  nationality: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  countryCode: string;
  taxId: string | null;
  taxClass: string | null;
  churchTax: boolean;
  bankName: string | null;
  iban: string | null;
  bic: string | null;
  status: string;
  hireDate: Date;
  terminationDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  contracts?: EmploymentContract[];
  leaveEntitlements?: LeaveEntitlement[];
  leaveRequests?: LeaveRequest[];
  timeEntries?: TimeEntry[];
  payslips?: Payslip[];
  socialSecurityRegs?: SocialSecurityRegistration[];
}

/**
 * Employment contract with employee info
 */
export interface ContractWithEmployee {
  id: string;
  employeeId: string;
  contractType: string;
  title: string;
  department: string | null;
  startDate: Date;
  endDate: Date | null;
  probationEnd: Date | null;
  salaryAmount: number;
  salaryCurrency: string;
  salaryPeriod: string;
  weeklyHours: number;
  workingDays: string[];
  benefits: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber: string;
  };
}

/**
 * Leave request with employee info
 */
export interface LeaveRequestWithEmployee {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber: string;
  };
}

/**
 * Payslip with employee and period info
 */
export interface PayslipWithRelations {
  id: string;
  employeeId: string;
  payrollPeriodId: string;
  grossSalary: number;
  netSalary: number;
  deductions: any;
  additions: any;
  paidAt: Date | null;
  paymentRef: string | null;
  createdAt: Date;
  updatedAt: Date;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber: string;
  };
  payrollPeriod: {
    id: string;
    year: number;
    month: number;
    status: string;
  };
}

/**
 * Time entry with employee info
 */
export interface TimeEntryWithEmployee {
  id: string;
  employeeId: string;
  date: Date;
  startTime: Date | null;
  endTime: Date | null;
  breakMinutes: number;
  totalHours: number;
  overtimeHours: number;
  projectCode: string | null;
  description: string | null;
  status: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
}

/**
 * Payroll period with payslips
 */
export interface PayrollPeriodWithPayslips {
  id: string;
  orgId: string;
  year: number;
  month: number;
  status: string;
  processedAt: Date | null;
  processedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  payslips?: Payslip[];
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Create employee input
 */
export interface CreateEmployeeInput {
  orgId: string;
  userId?: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: Date;
  gender?: string;
  nationality?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  countryCode: string;
  taxId?: string;
  taxClass?: string;
  churchTax?: boolean;
  bankName?: string;
  iban?: string;
  bic?: string;
  hireDate: Date;
}

/**
 * Update employee input
 */
export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  nationality?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
  taxId?: string;
  taxClass?: string;
  churchTax?: boolean;
  bankName?: string;
  iban?: string;
  bic?: string;
  status?: string;
  terminationDate?: Date;
}

/**
 * Create employment contract input
 */
export interface CreateContractInput {
  employeeId: string;
  contractType: string;
  title: string;
  department?: string;
  startDate: Date;
  endDate?: Date;
  probationEnd?: Date;
  salaryAmount: number;
  salaryCurrency?: string;
  salaryPeriod: string;
  weeklyHours: number;
  workingDays: string[];
  benefits?: any;
}

/**
 * Update employment contract input
 */
export interface UpdateContractInput {
  title?: string;
  department?: string;
  endDate?: Date;
  salaryAmount?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  weeklyHours?: number;
  workingDays?: string[];
  benefits?: any;
  isActive?: boolean;
}

/**
 * Create leave request input
 */
export interface CreateLeaveRequestInput {
  employeeId: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
}

/**
 * Review leave request input
 */
export interface ReviewLeaveRequestInput {
  status: 'APPROVED' | 'REJECTED';
  reviewedBy: string;
  reviewNote?: string;
}

/**
 * Create time entry input
 */
export interface CreateTimeEntryInput {
  employeeId: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  breakMinutes?: number;
  totalHours: number;
  overtimeHours?: number;
  projectCode?: string;
  description?: string;
}

/**
 * Update time entry input
 */
export interface UpdateTimeEntryInput {
  startTime?: Date;
  endTime?: Date;
  breakMinutes?: number;
  totalHours?: number;
  overtimeHours?: number;
  projectCode?: string;
  description?: string;
  status?: string;
}

/**
 * Create payroll period input
 */
export interface CreatePayrollPeriodInput {
  orgId: string;
  year: number;
  month: number;
}

/**
 * Create payslip input
 */
export interface CreatePayslipInput {
  employeeId: string;
  payrollPeriodId: string;
  grossSalary: number;
  netSalary: number;
  deductions: any;
  additions?: any;
  paymentRef?: string;
}

/**
 * Create social security registration input
 */
export interface CreateSSRegistrationInput {
  employeeId: string;
  countryCode: string;
  registrationId: string;
  provider: string;
  type: string;
  startDate: Date;
  endDate?: Date;
}

/**
 * Create HR audit log input
 */
export interface CreateHrAuditLogInput {
  orgId: string;
  employeeId?: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * Employee filter options
 */
export interface EmployeeFilter {
  orgId: string;
  status?: string;
  countryCode?: string;
  search?: string;
  department?: string;
}

/**
 * Leave request filter options
 */
export interface LeaveRequestFilter {
  employeeId?: string;
  orgId?: string;
  status?: string;
  leaveType?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Time entry filter options
 */
export interface TimeEntryFilter {
  employeeId?: string;
  orgId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  projectCode?: string;
}

/**
 * Payslip filter options
 */
export interface PayslipFilter {
  employeeId?: string;
  orgId?: string;
  year?: number;
  month?: number;
  payrollPeriodId?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Employee summary
 */
export interface EmployeeSummary {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  hireDate: Date;
  department?: string;
  jobTitle?: string;
}

/**
 * Leave balance summary
 */
export interface LeaveBalance {
  employeeId: string;
  year: number;
  leaveType: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  carriedOver: number;
  expiresAt: Date | null;
}

/**
 * Payroll summary
 */
export interface PayrollSummary {
  orgId: string;
  year: number;
  month: number;
  status: string;
  employeeCount: number;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  processedAt: Date | null;
}

/**
 * Time tracking summary
 */
export interface TimeTrackingSummary {
  employeeId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  approvedHours: number;
  pendingHours: number;
}

/**
 * Employee payslip data
 */
export interface EmployeePayslipData {
  employee: EmployeeSummary;
  payslip: {
    id: string;
    period: {
      year: number;
      month: number;
    };
    grossSalary: number;
    netSalary: number;
    deductions: {
      tax?: number;
      socialSecurity?: number;
      healthInsurance?: number;
      pensionInsurance?: number;
      unemploymentInsurance?: number;
      other?: number;
    };
    additions?: {
      bonus?: number;
      overtime?: number;
      allowances?: number;
      other?: number;
    };
    paidAt: Date | null;
    paymentRef: string | null;
  };
}
