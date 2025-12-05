'use client';

import { useState, useCallback } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';

// Transaction Types
export interface ReconciliationTransaction {
  id: string;
  accountId: string;
  accountName: string;
  transactionDate: string;
  description: string;
  amount: number;
  currency: string;
  type: 'DEBIT' | 'CREDIT';
  status: 'UNMATCHED' | 'MATCHED' | 'IGNORED';
  matchedEntityType?: 'EXPENSE' | 'INVOICE_PAYMENT';
  matchedEntityId?: string;
  ignoredReason?: string;
  createdAt: string;
}

export interface SuggestedMatch {
  entityType: 'EXPENSE' | 'INVOICE_PAYMENT';
  entityId: string;
  confidence: number;
  reason: string;
  entity: {
    id: string;
    number?: string;
    description: string;
    amount: number;
    currency: string;
    date: string;
    vendorName?: string;
    customerName?: string;
    category?: {
      id: string;
      name: string;
    };
  };
}

export interface ReconciliationStats {
  total: number;
  matched: number;
  unmatched: number;
  ignored: number;
  totalAmount: number;
  matchedAmount: number;
  unmatchedAmount: number;
  currency: string;
}

export interface ReconciliationFilters {
  status?: 'UNMATCHED' | 'MATCHED' | 'IGNORED';
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  minConfidence?: number;
  page?: number;
  pageSize?: number;
}

export interface ApplyMatchRequest {
  transactionId: string;
  entityType: 'EXPENSE' | 'INVOICE_PAYMENT';
  entityId: string;
}

export interface IgnoreTransactionRequest {
  transactionId: string;
  reason: string;
}

export interface AutoReconcileResponse {
  jobId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  matched?: number;
  total?: number;
}

interface UseReconciliationState {
  transactions: ReconciliationTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

class ReconciliationApi {
  private baseUrl = '/api/v1';

  private getOrgId(): string {
    if (typeof window !== 'undefined' && (window as any).__orgId) {
      return (window as any).__orgId;
    }
    return 'default-org-id';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const orgId = this.getOrgId();
    const url = `${this.baseUrl}/organisations/${orgId}/reconciliation${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getUnmatchedTransactions(filters?: ReconciliationFilters): Promise<{
    data: ReconciliationTransaction[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.request<{
      data: ReconciliationTransaction[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/transactions?${params.toString()}`);
  }

  async getSuggestedMatches(transactionId: string): Promise<SuggestedMatch[]> {
    return this.request<SuggestedMatch[]>(`/transactions/${transactionId}/suggestions`);
  }

  async applyMatch(data: ApplyMatchRequest): Promise<ReconciliationTransaction> {
    return this.request<ReconciliationTransaction>(`/match`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async ignoreTransaction(data: IgnoreTransactionRequest): Promise<ReconciliationTransaction> {
    return this.request<ReconciliationTransaction>(`/ignore`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async autoReconcile(options?: { minConfidence?: number }): Promise<AutoReconcileResponse> {
    return this.request<AutoReconcileResponse>(`/auto-reconcile`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  async getReconciliationStats(): Promise<ReconciliationStats> {
    return this.request<ReconciliationStats>(`/stats`);
  }

  async unignoreTransaction(transactionId: string): Promise<ReconciliationTransaction> {
    return this.request<ReconciliationTransaction>(`/transactions/${transactionId}/unignore`, {
      method: 'POST',
    });
  }
}

const reconciliationApi = new ReconciliationApi();

export function useUnmatchedTransactions(filters?: ReconciliationFilters) {
  const { toast } = useToast();
  const [state, setState] = useState<UseReconciliationState>({
    transactions: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    isLoading: false,
    error: null,
  });

  const fetchTransactions = useCallback(async (customFilters?: ReconciliationFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const mergedFilters = { ...filters, ...customFilters };
      const response = await reconciliationApi.getUnmatchedTransactions(mergedFilters);
      setState({
        transactions: response.data,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages,
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
  }, [filters, toast]);

  return {
    ...state,
    fetchTransactions,
  };
}

export function useSuggestedMatches(transactionId: string | null) {
  const { toast } = useToast();
  const [matches, setMatches] = useState<SuggestedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!transactionId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await reconciliationApi.getSuggestedMatches(transactionId);
      setMatches(data);
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
  }, [transactionId, toast]);

  return {
    matches,
    isLoading,
    error,
    fetchMatches,
  };
}

export function useApplyMatch() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const applyMatch = useCallback(async (data: ApplyMatchRequest) => {
    setIsLoading(true);
    try {
      const transaction = await reconciliationApi.applyMatch(data);
      toast({
        title: 'Success',
        description: 'Match applied successfully',
      });
      return transaction;
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    applyMatch,
    isLoading,
  };
}

export function useIgnoreTransaction() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const ignoreTransaction = useCallback(async (data: IgnoreTransactionRequest) => {
    setIsLoading(true);
    try {
      const transaction = await reconciliationApi.ignoreTransaction(data);
      toast({
        title: 'Success',
        description: 'Transaction ignored',
      });
      return transaction;
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const unignoreTransaction = useCallback(async (transactionId: string) => {
    setIsLoading(true);
    try {
      const transaction = await reconciliationApi.unignoreTransaction(transactionId);
      toast({
        title: 'Success',
        description: 'Transaction unignored',
      });
      return transaction;
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    ignoreTransaction,
    unignoreTransaction,
    isLoading,
  };
}

export function useAutoReconcile() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<AutoReconcileResponse | null>(null);

  const runAutoReconcile = useCallback(async (options?: { minConfidence?: number }) => {
    setIsLoading(true);
    try {
      const result = await reconciliationApi.autoReconcile(options);
      setProgress(result);
      toast({
        title: 'Auto-Reconcile Started',
        description: 'Processing transactions...',
      });
      return result;
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    runAutoReconcile,
    isLoading,
    progress,
  };
}

export function useReconciliationStats() {
  const { toast } = useToast();
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reconciliationApi.getReconciliationStats();
      setStats(data);
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
  }, [toast]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
}
