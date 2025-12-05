# useSendMessage Hook

Optimistic message sending hook with automatic rollback on failure, retry support, and message ordering.

## Features

- **Optimistic Updates**: Messages appear instantly in the UI while being sent in the background
- **Automatic Rollback**: Failed messages are marked as failed and moved to a separate list
- **Retry Support**: Failed messages can be retried with configurable max retry attempts
- **Message Ordering**: Maintains proper chronological ordering of messages
- **Attachment Support**: Send messages with file attachments
- **Cancellation**: Cancel pending messages before they complete
- **Status Tracking**: Track sending/sent/failed/retrying states
- **Error Handling**: Comprehensive error handling with detailed error messages

## Installation

The hook is already included in the project. Simply import it:

```typescript
import { useSendMessage } from '@/hooks/useSendMessage';
```

## Basic Usage

```typescript
function ChatComponent({ conversationId }: { conversationId: string }) {
  const {
    sendMessage,
    pendingMessages,
    failedMessages,
    isSending,
  } = useSendMessage(conversationId);

  const handleSend = async (content: string) => {
    const message = await sendMessage(content);
    if (message) {
      console.log('Message sent successfully!');
    }
  };

  return (
    <div>
      <input onSubmit={(e) => handleSend(e.target.value)} />
      {isSending && <div>Sending...</div>}
    </div>
  );
}
```

## API Reference

### Hook Parameters

```typescript
useSendMessage(
  conversationId: string,
  options?: UseSendMessageOptions
)
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onSuccess` | `(message: ChatMessage) => void` | - | Called when message is successfully sent |
| `onError` | `(error: string, tempId: string) => void` | - | Called when message send fails |
| `onRetrySuccess` | `(message: ChatMessage, tempId: string) => void` | - | Called when retry succeeds |
| `maxRetries` | `number` | `3` | Maximum number of retry attempts |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `sendMessage` | `(content: string, attachments?: File[]) => Promise<ChatMessage \| null>` | Send a message optimistically |
| `retryMessage` | `(tempId: string) => Promise<ChatMessage \| null>` | Retry a failed message |
| `cancelMessage` | `(tempId: string) => void` | Cancel a pending message |
| `clearFailedMessages` | `() => void` | Clear all failed messages |
| `getAllOptimisticMessages` | `() => OptimisticMessage[]` | Get all optimistic messages sorted by timestamp |
| `pendingMessages` | `OptimisticMessage[]` | Array of messages currently being sent |
| `failedMessages` | `OptimisticMessage[]` | Array of messages that failed to send |
| `isSending` | `boolean` | Whether a message is currently being sent |

## Types

### OptimisticMessage

```typescript
interface OptimisticMessage extends ChatMessage {
  tempId: string;              // Temporary ID for optimistic updates
  originalContent: string;     // Original message content
  attachments?: Attachment[];  // File attachments
  status: MessageStatus;       // Current status
  error?: string;              // Error message (if failed)
  retryCount: number;          // Number of retry attempts
}
```

### MessageStatus

```typescript
type MessageStatus =
  | 'sending'    // Being sent to API
  | 'sent'       // Successfully sent
  | 'error'      // Failed to send
  | 'retrying'   // Being retried
  | 'received'   // Received from server
  | 'streaming'; // Assistant response streaming
```

## Usage Examples

### 1. With Success/Error Callbacks

```typescript
const { sendMessage } = useSendMessage(conversationId, {
  onSuccess: (message) => {
    toast.success('Message sent!');
    analytics.track('message_sent', { id: message.id });
  },
  onError: (error, tempId) => {
    toast.error(`Failed to send: ${error}`);
  },
  maxRetries: 5,
});
```

### 2. With Attachments

```typescript
const { sendMessage } = useSendMessage(conversationId);

const handleFileUpload = async (files: File[]) => {
  await sendMessage('Here are the files', files);
};

// Usage
<input
  type="file"
  multiple
  onChange={(e) => handleFileUpload(Array.from(e.target.files))}
/>
```

### 3. Retry Failed Messages

```typescript
const { failedMessages, retryMessage } = useSendMessage(conversationId);

return (
  <div>
    {failedMessages.map((msg) => (
      <div key={msg.tempId}>
        <p>{msg.content}</p>
        <p className="error">{msg.error}</p>
        <button onClick={() => retryMessage(msg.tempId)}>
          Retry ({msg.retryCount}/3)
        </button>
      </div>
    ))}
  </div>
);
```

### 4. Cancel Pending Messages

```typescript
const { pendingMessages, cancelMessage } = useSendMessage(conversationId);

return (
  <div>
    {pendingMessages.map((msg) => (
      <div key={msg.tempId}>
        <p>{msg.content}</p>
        <button onClick={() => cancelMessage(msg.tempId)}>Cancel</button>
      </div>
    ))}
  </div>
);
```

### 5. Display All Messages with Ordering

```typescript
const { getAllOptimisticMessages } = useSendMessage(conversationId);

// Combine with existing messages
const allMessages = [
  ...existingMessages,
  ...getAllOptimisticMessages(),
].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

return (
  <div>
    {allMessages.map((msg) => (
      <Message
        key={msg.id}
        content={msg.content}
        status={msg.status}
        timestamp={msg.timestamp}
      />
    ))}
  </div>
);
```

## Message Flow

### Successful Send Flow

```
User sends message
    ↓
Create optimistic message with tempId
    ↓
Add to pendingMessages (status: 'sending')
    ↓
Send to API
    ↓
API responds successfully
    ↓
Remove from pendingMessages
    ↓
onSuccess callback fired
    ↓
Return real message with server ID
```

