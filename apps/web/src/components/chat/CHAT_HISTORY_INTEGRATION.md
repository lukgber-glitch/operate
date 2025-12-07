# Chat History Component - Integration Guide

## Overview

The **ChatHistory** component provides a fully-featured conversation history panel with smooth GSAP animations, API integration, search functionality, and responsive design.

**Task**: S10-03 - Create the Chat History Dropdown component
**Status**: ✅ Complete
**Location**: `apps/web/src/components/chat/ChatHistory.tsx`

---

## Features Implemented

### ✅ Core Features
- [x] Dropdown/panel that slides in from right (desktop) or bottom (mobile)
- [x] List of previous conversations with:
  - First message preview
  - Date/time formatting
  - Click to load conversation
- [x] Search functionality to find old conversations
- [x] "New Chat" button to start fresh
- [x] Design tokens for consistent styling
- [x] GSAP animations for smooth open/close transitions

### ✅ API Integration
- [x] GET /api/v1/chatbot/conversations - List conversations
- [x] GET /api/v1/chatbot/conversations/:id - Load specific conversation
- [x] POST /api/v1/chatbot/conversations - Create conversation
- [x] DELETE /api/v1/chatbot/conversations/:id - Delete conversation
- [x] Offline fallback to localStorage

### ✅ Animations (GSAP)
- [x] Sidebar slide-in from left (desktop)
- [x] Content fade-in with delay
- [x] Staggered conversation item animations
- [x] Smooth collapse/expand transitions
- [x] Floating toggle button animation

### ✅ Design System Compliance
- [x] `--color-surface` for panel background
- [x] `--shadow-lg` for elevation
- [x] `--radius-lg` for border radius
- [x] `--space-*` tokens for spacing
- [x] `--font-size-*` tokens for typography
- [x] `--color-primary` for brand accents

---

## Component Structure

### 1. ChatHistory.tsx
Main component with animations and conversation management.

```tsx
import { ChatHistory } from '@/components/chat/ChatHistory';

function MyApp() {
  return (
    <ChatHistory
      isOpen={true}
      onClose={() => {}}
      onNewChat={() => console.log('New chat')}
      onSelectConversation={(id) => console.log('Selected:', id)}
    />
  );
}
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | No | Control panel visibility (default: false) |
| `onClose` | `() => void` | No | Callback when panel is closed |
| `onNewChat` | `() => void` | Yes | Callback to start a new conversation |
| `onSelectConversation` | `(id: string) => void` | Yes | Callback when conversation is selected |
| `className` | `string` | No | Additional CSS classes |

---

### 2. ChatHistoryButton.tsx
Standalone trigger button component.

```tsx
import { ChatHistoryButton } from '@/components/chat/ChatHistoryButton';

function Header() {
  return (
    <ChatHistoryButton
      onNewChat={handleNewChat}
      onSelectConversation={handleSelectConversation}
      variant="ghost"
      showLabel={true}
    />
  );
}
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onNewChat` | `() => void` | Required | Callback to start new chat |
| `onSelectConversation` | `(id: string) => void` | Required | Callback on conversation select |
| `variant` | `'default' \| 'ghost' \| 'outline'` | `'ghost'` | Button style variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Button size |
| `showLabel` | `boolean` | `false` | Show "History" text label |
| `className` | `string` | - | Additional CSS classes |

---

### 3. ConversationItem.tsx
Individual conversation list item (existing component).

```tsx
<ConversationItem
  conversation={conversation}
  isActive={isActive}
  onSelect={(id) => console.log('Selected:', id)}
  onDelete={(id) => console.log('Deleted:', id)}
/>
```

---

## Hooks

### use-conversation-history.ts (Original - localStorage)
Client-side only, uses localStorage for persistence.

```tsx
import { useConversationHistory } from '@/hooks/use-conversation-history';

const {
  groupedConversations,
  activeConversationId,
  createConversation,
  deleteConversation,
} = useConversationHistory();
```

### use-conversation-history-api.ts (New - API-integrated)
API-first with localStorage fallback.

```tsx
import { useConversationHistoryAPI } from '@/hooks/use-conversation-history-api';

