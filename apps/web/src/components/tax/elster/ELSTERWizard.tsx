/**
 * ELSTER VAT Return Wizard
 * Complete multi-step wizard for German ELSTER VAT filing
 */

'use client';

import { useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useELSTER } from './hooks/useELSTER';
import { PeriodSelector } from './PeriodSelector';
import { DataReview } from './DataReview';
import { ConfirmSubmission } from './ConfirmSubmission';
import { SubmissionStatus } from './SubmissionStatus';
import { StepsProgress } from './StepsProgress';
import { taxApi } from '@/lib/api/tax';
import { useToast } from '@/components/ui/use-toast';

interface Step {
  id: string;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 'period', label: 'Zeitraum', description: 'Periode auswählen' },
  { id: 'review', label: 'Datenprüfung', description: 'Daten überprüfen' },
  { id: 'confirm', label: 'Bestätigung', description: 'Übermitteln' },
  { id: 'status', label: 'Status', description: 'Ergebnis' },
];

interface ELSTERWizardProps {
  organizationId?: string;
  onComplete?: () => void;
}

export function ELSTERWizard({ organizationId, onComplete }: ELSTERWizardProps) {
  const { toast } = useToast();

  const {
    currentStep,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    period,
    setPeriod,
    periodType,
    setPeriodType,
    preview,
    isLoadingPreview,
    loadPreview,
    validationResult,
    isValidating,
    validateReturn,
    submissionResult,
    isSubmitting,
    submitReturn,
    submissionStatus,
    isLoadingStatus,
    refreshStatus,
    saveDraft,
    resetWizard,
    setOrganizationId,
  } = useELSTER({
    organizationId,
    onSubmissionComplete: (result) => {
      if (result.success) {
        toast({
          title: 'Erfolgreich übermittelt',
          description: 'Ihre Umsatzsteuervoranmeldung wurde erfolgreich an ELSTER übermittelt.',
        });
      }
    },
  });

  // Set organization ID if provided
  useEffect(() => {
    if (organizationId) {
      setOrganizationId(organizationId);
    }
  }, [organizationId, setOrganizationId]);

  // Step 0: Period Selection
  const handlePeriodSelect = useCallback(
    async (selectedPeriod: string, selectedPeriodType: 'monthly' | 'quarterly') => {
      setPeriod(selectedPeriod);
      setPeriodType(selectedPeriodType);

      // Load preview data
      await loadPreview();

      // Move to next step
      goToNextStep();
    },
    [setPeriod, setPeriodType, loadPreview, goToNextStep]
  );

  // Step 1: Data Review
  const handleReviewContinue = useCallback(async () => {
    // Validate before continuing
    const isValid = await validateReturn();
    if (isValid) {
      goToNextStep();
    }
  }, [validateReturn, goToNextStep]);

  // Step 2: Confirm Submission
  const handleSubmit = useCallback(async () => {
    await submitReturn();
    goToNextStep();
  }, [submitReturn, goToNextStep]);

  // Step 3: Status - Download Receipt
  const handleDownloadReceipt = useCallback(async () => {
    if (!submissionResult?.receiptId) {
      toast({
        title: 'Fehler',
        description: 'Kein Beleg verfügbar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const blob = await taxApi.downloadVatReceipt(submissionResult.receiptId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ELSTER-Beleg-${period}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Beleg heruntergeladen',
        description: 'Der Beleg wurde erfolgreich heruntergeladen.',
      });
    } catch (error) {
      toast({
        title: 'Download fehlgeschlagen',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    }
  }, [submissionResult, period, toast]);

  // Close wizard
  const handleClose = useCallback(() => {
    resetWizard();
    onComplete?.();
  }, [resetWizard, onComplete]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🇩🇪</span>
            ELSTER - Umsatzsteuervoranmeldung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StepsProgress steps={STEPS} currentStep={currentStep} />
        </CardContent>
      </Card>

      {/* Step 0: Period Selection */}
      {currentStep === 0 && (
        <PeriodSelector
          onSelect={handlePeriodSelect}
          isLoading={isLoadingPreview}
          selectedPeriod={period}
          selectedPeriodType={periodType}
        />
      )}

      {/* Step 1: Data Review */}
      {currentStep === 1 && preview && (
        <DataReview
          preview={preview}
          onContinue={handleReviewContinue}
          onBack={goToPreviousStep}
          onSaveDraft={saveDraft}
          isLoading={isValidating}
        />
      )}

      {/* Step 2: Confirm Submission */}
      {currentStep === 2 && preview && (
        <ConfirmSubmission
          preview={preview}
          period={period}
          onSubmit={handleSubmit}
          onBack={goToPreviousStep}
          validationResult={validationResult}
          isLoading={isSubmitting}
          isValidating={isValidating}
        />
      )}

      {/* Step 3: Submission Status */}
      {currentStep === 3 && submissionResult && (
        <SubmissionStatus
          submissionResult={submissionResult}
          status={submissionStatus}
          onDownloadReceipt={handleDownloadReceipt}
          onRefreshStatus={refreshStatus}
          onClose={handleClose}
          isLoadingStatus={isLoadingStatus}
        />
      )}
    </div>
  );
}
