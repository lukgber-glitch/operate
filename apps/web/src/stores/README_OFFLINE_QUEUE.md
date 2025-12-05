# Offline Queue System

Complete offline message queue implementation with automatic sync, retry logic, and localStorage persistence.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Browser Events                         │
│  (online/offline, beforeunload, visibilitychange)      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              useOfflineQueue Hook                        │
│  - Listens to browser events                           │
│  - Triggers auto-sync                                   │
│  - Provides React-friendly API                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            offlineQueue Store (Zustand)                 │
│  - Manages queue state                                  │
│  - Persists to localStorage                             │
│  - Handles sync logic                                   │
│  - Retry management                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  API Client                              │
│  - Sends queued messages to server                      │
│  - Returns success/error status                         │
└─────────────────────────────────────────────────────────┘
```

## Features

### ✅ Offline Detection
- Automatic detection via `navigator.onLine`
- Browser event listeners (`online`/`offline`)
- Real-time status updates

### ✅ Message Queueing
- FIFO queue processing
- Unique message IDs
- Timestamp tracking
- Attachment support

### ✅ Automatic Sync
- Triggers when connection restored
- Periodic retry for failed messages
- Manual sync trigger available

### ✅ Retry Logic
- Max 3 retry attempts per message
- Exponential backoff (via periodic checks)
- Retryable vs non-retryable error detection

### ✅ Persistence
- localStorage via Zustand persist
- Survives page refreshes
- Automatic rehydration

### ✅ Error Handling
- Detailed error tracking
- Retryable error classification
- Error clearing functionality

## Usage

### Basic Chat Integration

```tsx
import { useOfflineChat } from '@/hooks/useOfflineChat';
import { OfflineIndicator } from '@/components/chat/OfflineIndicator';

function ChatInterface() {
  const { sendMessage, isOnline, queuedCount } = useOfflineChat();

  const handleSend = async (content: string) => {
    await sendMessage({
      conversationId: currentConversationId,
      content,
      attachments: []
    });
  };

  return (
    <div>
      <OfflineIndicator />
      {/* Chat UI */}
    </div>
  );
}
```

### Direct Queue Access

```tsx
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

