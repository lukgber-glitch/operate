/**
 * User Onboarding Progress Types
 * Proper TypeScript types to replace any types
 */

export interface UserOnboardingProgressData {
  id: string;
  userId: string;
  currentStep: string;
  completedSteps: string[];
  skippedSteps: string[];
  stepData: Record<string, unknown>;
  startedAt: Date;
  completedAt: Date | null;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingStepData {
  [key: string]: unknown;
}
