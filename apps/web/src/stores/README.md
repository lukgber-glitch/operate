# Chat Store Documentation

## Overview

The Chat Store is a Zustand-based state management solution for the Operate chat interface. It provides:

- **Conversation Management**: Create, update, delete conversations
- **Message Handling**: Add, update, delete messages with optimistic updates
- **Pending Messages**: Track messages being sent with temporary IDs
- **AI Suggestions**: Manage proactive AI suggestions
- **UI State**: Loading, sending, typing indicators
- **Persistence**: LocalStorage backup with selective persistence

## Features

### ✅ Immer Middleware
- Immutable state updates with mutable syntax
- Prevents accidental state mutations
- Better developer experience

### ✅ Persist Middleware
- Automatic localStorage backup
- Only persists conversations and messages (not UI state)
- Version migration support

### ✅ Optimistic Updates
- Instant UI feedback with pending messages
- Automatic rollback on errors
- Temporary ID → Real ID mapping

### ✅ Typed Hooks
- Convenient selector hooks
- Full TypeScript support
- Optimized re-renders

## Installation

Zustand is already installed in the project (`zustand@^4.4.7`).

## Usage

### Basic Setup

```tsx
import { useChatStore, useChatActions } from '@/stores';

function ChatComponent() {
  const actions = useChatActions();

  // Use actions...
}
```

### Working with Conversations

```tsx
import { useActiveConversation, useChatActions } from '@/stores';

function ConversationList() {
  const conversations = useChatStore((state) => state.conversations);
  const { setActiveConversation, addConversation } = useChatActions();

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
  };

  const handleNewConversation = () => {
    const newConv: ChatConversation = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addConversation(newConv);
    setActiveConversation(newConv.id);
  };

  return (
    <div>
      <button onClick={handleNewConversation}>New Chat</button>
      {conversations.map((conv) => (
        <div key={conv.id} onClick={() => handleSelectConversation(conv.id)}>
          {conv.title}
        </div>
      ))}
    </div>
  );
}
```

### Sending Messages with Optimistic Updates

```tsx
import { useActiveMessages, useChatActions } from '@/stores';
import { useState } from 'react';

function ChatInput() {
  const [input, setInput] = useState('');
  const { addPendingMessage, confirmMessage, failMessage } = useChatActions();
  const activeConversationId = useChatStore((state) => state.activeConversationId);

  const handleSend = async () => {
    if (!input.trim() || !activeConversationId) return;

    // Create pending message
    const tempId = addPendingMessage({
      id: '', // Will be set by server
      conversationId: activeConversationId,
      role: 'user',
      content: input,
      timestamp: new Date(),
      status: 'sending',
    });

    setInput('');

    try {
      // Send to API
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId,
          content: input,
        }),
      });

      const realMessage = await response.json();

      // Confirm with real message
      confirmMessage(tempId, realMessage);
    } catch (error) {
      // Mark as failed
      failMessage(tempId, error.message);
    }
  };

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

### Displaying Messages

```tsx
import { useActiveMessages } from '@/stores';

