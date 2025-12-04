'use client';

import { Check } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  useUVA,
  UVAPeriod,
  UVAFilingPeriod,
  UVAData,
  UVASubmissionResult,
  FinanzOnlineCredentials,
} from '../hooks/useUVA';

import { PeriodSelector } from './PeriodSelector';
import { UVADataReview } from './UVADataReview';
import { FinanzOnlineAuth } from './FinanzOnlineAuth';
import { UVAStatusTracker } from './UVAStatusTracker';

type WizardStep = 'period' | 'review' | 'submit' | 'status';

interface Step {
  id: WizardStep;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 'period', label: 'Zeitraum', description: 'Zeitraum auswählen' },
  { id: 'review', label: 'Datenprüfung', description: 'Daten überprüfen' },
  { id: 'submit', label: 'Übermittlung', description: 'An FinanzOnline' },
  { id: 'status', label: 'Status', description: 'Ergebnis prüfen' },
];

export function UVAWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('period');
  const [selectedPeriod, setSelectedPeriod] = useState<UVAPeriod | null>(null);
  const [periodType, setPeriodType] = useState<UVAFilingPeriod>(UVAFilingPeriod.MONTHLY);
  const [uvaData, setUvaData] = useState<Partial<UVAData>>({});
  const [submissionResult, setSubmissionResult] = useState<UVASubmissionResult | null>(null);
  const [hasAutoSaved, setHasAutoSaved] = useState(false);

  const {
    calculation,
    validationResult,
    filings,
    isLoading,
    calculateVAT,
    getFilings,
    saveDraft,
    submit,
    getSubmissionStatus,
  } = useUVA();

  // Load previous filings on mount
  useEffect(() => {
    getFilings();
  }, [getFilings]);

  // Auto-save draft periodically
  useEffect(() => {
    if (!hasAutoSaved && uvaData.period && Object.keys(uvaData).length > 1) {
      const timer = setTimeout(() => {
        if (currentStep !== 'submit' && currentStep !== 'status') {
          saveDraft(uvaData as UVAData).catch(() => {
            // Silently fail auto-save
          });
          setHasAutoSaved(true);
        }
      }, 5000); // Auto-save after 5 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [uvaData, currentStep, hasAutoSaved, saveDraft]);

  const handlePeriodSelect = useCallback(async (period: UVAPeriod, type: UVAFilingPeriod) => {
    setSelectedPeriod(period);
    setPeriodType(type);

    // Calculate VAT from invoices
    const calc = await calculateVAT(period);

    // Initialize UVA data with calculation
    setUvaData({
      period,
      uid: 'ATU12345678', // TODO: Get from organization settings
      domesticRevenue20: calc.domesticRevenue20,
      domesticRevenue13: calc.domesticRevenue13,
      domesticRevenue10: calc.domesticRevenue10,
      domesticRevenue0: calc.domesticRevenue0,
      taxFreeRevenue: calc.taxFreeRevenue,
      euDeliveries: calc.euDeliveries,
      euAcquisitions20: calc.euAcquisitions20,
      euAcquisitions13: calc.euAcquisitions13,
      euAcquisitions10: calc.euAcquisitions10,
      reverseChargeRevenue: calc.reverseChargeRevenue,
      inputTax: calc.inputTax,
      importVat: calc.importVat,
      euAcquisitionsInputTax: calc.euAcquisitionsInputTax,
    });

    setCurrentStep('review');
  }, [calculateVAT]);

  const handleDataUpdate = useCallback((data: Partial<UVAData>) => {
    setUvaData(prev => ({ ...prev, ...data }));
    setHasAutoSaved(false); // Reset auto-save flag when data changes
  }, []);

  const handleSubmit = useCallback(async (
    credentials: FinanzOnlineCredentials,
    testMode: boolean
  ) => {
    if (!uvaData.period) {
      throw new Error('No UVA data available');
    }

    // Save final draft before submitting
    await saveDraft(uvaData as UVAData);

    // Submit to FinanzOnline
    const result = await submit(uvaData as UVAData, credentials, testMode);
    setSubmissionResult(result);
    return result;
  }, [uvaData, saveDraft, submit]);

  const handleComplete = useCallback((result: UVASubmissionResult) => {
    setSubmissionResult(result);
    setCurrentStep('status');
  }, []);

  const handleCheckStatus = useCallback(async (id: string) => {
    const filing = await getSubmissionStatus(id);
    if (submissionResult) {
      setSubmissionResult({
        ...submissionResult,
        status: filing.status,
      });
    }
  }, [submissionResult, getSubmissionStatus]);

  const handleClose = useCallback(() => {
    // Reset wizard
    setCurrentStep('period');
    setSelectedPeriod(null);
    setUvaData({});
    setSubmissionResult(null);
    setHasAutoSaved(false);
  }, []);

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const getCurrentStepIndex = () => {
    return STEPS.findIndex(s => s.id === currentStep);
  };

  const isStepComplete = (stepId: WizardStep) => {
    const currentIndex = getCurrentStepIndex();
    const stepIndex = STEPS.findIndex(s => s.id === stepId);
    return stepIndex < currentIndex;
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isComplete = isStepComplete(step.id);

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  {/* Step Circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                      ${isActive ? 'border-primary bg-primary text-primary-foreground' : ''}
                      ${isComplete ? 'border-primary bg-primary text-primary-foreground' : ''}
                      ${!isActive && !isComplete ? 'border-muted-foreground bg-muted text-muted-foreground' : ''}
                    `}
                  >
                    {isComplete ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-muted-foreground hidden md:block">
                      {step.description}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <Separator
                    className={`flex-1 mx-2 ${isComplete ? 'bg-primary' : 'bg-muted'}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Current Step Content */}
      <div>
        {currentStep === 'period' && (
          <PeriodSelector
            onSelect={handlePeriodSelect}
            previousFilings={filings}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'review' && calculation && (
          <UVADataReview
            calculation={calculation}
            onUpdate={handleDataUpdate}
            onContinue={() => goToStep('submit')}
            onBack={() => goToStep('period')}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'submit' && uvaData.period && (
          <FinanzOnlineAuth
            data={uvaData as UVAData}
            onSubmit={handleSubmit}
            onBack={() => goToStep('review')}
            onComplete={handleComplete}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'status' && submissionResult && (
          <UVAStatusTracker
            result={submissionResult}
            onCheckStatus={handleCheckStatus}
            onClose={handleClose}
            isChecking={isLoading}
          />
        )}
      </div>

      {/* Auto-save indicator */}
      {hasAutoSaved && currentStep !== 'submit' && currentStep !== 'status' && (
        <div className="fixed bottom-4 right-4">
          <Badge variant="secondary" className="shadow-lg">
            Entwurf gespeichert
          </Badge>
        </div>
      )}
    </div>
  );
}
