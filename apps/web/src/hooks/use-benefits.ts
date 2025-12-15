'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

import {
  BenefitPlan,
  BenefitType,
  BenefitsEnrollmentState,
  CoverageLevel,
  Dependent,
  EmployeeBenefitEnrollment,
  EnrollmentPeriod,
  EnrollmentSummary,
  Beneficiary,
  RetirementContribution,
  CostCalculation,
} from '@/types/benefits';

// API delay configuration - set to 0 in production with real API
const API_DELAY = process.env.NODE_ENV === 'development' ? 100 : 0;

// Pay frequency to paychecks per year mapping - defined once
const PAY_FREQUENCY_MAP: Record<string, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
} as const;

// Mock API calls - replace with actual API integration
const mockBenefitPlans: BenefitPlan[] = [
  {
    id: 'health-1',
    name: 'Platinum PPO',
    type: BenefitType.HEALTH,
    provider: 'Blue Cross Blue Shield',
    description: 'Comprehensive health coverage with nationwide network',
    coverageLevels: [
      CoverageLevel.EMPLOYEE_ONLY,
      CoverageLevel.EMPLOYEE_SPOUSE,
      CoverageLevel.EMPLOYEE_CHILDREN,
      CoverageLevel.FAMILY,
    ],
    employeeMonthlyPremium: {
      [CoverageLevel.EMPLOYEE_ONLY]: 150,
      [CoverageLevel.EMPLOYEE_SPOUSE]: 350,
      [CoverageLevel.EMPLOYEE_CHILDREN]: 320,
      [CoverageLevel.FAMILY]: 520,
    },
    employerMonthlyContribution: {
      [CoverageLevel.EMPLOYEE_ONLY]: 350,
      [CoverageLevel.EMPLOYEE_SPOUSE]: 250,
      [CoverageLevel.EMPLOYEE_CHILDREN]: 280,
      [CoverageLevel.FAMILY]: 280,
    },
    deductible: {
      [CoverageLevel.EMPLOYEE_ONLY]: 1000,
      [CoverageLevel.EMPLOYEE_SPOUSE]: 2000,
      [CoverageLevel.EMPLOYEE_CHILDREN]: 2000,
      [CoverageLevel.FAMILY]: 3000,
    },
    outOfPocketMax: {
      [CoverageLevel.EMPLOYEE_ONLY]: 5000,
      [CoverageLevel.EMPLOYEE_SPOUSE]: 10000,
      [CoverageLevel.EMPLOYEE_CHILDREN]: 10000,
      [CoverageLevel.FAMILY]: 15000,
    },
    coInsurance: 80,
    copay: {
      primaryCare: 25,
      specialist: 50,
      urgentCare: 75,
      emergencyRoom: 250,
    },
    features: [
      'Nationwide PPO network',
      'Preventive care covered 100%',
      'Telemedicine included',
      'Prescription drug coverage',
      'Mental health services',
    ],
    networkType: 'PPO',
    isActive: true,
  },
  {
    id: 'dental-1',
    name: 'Delta Dental Plus',
    type: BenefitType.DENTAL,
    provider: 'Delta Dental',
    description: 'Comprehensive dental coverage',
    coverageLevels: [
      CoverageLevel.EMPLOYEE_ONLY,
      CoverageLevel.EMPLOYEE_SPOUSE,
      CoverageLevel.EMPLOYEE_CHILDREN,
      CoverageLevel.FAMILY,
    ],
    employeeMonthlyPremium: {
      [CoverageLevel.EMPLOYEE_ONLY]: 25,
      [CoverageLevel.EMPLOYEE_SPOUSE]: 60,
      [CoverageLevel.EMPLOYEE_CHILDREN]: 55,
      [CoverageLevel.FAMILY]: 90,
    },
    employerMonthlyContribution: {
      [CoverageLevel.EMPLOYEE_ONLY]: 15,
      [CoverageLevel.EMPLOYEE_SPOUSE]: 10,
      [CoverageLevel.EMPLOYEE_CHILDREN]: 10,
      [CoverageLevel.FAMILY]: 10,
    },
    features: [
      '100% preventive coverage',
      '80% basic procedures',
      '50% major procedures',
      'Orthodontia available',
      'Large provider network',
    ],
    isActive: true,
  },
  {
    id: '401k-1',
    name: 'Company 401(k) Plan',
    type: BenefitType.RETIREMENT,
    provider: 'Fidelity',
    description: 'Tax-advantaged retirement savings with employer match',
    coverageLevels: [CoverageLevel.EMPLOYEE_ONLY],
    employeeMonthlyPremium: {
      [CoverageLevel.EMPLOYEE_ONLY]: 0,
      [CoverageLevel.EMPLOYEE_SPOUSE]: 0,
      [CoverageLevel.EMPLOYEE_CHILDREN]: 0,
      [CoverageLevel.FAMILY]: 0,
    },
    employerMonthlyContribution: {
      [CoverageLevel.EMPLOYEE_ONLY]: 0,
      [CoverageLevel.EMPLOYEE_SPOUSE]: 0,
      [CoverageLevel.EMPLOYEE_CHILDREN]: 0,
      [CoverageLevel.FAMILY]: 0,
    },
    features: [
      'Company match up to 6% of salary',
      'Immediate vesting on employee contributions',
      '4-year vesting schedule for employer match',
      'Diverse investment options',
      'Roth 401(k) available',
      'Automatic portfolio rebalancing',
    ],
    isActive: true,
  },
];

