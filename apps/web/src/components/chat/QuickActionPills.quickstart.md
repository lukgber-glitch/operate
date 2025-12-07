# QuickActionPills - Quick Start Guide

Get up and running with QuickActionPills in 5 minutes.

## Step 1: Import the Component

```typescript
import { QuickActionPills, type QuickAction } from '@/components/chat/QuickActionPills';
```

## Step 2: Use with ChatInput (Simplest)

The component is already integrated with ChatInput. Just enable it:

```typescript
<ChatInput
  onSend={handleSend}
  showQuickActions={true}  // ← Enable quick actions (default: true)
/>
```

**Result**: Default actions will appear (Create invoice, Cash flow, Tax summary, etc.)

## Step 3: Add Contextual Actions (Optional)

Define custom actions based on your app state:

```typescript
import { CheckCircle, Mail, Download } from 'lucide-react';

const contextualActions: QuickAction[] = [
  {
    icon: CheckCircle,
    label: 'Mark as paid',
    action: 'Mark invoice INV-001 as paid'
  },
  {
    icon: Mail,
    label: 'Send reminder',
    action: 'Send payment reminder for INV-001'
  },
  {
    icon: Download,
    label: 'Download PDF',
    action: 'Download invoice INV-001 as PDF'
  },
];

<ChatInput
  onSend={handleSend}
  showQuickActions={true}
  quickActions={contextualActions}  // ← Pass custom actions
/>
```

## Step 4: Dynamic Actions (Advanced)

Update actions based on conversation state:

```typescript
function MyChat() {
  const [messages, setMessages] = useState([]);

  const getContextualActions = () => {
    const lastMessage = messages[messages.length - 1];

    // Show invoice actions after invoice-related message
    if (lastMessage?.includes('invoice')) {
      return [
        { icon: CheckCircle, label: 'Mark paid', action: 'Mark as paid' },
        { icon: Mail, label: 'Send reminder', action: 'Send reminder' },
      ];
    }

    // Return undefined to use defaults
    return undefined;
  };

  return (
    <ChatInput
      onSend={handleSend}
      quickActions={getContextualActions()}
    />
  );
}
```

## That's It!

You now have contextual quick actions in your chat interface.

## Common Patterns

### Pattern 1: Hide Actions Conditionally

```typescript
<ChatInput
  showQuickActions={messages.length === 0}  // Only show when empty
/>
```

### Pattern 2: Topic-Based Actions

```typescript
const actionsByTopic = {
  invoice: [
    { icon: CheckCircle, label: 'Mark paid', action: '...' },
  ],
  tax: [
    { icon: Calculator, label: 'Estimate', action: '...' },
  ],
};

const currentActions = actionsByTopic[currentTopic];
```

### Pattern 3: Entity-Based Actions

```typescript
const getActionsForEntity = (entity) => {
  if (entity.type === 'invoice' && entity.status === 'unpaid') {
    return [
      { icon: CheckCircle, label: 'Mark paid', action: `Mark ${entity.id} as paid` },
    ];
  }
  return [];
};
```

## Customization

### Custom Styling

```typescript
<QuickActionPills
  className="border-b shadow-lg"  // Add custom classes
  onActionClick={handleClick}
  contextualActions={actions}
/>
```

### Disable Quick Actions

```typescript
<ChatInput
  showQuickActions={false}  // Hide completely
/>
```

## Next Steps

- See **QuickActionPills.example.tsx** for a full working demo
- Read **QuickActionPills.integration.md** for advanced patterns
- Check **QUICK_ACTION_PILLS_SUMMARY.md** for complete API reference

## Need Help?

- Check the example file: `QuickActionPills.example.tsx`
- Read integration guide: `QuickActionPills.integration.md`
- See completion report: `S10-06_COMPLETION_REPORT.md`
