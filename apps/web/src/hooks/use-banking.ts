'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  financeApi,
  type BankAccount,
  type BankTransaction,
  type BankTransactionFilters,
  type CreateBankAccountRequest,
  type UpdateBankAccountRequest,
} from '@/lib/api/finance';

interface UseBankTransactionsState {
  transactions: BankTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

export function useBankAccounts() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBankAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await financeApi.getBankAccounts();
      setAccounts(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bank accounts';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createBankAccount = useCallback(async (data: CreateBankAccountRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const account = await financeApi.createBankAccount(data);
      setAccounts(prev => [account, ...prev]);
      toast({
        title: 'Success',
        description: 'Bank account created successfully',
      });
      return account;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create bank account';
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
  }, [toast]);

  const updateBankAccount = useCallback(async (id: string, data: UpdateBankAccountRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const account = await financeApi.updateBankAccount(id, data);
      setAccounts(prev => prev.map(a => a.id === id ? account : a));
      toast({
        title: 'Success',
        description: 'Bank account updated successfully',
      });
      return account;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update bank account';
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
  }, [toast]);

  const deleteBankAccount = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await financeApi.deleteBankAccount(id);
      setAccounts(prev => prev.filter(a => a.id !== id));
      toast({
        title: 'Success',
        description: 'Bank account deleted successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete bank account';
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
  }, [toast]);

  return {
    accounts,
    isLoading,
    error,
    fetchBankAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
  };
}

export function useBankAccount(id: string) {
  const { toast } = useToast();
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBankAccount = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await financeApi.getBankAccount(id);
      setAccount(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bank account';
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

  const updateBankAccount = useCallback(async (data: UpdateBankAccountRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await financeApi.updateBankAccount(id, data);
      setAccount(updated);
      toast({
        title: 'Success',
        description: 'Bank account updated successfully',
      });
      return updated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update bank account';
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
    account,
    isLoading,
    error,
    fetchBankAccount,
    updateBankAccount,
  };
}

export function useBankTransactions(initialFilters?: BankTransactionFilters) {
  const { toast } = useToast();
  const [state, setState] = useState<UseBankTransactionsState>({
    transactions: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    isLoading: false,
    error: null,
  });

  const [filters, setFilters] = useState<BankTransactionFilters>(initialFilters || {});

  const fetchTransactions = useCallback(async (customFilters?: BankTransactionFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const mergedFilters = { ...filters, ...customFilters };
      const response = await financeApi.getBankTransactions(mergedFilters);
      setState({
        transactions: response.data,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions';
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

  return {
    ...state,
    filters,
    setFilters,
    fetchTransactions,
  };
}
