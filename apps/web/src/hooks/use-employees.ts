'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';

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

// Debounce helper for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useEmployees(initialFilters?: EmployeeFilters) {
  const { toast } = useToast();
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

  // Debounce search filter for performance
  const debouncedSearch = useDebounce(filters.search, 300);

  // Cache for preventing duplicate fetches
  const fetchCacheRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchEmployees = useCallback(async (customFilters?: EmployeeFilters) => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const mergedFilters = { ...filters, ...customFilters, search: debouncedSearch };
    const cacheKey = JSON.stringify(mergedFilters);

    // Skip if same request is already cached
    if (fetchCacheRef.current === cacheKey && state.employees.length > 0) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await employeeApi.getEmployees(mergedFilters);
      fetchCacheRef.current = cacheKey;
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
      // Ignore aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      const errorMessage = handleApiError(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [filters, debouncedSearch, toast, state.employees.length]);

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
      toast({
        title: 'Success',
        description: 'Employee created successfully',
      });
      return employee;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const updateEmployee = useCallback(async (id: string, data: UpdateEmployeeRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const employee = await employeeApi.updateEmployee(id, data);
      setState(prev => ({
        ...prev,
        employees: prev.employees.map(e => e.id === id ? employee : e),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Employee updated successfully',
      });
      return employee;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

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
      toast({
        title: 'Success',
        description: 'Employee deleted successfully',
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized computed values for performance
  const activeEmployees = useMemo(
    () => state.employees.filter(e => e.status === 'ACTIVE'),
    [state.employees]
  );

  const employeesByDepartment = useMemo(() => {
    const grouped: Record<string, Employee[]> = {};
    state.employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(emp);
    });
    return grouped;
  }, [state.employees]);

  // Invalidate cache when filters change
  const invalidateCache = useCallback(() => {
    fetchCacheRef.current = null;
  }, []);

  return {
    ...state,
    filters,
    setFilters,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    // Optimized computed values
    activeEmployees,
    employeesByDepartment,
    invalidateCache,
  };
}

export function useEmployee(id: string) {
  const { toast } = useToast();
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
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  const updateEmployee = useCallback(async (data: UpdateEmployeeRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await employeeApi.updateEmployee(id, data);
      setEmployee(updated);
      toast({
        title: 'Success',
        description: 'Employee updated successfully',
      });
      return updated;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  return {
    employee,
    isLoading,
    error,
    fetchEmployee,
    updateEmployee,
  };
}
