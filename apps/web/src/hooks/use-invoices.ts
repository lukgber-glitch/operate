'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';
import {
  financeApi,
  type Invoice,
  type InvoiceFilters,
  type CreateInvoiceRequest,
  type UpdateInvoiceRequest,
} from '@/lib/api/finance';

interface UseInvoicesState {
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

// Debounce hook for optimized filter changes
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

export function useInvoices(initialFilters?: InvoiceFilters) {
  const { toast } = useToast();
  const [state, setState] = useState<UseInvoicesState>({
    invoices: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    isLoading: false,
    error: null,
  });

  const [filters, setFilters] = useState<InvoiceFilters>(initialFilters || {});

  // Abort controller for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetchInvoices = useCallback(async (customFilters?: InvoiceFilters) => {
    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const mergedFilters = { ...filters, ...customFilters };
      const response = await financeApi.getInvoices(mergedFilters);
      setState({
        invoices: response.data,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      // Ignore abort errors
      if (error?.name === 'AbortError') return;
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

  const createInvoice = useCallback(async (data: CreateInvoiceRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const invoice = await financeApi.createInvoice(data);
      setState(prev => ({
        ...prev,
        invoices: [invoice, ...prev.invoices],
        total: prev.total + 1,
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });
      return invoice;
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

  const updateInvoice = useCallback(async (id: string, data: UpdateInvoiceRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const invoice = await financeApi.updateInvoice(id, data);
      setState(prev => ({
        ...prev,
        invoices: prev.invoices.map(i => i.id === id ? invoice : i),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });
      return invoice;
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

  const deleteInvoice = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await financeApi.deleteInvoice(id);
      setState(prev => ({
        ...prev,
        invoices: prev.invoices.filter(i => i.id !== id),
        total: prev.total - 1,
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
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

  const sendInvoice = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const invoice = await financeApi.sendInvoice(id);
      setState(prev => ({
        ...prev,
        invoices: prev.invoices.map(i => i.id === id ? invoice : i),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Invoice sent successfully',
      });
      return invoice;
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

  const markInvoiceAsPaid = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const invoice = await financeApi.markInvoiceAsPaid(id);
      setState(prev => ({
        ...prev,
        invoices: prev.invoices.map(i => i.id === id ? invoice : i),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Invoice marked as paid',
      });
      return invoice;
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

  const cancelInvoice = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const invoice = await financeApi.cancelInvoice(id);
      setState(prev => ({
        ...prev,
        invoices: prev.invoices.map(i => i.id === id ? invoice : i),
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Invoice cancelled',
      });
      return invoice;
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

  // Memoized computed values for performance
  const invoiceSummary = useMemo(() => {
    if (state.invoices.length === 0) {
      return { totalAmount: 0, paidCount: 0, draftCount: 0, overdueCount: 0 };
    }

    return state.invoices.reduce(
      (acc, invoice) => ({
        totalAmount: acc.totalAmount + (invoice.totalAmount || 0),
        paidCount: acc.paidCount + (invoice.status === 'PAID' ? 1 : 0),
        draftCount: acc.draftCount + (invoice.status === 'DRAFT' ? 1 : 0),
        overdueCount: acc.overdueCount + (invoice.status === 'OVERDUE' ? 1 : 0),
      }),
      { totalAmount: 0, paidCount: 0, draftCount: 0, overdueCount: 0 }
    );
  }, [state.invoices]);

  // Find invoice by ID from cached list (avoid API call if already loaded)
  const getInvoiceById = useCallback((id: string): Invoice | undefined => {
    return state.invoices.find(invoice => invoice.id === id);
  }, [state.invoices]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    ...state,
    filters,
    setFilters,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    markInvoiceAsPaid,
    cancelInvoice,
    // Additional computed values
    invoiceSummary,
    getInvoiceById,
  }), [
    state,
    filters,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    markInvoiceAsPaid,
    cancelInvoice,
    invoiceSummary,
    getInvoiceById,
  ]);
}

export function useInvoice(id: string) {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetchInvoice = useCallback(async () => {
    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    try {
      const data = await financeApi.getInvoice(id);
      setInvoice(data);
    } catch (error: any) {
      // Ignore abort errors
      if (error?.name === 'AbortError') return;
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

  const updateInvoice = useCallback(async (data: UpdateInvoiceRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await financeApi.updateInvoice(id, data);
      setInvoice(updated);
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
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

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    invoice,
    isLoading,
    error,
    fetchInvoice,
    updateInvoice,
  }), [invoice, isLoading, error, fetchInvoice, updateInvoice]);
}
