# ProactiveSuggestions Component

The `ProactiveSuggestions` component displays AI-generated suggestions from the backend chatbot API. It features type-based icons, priority indicators, GSAP animations, and actions for executing or dismissing suggestions.

## Features

- ✅ Fetches suggestions from `/chatbot/suggestions` API endpoint
- ✅ Type-based icons and color-coded styling
- ✅ Priority level indicators (LOW, MEDIUM, HIGH, URGENT)
- ✅ GSAP stagger animation on appear
- ✅ Execute and dismiss actions
- ✅ Loading, error, and empty states
- ✅ Auto-refresh support
- ✅ Optimistic UI updates
- ✅ Responsive design

## Installation

The component is ready to use. All dependencies are already installed:

- `gsap` - For animations
- `lucide-react` - For icons
- `@/lib/api/chat` - For API calls

## Basic Usage

```tsx
import { ProactiveSuggestions } from '@/components/chat/ProactiveSuggestions';

export function MyPage() {
  return (
    <ProactiveSuggestions
      context="dashboard"
      limit={5}
      onExecute={(id) => console.log('Execute:', id)}
      onDismiss={(id) => console.log('Dismiss:', id)}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `context` | `string` | `undefined` | Page context to filter suggestions (e.g., 'finance.invoices') |
| `limit` | `number` | `5` | Maximum number of suggestions to display |
| `className` | `string` | `undefined` | Custom CSS classes for the container |
| `onExecute` | `(id: string) => void` | `undefined` | Callback when a suggestion is executed |
| `onDismiss` | `(id: string) => void` | `undefined` | Callback when a suggestion is dismissed |

## Suggestion Types

The component supports the following suggestion types with specific icons and colors:

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `INVOICE_REMINDER` | FileText | Blue | Overdue or upcoming invoices |
| `TAX_DEADLINE` | Calculator | Orange | Tax filing deadlines |
| `EXPENSE_ANOMALY` | AlertTriangle | Red | Unusual expense patterns |
| `CASH_FLOW` | TrendingUp | Green | Cash flow alerts and predictions |
| `CLIENT_FOLLOWUP` | Users | Purple | Client follow-up reminders |
| `COMPLIANCE` | Receipt | Yellow | Compliance requirements |
| `OPTIMIZATION` | TrendingUp | Indigo | Business optimization tips |
| `INSIGHT` | TrendingUp | Teal | Financial insights |

## Priority Levels

Suggestions are categorized by priority:

- **URGENT** - Red badge, highest priority
- **HIGH** - Orange badge, high priority
- **MEDIUM** - Yellow badge, medium priority
- **LOW** - Gray badge, low priority

## API Integration

The component uses the `useSuggestions` hook which calls:

### GET `/chatbot/suggestions`

**Query Parameters:**
- `context` (optional) - Filter suggestions by context

**Response:**
```typescript
{
  suggestions: [
    {
      id: string;
      title: string;
      description: string;
      actionLabel?: string;
      type: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      entityType?: string;
      entityId?: string;
      actionType?: string;
      actionParams?: Record<string, any>;
      data?: Record<string, any>;
      createdAt: Date;
      expiresAt?: Date;
      confidence?: number;
    }
  ]
}
```

### POST `/chatbot/actions/:id/confirm`

**Request Body:**
```typescript
{
  messageId?: string;
  params?: Record<string, any>;
}
```

### POST `/chatbot/actions/:id/cancel`

**Request Body:**
```typescript
{
  reason?: string;
}
```

## useSuggestions Hook

The `useSuggestions` hook manages fetching and updating suggestions:

```typescript
import { useSuggestions } from '@/hooks/useSuggestions';

