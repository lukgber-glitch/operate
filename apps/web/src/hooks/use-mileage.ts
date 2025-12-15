'use client';

import { useState, useCallback } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';
import {
  mileageApi,
  type MileageEntry,
  type MileageFilters,
  type CreateMileageRequest,
  type UpdateMileageRequest,
  type MileageSummary,
  type MileageRate,
  type MileageTaxReport,
} from '@/lib/api/mileage';

interface UseMileageEntriesState {
  entries: MileageEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

export function useMileageEntries(initialFilters?: MileageFilters) {
  const { toast } = useToast();
  const [state, setState] = useState<UseMileageEntriesState>({
    entries: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    isLoading: false,
    error: null,
  });

  const [filters, setFilters] = useState<MileageFilters>(initialFilters || {});

  const fetchEntries = useCallback(async (customFilters?: MileageFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const mergedFilters = { ...filters, ...customFilters };
      const response = await mileageApi.getMileageEntries(mergedFilters);
      setState({
        entries: response.data,
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

  const createEntry = useCallback(async (data: CreateMileageRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const entry = await mileageApi.createMileageEntry(data);
      setState(prev => ({
        ...prev,
        entries: [entry, ...prev.entries],
        total: prev.total + 1,
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Mileage entry created successfully',
      });
      return entry;
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

  const updateEntry = useCallback(async (id: string, data: UpdateMileageRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const entry = await mileageApi.updateMileageEntry(id, data);
      setState(prev => ({
        ...prev,
        entries: prev.entries.map(e => e.id === id ? entry : e),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Mileage entry updated successfully',
      });
      return entry;
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

  const deleteEntry = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await mileageApi.deleteMileageEntry(id);
      setState(prev => ({
        ...prev,
        entries: prev.entries.filter(e => e.id !== id),
        total: prev.total - 1,
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Mileage entry deleted successfully',
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

  const markAsReimbursed = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const entry = await mileageApi.markAsReimbursed(id);
      setState(prev => ({
        ...prev,
        entries: prev.entries.map(e => e.id === id ? entry : e),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Marked as reimbursed',
      });
      return entry;
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

  const bulkMarkAsReimbursed = useCallback(async (ids: string[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const updatedEntries = await mileageApi.bulkMarkAsReimbursed(ids);
      const updatedMap = new Map(updatedEntries.map(e => [e.id, e]));
      setState(prev => ({
        ...prev,
        entries: prev.entries.map(e => updatedMap.get(e.id) || e),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: `${ids.length} entries marked as reimbursed`,
      });
      return updatedEntries;
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

  const duplicateEntry = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const entry = await mileageApi.duplicateEntry(id);
      setState(prev => ({
        ...prev,
        entries: [entry, ...prev.entries],
        total: prev.total + 1,
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Entry duplicated successfully',
      });
      return entry;
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
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    markAsReimbursed,
    bulkMarkAsReimbursed,
    duplicateEntry,
  };
}

export function useMileageEntry(id: string) {
  const { toast } = useToast();
  const [entry, setEntry] = useState<MileageEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntry = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mileageApi.getMileageEntry(id);
      setEntry(data);
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

  const updateEntry = useCallback(async (data: UpdateMileageRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await mileageApi.updateMileageEntry(id, data);
      setEntry(updated);
      toast({
        title: 'Success',
        description: 'Mileage entry updated successfully',
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
    entry,
    isLoading,
    error,
    fetchEntry,
    updateEntry,
  };
}

export function useMileageSummary(dateFrom?: string, dateTo?: string) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<MileageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mileageApi.getMileageSummary(dateFrom, dateTo);
      setSummary(data);
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
  }, [dateFrom, dateTo, toast]);

  return {
    summary,
    isLoading,
    error,
    fetchSummary,
  };
}

export function useMileageRates(countryCode?: string) {
  const { toast } = useToast();
  const [rates, setRates] = useState<MileageRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mileageApi.getMileageRates(countryCode);
      setRates(data);
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
  }, [countryCode, toast]);

  const getCurrentRate = useCallback(async (country: string, vehicleType: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const rate = await mileageApi.getCurrentRate(country, vehicleType);
      return rate;
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
  }, [toast]);

  return {
    rates,
    isLoading,
    error,
    fetchRates,
    getCurrentRate,
  };
}

export function useMileageTaxReport(year: number) {
  const { toast } = useToast();
  const [report, setReport] = useState<MileageTaxReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mileageApi.getTaxReport(year);
      setReport(data);
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
  }, [year, toast]);

  const exportReport = useCallback(async (format: 'pdf' | 'csv') => {
    setIsLoading(true);
    setError(null);
    try {
      const blob = await mileageApi.exportTaxReport(year, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mileage-tax-report-${year}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: 'Success',
        description: `Report exported as ${format.toUpperCase()}`,
      });
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
  }, [year, toast]);

  return {
    report,
    isLoading,
    error,
    fetchReport,
    exportReport,
  };
}
