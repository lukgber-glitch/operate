'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmailConnections,
  syncEmails,
  getEmailFilterConfig,
  updateEmailFilterConfig,
  EmailConnection,
  EmailFilterConfig,
} from '@/lib/api/email';

export interface UseEmailConnectionsOptions {
  userId: string;
  orgId: string;
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseEmailConnectionsResult {
  connections: EmailConnection[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  syncConnection: (connectionId: string) => Promise<void>;
  isSyncing: (connectionId: string) => boolean;
}

/**
 * Hook to manage email connections with React Query
 */
export function useEmailConnections({
  userId,
  orgId,
  enabled = true,
  refetchInterval,
}: UseEmailConnectionsOptions): UseEmailConnectionsResult {
  const queryClient = useQueryClient();
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  // Query for email connections
  const {
    data: connections = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['email-connections', userId],
    queryFn: () => getEmailConnections(userId),
    enabled: enabled && !!userId,
    refetchInterval,
  });

  // Mutation for syncing emails
  const syncMutation = useMutation({
    mutationFn: (connectionId: string) => syncEmails(connectionId),
    onMutate: (connectionId) => {
      setSyncingIds((prev) => new Set(prev).add(connectionId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-connections', userId] });
    },
    onSettled: (_, __, connectionId) => {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(connectionId);
        return next;
      });
    },
  });

  const syncConnection = useCallback(
    async (connectionId: string) => {
      await syncMutation.mutateAsync(connectionId);
    },
    [syncMutation]
  );

  const isSyncing = useCallback(
    (connectionId: string) => {
      return syncingIds.has(connectionId);
    },
    [syncingIds]
  );

  return {
    connections,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    syncConnection,
    isSyncing,
  };
}

export interface UseEmailFilterConfigOptions {
  userId: string;
  enabled?: boolean;
}

export interface UseEmailFilterConfigResult {
  config: EmailFilterConfig | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  updateConfig: (config: EmailFilterConfig) => Promise<void>;
  isSaving: boolean;
}

/**
 * Hook to manage email filter configuration
 */
export function useEmailFilterConfig({
  userId,
  enabled = true,
}: UseEmailFilterConfigOptions): UseEmailFilterConfigResult {
  const queryClient = useQueryClient();

  // Query for filter config
  const {
    data: config = null,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['email-filter-config', userId],
    queryFn: () => getEmailFilterConfig(userId),
    enabled: enabled && !!userId,
  });

  // Mutation for updating config
  const updateMutation = useMutation({
    mutationFn: (newConfig: EmailFilterConfig) =>
      updateEmailFilterConfig(userId, newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-filter-config', userId] });
    },
  });

  const updateConfig = useCallback(
    async (newConfig: EmailFilterConfig) => {
      await updateMutation.mutateAsync(newConfig);
    },
    [updateMutation]
  );

  return {
    config,
    isLoading,
    isError,
    error: error as Error | null,
    updateConfig,
    isSaving: updateMutation.isPending,
  };
}

export interface SyncProgress {
  connectionId: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  progress?: number;
  totalEmails?: number;
  processedEmails?: number;
  foundInvoices?: number;
  error?: string;
}

export interface UseSyncProgressOptions {
  connectionId: string;
  enabled?: boolean;
}

/**
 * Hook to track email sync progress
 * In production, this would connect to a WebSocket or polling endpoint
 */
export function useSyncProgress({
  connectionId,
  enabled = true,
}: UseSyncProgressOptions) {
  const [progress, setProgress] = useState<SyncProgress>({
    connectionId,
    status: 'idle',
  });

  // In production, this would connect to a real-time sync status endpoint
  // For now, this is a placeholder that can be extended
  useEffect(() => {
    if (!enabled) return;

    // Subscribe to sync progress updates via WebSocket or polling
    // Example: const ws = new WebSocket(`/api/email-sync/${connectionId}/progress`)
    // ws.onmessage = (event) => setProgress(JSON.parse(event.data))

    return () => {
      // Cleanup WebSocket connection
    };
  }, [connectionId, enabled]);

  return progress;
}
