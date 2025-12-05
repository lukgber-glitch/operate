'use client';

import { useState, useEffect } from 'react';
import { useVATObligation, useVATCalculation, useVATSubmit } from '@/hooks/useHMRC';
import { VATObligationsList } from './VATObligationsList';
import { VATCalculationBreakdown } from './VATCalculationBreakdown';
import { VATBoxesGrid, VATBoxValues } from './VATBoxesGrid';
import { VATSubmissionConfirmation } from './VATSubmissionConfirmation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  FileText,
  Calculator,
  Eye,
  CheckSquare,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { number: 1, title: 'Select Period', description: 'Choose VAT period', icon: FileText },
  { number: 2, title: 'Calculate', description: 'Auto-calculate VAT', icon: Calculator },
  { number: 3, title: 'Review', description: 'Review boxes', icon: Eye },
  { number: 4, title: 'Confirm', description: 'Final review', icon: CheckSquare },
  { number: 5, title: 'Submit', description: 'Submit to HMRC', icon: Send },
];

interface VATReturnWizardProps {
  initialPeriodKey?: string;
  onComplete?: () => void;
}

export function VATReturnWizard({ initialPeriodKey, onComplete }: VATReturnWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | null>(initialPeriodKey || null);
  const [vatValues, setVatValues] = useState<VATBoxValues | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const { obligation, isLoading: isLoadingObligation } = useVATObligation(selectedPeriodKey || '');
  const { calculation, isLoading: isLoadingCalculation, refetch: refetchCalculation } = useVATCalculation(
    selectedPeriodKey || '',
    { autoFetch: !!selectedPeriodKey && currentStep >= 1 }
  );
  const { submit, isSubmitting } = useVATSubmit();

  // Auto-advance to step 1 if period key is provided
  useEffect(() => {
    if (initialPeriodKey && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [initialPeriodKey, currentStep]);

  // Update vatValues when calculation changes
  useEffect(() => {
    if (calculation && !vatValues) {
      setVatValues({
        box1: calculation.vatDueSales,
        box2: calculation.vatDueAcquisitions,
        box3: calculation.totalVatDue,
        box4: calculation.vatReclaimedCurrPeriod,
        box5: calculation.netVatDue,
        box6: calculation.totalValueSalesExVAT,
        box7: calculation.totalValuePurchasesExVAT,
        box8: calculation.totalValueGoodsSuppliedExVAT,
        box9: calculation.totalAcquisitionsExVAT,
      });
    }
  }, [calculation, vatValues]);

  const handlePeriodSelect = (periodKey: string) => {
    setSelectedPeriodKey(periodKey);
    setCurrentStep(1);
  };

  const handleNextStep = () => {
    if (currentStep === 3) {
      // Show confirmation dialog before final step
      setShowConfirmDialog(true);
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
    setCurrentStep(4);
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!vatValues || !selectedPeriodKey) return;

    const result = await submit({
      periodKey: selectedPeriodKey,
      vatDueSales: vatValues.box1,
      vatDueAcquisitions: vatValues.box2,
      totalVatDue: vatValues.box3,
      vatReclaimedCurrPeriod: vatValues.box4,
      netVatDue: vatValues.box5,
      totalValueSalesExVAT: Math.round(vatValues.box6),
      totalValuePurchasesExVAT: Math.round(vatValues.box7),
      totalValueGoodsSuppliedExVAT: Math.round(vatValues.box8),
      totalAcquisitionsExVAT: Math.round(vatValues.box9),
      finalised: true,
    });

    if (result) {
      setSubmissionResult(result);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSelectedPeriodKey(null);
    setVatValues(null);
    setDeclarationAccepted(false);
    setSubmissionResult(null);
    if (onComplete) {
      onComplete();
    }
  };

  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-2">Select VAT Period</h2>
            <p className="text-muted-foreground mb-6">
              Choose the VAT period you want to file a return for
            </p>
            <VATObligationsList onSelectObligation={handlePeriodSelect} />
          </div>
        );

      case 1:
        if (isLoadingCalculation) {
          return (
            <div>
              <h2 className="text-2xl font-bold mb-2">Calculating VAT</h2>
              <p className="text-muted-foreground mb-6">
                Automatically calculating your VAT return from transactions
              </p>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                  <p className="text-center text-muted-foreground">
                    Analyzing invoices and expenses...
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        }

        if (!calculation) {
          return (
            <div>
              <h2 className="text-2xl font-bold mb-2">Calculation Error</h2>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to Calculate VAT</AlertTitle>
                <AlertDescription>
                  Unable to calculate VAT return. Please try again or contact support.
                </AlertDescription>
              </Alert>
            </div>
          );
        }

        return (
          <div>
            <h2 className="text-2xl font-bold mb-2">VAT Calculation</h2>
            <p className="text-muted-foreground mb-6">
              Review the calculated VAT breakdown for period {selectedPeriodKey}
            </p>
            <VATCalculationBreakdown calculation={calculation} />
          </div>
        );

      case 2:
        if (!calculation) return null;

        return (
          <div>
            <h2 className="text-2xl font-bold mb-2">Review VAT Boxes</h2>
            <p className="text-muted-foreground mb-6">
              Review and adjust the 9 VAT boxes if needed
            </p>
            <VATBoxesGrid
              calculation={calculation}
              editable={true}
              onValuesChange={setVatValues}
            />
          </div>
        );

      case 3:
        if (!vatValues || !calculation) return null;

        return (
          <div>
            <h2 className="text-2xl font-bold mb-2">Confirm Submission</h2>
            <p className="text-muted-foreground mb-6">
              Final review before submitting to HMRC
            </p>

            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Once submitted, this VAT return cannot be changed. Please review carefully.
                </AlertDescription>
              </Alert>

              <VATBoxesGrid calculation={calculation} editable={false} />

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Legal Declaration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="declaration"
                        checked={declarationAccepted}
                        onCheckedChange={(checked) => setDeclarationAccepted(checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="declaration"
                          className="text-sm font-medium leading-relaxed cursor-pointer"
                        >
                          I declare that the information given in this return is true and complete to the
                          best of my knowledge and belief. I understand that I may have to pay financial
                          penalties and face prosecution if I give false information.
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 4:
        if (isSubmitting) {
          return (
            <div>
              <h2 className="text-2xl font-bold mb-2">Submitting to HMRC</h2>
              <p className="text-muted-foreground mb-6">
                Please wait while we submit your VAT return
              </p>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                  <p className="text-center text-muted-foreground">
                    Submitting to HMRC Making Tax Digital...
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        }

        if (submissionResult && vatValues) {
          return (
            <div>
              <h2 className="text-2xl font-bold mb-2">Submission Complete</h2>
              <p className="text-muted-foreground mb-6">
                Your VAT return has been successfully submitted
              </p>
              <VATSubmissionConfirmation
                submission={submissionResult}
                periodKey={selectedPeriodKey || ''}
                netVatDue={vatValues.box5}
                onNewReturn={handleReset}
              />
            </div>
          );
        }

        return null;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                      currentStep >= index
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {currentStep > index ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground hidden md:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-1 mx-4 transition-colors',
                      currentStep > index ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Step Content */}
      <div>{renderStepContent()}</div>

      {/* Navigation Buttons */}
      {currentStep < 4 && (
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            type="button"
            onClick={handleNextStep}
            disabled={
              (currentStep === 0 && !selectedPeriodKey) ||
              (currentStep === 1 && !calculation) ||
              (currentStep === 3 && !declarationAccepted)
            }
          >
            {currentStep === 3 ? 'Submit to HMRC' : 'Next'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm VAT Return Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this VAT return to HMRC? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Once submitted, you cannot modify this VAT return. Any errors will need to be
                corrected in a future return or by contacting HMRC.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={!declarationAccepted}
            >
              Confirm & Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
