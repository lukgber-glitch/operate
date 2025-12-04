'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export enum HMRCConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  EXPIRED = 'EXPIRED',
  ERROR = 'ERROR',
}

export interface HMRCConnection {
  isConnected: boolean;
  status: HMRCConnectionStatus;
  connectedAt?: string;
  expiresAt?: string;
  vrn?: string;
  organisationName?: string;
}

export interface VATObligation {
  periodKey: string;
  start: string;
  end: string;
  due: string;
  status: 'O' | 'F'; // O = Open, F = Fulfilled
  received?: string;
}

export interface VATCalculation {
  periodKey: string;
  vatDueSales: number; // Box 1
  vatDueAcquisitions: number; // Box 2
  totalVatDue: number; // Box 3
  vatReclaimedCurrPeriod: number; // Box 4
  netVatDue: number; // Box 5
  totalValueSalesExVAT: number; // Box 6
  totalValuePurchasesExVAT: number; // Box 7
  totalValueGoodsSuppliedExVAT: number; // Box 8
  totalAcquisitionsExVAT: number; // Box 9
  breakdown: {
    salesByRate: Array<{
      rate: number;
      netAmount: number;
      vatAmount: number;
      count: number;
    }>;
    purchasesByRate: Array<{
      rate: number;
      netAmount: number;
      vatAmount: number;
      count: number;
    }>;
  };
}

export interface VATSubmissionRequest {
  periodKey: string;
  vatDueSales: number;
  vatDueAcquisitions: number;
  totalVatDue: number;
  vatReclaimedCurrPeriod: number;
  netVatDue: number;
  totalValueSalesExVAT: number;
  totalValuePurchasesExVAT: number;
  totalValueGoodsSuppliedExVAT: number;
  totalAcquisitionsExVAT: number;
  finalised: boolean;
}

export interface VATSubmissionResponse {
  processingDate: string;
  paymentIndicator?: 'DD' | 'BANK'; // Direct Debit or Bank Payment
  formBundleNumber: string;
  chargeRefNumber?: string;
}

// Hook for HMRC connection status
export function useHMRCConnection() {
  const [connection, setConnection] = useState<HMRCConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConnection = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/integrations/hmrc/connection', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch HMRC connection status');
      }

      const data = await response.json();
      setConnection(data.data || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load HMRC connection status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  const connect = async () => {
    try {
      const response = await fetch('/api/v1/integrations/hmrc/connect', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to initiate HMRC connection');
      }

      const data = await response.json();

      // Redirect to HMRC OAuth URL
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to connect to HMRC',
        variant: 'destructive',
      });
    }
  };

  const disconnect = async () => {
    try {
      const response = await fetch('/api/v1/integrations/hmrc/disconnect', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect from HMRC');
      }

      toast({
        title: 'Success',
        description: 'Disconnected from HMRC',
      });

      await fetchConnection();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect from HMRC',
        variant: 'destructive',
      });
    }
  };

  return {
    connection,
    isLoading,
    error,
    refetch: fetchConnection,
    connect,
    disconnect,
  };
}

// Hook for VAT obligations
export function useVATObligations(options: { autoFetch?: boolean } = {}) {
  const { autoFetch = true } = options;
  const [obligations, setObligations] = useState<VATObligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchObligations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/integrations/hmrc/vat/obligations', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch VAT obligations');
      }

      const data = await response.json();
      setObligations(data.data?.obligations || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load VAT obligations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (autoFetch) {
      fetchObligations();
    }
  }, [fetchObligations, autoFetch]);

  return {
    obligations,
    isLoading,
    error,
    refetch: fetchObligations,
  };
}

// Hook for VAT calculation
export function useVATCalculation(periodKey: string, options: { autoFetch?: boolean } = {}) {
  const { autoFetch = true } = options;
  const [calculation, setCalculation] = useState<VATCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCalculation = useCallback(async () => {
    if (!periodKey) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/integrations/hmrc/vat/calculate/${encodeURIComponent(periodKey)}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to calculate VAT return');
      }

      const data = await response.json();
      setCalculation(data.data || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to calculate VAT return',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [periodKey, toast]);

  useEffect(() => {
    if (autoFetch && periodKey) {
      fetchCalculation();
    }
  }, [fetchCalculation, autoFetch, periodKey]);

  return {
    calculation,
    isLoading,
    error,
    refetch: fetchCalculation,
  };
}

// Hook for VAT submission
export function useVATSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const submit = async (
    data: VATSubmissionRequest
  ): Promise<VATSubmissionResponse | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/integrations/hmrc/vat/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit VAT return');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: 'VAT return submitted successfully to HMRC',
      });

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Submission Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submit,
    isSubmitting,
    error,
  };
}

// Hook to get a specific obligation by period key
export function useVATObligation(periodKey: string) {
  const { obligations, isLoading, error, refetch } = useVATObligations();

  const obligation = obligations.find(o => o.periodKey === periodKey);

  return {
    obligation,
    isLoading,
    error,
    refetch,
  };
}
