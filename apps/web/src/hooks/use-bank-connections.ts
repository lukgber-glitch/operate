'use client';

import { useState, useCallback } from 'react';

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
}

export function useBankConnections() {
  const { toast } = useToast();
  const [state, setState] = useState<UseBankConnectionsState>({
    connections: [],
    isLoading: false,
    error: null,
  });

  const fetchConnections = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const connections = await bankConnectionsApi.getBankConnections();
      setState({
        connections,
        isLoading: false,
        error: null,
      });
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
        setState((prev) => ({
          connections: [...prev.connections, connection],
          isLoading: false,
          error: null,
        }));
        toast({
          title: 'Success',
          description: 'Bank account connected successfully',
        });
        return connection;
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

  const syncConnection = useCallback(
    async (connectionId: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const updated = await bankConnectionsApi.syncConnection(connectionId);
        setState((prev) => ({
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
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        await bankConnectionsApi.disconnectConnection(connectionId);
        setState((prev) => ({
          connections: prev.connections.filter((c) => c.id !== connectionId),
          isLoading: false,
          error: null,
        }));
        toast({
          title: 'Success',
          description: 'Bank connection removed',
        });
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

  return {
    ...state,
    fetchConnections,
    startConnection,
    completeConnection,
    syncConnection,
    disconnectConnection,
    reauthConnection,
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
