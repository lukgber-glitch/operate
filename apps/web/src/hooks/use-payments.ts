'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZATION_REQUIRED'
  | 'AUTHORIZING'
  | 'AUTHORIZED'
  | 'EXECUTED'
  | 'SETTLED'
  | 'FAILED'
  | 'CANCELLED';

export type PaymentCurrency = 'EUR' | 'GBP';

export interface PaymentBeneficiary {
  name: string;
  type: 'IBAN' | 'SORT_CODE_ACCOUNT_NUMBER';
  iban?: string;
  accountNumber?: string;
  sortCode?: string;
}

export interface CreatePaymentRequest {
  amount: number;
  currency: PaymentCurrency;
  beneficiary: PaymentBeneficiary;
  reference: string;
  metadata?: {
    billId?: string;
    invoiceId?: string;
    description?: string;
  };
}

export interface Payment {
  id: string;
  amount: number;
  currency: PaymentCurrency;
  beneficiary: PaymentBeneficiary;
  reference: string;
  status: PaymentStatus;
  authorizationUrl?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    billId?: string;
    invoiceId?: string;
    description?: string;
  };
}

export interface PaymentFilters {
  status?: PaymentStatus;
  currency?: PaymentCurrency;
  startDate?: string;
  endDate?: string;
}

interface UsePaymentsState {
  payments: Payment[];
  total: number;
  isLoading: boolean;
  error: string | null;
}

export function usePayments() {
  const { toast } = useToast();
  const [state, setState] = useState<UsePaymentsState>({
    payments: [],
    total: 0,
    isLoading: false,
    error: null,
  });

  const createPayment = useCallback(async (data: CreatePaymentRequest): Promise<Payment> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch('/api/v1/integrations/truelayer/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment');
      }

      const payment = await response.json();

      setState(prev => ({
        ...prev,
        payments: [payment, ...prev.payments],
        total: prev.total + 1,
        isLoading: false,
      }));

      toast({
        title: 'Payment initiated',
        description: 'Redirecting to your bank for authorization...',
      });

      return payment;
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

  const getPayment = useCallback(async (id: string): Promise<Payment> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`/api/v1/integrations/truelayer/payments/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch payment');
      }

      const payment = await response.json();

      setState(prev => ({
        ...prev,
        isLoading: false,
      }));

      return payment;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const listPayments = useCallback(async (filters?: PaymentFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.currency) params.append('currency', filters.currency);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/v1/integrations/truelayer/payments?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch payments');
      }

      const data = await response.json();

      setState({
        payments: data.payments || [],
        total: data.total || 0,
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
  }, [toast]);

  const cancelPayment = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`/api/v1/integrations/truelayer/payments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel payment');
      }

      setState(prev => ({
        ...prev,
        payments: prev.payments.filter(p => p.id !== id),
        total: prev.total - 1,
        isLoading: false,
      }));

      toast({
        title: 'Success',
        description: 'Payment cancelled successfully',
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

  return {
    ...state,
    createPayment,
    getPayment,
    listPayments,
    cancelPayment,
  };
}
