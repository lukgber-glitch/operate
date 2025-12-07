'use client';

import { Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Step {
  id: string;
  label: string;
  description: string;
}

interface StepsProgressProps {
  steps: Step[];
  currentStep: string;
}

export function StepsProgress({ steps, currentStep }: StepsProgressProps) {
  const getCurrentStepIndex = () => {
    return steps.findIndex(s => s.id === currentStep);
  };

  const isStepComplete = (stepId: string) => {
    const currentIndex = getCurrentStepIndex();
    const stepIndex = steps.findIndex(s => s.id === stepId);
    return stepIndex < currentIndex;
  };

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
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
            {index < steps.length - 1 && (
              <Separator
                className={`flex-1 mx-2 ${isComplete ? 'bg-primary' : 'bg-muted'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
