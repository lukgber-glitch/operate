'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';

export interface PublicInvoice {
  id: string;
  number: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    countryCode: string;
  };
  companyInfo: {
    name: string;
    logo?: string;
    address?: string;
    email?: string;
    phone?: string;
    taxId?: string;
  };
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID';
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  notes?: string;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    amount: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  amount: number;
  paymentMethodId: string;
  paymentIntentId?: string;
}

interface UsePublicInvoiceState {
  invoice: PublicInvoice | null;
  isLoading: boolean;
  error: string | null;
}

export function usePublicInvoice(token: string) {
  const { toast } = useToast();
  const [state, setState] = useState<UsePublicInvoiceState>({
    invoice: null,
    isLoading: false,
    error: null,
  });

  const fetchInvoice = useCallback(async () => {
    if (!token) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`/api/public/invoices/${token}`);
      if (!response.ok) {
        throw new Error('Invoice not found or link expired');
      }
      const data = await response.json();
      setState({
        invoice: data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState((prev) => ({
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
  }, [token, toast]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  return {
    ...state,
    fetchInvoice,
  };
}

export function useRecordPayment(token: string) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = useCallback(async (amount: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/invoices/${token}/payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      return data;
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
  }, [token, toast]);

  const recordPayment = useCallback(async (paymentData: PaymentRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/invoices/${token}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      const data = await response.json();
      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      });
      return data;
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
  }, [token, toast]);

  const downloadPDF = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/invoices/${token}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${token}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully',
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
  }, [token, toast]);

  return {
    isLoading,
    error,
    createPaymentIntent,
    recordPayment,
    downloadPDF,
  };
}
