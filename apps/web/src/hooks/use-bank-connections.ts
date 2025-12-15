'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';
import {
  bankConnectionsApi,
  type BankConnection,
  type Bank,
  type StartConnectionRequest,
  type CompleteConnectionRequest,
} from '@/lib/api/bank-connections';

interface UseBankConnectionsState {
  connections: BankConnection[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

// Stale-while-revalidate: Data is fresh for 5 minutes, stale for 30 minutes
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_TIME = 30 * 60 * 1000; // 30 minutes

// Global cache for connections (shared across component instances)
let connectionsCache: {
  data: BankConnection[] | null;
  timestamp: number | null;
  promise: Promise<BankConnection[]> | null;
} = {
  data: null,
  timestamp: null,
  promise: null,
};

export function useBankConnections() {
  const { toast } = useToast();
  const [state, setState] = useState<UseBankConnectionsState>({
    connections: connectionsCache.data || [],
    isLoading: false,
    error: null,
    lastFetched: connectionsCache.timestamp,
  });

  // Track component mount state to avoid state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchConnections = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    // Check if we have cached data
    if (connectionsCache.data && connectionsCache.timestamp && !forceRefresh) {
      const age = now - connectionsCache.timestamp;

      // If data is fresh, return cached data without refetching
      if (age < STALE_TIME) {
        if (!isMounted.current) return;
        setState((prev) => ({
          ...prev,
          connections: connectionsCache.data!,
          isLoading: false,
          error: null,
          lastFetched: connectionsCache.timestamp,
        }));
        return;
      }

      // If data is stale but not expired, return stale data and revalidate in background
      if (age < CACHE_TIME) {
        if (isMounted.current) {
          setState((prev) => ({
            ...prev,
            connections: connectionsCache.data!,
            isLoading: true, // Show loading indicator for background refresh
            lastFetched: connectionsCache.timestamp,
          }));
        }
        // Fall through to fetch fresh data
      }
    }

    // Request deduplication: If a fetch is already in progress, wait for it
    if (connectionsCache.promise) {
      try {
        const connections = await connectionsCache.promise;
        if (!isMounted.current) return;
        setState({
          connections,
          isLoading: false,
          error: null,
          lastFetched: connectionsCache.timestamp,
        });
        return;
      } catch {
        // Let it fall through to try again
      }
    }

    // Start the fetch
    if (isMounted.current) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    }

    // Create the fetch promise and store it for deduplication
    connectionsCache.promise = bankConnectionsApi.getBankConnections();

    try {
      const connections = await connectionsCache.promise;

      // Update cache
      connectionsCache.data = connections;
      connectionsCache.timestamp = Date.now();

      if (!isMounted.current) return;
      setState({
        connections,
        isLoading: false,
        error: null,
        lastFetched: connectionsCache.timestamp,
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      if (!isMounted.current) return;
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      connectionsCache.promise = null;
    }
  }, [toast]);

  const startConnection = useCallback(
    async (data: Omit<StartConnectionRequest, 'organisationId'>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await bankConnectionsApi.startConnection(data);
        setState((prev) => ({ ...prev, isLoading: false }));
        return response;
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const completeConnection = useCallback(
    async (data: CompleteConnectionRequest) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const connection = await bankConnectionsApi.completeConnection(data);

        // Update local state and cache
        const updatedConnections = [...state.connections, connection];
        connectionsCache.data = updatedConnections;
        connectionsCache.timestamp = Date.now();

        if (!isMounted.current) return connection;
        setState((prev) => ({
          connections: updatedConnections,
          isLoading: false,
          error: null,
          lastFetched: connectionsCache.timestamp,
        }));
        toast({
          title: 'Success',
          description: 'Bank account connected successfully',
        });
        return connection;
      } catch (error) {
        const errorMessage = handleApiError(error);
        if (!isMounted.current) throw error;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast, state.connections]
  );

  const syncConnection = useCallback(
    async (connectionId: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const updated = await bankConnectionsApi.syncConnection(connectionId);
        setState((prev) => ({
          ...prev,
          connections: prev.connections.map((c) =>
            c.id === connectionId ? updated : c
          ),
          isLoading: false,
          error: null,
        }));
        toast({
          title: 'Success',
          description: 'Bank accounts synced successfully',
        });
        return updated;
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const disconnectConnection = useCallback(
    async (connectionId: string) => {
      // Optimistic update: Remove connection immediately
      const previousConnections = state.connections;
      const optimisticConnections = previousConnections.filter((c) => c.id !== connectionId);

      setState((prev) => ({
        ...prev,
        connections: optimisticConnections,
        isLoading: true,
        error: null,
      }));

      try {
        await bankConnectionsApi.disconnectConnection(connectionId);

        // Update cache
        connectionsCache.data = optimisticConnections;
        connectionsCache.timestamp = Date.now();

        if (!isMounted.current) return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          lastFetched: connectionsCache.timestamp,
        }));
        toast({
          title: 'Success',
          description: 'Bank connection removed',
        });
      } catch (error) {
        // Rollback optimistic update on error
        const errorMessage = handleApiError(error);
        if (!isMounted.current) throw error;
        setState((prev) => ({
          ...prev,
          connections: previousConnections,
          isLoading: false,
          error: errorMessage,
        }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast, state.connections]
  );

  const reauthConnection = useCallback(
    async (connectionId: string, redirectUrl: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await bankConnectionsApi.reauthConnection(
          connectionId,
          redirectUrl
        );
        setState((prev) => ({ ...prev, isLoading: false }));
        return response;
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  // Utility to invalidate cache (useful after background operations)
  const invalidateCache = useCallback(() => {
    connectionsCache.data = null;
    connectionsCache.timestamp = null;
    connectionsCache.promise = null;
  }, []);

  // Check if data is stale
  const isStale = useCallback(() => {
    if (!connectionsCache.timestamp) return true;
    return Date.now() - connectionsCache.timestamp > STALE_TIME;
  }, []);

  return {
    ...state,
    fetchConnections,
    startConnection,
    completeConnection,
    syncConnection,
    disconnectConnection,
    reauthConnection,
    invalidateCache,
    isStale,
  };
}

export function useBanks() {
  const { toast } = useToast();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBanks = useCallback(
    async (country: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await bankConnectionsApi.getBanks(country);
        setBanks(data);
      } catch (error) {
        const errorMessage = handleApiError(error);
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  return {
    banks,
    isLoading,
    error,
    fetchBanks,
  };
}
