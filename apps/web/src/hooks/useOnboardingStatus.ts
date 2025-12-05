/**
 * useOnboardingStatus Hook
 * React Query hook for fetching and managing onboarding status
 *
 * Provides real-time onboarding progress tracking with optimistic updates
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { api } from '@/lib/api/client';
import type { OnboardingState, OnboardingFormData } from '@/types/onboarding';

/**
 * API Response shape for onboarding status
 */
export interface OnboardingStatusResponse {
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  isComplete: boolean;
  state: OnboardingState;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update step request payload
 */
export interface UpdateStepRequest {
  stepId: string;
  data: Record<string, any>;
}

/**
 * Hook return type
 */
export interface UseOnboardingStatusReturn {
  // Status data
  status: OnboardingStatusResponse | undefined;
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  isComplete: boolean;
  progress: number;

  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  isUpdating: boolean;
  error: Error | null;

  // Actions
  updateStep: (stepId: string, data: Record<string, any>) => Promise<OnboardingStatusResponse>;
  skipStep: (stepId: string) => Promise<OnboardingStatusResponse>;
  completeOnboarding: () => Promise<void>;
  refetch: () => Promise<any>;
}

/**
 * Query key factory for onboarding status
 */
export const onboardingStatusKeys = {
  all: ['onboarding-status'] as const,
  status: () => [...onboardingStatusKeys.all, 'current'] as const,
};

/**
 * useOnboardingStatus Hook
 *
 * Fetches and manages onboarding status with React Query
 *
 * @example
 * ```tsx
 * const {
 *   status,
 *   currentStep,
 *   completedSteps,
 *   progress,
 *   updateStep,
 *   completeOnboarding,
 * } = useOnboardingStatus();
 *
 * // Update a step
 * await updateStep('company-info', { name: 'Acme Corp' });
 * ```
 */
export function useOnboardingStatus(): UseOnboardingStatusReturn {
  const queryClient = useQueryClient();

  // Fetch onboarding status
  const {
    data: status,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<OnboardingStatusResponse>({
    queryKey: onboardingStatusKeys.status(),
    queryFn: async () => {
      const response = await api.get<OnboardingStatusResponse>('/onboarding/status');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Update step mutation
  const updateStepMutation = useMutation({
    mutationFn: async ({ stepId, data }: UpdateStepRequest) => {
      const response = await api.patch<OnboardingStatusResponse>(`/onboarding/steps/${stepId}`, data);
      return response.data;
    },
    onMutate: async ({ stepId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: onboardingStatusKeys.status() });

      // Snapshot previous value
      const previousStatus = queryClient.getQueryData<OnboardingStatusResponse>(
        onboardingStatusKeys.status()
      );

      // Optimistically update
      if (previousStatus) {
        queryClient.setQueryData<OnboardingStatusResponse>(
          onboardingStatusKeys.status(),
          (old) => {
            if (!old) return old;

            const completedSteps = new Set(old.completedSteps);
            completedSteps.add(stepId);

            return {
              ...old,
              completedSteps: Array.from(completedSteps),
            };
          }
        );
      }

      return { previousStatus };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousStatus) {
        queryClient.setQueryData(onboardingStatusKeys.status(), context.previousStatus);
      }
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(onboardingStatusKeys.status(), data);
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: onboardingStatusKeys.status() });
    },
  });

  // Skip step mutation
  const skipStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const response = await api.post<OnboardingStatusResponse>(`/onboarding/steps/${stepId}/skip`, {});
      return response.data;
    },
    onMutate: async (stepId) => {
      await queryClient.cancelQueries({ queryKey: onboardingStatusKeys.status() });

      const previousStatus = queryClient.getQueryData<OnboardingStatusResponse>(
        onboardingStatusKeys.status()
      );

      if (previousStatus) {
        queryClient.setQueryData<OnboardingStatusResponse>(
          onboardingStatusKeys.status(),
          (old) => {
            if (!old) return old;

            const skippedSteps = new Set(old.skippedSteps);
            skippedSteps.add(stepId);

            return {
              ...old,
              skippedSteps: Array.from(skippedSteps),
            };
          }
        );
      }

      return { previousStatus };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(onboardingStatusKeys.status(), context.previousStatus);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingStatusKeys.status(), data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: onboardingStatusKeys.status() });
    },
  });

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      await api.post('/onboarding/complete', {});
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: onboardingStatusKeys.status() });

      const previousStatus = queryClient.getQueryData<OnboardingStatusResponse>(
        onboardingStatusKeys.status()
      );

      if (previousStatus) {
        queryClient.setQueryData<OnboardingStatusResponse>(
          onboardingStatusKeys.status(),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              isComplete: true,
            };
          }
        );
      }

      return { previousStatus };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(onboardingStatusKeys.status(), context.previousStatus);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: onboardingStatusKeys.status() });
      // Invalidate user data as onboarding completion might affect user state
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // Memoized computed values
  const currentStep = useMemo(() => status?.currentStep ?? 0, [status]);
  const completedSteps = useMemo(() => status?.completedSteps ?? [], [status]);
  const skippedSteps = useMemo(() => status?.skippedSteps ?? [], [status]);
  const isComplete = useMemo(() => status?.isComplete ?? false, [status]);

  // Calculate progress percentage (0-100)
  const progress = useMemo(() => {
    if (!status) return 0;

    // Total steps (0-7 = 8 steps)
    const totalSteps = 8;
    const completed = status.completedSteps.length;
    const skipped = status.skippedSteps.length;

    // Progress includes both completed and skipped steps
    const progressSteps = completed + skipped;
    const percentage = Math.round((progressSteps / totalSteps) * 100);

    return Math.min(percentage, 100);
  }, [status]);

  // Wrapped mutation functions
  const updateStep = useCallback(
    async (stepId: string, data: Record<string, any>) => {
      return updateStepMutation.mutateAsync({ stepId, data });
    },
    [updateStepMutation]
  );

  const skipStep = useCallback(
    async (stepId: string) => {
      return skipStepMutation.mutateAsync(stepId);
    },
    [skipStepMutation]
  );

  const completeOnboarding = useCallback(async () => {
    await completeOnboardingMutation.mutateAsync();
  }, [completeOnboardingMutation]);

  const isUpdating =
    updateStepMutation.isPending ||
    skipStepMutation.isPending ||
    completeOnboardingMutation.isPending;

  return {
    // Data
    status,
    currentStep,
    completedSteps,
    skippedSteps,
    isComplete,
    progress,

    // Loading states
    isLoading,
    isFetching,
    isUpdating,
    error: error as Error | null,

    // Actions
    updateStep,
    skipStep,
    completeOnboarding,
    refetch,
  };
}
