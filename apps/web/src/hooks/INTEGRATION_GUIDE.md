# useSendMessage Integration Guide

Step-by-step guide for integrating the `useSendMessage` hook into your chat interface.

## Quick Start (5 minutes)

### Step 1: Import the Hook

```typescript
import { useSendMessage } from '@/hooks/useSendMessage';
import type { ChatMessage } from '@/types/chat';
```

### Step 2: Initialize in Your Component

```typescript
function ChatInterface({ conversationId }: { conversationId: string }) {
  const {
    sendMessage,
    pendingMessages,
    failedMessages,
    retryMessage,
    isSending,
  } = useSendMessage(conversationId);

  // Your existing messages from API
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  return (
    // ... your UI
  );
}
```

### Step 3: Connect to Input

```typescript
const handleSend = async (content: string) => {
  const message = await sendMessage(content);
  if (message) {
    // Message sent successfully
    setMessages((prev) => [...prev, message]);
  }
};

return (
  <input
    type="text"
    onKeyPress={(e) => {
      if (e.key === 'Enter') {
        handleSend(e.currentTarget.value);
        e.currentTarget.value = '';
      }
    }}
  />
);
```

### Step 4: Display Messages with Optimistic Updates

```typescript
// Combine regular and optimistic messages
const allMessages = [
  ...messages,
  ...pendingMessages,
  ...failedMessages,
].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

return (
  <div className="messages">
    {allMessages.map((msg) => (
      <div key={msg.id} className={`message ${msg.status}`}>
        {msg.content}
        {msg.status === 'error' && (
          <button onClick={() => retryMessage(msg.id)}>Retry</button>
        )}
      </div>
    ))}
  </div>
);
```

---

## Complete Integration

### Full Chat Component Example

```typescript
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useSendMessage } from '@/hooks/useSendMessage';
import type { ChatMessage } from '@/types/chat';

interface ChatInterfaceProps {
  conversationId: string;
  initialMessages?: ChatMessage[];
}

export function ChatInterface({ conversationId, initialMessages = [] }: ChatInterfaceProps) {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Optimistic message sending
  const {
    sendMessage,
    retryMessage,
    cancelMessage,
    pendingMessages,
    failedMessages,
    isSending,
    getAllOptimisticMessages,
  } = useSendMessage(conversationId, {
    onSuccess: (message) => {
      // Add to messages when confirmed by server
      setMessages((prev) => [...prev, message]);
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });

  // Combine all messages for display
  const allMessages = useMemo(() => {
    return [
      ...messages,
      ...getAllOptimisticMessages(),
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [messages, getAllOptimisticMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  // Handle send
  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const content = input;
    setInput(''); // Clear immediately

    await sendMessage(content);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-interface">
      {/* Messages */}
      <div className="messages-container">
        {allMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onRetry={msg.status === 'error' ? () => retryMessage(msg.id) : undefined}
            onCancel={msg.status === 'sending' ? () => cancelMessage(msg.id) : undefined}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Failed messages banner */}
      {failedMessages.length > 0 && (
        <div className="alert alert-error">
          {failedMessages.length} message(s) failed to send
        </div>
      )}

      {/* Input */}
      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={isSending}
          rows={1}
        />
        <button onClick={handleSend} disabled={!input.trim() || isSending}>
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

### Message Bubble Component

```typescript
interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
  onCancel?: () => void;
}

