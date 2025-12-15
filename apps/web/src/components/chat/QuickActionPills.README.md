# QuickActionPills - Contextual Quick Actions (S4-05)

## Overview

The `QuickActionPills` component provides context-aware quick action suggestions above the chat input. It automatically detects the current page/route and shows relevant actions based on the context.

## Features

- **Context-Aware**: Automatically shows relevant actions based on the current page
- **Route Detection**: Uses Next.js `usePathname()` to detect current route
- **Smooth Animations**: GSAP stagger animations when context changes
- **Multiple Context Types**: Supports 11 different page contexts
- **TypeScript**: Fully typed with proper interfaces
- **Responsive**: Touch-friendly with horizontal scroll on mobile
- **Accessible**: Proper ARIA labels and keyboard navigation

## Usage

### Basic Usage (Auto-detect from route)

```tsx
import { QuickActionPills } from '@/components/chat/QuickActionPills';

function ChatComponent() {
  const handleActionClick = (action: string) => {
    console.log('User clicked:', action);
    // Send to chat or execute action
  };

  return (
    <QuickActionPills onActionClick={handleActionClick} />
  );
}
```

The component will automatically detect the current route and show appropriate actions:
- On `/dashboard/invoices` → Shows invoice actions
- On `/dashboard/expenses` → Shows expense actions
- On `/dashboard/hr` → Shows HR actions
- etc.

### Explicit Context

```tsx
<QuickActionPills
  context="invoices"
  onActionClick={handleActionClick}
/>
```

### Custom Actions

```tsx
import { FileText, Send } from 'lucide-react';

const customActions = [
  { icon: FileText, label: 'Custom Action', action: 'Do something custom' },
  { icon: Send, label: 'Another Action', action: 'Do another thing' },
];

<QuickActionPills
  contextualActions={customActions}
  onActionClick={handleActionClick}
/>
```

## Available Contexts

### 1. Invoices
- Create Invoice
- Send Reminders
- Revenue Report
- Overdue Invoices

### 2. Expenses
- Add Expense
- Categorize All
- Tax Deductions
- Expense Report

### 3. HR
- Run Payroll
- Request Leave
- Hire Employee
- Approve Leave

### 4. Banking
- Account Balance
- Recent Transactions
- Cash Flow
- Reconcile

### 5. Dashboard
- Daily Summary
- Pending Tasks
- Quick Insights
- Today's Agenda

### 6. Tax
- Tax Liability
- File Return
- Deductions
- Deadlines

### 7. Vendors
- All Vendors
- Pending Bills
- Pay Bills
- Add Vendor

### 8. Reports
- P&L Report
- Balance Sheet
- Cash Flow
- Export Reports

### 9. Documents
- Search Docs
- Recent Files
- Tax Documents
- Receipts

### 10. Chat
- Invoices
- Cash Flow
- Tax Summary
- Bank Summary

### 11. Default
- Create Invoice
- Cash Flow
- Tax Summary
- Email Insights
- Bank Summary

## Route Detection Logic

The component detects context from pathname:

```typescript
/dashboard/invoices → 'invoices'
/dashboard/expenses → 'expenses'
/dashboard/finance → 'expenses'
/dashboard/hr → 'hr'
/dashboard/banking → 'banking'
/dashboard/tax → 'tax'
/dashboard/vendors → 'vendors'
/dashboard/reports → 'reports'
/dashboard/documents → 'documents'
/dashboard/chat → 'chat'
/dashboard → 'dashboard'
/ → 'dashboard'
(other) → 'default'
```

## Props

```typescript
interface QuickActionPillsProps {
  // Callback when user clicks an action
  onActionClick: (action: string) => void;

  // Custom actions (highest priority)
  contextualActions?: QuickAction[];

  // Explicit context (overrides auto-detection)
  context?: QuickActionContext;

  // Additional CSS classes
  className?: string;
}

interface QuickAction {
  icon: LucideIcon;
  label: string;
  action: string;
}

type QuickActionContext =
  | 'invoices'
  | 'expenses'
  | 'hr'
  | 'dashboard'
  | 'banking'
  | 'tax'
  | 'vendors'
  | 'reports'
  | 'documents'
  | 'chat'
  | 'default';
```

