# useStreamingMessage Hook

## Overview

A React hook for handling Server-Sent Events (SSE) streaming from AI chat endpoints. Provides real-time message updates with proper error handling and cleanup.

## Features

- Server-Sent Events (SSE) support
- Real-time content streaming
- Automatic abort/cleanup on unmount
- Error recovery
- Stream interruption handling
- Character-by-character or chunk-based rendering
- TypeScript support

## Installation

Already included in the project at:
```
apps/web/src/hooks/use-streaming-message.ts
```

## Basic Usage

```typescript
import { useStreamingMessage } from '@/hooks/use-streaming-message';

function ChatComponent() {
  const streaming = useStreamingMessage({
    onChunk: (chunk) => {
      console.log('New chunk:', chunk);
    },
    onComplete: (fullContent) => {
      console.log('Streaming complete:', fullContent);
    },
    onError: (error) => {
      console.error('Streaming error:', error);
    },
  });

  const handleSend = async () => {
    await streaming.startStreaming('/api/chat/stream', {
      message: 'Hello AI',
    });
  };

  return (
    <div>
      <div>{streaming.content}</div>
      {streaming.isStreaming && <LoadingIndicator />}
      {streaming.error && <ErrorMessage error={streaming.error} />}
      <button onClick={handleSend} disabled={streaming.isStreaming}>
        Send
      </button>
      <button onClick={streaming.stopStreaming}>Stop</button>
    </div>
  );
}
```

## API Reference

### Hook Parameters

```typescript
interface UseStreamingMessageOptions {
  onComplete?: (content: string) => void;
  onError?: (error: string) => void;
  onChunk?: (chunk: string) => void;
}
```

- `onChunk`: Called for each chunk received (optional)
- `onComplete`: Called when streaming finishes (optional)
- `onError`: Called on error (optional)

### Return Values

```typescript
interface StreamingMessageState {
  content: string;          // Accumulated content
  isStreaming: boolean;     // Currently streaming
  isComplete: boolean;      // Streaming finished
  error: string | null;     // Error message if any
}

// Plus methods:
{
  startStreaming: (url: string, body?: Record<string, any>) => Promise<void>;
  stopStreaming: () => void;
  reset: () => void;
}
```

### Methods

#### `startStreaming(url, body)`
Initiates SSE connection to the specified endpoint.

**Parameters:**
- `url`: API endpoint URL
- `body`: Request payload (optional)

**Returns:** Promise<void>

**Example:**
```typescript
await streaming.startStreaming('/api/v1/chat/stream', {
  content: 'What is AI?',
  conversationId: 'abc-123',
});
```

#### `stopStreaming()`
Aborts the current stream.

**Example:**
```typescript
streaming.stopStreaming();
```

#### `reset()`
Resets state and stops streaming.

**Example:**
```typescript
streaming.reset();
```

## SSE Message Format

The hook expects Server-Sent Events in this format:

### Success Messages
```
data: {"content": "text", "delta": "text"}
```

Or just content:
```
data: {"content": "Hello"}
```

### Completion Signal
```
data: {"done": true}
```

### Error Signal
```
data: {"error": "Error message"}
```

## Advanced Usage

### With State Management

```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [streamingId, setStreamingId] = useState<string | null>(null);

const streaming = useStreamingMessage({
  onChunk: () => {
    // Update the message in real-time
    setMessages(prev =>
      prev.map(msg =>
        msg.id === streamingId
          ? { ...msg, content: streaming.content }
          : msg
      )
    );
  },
  onComplete: (content) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === streamingId
          ? { ...msg, content, status: 'sent' }
          : msg
      )
    );
    setStreamingId(null);
  },
  onError: (error) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === streamingId
          ? { ...msg, status: 'error', error }
          : msg
      )
    );
    setStreamingId(null);
  },
});
```

### With Auto-Scroll

```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);

// Auto-scroll when content updates
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [streaming.content]);
```

## Error Handling

The hook handles several error cases:

1. **Network Errors**: Caught and reported via `onError`
2. **Abort/Interruption**: Gracefully handled, no error reported
3. **Stream Errors**: Parsed from SSE `error` field
4. **Parse Errors**: Raw content used if JSON parsing fails

## Cleanup

The hook automatically:
- Aborts ongoing streams on unmount
- Cleans up event listeners
- Releases resources

No manual cleanup needed!

## Best Practices

1. **Single Stream**: Only one stream at a time per hook instance
2. **Error Recovery**: Always provide `onError` callback
3. **Loading States**: Use `isStreaming` for UI feedback
4. **User Cancellation**: Provide stop button when streaming
5. **Accessibility**: Use aria-live for screen reader updates

## Example: Full Chat Implementation

See `STREAMING_INTEGRATION.md` in the chat components folder for a complete example integrated with ChatInterface.

## Troubleshooting

### Stream doesn't start
- Check endpoint URL and CORS settings
- Verify SSE headers are set correctly on backend
- Check network tab for connection errors

### Content not updating
- Ensure `onChunk` callback updates state
- Check that SSE messages have correct format
- Verify React component re-renders on state change

### Memory leaks
- Hook automatically cleans up
- If persisting, check for multiple hook instances
- Verify no external references preventing cleanup

### Stream cuts off early
- Check backend timeout settings
- Verify keepalive headers
- Check for proxy/firewall interference

## Browser Support

Works in all modern browsers with SSE support:
- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- IE11: ❌ (no SSE support)

## Related Files

- `apps/web/src/components/chat/ChatMessage.tsx` - Message display
- `apps/web/src/components/chat/ChatInterface.tsx` - Chat container
- `apps/web/src/components/chat/TypingIndicator.tsx` - Loading state
- `apps/web/src/types/chat.ts` - Type definitions
