'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import type { VerificationRequirement, VerificationLevel } from '@/types/verification';

interface UseKycRequirementsResult {
  requirements: VerificationRequirement[];
  isLoading: boolean;
  error: string | null;
  refetch: (level?: VerificationLevel) => Promise<void>;
  completedCount: number;
  requiredCount: number;
  progress: number;
}

export function useKycRequirements(level?: VerificationLevel): UseKycRequirementsResult {
  const [requirements, setRequirements] = useState<VerificationRequirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequirements = useCallback(async (verificationLevel?: VerificationLevel) => {
    try {
      setIsLoading(true);
      setError(null);
      const params = verificationLevel ? { level: verificationLevel } : {};
      const response = await apiClient.get<{ requirements: VerificationRequirement[] }>(
        '/api/kyc/requirements',
        { params }
      );
      setRequirements(response.data.requirements);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch requirements';
      setError(message);    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequirements(level);
  }, [fetchRequirements, level]);

  const completedCount = requirements.filter(r => r.completed).length;
  const requiredCount = requirements.filter(r => r.required).length;
  const progress = requiredCount > 0 ? (completedCount / requiredCount) * 100 : 0;

  return {
    requirements,
    isLoading,
    error,
    refetch: fetchRequirements,
    completedCount,
    requiredCount,
    progress,
  };
}
