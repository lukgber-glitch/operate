# Offline Queue Integration Guide

Quick start guide for integrating the offline queue system into existing chat components.

## 📦 Quick Integration (3 Steps)

### Step 1: Add Offline Indicator to Chat UI

```tsx
import { OfflineIndicator } from '@/components/chat/OfflineIndicator';

function ChatComponent() {
  return (
    <div>
      {/* Add at top of chat interface */}
      <OfflineIndicator className="mb-4" />

      {/* Rest of your chat UI */}
    </div>
  );
}
```

### Step 2: Replace API Calls with Offline Hook

**Before:**
```tsx
const handleSend = async (content: string) => {
  await api.post(`/chatbot/conversations/${convId}/messages`, { content });
};
```

**After:**
```tsx
import { useOfflineChat } from '@/hooks/useOfflineChat';

function ChatComponent() {
  const { sendMessage, isOnline } = useOfflineChat();

  const handleSend = async (content: string) => {
    await sendMessage({
      conversationId: convId,
      content,
      attachments: []
    });
  };
}
```

### Step 3: Show Queue Status in UI

```tsx
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

function ChatInput() {
  const { queuedCount, isSyncing } = useOfflineQueue();

  return (
    <div>
      <input placeholder="Type a message..." />

      {queuedCount > 0 && (
        <p className="text-sm text-gray-600">
          {queuedCount} queued messages {isSyncing && '- syncing...'}
        </p>
      )}
    </div>
  );
}
```

## 🎯 Common Use Cases

### 1. Optimistic UI Updates

Show message immediately, update status after sync:

```tsx
const handleSend = async (content: string) => {
  const msgId = uuidv4();

  // Show immediately
  addMessageToUI({
    id: msgId,
    content,
    status: isOnline ? 'sending' : 'queued'
  });

  // Queue for sending
  await sendMessage({ conversationId, content });

  // Update status (you can track this via sync events)
  updateMessageStatus(msgId, 'sent');
};
```

### 2. Prevent Data Loss

Warn user before leaving with unsent messages:

```tsx
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (queuedCount > 0) {
      e.preventDefault();
      e.returnValue = 'You have unsent messages';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [queuedCount]);
```

### 3. Manual Retry

Give users control to retry failed messages:

```tsx
const { sync, hasErrors } = useOfflineQueue();

{hasErrors && (
  <button onClick={sync}>
    Retry Failed Messages
  </button>
)}
```

### 4. Disable Input While Syncing

Prevent new messages during sync:

```tsx
<input
  disabled={isSyncing}
  placeholder={isSyncing ? 'Syncing...' : 'Type a message...'}
/>
```

## 🔧 Advanced Patterns

### Custom Sync Triggers

```tsx
import { useOfflineQueueStore } from '@/stores/offlineQueue';

// Sync on visibility change (tab becomes active)
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden && navigator.onLine) {
      useOfflineQueueStore.getState().syncQueue();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

### Monitor Sync Progress

```tsx
import { useOfflineQueueStore } from '@/stores/offlineQueue';

const { syncQueue } = useOfflineQueueStore();

const handleSync = async () => {
  const result = await syncQueue();

  console.log(`Synced ${result.succeeded.length} messages`);
  console.log(`Failed ${result.failed.length} messages`);

  // Show toast notification
  if (result.succeeded.length > 0) {
    showToast(`${result.succeeded.length} messages synced`);
  }

  if (result.failed.length > 0) {
    showToast(`${result.failed.length} messages failed`, 'error');
  }
};
```

### Custom Error Handling

```tsx
const { syncErrors, clearErrors } = useOfflineQueue();

useEffect(() => {
  if (syncErrors.length > 0) {
    syncErrors.forEach(error => {
      if (error.retryable) {
        console.log(`Message ${error.messageId} will retry`);
      } else {
        // Permanent failure - notify user
        showErrorDialog({
          message: `Failed to send message: ${error.error}`,
          messageId: error.messageId
        });
      }
    });
  }
}, [syncErrors]);
```

## 🎨 UI Components

### Status Badge

```tsx
import { OfflineBadge } from '@/components/chat/OfflineIndicator';

// Navbar
<nav>
  <OfflineBadge className="ml-auto" />
</nav>
```

### Full Indicator

```tsx
import { OfflineIndicator } from '@/components/chat/OfflineIndicator';