## Priority Order

The component determines which actions to show in this order:

1. **contextualActions** prop (highest priority)
2. **context** prop
3. Auto-detected context from route (lowest priority)

## Animation

The component uses GSAP for smooth stagger animations:

- **On Mount**: Pills fade in with a stagger effect
- **On Context Change**: Pills re-animate when context changes
- **Animation Details**:
  - Duration: 0.35s
  - Stagger: 0.06s between each pill
  - Easing: `back.out(1.4)` for a subtle bounce
  - Effects: opacity (0 → 1), scale (0.85 → 1), y position (8px → 0)

## Responsive Design

### Desktop
- Horizontal scroll with subtle scrollbar
- Hover effects (scale 1.05)
- Focus ring for keyboard navigation

### Mobile
- Native horizontal scroll with snap
- Touch-friendly min height (44px)
- No visible scrollbar
- Snap-to-pill scrolling

## Accessibility

- Proper ARIA labels on all buttons
- Keyboard navigation support
- Focus visible indicators
- Semantic button elements

## Examples

### Example 1: Basic Integration

```tsx
import { QuickActionPills } from '@/components/chat/QuickActionPills';
import { ChatInput } from '@/components/chat/ChatInput';

function ChatInterface() {
  const [inputValue, setInputValue] = useState('');

  const handleActionClick = (action: string) => {
    // Pre-fill the chat input
    setInputValue(action);
  };

  const handleSend = (message: string) => {
    // Send to API
  };

  return (
    <div>
      <QuickActionPills onActionClick={handleActionClick} />
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
      />
    </div>
  );
}
```

### Example 2: With ChatInput Integration

The component integrates seamlessly with `ChatInput`:

```tsx
<ChatInput
  onSend={handleSend}
  showQuickActions={true}
  // quickActions prop is optional - auto-detects if not provided
/>
```

## Testing

Run tests with:

```bash
npm test QuickActionPills.test.tsx
```

Tests cover:
- Default actions rendering
- All context types
- Click handlers
- Priority order
- ARIA labels
- Responsive rendering

## Files

- `QuickActionPills.tsx` - Main component
- `QuickActionPills.test.tsx` - Unit tests
- `QuickActionPills.example.tsx` - Conversation-based example
- `QuickActionPills.README.md` - This documentation

## Implementation Details

### Key Functions

#### `detectContextFromRoute(pathname)`
Detects the context from the current pathname.

```typescript
function detectContextFromRoute(pathname: string | null): QuickActionContext {
  if (!pathname) return 'default';
  const path = pathname.replace(/^\//, '').toLowerCase();
  // ... mapping logic
  return context;
}
```

#### Animation Hook
```typescript
useLayoutEffect(() => {
  // GSAP animation setup
  // Re-runs when actions change
}, [actions]);
```

### Context Actions Map
All context-specific actions are defined in the `contextActions` object:

```typescript
const contextActions: Record<QuickActionContext, QuickAction[]> = {
  invoices: [...],
  expenses: [...],
  // ... etc
};
```

## Performance

- Uses `useLayoutEffect` to prevent flash of unstyled content
- GSAP context cleanup prevents memory leaks
- Efficient re-renders only when actions change

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled
- CSS Grid and Flexbox support

## Future Enhancements

Potential improvements for future versions:

1. **Smart Context Detection**: Analyze page content/state for better context
2. **User Preferences**: Remember frequently used actions
3. **Action Analytics**: Track which actions are most popular
4. **Keyboard Shortcuts**: Arrow key navigation between pills
5. **Voice Activation**: "Show me invoice actions"
6. **Custom Icons**: Allow custom icon sets
7. **Themes**: Support different visual styles

## Contributing

When adding new contexts:

1. Add to `QuickActionContext` type
2. Add actions to `contextActions` map
3. Add route detection logic to `detectContextFromRoute()`
4. Update this README
5. Add tests
6. Update demo components

## License

Part of the Operate project.

## Task Reference

Sprint 4, Task 5 (S4-05): Contextual Quick Actions
- File: `apps/web/src/components/chat/QuickActionPills.tsx`
- Objective: Make quick action pills dynamic based on current page/context
- Status: Completed
