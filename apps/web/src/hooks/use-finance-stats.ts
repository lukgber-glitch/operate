'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  financeApi,
  type FinanceStats,
} from '@/lib/api/finance';

interface UseFinanceStatsOptions {
  dateFrom?: string;
  dateTo?: string;
}

export function useFinanceStats(options: UseFinanceStatsOptions = {}) {
  const { toast } = useToast();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (customOptions?: UseFinanceStatsOptions) => {
    setIsLoading(true);
    setError(null);
    try {
      const { dateFrom, dateTo } = { ...options, ...customOptions };
      const data = await financeApi.getFinanceStats(dateFrom, dateTo);
      setStats(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch finance statistics';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [options, toast]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
}
