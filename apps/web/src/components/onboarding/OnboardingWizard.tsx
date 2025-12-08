'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import * as React from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { OnboardingProgress, type OnboardingStep } from './OnboardingProgress'
import { useOnboardingWizard } from './hooks/useOnboardingWizard'
import { StepTransition } from './StepTransition'
import { AccountingStep } from './steps/AccountingStep'
import { BankingStep } from './steps/BankingStep'
import { CompanyInfoStep } from './steps/CompanyInfoStep'
import { CompletionStep } from './steps/CompletionStep'
import { EmailStep } from './steps/EmailStep'
import { PreferencesStep } from './steps/PreferencesStep'
import { TaxStep } from './steps/TaxStep'
import { WelcomeStep } from './steps/WelcomeStep'

// Validation schema
const onboardingSchema = z.object({
  companyInfo: z.object({
    name: z.string().min(1, 'Company name is required'),
    country: z.string().min(1, 'Country is required'),
    legalForm: z.string().min(1, 'Legal form is required'),
    taxId: z.string().min(1, 'Tax ID is required'),
    tradeRegisterNumber: z.string().optional(),
    industry: z.string().min(1, 'Industry is required'),
    address: z.object({
      street: z.string().min(1, 'Street is required'),
      streetNumber: z.string().min(1, 'Street number is required'),
      postalCode: z.string().min(1, 'Postal code is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().optional(),
    }),
    businessEmail: z.string().min(1, 'Business email is required').email('Invalid email format'),
    businessPhone: z.string().min(1, 'Business phone is required'),
    website: z.string().url('Invalid URL format').optional().or(z.literal('')),
    fiscalYearStart: z.string().min(1, 'Fiscal year start is required'),
    currency: z.string().min(1, 'Currency is required'),
    vatRegistered: z.boolean(),
    logoUrl: z.string().nullable().optional(),
  }),
  banking: z.object({
    provider: z.string().nullable().optional(),
    connected: z.boolean().optional(),
    bankName: z.string().nullable().optional(),
    skipped: z.boolean().optional(),
  }),
  email: z.object({
    provider: z.string().nullable().optional(),
    connected: z.boolean().optional(),
    address: z.string().nullable().optional(),
    skipped: z.boolean().optional(),
  }),
  tax: z.object({
    provider: z.string().nullable().optional(),
    connected: z.boolean().optional(),
    skipped: z.boolean().optional(),
  }),
  accounting: z.object({
    provider: z.string().nullable().optional(),
    connected: z.boolean().optional(),
    skipped: z.boolean().optional(),
  }),
  preferences: z.object({
    language: z.string().default('en'),
    timezone: z.string().default('Europe/Berlin'),
    currency: z.string().default('EUR'),
    dateFormat: z.string().default('dd/mm/yyyy'),
    notifications: z.object({
      email: z.boolean().default(true),
      invoiceReminders: z.boolean().default(true),
      taxDeadlines: z.boolean().default(true),
      bankTransactions: z.boolean().default(false),
      weeklyReports: z.boolean().default(true),
    }),
  }),
})

type OnboardingFormData = z.infer<typeof onboardingSchema>

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Getting started',
  },
  {
    id: 'company',
    title: 'Company Info',
    description: 'Basic company information',
  },
  {
    id: 'banking',
    title: 'Banking',
    description: 'Connect your bank account',
    optional: true,
  },
  {
    id: 'email',
    title: 'Email',
    description: 'Connect your email',
    optional: true,
  },
  {
    id: 'tax',
    title: 'Tax Software',
    description: 'Connect tax software',
    optional: true,
  },
  {
    id: 'accounting',
    title: 'Accounting',
    description: 'Connect accounting software',
    optional: true,
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Customize your experience',
  },
  {
    id: 'completion',
    title: 'Complete',
    description: 'Setup complete',
  },
]

interface OnboardingWizardProps {
  onComplete?: (data: OnboardingFormData) => void
  initialData?: Partial<OnboardingFormData>
}

