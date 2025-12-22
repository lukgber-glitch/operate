# Critical Bug Fix Plan

## Why These Problems Persisted for 3 Days

### Testing Gaps
1. **OAuth blocks automation** - Browser tests can't complete Google OAuth login
2. **Code review without verification** - Changes made based on assumptions, not actual testing
3. **Race conditions invisible to tests** - Timing issues only appear in real user flows
4. **Context loss** - Conversation resets lose knowledge of actual bugs

### Root Cause Analysis

## Bug 1: AI Consent Not Persisting from Onboarding

**File:** `apps/web/src/components/onboarding/steps/CompletionStep.tsx`

**THE ACTUAL BUG:** Lines 141-145 - `handleNavigate` function
```tsx
const handleNavigate = (e: React.MouseEvent, href: string) => {
  e.preventDefault()
  e.stopPropagation()
  router.push(href)  // <-- NEVER SAVES CONSENT!
}
```

**What happens:**
1. User completes onboarding with AI consent checked
2. CompletionStep shows 4 "Quick Actions" cards (Start with AI Chat, Create Invoice, etc.)
3. If user clicks ANY card, `handleNavigate` runs - consent is NEVER saved
4. Only clicking "Go to Dashboard" button saves consent (handleGoToDashboard)
5. User arrives at chat page without consent saved → dialog appears

**FIX:** Save consent in `handleNavigate` before ANY navigation

---

## Bug 2: Chat Page Race Condition

**File:** `apps/web/src/app/(dashboard)/chat/page.tsx`

**Issue:** Lines 143-170 check localStorage AFTER checking hook state
```tsx
useEffect(() => {
  if (!consentLoading && needsConsent && !showConsentDialog) {
    // localStorage check happens here - but hook state already says needsConsent
```

**The problem:**
- `useAIConsent` hook loads async from localStorage
- By the time localStorage check runs, dialog may already be shown
- The "fix" added a localStorage check, but it only SKIPS showing dialog
- It doesn't UPDATE the hook state, so `hasConsent` stays false

**FIX:** Ensure hook properly initializes from localStorage synchronously

---

## Bug 3: Dialog Positioning/Overflow

**Files:**
- `apps/web/src/components/ui/dialog.tsx`
- `apps/web/src/components/consent/AIConsentDialog.tsx`

**Current state:**
- Dialog.tsx line 54-56: `fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]`
- AIConsentDialog: `max-h-[85vh] sm:max-h-[80vh]` with `overflow: visible`

**Potential issues:**
1. Viewport height calculation may be wrong on mobile
2. `overflow: visible` on content but ScrollArea may still clip
3. The dialog container max-height conflicts with content height

---

## Implementation Plan

### Step 1: Fix CompletionStep - Save consent on ALL navigations

```tsx
// BEFORE (broken)
const handleNavigate = (e: React.MouseEvent, href: string) => {
  router.push(href)
}

// AFTER (fixed)
const handleNavigate = async (e: React.MouseEvent, href: string) => {
  e.preventDefault()
  e.stopPropagation()

  // Save AI consent BEFORE any navigation
  if (aiConsentGiven && !hasConsent) {
    await giveConsent()
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  router.push(href)
}
```

### Step 2: Fix useAIConsent hook - Sync initialization

Add synchronous localStorage check in initial state:

```tsx
const [consentData, setConsentData] = useState<AIConsentData | null>(() => {
  // Synchronous initial load from localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as AIConsentData;
      } catch {
        return null;
      }
    }
  }
  return null;
});
```

### Step 3: Simplify chat page consent check

Remove complex timing logic, trust the hook:

```tsx
useEffect(() => {
  if (!consentLoading && needsConsent) {
    setShowConsentDialog(true);
  }
}, [consentLoading, needsConsent]);
```

### Step 4: Fix dialog sizing

```tsx
// Ensure dialog never exceeds viewport
className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full max-h-[calc(100vh-4rem)] overflow-auto"
```

---

## Verification Plan

After implementing fixes:

1. **Clear all test data**
   - Clear localStorage
   - Clear cookies
   - Log out completely

2. **Fresh onboarding flow**
   - Create new account or reset onboarding
   - Go through onboarding with AI consent CHECKED
   - Click one of the card links (NOT the main button)
   - Verify: No consent dialog on chat page

3. **Test dialog positioning**
   - If dialog shows, verify it's centered
   - Verify all buttons visible
   - Verify can scroll content if needed
   - Verify can close dialog

4. **Test all pages**
   - Run through every sidebar link
   - Verify no pages broken
   - Verify sidebar always accessible

---

## Files to Modify

1. `apps/web/src/components/onboarding/steps/CompletionStep.tsx` - Fix handleNavigate
2. `apps/web/src/hooks/useAIConsent.ts` - Sync initialization
3. `apps/web/src/app/(dashboard)/chat/page.tsx` - Simplify consent check
4. `apps/web/src/components/consent/AIConsentDialog.tsx` - Fix sizing
