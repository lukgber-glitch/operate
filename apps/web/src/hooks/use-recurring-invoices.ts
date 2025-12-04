/**
 * useRecurringInvoices Hook
 * Manages recurring invoice data with React Query
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/use-toast';
import {
  getRecurringInvoices,
  getRecurringInvoice,
  createRecurringInvoice,
  updateRecurringInvoice,
  deleteRecurringInvoice,
  activateRecurringInvoice,
  deactivateRecurringInvoice,
  generateRecurringInvoiceNow,
  getRecurringInvoiceHistory,
  type RecurringInvoiceFilters,
  type CreateRecurringInvoiceRequest,
  type UpdateRecurringInvoiceRequest,
} from '@/lib/api/recurring-invoices';

// Fetch recurring invoices with filters
export function useRecurringInvoices(filters?: RecurringInvoiceFilters) {
  return useQuery({
    queryKey: ['recurring-invoices', filters],
    queryFn: async () => {
      const response = await getRecurringInvoices(filters);
      return response;
    },
  });
}

// Fetch single recurring invoice
export function useRecurringInvoice(id: string) {
  return useQuery({
    queryKey: ['recurring-invoices', id],
    queryFn: async () => {
      const response = await getRecurringInvoice(id);
      return response;
    },
    enabled: !!id,
  });
}

// Fetch recurring invoice history
export function useRecurringInvoiceHistory(id: string) {
  return useQuery({
    queryKey: ['recurring-invoices', id, 'history'],
    queryFn: async () => {
      const response = await getRecurringInvoiceHistory(id);
      return response;
    },
    enabled: !!id,
  });
}

// Create recurring invoice mutation
export function useCreateRecurringInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateRecurringInvoiceRequest) => createRecurringInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      toast({
        title: 'Recurring invoice created',
        description: 'The recurring invoice has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create recurring invoice.',
        variant: 'destructive',
      });
    },
  });
}

// Update recurring invoice mutation
export function useUpdateRecurringInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringInvoiceRequest }) =>
      updateRecurringInvoice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices', variables.id] });
      toast({
        title: 'Recurring invoice updated',
        description: 'The recurring invoice has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update recurring invoice.',
        variant: 'destructive',
      });
    },
  });
}

// Delete recurring invoice mutation
export function useDeleteRecurringInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteRecurringInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      toast({
        title: 'Recurring invoice deleted',
        description: 'The recurring invoice has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete recurring invoice.',
        variant: 'destructive',
      });
    },
  });
}

// Activate recurring invoice mutation
export function useActivateRecurringInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => activateRecurringInvoice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices', id] });
      toast({
        title: 'Recurring invoice activated',
        description: 'The recurring invoice has been activated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to activate recurring invoice.',
        variant: 'destructive',
      });
    },
  });
}

// Deactivate recurring invoice mutation
export function useDeactivateRecurringInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deactivateRecurringInvoice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices', id] });
      toast({
        title: 'Recurring invoice paused',
        description: 'The recurring invoice has been paused successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to pause recurring invoice.',
        variant: 'destructive',
      });
    },
  });
}

// Generate invoice now mutation
export function useGenerateRecurringInvoiceNow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => generateRecurringInvoiceNow(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices', id] });
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices', id, 'history'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Invoice generated',
        description: 'The invoice has been generated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate invoice.',
        variant: 'destructive',
      });
    },
  });
}
