# useSendMessage - Message Flow Diagrams

## Overview

This document provides visual diagrams of the message sending flows in the `useSendMessage` hook.

## Message State Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                   Message Lifecycle States                   │
└─────────────────────────────────────────────────────────────┘

    [User Input]
         │
         ▼
    ┌─────────┐
    │ sending │ ◄─── Optimistic message created
    └────┬────┘      Added to pendingMessages[]
         │
         ├────────────┐
         │            │
         ▼            ▼
    ┌────────┐   ┌───────┐
    │  sent  │   │ error │
    └────────┘   └───┬───┘
         │           │
         │           ├─────► Move to failedMessages[]
         │           │
         │           ▼
         │       ┌──────────┐
         │       │ retrying │
         │       └─────┬────┘
         │             │
         │             ├────► Retry attempt
         │             │
         └─────────────┴────► Final state
```

## Successful Send Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Successful Send Flow                       │
└──────────────────────────────────────────────────────────────┘

User Types Message
       │
       ▼
┌──────────────────────────────────────┐
│ 1. Create Optimistic Message         │
│    - Generate tempId                 │
│    - Set status: 'sending'           │
│    - Set timestamp: now()            │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 2. Add to pendingMessages[]          │
│    - Message appears in UI instantly │
│    - Show loading indicator          │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 3. Send to API (background)          │
│    POST /api/v1/chat/messages        │
│    { content, attachments? }         │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 4. API Response Success              │
│    { userMessage: { id, content } }  │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 5. Remove from pendingMessages[]     │
│    - Update UI with real ID          │
│    - Hide loading indicator          │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 6. Call onSuccess(message)           │
│    - Show success toast              │
│    - Update analytics                │
└──────────────────────────────────────┘
```

## Failed Send Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      Failed Send Flow                         │
└──────────────────────────────────────────────────────────────┘

Steps 1-3 same as successful flow
       │
       ▼
┌──────────────────────────────────────┐
│ 4. API Response Error                │
│    - Network error                   │
│    - Server error (500)              │
│    - Validation error (400)          │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 5. Move to failedMessages[]          │
│    - Remove from pendingMessages[]   │
│    - Set status: 'error'             │
│    - Set error message               │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 6. Update UI                         │
│    - Show error indicator            │
│    - Display error message           │
│    - Show retry button               │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 7. Call onError(error, tempId)       │
│    - Show error toast                │
│    - Log to error tracking           │
└──────────────────────────────────────┘
```

## Retry Flow

```
┌──────────────────────────────────────────────────────────────┐
│                         Retry Flow                            │
└──────────────────────────────────────────────────────────────┘

User Clicks Retry
       │
       ▼
┌──────────────────────────────────────┐
│ 1. Check Retry Limit                 │
│    if (retryCount >= maxRetries)     │
│       throw Error                    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 2. Move from failed to pending       │
│    - Remove from failedMessages[]    │
│    - Add to pendingMessages[]        │
│    - Increment retryCount            │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 3. Update Message State              │
│    - status: 'sending'               │
│    - clear error message             │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 4. Re-send to API                    │
│    - Same content & attachments      │
│    - New abort controller            │
└──────────┬───────────────────────────┘
           │
           ├─────────────────┐
           │                 │
           ▼                 ▼
    ┌──────────┐      ┌───────────┐
    │ Success  │      │  Failure  │
    └────┬─────┘      └─────┬─────┘
         │                  │
         ▼                  ▼
  ┌────────────┐    ┌─────────────────┐
  │ Remove     │    │ Back to failed  │
  │ from       │    │ Increment retry │
  │ pending    │    │ Show error      │
  └────┬───────┘    └────────┬────────┘
       │                     │
       ▼                     ▼
  onRetrySuccess()      onError()
```

## Cancellation Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     Cancellation Flow                         │
└──────────────────────────────────────────────────────────────┘

Message Sending
       │
       ▼
┌──────────────────────────────────────┐
│ User Clicks Cancel                   │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 1. Find AbortController              │
│    - Lookup by tempId                │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 2. Abort API Request                 │
│    abortController.abort()           │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 3. Remove from State                 │
│    - Remove from pendingMessages[]   │
│    - Remove from failedMessages[]    │
│    - Clean up abort controller       │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 4. Update UI                         │
│    - Message disappears              │
│    - No error shown                  │
└──────────────────────────────────────┘
```

## State Management

```
┌──────────────────────────────────────────────────────────────┐
│                  Hook State Structure                         │
└──────────────────────────────────────────────────────────────┘

useSendMessage State
├── pendingMessages: OptimisticMessage[]
│   └── Messages currently being sent
│       ├── tempId: string
│       ├── status: 'sending'
│       ├── content: string
│       ├── attachments?: File[]
│       └── retryCount: number
│
├── failedMessages: OptimisticMessage[]
│   └── Messages that failed to send
│       ├── tempId: string
│       ├── status: 'error'
│       ├── error: string
│       ├── retryCount: number
│       └── originalContent: string
│
├── isSending: boolean
│   └── At least one message is being sent
│
└── abortControllers: Map<tempId, AbortController>
    └── For cancelling pending requests
```

## Message Display Integration

