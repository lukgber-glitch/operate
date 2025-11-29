'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
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

  const fetchInvoices = useCallback(async (customFilters?: InvoiceFilters) => {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch invoices';
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to create invoice';
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to update invoice';
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete invoice';
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invoice';
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark invoice as paid';
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel invoice';
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
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    markInvoiceAsPaid,
    cancelInvoice,
  };
}

export function useInvoice(id: string) {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await financeApi.getInvoice(id);
      setInvoice(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch invoice';
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to update invoice';
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
    invoice,
    isLoading,
    error,
    fetchInvoice,
    updateInvoice,
  };
}