const mockEnrollmentPeriod: EnrollmentPeriod = {
  id: 'open-2024',
  name: 'Open Enrollment 2024',
  type: 'open',
  startDate: '2024-11-01',
  endDate: '2024-11-30',
  description: 'Annual open enrollment period for 2025 benefits',
  isActive: true,
};

interface UseBenefitsReturn {
  // Data
  plans: BenefitPlan[];
  enrollments: EmployeeBenefitEnrollment[];
  enrollmentPeriod: EnrollmentPeriod | null;
  dependents: Dependent[];
  planMap: Map<string, BenefitPlan>;

  // State
  isLoading: boolean;
  error: string | null;

  // Methods
  fetchPlans: (type?: BenefitType) => Promise<void>;
  fetchEnrollments: (employeeId: string) => Promise<void>;
  fetchEnrollmentPeriod: () => Promise<void>;
  fetchAllData: (employeeId: string) => Promise<void>;
  enrollInPlan: (enrollment: Partial<EmployeeBenefitEnrollment>) => Promise<void>;
  updateEnrollment: (enrollmentId: string, data: Partial<EmployeeBenefitEnrollment>) => Promise<void>;
  cancelEnrollment: (enrollmentId: string) => Promise<void>;
  calculateCost: (planId: string, coverageLevel: CoverageLevel, payFrequency: string) => CostCalculation | null;
}