```
┌──────────────────────────────────────────────────────────────┐
│              Message Display with Optimistic UI               │
└──────────────────────────────────────────────────────────────┘

Chat Component
├── Existing Messages (from API)
│   ├── Message 1 (sent)
│   ├── Message 2 (sent)
│   └── Message 3 (sent)
│
└── Optimistic Messages (from hook)
    ├── pendingMessages
    │   ├── Message 4 (sending) ◄── Show spinner
    │   └── Message 5 (sending) ◄── Show spinner
    │
    └── failedMessages
        └── Message 6 (error)   ◄── Show retry button

Combined & Sorted by Timestamp
├── Message 1 (sent)
├── Message 2 (sent)
├── Message 3 (sent)
├── Message 4 (sending) ◄── Optimistic
├── Message 5 (sending) ◄── Optimistic
└── Message 6 (error)   ◄── Failed
```

## Attachment Handling

```
┌──────────────────────────────────────────────────────────────┐
│                   Attachment Upload Flow                      │
└──────────────────────────────────────────────────────────────┘

User Selects Files
       │
       ▼
┌──────────────────────────────────────┐
│ Create Optimistic Message            │
│ with attachment metadata             │
│   - id, name, type, size             │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Prepare FormData                     │
│   formData.append('content', text)   │
│   formData.append('attachments', f1) │
│   formData.append('attachments', f2) │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Send to API                          │
│   POST /api/v1/chat/messages         │
│   Content-Type: multipart/form-data  │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Response includes attachment URLs    │
│   { userMessage: {                   │
│      attachments: [                  │
│        { id, name, url }             │
│      ]                               │
│   }}                                 │
└──────────────────────────────────────┘
```

## Error Recovery Strategies

```
┌──────────────────────────────────────────────────────────────┐
│                   Error Recovery Matrix                       │
└──────────────────────────────────────────────────────────────┘

Error Type              │ Strategy              │ Max Retries
────────────────────────┼───────────────────────┼─────────────
Network timeout         │ Auto-retry            │ 5
Connection refused      │ Auto-retry on online  │ 3
Server error (500)      │ Manual retry          │ 3
Rate limit (429)        │ Retry with backoff    │ 5
Bad request (400)       │ No retry (user fix)   │ 0
Unauthorized (401)      │ No retry (re-auth)    │ 0
Not found (404)         │ No retry              │ 0

Auto-Retry Flow:
┌─────────────┐
│ Send Failed │
└──────┬──────┘
       │
       ▼
┌──────────────────┐     No
│ Is Retryable?    ├─────────► Add to failedMessages
└──────┬───────────┘
       │ Yes
       ▼
┌──────────────────┐     Yes
│ retryCount < max?├─────────► Auto retry
└──────┬───────────┘
       │ No
       ▼
   failedMessages (manual retry only)
```

## Performance Optimization

```
┌──────────────────────────────────────────────────────────────┐
│                Performance Considerations                     │
└──────────────────────────────────────────────────────────────┘

Optimization                     │ Implementation
─────────────────────────────────┼──────────────────────────────
Prevent rapid sends              │ Debounce sendMessage
Limit concurrent sends           │ Queue pending messages
Handle large files               │ Validate size before send
Clean up on unmount              │ Abort pending requests
Reduce re-renders                │ Memoize callbacks
Optimize state updates           │ Batch setState calls
Handle memory leaks              │ Clear abort controllers
Prevent duplicate sends          │ Check pendingMessages

Example: Debounced Send
const debouncedSend = useMemo(
  () => debounce(sendMessage, 300),
  [sendMessage]
);
```

## Testing Scenarios

```
┌──────────────────────────────────────────────────────────────┐
│                     Testing Checklist                         │
└──────────────────────────────────────────────────────────────┘

✓ Optimistic message creation
✓ Successful send updates UI
✓ Failed send moves to failedMessages
✓ Retry increments retryCount
✓ Max retries prevents infinite loops
✓ Cancel removes from pending
✓ Attachments use FormData
✓ Empty messages rejected
✓ Network errors handled
✓ API errors handled
✓ Message ordering maintained
✓ Callbacks fired correctly
✓ Abort controller cleanup
✓ Multiple simultaneous sends
✓ Offline/online transitions
```

## Real-World Example

```typescript
// Complete integration example
function ChatView({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const {
    sendMessage,
    retryMessage,
    pendingMessages,
    failedMessages,
    isSending,
    getAllOptimisticMessages,
  } = useSendMessage(conversationId, {
    onSuccess: (msg) => {
      // Add real message to state
      setMessages((prev) => [...prev, msg]);
      toast.success('Sent!');
    },
    onError: (error) => {
      toast.error(`Failed: ${error}`);
    },
  });

  // Combine all messages for display
  const allMessages = useMemo(() => {
    return [
      ...messages,
      ...getAllOptimisticMessages(),
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [messages, getAllOptimisticMessages]);

  return (
    <div>
      {/* Messages */}
      {allMessages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onRetry={msg.status === 'error' ? () => retryMessage(msg.id) : undefined}
        />
      ))}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={isSending}
      />

      {/* Failed indicator */}
      {failedMessages.length > 0 && (
        <div className="toast toast-error">
          {failedMessages.length} message(s) failed to send
        </div>
      )}
    </div>
  );
}
```
