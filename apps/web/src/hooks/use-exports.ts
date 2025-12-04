'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import {
  exportsApi,
  ExportFormat,
  ExportFilters,
  CreateDatevExportRequest,
  CreateSaftExportRequest,
  CreateBmdExportRequest,
  ExportResponse,
} from '@/lib/api/exports';

/**
 * Hook for fetching exports list
 */
export function useExports(filters?: ExportFilters) {
  return useQuery({
    queryKey: ['exports', filters],
    queryFn: () => exportsApi.getExports(filters),
  });
}

/**
 * Hook for fetching single export
 */
export function useExport(id: string) {
  return useQuery({
    queryKey: ['export', id],
    queryFn: () => exportsApi.getExport(id),
    enabled: !!id,
  });
}

/**
 * Hook for creating DATEV export
 */
export function useCreateDatevExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDatevExportRequest) => exportsApi.createDatevExport(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exports'] });
      toast({
        title: 'Export Started',
        description: 'Your DATEV export is being generated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Export Failed',
        description: error?.response?.data?.message || 'Failed to create DATEV export',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for creating SAF-T export
 */
export function useCreateSaftExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSaftExportRequest) => exportsApi.createSaftExport(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exports'] });
      toast({
        title: 'Export Started',
        description: 'Your SAF-T export is being generated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Export Failed',
        description: error?.response?.data?.message || 'Failed to create SAF-T export',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for creating BMD export
 */
export function useCreateBmdExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBmdExportRequest) => exportsApi.createBmdExport(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exports'] });
      toast({
        title: 'Export Started',
        description: 'Your BMD export is being generated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Export Failed',
        description: error?.response?.data?.message || 'Failed to create BMD export',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for downloading export
 */
export function useDownloadExport() {
  return useMutation({
    mutationFn: ({ id, format }: { id: string; format: ExportFormat }) =>
      exportsApi.downloadExport(id, format),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${variables.id}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download Started',
        description: 'Your export file is downloading.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Download Failed',
        description: error?.response?.data?.message || 'Failed to download export',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for deleting export
 */
export function useDeleteExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, format }: { id: string; format: ExportFormat }) =>
      exportsApi.deleteExport(id, format),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exports'] });
      toast({
        title: 'Export Deleted',
        description: 'The export has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error?.response?.data?.message || 'Failed to delete export',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for polling export status
 */
export function useExportStatus(id: string, format: ExportFormat, enabled = false) {
  return useQuery({
    queryKey: ['export-status', id, format],
    queryFn: () => exportsApi.getExportStatus(id, format),
    enabled: enabled && !!id,
    refetchInterval: (data) => {
      // Stop polling if export is completed or failed
      if (
        data?.status === 'READY' ||
        data?.status === 'COMPLETED' ||
        data?.status === 'FAILED'
      ) {
        return false;
      }
      // Poll every 3 seconds
      return 3000;
    },
  });
}

/**
 * Custom hook for managing export wizard state
 */
export function useExportWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);
  const [currentExportId, setCurrentExportId] = useState<string | null>(null);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));
  const resetWizard = () => {
    setCurrentStep(0);
    setSelectedFormat(null);
    setCurrentExportId(null);
  };

  return {
    currentStep,
    selectedFormat,
    currentExportId,
    setCurrentStep,
    setSelectedFormat,
    setCurrentExportId,
    nextStep,
    prevStep,
    resetWizard,
  };
}
