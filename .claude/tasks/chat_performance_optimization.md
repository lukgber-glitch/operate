# Chat Performance Optimization Task

**Agent**: PRISM (Frontend Specialist)
**Priority**: High
**Type**: Performance Optimization

## Objective

Add React performance optimizations (memoization) to Chat components WITHOUT changing any business logic, API calls, or component structure.

## Critical Rules

1. **PRESERVE ALL FUNCTIONALITY** - Do not change any logic
2. **ONLY ADD MEMOIZATION** - React.memo wrappers and useMemo hooks
3. **NO LOGIC CHANGES** - Keep all business logic, API calls, animations identical
4. **NO STRUCTURE CHANGES** - Keep component structure as-is

## Files to Optimize

### 1. apps/web/src/app/(dashboard)/chat/page.tsx
**Tasks:**
- Add useMemo for expensive calculations
- Look for array operations (filter, map, reduce) that run on every render
- Memoize derived data

### 2. apps/web/src/components/chat/ChatMessage.tsx
**Tasks:**
- Add React.memo wrapper if not already present
- Memoize any expensive calculations within the component
- Add useMemo for data transformations

### 3. apps/web/src/components/chat/InsightsWidget.tsx
**Tasks:**
- Add React.memo wrapper
- Memoize insight calculations
- Add useMemo for any data transformations
- Preserve all existing functionality

### 4. apps/web/src/components/chat/TransactionInsight.tsx
**Tasks:**
- Add React.memo wrapper
- Memoize calculations
- Keep all logic intact

### 5. apps/web/src/components/chat/SuggestionCard.tsx
**Tasks:**
- Add React.memo wrapper
- Memoize any derived data

### 6. apps/web/src/components/chat/ChatBubble.tsx
**Tasks:**
- Add React.memo wrapper if not present
- Memoize calculations

## Key Areas to Memoize

- Message filtering/sorting operations
- Insight calculations
- Any reduce/filter operations on arrays
- Derived state computations
- Formatted data transformations

## What NOT to Change

❌ Business logic
❌ API calls
❌ Animation logic
❌ Component structure
❌ Props interfaces
❌ Event handlers (unless wrapping with useCallback)
❌ State management

## Expected Outcome

Each file should have:
- React.memo wrapper (where applicable)
- useMemo hooks for expensive calculations
- useCallback for event handlers passed to child components (optional, if beneficial)
- All existing functionality preserved exactly as-is

## Verification

Before completing:
1. Read each file first to understand current implementation
2. Add only memoization wrappers and hooks
3. Verify no logic was changed
4. Ensure all existing functionality still works
