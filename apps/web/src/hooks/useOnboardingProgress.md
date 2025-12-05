# useOnboardingProgress Hook

## Overview

The `useOnboardingProgress` hook provides automatic persistence for the onboarding wizard, saving progress to both the API and localStorage. It handles conflict resolution, offline scenarios, and provides seamless resume functionality.

## Features

- **Dual Persistence**: Saves to API (debounced) and localStorage (immediate)
- **Auto-Resume**: Detects saved progress and allows users to continue
- **Conflict Resolution**: API wins when both sources exist with different timestamps
- **Offline Support**: Falls back to localStorage when API is unavailable
- **Debounced API Saves**: Reduces API calls while preserving all changes
- **Type-Safe**: Full TypeScript support with proper typing
- **Error Handling**: Graceful degradation with user-friendly error messages

## Installation

```typescript
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress'
```

## API Reference

### Return Values

```typescript
interface UseOnboardingProgressReturn {
  // Data
  formData: Partial<OnboardingFormData>           // All saved form data
  currentStepData: Record<string, any>            // Data for current step only

  // Methods
  saveProgress: (stepId: string, data: Record<string, any>) => Promise<void>
  loadProgress: () => Promise<Partial<OnboardingFormData>>
  clearProgress: () => void

  // Status
  canResume: boolean                              // Whether saved progress exists
  lastSavedAt: Date | null                        // Last save timestamp
  isSaving: boolean                               // Currently saving to API
  saveError: Error | null                         // API save error (if any)
}
```

### Methods

#### `saveProgress(stepId, data)`

Saves progress for a specific step. Immediately saves to localStorage and debounces API save (500ms).

**Parameters:**
- `stepId` (string): One of: 'welcome', 'company', 'banking', 'email', 'tax', 'accounting', 'preferences', 'completion'
- `data` (object): Step data to save

**Returns:** Promise<void>

**Example:**
```typescript
const { saveProgress } = useOnboardingProgress()

await saveProgress('company', {
  name: 'Acme Corp',
  country: 'DE',
  taxId: 'DE123456789'
})
```

#### `loadProgress()`

Loads saved progress from API and localStorage, resolving conflicts (API wins if newer).

**Returns:** Promise<Partial<OnboardingFormData>>

**Example:**
```typescript
const { loadProgress } = useOnboardingProgress()

useEffect(() => {
  const init = async () => {
    const savedData = await loadProgress()
    methods.reset(savedData)
  }
  init()
}, [])
```

#### `clearProgress()`

Clears all saved progress from state and localStorage (does not clear API).

**Returns:** void

**Example:**
```typescript
const { clearProgress } = useOnboardingProgress()

const handleStartOver = () => {
  clearProgress()
  methods.reset({})
}
```

## Usage Patterns

### Basic Integration

```typescript
function OnboardingWizard() {
  const {
    formData,
    saveProgress,
    loadProgress,
    canResume,
  } = useOnboardingProgress()

  const methods = useForm({
    defaultValues: formData
  })

  // Load on mount
  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  // Save on step change
  const handleNextStep = async (stepId: string) => {
    const data = methods.getValues()
    await saveProgress(stepId, data)
  }

  return <div>{/* wizard content */}</div>
}
```

### Resume Banner

```typescript
function OnboardingWithResume() {
  const { canResume, lastSavedAt, loadProgress, clearProgress } = useOnboardingProgress()

  if (canResume && lastSavedAt) {
    return (
      <div className="resume-banner">
        <p>Continue from {lastSavedAt.toLocaleDateString()}</p>
        <button onClick={loadProgress}>Resume</button>
        <button onClick={clearProgress}>Start Over</button>
      </div>
    )
  }

  return <div>{/* wizard */}</div>
}
```

### Auto-Save Integration

```typescript
function AutoSaveWizard() {
  const { saveProgress, isSaving } = useOnboardingProgress()
  const methods = useForm()
  const currentStep = 'company'

  // Auto-save on form change
  useEffect(() => {
    const subscription = methods.watch((value) => {
      saveProgress(currentStep, value)
    })
    return () => subscription.unsubscribe()
  }, [currentStep, methods, saveProgress])

  return (
    <div>
      {isSaving && <span>Saving...</span>}
      {/* form */}
    </div>
  )
}
```

### Offline Support

```typescript
function OfflineAwareWizard() {
  const { saveProgress, saveError, isSaving } = useOnboardingProgress()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))
  }, [])

  return (
    <div>
      {!isOnline && <div>Offline - saving locally</div>}
      {saveError && <div>⚠ Saved locally only</div>}
      {isSaving && isOnline && <div>Syncing...</div>}
    </div>
  )
}
```

## Step ID Mapping

The hook maps step IDs to form data keys and API endpoints:

