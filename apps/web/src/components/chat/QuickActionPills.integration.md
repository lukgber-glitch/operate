# QuickActionPills Integration Guide

## Overview

The QuickActionPills component provides contextual action suggestions above the chat input, enhancing the user experience by offering quick access to common actions based on the conversation state.

## Features

- **Contextual Actions**: Changes based on conversation topic
- **Default Actions**: Displays common actions when no context available
- **GSAP Animations**: Smooth stagger animation on appear
- **Responsive Design**: Horizontal scroll with native feel on mobile
- **Design System Compliance**: Uses CSS custom properties
- **Touch-Friendly**: 44px minimum touch targets on mobile

## Basic Usage

### 1. Import the Component

```typescript
import { QuickActionPills, type QuickAction } from '@/components/chat/QuickActionPills';
```

### 2. Define Actions

```typescript
import { FileText, TrendingUp, Calculator, Mail, Building2 } from 'lucide-react';

// Default actions (will be used if no contextual actions provided)
const defaultActions = [
  { icon: FileText, label: 'Create invoice', action: 'Create a new invoice for...' },
  { icon: TrendingUp, label: 'Cash flow', action: 'Show my cash flow forecast' },
  { icon: Calculator, label: 'Tax summary', action: 'What is my current tax liability?' },
  { icon: Mail, label: 'Email insights', action: 'Summarize my recent business emails' },
  { icon: Building2, label: 'Bank summary', action: 'Show my bank account summary' },
];

// Contextual actions (for specific conversation states)
const invoiceActions = [
  { icon: CheckCircle, label: 'Mark as paid', action: 'Mark invoice INV-001 as paid' },
  { icon: Mail, label: 'Send reminder', action: 'Send payment reminder for INV-001' },
  { icon: Download, label: 'Download PDF', action: 'Download invoice INV-001 as PDF' },
];
```

### 3. Handle Action Clicks

```typescript
const handleActionClick = (action: string) => {
  // Fill the chat input with the action text
  setInputValue(action);

  // Optionally auto-focus the input
  inputRef.current?.focus();
};
```

### 4. Use in ChatInput

The QuickActionPills component is already integrated into ChatInput:

```typescript
<ChatInput
  onSend={handleSend}
  showQuickActions={true}
  quickActions={contextualActions}
  // ... other props
/>
```

## Integration with ChatInterface

### Example: Dynamic Contextual Actions

```typescript
// In ChatInterface.tsx
import { QuickAction } from '@/components/chat/QuickActionPills';

function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Determine contextual actions based on conversation state
  const getContextualActions = (): QuickAction[] | undefined => {
    const lastMessage = messages[messages.length - 1];

    // After invoice response
    if (lastMessage?.metadata?.topic === 'invoice') {
      return [
        { icon: CheckCircle, label: 'Mark as paid', action: 'Mark invoice INV-001 as paid' },
        { icon: Mail, label: 'Send reminder', action: 'Send payment reminder for INV-001' },
        { icon: Download, label: 'Download PDF', action: 'Download invoice INV-001 as PDF' },
        { icon: ArrowRight, label: 'Next invoice', action: 'Show next unpaid invoice' },
      ];
    }

    // After cash flow response
    if (lastMessage?.metadata?.topic === 'cashflow') {
      return [
        { icon: TrendingUp, label: 'Next month', action: 'Show cash flow forecast for next month' },
        { icon: AlertCircle, label: 'Low balance alerts', action: 'Show upcoming low balance alerts' },
        { icon: FileText, label: 'Export report', action: 'Export cash flow report as CSV' },
      ];
    }

    // Return undefined to use default actions
    return undefined;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <ScrollArea className="flex-1">
        {/* ... messages ... */}
      </ScrollArea>

      {/* Fixed input with quick actions */}
      <div className="border-t">
        <ChatInput
          onSend={handleSendMessage}
          showQuickActions={true}
          quickActions={getContextualActions()}
        />
      </div>
    </div>
  );
}
```

## Advanced Usage

### Conditional Display

```typescript
// Show quick actions only when there are messages
<ChatInput
  showQuickActions={messages.length === 0 || hasContextualActions}
  quickActions={getContextualActions()}
/>
```

