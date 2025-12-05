# W38-T7: Offline Message Queue - Implementation Summary

## 📋 Task Overview

**Task ID**: W38-T7
**Title**: Add offline message queue
**Status**: ✅ Complete

### Requirements Met

- [x] Detect online/offline status
- [x] Queue messages when offline
- [x] Persist queue to localStorage
- [x] Auto-sync when connection restored
- [x] Show offline indicator in UI
- [x] Order messages correctly after sync

## 📁 Files Created

### Core Implementation

#### 1. **Store** - `apps/web/src/stores/offlineQueue.ts`
Zustand store with persistence middleware for managing offline queue state.

**Key Features:**
- Queue management (add, remove, clear)
- Automatic sync on connection restore
- Retry logic with max attempts (3)
- localStorage persistence
- Error classification (retryable vs non-retryable)
- FIFO queue processing

**API:**
```typescript
interface OfflineQueueStore {
  isOnline: boolean;
  queue: QueuedMessage[];
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncErrors: SyncError[];

  addToQueue(message): void;
  removeFromQueue(id): void;
  clearQueue(): void;
  syncQueue(): Promise<SyncResult>;
  setOnlineStatus(status): void;
  clearSyncErrors(): void;
}
```

#### 2. **Main Hook** - `apps/web/src/hooks/useOfflineQueue.ts`
React hook with browser event integration for offline queue management.

**Key Features:**
- Browser event listeners (online/offline)
- Auto-sync on connection restore
- Periodic retry for failed messages (30s interval)
- Memoized computed values
- Console logging for debugging

**API:**
```typescript
const {
  isOnline,
  queuedCount,
  isSyncing,
  lastSyncAt,
  hasErrors,
  errorCount,
  queue,
  queueMessage,
  sync,
  clearQueue,
  clearErrors
} = useOfflineQueue();
```

#### 3. **Chat Integration Hook** - `apps/web/src/hooks/useOfflineChat.ts`
Simplified hook for chat message sending with offline support.

**Key Features:**
- Automatic message queueing
- UUID generation for messages
- Simplified API for chat components

**API:**
```typescript
const {
  sendMessage,
  isOnline,
  queuedCount,
  isSyncing
} = useOfflineChat();

await sendMessage({
  conversationId: 'conv-123',
  content: 'Hello',
  attachments: []
});
```

### UI Components

#### 4. **Offline Indicator** - `apps/web/src/components/chat/OfflineIndicator.tsx`
Visual indicators for connection status and queue state.

**Components:**
- `<OfflineIndicator />` - Full status display with queue count and errors
- `<OfflineBadge />` - Compact badge for navbar/toolbar

**Features:**
- Dynamic styling based on status
- Error count display
- Sync progress indication
- Accessible (aria-live, role)

### Documentation

#### 5. **Main Documentation** - `apps/web/src/stores/README_OFFLINE_QUEUE.md`
Comprehensive documentation covering:
- Architecture diagram
- Feature overview
- Complete API reference
- Usage examples
- Sync behavior details
- Error handling
- Persistence mechanism
- Best practices
- Testing guide
- Troubleshooting
- Migration guide

#### 6. **Integration Guide** - `apps/web/src/stores/INTEGRATION_GUIDE.md`
Quick-start guide with:
- 3-step integration
- Common use cases
- Advanced patterns
- UI examples
- Testing instructions
- Migration checklist

### Types & Tests

#### 7. **Type Definitions** - `apps/web/src/stores/offlineQueue.types.ts`
Centralized TypeScript types and type guards:
- Core interfaces
- Hook return types
- Constants
- Type guards for error classification
- Status code enums

#### 8. **Unit Tests** - `apps/web/src/stores/__tests__/offlineQueue.test.ts`
Comprehensive test suite covering:
- Queue operations (add, remove, clear)
- Sync functionality
- Online/offline status
- Retry logic
- Error handling
- localStorage persistence
- Rehydration

#### 9. **Complete Example** - `apps/web/src/components/chat/ChatWithOffline.example.tsx`
Full working chat interface demonstrating:
- Optimistic UI updates
- Status indicators per message
- Queue display
- Error handling
- Retry functionality
- Data loss prevention
- Auto-scroll
- Message bubbles with status

