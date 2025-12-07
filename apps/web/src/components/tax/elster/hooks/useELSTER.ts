/**
 * ELSTER VAT Return Wizard Hook
 * Manages wizard state, data fetching, and submission logic
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxApi } from '@/lib/api/tax';
import type {
  VatReturnPreview,
  ElsterSubmissionResult,
  VatReturnStatus,
  VatReturnSubmission,
  ValidationResult,
} from '@/types/tax';
import { useToast } from '@/components/ui/use-toast';

export interface UseELSTERReturn {
  // Step management
  currentStep: number;
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // Period selection
  period: string;
  setPeriod: (period: string) => void;
  periodType: 'monthly' | 'quarterly';
  setPeriodType: (type: 'monthly' | 'quarterly') => void;

  // Data preview
  preview: VatReturnPreview | null;
  isLoadingPreview: boolean;
  previewError: Error | null;
  loadPreview: () => Promise<void>;
  refetchPreview: () => Promise<void>;

  // Validation
  validationResult: ValidationResult | null;
  isValidating: boolean;
  validateReturn: () => Promise<boolean>;

  // Submission
  submissionResult: ElsterSubmissionResult | null;
  isSubmitting: boolean;
  submitReturn: () => Promise<void>;

  // Submission status tracking
  submissionStatus: VatReturnStatus | null;
  isLoadingStatus: boolean;
  refreshStatus: () => Promise<void>;

  // Draft handling
  hasDraft: boolean;
  isLoadingDraft: boolean;
  loadDraft: () => Promise<void>;
  saveDraft: () => Promise<void>;
  deleteDraft: () => Promise<void>;

  // Organization ID (from context or props)
  organizationId: string;
  setOrganizationId: (id: string) => void;

  // Reset wizard
  resetWizard: () => void;
}

interface UseELSTEROptions {
  organizationId?: string;
  onSubmissionComplete?: (result: ElsterSubmissionResult) => void;
}

const TOTAL_STEPS = 6;

export function useELSTER(options: UseELSTEROptions = {}): UseELSTERReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [organizationId, setOrganizationId] = useState(options.organizationId || 'current-org');
  const [period, setPeriod] = useState('');
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly'>('monthly');
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Preview query
  const {
    data: preview,
    isLoading: isLoadingPreview,
    error: previewError,
    refetch: refetchPreview,
  } = useQuery({
    queryKey: ['vat-preview', organizationId, period],
    queryFn: async () => {
      if (!period) return null;
      return taxApi.getVatReturnPreview(organizationId, period);
    },
    enabled: !!period,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Draft query
  const {
    data: draftData,
    isLoading: isLoadingDraft,
    refetch: refetchDraft,
  } = useQuery({
    queryKey: ['vat-draft', organizationId, period],
    queryFn: async () => {
      if (!period) return null;
      return taxApi.getDraftVatReturn(organizationId, period);
    },
    enabled: !!period,
  });

  // Validation mutation
  const {
    data: validationResult,
    mutateAsync: validateMutation,
    isPending: isValidating,
  } = useMutation({
    mutationFn: async (data: VatReturnSubmission) => {
      return taxApi.validateVatReturn(data);
    },
  });

  // Submission mutation
  const {
    data: submissionResult,
    mutateAsync: submitMutation,
    isPending: isSubmitting,
  } = useMutation({
    mutationFn: async (data: VatReturnSubmission) => {
      return taxApi.submitVatReturn(data);
    },
    onSuccess: (result) => {
      if (result.success && result.receiptId) {
        setSubmissionId(result.receiptId);
      }
      options.onSubmissionComplete?.(result);
    },
  });

  // Status query (only when we have a submission ID)
  const {
    data: submissionStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['vat-status', organizationId, submissionId],
    queryFn: async () => {
      if (!submissionId) return null;
      return taxApi.getVatReturnStatus(organizationId, submissionId);
    },
    enabled: !!submissionId,
    refetchInterval: (query) => {
      // Auto-refresh every 10 seconds if status is pending or processing
      const data = query.state.data;
      if (data && (data.status === 'pending' || data.status === 'processing')) {
        return 10000;
      }
      return false;
    },
  });

  // Save draft mutation
  const { mutateAsync: saveDraftMutation } = useMutation({
    mutationFn: async (data: VatReturnSubmission) => {
      return taxApi.saveDraftVatReturn(data);
    },
    onSuccess: () => {
      toast({
        title: 'Entwurf gespeichert',
        description: 'Ihre USt-Voranmeldung wurde als Entwurf gespeichert.',
      });
      refetchDraft();
    },
  });

  // Delete draft mutation
  const { mutateAsync: deleteDraftMutation } = useMutation({
    mutationFn: async () => {
      return taxApi.deleteDraftVatReturn(organizationId, period);
    },
    onSuccess: () => {
      refetchDraft();
    },
  });

  // Step navigation
  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Load preview data
  const loadPreview = useCallback(async () => {
    if (!period) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie einen Zeitraum aus.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await refetchPreview();
    } catch (error) {
      toast({
        title: 'Fehler beim Laden der Daten',
        description: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    }
  }, [period, refetchPreview, toast]);

  // Validate return
  const validateReturn = useCallback(async (): Promise<boolean> => {
    if (!preview) {
      toast({
        title: 'Fehler',
        description: 'Keine Daten zum Validieren verfügbar.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const submission: VatReturnSubmission = {
        organizationId,
        period,
        periodType,
        outputVat: preview.outputVat.total,
        inputVat: preview.inputVat.total,
        netVat: preview.netVat,
        transactions: [
          ...preview.outputVat.invoices.map((inv) => ({
            id: inv.id,
            amount: inv.amount,
            vat: inv.vat,
            type: 'income' as const,
            date: inv.date,
            description: inv.invoiceNumber,
          })),
          ...preview.inputVat.expenses.map((exp) => ({
            id: exp.id,
            amount: exp.amount,
            vat: exp.vat,
            type: 'expense' as const,
            date: exp.date,
            description: exp.reference,
          })),
        ],
      };

      const result = await validateMutation(submission);

      if (!result.valid) {
        toast({
          title: 'Validierung fehlgeschlagen',
          description: `${result.errors.length} Fehler gefunden. Bitte überprüfen Sie Ihre Daten.`,
          variant: 'destructive',
        });
        return false;
      }

      if (result.warnings.length > 0) {
        toast({
          title: 'Warnungen',
          description: `${result.warnings.length} Warnungen gefunden. Sie können trotzdem fortfahren.`,
        });
      }

      return true;
    } catch (error) {
      toast({
        title: 'Validierungsfehler',
        description: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
      return false;
    }
  }, [preview, organizationId, period, periodType, validateMutation, toast]);

  // Submit return
  const submitReturn = useCallback(async () => {
    if (!preview) {
      toast({
        title: 'Fehler',
        description: 'Keine Daten zum Übermitteln verfügbar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const submission: VatReturnSubmission = {
        organizationId,
        period,
        periodType,
        outputVat: preview.outputVat.total,
        inputVat: preview.inputVat.total,
        netVat: preview.netVat,
        transactions: [
          ...preview.outputVat.invoices.map((inv) => ({
            id: inv.id,
            amount: inv.amount,
            vat: inv.vat,
            type: 'income' as const,
            date: inv.date,
            description: inv.invoiceNumber,
          })),
          ...preview.inputVat.expenses.map((exp) => ({
            id: exp.id,
            amount: exp.amount,
            vat: exp.vat,
            type: 'expense' as const,
            date: exp.date,
            description: exp.reference,
          })),
        ],
      };

      const result = await submitMutation(submission);

      if (result.success) {
        toast({
          title: 'Erfolgreich übermittelt',
          description: `Transfer-Ticket: ${result.transferTicket || 'N/A'}`,
        });
        // Delete draft after successful submission
        await deleteDraftMutation();
      } else {
        toast({
          title: 'Übermittlung fehlgeschlagen',
          description: result.errors?.[0]?.message || 'Ein Fehler ist aufgetreten.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Übermittlungsfehler',
        description: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    }
  }, [preview, organizationId, period, periodType, submitMutation, deleteDraftMutation, toast]);

  // Load draft
  const loadDraft = useCallback(async () => {
    await refetchDraft();
  }, [refetchDraft]);

  // Save draft
  const saveDraft = useCallback(async () => {
    if (!preview) return;

    const submission: VatReturnSubmission = {
      organizationId,
      period,
      periodType,
      outputVat: preview.outputVat.total,
      inputVat: preview.inputVat.total,
      netVat: preview.netVat,
      transactions: [
        ...preview.outputVat.invoices.map((inv) => ({
          id: inv.id,
          amount: inv.amount,
          vat: inv.vat,
          type: 'income' as const,
          date: inv.date,
          description: inv.invoiceNumber,
        })),
        ...preview.inputVat.expenses.map((exp) => ({
          id: exp.id,
          amount: exp.amount,
          vat: exp.vat,
          type: 'expense' as const,
          date: exp.date,
          description: exp.reference,
        })),
      ],
    };

    await saveDraftMutation(submission);
  }, [preview, organizationId, period, periodType, saveDraftMutation]);

  // Delete draft
  const deleteDraft = useCallback(async () => {
    await deleteDraftMutation();
  }, [deleteDraftMutation]);

  // Refresh status
  const refreshStatus = useCallback(async () => {
    if (submissionId) {
      await refetchStatus();
    }
  }, [submissionId, refetchStatus]);

  // Reset wizard
  const resetWizard = useCallback(() => {
    setCurrentStep(0);
    setPeriod('');
    setPeriodType('monthly');
    setSubmissionId(null);
    queryClient.removeQueries({ queryKey: ['vat-preview'] });
    queryClient.removeQueries({ queryKey: ['vat-status'] });
  }, [queryClient]);

  return {
    // Step management
    currentStep,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,

    // Period selection
    period,
    setPeriod,
    periodType,
    setPeriodType,

    // Data preview
    preview: preview ?? null,
    isLoadingPreview,
    previewError: previewError as Error | null,
    loadPreview,
    refetchPreview: loadPreview,

    // Validation
    validationResult: validationResult ?? null,
    isValidating,
    validateReturn,

    // Submission
    submissionResult: submissionResult ?? null,
    isSubmitting,
    submitReturn,

    // Submission status
    submissionStatus: submissionStatus ?? null,
    isLoadingStatus,
    refreshStatus,

    // Draft handling
    hasDraft: !!draftData,
    isLoadingDraft,
    loadDraft,
    saveDraft,
    deleteDraft,

    // Organization
    organizationId,
    setOrganizationId,

    // Reset
    resetWizard,
  };
}
