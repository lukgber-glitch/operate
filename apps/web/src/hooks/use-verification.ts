'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import type { VerificationData, VerificationStatus } from '@/types/verification';

interface UseVerificationResult {
  verification: VerificationData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  startVerification: (level: string) => Promise<void>;
  submitVerification: () => Promise<void>;
  cancelVerification: () => Promise<void>;
}

export function useVerification(): UseVerificationResult {
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerification = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<VerificationData>('/api/kyc/verification/status');
      setVerification(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch verification status';
      setError(message);    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  const startVerification = useCallback(async (level: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<VerificationData>('/api/kyc/verification/start', { level });
      setVerification(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start verification';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitVerification = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<VerificationData>('/api/kyc/verification/submit');
      setVerification(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit verification';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelVerification = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.post('/api/kyc/verification/cancel');
      setVerification(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel verification';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    verification,
    isLoading,
    error,
    refetch: fetchVerification,
    startVerification,
    submitVerification,
    cancelVerification,
  };
}
