'use client';

import { useState, useEffect, useCallback } from 'react';

import { useToast } from '@/components/ui/use-toast';

interface Deduction {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  status: 'SUGGESTED' | 'CONFIRMED' | 'REJECTED';
  confidence?: number;
  potentialSaving: number;
}

interface UseDeductionsOptions {
  autoFetch?: boolean;
  year?: string;
  status?: 'SUGGESTED' | 'CONFIRMED' | 'REJECTED';
}

export function useDeductions(options: UseDeductionsOptions = {}) {
  const { autoFetch = true, year, status } = options;
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDeductions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (status) params.append('status', status);

      const response = await fetch(
        `/api/v1/tax/deductions?${params.toString()}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch deductions');
      }

      const data = await response.json();
      setDeductions(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load deductions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, year, status]);

  const confirmDeduction = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/tax/deductions/${id}/confirm`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to confirm deduction');
      }

      toast({
        title: 'Success',
        description: 'Deduction confirmed',
      });

      await fetchDeductions();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to confirm deduction',
        variant: 'destructive',
      });
    }
  };

  const rejectDeduction = async (id: string, reason?: string) => {
    try {
      const response = await fetch(`/api/v1/tax/deductions/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject deduction');
      }

      toast({
        title: 'Success',
        description: 'Deduction rejected',
      });

      await fetchDeductions();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to reject deduction',
        variant: 'destructive',
      });
    }
  };

  const createDeduction = async (deduction: Omit<Deduction, 'id' | 'status' | 'potentialSaving'>) => {
    try {
      const response = await fetch('/api/v1/tax/deductions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(deduction),
      });

      if (!response.ok) {
        throw new Error('Failed to create deduction');
      }

      toast({
        title: 'Success',
        description: 'Deduction created successfully',
      });

      await fetchDeductions();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create deduction',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchDeductions();
    }
  }, [fetchDeductions, autoFetch]);

  return {
    deductions,
    isLoading,
    error,
    refetch: fetchDeductions,
    confirmDeduction,
    rejectDeduction,
    createDeduction,
  };
}
