'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useBenefits, useBenefitsEnrollment } from '@/hooks/use-benefits';
import { BenefitType, CoverageLevel, ENROLLMENT_STEPS, RetirementContribution, Beneficiary, Dependent } from '@/types/benefits';
import { HealthInsuranceCard } from './cards/HealthInsuranceCard';
import { RetirementPlanCard } from './cards/RetirementPlanCard';
import { LifeInsuranceCard } from './cards/LifeInsuranceCard';
import { HsaFsaCard } from './cards/HsaFsaCard';
import { DependentManager } from './DependentManager';
import { EnrollmentSummary } from './EnrollmentSummary';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

interface BenefitsEnrollmentWizardProps {
  employeeId: string;
  annualSalary?: number;
}

export function BenefitsEnrollmentWizard({
  employeeId,
  annualSalary = 75000
}: BenefitsEnrollmentWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { plans, fetchPlans, enrollmentPeriod, fetchEnrollmentPeriod } = useBenefits();
  const { state, updateState, nextStep, previousStep, goToStep, submitEnrollment } = useBenefitsEnrollment(employeeId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchEnrollmentPeriod();
  }, [fetchPlans, fetchEnrollmentPeriod]);

  useEffect(() => {
    if (enrollmentPeriod) {
      updateState({ enrollmentPeriod });
    }
  }, [enrollmentPeriod, updateState]);

  const handleHealthPlanSelect = (planId: string, coverage: CoverageLevel, type: 'health' | 'dental' | 'vision') => {
    if (type === 'health') {
      updateState({ healthPlan: planId, healthCoverageLevel: coverage });
    } else if (type === 'dental') {
      updateState({ dentalPlan: planId, dentalCoverageLevel: coverage });
    } else {
      updateState({ visionPlan: planId, visionCoverageLevel: coverage });
    }

    toast({
      title: 'Plan Selected',
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} plan has been selected`,
    });
  };

  const handleRetirementSelect = (planId: string, contribution: RetirementContribution) => {
    updateState({ retirementPlan: planId, retirementContribution: contribution });
    toast({
      title: 'Retirement Plan Selected',
      description: 'Your 401(k) contribution has been set',
    });
  };

  const handleLifeSelect = (planId: string, coverageAmount: number) => {
    updateState({ lifePlan: planId, supplementalLifeCoverage: coverageAmount });
    toast({
      title: 'Life Insurance Selected',
      description: 'Your life insurance coverage has been set',
    });
  };

  const handleHsaFsaSelect = (type: 'hsa' | 'fsa', healthcareAmount: number, dependentCareAmount?: number) => {
    if (type === 'hsa') {
      updateState({ hsaPlan: 'hsa-1', hsaContribution: healthcareAmount });
    } else {
      updateState({
        fsaPlan: 'fsa-1',
        fsaHealthcareContribution: healthcareAmount,
        fsaDependentCareContribution: dependentCareAmount,
      });
    }
    toast({
      title: 'Account Selected',
      description: `${type.toUpperCase()} contribution has been set`,
    });
  };

  const handleAddDependent = (dependent: Dependent) => {
    updateState({ dependents: [...state.dependents, dependent] });
  };

  const handleUpdateDependent = (id: string, dependent: Dependent) => {
    updateState({
      dependents: state.dependents.map((d) => (d.id === id ? dependent : d)),
    });
  };

  const handleRemoveDependent = (id: string) => {
    updateState({ dependents: state.dependents.filter((d) => d.id !== id) });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const success = await submitEnrollment();
    setIsSubmitting(false);

    if (success) {
      router.push('/hr/benefits');
    }
  };

  const canProceed = () => {
    // Basic validation for each step
    switch (state.currentStep) {
      case 1:
        return true; // Overview, always can proceed
      case 2:
        // At least one health benefit selected
        return state.healthPlan || state.dentalPlan || state.visionPlan;
      case 3:
        // Retirement is optional
        return true;
      case 4:
        // Life insurance is optional but if selected needs beneficiaries (handled in step 7)
        return true;
      case 5:
        // HSA/FSA optional
        return true;
      case 6:
        // Dependents optional
        return true;
      case 7:
        // Review step
        return true;
      default:
        return false;
    }
  };

  const healthPlans = plans.filter((p) => p.type === BenefitType.HEALTH);
  const dentalPlans = plans.filter((p) => p.type === BenefitType.DENTAL);
  const visionPlans = plans.filter((p) => p.type === BenefitType.VISION);
  const retirementPlans = plans.filter((p) => p.type === BenefitType.RETIREMENT);
  const lifePlans = plans.filter((p) => p.type === BenefitType.LIFE);

  const progress = ((state.currentStep - 1) / (ENROLLMENT_STEPS.length - 1)) * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Benefits Enrollment</h1>
        <p className="text-muted-foreground mt-2">
          Complete your enrollment to secure coverage
        </p>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                Step {state.currentStep} of {ENROLLMENT_STEPS.length}
              </span>
              <span className="text-muted-foreground">
                {ENROLLMENT_STEPS[state.currentStep - 1]?.name}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between gap-2">
              {ENROLLMENT_STEPS.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className={`flex-1 text-xs py-2 px-1 rounded transition-colors ${
                    state.currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : state.completedSteps.includes(step.id)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  disabled={state.currentStep < step.id && !state.completedSteps.includes(step.id)}
                >
                  {state.completedSteps.includes(step.id) ? (
                    <Check className="h-3 w-3 mx-auto" />
                  ) : (
                    step.id
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div>
        {/* Step 1: Overview */}
        {state.currentStep === 1 && (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome to Benefits Enrollment</h2>
                <p className="text-muted-foreground">
                  Let's get you enrolled in the benefits that matter most to you and your family.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">What You'll Need</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Social Security Numbers for dependents (if adding to coverage)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Beneficiary information for life insurance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>About 15-20 minutes to complete enrollment</span>
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-1">Enrollment Period</h4>
                    <p className="text-sm text-muted-foreground">
                      {enrollmentPeriod?.name || 'Open Enrollment'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {enrollmentPeriod && (
                        <>
                          Ends {new Date(enrollmentPeriod.endDate).toLocaleDateString()}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-1">Coverage Start Date</h4>
                    <p className="text-sm text-muted-foreground">
                      {enrollmentPeriod && new Date(enrollmentPeriod.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Health Insurance */}
        {state.currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Health Insurance</h2>
              <p className="text-muted-foreground">
                Choose your medical, dental, and vision coverage
              </p>
            </div>

            {healthPlans.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Medical Insurance</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {healthPlans.map((plan) => (
                    <HealthInsuranceCard
                      key={plan.id}
                      plan={plan}
                      selectedCoverage={state.healthCoverageLevel || undefined}
                      onSelect={(planId, coverage) => handleHealthPlanSelect(planId, coverage, 'health')}
                      isSelected={state.healthPlan === plan.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {dentalPlans.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Dental Insurance</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {dentalPlans.map((plan) => (
                    <HealthInsuranceCard
                      key={plan.id}
                      plan={plan}
                      selectedCoverage={state.dentalCoverageLevel || undefined}
                      onSelect={(planId, coverage) => handleHealthPlanSelect(planId, coverage, 'dental')}
                      isSelected={state.dentalPlan === plan.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {visionPlans.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Vision Insurance</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {visionPlans.map((plan) => (
                    <HealthInsuranceCard
                      key={plan.id}
                      plan={plan}
                      selectedCoverage={state.visionCoverageLevel || undefined}
                      onSelect={(planId, coverage) => handleHealthPlanSelect(planId, coverage, 'vision')}
                      isSelected={state.visionPlan === plan.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Retirement */}
        {state.currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Retirement Savings</h2>
              <p className="text-muted-foreground">
                Set up your 401(k) contributions and investment allocations
              </p>
            </div>

            {retirementPlans.length > 0 && (
              <div className="grid gap-4 md:grid-cols-1 max-w-2xl mx-auto">
                {retirementPlans.map((plan) => (
                  <RetirementPlanCard
                    key={plan.id}
                    plan={plan}
                    annualSalary={annualSalary}
                    selectedContribution={state.retirementContribution || undefined}
                    onSelect={handleRetirementSelect}
                    isSelected={state.retirementPlan === plan.id}
                  />
                ))}
              </div>
            )}

            <div className="text-center">
              <Button variant="outline" onClick={nextStep}>
                Skip for Now
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Life Insurance */}
        {state.currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Life Insurance</h2>
              <p className="text-muted-foreground">
                Protect your loved ones with life insurance coverage
              </p>
            </div>

            {lifePlans.length > 0 && (
              <div className="grid gap-4 md:grid-cols-1 max-w-2xl mx-auto">
                {lifePlans.map((plan) => (
                  <LifeInsuranceCard
                    key={plan.id}
                    plan={plan}
                    annualSalary={annualSalary}
                    selectedCoverage={state.supplementalLifeCoverage}
                    onSelect={handleLifeSelect}
                    isSelected={state.lifePlan === plan.id}
                  />
                ))}
              </div>
            )}

            <div className="text-center">
              <Button variant="outline" onClick={nextStep}>
                Skip for Now
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: HSA/FSA */}
        {state.currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Health Savings Account</h2>
              <p className="text-muted-foreground">
                Save money on healthcare expenses with tax-advantaged accounts
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <HsaFsaCard
                onSelect={handleHsaFsaSelect}
                selectedType={(state.hsaPlan ? 'hsa' : state.fsaPlan ? 'fsa' : undefined) as any}
                selectedHealthcareAmount={state.hsaContribution || state.fsaHealthcareContribution}
                selectedDependentCareAmount={state.fsaDependentCareContribution}
                isSelected={!!(state.hsaPlan || state.fsaPlan)}
                hasHdhp={!!state.healthPlan}
              />
            </div>

            <div className="text-center">
              <Button variant="outline" onClick={nextStep}>
                Skip for Now
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Dependents */}
        {state.currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Add Dependents</h2>
              <p className="text-muted-foreground">
                Add family members you want to cover under your benefits
              </p>
            </div>

            <DependentManager
              dependents={state.dependents}
              onAdd={handleAddDependent}
              onUpdate={handleUpdateDependent}
              onRemove={handleRemoveDependent}
            />
          </div>
        )}

        {/* Step 7: Review & Submit */}
        {state.currentStep === 7 && (
          <EnrollmentSummary
            state={state}
            plans={plans}
            onSubmit={handleSubmit}
            onEdit={goToStep}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Navigation */}
      {state.currentStep !== 7 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={previousStep}
                disabled={state.currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button onClick={nextStep} disabled={!canProceed()}>
                {state.currentStep === ENROLLMENT_STEPS.length ? 'Review' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
