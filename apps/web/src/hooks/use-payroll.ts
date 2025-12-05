/**
 * Payroll API Hook
 * Handles all API calls to Gusto payroll endpoints
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  PayrollDetails,
  PayPeriod,
  PayrollEmployee,
  CreatePayrollRequest,
  UpdatePayrollRequest,
  CalculatePayrollRequest,
  SubmitPayrollRequest,
  PayrollProcessingResult,
  PayrollListResponse,
} from '@/types/payroll';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ==================== API Client ====================

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/integrations/gusto`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== Query Keys ====================

export const payrollKeys = {
  all: ['payroll'] as const,
  lists: () => [...payrollKeys.all, 'list'] as const,
  list: (companyUuid: string) => [...payrollKeys.lists(), companyUuid] as const,
  details: () => [...payrollKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...payrollKeys.details(), uuid] as const,
  payPeriods: (companyUuid: string) => [...payrollKeys.all, 'pay-periods', companyUuid] as const,
  employees: (companyUuid: string) => [...payrollKeys.all, 'employees', companyUuid] as const,
};

// ==================== Pay Period Hooks ====================

export function usePayPeriods(companyUuid: string) {
  return useQuery({
    queryKey: payrollKeys.payPeriods(companyUuid),
    queryFn: async () => {
      const { data } = await apiClient.get<PayPeriod[]>(
        `/company/${companyUuid}/pay-periods`,
      );
      return data;
    },
    enabled: !!companyUuid,
  });
}

export function useCurrentPayPeriod(companyUuid: string) {
  return useQuery({
    queryKey: [...payrollKeys.payPeriods(companyUuid), 'current'],
    queryFn: async () => {
      const { data } = await apiClient.get<PayPeriod>(
        `/company/${companyUuid}/pay-periods/current`,
      );
      return data;
    },
    enabled: !!companyUuid,
  });
}

// ==================== Employee Hooks ====================

export function usePayrollEmployees(companyUuid: string) {
  return useQuery({
    queryKey: payrollKeys.employees(companyUuid),
    queryFn: async () => {
      const { data } = await apiClient.get<PayrollEmployee[]>(
        `/company/${companyUuid}/employees`,
      );
      // Filter only active employees
      return data.filter(emp => emp.isActive);
    },
    enabled: !!companyUuid,
  });
}

// ==================== Payroll CRUD Hooks ====================

export function usePayrollList(companyUuid: string) {
  return useQuery({
    queryKey: payrollKeys.list(companyUuid),
    queryFn: async () => {
      const { data } = await apiClient.get<PayrollListResponse>(
        `/company/${companyUuid}/payrolls`,
      );
      return data;
    },
    enabled: !!companyUuid,
  });
}

export function usePayroll(payrollUuid: string) {
  return useQuery({
    queryKey: payrollKeys.detail(payrollUuid),
    queryFn: async () => {
      const { data } = await apiClient.get<PayrollDetails>(
        `/payroll/${payrollUuid}`,
      );
      return data;
    },
    enabled: !!payrollUuid,
  });
}

export function useCreatePayroll(companyUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreatePayrollRequest) => {
      const { data } = await apiClient.post<PayrollDetails>(
        `/company/${companyUuid}/payrolls`,
        request,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.list(companyUuid) });
    },
  });
}

export function useUpdatePayroll(payrollUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdatePayrollRequest) => {
      const { data } = await apiClient.put<PayrollDetails>(
        `/payroll/${payrollUuid}`,
        request,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.detail(payrollUuid) });
      queryClient.invalidateQueries({ queryKey: payrollKeys.list(data.companyUuid) });
    },
  });
}

// ==================== Payroll Calculation Hooks ====================

export function useCalculatePayroll(payrollUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CalculatePayrollRequest) => {
      const { data } = await apiClient.put<PayrollDetails>(
        `/payroll/${payrollUuid}/calculate`,
        request,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(payrollKeys.detail(payrollUuid), data);
    },
  });
}

// ==================== Payroll Submission Hooks ====================

export function useSubmitPayroll(payrollUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SubmitPayrollRequest) => {
      const { data } = await apiClient.put<PayrollProcessingResult>(
        `/payroll/${payrollUuid}/submit`,
        request,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.detail(payrollUuid) });
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() });
    },
  });
}

export function useCancelPayroll(payrollUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (version: string) => {
      const { data } = await apiClient.delete<{ success: boolean; message: string }>(
        `/payroll/${payrollUuid}`,
        {
          data: { version },
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.detail(payrollUuid) });
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() });
    },
  });
}

// ==================== Helper Functions ====================

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPayPeriod(payPeriod: PayPeriod): string {
  const start = new Date(payPeriod.startDate);
  const end = new Date(payPeriod.endDate);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function calculateGrossPay(
  employee: PayrollEmployee,
  hours: number,
  additions: number = 0,
): number {
  if (employee.compensationType === 'hourly' && employee.hourlyRate) {
    return parseFloat(employee.hourlyRate) * hours + additions;
  } else if (employee.compensationType === 'salary' && employee.salaryAmount) {
    // For salary, assuming biweekly pay (26 pay periods per year)
    const biweeklyAmount = parseFloat(employee.salaryAmount) / 26;
    return biweeklyAmount + additions;
  }
  return additions;
}

export function validatePayrollData(
  employees: PayrollEmployee[],
  hoursData: Record<string, number>,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  employees.forEach((employee) => {
    if (employee.compensationType === 'hourly') {
      const hours = hoursData[employee.employeeUuid];
      if (!hours || hours <= 0) {
        errors.push(`${employee.firstName} ${employee.lastName} needs hours entered`);
      }
      if (hours && hours > 168) {
        // 24 hours * 7 days = max hours in a week for biweekly period
        errors.push(`${employee.firstName} ${employee.lastName} has excessive hours (${hours})`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
