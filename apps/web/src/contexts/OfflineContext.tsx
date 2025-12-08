/**
 * Offline Context Provider
 * Manages offline state and sync operations
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getDBStats, isIndexedDBSupported } from '@/lib/offline/db';
import {
  processSyncQueue,
  getSyncQueueStats,
  getPendingSyncItems,
  SyncQueueItem,
} from '@/lib/offline/sync-queue';
import {
  resolveConflict,
  getDefaultStrategy,
  ConflictResolutionStrategy,
  ConflictData,
} from '@/lib/offline/conflict-resolver';

export interface OfflineContextValue {
  // Online status
  isOnline: boolean;
  isSupported: boolean;

  // Sync state
  isSyncing: boolean;
  syncProgress: number;
  pendingSyncCount: number;
  lastSyncTime: Date | null;

  // Database stats
  dbStats: {
    invoices: number;
    expenses: number;
    contacts: number;
    syncQueue: number;
    pendingSyncs: number;
  } | null;

  // Sync operations
  syncNow: () => Promise<void>;
  cancelSync: () => void;

  // Conflict resolution
  conflictResolutionStrategy: ConflictResolutionStrategy;
  setConflictResolutionStrategy: (strategy: ConflictResolutionStrategy) => void;

  // Queue management
  refreshStats: () => Promise<void>;
  getPendingItems: () => Promise<SyncQueueItem[]>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export interface OfflineProviderProps {
  children: React.ReactNode;
  autoSync?: boolean;
  syncInterval?: number; // in milliseconds
  defaultStrategy?: ConflictResolutionStrategy;
}

export function OfflineProvider({
  children,
  autoSync = true,
  syncInterval = 30000, // 30 seconds
  defaultStrategy = 'server-wins',
}: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSupported] = useState<boolean>(isIndexedDBSupported());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [dbStats, setDbStats] = useState<OfflineContextValue['dbStats']>(null);
  const [conflictResolutionStrategy, setConflictResolutionStrategy] =
    useState<ConflictResolutionStrategy>(defaultStrategy);
  const [syncAbortController, setSyncAbortController] = useState<AbortController | null>(null);

  /**
   * Refresh database statistics
   */
  const refreshStats = useCallback(async () => {
    if (!isSupported) return;

    try {
      const [stats, queueStats] = await Promise.all([getDBStats(), getSyncQueueStats()]);

      setDbStats({
        invoices: stats.invoices,
        expenses: stats.expenses,
        contacts: stats.contacts,
        syncQueue: stats.syncQueue,
        pendingSyncs: queueStats.pending,
      });

      setPendingSyncCount(queueStats.pending);
    } catch (err) {
      // Silent error - stats will retry on next sync
    }
  }, [isSupported]);

  /**
   * Get pending sync items
   */
  const getPendingItems = useCallback(async () => {
    if (!isSupported) return [];
    return getPendingSyncItems();
  }, [isSupported]);

  /**
   * Sync implementation (to be provided by API clients)
   */
  const performSync = useCallback(
    async (item: SyncQueueItem) => {
      // This is a placeholder - actual implementation should be provided
      // by integrating with your API client

      // Example of how conflict resolution would work:
      // 1. Fetch server version
      // 2. Compare with local version
      // 3. Resolve conflicts
      // 4. Update server and local cache

      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    []
  );

  /**
   * Sync all pending items
   */
  const syncNow = useCallback(async () => {
    if (!isOnline || !isSupported || isSyncing) {
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);

    const abortController = new AbortController();
    setSyncAbortController(abortController);

    try {
      const result = await processSyncQueue(performSync, {
        maxRetries: 3,
        batchSize: 5,
        onProgress: (completed, total) => {
          setSyncProgress((completed / total) * 100);
        },
      });

      setLastSyncTime(new Date());
      await refreshStats();
    } catch (err) {
      // Sync will retry automatically
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
      setSyncAbortController(null);
    }
  }, [isOnline, isSupported, isSyncing, performSync, refreshStats]);

  /**
   * Cancel ongoing sync
   */
  const cancelSync = useCallback(() => {
    if (syncAbortController) {
      syncAbortController.abort();
      setIsSyncing(false);
      setSyncProgress(0);
    }
  }, [syncAbortController]);

  /**
   * Monitor online/offline status
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      if (autoSync) {
        syncNow();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync, syncNow]);

  /**
   * Auto-sync interval
   */
  useEffect(() => {
    if (!autoSync || !isOnline || !isSupported) return;

    const interval = setInterval(() => {
      if (pendingSyncCount > 0 && !isSyncing) {
        syncNow();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, isOnline, isSupported, pendingSyncCount, isSyncing, syncNow, syncInterval]);

  /**
   * Initial stats load
   */
  useEffect(() => {
    if (isSupported) {
      refreshStats();
    }
  }, [isSupported, refreshStats]);

  /**
   * Listen for service worker sync events
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_REQUESTED') {
        syncNow();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [syncNow]);

  const value: OfflineContextValue = {
    isOnline,
    isSupported,
    isSyncing,
    syncProgress,
    pendingSyncCount,
    lastSyncTime,
    dbStats,
    syncNow,
    cancelSync,
    conflictResolutionStrategy,
    setConflictResolutionStrategy,
    refreshStats,
    getPendingItems,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

/**
 * Hook to access offline context
 */
export function useOffline(): OfflineContextValue {
  const context = useContext(OfflineContext);

  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }

  return context;
}

/**
 * Hook to check if currently offline
 */
export function useIsOffline(): boolean {
  const { isOnline } = useOffline();
  return !isOnline;
}

/**
 * Hook to access sync functionality
 */
export function useSync() {
  const { isSyncing, syncProgress, pendingSyncCount, syncNow, cancelSync } = useOffline();

  return {
    isSyncing,
    syncProgress,
    pendingSyncCount,
    syncNow,
    cancelSync,
    hasPendingChanges: pendingSyncCount > 0,
  };
}