const {
  suggestions,       // Array of suggestions
  isLoading,         // Loading state
  error,             // Error message
  executeSuggestion, // Execute a suggestion
  dismissSuggestion, // Dismiss a suggestion
  refresh,           // Manually refresh suggestions
} = useSuggestions({
  context: 'dashboard',
  limit: 10,
  refreshInterval: 60000, // Auto-refresh every minute (0 to disable)
});
```

## GSAP Animations

The component uses GSAP for smooth animations:

### Appear Animation
When suggestions load, they animate in with a stagger effect:
```typescript
gsap.fromTo(
  cards,
  { opacity: 0, y: 30, scale: 0.95 },
  { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' }
);
```

### Dismiss Animation
When dismissed, suggestions slide out:
```typescript
gsap.to(card, {
  opacity: 0,
  x: 50,
  duration: 0.3,
  ease: 'power2.in',
});
```

## Design Tokens

The component uses CSS variables from the design system:

```css
.suggestion-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border-left: 4px solid var(--color-primary);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base);
}

.suggestion-card:hover {
  box-shadow: var(--shadow-md);
}
```

## States

### Loading State
Displays animated skeleton loaders:
```tsx
<div className="h-24 bg-gray-100 animate-pulse rounded-lg" />
```

### Error State
Shows error message with retry button:
```tsx
<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
  <h3>Failed to load suggestions</h3>
  <button onClick={refresh}>Retry</button>
</div>
```

### Empty State
Displays when no suggestions are available:
```tsx
<div className="p-6 text-center bg-gray-50 rounded-lg">
  <h3>All caught up!</h3>
  <p>No suggestions at the moment.</p>
</div>
```

## Examples

See `ProactiveSuggestions.example.tsx` for comprehensive integration examples including:

1. Dashboard Integration
2. Finance Page Integration
3. Chat Sidebar Integration
4. Auto-Refresh Integration
5. Tax Filing Page Integration
6. Mobile Integration
7. Empty State Handling
8. Error Handling
9. Custom Styling
10. Chat Interface Integration

## Integration Checklist

- [ ] Import the component
- [ ] Add to your page layout
- [ ] Set appropriate `context` for filtering
- [ ] Set `limit` based on available space
- [ ] Implement `onExecute` handler
- [ ] Implement `onDismiss` handler
- [ ] Test loading states
- [ ] Test error states
- [ ] Test empty states
- [ ] Verify animations work smoothly
- [ ] Test on mobile devices

## Troubleshooting

### Suggestions not loading
1. Check API endpoint is accessible: `/api/v1/chatbot/suggestions`
2. Verify authentication cookies are set
3. Check browser console for errors
4. Try the `refresh()` function manually

### Animations not working
1. Ensure GSAP is properly installed: `pnpm list gsap`
2. Check for JavaScript errors in console
3. Verify `useEffect` dependencies are correct

### Styling issues
1. Ensure Tailwind CSS is configured
2. Check that design system CSS variables are loaded
3. Verify `cn()` utility function is working

## Backend Requirements

The backend API should:

1. Implement `GET /chatbot/suggestions` endpoint
2. Support optional `context` query parameter
3. Return suggestions in the specified format
4. Implement `POST /chatbot/actions/:id/confirm` for executing suggestions
5. Implement `POST /chatbot/actions/:id/cancel` for dismissing suggestions

## Future Enhancements

Potential improvements:

- [ ] Keyboard navigation support
- [ ] Suggestion categories/grouping
- [ ] Undo dismissed suggestions
- [ ] Snooze functionality
- [ ] Suggestion analytics
- [ ] Sound effects on actions
- [ ] Drag-to-dismiss gesture
- [ ] Smart ordering by priority and context

## Related Components

- `SuggestionCard.tsx` - Individual suggestion card (alternative)
- `ChatSuggestions.tsx` - Chat-specific suggestions
- `LiveSuggestionPanel.tsx` - Real-time suggestion panel
- `DeadlineReminder.tsx` - Deadline-specific reminders

## Support

For issues or questions:
1. Check this documentation
2. Review example implementations
3. Check the Sprint 10 task documentation
4. Contact the frontend team