export function OnboardingWizard({ onComplete, initialData }: OnboardingWizardProps) {
  const [direction, setDirection] = React.useState<'forward' | 'backward'>('forward')

  const methods = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: initialData || {
      companyInfo: {
        name: '',
        country: '',
        legalForm: '',
        taxId: '',
        tradeRegisterNumber: '',
        industry: '',
        address: {
          street: '',
          streetNumber: '',
          postalCode: '',
          city: '',
          state: '',
        },
        businessEmail: '',
        businessPhone: '',
        website: '',
        fiscalYearStart: '1',
        currency: '',
        vatRegistered: false,
        logoUrl: null,
      },
      banking: {
        provider: null,
        connected: false,
        bankName: null,
        skipped: false,
      },
      email: {
        provider: null,
        connected: false,
        address: null,
        skipped: false,
      },
      tax: {
        provider: null,
        connected: false,
        skipped: false,
      },
      accounting: {
        provider: null,
        connected: false,
        skipped: false,
      },
      preferences: {
        language: 'en',
        timezone: 'Europe/Berlin',
        currency: 'EUR',
        dateFormat: 'dd/mm/yyyy',
        notifications: {
          email: true,
          invoiceReminders: true,
          taxDeadlines: true,
          bankTransactions: false,
          weeklyReports: true,
        },
      },
    },
  })

  const { handleSubmit } = methods

  const {
    currentStep,
    completedSteps,
    isFirstStep,
    isLastStep,
    isSubmitting,
    progress,
    nextStep,
    previousStep,
    skipStep,
    submitOnboarding,
  } = useOnboardingWizard({
    steps: STEPS,
    formMethods: methods,
    onComplete,
    persistProgress: true,
  })

  const renderStep = () => {
    const step = STEPS[currentStep]
    if (!step) return null

    const formData = methods.watch()

    switch (step.id) {
      case 'welcome':
        return <WelcomeStep />
      case 'company':
        return <CompanyInfoStep />
      case 'banking':
        return <BankingStep />
      case 'email':
        return <EmailStep />
      case 'tax':
        return <TaxStep />
      case 'accounting':
        return <AccountingStep />
      case 'preferences':
        return <PreferencesStep />
      case 'completion':
        return (
          <CompletionStep
            companyName={formData.companyInfo?.name}
            setupCompleted={{
              banking: formData.banking?.connected,
              email: formData.email?.connected,
              tax: formData.tax?.connected,
              accounting: formData.accounting?.connected,
            }}
          />
        )
      default:
        return null
    }
  }

  const currentStepData = STEPS[currentStep]
  const showSkipButton = currentStepData?.optional && !isLastStep

  // Wrapped navigation functions to track direction
  const handleNext = () => {
    setDirection('forward')
    nextStep()
  }

  const handlePrevious = () => {
    setDirection('backward')
    previousStep()
  }

  const handleSkip = () => {
    setDirection('forward')
    skipStep()
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:px-6 md:py-12">
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(submitOnboarding)} className="space-y-8">
          {/* Header - Only show on non-welcome and non-completion steps */}
          {currentStepData?.id !== 'welcome' && currentStepData?.id !== 'completion' && (
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-semibold">
                Welcome to Operate
              </h1>
              <p className="text-lg text-muted-foreground">
                Let&apos;s set up your account in just a few steps
              </p>
            </div>
          )}

          {/* Progress Indicator - Hide on welcome and completion */}
          {currentStepData?.id !== 'welcome' && currentStepData?.id !== 'completion' && (
            <div className="mb-6">
              <OnboardingProgress
                steps={STEPS}
                currentStep={currentStep}
                completedSteps={completedSteps}
              />
            </div>
          )}

          {/* Step Content with Transition */}
          <div className="min-h-[400px] flex items-start justify-center">
            <StepTransition stepKey={currentStep} direction={direction}>
              {renderStep()}
            </StepTransition>
          </div>

          {/* Navigation - Hide on completion step */}
          {currentStepData?.id !== 'completion' && (
            <Card className="p-6 rounded-[24px]">
              <div className="flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isFirstStep}
                  className="h-12 px-6 rounded-[12px]"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <div className="flex items-center gap-3 text-center">
                  <span className="text-sm text-muted-foreground font-medium">
                    Step {currentStep + 1} of {STEPS.length}
                  </span>
                  {progress.estimatedTimeRemaining && (
                    <span className="text-xs text-muted-foreground hidden md:inline">
                      • {progress.estimatedTimeRemaining} remaining
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {showSkipButton && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSkip}
                      className="h-12 px-5 rounded-[12px]"
                    >
                      Skip
                    </Button>
                  )}
                  {isLastStep ? (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-12 px-6 rounded-[12px]"
                    >
                      {isSubmitting ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Complete Setup
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="h-12 px-6 rounded-[12px]"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </form>
      </FormProvider>
    </div>
  )
}