| Step ID | Form Data Key | API Endpoint |
|---------|---------------|--------------|
| welcome | (none) | (none) |
| company | companyInfo | /api/v1/onboarding/step/company_info |
| banking | banking | /api/v1/onboarding/step/banking |
| email | email | /api/v1/onboarding/step/email |
| tax | tax | /api/v1/onboarding/step/tax |
| accounting | accounting | /api/v1/onboarding/step/accounting |
| preferences | preferences | /api/v1/onboarding/step/preferences |
| completion | (none) | /api/v1/onboarding/complete |

## Data Flow

```
┌─────────────────┐
│  User Input     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  saveProgress() │
└────┬────────┬───┘
     │        │
     │        └──────────────┐
     │                       │
     ▼                       ▼
┌──────────────┐    ┌────────────────┐
│ localStorage │    │  API (500ms    │
│  (immediate) │    │   debounced)   │
└──────────────┘    └────────────────┘
```

## Conflict Resolution

When loading progress, the hook checks both sources:

1. **API and localStorage both exist**: Use the one with newer `lastSavedAt`
2. **Only API exists**: Use API data
3. **Only localStorage exists**: Use localStorage data
4. **Neither exists**: Return empty object

```typescript
// Pseudocode
if (apiProgress && localProgress) {
  return apiProgress.lastSavedAt > localProgress.lastSavedAt
    ? apiProgress
    : localProgress
} else {
  return apiProgress || localProgress || {}
}
```

## Error Handling

The hook handles errors gracefully:

- **API Save Failure**: Saves to localStorage only, sets `saveError`
- **API Load Failure**: Falls back to localStorage
- **localStorage Failure**: Logs to console, continues without persistence
- **Invalid Step ID**: Logs warning, doesn't save

## Best Practices

### 1. Load Progress Early

```typescript
useEffect(() => {
  loadProgress()
}, []) // Run once on mount
```

### 2. Save Before Navigation

```typescript
const handleNextStep = async () => {
  const data = methods.getValues()
  await saveProgress(currentStepId, data)
  navigateToNextStep()
}
```

### 3. Show Save Status

```typescript
{isSaving && <div>Saving...</div>}
{!isSaving && lastSavedAt && (
  <div>Saved {lastSavedAt.toLocaleTimeString()}</div>
)}
```

### 4. Handle Offline

```typescript
{saveError && !navigator.onLine && (
  <div>Offline - saved locally</div>
)}
```

### 5. Clear on Complete

```typescript
const handleComplete = async () => {
  await submitOnboarding()
  clearProgress() // Clear after successful submission
}
```

## Performance Considerations

- **Debounced API Saves**: 500ms delay reduces API calls
- **Immediate localStorage**: No delay for local backup
- **Cleanup on Unmount**: Flushes pending saves
- **Minimal Re-renders**: Uses refs for debounce state

## Browser Compatibility

- **localStorage**: All modern browsers
- **fetch API**: All modern browsers
- **Debouncing**: Uses native setTimeout

## Testing

### Mock Hook for Tests

```typescript
jest.mock('@/hooks/useOnboardingProgress', () => ({
  useOnboardingProgress: () => ({
    formData: {},
    currentStepData: {},
    saveProgress: jest.fn(),
    loadProgress: jest.fn(),
    clearProgress: jest.fn(),
    canResume: false,
    lastSavedAt: null,
    isSaving: false,
    saveError: null,
  })
}))
```

### Test localStorage

```typescript
beforeEach(() => {
  localStorage.clear()
})

it('saves to localStorage', async () => {
  const { saveProgress } = renderHook(() => useOnboardingProgress())
  await saveProgress('company', { name: 'Test' })

  const saved = localStorage.getItem('operate_onboarding_progress')
  expect(saved).toBeTruthy()
})
```

## Troubleshooting

### Progress Not Loading

- Check browser console for errors
- Verify API endpoint is accessible
- Check localStorage quota

### Save Not Working

- Verify step ID is valid
- Check network tab for API errors
- Ensure user is authenticated

### Data Lost

- Check localStorage in DevTools
- Verify API response format
- Check for version mismatch

## Migration Guide

### From useOnboardingWizard

```typescript
// Before
const { submitOnboarding } = useOnboardingWizard({
  persistProgress: true
})

// After
const { saveProgress } = useOnboardingProgress()
const { submitOnboarding } = useOnboardingWizard({
  onStepChange: (step, data) => saveProgress(step, data)
})
```

## Related

- [OnboardingWizard Component](../components/onboarding/OnboardingWizard.tsx)
- [useOnboardingWizard Hook](../components/onboarding/hooks/useOnboardingWizard.ts)
- [Onboarding Types](../types/onboarding.ts)
- [Onboarding API](../../../api/src/modules/onboarding)
