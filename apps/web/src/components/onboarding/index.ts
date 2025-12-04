// Main wizard components
export { OnboardingWizard } from './OnboardingWizard'
export { OnboardingProgress } from './OnboardingProgress'
export type { OnboardingStep } from './OnboardingProgress'

// Hooks
export { useOnboardingWizard } from './hooks/useOnboardingWizard'

// Step components (exported for individual use if needed)
export { WelcomeStep } from './steps/WelcomeStep'
export { CompanyInfoStep } from './steps/CompanyInfoStep'
export { BankingStep } from './steps/BankingStep'
export { EmailStep } from './steps/EmailStep'
export { TaxStep } from './steps/TaxStep'
export { AccountingStep } from './steps/AccountingStep'
export { PreferencesStep } from './steps/PreferencesStep'
export { CompletionStep } from './steps/CompletionStep'

// Re-export types from types/onboarding
export type {
  StepStatus,
  OnboardingState,
  OnboardingFormData,
  OnboardingProgress as OnboardingProgressType,
  CompanyProfile,
  BankConnection,
  EmailConnection,
  TaxSoftwareConnection,
  AccountingSoftwareConnection,
  UserPreferences,
} from '@/types/onboarding'
