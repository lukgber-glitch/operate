/**
 * Pay Run State Management Hook
 * Uses Zustand for wizard state management
 */

import { create } from 'zustand';
import {
  PayRunState,
  PayPeriod,
  PayrollEmployee,
  Addition,
  Deduction,
  TaxBreakdown,
  PayrollDetails,
} from '@/types/payroll';

interface PayRunActions {
  // Pay Period actions
  setPayPeriods: (periods: PayPeriod[]) => void;
  selectPayPeriod: (period: PayPeriod) => void;

  // Employee actions
  setEmployees: (employees: PayrollEmployee[]) => void;
  toggleEmployee: (employeeUuid: string) => void;
  selectAllEmployees: () => void;
  deselectAllEmployees: () => void;

  // Hours actions
  setHours: (employeeUuid: string, hours: number) => void;
  setPTO: (employeeUuid: string, ptoType: string, hours: number) => void;

  // Additions & Deductions actions
  addAddition: (addition: Addition) => void;
  removeAddition: (additionId: string) => void;
  updateAddition: (additionId: string, updates: Partial<Addition>) => void;
  addDeduction: (deduction: Deduction) => void;
  removeDeduction: (deductionId: string) => void;
  updateDeduction: (deductionId: string, updates: Partial<Deduction>) => void;

  // Tax actions
  setTaxBreakdowns: (breakdowns: TaxBreakdown[]) => void;

  // Payroll actions
  setCurrentPayroll: (payroll: PayrollDetails | null) => void;

  // Wizard navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;

  // Loading & Error
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

const initialState: PayRunState = {
  selectedPayPeriod: null,
  payPeriods: [],
  employees: [],
  selectedEmployees: [],
  hoursData: {},
  ptoData: {},
  additions: [],
  deductions: [],
  taxBreakdowns: [],
  currentPayroll: null,
  currentStep: 1,
  isLoading: false,
  error: null,
};

export const usePayRunStore = create<PayRunState & PayRunActions>((set, get) => ({
  ...initialState,

  // Pay Period actions
  setPayPeriods: (periods) => set({ payPeriods: periods }),

  selectPayPeriod: (period) => set({ selectedPayPeriod: period }),

  // Employee actions
  setEmployees: (employees) => set({
    employees,
    selectedEmployees: employees.filter(e => e.isActive).map(e => e.employeeUuid),
  }),

  toggleEmployee: (employeeUuid) => set((state) => {
    const isSelected = state.selectedEmployees.includes(employeeUuid);
    return {
      selectedEmployees: isSelected
        ? state.selectedEmployees.filter(id => id !== employeeUuid)
        : [...state.selectedEmployees, employeeUuid],
    };
  }),

  selectAllEmployees: () => set((state) => ({
    selectedEmployees: state.employees.map(e => e.employeeUuid),
  })),

  deselectAllEmployees: () => set({ selectedEmployees: [] }),

  // Hours actions
  setHours: (employeeUuid, hours) => set((state) => ({
    hoursData: {
      ...state.hoursData,
      [employeeUuid]: hours,
    },
  })),

  setPTO: (employeeUuid, ptoType, hours) => set((state) => ({
    ptoData: {
      ...state.ptoData,
      [employeeUuid]: {
        ...state.ptoData[employeeUuid],
        [ptoType]: hours,
      },
    },
  })),

  // Additions & Deductions actions
  addAddition: (addition) => set((state) => ({
    additions: [...state.additions, addition],
  })),

  removeAddition: (additionId) => set((state) => ({
    additions: state.additions.filter(a => a.id !== additionId),
  })),

  updateAddition: (additionId, updates) => set((state) => ({
    additions: state.additions.map(a =>
      a.id === additionId ? { ...a, ...updates } : a
    ),
  })),

  addDeduction: (deduction) => set((state) => ({
    deductions: [...state.deductions, deduction],
  })),

  removeDeduction: (deductionId) => set((state) => ({
    deductions: state.deductions.filter(d => d.id !== deductionId),
  })),

  updateDeduction: (deductionId, updates) => set((state) => ({
    deductions: state.deductions.map(d =>
      d.id === deductionId ? { ...d, ...updates } : d
    ),
  })),

  // Tax actions
  setTaxBreakdowns: (breakdowns) => set({ taxBreakdowns: breakdowns }),

  // Payroll actions
  setCurrentPayroll: (payroll) => set({ currentPayroll: payroll }),

  // Wizard navigation
  nextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, 6),
  })),

  prevStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 1),
  })),

  goToStep: (step) => set({
    currentStep: Math.max(1, Math.min(step, 6)),
  }),

  // Loading & Error
  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  // Reset
  reset: () => set(initialState),
}));

