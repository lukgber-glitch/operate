'use client';

import { useState, useCallback } from 'react';

import { api } from '@/lib/api/client';

export interface OnboardingProgress {
  currentStep: number;
  completedSteps: string[];
  companyInfo?: {
    name: string;
    country: string;
    taxId?: string;
  };
  connectedIntegrations: string[];
}

export function useOnboarding() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<OnboardingProgress>('/onboarding/progress');
      setProgress(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch onboarding progress');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProgress = useCallback(async (step: string, data: Record<string, any>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<OnboardingProgress>('/onboarding/progress', {
        step,
        data,
      });
      setProgress(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to update progress');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/onboarding/complete');
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const skipStep = useCallback(async (step: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<OnboardingProgress>('/onboarding/skip', { step });
      setProgress(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to skip step');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    progress,
    isLoading,
    error,
    fetchProgress,
    updateProgress,
    completeOnboarding,
    skipStep,
  };
}
