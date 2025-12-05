/**
 * useOnboardingProgress Hook
 * Manages onboarding progress persistence with API sync and localStorage backup
 *
 * Features:
 * - Auto-save to API (debounced)
 * - Instant localStorage backup
 * - Resume from last saved state
 * - Conflict resolution (API wins if newer)
 * - Handles offline scenarios
 */

'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useToast } from '@/components/ui/use-toast'
import type { OnboardingFormData } from '@/types/onboarding'

const STORAGE_KEY = 'operate_onboarding_progress'
const API_DEBOUNCE_MS = 500
const STORAGE_VERSION = '1.0'

interface SavedProgress {
  version: string
  formData: Partial<OnboardingFormData>
  currentStep: string
  completedSteps: string[]
  skippedSteps: string[]
  lastSavedAt: string // ISO date string
  source: 'api' | 'localStorage'
}

interface UseOnboardingProgressReturn {
  formData: Partial<OnboardingFormData>
  currentStepData: Record<string, any>
  saveProgress: (stepId: string, data: Record<string, any>) => Promise<void>
  loadProgress: () => Promise<Partial<OnboardingFormData>>
  clearProgress: () => void
  canResume: boolean
  lastSavedAt: Date | null
  isSaving: boolean
  saveError: Error | null
}

interface StepMapping {
  [key: string]: keyof OnboardingFormData
}

// Map step IDs to form data keys
const STEP_TO_DATA_KEY: StepMapping = {
  'welcome': 'companyInfo', // No data saved for welcome
  'company': 'companyInfo',
  'banking': 'banking',
  'email': 'email',
  'tax': 'tax',
  'accounting': 'accounting',
  'preferences': 'preferences',
  'completion': 'preferences', // No data saved for completion
}

// Map form data keys to API step names
const DATA_KEY_TO_API_STEP: Record<string, string> = {
  'companyInfo': 'company_info',
  'banking': 'banking',
  'email': 'email',
  'tax': 'tax',
  'accounting': 'accounting',
  'preferences': 'preferences',
}

/**
 * Hook for managing onboarding progress with persistence
 */
