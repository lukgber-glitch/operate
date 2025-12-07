/**
 * ELSTER Submission Hooks
 * React Query hooks for VAT return submission and management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { taxApi } from '@/lib/api/tax';
import type {
  VatReturnSubmission,
  ElsterSubmissionResult,
  VatReturnStatus,
  ValidationResult,
  VatReturnPreview,
} from '@/types/tax';
import { getElsterErrorMessage, isRetryableError } from '@/types/tax';

/**
 * Hook to fetch VAT return preview
 */
export function useVatReturnPreview(orgId: string, period: string) {
  return useQuery({
    queryKey: ['vatPreview', orgId, period],
    queryFn: () => taxApi.getVatReturnPreview(orgId, period),
    enabled: !!orgId && !!period,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to validate VAT return data
 */
export function useValidateVatReturn() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: VatReturnSubmission) => taxApi.validateVatReturn(data),
    onSuccess: (result: ValidationResult) => {
      if (result.valid) {
        toast({
          title: 'Validation Successful',
          description: 'Your VAT return data is valid and ready for submission.',
        });
      } else {
        toast({
          title: 'Validation Failed',
          description: `Found ${result.errors.length} error(s). Please fix them before submitting.`,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Validation Error',
        description: error.message || 'Failed to validate VAT return data.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to submit VAT return to ELSTER
 */
export function useSubmitVatReturn() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VatReturnSubmission) => taxApi.submitVatReturn(data),
    onSuccess: (result: ElsterSubmissionResult, variables) => {
      if (result.success) {
        toast({
          title: 'Successfully Submitted!',
          description: result.transferTicket
            ? `Transfer Ticket: ${result.transferTicket}`
            : 'Your VAT return has been submitted to ELSTER.',
        });

        // Invalidate relevant queries
        queryClient.invalidateQueries({
          queryKey: ['vatHistory', variables.organizationId],
        });
        queryClient.invalidateQueries({
          queryKey: ['vatPreview', variables.organizationId, variables.period],
        });
      } else {
        // Handle submission errors
        const errorMessages = result.errors
          ?.map((err) => getElsterErrorMessage(err.code))
          .join(', ') || 'Submission failed';

        toast({
          title: 'Submission Failed',
          description: errorMessages,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Failed to submit VAT return';
      toast({
        title: 'Submission Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
    retry: (failureCount, error: any) => {
      // Retry only on network/timeout errors
      if (error?.code && isRetryableError(error.code)) {
        return failureCount < 2;
      }
      return false;
    },
  });
}

/**
 * Hook to get VAT return submission status
 */
export function useVatReturnStatus(orgId: string, submissionId: string) {
  return useQuery({
    queryKey: ['vatStatus', orgId, submissionId],
    queryFn: () => taxApi.getVatReturnStatus(orgId, submissionId),
    enabled: !!orgId && !!submissionId,
    refetchInterval: (query) => {
      // Poll every 10 seconds if status is pending/processing
      const data = query.state.data;
      if (data?.status === 'pending' || data?.status === 'processing') {
        return 10000;
      }
      return false;
    },
    retry: 3,
  });
}

/**
 * Hook to get submission history
 */
export function useVatReturnHistory(
  orgId: string,
  year?: number,
  options?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }
) {
  return useQuery({
    queryKey: ['vatHistory', orgId, year, options],
    queryFn: () =>
      taxApi.getSubmissionHistory({
        organizationId: orgId,
        year,
        ...options,
      }),
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to download VAT receipt
 */
export function useDownloadReceipt() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (submissionId: string) =>
      taxApi.downloadVatReceipt(submissionId),
    onSuccess: (blob: Blob, submissionId: string) => {
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `elster-receipt-${submissionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Started',
        description: 'Your receipt is being downloaded.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download receipt.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to get draft VAT return
 */
export function useDraftVatReturn(orgId: string, period: string) {
  return useQuery({
    queryKey: ['vatDraft', orgId, period],
    queryFn: () => taxApi.getDraftVatReturn(orgId, period),
    enabled: !!orgId && !!period,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to save draft VAT return
 */
export function useSaveDraftVatReturn() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VatReturnSubmission) => taxApi.saveDraftVatReturn(data),
    onSuccess: (result, variables) => {
      toast({
        title: 'Draft Saved',
        description: 'Your draft has been saved successfully.',
      });

      // Invalidate draft query
      queryClient.invalidateQueries({
        queryKey: ['vatDraft', variables.organizationId, variables.period],
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save draft.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete draft VAT return
 */
export function useDeleteDraftVatReturn() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, period }: { orgId: string; period: string }) =>
      taxApi.deleteDraftVatReturn(orgId, period),
    onSuccess: (_, variables) => {
      toast({
        title: 'Draft Deleted',
        description: 'Your draft has been deleted.',
      });

      // Invalidate draft query
      queryClient.invalidateQueries({
        queryKey: ['vatDraft', variables.orgId, variables.period],
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete draft.',
        variant: 'destructive',
      });
    },
  });
}
