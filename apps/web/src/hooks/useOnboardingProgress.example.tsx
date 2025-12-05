/**
 * Example Usage: useOnboardingProgress Hook
 *
 * This file demonstrates how to integrate the useOnboardingProgress hook
 * into the onboarding wizard for automatic progress persistence.
 */

'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useOnboardingProgress } from './useOnboardingProgress'
import type { OnboardingFormData } from '@/types/onboarding'

/**
 * Example 1: Basic Integration with Wizard
 */
export function OnboardingWizardWithPersistence() {
  const {
    formData,
    currentStepData,
    saveProgress,
    loadProgress,
    clearProgress,
    canResume,
    lastSavedAt,
    isSaving,
    saveError,
  } = useOnboardingProgress()

  const methods = useForm<OnboardingFormData>({
    defaultValues: formData as OnboardingFormData,
  })

  // Load saved progress on mount
  useEffect(() => {
    const initializeProgress = async () => {
      const savedData = await loadProgress()
      if (Object.keys(savedData).length > 0) {
        methods.reset(savedData)
      }
    }

    initializeProgress()
  }, [loadProgress, methods])

  // Save progress when moving to next step
  const handleNextStep = async (stepId: string) => {
    const currentData = methods.getValues()

    // Save current step data
    await saveProgress(stepId, currentData)
  }

  // Handle back navigation - data is preserved automatically
  const handlePreviousStep = () => {
    // No need to save - data is already in form state
  }

  // Clear progress when starting over
  const handleStartOver = () => {
    clearProgress()
    methods.reset()
  }

  return (
    <div>
      {/* Show resume option if saved progress exists */}
      {canResume && lastSavedAt && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            You have a saved onboarding in progress from{' '}
            {lastSavedAt.toLocaleDateString()}. Would you like to continue?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => loadProgress()}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Continue
            </button>
            <button
              onClick={handleStartOver}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Show saving indicator */}
      {isSaving && (
        <div className="mb-2 text-sm text-gray-500">
          Saving progress...
        </div>
      )}

      {/* Show save error */}
      {saveError && (
        <div className="mb-2 text-sm text-red-500">
          Failed to save progress. Changes are saved locally.
        </div>
      )}

      {/* Your wizard steps here */}
      {/* ... */}
    </div>
  )
}

/**
 * Example 2: Auto-save on Form Change
 */
