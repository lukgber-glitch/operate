'use client';

import { useState, useCallback } from 'react';
import {
  employeeApi,
  type Employee,
  type EmployeeFilters,
  type CreateEmployeeRequest,
  type UpdateEmployeeRequest
} from '@/lib/api/employees';

interface UseEmployeesState {
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

export function useEmployees(initialFilters?: EmployeeFilters) {
  const [state, setState] = useState<UseEmployeesState>({
    employees: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    isLoading: false,
    error: null,
  });

  const [filters, setFilters] = useState<EmployeeFilters>(initialFilters || {});

  const fetchEmployees = useCallback(async (customFilters?: EmployeeFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const mergedFilters = { ...filters, ...customFilters };
      const response = await employeeApi.getEmployees(mergedFilters);
      setState({
        employees: response.data,
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch employees',
      }));
    }
  }, [filters]);

  const createEmployee = useCallback(async (data: CreateEmployeeRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const employee = await employeeApi.createEmployee(data);
      setState(prev => ({
        ...prev,
        employees: [employee, ...prev.employees],
        total: prev.total + 1,
        isLoading: false,
      }));
      return employee;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create employee',
      }));
      throw error;
    }
  }, []);

  const updateEmployee = useCallback(async (id: string, data: UpdateEmployeeRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const employee = await employeeApi.updateEmployee(id, data);
      setState(prev => ({
        ...prev,
        employees: prev.employees.map(e => e.id === id ? employee : e),
        isLoading: false,
      }));
      return employee;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update employee',
      }));
      throw error;
    }
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await employeeApi.deleteEmployee(id);
      setState(prev => ({
        ...prev,
        employees: prev.employees.filter(e => e.id !== id),
        total: prev.total - 1,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete employee',
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    filters,
    setFilters,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
}

export function useEmployee(id: string) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployee = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await employeeApi.getEmployee(id);
      setEmployee(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch employee');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const updateEmployee = useCallback(async (data: UpdateEmployeeRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await employeeApi.updateEmployee(id, data);
      setEmployee(updated);
      return updated;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update employee');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  return {
    employee,
    isLoading,
    error,
    fetchEmployee,
    updateEmployee,
  };
}