### Custom Styling

```typescript
<QuickActionPills
  onActionClick={handleActionClick}
  contextualActions={actions}
  className="border-b shadow-sm" // Custom wrapper styles
/>
```

### With Animation Callbacks

The component uses GSAP for animations. You can add custom animation logic by wrapping the component:

```typescript
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

function CustomQuickActions() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Add custom animations here
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.4,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef}>
      <QuickActionPills {...props} />
    </div>
  );
}
```

## Design System Tokens Used

The component uses the following CSS custom properties:

```css
/* Colors */
--color-accent-light: Background color
--color-primary-dark: Text color
--color-secondary-light: Hover background
--color-surface: Container background
--color-border: Border color

/* Typography */
--font-size-sm: Text size (14px)

/* Spacing */
--space-2: Icon-label gap (8px)

/* Border Radius */
--radius-full: Pill shape (9999px)

/* Shadows */
--shadow-sm: Hover shadow
--shadow-focus: Focus ring

/* Transitions */
--transition-fast: Hover/active transitions (150ms)
```

## Accessibility

- **Keyboard Navigation**: All pills are focusable buttons
- **Screen Readers**: Each pill has an `aria-label` describing the action
- **Touch Targets**: Minimum 44px height on mobile for touch-friendly interaction
- **Focus Indicators**: Visible focus ring using design system tokens

## Performance

- **GSAP Context**: Animations are properly cleaned up to prevent memory leaks
- **Conditional Rendering**: Component returns null when no actions available
- **Optimized Scroll**: Native scroll on mobile, minimal JavaScript overhead

## Testing

See `QuickActionPills.example.tsx` for a complete demonstration including:
- Default actions display
- Contextual actions based on conversation
- Animation behavior
- Responsive design
- Integration with ChatInput

## Common Patterns

### Pattern 1: Topic-based Actions

```typescript
const getTopicActions = (topic: string): QuickAction[] | undefined => {
  const actionMap: Record<string, QuickAction[]> = {
    invoice: [...],
    cashflow: [...],
    tax: [...],
    bank: [...],
  };

  return actionMap[topic];
};
```

### Pattern 2: Entity-based Actions

```typescript
const getEntityActions = (entity: any): QuickAction[] => {
  if (entity.type === 'invoice' && entity.status === 'unpaid') {
    return [
      { icon: CheckCircle, label: 'Mark as paid', action: `Mark ${entity.id} as paid` },
      // ...
    ];
  }

  return [];
};
```

### Pattern 3: Time-based Actions

```typescript
const getTimeBasedActions = (): QuickAction[] => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return [
      { icon: Mail, label: 'Morning review', action: 'Show overnight activity' },
      // ...
    ];
  }

  // ... evening actions
};
```

## Migration from Existing Components

If you have existing quick action implementations, here's how to migrate:

### Before (custom implementation)

```typescript
<div className="flex gap-2 overflow-x-auto">
  {actions.map(action => (
    <button onClick={() => handleClick(action.text)}>
      {action.label}
    </button>
  ))}
</div>
```

### After (QuickActionPills)

```typescript
<QuickActionPills
  onActionClick={handleClick}
  contextualActions={actions.map(a => ({
    icon: a.icon,
    label: a.label,
    action: a.text,
  }))}
/>
```

## Troubleshooting

### Actions not appearing

1. Check that `showQuickActions={true}` is set on ChatInput
2. Verify that either `quickActions` prop is provided or defaults will be used
3. Ensure GSAP is installed: `npm install gsap`

### Animations not working

1. Verify GSAP is installed and imported correctly
2. Check that `.quick-action-pill` class is present on rendered elements
3. Ensure component is mounted (animations run on mount)

### Styling issues

1. Verify CSS custom properties are defined in globals.css
2. Check that design system tokens are loaded
3. Use browser DevTools to inspect applied styles

## Future Enhancements

Potential improvements for future iterations:

1. **AI-powered suggestions**: Use LLM to generate contextual actions
2. **User preferences**: Remember frequently used actions
3. **Keyboard shortcuts**: Add hotkeys for quick actions
4. **Swipe gestures**: Mobile swipe to reveal more actions
5. **Analytics**: Track which actions are most used