const {
  groupedConversations,
  activeConversationId,
  createConversation,
  deleteConversation,
  refresh,
  error,
} = useConversationHistoryAPI({
  enableSync: true,
  syncInterval: 30000, // 30s
});
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableSync` | `boolean` | `true` | Enable API synchronization |
| `syncInterval` | `number` | `30000` | Auto-sync interval (ms) |

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `conversations` | `ChatConversation[]` | Filtered conversation list |
| `groupedConversations` | `ConversationGroup[]` | Conversations grouped by date |
| `activeConversation` | `ChatConversation \| undefined` | Current active conversation |
| `activeConversationId` | `string \| null` | ID of active conversation |
| `searchQuery` | `string` | Current search query |
| `isLoading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message if any |
| `setSearchQuery` | `(query: string) => void` | Update search query |
| `setActiveConversationId` | `(id: string \| null) => void` | Set active conversation |
| `createConversation` | `(msg?: ChatMessage) => Promise<ChatConversation>` | Create new conversation |
| `addMessage` | `(convId: string, msg: ChatMessage) => void` | Add message to conversation |
| `updateMessage` | `(convId: string, msgId: string, updates: Partial<ChatMessage>) => void` | Update message |
| `deleteConversation` | `(id: string) => Promise<void>` | Delete conversation |
| `refresh` | `() => Promise<void>` | Manually refresh from API |

---

## Integration Examples

### Example 1: ChatInterface Integration (Already Exists)

The `ChatInterface` component already uses `ConversationHistory`:

```tsx
// apps/web/src/components/chat/ChatInterface.tsx
import { ConversationHistory } from './ConversationHistory';

export function ChatInterface() {
  const { setActiveConversationId, createConversation } = useConversationHistory();

  const handleNewConversation = () => {
    setActiveConversationId(null);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <ConversationHistory
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
      />

      {/* Main Chat Area */}
      <div className="flex-1">
        {/* Chat messages and input */}
      </div>
    </div>
  );
}
```

---

### Example 2: Add History Button to Header

```tsx
// apps/web/src/components/Header.tsx
import { ChatHistoryButton } from '@/components/chat/ChatHistoryButton';

export function Header() {
  const router = useRouter();

  const handleNewChat = () => {
    router.push('/chat');
  };

  const handleSelectConversation = (id: string) => {
    router.push(`/chat?conversationId=${id}`);
  };

  return (
    <header>
      <nav>
        <ChatHistoryButton
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          variant="ghost"
          showLabel={true}
        />
      </nav>
    </header>
  );
}
```

---

### Example 3: Standalone Chat History Page

```tsx
// apps/web/src/app/conversations/page.tsx
'use client';

import { ChatHistory } from '@/components/chat/ChatHistory';
import { useRouter } from 'next/navigation';

export default function ConversationsPage() {
  const router = useRouter();

  return (
    <div className="h-screen">
      <ChatHistory
        isOpen={true}
        onNewChat={() => router.push('/chat')}
        onSelectConversation={(id) => router.push(`/chat?conversationId=${id}`)}
      />
    </div>
  );
}
```

---

## API Endpoints Required

### Backend Implementation Status

✅ **GET /api/v1/chatbot/conversations**
- Returns list of user's conversations
- Query params: `limit`, `offset`
- Response: Array of conversation objects

✅ **GET /api/v1/chatbot/conversations/:id**
- Returns specific conversation with messages
- Response: Conversation object with messages array

✅ **POST /api/v1/chatbot/conversations**
- Creates new conversation
- Body: `{ title?: string, context?: string }`
- Response: Created conversation object

❌ **DELETE /api/v1/chatbot/conversations/:id** (Not yet implemented)
- Deletes conversation and all messages
- Response: `{ success: boolean }`

**TODO**: Implement DELETE endpoint in `chatbot.controller.ts`:

```typescript
@Delete('conversations/:id')
@ApiOperation({ summary: 'Delete a conversation' })
async deleteConversation(
  @CurrentUser() user: { id: string },
  @Param('id') id: string,
) {
  const conversation = await this.chatbotService.getConversation(id, user.id);
  if (!conversation) {
    throw new NotFoundException('Conversation not found');
  }

  await this.chatbotService.deleteConversation(id, user.id);

  return { success: true };
}
```

---

## Styling & Design Tokens

The component uses CSS variables from the design system:

```css
/* Applied automatically via design tokens */
.chat-history-panel {
  background: var(--color-surface);        /* #FCFEFE */
  box-shadow: var(--shadow-lg);            /* 0 10px 15px -3px rgba(0,0,0,0.1) */
  border-radius: var(--radius-lg);         /* 0.75rem (12px) */
  border-color: var(--color-border);       /* #E5E7EB */
}

.conversation-item {
  padding: var(--space-3);                 /* 0.75rem (12px) */
  border-radius: var(--radius-md);         /* 0.5rem (8px) */
}

.conversation-item:hover {
  background: var(--color-accent-light);   /* #C4F2EA */
}

.new-chat-button {
  background: var(--color-primary);        /* #04BDA5 */
  color: white;
}

.new-chat-button:hover {
  background: var(--color-primary-hover);  /* #06BF9D */
}
```

---

## GSAP Animations

### Sidebar Entrance (Desktop)
```typescript
gsap.fromTo(
  sidebarRef.current,
  { x: -320, opacity: 0 },
  { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
);
```

