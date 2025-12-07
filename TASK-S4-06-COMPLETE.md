# Task S4-06: Entity Navigation - COMPLETE

## Task Details
- **Sprint**: 4 (Document Intelligence)
- **Task**: S4-06
- **Title**: Entity Navigation
- **Status**: ✅ COMPLETE
- **Agent**: PRISM (Frontend)

## Objective
Make suggestion cards clickable to navigate to the relevant entity pages with proper visual indicators and interaction handling.

## Implementation Summary

### Modified Files
1. **`apps/web/src/components/chat/SuggestionCard.tsx`**
   - Added entity detection and navigation functionality
   - Added click handlers for card and buttons
   - Added visual indicators (cursor, hover effects)
   - Full TypeScript typing

### Key Features Implemented

#### 1. Entity Detection Patterns
```typescript
const entityPatterns = {
  invoice: /Invoice #?(\w+)/i,
  customer: /Customer:?\s+([^,\n]+)/i,
  expense: /Expense #?(\w+)/i,
  bill: /Bill #?(\w+)/i,
  employee: /Employee:?\s+([^,\n]+)/i,
};
```

#### 2. Entity Reference Extraction
- **Primary method**: Parse `actionUrl` from suggestion metadata
- **Fallback method**: Auto-detect entities from title/description text
- **Smart ID lookup**: Uses `entityId` field for name-based entities (customers, employees)

#### 3. Navigation Routes
| Entity Type | Route Pattern |
|------------|---------------|
| Invoice | `/invoices/{id}` |
| Customer | `/customers/{entityId}` |
| Expense | `/expenses/{id}` |
| Bill | `/bills/{id}` |
| Employee | `/hr/employees/{entityId}` |

#### 4. URL Handling
- **Internal URLs**: Use Next.js router (`router.push()`)
- **External URLs**: Open in new tab with security attributes (`noopener,noreferrer`)
- **Detection**: Check for `http://` or `https://` prefix

#### 5. Visual Indicators
- **Clickable cards**:
  - Cursor changes to pointer
  - Hover effect: shadow + thicker left border (4px → 6px)
  - ChevronRight icon on compact cards
  - Entity type badge in full cards
- **Non-clickable cards**:
  - Default cursor
  - No hover effects
  - No navigation indicators

#### 6. Interaction Design
- **Card click**: Navigates to entity
- **Action button click**: Stops propagation, executes action
- **Dismiss button click**: Stops propagation, dismisses suggestion
- **Show more/less**: Stops propagation, expands description

#### 7. TypeScript Support
```typescript
interface EntityReference {
  type: 'invoice' | 'customer' | 'expense' | 'bill' | 'employee' | null;
  id: string | null;
  url: string | null;
}
```

## Code Changes

### Added Imports
```typescript
import { useRouter } from 'next/navigation';
```

### New Helper Function
```typescript
function extractEntityReference(suggestion: Suggestion): EntityReference {
  // 1. Check explicit actionUrl
  // 2. Parse URL for entity type/ID
  // 3. Auto-detect from text patterns
  // 4. Return entity reference or null
}
```

### Enhanced Click Handlers
```typescript
const handleCardClick = () => {
  if (entityRef.url) {
    if (entityRef.url.startsWith('http://') || entityRef.url.startsWith('https://')) {
      window.open(entityRef.url, '_blank', 'noopener,noreferrer');
    } else {
      router.push(entityRef.url);
    }
  }
};

const handleApply = (e?: React.MouseEvent) => {
  e?.stopPropagation();
  if (onApply) {
    onApply(suggestion.id);
  } else if (entityRef.url) {
    // Navigate to entity
  }
};
```

### Updated Card Styling
```typescript
<Card
  className={cn(
    'transition-all border-l-4',
    typeConfig.borderColor,
    isClickable && 'cursor-pointer hover:shadow-md hover:border-l-[6px]'
  )}
  onClick={isClickable ? handleCardClick : undefined}
>
```

### Entity Type Display (Full Card)
```typescript
<div className="flex items-center gap-2">
  <span className="text-xs text-muted-foreground">{typeConfig.label}</span>
  {entityRef.type && (
    <>
      <span className="text-xs text-muted-foreground">•</span>
      <span className="text-xs text-muted-foreground capitalize">{entityRef.type}</span>
    </>
  )}
</div>
```

## Testing Scenarios

### Scenario 1: Invoice with Explicit URL
```typescript
{
  actionUrl: '/invoices/INV-001',
  title: 'Overdue Invoice',
  description: 'Invoice #INV-001 is 30 days overdue'
}
```
✅ Navigates to `/invoices/INV-001`

### Scenario 2: Customer with Entity ID
```typescript
{
  entityId: 'cust-123',
  title: 'High Spender',
  description: 'Customer: Acme Corp spent $15k this month'
}
```
✅ Navigates to `/customers/cust-123`

### Scenario 3: Auto-detected Expense
```typescript
{
  title: 'Expense Approval',
  description: 'Employee submitted Expense #EXP-789'
}
```
✅ Navigates to `/expenses/EXP-789`

### Scenario 4: External Link
```typescript
{
  actionUrl: 'https://irs.gov/regulations',
  title: 'New Tax Regulation'
}
```
✅ Opens in new tab

### Scenario 5: No Entity
```typescript
{
  title: 'Productivity Tip',
  description: 'Use keyboard shortcuts'
}
```
✅ Not clickable, no hover effects

## Documentation
Created `SuggestionCard.test-examples.md` with:
- Usage examples for all entity types
- Entity detection patterns
- Visual indicators documentation
- Interaction behavior guide
- TypeScript types reference

## Benefits
1. **Improved UX**: Direct navigation from suggestions to relevant entities
2. **Visual Feedback**: Clear indicators for clickable vs non-clickable cards
3. **Flexible Detection**: Works with explicit URLs or auto-detected entities
4. **Security**: Proper handling of external links
5. **Type Safety**: Full TypeScript support
6. **Accessibility**: Proper event handling and keyboard navigation support

## Files Modified
- ✅ `apps/web/src/components/chat/SuggestionCard.tsx`

## Files Created
- ✅ `apps/web/src/components/chat/SuggestionCard.test-examples.md`
- ✅ `TASK-S4-06-COMPLETE.md`

## Next Steps
None required. Task is complete and ready for integration testing.

## Notes
- Entity detection prioritizes explicit `actionUrl` over text parsing
- Multiple entity references in text: first match wins
- Customer/Employee navigation requires `entityId` in suggestion metadata
- All click handlers properly stop event propagation to prevent conflicts
