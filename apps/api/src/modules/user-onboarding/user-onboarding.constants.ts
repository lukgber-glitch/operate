/**
 * User Onboarding Constants
 * Defines the onboarding steps, their order, and metadata
 */

export interface OnboardingStepMetadata {
  id: string;
  name: string;
  description: string;
  estimatedTime: number; // in minutes
  required: boolean;
  order: number;
}

/**
 * Step IDs - used as identifiers throughout the system
 */
export const ONBOARDING_STEPS = {
  WELCOME: 'welcome',
  PROFILE: 'profile',
  COMPANY: 'company',
  TEAM: 'team',
  PREFERENCES: 'preferences',
  INTEGRATIONS: 'integrations',
  COMPLETE: 'complete',
} as const;

export type OnboardingStepId = typeof ONBOARDING_STEPS[keyof typeof ONBOARDING_STEPS];

/**
 * Ordered list of onboarding steps with metadata
 */
export const ONBOARDING_STEP_METADATA: OnboardingStepMetadata[] = [
  {
    id: ONBOARDING_STEPS.WELCOME,
    name: 'Welcome',
    description: 'Welcome to the platform and introduction',
    estimatedTime: 1,
    required: true,
    order: 1,
  },
  {
    id: ONBOARDING_STEPS.PROFILE,
    name: 'Profile Setup',
    description: 'Complete your user profile',
    estimatedTime: 3,
    required: true,
    order: 2,
  },
  {
    id: ONBOARDING_STEPS.COMPANY,
    name: 'Company Information',
    description: 'Set up your company details',
    estimatedTime: 5,
    required: true,
    order: 3,
  },
  {
    id: ONBOARDING_STEPS.TEAM,
    name: 'Team Setup',
    description: 'Invite team members',
    estimatedTime: 3,
    required: false,
    order: 4,
  },
  {
    id: ONBOARDING_STEPS.PREFERENCES,
    name: 'Preferences',
    description: 'Configure your preferences and settings',
    estimatedTime: 2,
    required: false,
    order: 5,
  },
  {
    id: ONBOARDING_STEPS.INTEGRATIONS,
    name: 'Integrations',
    description: 'Connect third-party tools and services',
    estimatedTime: 5,
    required: false,
    order: 6,
  },
  {
    id: ONBOARDING_STEPS.COMPLETE,
    name: 'Complete',
    description: 'Finalize onboarding and start using the platform',
    estimatedTime: 1,
    required: true,
    order: 7,
  },
];

/**
 * Map of step IDs to their metadata
 */
export const STEP_ID_TO_METADATA = ONBOARDING_STEP_METADATA.reduce(
  (acc, step) => {
    acc[step.id] = step;
    return acc;
  },
  {} as Record<string, OnboardingStepMetadata>,
);

/**
 * Get step order by ID
 */
export function getStepOrder(stepId: string): number {
  return STEP_ID_TO_METADATA[stepId]?.order ?? 0;
}

/**
 * Get next step ID
 */
export function getNextStepId(currentStepId: string): string | null {
  const currentOrder = getStepOrder(currentStepId);
  const nextStep = ONBOARDING_STEP_METADATA.find(
    (step) => step.order === currentOrder + 1,
  );
  return nextStep?.id ?? null;
}

/**
 * Get previous step ID
 */
export function getPreviousStepId(currentStepId: string): string | null {
  const currentOrder = getStepOrder(currentStepId);
  const previousStep = ONBOARDING_STEP_METADATA.find(
    (step) => step.order === currentOrder - 1,
  );
  return previousStep?.id ?? null;
}

/**
 * Validate if a step ID is valid
 */
export function isValidStepId(stepId: string): boolean {
  return stepId in STEP_ID_TO_METADATA;
}

/**
 * Get all required step IDs
 */
export function getRequiredStepIds(): string[] {
  return ONBOARDING_STEP_METADATA.filter((step) => step.required).map(
    (step) => step.id,
  );
}

/**
 * Calculate total estimated time
 */
export function getTotalEstimatedTime(): number {
  return ONBOARDING_STEP_METADATA.reduce(
    (total, step) => total + step.estimatedTime,
    0,
  );
}
