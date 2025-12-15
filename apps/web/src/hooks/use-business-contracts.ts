'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types
export interface BusinessContract {
  id: string;
  title: string;
  clientId: string;
  clientName?: string;
  content: string;
  value?: number;
  currency?: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  signedAt?: string;
  signatureUrl?: string;
  signerName?: string;
  signerEmail?: string;
  signToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: TemplateVariable[];
  isSystem: boolean;
  createdAt: string;
}

export interface TemplateVariable {
  key: string;
  label: string;
  defaultValue?: string;
}

interface ContractFilters {
  status?: string;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// API Functions
const contractsApi = {
  list: async (filters: ContractFilters = {}) => {
    const { data } = await axios.get(`${API_URL}/api/v1/business-contracts`, {
      params: filters,
    });
    return data;
  },

  get: async (id: string) => {
    const { data } = await axios.get(`${API_URL}/api/v1/business-contracts/${id}`);
    return data;
  },

  create: async (contractData: Partial<BusinessContract>) => {
    const { data } = await axios.post(`${API_URL}/api/v1/business-contracts`, contractData);
    return data;
  },

  createFromTemplate: async (templateId: string, variables: Record<string, string>) => {
    const { data } = await axios.post(
      `${API_URL}/api/v1/business-contracts/from-template/${templateId}`,
      { variables }
    );
    return data;
  },

  update: async (id: string, updates: Partial<BusinessContract>) => {
    const { data } = await axios.patch(`${API_URL}/api/v1/business-contracts/${id}`, updates);
    return data;
  },

  delete: async (id: string) => {
    await axios.delete(`${API_URL}/api/v1/business-contracts/${id}`);
  },

  send: async (
    id: string,
    recipientData: { recipientName: string; recipientEmail: string; message?: string }
  ) => {
    const { data } = await axios.post(
      `${API_URL}/api/v1/business-contracts/${id}/send`,
      recipientData
    );
    return data;
  },

  // Templates
  listTemplates: async () => {
    const { data } = await axios.get(`${API_URL}/api/v1/business-contracts/templates`);
    return data;
  },

  getTemplate: async (id: string) => {
    const { data } = await axios.get(`${API_URL}/api/v1/business-contracts/templates/${id}`);
    return data;
  },

  // Public
  getPublicContract: async (token: string) => {
    const { data } = await axios.get(`${API_URL}/api/v1/business-contracts/sign/${token}`);
    return data;
  },

  signContract: async (
    token: string,
    signatureData: { signerName: string; signerEmail: string; signature: string }
  ) => {
    const { data } = await axios.post(
      `${API_URL}/api/v1/business-contracts/sign/${token}`,
      signatureData
    );
    return data;
  },
};

// Hooks
export function useBusinessContracts(filters: ContractFilters = {}) {
  return useQuery({
    queryKey: ['business-contracts', filters],
    queryFn: () => contractsApi.list(filters),
  });
}

export function useBusinessContract(id: string) {
  return useQuery({
    queryKey: ['business-contracts', id],
    queryFn: () => contractsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateBusinessContract() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: contractsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-contracts'] });
      toast({
        title: 'Success',
        description: 'Contract created successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create contract',
        variant: 'destructive',
      });
    },
  });
}

export function useCreateFromTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ templateId, variables }: { templateId: string; variables: Record<string, string> }) =>
      contractsApi.createFromTemplate(templateId, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-contracts'] });
      toast({
        title: 'Success',
        description: 'Contract created from template',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create contract from template',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateBusinessContract() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BusinessContract> }) =>
      contractsApi.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['business-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['business-contracts', id] });
      toast({
        title: 'Success',
        description: 'Contract updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update contract',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteBusinessContract() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: contractsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-contracts'] });
      toast({
        title: 'Success',
        description: 'Contract deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete contract',
        variant: 'destructive',
      });
    },
  });
}

export function useSendBusinessContract() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      recipientData,
    }: {
      id: string;
      recipientData: { recipientName: string; recipientEmail: string; message?: string };
    }) => contractsApi.send(id, recipientData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['business-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['business-contracts', id] });
    },
  });
}

// Templates
export function useContractTemplates() {
  return useQuery({
    queryKey: ['contract-templates'],
    queryFn: contractsApi.listTemplates,
  });
}

export function useContractTemplate(id: string) {
  return useQuery({
    queryKey: ['contract-templates', id],
    queryFn: () => contractsApi.getTemplate(id),
    enabled: !!id,
  });
}

// Public hooks
export function usePublicContract(token: string) {
  return useQuery({
    queryKey: ['public-contract', token],
    queryFn: () => contractsApi.getPublicContract(token),
    enabled: !!token,
  });
}

export function useSignContract() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      token,
      signatureData,
    }: {
      token: string;
      signatureData: { signerName: string; signerEmail: string; signature: string };
    }) => contractsApi.signContract(token, signatureData),
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to sign contract',
        variant: 'destructive',
      });
    },
  });
}
