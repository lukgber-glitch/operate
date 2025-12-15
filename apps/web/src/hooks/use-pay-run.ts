/**
 * Pay Run State Management Hook
 * Uses Zustand for wizard state management
 * Optimized with memoized selectors and O(1) lookups
 */

import { create } from 'zustand';
import { useMemo, useCallback } from 'react';
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

// Memoized selectors for better performance
const selectSelectedEmployeeList = (state: PayRunState) =>
  state.employees.filter(e => state.selectedEmployees.includes(e.employeeUuid));

export function usePayRun() {
  const store = usePayRunStore();

  // Memoized selected employee list - prevents unnecessary re-renders
  const selectedEmployeeList = useMemo(
    () => store.employees.filter(e => store.selectedEmployees.includes(e.employeeUuid)),
    [store.employees, store.selectedEmployees]
  );

  // Memoized employee map for O(1) lookups
  const employeeMap = useMemo(() => {
    const map = new Map<string, PayrollEmployee>();
    store.employees.forEach(e => map.set(e.employeeUuid, e));
    return map;
  }, [store.employees]);

  // Memoized tax breakdown map for O(1) lookups
  const taxBreakdownMap = useMemo(() => {
    const map = new Map<string, TaxBreakdown>();
    store.taxBreakdowns.forEach(t => map.set(t.employeeUuid, t));
    return map;
  }, [store.taxBreakdowns]);

  // Memoized additions by employee
  const additionsByEmployee = useMemo(() => {
    const map = new Map<string, Addition[]>();
    store.additions.forEach(a => {
      const existing = map.get(a.employeeUuid) || [];
      existing.push(a);
      map.set(a.employeeUuid, existing);
    });
    return map;
  }, [store.additions]);

  // Memoized deductions by employee
  const deductionsByEmployee = useMemo(() => {
    const map = new Map<string, Deduction[]>();
    store.deductions.forEach(d => {
      const existing = map.get(d.employeeUuid) || [];
      existing.push(d);
      map.set(d.employeeUuid, existing);
    });
    return map;
  }, [store.deductions]);

  // Optimized addition calculation with memoized map
  const getTotalAdditions = useCallback((employeeUuid?: string): number => {
    if (employeeUuid) {
      const additions = additionsByEmployee.get(employeeUuid) || [];
      return additions.reduce((sum, a) => sum + parseFloat(a.amount || '0'), 0);
    }
    return store.additions.reduce((sum, a) => sum + parseFloat(a.amount || '0'), 0);
  }, [store.additions, additionsByEmployee]);

  // Optimized deduction calculation with memoized map
  const getTotalDeductions = useCallback((employeeUuid?: string): number => {
    if (employeeUuid) {
      const deductions = deductionsByEmployee.get(employeeUuid) || [];
      return deductions.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0);
    }
    return store.deductions.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0);
  }, [store.deductions, deductionsByEmployee]);

  // Optimized gross pay calculation with memoized employee map
  const getEmployeeGrossPay = useCallback((employeeUuid: string): number => {
    const employee = employeeMap.get(employeeUuid);
    if (!employee) return 0;

    let gross = 0;

    if (employee.compensationType === 'hourly' && employee.hourlyRate) {
      const hours = store.hoursData[employeeUuid] || 0;
      gross = parseFloat(employee.hourlyRate) * hours;
    } else if (employee.compensationType === 'salary' && employee.salaryAmount) {
      // Assuming biweekly pay (26 pay periods per year)
      gross = parseFloat(employee.salaryAmount) / 26;
    }

    // Add additions using memoized function
    gross += getTotalAdditions(employeeUuid);

    return gross;
  }, [employeeMap, store.hoursData, getTotalAdditions]);

  // Optimized net pay calculation
  const getEmployeeNetPay = useCallback((employeeUuid: string): number => {
    const gross = getEmployeeGrossPay(employeeUuid);
    const taxBreakdown = taxBreakdownMap.get(employeeUuid);
    const employeeTaxes = taxBreakdown ? parseFloat(taxBreakdown.totalEmployeeTaxes) : 0;
    const deductions = getTotalDeductions(employeeUuid);

    return gross - employeeTaxes - deductions;
  }, [getEmployeeGrossPay, taxBreakdownMap, getTotalDeductions]);

  // Memoized step completion check
  const isStepComplete = useCallback((step: number): boolean => {
    switch (step) {
      case 1: // Pay Period
        return !!store.selectedPayPeriod;
      case 2: // Employees
        return store.selectedEmployees.length > 0;
      case 3: // Hours
        return store.selectedEmployees.every(uuid => {
          const employee = employeeMap.get(uuid);
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
  }, [store.selectedPayPeriod, store.selectedEmployees, employeeMap, store.hoursData, store.taxBreakdowns, store.currentPayroll]);

  // Memoized totals for summary display
  const totals = useMemo(() => {
    const totalGross = store.selectedEmployees.reduce(
      (sum, uuid) => sum + getEmployeeGrossPay(uuid),
      0
    );

    const totalNet = store.selectedEmployees.reduce(
      (sum, uuid) => sum + getEmployeeNetPay(uuid),
      0
    );

    const totalEmployeeTaxes = store.taxBreakdowns.reduce(
      (sum, t) => sum + parseFloat(t.totalEmployeeTaxes || '0'),
      0
    );

    const totalEmployerTaxes = store.taxBreakdowns.reduce(
      (sum, t) => sum + parseFloat(t.totalEmployerTaxes || '0'),
      0
    );

    return {
      totalGross,
      totalNet,
      totalEmployeeTaxes,
      totalEmployerTaxes,
    };
  }, [store.selectedEmployees, store.taxBreakdowns, getEmployeeGrossPay, getEmployeeNetPay]);

  return {
    ...store,

    // Memoized computed values
    selectedEmployeeList,
    employeeMap,

    totalEmployees: store.selectedEmployees.length,

    isStepComplete,

    canProceed: (): boolean => {
      return isStepComplete(store.currentStep);
    },

    getTotalAdditions,
    getTotalDeductions,
    getEmployeeGrossPay,
    getEmployeeNetPay,

    // Use memoized totals
    getTotalGrossPay: (): number => totals.totalGross,
    getTotalNetPay: (): number => totals.totalNet,
    getTotalEmployeeTaxes: (): number => totals.totalEmployeeTaxes,
    getTotalEmployerTaxes: (): number => totals.totalEmployerTaxes,
  };
}
