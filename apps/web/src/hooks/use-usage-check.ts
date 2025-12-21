'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export interface UsageLimits {
  aiMessages: {
    used: number;
    limit: number;
    percentage: number;
  };
  bankConnections: {
    used: number;
    limit: number;
    percentage: number;
  };
  invoices: {
    used: number;
    limit: number;
    percentage: number;
  };
  plan: {
    name: string;
    tier: 'free' | 'starter' | 'pro' | 'enterprise';
  };
}

export interface UsageCheckResult {
  showBanner: boolean;
  showModal: boolean;
  usage: UsageLimits | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const USAGE_WARNING_THRESHOLD = 80; // Show banner at 80%
const USAGE_LIMIT_THRESHOLD = 100; // Show modal at 100%

/**
 * Hook to check user's usage status against their plan limits
 * Fetches from /api/v1/usage/limits and caches for 5 minutes
 */
export function useUsageCheck(): UsageCheckResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['usage', 'limits'],
    queryFn: async () => {
      const response = await api.get<{ data: UsageLimits }>('/usage/limits');
      // API returns wrapped response {data: {...}, meta: {...}}
      // Extract the inner data object
      return response.data?.data || response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on auth failures
  });

  // Safely check percentage values with optional chaining
  const aiPercentage = data?.aiMessages?.percentage ?? 0;
  const bankPercentage = data?.bankConnections?.percentage ?? 0;
  const invoicePercentage = data?.invoices?.percentage ?? 0;

  // Determine if we should show banner or modal
  const showBanner = data
    ? aiPercentage >= USAGE_WARNING_THRESHOLD &&
      aiPercentage < USAGE_LIMIT_THRESHOLD
    : false;

  const showModal = data
    ? aiPercentage >= USAGE_LIMIT_THRESHOLD ||
      bankPercentage >= USAGE_LIMIT_THRESHOLD ||
      invoicePercentage >= USAGE_LIMIT_THRESHOLD
    : false;

  return {
    showBanner,
    showModal,
    usage: data || null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
