/**
 * Offline Queue Hook
 * React hook for managing offline message queue with browser event integration
 */

'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useOfflineQueueStore } from '@/stores/offlineQueue';
import type { QueuedMessage, SyncResult } from '@/stores/offlineQueue';

export interface UseOfflineQueueReturn {
  // State
  isOnline: boolean;
  queuedCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  hasErrors: boolean;
  errorCount: number;

  // Actions
  queueMessage: (message: Omit<QueuedMessage, 'queuedAt' | 'retryCount'>) => void;
  sync: () => Promise<SyncResult>;
  clearQueue: () => void;
  clearErrors: () => void;

  // Queue data
  queue: QueuedMessage[];
}

export function useOfflineQueue(): UseOfflineQueueReturn {
  const {
    isOnline,
    queue,
    isSyncing,
    lastSyncAt,
    syncErrors,
    addToQueue,
    syncQueue,
    clearQueue,
    setOnlineStatus,
    clearSyncErrors,
  } = useOfflineQueueStore();

  // Listen to browser online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('[OfflineQueue] Browser is online');
      setOnlineStatus(true);
    };

    const handleOffline = () => {
      console.log('[OfflineQueue] Browser is offline');
      setOnlineStatus(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setOnlineStatus(navigator.onLine);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      console.log(`[OfflineQueue] Auto-syncing ${queue.length} queued messages`);
      syncQueue();
    }
  }, [isOnline, queue.length, isSyncing, syncQueue]);

  // Periodic sync for retryable errors
  useEffect(() => {
    if (!isOnline || queue.length === 0) return;

    // Check every 30 seconds for retryable messages
    const interval = setInterval(() => {
      const hasRetryableMessages = queue.some(
        (msg) => msg.retryCount > 0 && msg.retryCount < 3
      );

      if (hasRetryableMessages && !isSyncing) {
        console.log('[OfflineQueue] Retrying failed messages');
        syncQueue();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOnline, queue, isSyncing, syncQueue]);

  // Memoized computed values
  const queuedCount = useMemo(() => queue.length, [queue.length]);
  const hasErrors = useMemo(() => syncErrors.length > 0, [syncErrors.length]);
  const errorCount = useMemo(() => syncErrors.length, [syncErrors.length]);

  // Wrapped actions
  const queueMessage = useCallback(
    (message: Omit<QueuedMessage, 'queuedAt' | 'retryCount'>) => {
      console.log('[OfflineQueue] Queueing message:', {
        id: message.id,
        conversationId: message.conversationId,
        isOnline,
      });
      addToQueue(message);
    },
    [addToQueue, isOnline]
  );

  const sync = useCallback(async (): Promise<SyncResult> => {
    console.log('[OfflineQueue] Manual sync triggered');
    return syncQueue();
  }, [syncQueue]);

  const handleClearQueue = useCallback(() => {
    console.log('[OfflineQueue] Clearing queue');
    clearQueue();
  }, [clearQueue]);

  const handleClearErrors = useCallback(() => {
    console.log('[OfflineQueue] Clearing sync errors');
    clearSyncErrors();
  }, [clearSyncErrors]);

  return {
    // State
    isOnline,
    queuedCount,
    isSyncing,
    lastSyncAt,
    hasErrors,
    errorCount,

    // Actions
    queueMessage,
    sync,
    clearQueue: handleClearQueue,
    clearErrors: handleClearErrors,

    // Queue data
    queue,
  };
}

/**
 * Hook for offline status only (lightweight)
 */
export function useOfflineStatus() {
  const isOnline = useOfflineQueueStore((state) => state.isOnline);
  const setOnlineStatus = useOfflineQueueStore((state) => state.setOnlineStatus);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setOnlineStatus(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  return { isOnline };
}
