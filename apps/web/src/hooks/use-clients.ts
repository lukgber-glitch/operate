/**
 * useClients Hook
 * Manages CRM client data with React Query
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
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getCommunications,
  createCommunication,
  getClientMetrics,
  type ClientFilters,
  type CreateClientDto,
  type UpdateClientDto,
  type CreateContactDto,
  type UpdateContactDto,
  type CreateCommunicationDto,
} from '@/lib/api/crm';

// Fetch clients with filters
export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      const response = await getClients(filters);
      return response.data;
    },
  });
}

// Fetch single client
export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const response = await getClient(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create client mutation
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateClientDto) => createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Client created',
        description: 'The client has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create client.',
        variant: 'destructive',
      });
    },
  });
}

// Update client mutation
export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDto }) =>
      updateClient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] });
      toast({
        title: 'Client updated',
        description: 'The client has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update client.',
        variant: 'destructive',
      });
    },
  });
}

// Delete client mutation
export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Client deleted',
        description: 'The client has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete client.',
        variant: 'destructive',
      });
    },
  });
}

// Fetch contacts for a client
export function useContacts(clientId: string) {
  return useQuery({
    queryKey: ['contacts', clientId],
    queryFn: async () => {
      const response = await getContacts(clientId);
      return response.data;
    },
    enabled: !!clientId,
  });
}

// Create contact mutation
export function useCreateContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateContactDto) => createContact(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.clientId] });
      toast({
        title: 'Contact created',
        description: 'The contact has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create contact.',
        variant: 'destructive',
      });
    },
  });
}

// Update contact mutation
export function useUpdateContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactDto }) =>
      updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Contact updated',
        description: 'The contact has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update contact.',
        variant: 'destructive',
      });
    },
  });
}

// Delete contact mutation
export function useDeleteContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Contact deleted',
        description: 'The contact has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete contact.',
        variant: 'destructive',
      });
    },
  });
}

// Fetch communications for a client
export function useCommunications(clientId: string) {
  return useQuery({
    queryKey: ['communications', clientId],
    queryFn: async () => {
      const response = await getCommunications(clientId);
      return response.data;
    },
    enabled: !!clientId,
  });
}

// Create communication mutation
export function useCreateCommunication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCommunicationDto) => createCommunication(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['communications', variables.clientId],
      });
      queryClient.invalidateQueries({ queryKey: ['clients', variables.clientId] });
      toast({
        title: 'Communication logged',
        description: 'The communication has been logged successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to log communication.',
        variant: 'destructive',
      });
    },
  });
}

// Fetch client metrics
export function useClientMetrics(clientId: string) {
  return useQuery({
    queryKey: ['client-metrics', clientId],
    queryFn: async () => {
      const response = await getClientMetrics(clientId);
      return response.data;
    },
    enabled: !!clientId,
  });
}