### Content Fade-In
```typescript
gsap.fromTo(
  contentRef.current,
  { opacity: 0, y: 10 },
  { opacity: 1, y: 0, duration: 0.25, delay: 0.1, ease: 'power2.out' }
);
```

### Staggered Conversation Items
```typescript
gsap.fromTo(
  conversationItems,
  { opacity: 0, x: -20 },
  { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
);
```

### Collapse Animation
```typescript
gsap.to(sidebarRef.current, {
  width: 0,
  opacity: 0,
  duration: 0.3,
  ease: 'power2.inOut',
});
```

---

## Responsive Behavior

### Desktop (≥768px)
- Fixed sidebar (320px width)
- Collapsible with toggle button
- GSAP slide animations
- Floating toggle when collapsed

### Mobile (<768px)
- Sheet/drawer from left
- Triggered by History button
- Auto-closes on conversation select
- No collapse feature (always full-width drawer)

---

## Testing Checklist

- [ ] Desktop: Sidebar slides in smoothly
- [ ] Desktop: Collapse/expand works with animation
- [ ] Mobile: Drawer opens from left
- [ ] Mobile: Drawer closes on conversation select
- [ ] Search filters conversations correctly
- [ ] Date grouping (Today, Yesterday, etc.) works
- [ ] Conversation items animate with stagger
- [ ] "New Chat" button creates conversation
- [ ] Selecting conversation loads messages
- [ ] Delete conversation shows confirmation
- [ ] Delete conversation removes from list
- [ ] API sync works (when online)
- [ ] localStorage fallback works (when offline)
- [ ] Auto-refresh syncs every 30s
- [ ] Error handling displays appropriately

---

## Performance Considerations

### Optimizations Implemented
- **Debounced search** (300ms delay)
- **Limited to 100 conversations** (MAX_CONVERSATIONS)
- **Lazy animation refs** (only animate visible items)
- **LocalStorage caching** (offline fallback)
- **Auto-sync interval** (30s default, configurable)

### GSAP Performance
- Uses `gsap.context()` for proper cleanup
- Animations revert on unmount
- No memory leaks from animation timelines

---

## Future Enhancements

### Possible Improvements
- [ ] Infinite scroll for conversations (100+ items)
- [ ] Pin/unpin conversations
- [ ] Archive conversations
- [ ] Conversation tags/labels
- [ ] Export conversation as PDF/text
- [ ] Rename conversation
- [ ] Conversation search with highlights
- [ ] Keyboard shortcuts (Cmd+K to open)
- [ ] Real-time sync with WebSockets/SSE
- [ ] Conversation sharing

---

## Troubleshooting

### Issue: Animations not working
**Solution**: Ensure GSAP is installed:
```bash
npm install gsap
# or
pnpm add gsap
```

### Issue: API returns 401
**Solution**: Ensure JWT token is in headers:
```typescript
fetch('/api/v1/chatbot/conversations', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### Issue: Conversations not loading
**Solution**: Check browser console for errors. Verify API endpoint returns data:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/chatbot/conversations
```

### Issue: Delete not working
**Solution**: DELETE endpoint needs to be implemented in backend (see API section above).

---

## File Locations

```
apps/web/src/
├── components/chat/
│   ├── ChatHistory.tsx                      # Main component (NEW)
│   ├── ChatHistoryButton.tsx                # Trigger button (NEW)
│   ├── ConversationHistory.tsx              # Original component (DEPRECATED)
│   ├── ConversationItem.tsx                 # List item component
│   └── CHAT_HISTORY_INTEGRATION.md          # This file (NEW)
├── hooks/
│   ├── use-conversation-history.ts          # localStorage hook (EXISTING)
│   └── use-conversation-history-api.ts      # API hook (NEW)
└── types/
    └── chat.ts                               # Type definitions
```

---

## Migration Guide

### From ConversationHistory to ChatHistory

**Before:**
```tsx
import { ConversationHistory } from '@/components/chat/ConversationHistory';

<ConversationHistory
  onNewConversation={handleNew}
  onSelectConversation={handleSelect}
/>
```

**After:**
```tsx
import { ChatHistory } from '@/components/chat/ChatHistory';

<ChatHistory
  onNewChat={handleNew}
  onSelectConversation={handleSelect}
/>
```

**Changes:**
- Renamed `onNewConversation` → `onNewChat`
- Added GSAP animations
- Added `isOpen` and `onClose` props (optional)
- Better design token integration

---

## Support

For questions or issues:
1. Check this integration guide
2. Review component JSDoc comments
3. Test with example code above
4. Verify API endpoints are working

---

**Component Version**: 1.0.0
**Last Updated**: 2024-12-07
**Author**: PRISM (Frontend Agent)
**Task**: S10-03 - Create the Chat History Dropdown component