function AdminPanel() {
  const {
    isOnline,
    queuedCount,
    isSyncing,
    queue,
    sync,
    clearQueue,
    clearErrors
  } = useOfflineQueue();

  return (
    <div>
      <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
      <p>Queued: {queuedCount}</p>
      <p>Syncing: {isSyncing ? 'Yes' : 'No'}</p>

      <button onClick={sync}>Manual Sync</button>
      <button onClick={clearQueue}>Clear Queue</button>
      <button onClick={clearErrors}>Clear Errors</button>

      <ul>
        {queue.map(msg => (
          <li key={msg.id}>
            {msg.content} (retry: {msg.retryCount})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Status Indicator Only

```tsx
import { useOfflineStatus } from '@/hooks/useOfflineQueue';

function NavBar() {
  const { isOnline } = useOfflineStatus();

  return (
    <nav>
      {!isOnline && <OfflineBadge />}
    </nav>
  );
}
```

## Store API

### State

```typescript
interface OfflineQueueStore {
  isOnline: boolean;           // Current connection status
  queue: QueuedMessage[];      // Array of queued messages
  isSyncing: boolean;          // Sync in progress
  lastSyncAt: Date | null;     // Last successful sync
  syncErrors: SyncError[];     // Error history
}
```

### Actions

```typescript
// Add message to queue
addToQueue(message: Omit<QueuedMessage, 'queuedAt' | 'retryCount'>): void

// Remove message from queue
removeFromQueue(id: string): void

// Clear entire queue
clearQueue(): void

// Sync queue with server
syncQueue(): Promise<SyncResult>

// Update online status
setOnlineStatus(status: boolean): void

// Clear sync errors
clearSyncErrors(): void
```

## Hook API

### useOfflineQueue()

Full queue management hook.

```typescript
const {
  // State
  isOnline,        // boolean
  queuedCount,     // number
  isSyncing,       // boolean
  lastSyncAt,      // Date | null
  hasErrors,       // boolean
  errorCount,      // number
  queue,           // QueuedMessage[]

  // Actions
  queueMessage,    // (msg) => void
  sync,            // () => Promise<SyncResult>
  clearQueue,      // () => void
  clearErrors,     // () => void
} = useOfflineQueue();
```

### useOfflineChat()

Simplified chat integration hook.

```typescript
const {
  sendMessage,     // (options) => Promise<void>
  isOnline,        // boolean
  queuedCount,     // number
  isSyncing,       // boolean
} = useOfflineChat();
```

### useOfflineStatus()

Lightweight status-only hook.

```typescript
const {
  isOnline         // boolean
} = useOfflineStatus();
```

## Components

### OfflineIndicator

Full-featured status indicator with queue count and errors.

```tsx
<OfflineIndicator
  className="mb-4"
  showWhenOnline={true}
/>
```

Props:
- `className?: string` - Additional CSS classes
- `showWhenOnline?: boolean` - Show indicator even when online (default: false)

### OfflineBadge

Compact badge for navbar/toolbar.

```tsx
<OfflineBadge className="ml-auto" />
```

## Sync Behavior

### Automatic Triggers

1. **Connection Restored**: Syncs immediately when browser goes from offline → online
2. **New Message While Online**: Syncs 100ms after adding to queue
3. **Periodic Retry**: Every 30 seconds for messages with retry count > 0

### Sync Algorithm

```
for each message in queue (FIFO):
  if retryCount >= MAX_RETRY_COUNT:
    mark as failed (non-retryable)
    continue

  try:
    send to server
    add to succeeded list
  catch error:
    if retryable (network error, 5xx, 429, 408):
      increment retry count
      add to failed list
      continue to next message
    else:
      add to failed list (non-retryable)
      stop processing (network down)

remove succeeded messages from queue
update lastSyncAt
```

### Retryable Errors

- Network errors (`TypeError`)
- HTTP 408 (Request Timeout)
- HTTP 429 (Too Many Requests)
- HTTP 500 (Internal Server Error)
- HTTP 502 (Bad Gateway)
- HTTP 503 (Service Unavailable)
- HTTP 504 (Gateway Timeout)

### Non-Retryable Errors

- HTTP 400 (Bad Request)
- HTTP 401 (Unauthorized)
- HTTP 403 (Forbidden)
- HTTP 404 (Not Found)
- HTTP 422 (Validation Error)

## Persistence

### Stored in localStorage

```json
{
  "queue": [
    {
      "id": "msg-123",
      "conversationId": "conv-456",
      "content": "Hello",
      "queuedAt": "2024-01-15T10:30:00Z",
      "retryCount": 1
    }
  ],
  "syncErrors": [
    {
      "messageId": "msg-789",
      "error": "Network error",
      "timestamp": "2024-01-15T10:29:00Z",
      "retryable": true
    }
  ],
  "lastSyncAt": "2024-01-15T10:28:00Z"
}
```

### Rehydration

- Dates are converted from JSON strings to Date objects
- Online status is reset based on current `navigator.onLine`
- Transient state (`isSyncing`) is not persisted

## Message Ordering

Messages are processed in FIFO (First In, First Out) order to maintain conversation chronology:

1. Messages added to queue with timestamp
2. Queue sorted by `queuedAt` during sync
3. Server receives `clientMessageId` and `queuedAt` for deduplication
4. UI shows messages in correct order regardless of send status

## Best Practices

### 1. Optimistic UI Updates

```tsx
// Show message immediately in UI
const optimisticMessage = {
  id: messageId,
  content,
  status: 'sending',
  timestamp: new Date()
};

addMessageToUI(optimisticMessage);

// Queue for sending
await sendMessage({ conversationId, content });
```

### 2. Error Handling

```tsx
const { sync, hasErrors, errorCount } = useOfflineQueue();

// Show error notification
if (hasErrors) {
  showToast({
    title: 'Sync Errors',
    description: `${errorCount} messages failed to send`,
    action: (
      <Button onClick={sync}>Retry</Button>
    )
  });
}
```

### 3. Loading States

```tsx
const { isSyncing, queuedCount } = useOfflineQueue();

<Button disabled={isSyncing || queuedCount > 0}>
  {isSyncing ? 'Syncing...' : 'Send'}
</Button>
```

### 4. Prevent Data Loss

```tsx
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (queuedCount > 0) {
      e.preventDefault();
      e.returnValue = 'You have unsent messages. Are you sure?';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [queuedCount]);
```

## Testing

### Simulate Offline

```tsx
// Browser DevTools
// 1. Open DevTools
// 2. Network tab
// 3. Toggle "Offline" checkbox

// Or programmatically
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false
});
window.dispatchEvent(new Event('offline'));
```

### Test Scenarios

1. **Send while offline**: Message queues
2. **Reconnect**: Auto-sync triggers
3. **Server error**: Retry logic activates
4. **Max retries**: Message marked as failed
5. **Page refresh**: Queue persists
6. **Mixed success/failure**: Partial sync works

## Migration Guide

### From Direct API Calls

**Before:**
```tsx
const sendMessage = async (content: string) => {
  await api.post('/messages', { content });
};
```

**After:**
```tsx
import { useOfflineChat } from '@/hooks/useOfflineChat';

const { sendMessage } = useOfflineChat();

await sendMessage({
  conversationId,
  content,
  attachments: []
});
```

### From Custom Queue

Replace custom queue logic with this system:

1. Remove manual queue state
2. Remove localStorage sync code
3. Remove retry logic
4. Import `useOfflineQueue` or `useOfflineChat`
5. Add `<OfflineIndicator />` to UI

## Troubleshooting

### Messages stuck in queue

- Check `syncErrors` for error details
- Verify server endpoint is correct
- Check network connectivity
- Try manual `sync()`

### Queue not persisting

- Check localStorage is enabled
- Verify localStorage quota not exceeded
- Check browser console for errors

### Duplicate messages

- Server should use `clientMessageId` for deduplication
- Check `queuedAt` timestamp for ordering

## Future Enhancements

- [ ] Message priority levels
- [ ] Exponential backoff timing
- [ ] Batch send optimization
- [ ] IndexedDB for large attachments
- [ ] Queue size limits
- [ ] Background sync API support
- [ ] WebSocket fallback detection
