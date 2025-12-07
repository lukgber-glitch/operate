# SuggestionCard Entity Navigation - Examples

## Overview
The SuggestionCard component now supports automatic entity detection and navigation. When a suggestion references an entity (Invoice, Customer, Expense, Bill, or Employee), the card becomes clickable and navigates to the appropriate page.

## Entity Detection Methods

### 1. Explicit actionUrl (Preferred)
```typescript
const suggestion: Suggestion = {
  id: '1',
  type: 'WARNING',
  title: 'Overdue Invoice',
  description: 'Invoice #INV-001 is 30 days overdue',
  priority: 'HIGH',
  page: 'dashboard',
  actionUrl: '/invoices/INV-001',
  actionLabel: 'View Invoice',
  createdAt: new Date(),
};
```

### 2. Auto-detection from Text
The component will automatically detect entity references in the title or description:

```typescript
const suggestion: Suggestion = {
  id: '2',
  type: 'INSIGHT',
  title: 'High spending from Customer: Acme Corp',
  description: 'This customer has increased spending by 45% this month',
  priority: 'MEDIUM',
  page: 'dashboard',
  entityId: 'cust-123', // Used for customer/employee lookups
  createdAt: new Date(),
};
```

## Supported Entity Patterns

| Entity Type | Pattern | Example | Route |
|-------------|---------|---------|-------|
| Invoice | `Invoice #?(\w+)` | "Invoice #INV-001" | `/invoices/INV-001` |
| Customer | `Customer:?\s+([^,\n]+)` | "Customer: Acme Corp" | `/customers/{entityId}` |
| Expense | `Expense #?(\w+)` | "Expense #EXP-123" | `/expenses/EXP-123` |
| Bill | `Bill #?(\w+)` | "Bill #BILL-456" | `/bills/BILL-456` |
| Employee | `Employee:?\s+([^,\n]+)` | "Employee: John Doe" | `/hr/employees/{entityId}` |

## Visual Indicators

### Clickable Cards
- Cursor changes to pointer
- Hover effect: shadow and thicker left border (4px → 6px)
- ChevronRight icon appears on compact cards
- Entity type badge shown in full cards

### Non-clickable Cards
- Default cursor
- No special hover effects
- No navigation indicators

## Interaction Behavior

### Card Click
- Navigates to entity page (internal URLs use Next.js router)
- Opens external URLs in new tab with security attributes

### Action Button Click
- Stops propagation to prevent card click
- Executes custom onApply handler if provided
- Otherwise navigates to entity URL

### Dismiss Button Click
- Stops propagation to prevent card click
- Calls onDismiss handler

### Show More/Less Button
- Stops propagation to prevent card click
- Expands/collapses description

## Usage Examples

### Example 1: Invoice with Explicit URL
```tsx
<SuggestionCard
  suggestion={{
    id: '1',
    type: 'WARNING',
    title: 'Overdue Payment',
    description: 'Invoice #INV-001 is 30 days overdue. Customer: Acme Corp.',
    priority: 'URGENT',
    page: 'dashboard',
    actionUrl: '/invoices/INV-001',
    actionLabel: 'View & Send Reminder',
    createdAt: new Date(),
  }}
  onDismiss={(id) => console.log('Dismissed:', id)}
/>
```
Result: Card navigates to `/invoices/INV-001`. Shows "Invoice" badge.

### Example 2: Customer with EntityId
```tsx
<SuggestionCard
  suggestion={{
    id: '2',
    type: 'INSIGHT',
    title: 'Top Spender Alert',
    description: 'Customer: Acme Corp has spent $15,000 this month, 45% above average.',
    priority: 'MEDIUM',
    page: 'dashboard',
    entityId: 'cust-abc-123',
    createdAt: new Date(),
  }}
/>
```
Result: Card navigates to `/customers/cust-abc-123`. Shows "Customer" badge.

### Example 3: Multiple Entities (First Match Wins)
```tsx
<SuggestionCard
  suggestion={{
    id: '3',
    type: 'QUICK_ACTION',
    title: 'Expense Approval Needed',
    description: 'Employee: John Doe submitted Expense #EXP-789 for $500',
    priority: 'HIGH',
    page: 'dashboard',
    actionLabel: 'Review Expense',
    createdAt: new Date(),
  }}
/>
```
Result: Card navigates to `/expenses/789` (first match). Shows "Expense" badge.

### Example 4: External URL
```tsx
<SuggestionCard
  suggestion={{
    id: '4',
    type: 'TIP',
    title: 'New Tax Regulation',
    description: 'Review the latest tax filing guidelines for 2024',
    priority: 'LOW',
    page: 'dashboard',
    actionUrl: 'https://irs.gov/new-regulations',
    actionLabel: 'Learn More',
    createdAt: new Date(),
  }}
/>
```
Result: Card opens external URL in new tab.

### Example 5: Non-clickable Suggestion
```tsx
<SuggestionCard
  suggestion={{
    id: '5',
    type: 'TIP',
    title: 'Productivity Tip',
    description: 'Use keyboard shortcuts to navigate faster: Ctrl+K for search',
    priority: 'LOW',
    page: 'dashboard',
    createdAt: new Date(),
  }}
/>
```
Result: Card is not clickable (no cursor pointer, no hover effects).

## TypeScript Support

All entity detection and navigation is fully typed:

```typescript
interface EntityReference {
  type: 'invoice' | 'customer' | 'expense' | 'bill' | 'employee' | null;
  id: string | null;
  url: string | null;
}
```

## Accessibility

- Dismiss buttons have proper `aria-label` attributes
- Clickable cards maintain keyboard navigation (can be enhanced with onKeyPress)
- External links open with `noopener,noreferrer` for security