export function AutoSaveExample() {
  const { saveProgress, formData } = useOnboardingProgress()
  const methods = useForm<OnboardingFormData>({
    defaultValues: formData as OnboardingFormData,
  })

  // Watch form changes and auto-save
  useEffect(() => {
    const subscription = methods.watch((value, { name }) => {
      if (name) {
        // Determine which step this field belongs to
        const stepId = getStepIdFromFieldName(name)
        if (stepId) {
          // Save progress automatically (debounced)
          saveProgress(stepId, value)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [methods, saveProgress])

  return <div>{/* Your form here */}</div>
}

/**
 * Example 3: Step-by-Step Save
 */
export function StepByStepSaveExample() {
  const { saveProgress, currentStepData } = useOnboardingProgress()
  const currentStep = 'company' // From wizard state

  const handleStepComplete = async (data: Record<string, any>) => {
    try {
      await saveProgress(currentStep, data)

      // Show success message
      console.log('Progress saved successfully')

      // Move to next step
      // navigateToNextStep()
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  return (
    <div>
      <form onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData)
        handleStepComplete(data)
      }}>
        {/* Form fields */}
        <button type="submit">Save & Continue</button>
      </form>

      {/* Current step data is available */}
      {currentStepData && (
        <div>
          <h3>Previously Saved Data:</h3>
          <pre>{JSON.stringify(currentStepData, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

/**
 * Example 4: Integration with useOnboardingWizard
 */
export function IntegratedWizardExample() {
  const {
    formData,
    saveProgress,
    loadProgress,
    canResume,
    isSaving,
  } = useOnboardingProgress()

  const methods = useForm<OnboardingFormData>({
    defaultValues: formData as OnboardingFormData,
  })

  // Load on mount
  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  // Integrate with existing useOnboardingWizard
  const onStepChange = async (stepIndex: number, stepId: string) => {
    const currentData = methods.getValues()
    await saveProgress(stepId, currentData)
  }

  return (
    <div>
      {/* Resume banner */}
      {canResume && <ResumeBanner />}

      {/* Saving indicator in header */}
      <div className="flex items-center justify-between mb-4">
        <h1>Onboarding</h1>
        {isSaving && (
          <span className="text-sm text-gray-500">Saving...</span>
        )}
      </div>

      {/* Wizard content */}
    </div>
  )
}

/**
 * Example 5: Handling Offline Scenarios
 */
export function OfflineAwareExample() {
  const {
    saveProgress,
    saveError,
    formData,
  } = useOnboardingProgress()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSave = async (stepId: string, data: Record<string, any>) => {
    await saveProgress(stepId, data)

    if (!isOnline) {
      // Show offline message
      console.log('Saved locally. Will sync when online.')
    } else if (saveError) {
      // Show error but reassure user
      console.log('API save failed but saved locally.')
    }
  }

  return (
    <div>
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
          <p className="text-sm text-yellow-800">
            You're currently offline. Your progress is being saved locally
            and will sync when you're back online.
          </p>
        </div>
      )}
      {/* Rest of component */}
    </div>
  )
}

// Helper function (implement based on your field naming convention)
function getStepIdFromFieldName(fieldName: string): string | null {
  // Example: 'companyInfo.name' -> 'company'
  if (fieldName.startsWith('companyInfo')) return 'company'
  if (fieldName.startsWith('banking')) return 'banking'
  if (fieldName.startsWith('email')) return 'email'
  if (fieldName.startsWith('tax')) return 'tax'
  if (fieldName.startsWith('accounting')) return 'accounting'
  if (fieldName.startsWith('preferences')) return 'preferences'
  return null
}

function ResumeBanner() {
  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-sm text-blue-800">
        Continue where you left off
      </p>
    </div>
  )
}

/**
 * Example 6: Complete Integration Pattern
 *
 * This shows the recommended way to integrate with the existing OnboardingWizard
 */
export function RecommendedIntegrationPattern() {
  const {
    formData: savedFormData,
    saveProgress,
    loadProgress,
    clearProgress,
    canResume,
    lastSavedAt,
    isSaving,
    saveError,
  } = useOnboardingProgress()

  const methods = useForm<OnboardingFormData>()
  const [currentStep, setCurrentStep] = useState(0)
  const [showResumeBanner, setShowResumeBanner] = useState(false)

  // Load progress on mount
  useEffect(() => {
    const init = async () => {
      const loaded = await loadProgress()
      if (Object.keys(loaded).length > 0) {
        setShowResumeBanner(true)
      }
    }
    init()
  }, [loadProgress])

  // Resume from saved progress
  const handleResume = () => {
    methods.reset(savedFormData)
    setShowResumeBanner(false)
  }

  // Start fresh
  const handleStartFresh = () => {
    clearProgress()
    methods.reset({})
    setShowResumeBanner(false)
  }

  // Save on step change
  const handleStepChange = async (
    newStepIndex: number,
    stepId: string
  ) => {
    const currentData = methods.getValues()
    await saveProgress(stepId, currentData)
    setCurrentStep(newStepIndex)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Resume Banner */}
      {showResumeBanner && canResume && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Continue Your Setup
              </h3>
              <p className="text-sm text-blue-700">
                You have a saved onboarding from{' '}
                {lastSavedAt?.toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResume}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Resume
              </button>
              <button
                onClick={handleStartFresh}
                className="px-4 py-2 bg-white text-blue-600 text-sm border border-blue-300 rounded hover:bg-blue-50"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {isSaving && (
            <div className="flex items-center gap-2 text-gray-500">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Saving...</span>
            </div>
          )}
          {!isSaving && lastSavedAt && (
            <span className="text-gray-500">
              Saved {lastSavedAt.toLocaleTimeString()}
            </span>
          )}
        </div>

        {saveError && (
          <div className="text-amber-600 text-xs">
            ⚠ Saved locally only
          </div>
        )}
      </div>

      {/* Wizard Content */}
      <div>{/* Your wizard steps */}</div>
    </div>
  )
}
