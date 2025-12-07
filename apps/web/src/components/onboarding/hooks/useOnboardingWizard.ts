/**
 * useOnboardingWizard Hook
 * Manages onboarding wizard state, navigation, and persistence
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UseFormReturn } from 'react-hook-form'

import { useToast } from '@/components/ui/use-toast'
import type {
  OnboardingFormData,
  OnboardingProgress,
  OnboardingStep,
  UseOnboardingWizardReturn,
} from '@/types/onboarding'

const STORAGE_KEY = 'operate_onboarding_progress'

interface UseOnboardingWizardOptions {
  steps: OnboardingStep[]
  formMethods: UseFormReturn<OnboardingFormData>
  onComplete?: (data: OnboardingFormData) => void | Promise<void>
  persistProgress?: boolean
}

export function useOnboardingWizard({
  steps,
  formMethods,
  onComplete,
  persistProgress = true,
}: UseOnboardingWizardOptions): UseOnboardingWizardReturn {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [skippedSteps, setSkippedSteps] = useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load saved progress from localStorage
  useEffect(() => {
    if (!persistProgress) return

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const progress = JSON.parse(saved)
        setCurrentStep(progress.currentStep || 0)
        setCompletedSteps(new Set(progress.completedSteps || []))
        setSkippedSteps(new Set(progress.skippedSteps || []))
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error)
    }
  }, [persistProgress])

  // Save progress to localStorage
  useEffect(() => {
    if (!persistProgress) return

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentStep,
          completedSteps: Array.from(completedSteps),
          skippedSteps: Array.from(skippedSteps),
        })
      )
    } catch (error) {
      console.error('Failed to save onboarding progress:', error)
    }
  }, [currentStep, completedSteps, skippedSteps, persistProgress])

  // Calculate progress metrics
  const progress: OnboardingProgress = {
    totalSteps: steps.length,
    completedSteps: completedSteps.size,
    skippedSteps: skippedSteps.size,
    currentStep,
    percentageComplete: Math.round(((currentStep + 1) / steps.length) * 100),
    estimatedTimeRemaining: calculateTimeRemaining(steps.length - currentStep - 1),
  }

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  /**
   * Validate the current step before proceeding
   */
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const step = steps[currentStep]
    if (!step) return true

    // Optional steps can always be skipped
    if (step.optional) {
      return true
    }

    // Validate required steps based on step ID
    if (step.id === 'company') {
      const isValid = await formMethods.trigger('companyInfo')
      if (!isValid) {
        toast({
          title: 'Incomplete Information',
          description: 'Please fill in all required fields before proceeding.',
          variant: 'destructive',
        })
      }
      return isValid
    }

    if (step.id === 'preferences') {
      const isValid = await formMethods.trigger('preferences')
      if (!isValid) {
        toast({
          title: 'Incomplete Information',
          description: 'Please check your preferences settings.',
          variant: 'destructive',
        })
      }
      return isValid
    }

    return true
  }, [currentStep, steps, formMethods, toast])

  /**
   * Navigate to a specific step
   */
  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setCurrentStep(stepIndex)
      }
    },
    [steps.length]
  )

  /**
   * Move to the next step
   */
  const nextStep = useCallback(async () => {
    const isValid = await validateCurrentStep()

    if (!isValid) {
      return
    }

    // Mark current step as completed
    setCompletedSteps((prev) => new Set(prev).add(currentStep))

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }, [currentStep, steps.length, validateCurrentStep])

  /**
   * Move to the previous step
   */
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  /**
   * Skip the current step (only for optional steps)
   */
  const skipStep = useCallback(() => {
    const step = steps[currentStep]

    if (!step?.optional) {
      toast({
        title: 'Cannot Skip',
        description: 'This step is required and cannot be skipped.',
        variant: 'destructive',
      })
      return
    }

    // Mark as skipped and move to next
    setSkippedSteps((prev) => new Set(prev).add(currentStep))
    setCompletedSteps((prev) => new Set(prev).add(currentStep))

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }, [currentStep, steps, toast])

  /**
   * Submit the complete onboarding
   */
  const submitOnboarding = useCallback(
    async (data: OnboardingFormData) => {
      setIsSubmitting(true)

      try {
        // Call API to mark onboarding as complete
        const response = await fetch('/api/v1/onboarding/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to save onboarding data')
        }

        toast({
          title: 'Setup Complete!',
          description: 'Your account has been configured successfully.',
        })

        // Set onboarding_complete cookie so middleware allows access to protected routes
        document.cookie = 'onboarding_complete=true; path=/; max-age=31536000; SameSite=Lax'

        // Clear saved progress
        if (persistProgress) {
          localStorage.removeItem(STORAGE_KEY)
        }

        // Call completion callback
        if (onComplete) {
          await onComplete(data)
        } else {
          // Default: redirect to chat (main page)
          router.push('/chat')
        }
      } catch (error) {
        console.error('Onboarding error:', error)
        toast({
          title: 'Error',
          description: 'Failed to complete onboarding. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [toast, persistProgress, onComplete, router]
  )

  return {
    // State
    currentStep,
    completedSteps,
    skippedSteps,
    isFirstStep,
    isLastStep,
    isSubmitting,
    progress,

    // Navigation
    goToStep,
    nextStep,
    previousStep,
    skipStep,

    // Validation
    validateCurrentStep,

    // Submission
    submitOnboarding,
  }
}

/**
 * Calculate estimated time remaining
 */
function calculateTimeRemaining(stepsRemaining: number): string {
  // Estimate 2 minutes per step
  const minutesPerStep = 2
  const totalMinutes = stepsRemaining * minutesPerStep

  if (totalMinutes < 1) {
    return 'Less than 1 minute'
  }

  if (totalMinutes < 60) {
    return `About ${totalMinutes} ${totalMinutes === 1 ? 'minute' : 'minutes'}`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (minutes === 0) {
    return `About ${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }

  return `About ${hours}h ${minutes}m`
}
