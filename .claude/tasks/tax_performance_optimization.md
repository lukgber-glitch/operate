# Tax Page Performance Optimization Task

**Agent**: PRISM
**Priority**: Medium
**Estimated Time**: 30 minutes

## Objective

Add React memoization to tax-related pages and components to improve performance.

**CRITICAL**: Preserve ALL existing functionality - only add memoization, do not change any business logic, API calls, or component structure.

## Files to Optimize

### 1. apps/web/src/app/(dashboard)/tax/page.tsx

**Current Issue**: Lines ~176-179 have expensive filter/reduce operations without memoization

**Action Required**:
- Wrap deduction calculations in useMemo
- Add dependency arrays correctly

**Example Pattern**:
```tsx
// Before
const totalDeductions = deductions?.filter(d => d.status === 'approved')
  .reduce((sum, d) => sum + d.amount, 0) || 0;

// After
const totalDeductions = useMemo(() =>
  deductions?.filter(d => d.status === 'approved')
    .reduce((sum, d) => sum + d.amount, 0) || 0,
  [deductions]
);
```

### 2. apps/web/src/components/tax/TaxBreakdownCard.tsx

**Action Required**:
- Wrap component with React.memo
- Add useMemo for any internal calculations
- Preserve all prop types

**Pattern**:
```tsx
import { memo } from 'react';

const TaxBreakdownCard = memo(({ ...props }) => {
  // component code
});
TaxBreakdownCard.displayName = 'TaxBreakdownCard';
export default TaxBreakdownCard;
```

### 3. apps/web/src/components/tax/TaxRateDisplay.tsx

**Action Required**:
- Wrap component with React.memo
- Preserve all prop types

### 4. apps/web/src/app/(dashboard)/tax/deductions/page.tsx

**Action Required**:
- Add useMemo for deduction filtering operations
- Add useMemo for totals calculations
- Check for any array operations that could benefit from memoization

### 5. apps/web/src/hooks/use-deductions.ts

**Action Required**:
- Review for any calculations that can be memoized within the hook
- Check if return values can benefit from useMemo

## Critical Requirements

1. ❌ **DO NOT** change any business logic
2. ❌ **DO NOT** modify API calls or data fetching
3. ❌ **DO NOT** change component interfaces or prop types
4. ❌ **DO NOT** alter tax calculation logic
5. ❌ **DO NOT** modify component structure or JSX flow
6. ✅ **ONLY** add memoization where it improves performance
7. ✅ **VERIFY** that all memoization dependency arrays are correct

## Implementation Checklist

- [ ] Read each file to understand current implementation
- [ ] Identify expensive calculations (filter, reduce, map chains)
- [ ] Add useMemo imports where needed
- [ ] Wrap calculations in useMemo with correct dependencies
- [ ] Add React.memo to pure components
- [ ] Verify TypeScript compiles without errors
- [ ] Ensure no functionality was changed

## Expected Outcome

- All expensive calculations wrapped in useMemo
- Pure components wrapped in React.memo
- No functionality broken
- No TypeScript errors
- All existing tests still pass
- Improved re-render performance

## Success Criteria

- [x] TypeScript compiles without errors
- [x] All calculations still work correctly
- [x] Dependency arrays include all required dependencies
- [x] No props or functionality removed
- [x] Components still render the same UI
- [x] No breaking changes to component APIs

## Notes

This is a pure optimization task - focus on performance improvements without changing any behavior. If you find any calculations that are unclear or might have side effects, ask before memoizing them.
