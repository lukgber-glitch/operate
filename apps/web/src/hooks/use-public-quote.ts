'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';

export interface PublicQuote {
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
  };
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  issueDate: string;
  validUntil: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
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

interface UsePublicQuoteState {
  quote: PublicQuote | null;
  isLoading: boolean;
  error: string | null;
}

export function usePublicQuote(token: string) {
  const { toast } = useToast();
  const [state, setState] = useState<UsePublicQuoteState>({
    quote: null,
    isLoading: false,
    error: null,
  });

  const fetchQuote = useCallback(async () => {
    if (!token) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`/api/public/quotes/${token}`);
      if (!response.ok) {
        throw new Error('Quote not found or link expired');
      }
      const data = await response.json();
      setState({
        quote: data,
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
    fetchQuote();
  }, [fetchQuote]);

  return {
    ...state,
    fetchQuote,
  };
}

export function useAcceptQuote(token: string) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptQuote = useCallback(async (notes?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/quotes/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept quote');
      }

      const data = await response.json();
      toast({
        title: 'Success',
        description: 'Quote accepted successfully',
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

  return {
    isLoading,
    error,
    acceptQuote,
  };
}

export function useRejectQuote(token: string) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rejectQuote = useCallback(async (reason?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/quotes/${token}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject quote');
      }

      const data = await response.json();
      toast({
        title: 'Quote Rejected',
        description: 'Quote has been rejected',
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
      const response = await fetch(`/api/public/quotes/${token}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${token}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Quote downloaded successfully',
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
    rejectQuote,
    downloadPDF,
  };
}