function MessageBubble({ message, onRetry, onCancel }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isPending = message.status === 'sending';
  const isFailed = message.status === 'error';

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-content">
        {message.content}

        {/* Attachments */}
        {message.metadata?.attachments && (
          <div className="attachments">
            {message.metadata.attachments.map((att) => (
              <div key={att.id} className="attachment">
                <FileIcon type={att.type} />
                <span>{att.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status indicators */}
      <div className="message-footer">
        <span className="timestamp">
          {message.timestamp.toLocaleTimeString()}
        </span>

        {isPending && (
          <div className="status">
            <Spinner size="sm" />
            <span>Sending...</span>
            {onCancel && (
              <button onClick={onCancel} className="btn-text">
                Cancel
              </button>
            )}
          </div>
        )}

        {isFailed && (
          <div className="status error">
            <ErrorIcon />
            <span>{message.metadata?.error || 'Failed to send'}</span>
            {onRetry && (
              <button onClick={onRetry} className="btn-primary">
                Retry
              </button>
            )}
          </div>
        )}

        {message.status === 'sent' && (
          <CheckIcon className="status-icon" />
        )}
      </div>
    </div>
  );
}
```

---

## Advanced Features

### 1. File Attachments

```typescript
function ChatWithAttachments({ conversationId }: { conversationId: string }) {
  const { sendMessage } = useSendMessage(conversationId);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSend = async (content: string) => {
    await sendMessage(content, selectedFiles);
    setSelectedFiles([]); // Clear after send
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileSelect} />
      {selectedFiles.length > 0 && (
        <div className="selected-files">
          {selectedFiles.map((file, i) => (
            <div key={i}>
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          ))}
        </div>
      )}
      <button onClick={() => handleSend('Here are the files')}>
        Send with {selectedFiles.length} file(s)
      </button>
    </div>
  );
}
```

### 2. Auto-Retry on Network Recovery

```typescript
function ChatWithAutoRetry({ conversationId }: { conversationId: string }) {
  const { failedMessages, retryMessage } = useSendMessage(conversationId);

  useEffect(() => {
    const handleOnline = async () => {
      // Retry all failed messages when back online
      for (const msg of failedMessages) {
        await retryMessage(msg.tempId);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [failedMessages, retryMessage]);

  return <div>Auto-retry enabled</div>;
}
```

### 3. Typing Indicators

```typescript
function ChatWithTyping({ conversationId }: { conversationId: string }) {
  const { sendMessage, isSending } = useSendMessage(conversationId);
  const [isTyping, setIsTyping] = useState(false);

  const handleInputChange = (value: string) => {
    setIsTyping(value.length > 0);
  };

  return (
    <div>
      <input onChange={(e) => handleInputChange(e.target.value)} />
      {isTyping && !isSending && <div>You are typing...</div>}
      {isSending && <div>Sending your message...</div>}
    </div>
  );
}
```

### 4. Message Batching

```typescript
function ChatWithBatching({ conversationId }: { conversationId: string }) {
  const { sendMessage } = useSendMessage(conversationId);
  const [queue, setQueue] = useState<string[]>([]);

  const addToQueue = (message: string) => {
    setQueue((prev) => [...prev, message]);
  };

  const sendBatch = async () => {
    for (const msg of queue) {
      await sendMessage(msg);
    }
    setQueue([]);
  };

  return (
    <div>
      <button onClick={() => addToQueue('Message 1')}>Add to queue</button>
      <button onClick={sendBatch}>Send all ({queue.length})</button>
    </div>
  );
}
```

---

## State Management Integration

### With Zustand

```typescript
// chatStore.ts
import { create } from 'zustand';
import type { ChatMessage, OptimisticMessage } from '@/types/chat';

interface ChatStore {
  messages: ChatMessage[];
  optimisticMessages: OptimisticMessage[];
  addMessage: (message: ChatMessage) => void;
  addOptimisticMessage: (message: OptimisticMessage) => void;
  removeOptimisticMessage: (tempId: string) => void;
  updateOptimisticMessage: (tempId: string, updates: Partial<OptimisticMessage>) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  optimisticMessages: [],

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  addOptimisticMessage: (message) =>
    set((state) => ({
      optimisticMessages: [...state.optimisticMessages, message],
    })),

  removeOptimisticMessage: (tempId) =>
    set((state) => ({
      optimisticMessages: state.optimisticMessages.filter((m) => m.tempId !== tempId),
    })),

  updateOptimisticMessage: (tempId, updates) =>
    set((state) => ({
      optimisticMessages: state.optimisticMessages.map((m) =>
        m.tempId === tempId ? { ...m, ...updates } : m
      ),
    })),
}));

// Component
function ChatWithStore({ conversationId }: { conversationId: string }) {
  const { addMessage, addOptimisticMessage, removeOptimisticMessage } = useChatStore();

  const { sendMessage } = useSendMessage(conversationId, {
    onSuccess: (message) => {
      addMessage(message);
      removeOptimisticMessage(message.id);
    },
  });

  const handleSend = async (content: string) => {
    const tempMessage = {
      id: `temp_${Date.now()}`,
      tempId: `temp_${Date.now()}`,
      conversationId,
      role: 'user' as const,
      content,
      originalContent: content,
      timestamp: new Date(),
      status: 'sending' as const,
      retryCount: 0,
    };

    addOptimisticMessage(tempMessage);
    await sendMessage(content);
  };

  return <div>Chat with Zustand store</div>;
}
```

### With React Context

```typescript
// ChatContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { useSendMessage } from '@/hooks/useSendMessage';
import type { ChatMessage } from '@/types/chat';

interface ChatContextValue {
  messages: ChatMessage[];
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  retryMessage: (tempId: string) => Promise<void>;
  pendingCount: number;
  failedCount: number;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  conversationId,
  children,
}: {
  conversationId: string;
  children: ReactNode;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const {
    sendMessage: send,
    retryMessage: retry,
    pendingMessages,
    failedMessages,
  } = useSendMessage(conversationId, {
    onSuccess: (msg) => setMessages((prev) => [...prev, msg]),
  });

  const value: ChatContextValue = {
    messages,
    sendMessage: send,
    retryMessage: retry,
    pendingCount: pendingMessages.length,
    failedCount: failedMessages.length,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}
```

---

## Styling Examples

### Tailwind CSS

```tsx
function MessageBubble({ message }: { message: ChatMessage }) {
  const statusClasses = {
    sending: 'opacity-60',
    sent: 'opacity-100',
    error: 'border-red-500 bg-red-50',
    retrying: 'opacity-80 animate-pulse',
  };

  return (
    <div
      className={`
        rounded-lg p-4 mb-2
        ${message.role === 'user' ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-200'}
        ${statusClasses[message.status || 'sent']}
      `}
    >
      {message.content}

      {message.status === 'sending' && (
        <div className="flex items-center gap-2 mt-2 text-sm">
          <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
          <span>Sending...</span>
        </div>
      )}

      {message.status === 'error' && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-red-600 text-sm">{message.metadata?.error}</span>
          <button className="text-sm underline">Retry</button>
        </div>
      )}
    </div>
  );
}
```

### CSS Modules

```css
/* Message.module.css */
.message {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  transition: opacity 0.2s;
}

.message.user {
  background: #007bff;
  color: white;
  margin-left: auto;
}

.message.assistant {
  background: #f0f0f0;
}

.message.sending {
  opacity: 0.6;
}

.message.error {
  border: 2px solid #dc3545;
  background: #fff5f5;
}

.status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

---

## Testing

### Component Test Example

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from './ChatInterface';

// Mock the hook
jest.mock('@/hooks/useSendMessage', () => ({
  useSendMessage: jest.fn(() => ({
    sendMessage: jest.fn().mockResolvedValue({ id: '1', content: 'Test' }),
    pendingMessages: [],
    failedMessages: [],
    retryMessage: jest.fn(),
    isSending: false,
    getAllOptimisticMessages: jest.fn(() => []),
  })),
}));

describe('ChatInterface', () => {
  it('sends message on enter', async () => {
    render(<ChatInterface conversationId="test" />);

    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyPress(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });
});
```

---

## Troubleshooting

### Common Issues

1. **Messages not appearing**: Ensure you're combining `pendingMessages` with regular messages
2. **Retry not working**: Check that `maxRetries` hasn't been exceeded
3. **Double messages**: Make sure you're not adding to messages twice (once optimistic, once on success)
4. **Memory leaks**: Clear failed messages when unmounting or switching conversations

### Debug Mode

```typescript
const {
  sendMessage,
  pendingMessages,
  failedMessages,
} = useSendMessage(conversationId, {
  onSuccess: (msg) => console.log('✓ Success:', msg),
  onError: (error, tempId) => console.error('✗ Error:', error, tempId),
  onRetrySuccess: (msg, tempId) => console.log('↻ Retry success:', msg, tempId),
});

// Log state changes
useEffect(() => {
  console.log('Pending:', pendingMessages.length);
  console.log('Failed:', failedMessages.length);
}, [pendingMessages, failedMessages]);
```

---

## Next Steps

1. Review the [complete documentation](./README_SEND_MESSAGE.md)
2. Check out [usage examples](./useSendMessage.example.tsx)
3. Study the [flow diagrams](./SEND_MESSAGE_FLOW.md)
4. Run the [tests](./useSendMessage.test.ts) to understand behavior
5. Customize the hook for your specific needs
