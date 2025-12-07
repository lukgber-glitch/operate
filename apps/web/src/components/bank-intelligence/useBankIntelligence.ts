'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useToast } from '@/components/ui/use-toast';
import type {
  CashFlowDataPoint,
  RecurringExpense,
  TaxSummary,
  ClassifiedTransaction,
  UnmatchedPayment,
  BankAlert,
  BankIntelligenceSummary,
} from './types';

/**
 * Hook to fetch cash flow forecast data
 */
export function useCashFlowForecast(days: number = 30) {
  return useQuery({
    queryKey: ['bank-intelligence', 'cash-flow', days],
    queryFn: async () => {
      const response = await api.get<CashFlowDataPoint[]>('/bank-intelligence/cash-flow', {
        params: { days },
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch recurring expenses
 */
export function useRecurringExpenses() {
  return useQuery({
    queryKey: ['bank-intelligence', 'recurring'],
    queryFn: async () => {
      const response = await api.get<RecurringExpense[]>('/bank-intelligence/recurring');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch tax liability summary
 */
export function useTaxLiability(year?: number) {
  const currentYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ['bank-intelligence', 'tax-liability', currentYear],
    queryFn: async () => {
      const response = await api.get<TaxSummary>('/bank-intelligence/tax-liability', {
        params: { year: currentYear },
      });
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to fetch recent classified transactions
 */
export function useRecentTransactions(limit: number = 20) {
  return useQuery({
    queryKey: ['bank-intelligence', 'transactions', limit],
    queryFn: async () => {
      const response = await api.get<ClassifiedTransaction[]>('/bank-intelligence/transactions', {
        params: { limit },
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch unmatched payments
 */
export function useUnmatchedPayments() {
  return useQuery({
    queryKey: ['bank-intelligence', 'unmatched'],
    queryFn: async () => {
      const response = await api.get<{
        incoming: UnmatchedPayment[];
        outgoing: UnmatchedPayment[];
      }>('/bank-intelligence/unmatched');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch bank alerts
 */
export function useBankAlerts() {
  return useQuery({
    queryKey: ['bank-intelligence', 'alerts'],
    queryFn: async () => {
      const response = await api.get<BankAlert[]>('/bank-intelligence/alerts');
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Hook to fetch dashboard summary
 */
export function useBankIntelligenceSummary() {
  return useQuery({
    queryKey: ['bank-intelligence', 'summary'],
    queryFn: async () => {
      const response = await api.get<BankIntelligenceSummary>('/bank-intelligence/summary');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to confirm a transaction match
 */
export function useConfirmMatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      transactionId: string;
      invoiceId?: string;
      billId?: string;
    }) => {
      const response = await api.post('/bank-intelligence/confirm-match', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['bank-intelligence', 'unmatched'] });
      queryClient.invalidateQueries({ queryKey: ['bank-intelligence', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-intelligence', 'alerts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-intelligence', 'summary'] });

      toast({
        title: 'Success',
        description: 'Transaction matched successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to confirm match',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to reclassify a transaction
 */
export function useReclassifyTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      transactionId: string;
      category: string;
      taxCategory?: string;
    }) => {
      const response = await api.patch(`/bank-intelligence/transactions/${data.transactionId}/classify`, {
        category: data.category,
        taxCategory: data.taxCategory,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-intelligence', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-intelligence', 'summary'] });

      toast({
        title: 'Success',
        description: 'Transaction reclassified successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reclassify transaction',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to dismiss an alert
 */
export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const response = await api.delete(`/bank-intelligence/alerts/${alertId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-intelligence', 'alerts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-intelligence', 'summary'] });
    },
  });
}
