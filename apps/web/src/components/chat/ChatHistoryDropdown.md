# ChatHistoryDropdown Component

A minimal, professional dropdown component for conversation history management. Designed to sit at the top of a chat container, providing quick access to past conversations with smooth animations.

## Features

- **Dropdown Interface**: Click to expand/collapse conversation history
- **Conversation Grouping**: Automatically groups by date (Today, Yesterday, This Week, Older)
- **Rich Metadata**: Shows conversation title, timestamp (relative format), and message count
- **New Conversation**: Dedicated button to start fresh
- **GSAP Animations**: Smooth slide-down with staggered item animations
- **Accessibility**: Keyboard navigable, ARIA attributes, respects reduced motion
- **Responsive**: Full width on mobile, max-width on desktop
- **Brand Integration**: Uses Operate brand colors (#06BF9D, #048A71, #48D9BE)
- **Design Tokens**: Consistent with design system (16px border radius, etc.)

## Usage

```tsx
import { ChatHistoryDropdown } from '@/components/chat';

function ChatPage() {
  const [sessionId, setSessionId] = useState<string>();

  return (
    <div className="container p-4">
      {/* Dropdown at the top */}
      <ChatHistoryDropdown
        currentSessionId={sessionId}
        onSelectSession={setSessionId}
        onNewSession={() => setSessionId(undefined)}
      />

      {/* Chat messages below */}
      <ChatMessages sessionId={sessionId} />
    </div>
  );
}
```

## Props

```typescript
interface ChatHistoryDropdownProps {
  currentSessionId?: string;      // Currently active session
  onSelectSession: (id: string) => void;  // Callback when selecting a session
  onNewSession: () => void;        // Callback for new conversation
  className?: string;              // Additional CSS classes
}
```

## Visual Design

```
┌───────────────────────────────────────┐
│  💬 Current Conversation Title  ▼    │  ← Trigger button
│                                       │
│  When expanded:                       │
│  ┌─────────────────────────────────┐ │
│  │  + New conversation              │ │  ← Action button
│  │  ─────────────────────────────  │ │
│  │  TODAY                           │ │  ← Group label
│  │  💬 Tax questions                │ │
│  │     🕐 2h ago • 5 messages        │ │  ← Metadata
│  │                                  │ │
│  │  YESTERDAY                       │ │
│  │  💬 Invoice help                 │ │
│  │     🕐 Yesterday • 12 messages   │ │
│  │                                  │ │
│  │  THIS WEEK                       │ │
│  │  💬 Cash flow review             │ │
│  │     🕐 3d ago • 8 messages        │ │
│  └─────────────────────────────────┘ │
└───────────────────────────────────────┘
```

## Integration with Existing Hooks

The component automatically integrates with the existing conversation history system:

- Uses `useConversationHistory` hook for data
- Syncs with localStorage for offline support
- Can be configured for API sync with backend
- Groups conversations by date automatically
- Handles relative time formatting ("2h ago", "Yesterday")

## API Integration

Works with the existing backend API:
- `GET /api/v1/chatbot/conversations` - List conversations
- `POST /api/v1/chatbot/conversations` - Create new
- `DELETE /api/v1/chatbot/conversations/:id` - Delete conversation

## Animations

### Opening Dropdown
- Slide down from trigger (y: -10 → 0)
- Fade in (opacity: 0 → 1)
- Slight scale effect (scaleY: 0.95 → 1)
- Duration: 200ms with power2.out easing

### Item Stagger
- Fade in + slide right (x: -10 → 0)
- 30ms stagger between items
- 250ms duration per item
- Respects `prefers-reduced-motion`

### Closing
- Fade out + slide up
- Duration: 150ms with power2.in easing

## Styling

Uses design system tokens:
- `--color-primary`: #06BF9D (primary green)
- `--color-surface`: #FCFEFE (background)
- `--color-border`: #E5E7EB (borders)
- `--radius-xl`: 16px (trigger button)
- `--radius-lg`: 12px (items and dropdown)
- `--shadow-lg`: Dropdown shadow
- `--font-size-xs`: 12px (metadata)
- `--font-size-sm`: 14px (titles)

## Mobile Optimization

- Full width on mobile (< 768px)
- Max-width on desktop (448px)
- Touch-friendly tap targets (40px+ height)
- Scrollable list with max-height (400px)

## Accessibility

- Semantic HTML (button, div with proper roles)
- ARIA attributes (`aria-expanded`, `aria-haspopup`)
- Keyboard navigation (Tab, Enter, Escape)
- Focus management
- Respects reduced motion preferences
- Screen reader friendly labels

## Testing

Test page available at `/test-chat-dropdown` for development.

Example usage in demo:
```tsx
import ChatHistoryDropdownExample from '@/components/chat/ChatHistoryDropdown.example';
```

## Difference from ChatHistory

| Feature | ChatHistory | ChatHistoryDropdown |
|---------|-------------|---------------------|
| Layout | Full sidebar | Compact dropdown |
| Position | Left side | Top of container |
| Mobile | Sheet/Drawer | Dropdown |
| Search | Yes | No (focused on recent) |
| Delete | Yes | No (lightweight) |
| Best for | Desktop app | Mobile-first chat |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- React 18+
- GSAP 3.12+
- @radix-ui/react-scroll-area
- lucide-react (icons)
- tailwindcss

## Related Components

- `ChatHistory` - Full sidebar with search and delete
- `ChatHistoryButton` - Trigger button for ChatHistory
- `ConversationItem` - Individual conversation list item
- `useConversationHistory` - Data management hook

## Future Enhancements

Potential improvements:
- Pinned conversations
- Conversation search
- Quick actions (rename, delete)
- Conversation tags/labels
- Export conversation
- Keyboard shortcuts (Cmd+K to open)
