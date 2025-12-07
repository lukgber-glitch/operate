# QuickActionPills - Quick Reference (S4-05)

## TL;DR

Context-aware quick action pills that automatically show relevant suggestions based on the current page.

## Basic Usage

```tsx
<QuickActionPills onActionClick={(action) => console.log(action)} />
```

That's it! The component auto-detects context from the route.

## Route → Context Mapping

| Route | Context | Actions |
|-------|---------|---------|
| `/dashboard/invoices` | invoices | Create, Reminders, Revenue, Overdue |
| `/dashboard/expenses` | expenses | Add, Categorize, Deductions, Report |
| `/dashboard/hr` | hr | Payroll, Leave, Hire, Approve |
| `/dashboard/banking` | banking | Balance, Transactions, Flow, Reconcile |
| `/dashboard/tax` | tax | Liability, File, Deductions, Deadlines |
| `/dashboard/vendors` | vendors | All, Bills, Pay, Add |
| `/dashboard/reports` | reports | P&L, Balance, Flow, Export |
| `/dashboard/documents` | documents | Search, Recent, Tax Docs, Receipts |
| `/dashboard/chat` | chat | Invoices, Flow, Tax, Bank |
| `/dashboard` | dashboard | Summary, Tasks, Insights, Agenda |
| Other | default | Invoice, Flow, Tax, Email, Bank |

## Props

```typescript
onActionClick: (action: string) => void  // Required
contextualActions?: QuickAction[]        // Optional (custom actions)
context?: QuickActionContext             // Optional (force context)
className?: string                       // Optional (styling)
```

## Examples

### Auto-detect (Recommended)
```tsx
<QuickActionPills onActionClick={handleClick} />
```

### Force Context
```tsx
<QuickActionPills context="invoices" onActionClick={handleClick} />
```

### Custom Actions
```tsx
const custom = [
  { icon: Send, label: 'Email', action: 'Send email to...' }
];
<QuickActionPills contextualActions={custom} onActionClick={handleClick} />
```

## Animation

- **Stagger**: Pills animate in sequence (0.06s delay)
- **Duration**: 0.35s per pill
- **Effects**: Fade in + slide up + scale
- **Trigger**: On mount and context change

## Responsive

- **Desktop**: Scrollbar, hover effects, keyboard nav
- **Mobile**: Snap scroll, 44px min height, no scrollbar

## Files

- `QuickActionPills.tsx` - Component
- `QuickActionPills.README.md` - Full docs
- `QuickActionPills.test.tsx` - Tests
- `QuickActionPills.context-demo.tsx` - Demo
- `QuickActionPills.ARCHITECTURE.md` - Architecture

## Testing

```bash
npm test QuickActionPills.test.tsx
```

## Integration with ChatInput

```tsx
<ChatInput
  onSend={handleSend}
  showQuickActions={true}  // Enables pills
/>
```

## All Contexts

1. **invoices** - Invoice management
2. **expenses** - Expense tracking
3. **hr** - HR & payroll
4. **banking** - Bank accounts
5. **dashboard** - Overview
6. **tax** - Tax filing
7. **vendors** - Vendor management
8. **reports** - Financial reports
9. **documents** - Document management
10. **chat** - Chat interface
11. **default** - Fallback

## Priority Order

1. `contextualActions` prop (highest)
2. `context` prop
3. Auto-detected from route (lowest)

## Common Patterns

### Pre-fill chat input
```tsx
const handleActionClick = (action: string) => {
  setInputValue(action);
  inputRef.current?.focus();
};
```

### Send directly
```tsx
const handleActionClick = (action: string) => {
  sendMessage(action);
};
```

### Track analytics
```tsx
const handleActionClick = (action: string) => {
  analytics.track('quick_action_clicked', { action });
  setInputValue(action);
};
```

## Styling

Uses CSS variables from design system:
- `--color-accent-light` - Pill background
- `--color-primary-dark` - Text color
- `--radius-full` - Border radius
- `--font-size-sm` - Text size
- `--transition-fast` - Transitions

## Browser Support

✅ Chrome, Firefox, Safari, Edge
✅ iOS Safari, Chrome Mobile
❌ IE11 (not supported)

## Performance

- Only re-renders when actions change
- GSAP context cleanup prevents memory leaks
- Native scroll on mobile for best performance

## Accessibility

- ARIA labels on all buttons
- Keyboard navigation
- Focus indicators
- Semantic HTML

## TypeScript

Fully typed:
- `QuickAction` interface
- `QuickActionContext` type
- `QuickActionPillsProps` interface

## Common Issues

### Pills don't appear?
Check: Are actions empty? Component returns `null` if no actions.

### Wrong context detected?
Use explicit `context` prop to override auto-detection.

### Animation jittery?
Check: GSAP installed? `npm install gsap`

### Can't click on mobile?
Check: Min height 44px is set (touch-friendly).

## Tips

1. Let auto-detection work - don't force context unless needed
2. Keep action text short and clear
3. Use 4 actions per context for best UX
4. Test on mobile - scroll behavior is different

## Contributing

To add a new context:
1. Add to `QuickActionContext` type
2. Add to `contextActions` map (4 actions)
3. Add to `detectContextFromRoute()` function
4. Update docs
5. Add tests

## Questions?

See full documentation: `QuickActionPills.README.md`
