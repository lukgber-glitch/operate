/**
 * Offline-Aware Query Hook
 * Fetches data from IndexedDB when offline, API when online
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getDB, setLastSyncTime } from '@/lib/offline/db';
import type { EntityType } from '@/lib/offline/sync-queue';

export interface OfflineQueryOptions<T> {
  entityType: EntityType;
  queryKey: string;
  fetchFn: () => Promise<T[]>;
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  staleTime?: number; // Time in ms before data is considered stale
  cacheFirst?: boolean; // If true, show cache first, then fetch
}

export interface OfflineQueryResult<T> {
  data: T[] | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isOnline: boolean;
  isCached: boolean;
  lastSyncedAt: Date | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export function useOfflineQuery<T extends { id: string; updatedAt: string }>(
  options: OfflineQueryOptions<T>
): OfflineQueryResult<T> {
  const {
    entityType,
    queryKey,
    fetchFn,
    enabled = true,
    refetchOnMount = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    cacheFirst = true,
  } = options;

  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isCached, setIsCached] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Monitor online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Load data from IndexedDB cache
   */
  const loadFromCache = useCallback(async (): Promise<T[] | null> => {
    try {
      const db = await getDB();
      const cachedData = await db.getAll(entityType);

      if (cachedData && cachedData.length > 0) {
        setIsCached(true);
        // Use unknown first since DB types may not perfectly overlap with T
        return cachedData as unknown as T[];
      }

      setIsCached(false);
      return null;
    } catch (err) {
      console.error(`Failed to load ${entityType} from cache:`, err);
      return null;
    }
  }, [entityType]);

  /**
   * Save data to IndexedDB cache
   */
  const saveToCache = useCallback(
    async (items: T[]) => {
      try {
        const db = await getDB();
        const tx = db.transaction(entityType, 'readwrite');

        // Add sync metadata to each item
        const itemsWithMeta = items.map(item => ({
          ...item,
          _lastSyncedAt: new Date().toISOString(),
          _syncStatus: 'synced' as const,
        }));

        await Promise.all([
          // Use any for dynamic store types with generic T
          ...itemsWithMeta.map(item => tx.store.put(item as any)),
          tx.done,
        ]);

        await setLastSyncTime(entityType, new Date());
      } catch (err) {
        console.error(`Failed to save ${entityType} to cache:`, err);
      }
    },
    [entityType]
  );

  /**
   * Fetch data from API
   */
  const fetchFromAPI = useCallback(async (): Promise<T[] | null> => {
    try {
      setIsError(false);
      setError(null);

      const result = await fetchFn();
      await saveToCache(result);
      setLastFetchTime(Date.now());
      setLastSyncedAt(new Date());

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch data');
      setIsError(true);
      setError(error);
      console.error(`Failed to fetch ${entityType}:`, error);
      return null;
    }
  }, [fetchFn, saveToCache, entityType]);

  /**
   * Main fetch function - handles online/offline logic
   */
  const fetch = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);

    // Check if data is stale
    const isStale = Date.now() - lastFetchTime > staleTime;

    if (cacheFirst || !isOnline) {
      // Load from cache first
      const cachedData = await loadFromCache();

      if (cachedData) {
        setData(cachedData);
        setIsLoading(false);

        // If online and stale, fetch in background
        if (isOnline && isStale) {
          fetchFromAPI().then(freshData => {
            if (freshData) {
              setData(freshData);
              setIsCached(false);
            }
          });
        }
        return;
      }
    }

    // Fetch from API if online
    if (isOnline) {
      const freshData = await fetchFromAPI();
      if (freshData) {
        setData(freshData);
        setIsCached(false);
      } else {
        // API failed, try cache as fallback
        const cachedData = await loadFromCache();
        if (cachedData) {
          setData(cachedData);
        }
      }
    } else {
      // Offline - use cache only
      const cachedData = await loadFromCache();
      if (cachedData) {
        setData(cachedData);
      } else {
        setIsError(true);
        setError(new Error('No cached data available offline'));
      }
    }

    setIsLoading(false);
  }, [
    enabled,
    isOnline,
    cacheFirst,
    loadFromCache,
    fetchFromAPI,
    staleTime,
    lastFetchTime,
  ]);

  /**
   * Refetch data
   */
  const refetch = useCallback(async () => {
    await fetch();
  }, [fetch]);

  /**
   * Invalidate cache and refetch
   */
  const invalidate = useCallback(async () => {
    try {
      const db = await getDB();
      await db.clear(entityType);
      setIsCached(false);
      await fetch();
    } catch (err) {
      console.error(`Failed to invalidate ${entityType} cache:`, err);
    }
  }, [entityType, fetch]);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Serialize queryKey to stable string for dependency comparison
  const queryKeyString = useMemo(() => JSON.stringify(queryKey), [queryKey]);

  // Initial fetch - dependencies properly listed
  useEffect(() => {
    if (refetchOnMount && isMountedRef.current) {
      fetch();
    }
  }, [refetchOnMount, queryKeyString, fetch]);

  // Refetch when coming back online
  // Track previous online state to detect transition
  const wasOfflineRef = useRef(!isOnline);
  useEffect(() => {
    const wasOffline = wasOfflineRef.current;
    wasOfflineRef.current = !isOnline;

    // Only refetch if we just came back online and have cached data
    if (isOnline && wasOffline && data && isCached && isMountedRef.current) {
      fetch();
    }
  }, [isOnline, data, isCached, fetch]);

  // Periodic refetch
  useEffect(() => {
    if (!refetchInterval || !isOnline) return;

    const interval = setInterval(() => {
      if (isMountedRef.current) {
        fetch();
      }
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, isOnline, fetch]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    data,
    isLoading,
    isError,
    error,
    isOnline,
    isCached,
    lastSyncedAt,
    refetch,
    invalidate,
  }), [data, isLoading, isError, error, isOnline, isCached, lastSyncedAt, refetch, invalidate]);
}