export function useOnboardingProgress(): UseOnboardingProgressReturn {
  const { toast } = useToast()

  // State
  const [formData, setFormData] = useState<Partial<OnboardingFormData>>({})
  const [currentStepId, setCurrentStepId] = useState<string>('welcome')
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [skippedSteps, setSkippedSteps] = useState<string[]>([])
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<Error | null>(null)
  const [canResume, setCanResume] = useState(false)

  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingSaveRef = useRef<{ stepId: string; data: Record<string, any> } | null>(null)

  /**
   * Save to localStorage immediately
   */
  const saveToLocalStorage = useCallback((progress: SavedProgress) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }, [])

  /**
   * Load from localStorage
   */
  const loadFromLocalStorage = useCallback((): SavedProgress | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return null

      const progress = JSON.parse(saved) as SavedProgress

      // Validate version
      if (progress.version !== STORAGE_VERSION) {
        console.warn('Onboarding progress version mismatch, clearing old data')
        localStorage.removeItem(STORAGE_KEY)
        return null
      }

      return progress
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return null
    }
  }, [])

  /**
   * Save to API (debounced)
   */
  const saveToAPI = useCallback(async (stepId: string, data: Record<string, any>) => {
    const dataKey = STEP_TO_DATA_KEY[stepId]
    if (!dataKey) {
      console.warn(`Unknown step ID: ${stepId}`)
      return
    }

    const apiStep = DATA_KEY_TO_API_STEP[dataKey]
    if (!apiStep) {
      console.warn(`No API mapping for data key: ${dataKey}`)
      return
    }

    try {
      setIsSaving(true)
      setSaveError(null)

      const response = await fetch(`/api/v1/onboarding/step/${apiStep}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
        }),
      })

      if (!response.ok) {
        throw new Error(`API save failed: ${response.statusText}`)
      }

      const result = await response.json()
      setLastSavedAt(new Date(result.updatedAt))

    } catch (error) {
      console.error('Failed to save to API:', error)
      setSaveError(error as Error)

      // Don't show error toast for every save failure
      // Only log to console for debugging
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * Load progress from API
   */
  const loadFromAPI = useCallback(async (): Promise<SavedProgress | null> => {
    try {
      const response = await fetch('/api/v1/onboarding/progress', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          // No progress found yet
          return null
        }
        throw new Error(`API load failed: ${response.statusText}`)
      }

      const apiProgress = await response.json()

      // Transform API response to SavedProgress format
      const formData: Partial<OnboardingFormData> = {}
      let currentStep = 'welcome'
      const completedSteps: string[] = []
      const skippedSteps: string[] = []

      // Map API steps to form data
      apiProgress.steps?.forEach((step: any) => {
        const formKey = Object.keys(DATA_KEY_TO_API_STEP).find(
          key => DATA_KEY_TO_API_STEP[key] === step.name
        )

        if (formKey && step.data) {
          formData[formKey as keyof OnboardingFormData] = step.data
        }

        if (step.status === 'COMPLETED') {
          const stepId = Object.keys(STEP_TO_DATA_KEY).find(
            id => STEP_TO_DATA_KEY[id] === formKey
          )
          if (stepId) completedSteps.push(stepId)
        }

        if (step.status === 'SKIPPED') {
          const stepId = Object.keys(STEP_TO_DATA_KEY).find(
            id => STEP_TO_DATA_KEY[id] === formKey
          )
          if (stepId) skippedSteps.push(stepId)
        }
      })

      // Determine current step based on progress
      if (apiProgress.currentStep !== undefined) {
        const stepIds = Object.keys(STEP_TO_DATA_KEY)
        currentStep = stepIds[apiProgress.currentStep] || 'welcome'
      }

      return {
        version: STORAGE_VERSION,
        formData,
        currentStep,
        completedSteps,
        skippedSteps,
        lastSavedAt: apiProgress.updatedAt,
        source: 'api',
      }
    } catch (error) {
      console.error('Failed to load from API:', error)
      return null
    }
  }, [])

  /**
   * Save progress (debounced API + immediate localStorage)
   */
  const saveProgress = useCallback(async (stepId: string, data: Record<string, any>) => {
    const dataKey = STEP_TO_DATA_KEY[stepId]
    if (!dataKey) return

    // Update state immediately
    setFormData(prev => ({
      ...prev,
      [dataKey]: {
        ...prev[dataKey],
        ...data,
      },
    }))
    setCurrentStepId(stepId)

    // Save to localStorage immediately
    const progress: SavedProgress = {
      version: STORAGE_VERSION,
      formData: {
        ...formData,
        [dataKey]: {
          ...formData[dataKey],
          ...data,
        },
      },
      currentStep: stepId,
      completedSteps,
      skippedSteps,
      lastSavedAt: new Date().toISOString(),
      source: 'localStorage',
    }
    saveToLocalStorage(progress)

    // Debounce API save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    pendingSaveRef.current = { stepId, data }

    saveTimeoutRef.current = setTimeout(async () => {
      if (pendingSaveRef.current) {
        await saveToAPI(pendingSaveRef.current.stepId, pendingSaveRef.current.data)
        pendingSaveRef.current = null
      }
    }, API_DEBOUNCE_MS)
  }, [formData, completedSteps, skippedSteps, saveToLocalStorage, saveToAPI])

  /**
   * Load saved progress with conflict resolution
   */
  const loadProgress = useCallback(async (): Promise<Partial<OnboardingFormData>> => {
    try {
      // Load from both sources
      const [apiProgress, localProgress] = await Promise.all([
        loadFromAPI(),
        Promise.resolve(loadFromLocalStorage()),
      ])

      // Conflict resolution: API wins if it's newer
      let selectedProgress: SavedProgress | null = null

      if (apiProgress && localProgress) {
        const apiDate = new Date(apiProgress.lastSavedAt)
        const localDate = new Date(localProgress.lastSavedAt)

        selectedProgress = apiDate > localDate ? apiProgress : localProgress

        // If we're using local data but API exists, sync to API
        if (selectedProgress.source === 'localStorage') {
          console.log('Using localStorage data (newer than API)')
        }
      } else {
        selectedProgress = apiProgress || localProgress
      }

      if (selectedProgress) {
        setFormData(selectedProgress.formData)
        setCurrentStepId(selectedProgress.currentStep)
        setCompletedSteps(selectedProgress.completedSteps)
        setSkippedSteps(selectedProgress.skippedSteps)
        setLastSavedAt(new Date(selectedProgress.lastSavedAt))
        setCanResume(true)

        return selectedProgress.formData
      }

      setCanResume(false)
      return {}
    } catch (error) {
      console.error('Failed to load progress:', error)
      toast({
        title: 'Error Loading Progress',
        description: 'Failed to load your saved progress. Starting fresh.',
        variant: 'destructive',
      })
      return {}
    }
  }, [loadFromAPI, loadFromLocalStorage, toast])

  /**
   * Clear all saved progress
   */
  const clearProgress = useCallback(() => {
    // Clear state
    setFormData({})
    setCurrentStepId('welcome')
    setCompletedSteps([])
    setSkippedSteps([])
    setLastSavedAt(null)
    setCanResume(false)
    setSaveError(null)

    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }

    // Note: We don't clear API data here as that should persist
    // until the user completes or explicitly resets onboarding
  }, [])

  /**
   * Load progress on mount
   */
  useEffect(() => {
    loadProgress()
  }, []) // Only run once on mount

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      // Flush any pending saves
      if (pendingSaveRef.current) {
        saveToAPI(pendingSaveRef.current.stepId, pendingSaveRef.current.data)
      }
    }
  }, [saveToAPI])

  // Get current step data
  const currentStepData = formData[STEP_TO_DATA_KEY[currentStepId] as keyof OnboardingFormData] || {}

  return {
    formData,
    currentStepData: currentStepData as Record<string, any>,
    saveProgress,
    loadProgress,
    clearProgress,
    canResume,
    lastSavedAt,
    isSaving,
    saveError,
  }
}
