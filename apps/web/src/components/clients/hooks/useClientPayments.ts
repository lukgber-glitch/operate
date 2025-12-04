/**
 * useClientPayments Hook
 * React Query hooks for fetching and managing client payment history
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api/client';

export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'PROCESSING';
export type PaymentMethod =
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANK_TRANSFER'
  | 'PAYPAL'
  | 'CASH'
  | 'OTHER';

export interface Payment {
  id: string;
  clientId: string;
  invoiceId?: string;
  invoiceNumber?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  lastFourDigits?: string;
  transactionId?: string;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSummary {
  totalPaidThisYear: number;
  totalPaidAllTime: number;
  averagePaymentAmount: number;
  preferredPaymentMethod: PaymentMethod;
  averageDaysToPay: number;
  paymentCount: number;
  lastPaymentDate?: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  method?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedPayments {
  items: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetch paginated payment history for a client
 */
export function useClientPayments(clientId: string, filters?: PaymentFilters) {
  return useQuery({
    queryKey: ['client-payments', clientId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.method) params.append('method', filters.method);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.minAmount) params.append('minAmount', filters.minAmount.toString());
      if (filters?.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      const queryString = params.toString();
      const response = await api.get<PaginatedPayments>(
        `/crm/clients/${clientId}/payments${queryString ? `?${queryString}` : ''}`
      );
      return response.data;
    },
    enabled: !!clientId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch payment summary/statistics for a client
 */
export function useClientPaymentSummary(clientId: string) {
  return useQuery({
    queryKey: ['client-payment-summary', clientId],
    queryFn: async () => {
      const response = await api.get<PaymentSummary>(
        `/crm/clients/${clientId}/payments/summary`
      );
      return response.data;
    },
    enabled: !!clientId,
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single payment details
 */
export function usePayment(paymentId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['payments', paymentId],
    queryFn: async () => {
      const response = await api.get<Payment>(`/payments/${paymentId}`);
      return response.data;
    },
    enabled: options?.enabled !== false && !!paymentId,
    staleTime: 60000,
  });
}

/**
 * Create a new payment record
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<Payment>) => {
      const response = await api.post<Payment>('/payments', data);
      return response.data;
    },
    onSuccess: (payment) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['client-payments', payment.clientId] });
      queryClient.invalidateQueries({ queryKey: ['client-payment-summary', payment.clientId] });

      toast({
        title: 'Payment recorded',
        description: `Payment of ${new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: payment.currency,
        }).format(payment.amount)} has been recorded.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to record payment',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update payment status (e.g., mark as refunded)
 */
export function useUpdatePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: Partial<Payment>
    }) => {
      const response = await api.patch<Payment>(`/payments/${id}`, data);
      return response.data;
    },
    onSuccess: (payment) => {
      // Update cached payment
      queryClient.setQueryData(['payments', payment.id], payment);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['client-payments', payment.clientId] });
      queryClient.invalidateQueries({ queryKey: ['client-payment-summary', payment.clientId] });

      toast({
        title: 'Payment updated',
        description: 'Payment has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update payment',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Prefetch client payment data for faster navigation
 */
export function usePrefetchClientPayments() {
  const queryClient = useQueryClient();

  return (clientId: string, filters?: PaymentFilters) => {
    queryClient.prefetchQuery({
      queryKey: ['client-payments', clientId, filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const response = await api.get<PaginatedPayments>(
          `/crm/clients/${clientId}/payments${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
      },
      staleTime: 30000,
    });
  };
}
