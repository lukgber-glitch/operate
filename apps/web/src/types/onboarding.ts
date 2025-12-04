/**
 * Onboarding Types
 * Type definitions for the multi-step onboarding wizard
 */

/**
 * Status of each onboarding step
 */
export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

/**
 * Definition of a single onboarding step
 */
export interface OnboardingStep {
  id: string
  title: string
  description: string
  optional?: boolean
  status?: StepStatus
}

/**
 * Company profile information
 */
export interface CompanyProfile {
  name: string
  country: string
  legalForm: string
  taxId: string
  tradeRegisterNumber?: string
  industry: string
  address: {
    street: string
    streetNumber: string
    postalCode: string
    city: string
    state?: string
  }
  businessEmail: string
  businessPhone: string
  website?: string
  fiscalYearStart: string
  currency: string
  vatRegistered: boolean
  logoUrl?: string | null
}

/**
 * Bank connection information
 */
export interface BankConnection {
  provider?: string | null
  connected?: boolean
  bankName?: string | null
  skipped?: boolean
}

/**
 * Email connection information
 */
export interface EmailConnection {
  provider?: string | null
  connected?: boolean
  address?: string | null
  skipped?: boolean
}

/**
 * Tax software connection information
 */
export interface TaxSoftwareConnection {
  provider?: string | null
  connected?: boolean
  skipped?: boolean
}

/**
 * Accounting software connection information
 */
export interface AccountingSoftwareConnection {
  provider?: string | null
  connected?: boolean
  skipped?: boolean
}

/**
 * User preferences and settings
 */
export interface UserPreferences {
  language: string
  timezone: string
  currency: string
  dateFormat: string
  notifications: {
    email: boolean
    invoiceReminders: boolean
    taxDeadlines: boolean
    bankTransactions: boolean
    weeklyReports: boolean
  }
}

/**
 * Complete onboarding state
 */
export interface OnboardingState {
  currentStep: number
  completedSteps: Set<number>
  skippedSteps: Set<number>
  companyProfile?: CompanyProfile
  bankConnection?: BankConnection
  emailConnection?: EmailConnection
  taxSoftware?: TaxSoftwareConnection
  accountingSoftware?: AccountingSoftwareConnection
  preferences?: UserPreferences
}

/**
 * Full onboarding form data
 */
export interface OnboardingFormData {
  companyInfo: CompanyProfile
  banking: BankConnection
  email: EmailConnection
  tax: TaxSoftwareConnection
  accounting: AccountingSoftwareConnection
  preferences: UserPreferences
}

/**
 * Onboarding progress information
 */
export interface OnboardingProgress {
  totalSteps: number
  completedSteps: number
  skippedSteps: number
  currentStep: number
  percentageComplete: number
  estimatedTimeRemaining?: string
}

/**
 * Onboarding wizard hook return type
 */
export interface UseOnboardingWizardReturn {
  // State
  currentStep: number
  completedSteps: Set<number>
  skippedSteps: Set<number>
  isFirstStep: boolean
  isLastStep: boolean
  isSubmitting: boolean
  progress: OnboardingProgress

  // Navigation
  goToStep: (stepIndex: number) => void
  nextStep: () => Promise<void>
  previousStep: () => void
  skipStep: () => void

  // Validation
  validateCurrentStep: () => Promise<boolean>

  // Submission
  submitOnboarding: (data: OnboardingFormData) => Promise<void>
}
