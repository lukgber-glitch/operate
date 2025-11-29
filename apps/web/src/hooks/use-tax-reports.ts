'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface DeductionSummary {
  category: string;
  count: number;
  totalAmount: number;
  potentialSaving: number;
}

interface TaxDeadline {
  id: string;
  name: string;
  type: 'VAT' | 'INCOME_TAX' | 'PAYROLL' | 'OTHER';
  dueDate: string;
  status: 'UPCOMING' | 'DUE' | 'OVERDUE' | 'COMPLETED';
  description?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface TaxSummary {
  year: string;
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  estimatedTax: number;
  totalDeductions: number;
  vatOwed: number;
  vatRecoverable: number;
  netVat: number;
}

interface TaxReport {
  summary: TaxSummary;
  deductionsByCategory: DeductionSummary[];
  deadlines: TaxDeadline[];
  compliance: {
    score: number;
    issues: Array<{
      type: string;
      severity: 'HIGH' | 'MEDIUM' | 'LOW';
      message: string;
    }>;
  };
}

interface UseTaxReportOptions {
  autoFetch?: boolean;
}

export function useTaxReport(year: string, options: UseTaxReportOptions = {}) {
  const { autoFetch = true } = options;
  const [report, setReport] = useState<TaxReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReport = useCallback(async () => {
    if (!year) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/tax/reports/${year}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tax report');
      }

      const data = await response.json();
      setReport(data.data || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load tax report',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, year]);

  const exportReport = async (format: 'PDF' | 'EXCEL' | 'CSV') => {
    try {
      const response = await fetch(
        `/api/v1/tax/reports/${year}/export?format=${format}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-report-${year}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: `Tax report exported as ${format}`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (autoFetch && year) {
      fetchReport();
    }
  }, [fetchReport, autoFetch, year]);

  return {
    report,
    isLoading,
    error,
    refetch: fetchReport,
    exportReport,
  };
}

interface UseTaxDeadlinesOptions {
  autoFetch?: boolean;
  upcoming?: boolean;
}

export function useTaxDeadlines(options: UseTaxDeadlinesOptions = {}) {
  const { autoFetch = true, upcoming = false } = options;
  const [deadlines, setDeadlines] = useState<TaxDeadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDeadlines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (upcoming) params.append('upcoming', 'true');

      const response = await fetch(
        `/api/v1/tax/deadlines?${params.toString()}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tax deadlines');
      }

      const data = await response.json();
      setDeadlines(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load tax deadlines',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, upcoming]);

  const markCompleted = async (deadlineId: string) => {
    try {
      const response = await fetch(
        `/api/v1/tax/deadlines/${deadlineId}/complete`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark deadline as completed');
      }

      toast({
        title: 'Success',
        description: 'Deadline marked as completed',
      });

      await fetchDeadlines();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update deadline',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchDeadlines();
    }
  }, [fetchDeadlines, autoFetch]);

  return {
    deadlines,
    isLoading,
    error,
    refetch: fetchDeadlines,
    markCompleted,
  };
}

interface UseTaxComplianceOptions {
  autoFetch?: boolean;
}

export function useTaxCompliance(options: UseTaxComplianceOptions = {}) {
  const { autoFetch = true } = options;
  const [compliance, setCompliance] = useState<TaxReport['compliance'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCompliance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/tax/compliance', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch compliance status');
      }

      const data = await response.json();
      setCompliance(data.data || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load compliance status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (autoFetch) {
      fetchCompliance();
    }
  }, [fetchCompliance, autoFetch]);

  return {
    compliance,
    isLoading,
    error,
    refetch: fetchCompliance,
  };
}
