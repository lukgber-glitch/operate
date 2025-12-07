import { useMutation, useQuery } from '@tanstack/react-query';
import { finanzOnlineApi, UvaPreview, UidVerificationResult, FinanzOnlineSubmission, FinanzOnlineResult } from '@/lib/api/austrian-tax';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useState } from 'react';

export function useFinanzOnlineUva() {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const orgId = user?.orgId || '';
  const [currentPeriod, setCurrentPeriod] = useState<string>('');
  const [submissionResult, setSubmissionResult] = useState<FinanzOnlineResult | null>(null);

  // Fetch UVA preview data
  const {
    data: preview,
    isLoading: isLoadingPreview,
    refetch: refetchPreview,
  } = useQuery<UvaPreview>({
    queryKey: ['uvaPreview', orgId, currentPeriod],
    queryFn: () => finanzOnlineApi.getUvaPreview(orgId, currentPeriod),
    enabled: !!currentPeriod,
  });

  // Verify UID mutation
  const verifyUidMutation = useMutation<UidVerificationResult, Error, string>({
    mutationFn: (uid: string) => finanzOnlineApi.verifyUid(uid),
    onSuccess: (data) => {
      if (data.valid) {
        toast({
          title: 'UID verifiziert',
          description: `${data.name || 'Unternehmen'} erfolgreich verifiziert`,
        });
      } else {
        toast({
          title: 'UID ungültig',
          description: 'Die eingegebene UID konnte nicht verifiziert werden',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Fehler bei UID-Prüfung',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Submit UVA mutation
  const submitUvaMutation = useMutation<FinanzOnlineResult, Error, FinanzOnlineSubmission>({
    mutationFn: (data: FinanzOnlineSubmission) => finanzOnlineApi.submitUva(data),
    onSuccess: (data) => {
      setSubmissionResult(data);
      if (data.success) {
        toast({
          title: 'UVA erfolgreich übermittelt',
          description: `Referenznummer: ${data.referenceNumber}`,
        });
      } else {
        toast({
          title: 'Übermittlung fehlgeschlagen',
          description: data.errors?.map(e => e.message).join(', ') || 'Unbekannter Fehler',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Fehler bei Übermittlung',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const fetchPreview = async (period: string) => {
    setCurrentPeriod(period);
    await refetchPreview();
  };

  return {
    preview,
    submissionResult,
    isLoading: isLoadingPreview || verifyUidMutation.isPending || submitUvaMutation.isPending,
    fetchPreview,
    verifyUid: verifyUidMutation.mutateAsync,
    submitUva: submitUvaMutation.mutateAsync,
  };
}

export function useUvaPreview(orgId: string, period: string) {
  return useQuery<UvaPreview>({
    queryKey: ['uvaPreview', orgId, period],
    queryFn: () => finanzOnlineApi.getUvaPreview(orgId, period),
    enabled: !!orgId && !!period,
  });
}

export function useSubmitUva() {
  const { toast } = useToast();

  return useMutation<FinanzOnlineResult, Error, FinanzOnlineSubmission>({
    mutationFn: finanzOnlineApi.submitUva,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'UVA erfolgreich übermittelt',
          description: `Referenznummer: ${data.referenceNumber}`,
        });
      } else {
        toast({
          title: 'Übermittlung fehlgeschlagen',
          description: data.errors?.map(e => e.message).join(', ') || 'Unbekannter Fehler',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useVerifyUid() {
  const { toast } = useToast();

  return useMutation<UidVerificationResult, Error, string>({
    mutationFn: (uid: string) => finanzOnlineApi.verifyUid(uid),
    onSuccess: (data) => {
      if (data.valid) {
        toast({
          title: 'UID verifiziert',
          description: `${data.name || 'Unternehmen'} erfolgreich verifiziert`,
        });
      } else {
        toast({
          title: 'UID ungültig',
          description: 'Die eingegebene UID konnte nicht verifiziert werden',
          variant: 'destructive',
        });
      }
    },
  });
}
