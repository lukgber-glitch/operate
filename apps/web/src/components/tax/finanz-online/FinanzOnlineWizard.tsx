'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinanzOnlineUva } from './hooks/useFinanzOnline';

import { PeriodSelector } from './PeriodSelector';
import { DataReview } from './DataReview';
import { UidVerification } from './UidVerification';
import { ConfirmSubmission } from './ConfirmSubmission';
import { SubmissionComplete } from './SubmissionComplete';
import { StepsProgress } from './StepsProgress';

type WizardStep = 'period' | 'review' | 'verify' | 'confirm' | 'complete';

interface Step {
  id: WizardStep;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 'period', label: 'Zeitraum', description: 'Periode auswählen' },
  { id: 'review', label: 'Datenprüfung', description: 'Daten überprüfen' },
  { id: 'verify', label: 'UID-Prüfung', description: 'UID verifizieren' },
  { id: 'confirm', label: 'Bestätigung', description: 'Übermitteln' },
  { id: 'complete', label: 'Abschluss', description: 'Ergebnis' },
];

export function FinanzOnlineWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('period');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedPeriodType, setSelectedPeriodType] = useState<'monthly' | 'quarterly'>('monthly');
  const [uid, setUid] = useState<string>('');
  const [isUidVerified, setIsUidVerified] = useState(false);

  const {
    preview,
    submissionResult,
    isLoading,
    fetchPreview,
    verifyUid,
    submitUva,
  } = useFinanzOnlineUva();

  const handlePeriodSelect = useCallback(async (period: string, periodType: 'monthly' | 'quarterly') => {
    setSelectedPeriod(period);
    setSelectedPeriodType(periodType);

    // Fetch preview data from backend
    await fetchPreview(period);

    setCurrentStep('review');
  }, [fetchPreview]);

  const handleReviewContinue = useCallback(() => {
    setCurrentStep('verify');
  }, []);

  const handleUidVerify = useCallback(async (uidNumber: string) => {
    const result = await verifyUid(uidNumber);
    if (result.valid) {
      setUid(uidNumber);
      setIsUidVerified(true);
      setCurrentStep('confirm');
    }
    return result;
  }, [verifyUid]);

  const handleSubmit = useCallback(async () => {
    if (!preview || !uid) return;

    const submission = {
      organizationId: preview.organizationId || '',
      period: selectedPeriod,
      periodType: selectedPeriodType,
      uva: {
        kz000: preview.kennzahlen.kz000,
        kz022: preview.kennzahlen.kz022,
        kz029: preview.kennzahlen.kz029,
        kz006: preview.kennzahlen.kz006 || 0,
        kz072: preview.kennzahlen.kz072,
        kz083: preview.kennzahlen.kz083,
      },
    };

    await submitUva(submission);
    setCurrentStep('complete');
  }, [preview, uid, selectedPeriod, selectedPeriodType, submitUva]);

  const handleComplete = useCallback(() => {
    // Reset wizard
    setCurrentStep('period');
    setSelectedPeriod('');
    setUid('');
    setIsUidVerified(false);
  }, []);

  const goBack = useCallback(() => {
    const stepOrder: WizardStep[] = ['period', 'review', 'verify', 'confirm', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStep = stepOrder[currentIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep);
      }
    }
  }, [currentStep]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🇦🇹</span>
            FinanzOnline - UVA Einreichung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StepsProgress steps={STEPS} currentStep={currentStep} />
        </CardContent>
      </Card>

      {currentStep === 'period' && (
        <PeriodSelector
          onSelect={handlePeriodSelect}
          isLoading={isLoading}
        />
      )}

      {currentStep === 'review' && preview && (
        <DataReview
          preview={preview}
          onContinue={handleReviewContinue}
          onBack={goBack}
          isLoading={isLoading}
        />
      )}

      {currentStep === 'verify' && (
        <UidVerification
          onVerify={handleUidVerify}
          onBack={goBack}
          isLoading={isLoading}
        />
      )}

      {currentStep === 'confirm' && preview && (
        <ConfirmSubmission
          preview={preview}
          uid={uid}
          period={selectedPeriod}
          onSubmit={handleSubmit}
          onBack={goBack}
          isLoading={isLoading}
        />
      )}

      {currentStep === 'complete' && submissionResult && (
        <SubmissionComplete
          result={submissionResult}
          onClose={handleComplete}
        />
      )}
    </div>
  );
}
