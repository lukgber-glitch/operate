/**
 * Onboarding Flow Integration Example
 *
 * This example shows how to integrate StepTransition and StepIndicator
 * into the onboarding wizard for smooth step-by-step transitions.
 *
 * To use: Apply this pattern to apps/web/src/app/(auth)/onboarding/page.tsx
 */

'use client';

import { useState } from 'react';
import { StepTransition, StepIndicator } from '@/components/transitions';
import { Button } from '@/components/ui/button';

// Example step components
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-6">
      <h1 className="text-3xl font-bold">Welcome to Operate</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Let's set up your business in just 5 simple steps
      </p>
      <Button onClick={onNext} size="lg">
        Get Started
      </Button>
    </div>
  );
}

function BusinessTypeStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">What type of business do you have?</h2>
      <div className="grid grid-cols-2 gap-4">
        <button className="p-6 border rounded-lg hover:border-blue-500">
          Freelancer
        </button>
        <button className="p-6 border rounded-lg hover:border-blue-500">
          Small Business
        </button>
        <button className="p-6 border rounded-lg hover:border-blue-500">
          Agency
        </button>
        <button className="p-6 border rounded-lg hover:border-blue-500">
          Other
        </button>
      </div>
      <div className="flex gap-4">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}

function CountryStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Where is your business located?</h2>
      <select className="w-full p-3 border rounded-lg">
        <option>Select country...</option>
        <option>Germany</option>
        <option>Austria</option>
        <option>Switzerland</option>
        <option>United Kingdom</option>
      </select>
      <div className="flex gap-4">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}

function TaxInfoStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tax Information</h2>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="VAT Number (optional)"
          className="w-full p-3 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Tax ID"
          className="w-full p-3 border rounded-lg"
        />
      </div>
      <div className="flex gap-4">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}

function CompletionStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="text-5xl">🎉</div>
      <h2 className="text-2xl font-bold">You're all set!</h2>
      <p className="text-gray-600 dark:text-gray-400">
        Your business profile has been created. Let's start managing your operations.
      </p>
      <Button onClick={onFinish} size="lg">
        Go to Dashboard
      </Button>
    </div>
  );
}

/**
 * Main Onboarding Flow Component
 */
export function OnboardingFlowExample() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const totalSteps = 5;

  const nextStep = () => {
    setDirection('forward');
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const prevStep = () => {
    setDirection('backward');
    setStep((s) => Math.max(s - 1, 0));
  };

  const finish = () => {
    // Navigate to dashboard
    console.log('Onboarding complete');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Step Indicator */}
        <StepIndicator
          totalSteps={totalSteps}
          currentStep={step}
          className="justify-center"
        />

        {/* Step Content with Transition */}
        <StepTransition
          currentStep={step}
          direction={direction}
          className="min-h-[400px] flex items-center justify-center"
        >
          {step === 0 && <WelcomeStep onNext={nextStep} />}
          {step === 1 && <BusinessTypeStep onNext={nextStep} onBack={prevStep} />}
          {step === 2 && <CountryStep onNext={nextStep} onBack={prevStep} />}
          {step === 3 && <TaxInfoStep onNext={nextStep} onBack={prevStep} />}
          {step === 4 && <CompletionStep onFinish={finish} />}
        </StepTransition>

        {/* Progress Text */}
        <div className="text-center text-sm text-gray-500">
          Step {step + 1} of {totalSteps}
        </div>
      </div>
    </div>
  );
}

/**
 * Alternative: Vertical Step Transition
 *
 * For a different UX, use VerticalStepTransition:
 */
import { VerticalStepTransition } from '@/components/transitions';

export function VerticalOnboardingExample() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  return (
    <div className="min-h-screen p-6">
      <VerticalStepTransition
        currentStep={step}
        direction={direction}
        className="max-w-2xl mx-auto"
      >
        {/* Same step components as above */}
        {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
        {/* ... */}
      </VerticalStepTransition>
    </div>
  );
}
