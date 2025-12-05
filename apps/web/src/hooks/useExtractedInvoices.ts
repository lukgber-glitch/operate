/**
 * Extracted Invoices Hooks
 * React Query hooks for managing extracted invoice data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listExtractedInvoices,
  getExtractedInvoice,
  updateExtractedInvoice,
  approveExtraction,
  rejectExtraction,
  bulkApproveExtractions,
  bulkRejectExtractions,
  createInvoiceFromExtraction,
  getExtractionStatistics,
  deleteExtraction,
  retryExtraction,
} from '@/lib/api/extracted-invoices';
import type {
  ListExtractedInvoicesParams,
  UpdateExtractedInvoiceDto,
  BulkApproveDto,
  BulkRejectDto,
  CreateInvoiceFromExtractionDto,
} from '@/types/extracted-invoice';

const QUERY_KEYS = {
  all: ['extracted-invoices'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (params?: ListExtractedInvoicesParams) =>
    [...QUERY_KEYS.lists(), params] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  statistics: () => [...QUERY_KEYS.all, 'statistics'] as const,
};

/**
 * Hook to list extracted invoices
 */
export function useExtractedInvoices(params?: ListExtractedInvoicesParams) {
  return useQuery({
    queryKey: QUERY_KEYS.list(params),
    queryFn: () => listExtractedInvoices(params),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to get a single extracted invoice
 */
export function useExtractedInvoice(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => getExtractedInvoice(id!),
    enabled: !!id,
  });
}

/**
 * Hook to get extraction statistics
 */
export function useExtractionStatistics() {
  return useQuery({
    queryKey: QUERY_KEYS.statistics(),
    queryFn: getExtractionStatistics,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to update extracted invoice data
 */
export function useUpdateExtractedInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExtractedInvoiceDto }) =>
      updateExtractedInvoice(id, data),
    onSuccess: (updatedInvoice) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.setQueryData(
        QUERY_KEYS.detail(updatedInvoice.id),
        updatedInvoice
      );
      toast.success('Invoice data updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update invoice data');
    },
  });
}

/**
 * Hook to approve an extraction
 */
export function useApproveExtraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      approveExtraction(id, notes),
    onSuccess: (approvedInvoice) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics() });
      queryClient.setQueryData(
        QUERY_KEYS.detail(approvedInvoice.id),
        approvedInvoice
      );
      toast.success('Invoice approved successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to approve invoice');
    },
  });
}

/**
 * Hook to reject an extraction
 */
export function useRejectExtraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      rejectExtraction(id, reason),
    onSuccess: (rejectedInvoice) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics() });
      queryClient.setQueryData(
        QUERY_KEYS.detail(rejectedInvoice.id),
        rejectedInvoice
      );
      toast.success('Invoice rejected');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to reject invoice');
    },
  });
}

/**
 * Hook to bulk approve extractions
 */
export function useBulkApproveExtractions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkApproveDto) => bulkApproveExtractions(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics() });
      toast.success(
        `${result.approved} invoice(s) approved successfully${
          result.failed > 0 ? `, ${result.failed} failed` : ''
        }`
      );
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to bulk approve invoices');
    },
  });
}

/**
 * Hook to bulk reject extractions
 */
export function useBulkRejectExtractions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkRejectDto) => bulkRejectExtractions(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics() });
      toast.success(`${result.rejected} invoice(s) rejected`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to bulk reject invoices');
    },
  });
}

/**
 * Hook to create invoice from extraction
 */
export function useCreateInvoiceFromExtraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceFromExtractionDto) =>
      createInvoiceFromExtraction(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics() });
      queryClient.setQueryData(
        QUERY_KEYS.detail(result.extraction.id),
        result.extraction
      );
      toast.success('Invoice created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create invoice');
    },
  });
}

/**
 * Hook to delete an extraction
 */
export function useDeleteExtraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteExtraction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics() });
      toast.success('Extraction deleted');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete extraction');
    },
  });
}

/**
 * Hook to retry failed extraction
 */
export function useRetryExtraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => retryExtraction(id),
    onSuccess: (retriedInvoice) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.setQueryData(
        QUERY_KEYS.detail(retriedInvoice.id),
        retriedInvoice
      );
      toast.success('Extraction retry initiated');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to retry extraction');
    },
  });
}
