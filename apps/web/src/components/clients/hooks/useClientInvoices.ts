/**
 * useClientInvoices Hook
 * Manages client invoice data with React Query
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface ClientInvoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  currency: string;
  status: InvoiceStatus;
  customerName: string;
  clientId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientInvoicesResponse {
  data: ClientInvoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientInvoicesFilters {
  status?: InvoiceStatus;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'dueDate' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Fetch invoices for a specific client
 */
export function useClientInvoices(
  clientId: string,
  filters?: ClientInvoicesFilters
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['client-invoices', clientId, filters],
    queryFn: async (): Promise<ClientInvoicesResponse> => {
      const params = new URLSearchParams();

      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await api.get(
        `/invoices/client/${clientId}?${params.toString()}`
      );

      return response.data;
    },
    enabled: !!clientId,
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Prefetch next page of client invoices
 */
export function usePrefetchClientInvoices(
  clientId: string,
  filters?: ClientInvoicesFilters
) {
  const queryClient = useQueryClient();

  return (nextPage: number) => {
    queryClient.prefetchQuery({
      queryKey: ['client-invoices', clientId, { ...filters, page: nextPage }],
      queryFn: async (): Promise<ClientInvoicesResponse> => {
        const params = new URLSearchParams();

        if (filters?.status) params.append('status', filters.status);
        params.append('page', nextPage.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.sortBy) params.append('sortBy', filters.sortBy);
        if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

        const response = await api.get(
          `/invoices/client/${clientId}?${params.toString()}`
        );

        return response.data;
      },
    });
  };
}

/**
 * Get invoice statistics for a client
 */
export function useClientInvoiceStats(clientId: string) {
  return useQuery({
    queryKey: ['client-invoice-stats', clientId],
    queryFn: async () => {
      const response = await api.get(`/invoices/client/${clientId}/stats`);
      return response.data;
    },
    enabled: !!clientId,
    staleTime: 60000, // 1 minute
  });
}
