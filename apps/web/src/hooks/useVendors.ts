/**
 * useVendors Hook
 * React Query hooks for vendor management with full CRUD operations
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/use-toast';
import {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorStats,
  type VendorFilters,
  type CreateVendorDto,
  type UpdateVendorDto,
} from '@/lib/api/vendors';

/**
 * Fetch paginated list of vendors with filters
 */
export function useVendors(filters?: VendorFilters) {
  return useQuery({
    queryKey: ['vendors', filters],
    queryFn: async () => {
      const response = await getVendors(filters);
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single vendor by ID
 */
export function useVendor(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['vendors', id],
    queryFn: async () => {
      const response = await getVendor(id);
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch vendor statistics
 */
export function useVendorStats(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['vendors', id, 'stats'],
    queryFn: async () => {
      const response = await getVendorStats(id);
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Create a new vendor
 */
export function useCreateVendor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateVendorDto) => createVendor(data),
    onSuccess: (response) => {
      // Invalidate vendors list queries
      queryClient.invalidateQueries({ queryKey: ['vendors'] });

      // Optionally prefetch the new vendor
      queryClient.setQueryData(['vendors', response.data.id], response.data);

      toast({
        title: 'Vendor created',
        description: `${response.data.name} has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create vendor',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update an existing vendor
 */
export function useUpdateVendor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVendorDto }) =>
      updateVendor(id, data),
    onSuccess: (response, variables) => {
      // Update cached vendor data
      queryClient.setQueryData(['vendors', variables.id], response.data);

      // Invalidate vendors list to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['vendors'], exact: false });

      toast({
        title: 'Vendor updated',
        description: `${response.data.name} has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update vendor',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a vendor
 */
export function useDeleteVendor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteVendor(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['vendors', deletedId] });

      // Invalidate vendors list
      queryClient.invalidateQueries({ queryKey: ['vendors'], exact: false });

      toast({
        title: 'Vendor deleted',
        description: 'The vendor has been permanently deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete vendor',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Prefetch vendor data for faster navigation
 */
export function usePrefetchVendor() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['vendors', id],
      queryFn: async () => {
        const response = await getVendor(id);
        return response.data;
      },
      staleTime: 60000,
    });
  };
}