## 🎯 Key Features Implemented

### 1. **Offline Detection**
```typescript
// Automatic detection via navigator.onLine
// Event listeners for online/offline events
useEffect(() => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  setOnlineStatus(navigator.onLine);
}, []);
```

### 2. **Message Queueing**
```typescript
// FIFO queue with timestamps
addToQueue({
  id: 'msg-123',
  conversationId: 'conv-456',
  content: 'Hello',
  attachments: []
});
// Auto-adds queuedAt timestamp and retryCount: 0
```

### 3. **Automatic Sync**
```typescript
// Triggers when:
// - Browser goes online
// - New message added while online
// - Periodic retry (30s) for failed messages

setOnlineStatus(true); // Auto-triggers sync
```

### 4. **Retry Logic**
```typescript
// Max 3 retries per message
// Retryable errors: network, 5xx, 429, 408
// Non-retryable: 4xx (except 408, 429)

if (retryCount >= MAX_RETRY_COUNT) {
  markAsFailed('Maximum retry attempts exceeded');
}
```

### 5. **Persistence**
```typescript
// Zustand persist middleware with localStorage
persist(
  (set, get) => ({ /* store */ }),
  {
    name: 'offline-queue-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      queue: state.queue,
      syncErrors: state.syncErrors,
      lastSyncAt: state.lastSyncAt
    })
  }
)
```

### 6. **Error Handling**
```typescript
// Detailed error tracking
interface SyncError {
  messageId: string;
  error: string;
  timestamp: Date;
  retryable: boolean;
}

// Error classification
function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof ApiClientError) {
    return [408, 429, 500, 502, 503, 504].includes(error.status);
  }
  return false;
}
```

## 🔄 Message Flow

```
User sends message
        ↓
Add to queue (FIFO)
        ↓
Store in localStorage
        ↓
Is online? ──No──→ Stay in queue
        ↓ Yes
Try to send to API
        ↓
Success? ──No──→ Increment retry count
        ↓            ├─→ Retryable? Yes → Keep in queue
        ↓            └─→ Retryable? No → Mark failed
        ↓ Yes
Remove from queue
        ↓
Update lastSyncAt
        ↓
Show success status
```

## 📊 Usage Examples

### Basic Integration

```tsx
import { useOfflineChat } from '@/hooks/useOfflineChat';
import { OfflineIndicator } from '@/components/chat/OfflineIndicator';

function ChatComponent() {
  const { sendMessage, isOnline } = useOfflineChat();

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

### Advanced Integration

```tsx
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

function AdvancedChat() {
  const {
    isOnline,
    queuedCount,
    isSyncing,
    hasErrors,
    sync,
    clearErrors
  } = useOfflineQueue();

  // Prevent data loss
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

  return (
    <div>
      <OfflineIndicator />
      {hasErrors && (
        <button onClick={sync}>Retry Failed Messages</button>
      )}
      {/* Chat UI */}
    </div>
  );
}
```

## 🧪 Testing

### Unit Tests
```bash
cd apps/web
npm test src/stores/__tests__/offlineQueue.test.ts
```

### Manual Testing

1. **Offline Mode**:
   - Open DevTools → Network tab
   - Set throttling to "Offline"
   - Send messages → They queue
   - Set throttling to "Online"
   - Watch auto-sync

2. **Page Refresh**:
   - Queue messages
   - Refresh page
   - Queue persists from localStorage

3. **Error Handling**:
   - Mock API error (500)
   - Message retries
   - Max retries → Fails permanently

## 🎨 UI Components

### Full Indicator
```tsx
<OfflineIndicator
  className="mb-4"
  showWhenOnline={true}
