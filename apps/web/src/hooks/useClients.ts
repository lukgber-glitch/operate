/**
 * useClients Hook
 * Enhanced React Query hooks for client management with full CRUD operations
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/use-toast';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  bulkUpdateClients,
  type ClientFilters,
  type CreateClientDto,
  type UpdateClientDto,
  type BulkUpdateDto,
} from '@/lib/api/clients';

/**
 * Fetch paginated list of clients with filters
 */
export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      const response = await getClients(filters);
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  });
}

/**
 * Fetch single client by ID
 */
export function useClient(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const response = await getClient(id);
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateClientDto) => createClient(data),
    onSuccess: (response) => {
      // Invalidate clients list queries
      queryClient.invalidateQueries({ queryKey: ['clients'] });

      // Optionally prefetch the new client
      queryClient.setQueryData(['clients', response.data.id], response.data);

      toast({
        title: 'Client created',
        description: `${response.data.name} has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create client',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update an existing client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDto }) =>
      updateClient(id, data),
    onSuccess: (response, variables) => {
      // Update cached client data
      queryClient.setQueryData(['clients', variables.id], response.data);

      // Invalidate clients list to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['clients'], exact: false });

      toast({
        title: 'Client updated',
        description: `${response.data.name} has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update client',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a client with optimistic update
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    // Optimistic update - remove from list immediately
    onMutate: async (deletedId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['clients'] });

      // Snapshot previous values for rollback
      const previousData = queryClient.getQueriesData({ queryKey: ['clients'] });

      // Optimistically remove from all client lists
      queryClient.setQueriesData(
        { queryKey: ['clients'] },
        (old: any) => {
          if (old?.items) {
            return {
              ...old,
              items: old.items.filter((client: any) => client.id !== deletedId),
              total: old.total - 1,
            };
          }
          return old;
        }
      );

      return { previousData };
    },
    onSuccess: (_, deletedId) => {
      // Remove individual client cache
      queryClient.removeQueries({ queryKey: ['clients', deletedId] });

      toast({
        title: 'Client deleted',
        description: 'The client has been permanently deleted.',
      });
    },
    onError: (error: Error, _, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast({
        title: 'Failed to delete client',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['clients'], exact: false });
    },
  });
}

/**
 * Bulk update multiple clients
 */
export function useBulkUpdateClients() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ clientIds, updates }: { clientIds: string[]; updates: UpdateClientDto }) =>
      bulkUpdateClients({ clientIds, updates }),
    onSuccess: (response) => {
      // Invalidate all client queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['clients'] });

      toast({
        title: 'Bulk update completed',
        description: `${response.data.updatedCount} client(s) updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Bulk update failed',
        description: error.message || 'Failed to update clients.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Prefetch client data for faster navigation
 */
export function usePrefetchClient() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['clients', id],
      queryFn: async () => {
        const response = await getClient(id);
        return response.data;
      },
      staleTime: 60000,
    });
  };
}