### Failed Send Flow

```
User sends message
    ↓
Create optimistic message with tempId
    ↓
Add to pendingMessages (status: 'sending')
    ↓
Send to API
    ↓
API returns error
    ↓
Move from pendingMessages to failedMessages
    ↓
Update status to 'error'
    ↓
onError callback fired
    ↓
User can retry or cancel
```

### Retry Flow

```
User clicks retry on failed message
    ↓
Move from failedMessages to pendingMessages
    ↓
Increment retryCount
    ↓
Update status to 'sending'
    ↓
Send to API again
    ↓
Success: Remove from pending, fire onRetrySuccess
OR
Failure: Move back to failed, increment retryCount
```

## Best Practices

### 1. Handle All States in UI

```typescript
const MessageComponent = ({ message }: { message: OptimisticMessage }) => {
  return (
    <div className={`message ${message.status}`}>
      <div className="content">{message.content}</div>

      {message.status === 'sending' && (
        <div className="status">
          <Spinner /> Sending...
        </div>
      )}

      {message.status === 'error' && (
        <div className="error">
          <ErrorIcon /> {message.error}
          <button onClick={() => retry(message.tempId)}>Retry</button>
        </div>
      )}

      {message.status === 'sent' && (
        <div className="status">
          <CheckIcon /> Sent
        </div>
      )}
    </div>
  );
};
```

### 2. Provide User Feedback

```typescript
const { sendMessage, isSending } = useSendMessage(conversationId, {
  onSuccess: () => {
    toast.success('Message sent!');
  },
  onError: (error) => {
    toast.error(`Failed: ${error}. Click retry to try again.`);
  },
});
```

### 3. Clean Up Failed Messages

```typescript
const { failedMessages, clearFailedMessages } = useSendMessage(conversationId);

// Clear failed messages when leaving conversation
useEffect(() => {
  return () => {
    if (failedMessages.length > 0) {
      clearFailedMessages();
    }
  };
}, [failedMessages, clearFailedMessages]);
```

### 4. Validate Before Sending

```typescript
const handleSend = async (content: string) => {
  // Validate
  if (!content.trim()) {
    toast.error('Message cannot be empty');
    return;
  }

  if (content.length > 10000) {
    toast.error('Message too long (max 10,000 characters)');
    return;
  }

  // Send
  await sendMessage(content);
};
```

### 5. Handle Network Issues Gracefully

```typescript
const { sendMessage, failedMessages } = useSendMessage(conversationId, {
  onError: (error, tempId) => {
    if (error.includes('Network') || error.includes('offline')) {
      toast.error('You appear to be offline. Message will be retried when connection is restored.');
    } else {
      toast.error(`Failed to send: ${error}`);
    }
  },
  maxRetries: 5, // More retries for network issues
});

// Auto-retry when online
useEffect(() => {
  const handleOnline = async () => {
    for (const msg of failedMessages) {
      await retryMessage(msg.tempId);
    }
  };

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, [failedMessages, retryMessage]);
```

## Performance Considerations

1. **Debounce rapid sends**: If users can send multiple messages quickly, consider debouncing
2. **Limit attachment size**: Validate file sizes before sending to prevent large uploads
3. **Clean up on unmount**: Failed messages are stored in memory, clear them when appropriate
4. **Batch retries**: If retrying multiple failed messages, do them sequentially to avoid overwhelming the API

## Error Handling

The hook handles several error scenarios:

- **Network errors**: Caught and reported via `onError`
- **API errors**: Status codes and error messages extracted from response
- **Validation errors**: Empty messages rejected immediately
- **Abort errors**: Cancelled requests don't trigger error callbacks
- **Max retry limit**: Prevents infinite retry loops

## Testing

See `useSendMessage.test.ts` for comprehensive test coverage including:

- Optimistic message creation
- Successful send flow
- Failed send flow
- Retry logic
- Cancellation
- Message ordering
- Attachment handling
- Edge cases

## Integration with Chat Store

To integrate with a Zustand store:

```typescript
// chatStore.ts
interface ChatStore {
  messages: ChatMessage[];
  addOptimisticMessage: (msg: OptimisticMessage) => void;
  updateMessage: (tempId: string, realMessage: ChatMessage) => void;
  removeMessage: (tempId: string) => void;
}

// Component
const { sendMessage } = useSendMessage(conversationId, {
  onSuccess: (message) => {
    // Update store with real message
    chatStore.updateMessage(message.id, message);
  },
});
```

## Troubleshooting

### Messages not appearing immediately

Ensure you're displaying `pendingMessages` in your UI:

```typescript
const allMessages = [...regularMessages, ...pendingMessages];
```

### Retry not working

Check that:
1. The message is in `failedMessages`
2. `retryCount` hasn't exceeded `maxRetries`
3. The API endpoint is correct

### Message ordering issues

Use `getAllOptimisticMessages()` and sort by timestamp:

```typescript
const sorted = getAllOptimisticMessages().sort(
  (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
);
```

## Related Files

- `apps/web/src/hooks/useSendMessage.ts` - Hook implementation
- `apps/web/src/hooks/useSendMessage.example.tsx` - Usage examples
- `apps/web/src/hooks/useSendMessage.test.ts` - Test suite
- `apps/web/src/types/chat.ts` - Type definitions
- `apps/web/src/hooks/use-chat.ts` - Original chat hook (legacy)
- `apps/web/src/hooks/use-streaming-message.ts` - Streaming message hook
