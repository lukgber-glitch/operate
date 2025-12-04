'use client';

import { Check } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  useTaxFiling,
  TaxPeriod,
  VATFilingPeriod,
  UStVAData,
  SubmissionResult,
} from '@/hooks/use-tax-filing';

import { PeriodSelector } from './PeriodSelector';
import { VATDataReview } from './VATDataReview';
import { AdditionalDataForm } from './AdditionalDataForm';
import { VATSummary } from './VATSummary';
import { SubmissionConfirmation } from './SubmissionConfirmation';

type WizardStep = 'period' | 'review' | 'additional' | 'summary' | 'submit';

interface Step {
  id: WizardStep;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 'period', label: 'Period', description: 'Select filing period' },
  { id: 'review', label: 'Data Review', description: 'Review calculated data' },
  { id: 'additional', label: 'Additional Data', description: 'EU & special cases' },
  { id: 'summary', label: 'Summary', description: 'Validate & review' },
  { id: 'submit', label: 'Submit', description: 'Submit to ELSTER' },
];

export function TaxFilingWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('period');
  const [selectedPeriod, setSelectedPeriod] = useState<TaxPeriod | null>(null);
  const [periodType, setPeriodType] = useState<VATFilingPeriod>(VATFilingPeriod.MONTHLY);
  const [vatData, setVatData] = useState<Partial<UStVAData>>({});
  const [hasAutoSaved, setHasAutoSaved] = useState(false);

  const {
    calculation,
    validationResult,
    certificates,
    filings,
    isLoading,
    calculateVAT,
    getFilings,
    getCertificates,
    validate,
    saveDraft,
    submit,
  } = useTaxFiling();

  // Load previous filings on mount
  useEffect(() => {
    getFilings();
  }, [getFilings]);

  // Load certificates when reaching submit step
  useEffect(() => {
    if (currentStep === 'submit') {
      getCertificates();
    }
  }, [currentStep, getCertificates]);

  // Auto-save draft periodically
  useEffect(() => {
    if (!hasAutoSaved && vatData.period && Object.keys(vatData).length > 1) {
      const timer = setTimeout(() => {
        if (currentStep !== 'submit') {
          saveDraft(vatData as UStVAData).catch(() => {
            // Silently fail auto-save
          });
          setHasAutoSaved(true);
        }
      }, 5000); // Auto-save after 5 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [vatData, currentStep, hasAutoSaved, saveDraft]);

  const handlePeriodSelect = useCallback(async (period: TaxPeriod, type: VATFilingPeriod) => {
    setSelectedPeriod(period);
    setPeriodType(type);

    // Calculate VAT from invoices
    const calc = await calculateVAT(period);

    // Initialize VAT data with calculation
    setVatData({
      period,
      domesticRevenue19: calc.domesticRevenue19,
      domesticRevenue7: calc.domesticRevenue7,
      taxFreeRevenue: calc.taxFreeRevenue,
      euDeliveries: calc.euDeliveries,
      euAcquisitions19: calc.euAcquisitions19,
      euAcquisitions7: calc.euAcquisitions7,
      reverseChargeRevenue: calc.reverseChargeRevenue,
      inputTax: calc.inputTax,
      importVat: calc.importVat,
      euAcquisitionsInputTax: calc.euAcquisitionsInputTax,
    });

    setCurrentStep('review');
  }, [calculateVAT]);

  const handleDataUpdate = useCallback((data: Partial<UStVAData>) => {
    setVatData(prev => ({ ...prev, ...data }));
    setHasAutoSaved(false); // Reset auto-save flag when data changes
  }, []);

  const handleValidate = useCallback(async () => {
    if (vatData.period) {
      await validate(vatData as UStVAData);
    }
  }, [vatData, validate]);

  const handleSubmit = useCallback(async (certificateId: string, testMode: boolean) => {
    if (!vatData.period) {
      throw new Error('No VAT data available');
    }

    // Save final draft before submitting
    await saveDraft(vatData as UStVAData);

    // Submit to ELSTER
    return await submit(vatData as UStVAData, certificateId, testMode);
  }, [vatData, saveDraft, submit]);

  const handleComplete = useCallback((result: SubmissionResult) => {
    // Could navigate away or show success message
    console.log('Submission complete:', result);
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
          <VATDataReview
            calculation={calculation}
            onUpdate={handleDataUpdate}
            onContinue={() => goToStep('additional')}
            onBack={() => goToStep('period')}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'additional' && (
          <AdditionalDataForm
            data={vatData}
            onUpdate={handleDataUpdate}
            onContinue={() => goToStep('summary')}
            onBack={() => goToStep('review')}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'summary' && vatData.period && (
          <VATSummary
            data={vatData as UStVAData}
            periodType={periodType}
            validationResult={validationResult}
            onValidate={handleValidate}
            onContinue={() => goToStep('submit')}
            onBack={() => goToStep('additional')}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'submit' && (
          <SubmissionConfirmation
            certificates={certificates}
            onSubmit={handleSubmit}
            onBack={() => goToStep('summary')}
            onComplete={handleComplete}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Auto-save indicator */}
      {hasAutoSaved && currentStep !== 'submit' && (
        <div className="fixed bottom-4 right-4">
          <Badge variant="secondary" className="shadow-lg">
            Draft saved
          </Badge>
        </div>
      )}
    </div>
  );
}