export function useBenefits(): UseBenefitsReturn {
  const { toast } = useToast();
  const [plans, setPlans] = useState<BenefitPlan[]>([]);
  const [enrollments, setEnrollments] = useState<EmployeeBenefitEnrollment[]>([]);
  const [enrollmentPeriod, setEnrollmentPeriod] = useState<EnrollmentPeriod | null>(null);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized plan lookup map for O(1) access in calculateCost
  const planMap = useMemo(() => {
    const map = new Map<string, BenefitPlan>();
    plans.forEach(plan => map.set(plan.id, plan));
    return map;
  }, [plans]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchPlans = useCallback(async (type?: BenefitType) => {
    setIsLoading(true);
    setError(null);
    try {
      // Reduced delay for better UX
      if (API_DELAY > 0) {
        await new Promise(resolve => setTimeout(resolve, API_DELAY));
      }
      const filteredPlans = type
        ? mockBenefitPlans.filter(p => p.type === type)
        : mockBenefitPlans;
      setPlans(filteredPlans);
    } catch (err) {
      const errorMessage = 'Failed to fetch benefit plans';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchEnrollments = useCallback(async (employeeId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (API_DELAY > 0) {
        await new Promise(resolve => setTimeout(resolve, API_DELAY));
      }
      // Mock empty enrollments
      setEnrollments([]);
    } catch (err) {
      const errorMessage = 'Failed to fetch enrollments';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchEnrollmentPeriod = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (API_DELAY > 0) {
        await new Promise(resolve => setTimeout(resolve, API_DELAY));
      }
      setEnrollmentPeriod(mockEnrollmentPeriod);
    } catch (err) {
      const errorMessage = 'Failed to fetch enrollment period';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Parallel fetch for all data - more efficient
  const fetchAllData = useCallback(async (employeeId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchPlans(),
        fetchEnrollments(employeeId),
        fetchEnrollmentPeriod(),
      ]);
    } catch (err) {
      setError('Failed to fetch benefits data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPlans, fetchEnrollments, fetchEnrollmentPeriod]);

  const enrollInPlan = useCallback(async (enrollment: Partial<EmployeeBenefitEnrollment>) => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: 'Success',
        description: 'Successfully enrolled in benefit plan',
      });
    } catch (err) {
      const errorMessage = 'Failed to enroll in plan';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateEnrollment = useCallback(async (enrollmentId: string, data: Partial<EmployeeBenefitEnrollment>) => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: 'Success',
        description: 'Enrollment updated successfully',
      });
    } catch (err) {
      const errorMessage = 'Failed to update enrollment';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const cancelEnrollment = useCallback(async (enrollmentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));

      toast({
        title: 'Success',
        description: 'Enrollment cancelled successfully',
      });
    } catch (err) {
      const errorMessage = 'Failed to cancel enrollment';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Optimized calculateCost using memoized planMap for O(1) lookup
  const calculateCost = useCallback((
    planId: string,
    coverageLevel: CoverageLevel,
    payFrequency: string
  ): CostCalculation | null => {
    // Use O(1) map lookup instead of O(n) array find
    const plan = planMap.get(planId);
    if (!plan) return null;

    const monthlyPremium = plan.employeeMonthlyPremium[coverageLevel] || 0;
    const employerContribution = plan.employerMonthlyContribution[coverageLevel] || 0;
    const employeeCost = monthlyPremium;
    const annualCost = employeeCost * 12;

    // Use constant map instead of switch statement
    const paychecksPerYear = PAY_FREQUENCY_MAP[payFrequency] || 12;
    const costPerPaycheck = annualCost / paychecksPerYear;

    return {
      planId,
      coverageLevel,
      monthlyPremium,
      employerContribution,
      employeeCost,
      annualCost,
      costPerPaycheck,
      payFrequency: payFrequency as 'weekly' | 'biweekly' | 'semimonthly' | 'monthly',
    };
  }, [planMap]);

  return {
    // Data
    plans,
    enrollments,
    enrollmentPeriod,
    dependents,
    planMap,
    // State
    isLoading,
    error,
    // Methods
    fetchPlans,
    fetchEnrollments,
    fetchEnrollmentPeriod,
    fetchAllData,
    enrollInPlan,
    updateEnrollment,
    cancelEnrollment,
    calculateCost,
  };
}

// Hook for managing enrollment wizard state
export function useBenefitsEnrollment(employeeId: string) {
  const { toast } = useToast();
  const [state, setState] = useState<BenefitsEnrollmentState>({
    employeeId,
    enrollmentPeriod: null,
    healthPlan: null,
    healthCoverageLevel: null,
    dentalPlan: null,
    dentalCoverageLevel: null,
    visionPlan: null,
    visionCoverageLevel: null,
    retirementPlan: null,
    retirementContribution: null,
    lifePlan: null,
    beneficiaries: [],
    hsaPlan: null,
    fsaPlan: null,
    dependents: [],
    currentStep: 1,
    completedSteps: [],
    isLoading: false,
    error: null,
  });

  const updateState = useCallback((updates: Partial<BenefitsEnrollmentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, prev.currentStep])],
      currentStep: Math.min(prev.currentStep + 1, 7),
    }));
  }, []);

  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const submitEnrollment = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Reduced delay for better UX
      if (API_DELAY > 0) {
        await new Promise(resolve => setTimeout(resolve, API_DELAY * 2));
      }

      toast({
        title: 'Success',
        description: 'Benefits enrollment submitted successfully',
      });

      return true;
    } catch (err) {
      const errorMessage = 'Failed to submit enrollment';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  // Memoized computed values for enrollment progress
  const isComplete = useMemo(() =>
    state.completedSteps.length >= 6, // All required steps completed
    [state.completedSteps]
  );

  const progress = useMemo(() =>
    (state.completedSteps.length / 7) * 100,
    [state.completedSteps]
  );

  const hasHealthSelection = useMemo(() =>
    !!(state.healthPlan && state.healthCoverageLevel),
    [state.healthPlan, state.healthCoverageLevel]
  );

  return {
    state,
    updateState,
    nextStep,
    previousStep,
    goToStep,
    submitEnrollment,
    // Computed values
    isComplete,
    progress,
    hasHealthSelection,
  };
}
