/**
 * Tests for useOnboardingProgress Hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useOnboardingProgress } from '../useOnboardingProgress'

// Mock fetch
global.fetch = jest.fn()

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe('useOnboardingProgress', () => {
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks()

    // Clear localStorage
    localStorage.clear()

    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useOnboardingProgress())

      expect(result.current.formData).toEqual({})
      expect(result.current.currentStepData).toEqual({})
      expect(result.current.canResume).toBe(false)
      expect(result.current.lastSavedAt).toBeNull()
      expect(result.current.isSaving).toBe(false)
      expect(result.current.saveError).toBeNull()
    })
  })

  describe('saveProgress', () => {
    it('should save to localStorage immediately', async () => {
      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.saveProgress('company', {
          name: 'Test Company',
          country: 'DE',
        })
      })

      const saved = localStorage.getItem('operate_onboarding_progress')
      expect(saved).toBeTruthy()

      const parsed = JSON.parse(saved!)
      expect(parsed.formData.companyInfo).toEqual({
        name: 'Test Company',
        country: 'DE',
      })
    })

    it('should debounce API saves', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ updatedAt: new Date().toISOString() }),
      })

      const { result } = renderHook(() => useOnboardingProgress())

      // Multiple saves in quick succession
      await act(async () => {
        await result.current.saveProgress('company', { name: 'Test 1' })
        await result.current.saveProgress('company', { name: 'Test 2' })
        await result.current.saveProgress('company', { name: 'Test 3' })
      })

      // Wait for debounce
      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledTimes(1)
        },
        { timeout: 1000 }
      )
    })

    it('should update formData state', async () => {
      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.saveProgress('company', {
          name: 'Test Company',
        })
      })

      expect(result.current.formData.companyInfo).toEqual({
        name: 'Test Company',
      })
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(
        new Error('API Error')
      )

      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.saveProgress('company', {
          name: 'Test Company',
        })
      })

      // Wait for debounced save
      await waitFor(
        () => {
          expect(result.current.saveError).toBeTruthy()
        },
        { timeout: 1000 }
      )

      // Should still save to localStorage
      const saved = localStorage.getItem('operate_onboarding_progress')
      expect(saved).toBeTruthy()
    })

    it('should save different steps correctly', async () => {
      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.saveProgress('company', {
          name: 'Test Company',
        })
      })

      await act(async () => {
        await result.current.saveProgress('banking', {
          provider: 'GOCARDLESS',
          connected: true,
        })
      })

      expect(result.current.formData.companyInfo).toEqual({
        name: 'Test Company',
      })
      expect(result.current.formData.banking).toEqual({
        provider: 'GOCARDLESS',
        connected: true,
      })
    })
  })

  describe('loadProgress', () => {
    it('should load from localStorage', async () => {
      const savedData = {
        version: '1.0',
        formData: {
          companyInfo: { name: 'Saved Company' },
        },
        currentStep: 'company',
        completedSteps: [],
        skippedSteps: [],
        lastSavedAt: new Date().toISOString(),
        source: 'localStorage',
      }

      localStorage.setItem(
        'operate_onboarding_progress',
        JSON.stringify(savedData)
      )

      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.loadProgress()
      })

      expect(result.current.formData.companyInfo).toEqual({
        name: 'Saved Company',
      })
      expect(result.current.canResume).toBe(true)
    })

    it('should load from API when available', async () => {
      const apiData = {
        id: '123',
        orgId: 'org-1',
        userId: 'user-1',
        currentStep: 1,
        totalSteps: 8,
        completionPercentage: 25,
        isCompleted: false,
        completedStepsCount: 2,
        skippedSteps: [],
        steps: [
          {
            name: 'company_info',
            status: 'COMPLETED',
            data: { name: 'API Company' },
          },
        ],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => apiData,
      })

      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.loadProgress()
      })

      expect(result.current.formData.companyInfo).toEqual({
        name: 'API Company',
      })
    })

    it('should prefer newer data in conflict resolution', async () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      // Local data is newer
      const localData = {
        version: '1.0',
        formData: {
          companyInfo: { name: 'Local Company' },
        },
        currentStep: 'company',
        completedSteps: [],
        skippedSteps: [],
        lastSavedAt: now.toISOString(),
        source: 'localStorage',
      }

      localStorage.setItem(
        'operate_onboarding_progress',
        JSON.stringify(localData)
      )

      // API data is older
      const apiData = {
        steps: [
          {
            name: 'company_info',
            status: 'COMPLETED',
            data: { name: 'API Company' },
          },
        ],
        updatedAt: oneHourAgo.toISOString(),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => apiData,
      })

      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.loadProgress()
      })

      // Should use local data (newer)
      expect(result.current.formData.companyInfo).toEqual({
        name: 'Local Company',
      })
    })

    it('should handle API 404 gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      })

      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        const loaded = await result.current.loadProgress()
        expect(loaded).toEqual({})
      })

      expect(result.current.canResume).toBe(false)
    })

    it('should clear old version data', async () => {
      const oldVersionData = {
        version: '0.9', // Old version
        formData: {
          companyInfo: { name: 'Old Company' },
        },
        currentStep: 'company',
        completedSteps: [],
        skippedSteps: [],
        lastSavedAt: new Date().toISOString(),
        source: 'localStorage',
      }

      localStorage.setItem(
        'operate_onboarding_progress',
        JSON.stringify(oldVersionData)
      )

      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.loadProgress()
      })

      // Should clear old data
      const saved = localStorage.getItem('operate_onboarding_progress')
      expect(saved).toBeNull()
      expect(result.current.formData).toEqual({})
    })
  })

  describe('clearProgress', () => {
    it('should clear all state', async () => {
      const { result } = renderHook(() => useOnboardingProgress())

      // Set some state
      await act(async () => {
        await result.current.saveProgress('company', {
          name: 'Test Company',
        })
      })

      expect(result.current.formData.companyInfo).toBeTruthy()

      // Clear
      await act(async () => {
        result.current.clearProgress()
      })

      expect(result.current.formData).toEqual({})
      expect(result.current.canResume).toBe(false)
      expect(result.current.lastSavedAt).toBeNull()
    })

    it('should clear localStorage', async () => {
      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.saveProgress('company', {
          name: 'Test Company',
        })
      })

      const savedBefore = localStorage.getItem('operate_onboarding_progress')
      expect(savedBefore).toBeTruthy()

      await act(async () => {
        result.current.clearProgress()
      })

      const savedAfter = localStorage.getItem('operate_onboarding_progress')
      expect(savedAfter).toBeNull()
    })
  })

  describe('Step Mapping', () => {
    it('should map step IDs to correct form data keys', async () => {
      const { result } = renderHook(() => useOnboardingProgress())

      const testCases = [
        { stepId: 'company', dataKey: 'companyInfo' },
        { stepId: 'banking', dataKey: 'banking' },
        { stepId: 'email', dataKey: 'email' },
        { stepId: 'tax', dataKey: 'tax' },
        { stepId: 'accounting', dataKey: 'accounting' },
        { stepId: 'preferences', dataKey: 'preferences' },
      ]

      for (const { stepId, dataKey } of testCases) {
        await act(async () => {
          await result.current.saveProgress(stepId, {
            test: `${stepId}-data`,
          })
        })

        expect(
          result.current.formData[dataKey as keyof typeof result.current.formData]
        ).toEqual({
          test: `${stepId}-data`,
        })
      }
    })

    it('should map to correct API endpoints', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ updatedAt: new Date().toISOString() }),
      })

      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.saveProgress('company', {
          name: 'Test',
        })
      })

      // Wait for debounced save
      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/v1/onboarding/step/company_info',
            expect.any(Object)
          )
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid step ID gracefully', async () => {
      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.saveProgress('invalid-step', {
          test: 'data',
        })
      })

      // Should not crash
      expect(result.current.formData).toEqual({})
    })

    it('should handle localStorage quota exceeded', async () => {
      const { result } = renderHook(() => useOnboardingProgress())

      // Mock localStorage to throw
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
      setItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      await act(async () => {
        await result.current.saveProgress('company', {
          name: 'Test',
        })
      })

      // Should not crash
      expect(result.current.formData.companyInfo).toEqual({
        name: 'Test',
      })

      setItemSpy.mockRestore()
    })

    it('should handle malformed localStorage data', async () => {
      localStorage.setItem('operate_onboarding_progress', 'invalid-json')

      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.loadProgress()
      })

      // Should not crash
      expect(result.current.formData).toEqual({})
    })

    it('should flush pending saves on unmount', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ updatedAt: new Date().toISOString() }),
      })

      const { result, unmount } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.saveProgress('company', {
          name: 'Test',
        })
      })

      // Unmount before debounce completes
      unmount()

      // Should still call API
      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalled()
        },
        { timeout: 100 }
      )
    })
  })

  describe('Integration', () => {
    it('should work with multiple sequential saves', async () => {
      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.saveProgress('company', {
          name: 'Company A',
        })
      })

      await act(async () => {
        await result.current.saveProgress('company', {
          ...result.current.formData.companyInfo,
          country: 'DE',
        })
      })

      await act(async () => {
        await result.current.saveProgress('banking', {
          provider: 'GOCARDLESS',
        })
      })

      expect(result.current.formData).toEqual({
        companyInfo: {
          name: 'Company A',
          country: 'DE',
        },
        banking: {
          provider: 'GOCARDLESS',
        },
      })
    })

    it('should maintain lastSavedAt correctly', async () => {
      const { result } = renderHook(() => useOnboardingProgress())

      await act(async () => {
        await result.current.saveProgress('company', {
          name: 'Test',
        })
      })

      const firstSave = result.current.lastSavedAt

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100))

      await act(async () => {
        await result.current.saveProgress('banking', {
          provider: 'TEST',
        })
      })

      const secondSave = result.current.lastSavedAt

      // Second save should be later or same
      expect(secondSave!.getTime()).toBeGreaterThanOrEqual(
        firstSave!.getTime()
      )
    })
  })
})
