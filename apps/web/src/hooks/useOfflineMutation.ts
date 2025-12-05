/**
 * Offline-Aware Mutation Hook
 * Handles create/update/delete operations with offline support
 */

'use client';

import { useState, useCallback } from 'react';
import { getDB } from '@/lib/offline/db';
import { addToSyncQueue, type EntityType } from '@/lib/offline/sync-queue';
import { v4 as uuidv4 } from 'uuid';

export interface OfflineMutationOptions<TData, TVariables> {
  entityType: EntityType;
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  optimisticUpdate?: (variables: TVariables) => TData;
  rollbackOnError?: boolean;
}

export interface OfflineMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | null>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isOnline: boolean;
  isPending: boolean; // Mutation is queued for sync
  reset: () => void;
}

export function useOfflineMutation<
  TData extends { id: string; updatedAt?: string },
  TVariables extends { id?: string }
>(
  options: OfflineMutationOptions<TData, TVariables>
): OfflineMutationResult<TData, TVariables> {
  const {
    entityType,
    mutationFn,
    onSuccess,
    onError,
    optimisticUpdate,
    rollbackOnError = true,
  } = options;

  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [optimisticData, setOptimisticData] = useState<TData | null>(null);

  /**
   * Determine operation type based on variables
   */
  const getOperationType = (variables: TVariables): 'create' | 'update' | 'delete' => {
    if ('deleted' in variables && variables.deleted) {
      return 'delete';
    }
    if (variables.id) {
      return 'update';
    }
    return 'create';
  };

  /**
   * Save to local database
   */
  const saveToLocal = useCallback(
    async (item: TData, operation: 'create' | 'update' | 'delete') => {
      try {
        const db = await getDB();

        const itemWithMeta = {
          ...item,
          _localVersion: 1,
          _lastSyncedAt: undefined,
          _syncStatus: 'pending' as const,
          updatedAt: item.updatedAt || new Date().toISOString(),
        };

        if (operation === 'delete') {
          await db.delete(entityType, item.id);
        } else {
          // Type assertion needed because we're using a generic TData
          // but IndexedDB stores have specific value types
          await db.put(entityType, itemWithMeta as any);
        }
      } catch (err) {
        console.error(`Failed to save ${entityType} locally:`, err);
        throw err;
      }
    },
    [entityType]
  );

  /**
   * Rollback optimistic update
   */
  const rollback = useCallback(
    async (itemId: string) => {
      if (!rollbackOnError || !optimisticData) return;

      try {
        const db = await getDB();
        // Remove the optimistically added/updated item
        await db.delete(entityType, itemId);
        setOptimisticData(null);
      } catch (err) {
        console.error(`Failed to rollback ${entityType}:`, err);
      }
    },
    [entityType, optimisticData, rollbackOnError]
  );

  /**
   * Execute mutation online
   */
  const mutateOnline = useCallback(
    async (variables: TVariables): Promise<TData> => {
      try {
        const result = await mutationFn(variables);

        // Save successful result to cache
        const operation = getOperationType(variables);
        await saveToLocal(result, operation);

        return result;
      } catch (err) {
        throw err;
      }
    },
    [mutationFn, saveToLocal]
  );

  /**
   * Execute mutation offline
   */
  const mutateOffline = useCallback(
    async (variables: TVariables): Promise<TData> => {
      const operation = getOperationType(variables);

      // Generate temporary ID for creates
      const itemId = variables.id || `temp_${uuidv4()}`;

      // Create optimistic data
      let optimisticResult: TData;
      if (optimisticUpdate) {
        optimisticResult = optimisticUpdate(variables);
      } else {
        // Convert to unknown first as TVariables may not fully overlap with TData
        optimisticResult = {
          ...variables,
          id: itemId,
          updatedAt: new Date().toISOString(),
        } as unknown as TData;
      }

      // Save optimistic update locally
      await saveToLocal(optimisticResult, operation);

      // Add to sync queue
      await addToSyncQueue(entityType, itemId, operation, variables);

      setIsPending(true);
      setOptimisticData(optimisticResult);

      return optimisticResult;
    },
    [entityType, optimisticUpdate, saveToLocal]
  );

  /**
   * Main mutation function
   */
  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        let result: TData;

        if (isOnline) {
          result = await mutateOnline(variables);
          setIsPending(false);
        } else {
          result = await mutateOffline(variables);
        }

        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Mutation failed');
        setIsError(true);
        setError(error);

        // Rollback if configured
        if (optimisticData) {
          await rollback(optimisticData.id);
        }

        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isOnline, mutateOnline, mutateOffline, onSuccess, onError, optimisticData, rollback]
  );

  /**
   * Async mutation (throws errors)
   */
  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      const result = await mutate(variables);
      if (!result) {
        throw error || new Error('Mutation failed');
      }
      return result;
    },
    [mutate, error]
  );

  /**
   * Reset mutation state
   */
  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setIsError(false);
    setError(null);
    setIsPending(false);
    setOptimisticData(null);
  }, []);

  return {
    mutate,
    mutateAsync,
    data,
    isLoading,
    isError,
    error,
    isOnline,
    isPending,
    reset,
  };
}

/**
 * Specialized hook for creating entities
 */
export function useOfflineCreate<TData extends { id: string }, TVariables extends { id?: string }>(
  entityType: EntityType,
  createFn: (variables: TVariables) => Promise<TData>,
  options?: Partial<OfflineMutationOptions<TData, TVariables>>
) {
  return useOfflineMutation<TData, TVariables>({
    entityType,
    mutationFn: createFn,
    ...options,
  });
}

/**
 * Specialized hook for updating entities
 */
export function useOfflineUpdate<TData extends { id: string }, TVariables extends { id: string }>(
  entityType: EntityType,
  updateFn: (variables: TVariables) => Promise<TData>,
  options?: Partial<OfflineMutationOptions<TData, TVariables>>
) {
  return useOfflineMutation<TData, TVariables>({
    entityType,
    mutationFn: updateFn,
    ...options,
  });
}

/**
 * Specialized hook for deleting entities
 */
export function useOfflineDelete<TVariables extends { id: string }>(
  entityType: EntityType,
  deleteFn: (variables: TVariables) => Promise<void>,
  options?: Partial<Omit<OfflineMutationOptions<{ id: string }, TVariables>, 'optimisticUpdate' | 'mutationFn'>>
) {
  const { onSuccess, onError, rollbackOnError } = options || {};
  return useOfflineMutation<{ id: string }, TVariables>({
    entityType,
    mutationFn: async (variables) => {
      await deleteFn(variables);
      return { id: variables.id };
    },
    onSuccess,
    onError,
    rollbackOnError,
  });
}