function MessageList() {
  const messages = useActiveMessages(); // Includes pending messages

  return (
    <div>
      {messages.map((msg) => (
        <div
          key={'tempId' in msg ? msg.tempId : msg.id}
          className={msg.status === 'error' ? 'error' : ''}
        >
          <strong>{msg.role}:</strong> {msg.content}
          {msg.status === 'sending' && <span>Sending...</span>}
          {msg.status === 'error' && (
            <span>Failed: {msg.error}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Working with Suggestions

```tsx
import { useSuggestions, useChatActions } from '@/stores';

function SuggestionPanel() {
  const suggestions = useSuggestions();
  const { removeSuggestion } = useChatActions();

  return (
    <div>
      {suggestions.map((suggestion) => (
        <div key={suggestion.id}>
          <h4>{suggestion.title}</h4>
          <p>{suggestion.description}</p>
          <button onClick={() => removeSuggestion(suggestion.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
```

### UI State Management

```tsx
import { useChatUIState, useChatActions } from '@/stores';

function ChatInterface() {
  const { isLoading, isSending, isTyping, error } = useChatUIState();
  const { setTyping } = useChatActions();

  // Show typing indicator when AI is responding
  useEffect(() => {
    // Your SSE or WebSocket logic
    const handleAITyping = () => setTyping(true);
    const handleAIDone = () => setTyping(false);
  }, []);

  return (
    <div>
      {isLoading && <div>Loading conversations...</div>}
      {isSending && <div>Sending message...</div>}
      {isTyping && <div>AI is typing...</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### Hydrating from API

```tsx
import { useChatActions } from '@/stores';
import { useEffect } from 'react';

function ChatProvider({ children }) {
  const { hydrateConversations, setLoading } = useChatActions();

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/chat/conversations');
        const conversations = await response.json();
        hydrateConversations(conversations);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  return <>{children}</>;
}
```

## Store Structure

```typescript
{
  // State
  conversations: ChatConversation[];
  activeConversationId: string | null;
  messages: Record<string, ChatMessage[]>; // Indexed by conversationId
  pendingMessages: PendingMessage[];
  suggestions: Suggestion[];
  isLoading: boolean;
  isSending: boolean;
  isTyping: boolean;
  error: string | null;

  // Actions
  setActiveConversation(id);
  addConversation(conversation);
  updateConversation(id, updates);
  deleteConversation(id);
  clearConversation(id);

  addMessage(conversationId, message);
  updateMessage(conversationId, messageId, updates);
  deleteMessage(conversationId, messageId);

  addPendingMessage(message); // Returns tempId
  confirmMessage(tempId, realMessage);
  failMessage(tempId, error);
  removePendingMessage(tempId);

  setSuggestions(suggestions);
  addSuggestion(suggestion);
  removeSuggestion(id);
  clearSuggestions();

  setLoading(isLoading);
  setSending(isSending);
  setTyping(isTyping);
  setError(error);

  resetStore();
  hydrateConversations(conversations);

  // Selectors
  getActiveConversation();
  getActiveMessages();
  getConversation(id);
  getMessages(conversationId);
  getPendingMessagesForConversation(conversationId);
  hasConversations();
}
```

## Typed Hooks

### `useActiveConversation()`
Get the currently active conversation.

### `useActiveMessages()`
Get messages for active conversation (includes pending).

### `useConversation(id: string)`
Get a specific conversation by ID.

### `useMessages(conversationId: string)`
Get messages for a specific conversation.

### `useHasConversations()`
Check if any conversations exist.

### `useChatUIState()`
Get UI state (loading, sending, typing, error).

### `useSuggestions()`
Get current AI suggestions.

### `useChatActions()`
Get all store actions.

## Persistence

The store persists to localStorage with the key `operate-chat-storage`.

**Persisted:**
- Conversations
- Messages
- Active conversation ID

**Not persisted:**
- UI state (loading, sending, typing)
- Pending messages
- Suggestions
- Errors

To clear persisted state:
```typescript
localStorage.removeItem('operate-chat-storage');
```

## Performance Tips

1. **Use Selectors**: Only subscribe to needed state
   ```tsx
   // ❌ Bad - re-renders on any state change
   const store = useChatStore();

   // ✅ Good - only re-renders when conversations change
   const conversations = useChatStore(state => state.conversations);
   ```

2. **Use Typed Hooks**: Optimized selectors
   ```tsx
   // ✅ Best - optimized and typed
   const activeConversation = useActiveConversation();
   ```

3. **Batch Actions**: Use immer for multiple updates
   ```tsx
   const { addMessage, updateConversation } = useChatActions();
   // These will batch automatically
   ```

## Testing

```tsx
import { useChatStore } from '@/stores';

describe('ChatStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useChatStore.getState().resetStore();
  });

  it('should add a conversation', () => {
    const { addConversation } = useChatStore.getState();

    const conv: ChatConversation = {
      id: '1',
      title: 'Test',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addConversation(conv);

    expect(useChatStore.getState().conversations).toHaveLength(1);
  });
});
```

## Migration

If the store schema changes, update the version and add migration logic:

```typescript
migrate: (persistedState: any, version: number) => {
  if (version === 1) {
    // Migrate from v1 to v2
    return {
      ...persistedState,
      newField: 'default value',
    };
  }
  return persistedState;
}
```

## Troubleshooting

### "Cannot find module '@/types/chat'"
Make sure TypeScript paths are configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Persisted state not loading
Check localStorage in DevTools:
- Key: `operate-chat-storage`
- If corrupted, clear and reload

### Type errors with immer
Immer creates `WritableDraft<T>` types. Access properties directly:
```typescript
set((state) => {
  state.conversations.push(newConv); // ✅ Works
  state.conversations = [...state.conversations, newConv]; // ✅ Also works
});
```
