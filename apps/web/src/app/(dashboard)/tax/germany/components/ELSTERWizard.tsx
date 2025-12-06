'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, FileText, Key, Send, Shield } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ELSTERAuth } from './ELSTERAuth';
import { PeriodSelector } from './PeriodSelector';
import { UStVADataReview } from './UStVADataReview';
import { UStVAStatusTracker } from './UStVAStatusTracker';

type WizardStep = 'authenticate' | 'select-period' | 'review-data' | 'submit' | 'confirmation';

interface WizardState {
  currentStep: WizardStep;
  isAuthenticated: boolean;
  selectedPeriod: { year: number; month: number } | null;
  vatData: VATData | null;
  submissionId: string | null;
}

interface VATData {
  revenue: number;
  vatCollected: number;
  inputVat: number;
  vatPayable: number;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  vatRate: number;
  vatAmount: number;
  type: 'income' | 'expense';
}

const STEPS: { id: WizardStep; title: string; description: string }[] = [
  { id: 'authenticate', title: 'ELSTER Login', description: 'Connect to ELSTER' },
  { id: 'select-period', title: 'Select Period', description: 'Choose filing period' },
  { id: 'review-data', title: 'Review Data', description: 'Verify VAT data' },
  { id: 'submit', title: 'Submit', description: 'File your return' },
  { id: 'confirmation', title: 'Confirmation', description: 'Filing complete' },
];

export function ELSTERWizard() {
  const [state, setState] = useState<WizardState>({
    currentStep: 'authenticate',
    isAuthenticated: false,
    selectedPeriod: null,
    vatData: null,
    submissionId: null,
  });

  const currentStepIndex = STEPS.findIndex((s) => s.id === state.currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleAuthenticated = () => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      currentStep: 'select-period',
    }));
  };

  const handlePeriodSelected = (year: number, month: number) => {
    setState((prev) => ({
      ...prev,
      selectedPeriod: { year, month },
      currentStep: 'review-data',
    }));
  };

  const handleDataReviewed = (data: VATData) => {
    setState((prev) => ({
      ...prev,
      vatData: data,
      currentStep: 'submit',
    }));
  };

  const handleSubmit = async () => {
    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setState((prev) => ({
      ...prev,
      submissionId: `ELSTER-${Date.now()}`,
      currentStep: 'confirmation',
    }));
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0 && STEPS[prevIndex]) {
      setState((prev) => ({
        ...prev,
        currentStep: STEPS[prevIndex]!.id,
      }));
    }
  };

  const handleStartOver = () => {
    setState({
      currentStep: 'authenticate',
      isAuthenticated: false,
      selectedPeriod: null,
      vatData: null,
      submissionId: null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-1 ${
                    index <= currentStepIndex
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      index < currentStepIndex
                        ? 'bg-primary text-primary-foreground'
                        : index === currentStepIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs hidden sm:block">{step.title}</span>
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStepIndex]?.title}</CardTitle>
          <CardDescription>{STEPS[currentStepIndex]?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {state.currentStep === 'authenticate' && (
            <ELSTERAuth onAuthenticated={handleAuthenticated} />
          )}

          {state.currentStep === 'select-period' && (
            <PeriodSelector onPeriodSelected={handlePeriodSelected} />
          )}

          {state.currentStep === 'review-data' && state.selectedPeriod && (
            <UStVADataReview
              period={state.selectedPeriod}
              onDataReviewed={handleDataReviewed}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 'submit' && state.vatData && (
            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ready to Submit</AlertTitle>
                <AlertDescription>
                  Please review the summary below before submitting your USt-VA to ELSTER.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Filing Period</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {state.selectedPeriod?.month}/{state.selectedPeriod?.year}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">VAT Payable</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">
                      €{state.vatData.vatPayable.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleSubmit} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Submit to ELSTER
                </Button>
              </div>
            </div>
          )}

          {state.currentStep === 'confirmation' && (
            <div className="text-center space-y-6 py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <h3 className="text-xl font-semibold">Successfully Submitted!</h3>
                <p className="text-muted-foreground mt-2">
                  Your USt-VA has been submitted to ELSTER.
                </p>
              </div>

              <Card className="text-left">
                <CardContent className="pt-6">
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Submission ID</dt>
                      <dd className="font-mono">{state.submissionId}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Period</dt>
                      <dd>{state.selectedPeriod?.month}/{state.selectedPeriod?.year}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Amount</dt>
                      <dd className="font-semibold">
                        €{state.vatData?.vatPayable.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={handleStartOver}>
                  File Another Return
                </Button>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Tracker */}
      {state.submissionId && (
        <UStVAStatusTracker submissionId={state.submissionId} />
      )}
    </div>
  );
}
