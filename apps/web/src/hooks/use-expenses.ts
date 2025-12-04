'use client';

import { useState, useCallback } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';
import {
  financeApi,
  type Expense,
  type ExpenseFilters,
  type CreateExpenseRequest,
  type UpdateExpenseRequest,
} from '@/lib/api/finance';

interface UseExpensesState {
  expenses: Expense[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

export function useExpenses(initialFilters?: ExpenseFilters) {
  const { toast } = useToast();
  const [state, setState] = useState<UseExpensesState>({
    expenses: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    isLoading: false,
    error: null,
  });

  const [filters, setFilters] = useState<ExpenseFilters>(initialFilters || {});

  const fetchExpenses = useCallback(async (customFilters?: ExpenseFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const mergedFilters = { ...filters, ...customFilters };
      const response = await financeApi.getExpenses(mergedFilters);
      setState({
        expenses: response.data,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages,
        isLoading: false,
        error: null,
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
    }
  }, [filters, toast]);

  const createExpense = useCallback(async (data: CreateExpenseRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const expense = await financeApi.createExpense(data);
      setState(prev => ({
        ...prev,
        expenses: [expense, ...prev.expenses],
        total: prev.total + 1,
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Expense created successfully',
      });
      return expense;
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

  const updateExpense = useCallback(async (id: string, data: UpdateExpenseRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const expense = await financeApi.updateExpense(id, data);
      setState(prev => ({
        ...prev,
        expenses: prev.expenses.map(e => e.id === id ? expense : e),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Expense updated successfully',
      });
      return expense;
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

  const deleteExpense = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await financeApi.deleteExpense(id);
      setState(prev => ({
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== id),
        total: prev.total - 1,
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
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

  const approveExpense = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const expense = await financeApi.approveExpense(id);
      setState(prev => ({
        ...prev,
        expenses: prev.expenses.map(e => e.id === id ? expense : e),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Expense approved',
      });
      return expense;
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

  const rejectExpense = useCallback(async (id: string, reason: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const expense = await financeApi.rejectExpense(id, reason);
      setState(prev => ({
        ...prev,
        expenses: prev.expenses.map(e => e.id === id ? expense : e),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Expense rejected',
      });
      return expense;
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

  const markExpenseAsPaid = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const expense = await financeApi.markExpenseAsPaid(id);
      setState(prev => ({
        ...prev,
        expenses: prev.expenses.map(e => e.id === id ? expense : e),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Expense marked as paid',
      });
      return expense;
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

  return {
    ...state,
    filters,
    setFilters,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    approveExpense,
    rejectExpense,
    markExpenseAsPaid,
  };
}

export function useExpense(id: string) {
  const { toast } = useToast();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpense = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await financeApi.getExpense(id);
      setExpense(data);
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

  const updateExpense = useCallback(async (data: UpdateExpenseRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await financeApi.updateExpense(id, data);
      setExpense(updated);
      toast({
        title: 'Success',
        description: 'Expense updated successfully',
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
    expense,
    isLoading,
    error,
    fetchExpense,
    updateExpense,
  };
}
