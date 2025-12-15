/**
 * Employee Onboarding Hook
 * Custom hook for managing wizard state and navigation
 * Optimized with debounced auto-save, memoization, and validation
 */

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  isDirty: boolean;
  isAutoSaving: boolean;
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
  completedSteps: OnboardingStep[];
}

const STORAGE_KEY = 'employee-onboarding-draft';
const AUTO_SAVE_DELAY = 1000; // 1 second debounce

// Safe JSON parse with validation
function safeParseJSON<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    const parsed = JSON.parse(json);
    // Basic validation - must be an object
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return fallback;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function useEmployeeOnboarding(): UseEmployeeOnboardingReturn {
  // Load draft from localStorage if available with safe parsing
  const loadDraft = (): EmployeeOnboardingData => {
    if (typeof window === 'undefined') return {};
    return safeParseJSON<EmployeeOnboardingData>(
      localStorage.getItem(STORAGE_KEY),
      {}
    );
  };

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('personal-info');
  const [data, setData] = useState<EmployeeOnboardingData>(loadDraft());
  const [isDirty, setIsDirty] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Refs for debounced auto-save
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>(JSON.stringify(data));

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
      const dataString = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, dataString);
      lastSavedRef.current = dataString;
      setIsDirty(false);
    } catch (error) {
      // Handle quota exceeded or other storage errors gracefully
      console.warn('Failed to save draft to localStorage:', error);
      throw error;
    }
  }, [data]);

  // Debounced auto-save effect
  useEffect(() => {
    const currentDataString = JSON.stringify(data);

    // Skip if no changes
    if (currentDataString === lastSavedRef.current) return;

    setIsDirty(true);

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new debounced save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (typeof window === 'undefined') return;

      setIsAutoSaving(true);
      try {
        localStorage.setItem(STORAGE_KEY, currentDataString);
        lastSavedRef.current = currentDataString;
        setIsDirty(false);
      } catch (error) {
        console.warn('Auto-save failed:', error);
      } finally {
        setIsAutoSaving(false);
      }
    }, AUTO_SAVE_DELAY);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [data]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    setCurrentStep('personal-info');
    setData({});
    setIsDirty(false);
    lastSavedRef.current = '{}';
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Compute completed steps based on data
  const completedSteps = useMemo((): OnboardingStep[] => {
    const completed: OnboardingStep[] = [];
    if (data.personalInfo?.firstName && data.personalInfo?.lastName && data.personalInfo?.email) {
      completed.push('personal-info');
    }
    if (data.employmentDetails?.jobTitle && data.employmentDetails?.startDate) {
      completed.push('employment-details');
    }
    if (data.taxInfo?.filingStatus) {
      completed.push('tax-info');
    }
    if (data.directDeposit?.routingNumber && data.directDeposit?.accountNumber) {
      completed.push('direct-deposit');
    }
    if (data.benefits !== undefined) {
      completed.push('benefits');
    }
    if (data.documents !== undefined) {
      completed.push('documents');
    }
    return completed;
  }, [data]);

  return {
    currentStep,
    currentStepIndex,
    data,
    isFirstStep,
    isLastStep,
    progress,
    isDirty,
    isAutoSaving,
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
    completedSteps,
  };
}
