/**
 * Employee Onboarding Hook
 * Custom hook for managing wizard state and navigation
 */

'use client';

import { useState, useCallback } from 'react';
import type {
  EmployeeOnboardingData,
  OnboardingStep,
  PersonalInfo,
  EmploymentDetails,
  TaxInfo,
  DirectDeposit,
  Benefits,
  Documents,
} from '@/types/employee-onboarding';
import { ONBOARDING_STEPS } from '@/types/employee-onboarding';

export interface UseEmployeeOnboardingReturn {
  currentStep: OnboardingStep;
  currentStepIndex: number;
  data: EmployeeOnboardingData;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
  goToStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  updatePersonalInfo: (data: PersonalInfo) => void;
  updateEmploymentDetails: (data: EmploymentDetails) => void;
  updateTaxInfo: (data: TaxInfo) => void;
  updateDirectDeposit: (data: DirectDeposit) => void;
  updateBenefits: (data: Benefits) => void;
  updateDocuments: (data: Documents) => void;
  saveDraft: () => Promise<void>;
  reset: () => void;
}

const STORAGE_KEY = 'employee-onboarding-draft';

export function useEmployeeOnboarding(): UseEmployeeOnboardingReturn {
  // Load draft from localStorage if available
  const loadDraft = (): EmployeeOnboardingData => {
    if (typeof window === 'undefined') return {};

    try {
      const draft = localStorage.getItem(STORAGE_KEY);
      return draft ? JSON.parse(draft) : {};
    } catch (error) {      return {};
    }
  };

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('personal-info');
  const [data, setData] = useState<EmployeeOnboardingData>(loadDraft());

  const currentStepIndex = ONBOARDING_STEPS.findIndex(
    (step) => step.id === currentStep
  );

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;

  const progress = ((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100;

  const goToStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    if (!isLastStep) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStep(ONBOARDING_STEPS[nextIndex]!.id);
    }
  }, [currentStepIndex, isLastStep]);

  const previousStep = useCallback(() => {
    if (!isFirstStep) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStep(ONBOARDING_STEPS[prevIndex]!.id);
    }
  }, [currentStepIndex, isFirstStep]);

  const updatePersonalInfo = useCallback((personalInfo: PersonalInfo) => {
    setData((prev) => ({ ...prev, personalInfo }));
  }, []);

  const updateEmploymentDetails = useCallback((employmentDetails: EmploymentDetails) => {
    setData((prev) => ({ ...prev, employmentDetails }));
  }, []);

  const updateTaxInfo = useCallback((taxInfo: TaxInfo) => {
    setData((prev) => ({ ...prev, taxInfo }));
  }, []);

  const updateDirectDeposit = useCallback((directDeposit: DirectDeposit) => {
    setData((prev) => ({ ...prev, directDeposit }));
  }, []);

  const updateBenefits = useCallback((benefits: Benefits) => {
    setData((prev) => ({ ...prev, benefits }));
  }, []);

  const updateDocuments = useCallback((documents: Documents) => {
    setData((prev) => ({ ...prev, documents }));
  }, []);

  const saveDraft = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {      throw error;
    }
  }, [data]);

  const reset = useCallback(() => {
    setCurrentStep('personal-info');
    setData({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    currentStep,
    currentStepIndex,
    data,
    isFirstStep,
    isLastStep,
    progress,
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
  };
}