// ==================== Helper Hooks ====================

export function usePayRun() {
  const store = usePayRunStore();

  // Define helper functions first so they can reference each other
  const getTotalAdditions = (employeeUuid?: string): number => {
    const additions = employeeUuid
      ? store.additions.filter(a => a.employeeUuid === employeeUuid)
      : store.additions;
    return additions.reduce((sum, a) => sum + parseFloat(a.amount || '0'), 0);
  };

  const getTotalDeductions = (employeeUuid?: string): number => {
    const deductions = employeeUuid
      ? store.deductions.filter(d => d.employeeUuid === employeeUuid)
      : store.deductions;
    return deductions.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0);
  };

  const getEmployeeGrossPay = (employeeUuid: string): number => {
    const employee = store.employees.find(e => e.employeeUuid === employeeUuid);
    if (!employee) return 0;

    let gross = 0;

    if (employee.compensationType === 'hourly' && employee.hourlyRate) {
      const hours = store.hoursData[employeeUuid] || 0;
      gross = parseFloat(employee.hourlyRate) * hours;
    } else if (employee.compensationType === 'salary' && employee.salaryAmount) {
      // Assuming biweekly pay (26 pay periods per year)
      gross = parseFloat(employee.salaryAmount) / 26;
    }

    // Add additions
    gross += getTotalAdditions(employeeUuid);

    return gross;
  };

  const getEmployeeNetPay = (employeeUuid: string): number => {
    const gross = getEmployeeGrossPay(employeeUuid);
    const taxBreakdown = store.taxBreakdowns.find(t => t.employeeUuid === employeeUuid);
    const employeeTaxes = taxBreakdown ? parseFloat(taxBreakdown.totalEmployeeTaxes) : 0;
    const deductions = getTotalDeductions(employeeUuid);

    return gross - employeeTaxes - deductions;
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1: // Pay Period
        return !!store.selectedPayPeriod;
      case 2: // Employees
        return store.selectedEmployees.length > 0;
      case 3: // Hours
        return store.selectedEmployees.every(uuid => {
          const employee = store.employees.find(e => e.employeeUuid === uuid);
          if (!employee) return false;
          if (employee.compensationType === 'hourly') {
            return !!store.hoursData[uuid] && store.hoursData[uuid]! > 0;
          }
          return true; // Salaried employees don't need hours
        });
      case 4: // Additions & Deductions
        return true; // This step is always optional/complete
      case 5: // Tax Preview
        return store.taxBreakdowns.length > 0;
      case 6: // Review
        return !!store.currentPayroll?.calculatedAt;
      default:
        return false;
    }
  };

  return {
    ...store,

    // Computed values
    selectedEmployeeList: store.employees.filter(e =>
      store.selectedEmployees.includes(e.employeeUuid)
    ),

    totalEmployees: store.selectedEmployees.length,

    isStepComplete,

    canProceed: (): boolean => {
      return isStepComplete(store.currentStep);
    },

    getTotalAdditions,

    getTotalDeductions,

    getEmployeeGrossPay,

    getEmployeeNetPay,

    getTotalGrossPay: (): number => {
      return store.selectedEmployees.reduce(
        (sum, uuid) => sum + getEmployeeGrossPay(uuid),
        0
      );
    },

    getTotalNetPay: (): number => {
      return store.selectedEmployees.reduce(
        (sum, uuid) => sum + getEmployeeNetPay(uuid),
        0
      );
    },

    getTotalEmployeeTaxes: (): number => {
      return store.taxBreakdowns.reduce(
        (sum, t) => sum + parseFloat(t.totalEmployeeTaxes || '0'),
        0
      );
    },

    getTotalEmployerTaxes: (): number => {
      return store.taxBreakdowns.reduce(
        (sum, t) => sum + parseFloat(t.totalEmployerTaxes || '0'),
        0
      );
    },
  };
}
