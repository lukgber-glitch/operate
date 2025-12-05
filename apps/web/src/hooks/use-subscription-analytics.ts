'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api/client';
import type {
  SubscriptionStats,
  MRRDataPoint,
  RevenueByTier,
  Subscription,
  SubscriptionDetail,
  SubscriptionChange,
  SubscriptionFilters,
  SubscriptionListResponse,
  ChurnMetrics,
} from '@/types/subscription-analytics';

/**
 * Hook for fetching subscription dashboard stats
 */
export function useSubscriptionStats(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['subscriptions', 'stats', dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await api.get<SubscriptionStats>(
        `/subscriptions/stats?${params.toString()}`
      );
      return response.data;
    },
  });
}

/**
 * Hook for fetching MRR chart data over time
 */
export function useMrrChart(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['subscriptions', 'mrr-chart', dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await api.get<MRRDataPoint[]>(
        `/subscriptions/mrr-chart?${params.toString()}`
      );
      return response.data;
    },
  });
}

/**
 * Hook for fetching revenue breakdown by tier
 */
export function useRevenueByTier(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['subscriptions', 'revenue-by-tier', dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await api.get<RevenueByTier[]>(
        `/subscriptions/revenue-by-tier?${params.toString()}`
      );
      return response.data;
    },
  });
}

/**
 * Hook for fetching paginated subscription list with filters
 */
export function useSubscriptions(
  page: number = 1,
  pageSize: number = 20,
  filters?: SubscriptionFilters
) {
  return useQuery({
    queryKey: ['subscriptions', 'list', page, pageSize, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (filters?.status?.length) {
        filters.status.forEach(s => params.append('status', s));
      }
      if (filters?.tier?.length) {
        filters.tier.forEach(t => params.append('tier', t));
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters?.dateTo) {
        params.append('dateTo', filters.dateTo);
      }

      const response = await api.get<SubscriptionListResponse>(
        `/subscriptions?${params.toString()}`
      );
      return response.data;
    },
  });
}

/**
 * Hook for fetching single subscription details
 */
export function useSubscriptionDetail(subscriptionId: string) {
  return useQuery({
    queryKey: ['subscriptions', 'detail', subscriptionId],
    queryFn: async () => {
      const response = await api.get<SubscriptionDetail>(
        `/subscriptions/${subscriptionId}`
      );
      return response.data;
    },
    enabled: !!subscriptionId,
  });
}

/**
 * Hook for fetching recent subscription changes
 */
export function useSubscriptionChanges(limit: number = 10) {
  return useQuery({
    queryKey: ['subscriptions', 'changes', limit],
    queryFn: async () => {
      const response = await api.get<SubscriptionChange[]>(
        `/subscriptions/changes?limit=${limit}`
      );
      return response.data;
    },
  });
}

/**
 * Hook for fetching churn metrics
 */
export function useChurnMetrics(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['subscriptions', 'churn', dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await api.get<ChurnMetrics>(
        `/subscriptions/churn?${params.toString()}`
      );
      return response.data;
    },
  });
}

/**
 * Hook for canceling a subscription
 */
export function useCancelSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      immediate = false,
      reason,
    }: {
      subscriptionId: string;
      immediate?: boolean;
      reason?: string;
    }) => {
      const response = await api.post<{ success: boolean }>(
        `/subscriptions/${subscriptionId}/cancel`,
        { immediate, reason }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: 'Subscription Canceled',
        description: 'The subscription has been canceled successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for upgrading/downgrading a subscription
 */
export function useUpdateSubscriptionTier() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      newTier,
    }: {
      subscriptionId: string;
      newTier: string;
    }) => {
      const response = await api.patch<{ success: boolean }>(
        `/subscriptions/${subscriptionId}/tier`,
        { tier: newTier }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: 'Subscription Updated',
        description: 'The subscription tier has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update subscription',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for extending trial period
 */
export function useExtendTrial() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      days,
    }: {
      subscriptionId: string;
      days: number;
    }) => {
      const response = await api.post<{ success: boolean; newTrialEnd: string }>(
        `/subscriptions/${subscriptionId}/extend-trial`,
        { days }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: 'Trial Extended',
        description: 'The trial period has been extended successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to extend trial',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for exporting subscription data to CSV
 */
export function useExportSubscriptions() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (filters?: SubscriptionFilters) => {
      const params = new URLSearchParams();
      if (filters?.status?.length) {
        filters.status.forEach(s => params.append('status', s));
      }
      if (filters?.tier?.length) {
        filters.tier.forEach(t => params.append('tier', t));
      }
      if (filters?.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters?.dateTo) {
        params.append('dateTo', filters.dateTo);
      }

      const response = await fetch(`/api/v1/subscriptions/export?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export subscriptions');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Export Complete',
        description: 'Subscription data has been exported to CSV.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export subscription data',
        variant: 'destructive',
      });
    },
  });
}