// Chat interface
<OfflineIndicator
  className="mb-4"
  showWhenOnline={true}  // Always show
/>
```

### Custom Status Display

```tsx
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

function CustomStatus() {
  const { isOnline, queuedCount, lastSyncAt } = useOfflineQueue();

  return (
    <div className="status-bar">
      <span>{isOnline ? '🟢' : '🔴'} {isOnline ? 'Online' : 'Offline'}</span>
      {queuedCount > 0 && <span>{queuedCount} pending</span>}
      {lastSyncAt && <span>Last sync: {lastSyncAt.toLocaleTimeString()}</span>}
    </div>
  );
}
```

## 🧪 Testing Offline Mode

### Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" in throttling dropdown
4. Send messages - they'll queue
5. Uncheck "Offline" - watch auto-sync

### Programmatic Testing

```tsx
// In your test or dev console
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false
});
window.dispatchEvent(new Event('offline'));

// Send messages (they'll queue)

// Go back online
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});
window.dispatchEvent(new Event('online'));

// Watch auto-sync happen
```

## 🐛 Troubleshooting

### Messages Not Syncing

1. Check browser console for errors
2. Verify `navigator.onLine` is true
3. Check network tab for failed requests
4. Inspect `syncErrors` in store

```tsx
import { useOfflineQueueStore } from '@/stores/offlineQueue';

// Debug sync issues
const state = useOfflineQueueStore.getState();
console.log('Online:', state.isOnline);
console.log('Queue:', state.queue);
console.log('Errors:', state.syncErrors);
```

### Queue Not Persisting

```tsx
// Check localStorage
const stored = localStorage.getItem('offline-queue-storage');
console.log('Stored queue:', JSON.parse(stored || '{}'));
```

### Duplicate Messages

Server should implement deduplication using `clientMessageId`:

```typescript
// Backend (NestJS example)
@Post('conversations/:id/messages')
async createMessage(
  @Param('id') conversationId: string,
  @Body() dto: CreateMessageDto
) {
  // Check if message already exists
  const existing = await this.messagesService.findByClientId(
    dto.clientMessageId
  );

  if (existing) {
    return existing; // Return existing, don't create duplicate
  }

  return this.messagesService.create(conversationId, dto);
}
```

## 📊 Performance Tips

### 1. Selective Subscriptions

Only subscribe to what you need:

```tsx
// ❌ Bad - subscribes to entire store
const store = useOfflineQueueStore();

// ✅ Good - subscribe to specific values
const isOnline = useOfflineQueueStore(state => state.isOnline);
const queuedCount = useOfflineQueueStore(state => state.queue.length);
```

### 2. Lightweight Status Check

For components that only need online status:

```tsx
import { useOfflineStatus } from '@/hooks/useOfflineQueue';

const { isOnline } = useOfflineStatus(); // Lighter than useOfflineQueue
```

### 3. Debounce Sync Triggers

Avoid syncing on every keystroke:

```tsx
import { useDebounce } from '@/hooks/useDebounce';

const debouncedSync = useDebounce(() => {
  syncQueue();
}, 1000);
```

## 🚀 Migration Checklist

- [ ] Add `<OfflineIndicator />` to chat UI
- [ ] Replace direct API calls with `useOfflineChat`
- [ ] Add queue status display
- [ ] Implement beforeunload warning
- [ ] Test offline mode in DevTools
- [ ] Update backend for deduplication
- [ ] Add error handling UI
- [ ] Test page refresh with queued messages
- [ ] Document for team

## 📚 Complete Example

See `apps/web/src/components/chat/ChatWithOffline.example.tsx` for a full working example with:

- ✅ Offline detection
- ✅ Queue status display
- ✅ Optimistic UI updates
- ✅ Error handling
- ✅ Retry functionality
- ✅ Data loss prevention
- ✅ Status indicators

## 🔗 Related Files

- **Store**: `apps/web/src/stores/offlineQueue.ts`
- **Hook**: `apps/web/src/hooks/useOfflineQueue.ts`
- **Chat Hook**: `apps/web/src/hooks/useOfflineChat.ts`
- **UI Components**: `apps/web/src/components/chat/OfflineIndicator.tsx`
- **Types**: `apps/web/src/stores/offlineQueue.types.ts`
- **Tests**: `apps/web/src/stores/__tests__/offlineQueue.test.ts`
- **Documentation**: `apps/web/src/stores/README_OFFLINE_QUEUE.md`
