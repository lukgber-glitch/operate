# Streaming Message Integration Guide

## Overview

This guide explains how to integrate the streaming message functionality into ChatInterface.tsx.

## What Was Created

### 1. Updated Types (`apps/web/src/types/chat.ts`)
- Added `'streaming'` to `MessageStatus` type
- Now supports: `'sending' | 'sent' | 'error' | 'received' | 'streaming'`

### 2. TypingIndicator Component (`apps/web/src/components/chat/TypingIndicator.tsx`)
- Animated three-dot bounce indicator
- Shows when AI is thinking (before streaming starts)
- Accessible with aria-live="polite"

### 3. useStreamingMessage Hook (`apps/web/src/hooks/use-streaming-message.ts`)
- Handles Server-Sent Events (SSE) for streaming responses
- Features:
  - `startStreaming(url, body)` - Initiates SSE connection
  - `stopStreaming()` - Aborts ongoing stream
  - `reset()` - Resets state
  - Callbacks: `onChunk`, `onComplete`, `onError`
- State: `content`, `isStreaming`, `isComplete`, `error`

### 4. Updated ChatMessage Component (`apps/web/src/components/chat/ChatMessage.tsx`)
- Added `isStreaming` state detection
- Streaming cursor animation (pulsing vertical bar)
- Status indicator shows for both `sending` and `streaming`
- aria-live="polite" for accessibility during streaming
- Hides action buttons during streaming

## Integration Steps for ChatInterface.tsx

### Step 1: Add Imports

```typescript
import { useCallback } from 'react';
import { useStreamingMessage } from '@/hooks/use-streaming-message';
import { TypingIndicator } from './TypingIndicator';
```

### Step 2: Add State

```typescript
const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
```

### Step 3: Initialize Streaming Hook

```typescript
// Streaming hook for AI responses
const streaming = useStreamingMessage({
  onChunk: (chunk) => {
    // Update the streaming message with new content
    if (streamingMessageId) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingMessageId
            ? { ...msg, content: streaming.content }
            : msg
        )
      );
    }
  },
  onComplete: (content) => {
    // Mark streaming as complete
    if (streamingMessageId && activeConversationId) {
      const finalMessage = {
        status: 'sent' as const,
        content,
      };

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingMessageId
            ? { ...msg, ...finalMessage }
            : msg
        )
      );

      updateMessage(activeConversationId, streamingMessageId, finalMessage);
      setStreamingMessageId(null);
      setIsLoading(false);
    }
  },
  onError: (error) => {
    // Handle streaming errors
    if (streamingMessageId) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingMessageId
            ? {
                ...msg,
                status: 'error' as const,
                metadata: { error },
              }
            : msg
        )
      );
      setStreamingMessageId(null);
      setIsLoading(false);
    }
  },
});
```

### Step 4: Update Auto-Scroll Effect

```typescript
// Auto-scroll to bottom when messages change or streaming updates
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, streaming.content]);
```

### Step 5: Update handleSendMessage

Replace the existing API call with streaming:

```typescript
const handleSendMessage = async (content: string) => {
  // Create or get conversation
  let conversationId = activeConversationId;
  if (!conversationId) {
    const newConversation = createConversation();
    conversationId = newConversation.id;
  }

  const userMessage: ChatMessageType = {
    id: crypto.randomUUID(),
    conversationId,
    role: 'user',
    content,
    timestamp: new Date(),
    status: 'sending',
  };

  // Add to local state for immediate UI update
  setMessages((prev) => [...prev, userMessage]);
  addMessage(conversationId, userMessage);
  setIsLoading(true);

  try {
    // Update user message status to sent
    const sentUserMessage = { ...userMessage, status: 'sent' as const };
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === userMessage.id ? sentUserMessage : msg
      )
    );
    updateMessage(conversationId, userMessage.id, { status: 'sent' });

    // Create placeholder for streaming assistant message
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: ChatMessageType = {
      id: assistantMessageId,
      conversationId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      status: 'streaming',
    };

    setMessages((prev) => [...prev, assistantMessage]);
    addMessage(conversationId, assistantMessage);
    setStreamingMessageId(assistantMessageId);

    // Start streaming from API
    await streaming.startStreaming('/api/v1/chat/stream', {
      content,
      conversationId,
    });
  } catch (error) {
    // Mark user message as error if streaming fails to start
    const errorMessage = {
      ...userMessage,
      status: 'error' as const,
      metadata: {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send message',
      },
    };
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === userMessage.id ? errorMessage : msg
      )
    );
    updateMessage(conversationId, userMessage.id, {
      status: 'error',
      metadata: errorMessage.metadata,
    });
    setIsLoading(false);
  }
};
```

### Step 6: Update handleRetry

Make it use useCallback for optimization:

```typescript
const handleRetry = useCallback((messageId: string) => {
  const message = messages.find((msg) => msg.id === messageId);
  if (message && message.role === 'user') {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    handleSendMessage(message.content);
  }
}, [messages]);
```

### Step 7: Update Loading Indicator

Replace the existing loading indicator with TypingIndicator:

```typescript
{/* Typing indicator (shown when loading but not streaming) */}
{isLoading && !streamingMessageId && <TypingIndicator />}
```

### Step 8: Update ChatInput Disabled State

```typescript
<ChatInput
  onSend={handleSendMessage}
  disabled={isLoading || streaming.isStreaming}
  isLoading={isLoading || streaming.isStreaming}
  placeholder="Ask anything about your business..."
  showAttachment={true}
  showVoice={true}
/>
```

## Backend Requirements

The backend needs to implement a streaming endpoint at `/api/v1/chat/stream`:

### Expected Request Format
```json
{
  "content": "User message",
  "conversationId": "uuid"
}
```

### Expected SSE Response Format

The endpoint should return Server-Sent Events with this format:

```
data: {"content": "Hello", "delta": "Hello"}

data: {"content": " there", "delta": " there"}

data: {"content": "!", "delta": "!"}

data: {"done": true}
```

Or if an error occurs:
```
data: {"error": "Error message"}
```

### Example NestJS Implementation

```typescript
@Post('stream')
async streamMessage(
  @Body() dto: SendMessageDto,
  @Res() response: Response,
) {
  response.setHeader('Content-Type', 'text/event-stream');
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('Connection', 'keep-alive');

  try {
    const stream = await this.chatService.streamResponse(
      dto.content,
      dto.conversationId
    );

    for await (const chunk of stream) {
      response.write(`data: ${JSON.stringify({ delta: chunk, content: chunk })}\n\n`);
    }

    response.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    response.end();
  } catch (error) {
    response.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    response.end();
  }
}
```

## Testing

1. Send a message in the chat
2. Verify typing indicator appears briefly
3. Watch for streaming cursor (pulsing bar) as content arrives
4. Confirm smooth auto-scroll during streaming
5. Check that message status changes from 'streaming' to 'sent'
6. Verify action buttons appear after streaming completes
7. Test error handling by simulating network failure
8. Test accessibility with screen reader (aria-live announcements)

## Fallback Strategy

If streaming fails or is not available, the component gracefully falls back to:
1. Show typing indicator
2. Display full response at once when ready
3. Error state with retry option

## Notes

- The streaming hook automatically cleans up on unmount
- Multiple messages cannot stream simultaneously (by design)
- Network interruptions are handled gracefully
- Screen readers are notified of new content via aria-live