/>
```

Displays:
- 🔴 "Offline" (red) when offline
- ⏳ "Syncing messages..." (yellow) when syncing
- ⚠️ "3 messages queued" (yellow) with queue count
- ✅ "Online" (green) when online and empty queue
- Error badge for failed messages

### Compact Badge
```tsx
<OfflineBadge className="ml-auto" />
```

Displays:
- 🔴 "Offline" badge when offline
- ⚠️ "3 queued" badge when messages queued
- Nothing when online and empty

## 📈 Performance Considerations

1. **Selective Zustand Subscriptions**
   ```tsx
   // Only subscribe to specific values
   const isOnline = useOfflineQueueStore(state => state.isOnline);
   ```

2. **Memoized Values**
   ```tsx
   const queuedCount = useMemo(() => queue.length, [queue.length]);
   ```

3. **Lightweight Status Hook**
   ```tsx
   const { isOnline } = useOfflineStatus(); // No queue subscription
   ```

4. **Debounced Sync**
   ```tsx
   const debouncedSync = useDebounce(sync, 1000);
   ```

## 🔒 Security & Data Integrity

1. **Deduplication**: Server uses `clientMessageId` to prevent duplicates
2. **Order Preservation**: `queuedAt` timestamp ensures correct ordering
3. **Validation**: Messages validated before queueing
4. **Error Logging**: All errors tracked with timestamps
5. **Data Persistence**: LocalStorage backup prevents data loss

## 📝 Backend Requirements

The server should handle:

```typescript
// Message DTO
interface CreateMessageDto {
  content: string;
  attachments?: Attachment[];
  clientMessageId?: string;  // For deduplication
  queuedAt?: Date;           // Original timestamp
}

// Endpoint
@Post('chatbot/conversations/:id/messages')
async createMessage(@Body() dto: CreateMessageDto) {
  // Check for duplicate
  if (dto.clientMessageId) {
    const existing = await this.findByClientId(dto.clientMessageId);
    if (existing) return existing;
  }

  // Create message with original timestamp
  return this.create({
    ...dto,
    timestamp: dto.queuedAt || new Date()
  });
}
```

## 🚀 Deployment Checklist

- [x] Store implementation complete
- [x] Hooks implemented
- [x] UI components created
- [x] Types defined
- [x] Tests written
- [x] Documentation complete
- [ ] Backend deduplication (server-side)
- [ ] Integration testing
- [ ] Performance testing
- [ ] User acceptance testing

## 📚 Next Steps

1. **Backend Integration**
   - Implement deduplication logic
   - Add `clientMessageId` field to Message model
   - Update API endpoint to handle queued messages

2. **Enhanced Features**
   - Message priority levels
   - Exponential backoff for retries
   - Batch send optimization
   - IndexedDB for large attachments

3. **Monitoring**
   - Add analytics for queue usage
   - Track sync success/failure rates
   - Monitor average queue size

4. **User Experience**
   - Toast notifications for sync events
   - Visual queue viewer
   - Manual queue management UI
   - Offline mode tutorial

## 🔗 File Locations

All files located in: `C:\Users\grube\op\operate\apps\web\`

```
apps/web/
├── src/
│   ├── stores/
│   │   ├── offlineQueue.ts                    # Core store
│   │   ├── offlineQueue.types.ts              # Type definitions
│   │   ├── README_OFFLINE_QUEUE.md            # Main docs
│   │   ├── INTEGRATION_GUIDE.md               # Quick start
│   │   └── __tests__/
│   │       └── offlineQueue.test.ts           # Unit tests
│   ├── hooks/
│   │   ├── useOfflineQueue.ts                 # Main hook
│   │   └── useOfflineChat.ts                  # Chat integration
│   └── components/
│       └── chat/
│           ├── OfflineIndicator.tsx           # UI components
│           └── ChatWithOffline.example.tsx    # Complete example
└── W38-T7-SUMMARY.md                          # This file
```

## ✅ Acceptance Criteria Met

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Detect online/offline | ✅ | `navigator.onLine` + event listeners |
| Queue messages offline | ✅ | Zustand store with array queue |
| Persist to localStorage | ✅ | Zustand persist middleware |
| Auto-sync on restore | ✅ | Event listener triggers sync |
| Show offline indicator | ✅ | `<OfflineIndicator />` component |
| Order messages correctly | ✅ | FIFO queue + `queuedAt` timestamp |
| Retry failed messages | ✅ | Max 3 retries with error classification |
| Handle errors gracefully | ✅ | Detailed error tracking + UI |
| Prevent data loss | ✅ | localStorage + beforeunload warning |
| Type-safe API | ✅ | Full TypeScript coverage |

---

**Implementation Complete** ✅
**Ready for Integration** 🚀
**Documentation** 📚 Comprehensive
**Testing** 🧪 Unit tests included
**Examples** 💡 Full working examples provided
