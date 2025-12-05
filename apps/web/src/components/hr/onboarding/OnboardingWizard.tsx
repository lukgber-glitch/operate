'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useEmployeeOnboarding } from '@/hooks/use-employee-onboarding';
import { ONBOARDING_STEPS } from '@/types/employee-onboarding';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { EmploymentDetailsStep } from './steps/EmploymentDetailsStep';
import { TaxInfoStep } from './steps/TaxInfoStep';
import { DirectDepositStep } from './steps/DirectDepositStep';
import { BenefitsStep } from './steps/BenefitsStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { ReviewStep } from './steps/ReviewStep';
import { useState } from 'react';

interface OnboardingWizardProps {
  onComplete?: (data: any) => Promise<void>;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    currentStep,
    currentStepIndex,
    data,
    progress,
    isFirstStep,
    isLastStep,
    goToStep,
    nextStep,
    previousStep,
    updatePersonalInfo,
    updateEmploymentDetails,
    updateTaxInfo,
    updateDirectDeposit,
    updateBenefits,
    updateDocuments,
    saveDraft,
    reset,
  } = useEmployeeOnboarding();

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      toast({
        title: 'Draft saved',
        description: 'Your progress has been saved. You can continue later.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Call the onComplete callback if provided, otherwise use default API
      if (onComplete) {
        await onComplete(data);
      } else {
        // Default: Call API to create employee
        const response = await fetch('/api/v1/employees/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to submit onboarding');
        }
      }

      toast({
        title: 'Success!',
        description: 'Employee onboarding completed successfully.',
      });

      reset();
      router.push('/hr/employees');
    } catch (error) {
      console.error('Onboarding submission error:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete onboarding. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'personal-info':
        return (
          <PersonalInfoStep
            data={data.personalInfo}
            onNext={(personalInfo) => {
              updatePersonalInfo(personalInfo);
              nextStep();
            }}
            onSaveDraft={handleSaveDraft}
          />
        );

      case 'employment-details':
        return (
          <EmploymentDetailsStep
            data={data.employmentDetails}
            onNext={(employmentDetails) => {
              updateEmploymentDetails(employmentDetails);
              nextStep();
            }}
            onBack={previousStep}
            onSaveDraft={handleSaveDraft}
          />
        );

      case 'tax-info':
        return (
          <TaxInfoStep
            data={data.taxInfo}
            onNext={(taxInfo) => {
              updateTaxInfo(taxInfo);
              nextStep();
            }}
            onBack={previousStep}
            onSaveDraft={handleSaveDraft}
          />
        );

      case 'direct-deposit':
        return (
          <DirectDepositStep
            data={data.directDeposit}
            onNext={(directDeposit) => {
              updateDirectDeposit(directDeposit);
              nextStep();
            }}
            onBack={previousStep}
            onSaveDraft={handleSaveDraft}
          />
        );

      case 'benefits':
        return (
          <BenefitsStep
            data={data.benefits}
            onNext={(benefits) => {
              updateBenefits(benefits);
              nextStep();
            }}
            onBack={previousStep}
            onSaveDraft={handleSaveDraft}
          />
        );

      case 'documents':
        return (
          <DocumentsStep
            data={data.documents}
            onNext={(documents) => {
              updateDocuments(documents);
              nextStep();
            }}
            onBack={previousStep}
            onSaveDraft={handleSaveDraft}
          />
        );

      case 'review':
        return (
          <ReviewStep
            data={data}
            onBack={previousStep}
            onEdit={goToStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Onboarding</CardTitle>
          <CardDescription>
            Complete all steps to onboard a new employee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {ONBOARDING_STEPS.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = index < currentStepIndex;
              const isClickable = index <= currentStepIndex;

              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && goToStep(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors',
                    isActive && 'bg-primary text-primary-foreground',
                    !isActive && isCompleted && 'bg-muted hover:bg-muted/80 text-foreground',
                    !isActive && !isCompleted && 'bg-muted/50 text-muted-foreground cursor-not-allowed',
                    isClickable && !isActive && 'cursor-pointer'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      {renderStep()}
    </div>
  );
}
