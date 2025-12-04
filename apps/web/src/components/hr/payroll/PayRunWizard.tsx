/**
 * Pay Run Wizard Component
 * Main wizard container that orchestrates all steps
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePayRun } from '@/hooks/use-pay-run';
import { PAY_RUN_STEPS } from '@/types/payroll';
import { PayPeriodStep } from './steps/PayPeriodStep';
import { EmployeeListStep } from './steps/EmployeeListStep';
import { HoursEntryStep } from './steps/HoursEntryStep';
import { AdditionsDeductionsStep } from './steps/AdditionsDeductionsStep';
import { TaxPreviewStep } from './steps/TaxPreviewStep';
import { ReviewApproveStep } from './steps/ReviewApproveStep';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PayRunWizardProps {
  companyUuid: string;
  payrollId?: string;
}

export function PayRunWizard({ companyUuid, payrollId }: PayRunWizardProps) {
  const {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    isStepComplete,
    canProceed,
    reset,
  } = usePayRun();

  const progress = (currentStep / PAY_RUN_STEPS.length) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PayPeriodStep companyUuid={companyUuid} />;
      case 2:
        return <EmployeeListStep companyUuid={companyUuid} />;
      case 3:
        return <HoursEntryStep />;
      case 4:
        return <AdditionsDeductionsStep />;
      case 5:
        return <TaxPreviewStep />;
      case 6:
        return <ReviewApproveStep />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentStep} of {PAY_RUN_STEPS.length}
          </span>
          <span className="font-medium">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {PAY_RUN_STEPS.map((step, index) => {
              const isActive = currentStep === step.id;
              const isComplete = isStepComplete(step.id);
              const isPast = currentStep > step.id;
              const isClickable = isComplete || isPast;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => isClickable && goToStep(step.id)}
                    disabled={!isClickable}
                    className={cn(
                      'flex flex-col items-center gap-2 flex-1 transition-all',
                      isClickable && 'cursor-pointer hover:opacity-80',
                      !isClickable && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all',
                        isActive &&
                          'border-primary bg-primary text-primary-foreground shadow-lg scale-110',
                        isComplete &&
                          !isActive &&
                          'border-green-500 bg-green-500 text-white',
                        !isActive &&
                          !isComplete &&
                          'border-muted-foreground/30 bg-muted text-muted-foreground'
                      )}
                    >
                      {isComplete && !isActive ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="font-semibold">{step.id}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <p
                        className={cn(
                          'text-xs font-medium',
                          isActive && 'text-primary',
                          !isActive && 'text-muted-foreground'
                        )}
                      >
                        {step.name}
                      </p>
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        {step.description}
                      </p>
                    </div>
                  </button>

                  {index < PAY_RUN_STEPS.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-2 transition-all',
                        isPast || isComplete ? 'bg-green-500' : 'bg-muted'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">{renderStep()}</CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={reset}>
            Cancel
          </Button>

          {currentStep < PAY_RUN_STEPS.length && (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
