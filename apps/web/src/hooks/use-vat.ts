'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface VatPeriod {
  id: string;
  period: string;
  year: number;
  quarter?: number;
  month?: number;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'FILED' | 'PAID' | 'OVERDUE';
  totalSales: number;
  totalPurchases: number;
  vatOwed: number;
  vatRecoverable: number;
  netVat: number;
  dueDate: string;
  filedDate?: string;
}

interface VatTransaction {
  id: string;
  date: string;
  description: string;
  type: 'SALE' | 'PURCHASE';
  netAmount: number;
  vatAmount: number;
  vatRate: number;
  category: string;
  invoiceNumber?: string;
}

interface UseVatPeriodsOptions {
  autoFetch?: boolean;
}

export function useVatPeriods(year?: string, options: UseVatPeriodsOptions = {}) {
  const { autoFetch = true } = options;
  const [periods, setPeriods] = useState<VatPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPeriods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year);

      const response = await fetch(
        `/api/v1/tax/vat/periods?${params.toString()}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch VAT periods');
      }

      const data = await response.json();
      setPeriods(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load VAT periods',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, year]);

  useEffect(() => {
    if (autoFetch) {
      fetchPeriods();
    }
  }, [fetchPeriods, autoFetch]);

  return {
    periods,
    isLoading,
    error,
    refetch: fetchPeriods,
  };
}

export function useCurrentVatPeriod() {
  const [period, setPeriod] = useState<VatPeriod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCurrentPeriod = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/tax/vat/periods/current', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch current VAT period');
      }

      const data = await response.json();
      setPeriod(data.data || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load current VAT period',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCurrentPeriod();
  }, [fetchCurrentPeriod]);

  return {
    period,
    isLoading,
    error,
    refetch: fetchCurrentPeriod,
  };
}

interface UseVatTransactionsOptions {
  autoFetch?: boolean;
}

export function useVatTransactions(
  periodId: string,
  options: UseVatTransactionsOptions = {}
) {
  const { autoFetch = true } = options;
  const [transactions, setTransactions] = useState<VatTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    if (!periodId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/tax/vat/periods/${periodId}/transactions`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch VAT transactions');
      }

      const data = await response.json();
      setTransactions(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load VAT transactions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, periodId]);

  const fileVatReturn = async () => {
    try {
      const response = await fetch(
        `/api/v1/tax/vat/periods/${periodId}/file`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to file VAT return');
      }

      toast({
        title: 'Success',
        description: 'VAT return filed successfully',
      });

      await fetchTransactions();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to file VAT return',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (autoFetch && periodId) {
      fetchTransactions();
    }
  }, [fetchTransactions, autoFetch, periodId]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
    fileVatReturn,
  };
}
