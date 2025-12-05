# Offline Queue System - Complete Index

📦 **Task ID**: W38-T7
📅 **Created**: December 5, 2024
✅ **Status**: Complete
👤 **Agent**: PULSE (State & Data Agent)

## 📁 File Structure

```
apps/web/
├── src/
│   ├── stores/
│   │   ├── offlineQueue.ts                    # 6.8 KB - Core Zustand store
│   │   ├── offlineQueue.types.ts              # 2.8 KB - TypeScript definitions
│   │   ├── README_OFFLINE_QUEUE.md            # 12 KB - Main documentation
│   │   ├── INTEGRATION_GUIDE.md               # 8.8 KB - Quick start guide
│   │   ├── ARCHITECTURE_DIAGRAM.md            # 25 KB - Visual diagrams
│   │   ├── INDEX_OFFLINE_QUEUE.md             # This file
│   │   └── __tests__/
│   │       └── offlineQueue.test.ts           # 9.3 KB - Unit tests
│   │
│   ├── hooks/
│   │   ├── useOfflineQueue.ts                 # 4.6 KB - Main React hook
│   │   └── useOfflineChat.ts                  # 1.7 KB - Chat integration hook
│   │
│   └── components/
│       └── chat/
│           ├── OfflineIndicator.tsx           # 3.2 KB - UI components
│           └── ChatWithOffline.example.tsx    # 7.6 KB - Complete example
│
└── W38-T7-SUMMARY.md                          # 13 KB - Task summary
```

**Total**: 10 implementation files + 1 summary = **11 files**
**Total Size**: ~95 KB of code, tests, and documentation

## 🎯 Quick Links

### For Developers

| Need | File | Description |
|------|------|-------------|
| **Quick Start** | [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) | 3-step integration guide |
| **Implementation** | [offlineQueue.ts](./offlineQueue.ts) | Core store implementation |
| **Types** | [offlineQueue.types.ts](./offlineQueue.types.ts) | TypeScript definitions |
| **React Hook** | [useOfflineQueue.ts](../hooks/useOfflineQueue.ts) | Main React hook |
| **Chat Hook** | [useOfflineChat.ts](../hooks/useOfflineChat.ts) | Simplified chat integration |

### For UI/UX

| Need | File | Description |
|------|------|-------------|
| **Components** | [OfflineIndicator.tsx](../components/chat/OfflineIndicator.tsx) | Offline status indicators |
| **Full Example** | [ChatWithOffline.example.tsx](../components/chat/ChatWithOffline.example.tsx) | Complete working chat |

### For Architecture

| Need | File | Description |
|------|------|-------------|
| **Diagrams** | [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) | Visual architecture |
| **Full Docs** | [README_OFFLINE_QUEUE.md](./README_OFFLINE_QUEUE.md) | Complete documentation |

### For Testing

| Need | File | Description |
|------|------|-------------|
| **Unit Tests** | [offlineQueue.test.ts](./__tests__/offlineQueue.test.ts) | Comprehensive tests |

## 🚀 Getting Started

### 1. Quick Integration (3 Steps)

```tsx
// Step 1: Add indicator
import { OfflineIndicator } from '@/components/chat/OfflineIndicator';
<OfflineIndicator className="mb-4" />

// Step 2: Use hook
import { useOfflineChat } from '@/hooks/useOfflineChat';
const { sendMessage } = useOfflineChat();

// Step 3: Send messages
await sendMessage({
  conversationId: 'conv-123',
  content: 'Hello',
  attachments: []
});
```

**Read more**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

### 2. Advanced Usage

```tsx
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

const {
  isOnline,
  queuedCount,
  isSyncing,
  queue,
  sync,
  clearQueue
} = useOfflineQueue();
```

**Read more**: [README_OFFLINE_QUEUE.md](./README_OFFLINE_QUEUE.md)

## 📚 Documentation Index

### Core Documentation

1. **[README_OFFLINE_QUEUE.md](./README_OFFLINE_QUEUE.md)** (12 KB)
   - Architecture overview
   - Complete API reference
   - Feature descriptions
   - Sync behavior details
   - Error handling
   - Persistence mechanism
   - Best practices
   - Testing guide
   - Troubleshooting
   - Migration guide

2. **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** (8.8 KB)
   - Quick 3-step integration
   - Common use cases
   - Advanced patterns
   - UI examples
   - Testing offline mode
   - Migration checklist

3. **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** (25 KB)
   - System overview diagram
   - Data flow visualization
   - State transition diagrams
   - Component hierarchy
   - Event flow charts
   - Persistence flow
   - Error handling flow
   - Retry strategy diagram

4. **[W38-T7-SUMMARY.md](../../W38-T7-SUMMARY.md)** (13 KB)
   - Task overview
   - All files created
   - Requirements checklist
   - Implementation details
   - Usage examples
   - Deployment checklist

## 🔧 API Reference

### Store API

```typescript
// Import
import { useOfflineQueueStore } from '@/stores/offlineQueue';

// State
isOnline: boolean
queue: QueuedMessage[]
isSyncing: boolean
lastSyncAt: Date | null
syncErrors: SyncError[]

// Actions
addToQueue(message): void
removeFromQueue(id): void
clearQueue(): void
syncQueue(): Promise<SyncResult>
setOnlineStatus(status): void
clearSyncErrors(): void
```

**Docs**: [offlineQueue.ts](./offlineQueue.ts)

### Hook APIs

#### useOfflineQueue()

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

**Docs**: [useOfflineQueue.ts](../hooks/useOfflineQueue.ts)

#### useOfflineChat()

```typescript
const {
  sendMessage,
  isOnline,
  queuedCount,
  isSyncing
} = useOfflineChat();

await sendMessage({ conversationId, content, attachments });
```

**Docs**: [useOfflineChat.ts](../hooks/useOfflineChat.ts)

#### useOfflineStatus()

```typescript
const { isOnline } = useOfflineStatus();
```

**Docs**: [useOfflineQueue.ts](../hooks/useOfflineQueue.ts)

### Component APIs

#### OfflineIndicator

```tsx
<OfflineIndicator
  className="mb-4"
  showWhenOnline={true}
/>
```

**Docs**: [OfflineIndicator.tsx](../components/chat/OfflineIndicator.tsx)

#### OfflineBadge

```tsx
<OfflineBadge className="ml-auto" />
```

**Docs**: [OfflineIndicator.tsx](../components/chat/OfflineIndicator.tsx)

## 🧪 Testing

### Run Unit Tests

```bash
cd apps/web
npm test src/stores/__tests__/offlineQueue.test.ts
```

### Manual Testing

```typescript
// Simulate offline
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false
});
window.dispatchEvent(new Event('offline'));

// Simulate online
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});
window.dispatchEvent(new Event('online'));
```

**Docs**: [offlineQueue.test.ts](./__tests__/offlineQueue.test.ts)

## 📊 Features Implemented

| Feature | Status | File |
|---------|--------|------|
| Offline detection | ✅ | useOfflineQueue.ts |
| Message queueing | ✅ | offlineQueue.ts |
| localStorage persistence | ✅ | offlineQueue.ts |
| Auto-sync on reconnect | ✅ | useOfflineQueue.ts |
| Retry logic (max 3) | ✅ | offlineQueue.ts |
| Error classification | ✅ | offlineQueue.ts |
| FIFO processing | ✅ | offlineQueue.ts |
| UI indicators | ✅ | OfflineIndicator.tsx |
| TypeScript types | ✅ | offlineQueue.types.ts |
| Unit tests | ✅ | offlineQueue.test.ts |
| Documentation | ✅ | All .md files |

## 🎨 UI Components

### OfflineIndicator
Full status display with:
- Connection status
- Queue count
- Error count
- Sync progress
- Color-coded states

### OfflineBadge
Compact badge with:
- Online/offline indicator
- Queued message count
- Minimal footprint

### Example Chat
Complete implementation with:
- Message bubbles
- Status per message
- Queue display
- Error handling
- Retry UI

**See**: [ChatWithOffline.example.tsx](../components/chat/ChatWithOffline.example.tsx)

## 🔍 Code Examples

### Basic Chat Integration

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

### Advanced Queue Management

```tsx
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

function AdminPanel() {
  const {
    queue,
    sync,
    clearQueue,
    hasErrors,
    errorCount
  } = useOfflineQueue();

  return (
    <div>
      <h2>Queue Manager</h2>
      <p>Messages: {queue.length}</p>
      <button onClick={sync}>Sync Now</button>
      <button onClick={clearQueue}>Clear</button>
      {hasErrors && <p>Errors: {errorCount}</p>}
    </div>
  );
}
```

### Prevent Data Loss

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

## 🐛 Troubleshooting

| Issue | Solution | Doc |
|-------|----------|-----|
| Messages not syncing | Check `syncErrors` in store | [README](./README_OFFLINE_QUEUE.md) |
| Queue not persisting | Verify localStorage enabled | [README](./README_OFFLINE_QUEUE.md) |
| Duplicate messages | Implement server deduplication | [INTEGRATION_GUIDE](./INTEGRATION_GUIDE.md) |
| Status not updating | Check browser event listeners | [useOfflineQueue.ts](../hooks/useOfflineQueue.ts) |

## 📈 Performance Tips

1. **Selective subscriptions**
   ```tsx
   const isOnline = useOfflineQueueStore(state => state.isOnline);
   ```

2. **Lightweight status check**
   ```tsx
   const { isOnline } = useOfflineStatus();
   ```

3. **Debounce sync triggers**
   ```tsx
   const debouncedSync = useDebounce(sync, 1000);
   ```

## 🔗 Dependencies

### External
- `zustand` - State management
- `zustand/middleware` - Persist plugin
- `uuid` - Message ID generation
- `lucide-react` - Icons

### Internal
- `@/lib/api/client` - API client
- `@/lib/utils` - Utilities (cn)

## 🚀 Deployment

### Checklist

- [x] Store implementation
- [x] Hooks implemented
- [x] UI components
- [x] Types defined
- [x] Tests written
- [x] Documentation
- [ ] Backend deduplication
- [ ] Integration testing
- [ ] Performance testing
- [ ] User testing

### Backend Requirements

Server should handle `clientMessageId` for deduplication:

```typescript
@Post('conversations/:id/messages')
async createMessage(@Body() dto: CreateMessageDto) {
  if (dto.clientMessageId) {
    const existing = await this.findByClientId(dto.clientMessageId);
    if (existing) return existing;
  }
  return this.create(dto);
}
```

## 📞 Support

For questions or issues:

1. Check [README_OFFLINE_QUEUE.md](./README_OFFLINE_QUEUE.md) for detailed docs
2. Review [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for examples
3. See [ChatWithOffline.example.tsx](../components/chat/ChatWithOffline.example.tsx) for working code
4. Run tests with `npm test offlineQueue.test.ts`

## 📝 Change Log

### v1.0.0 - December 5, 2024
- ✅ Initial implementation
- ✅ Core store with Zustand
- ✅ React hooks (3 variants)
- ✅ UI components (2 variants)
- ✅ Complete documentation
- ✅ Unit tests
- ✅ TypeScript types
- ✅ Example implementation

---

**Maintained by**: PULSE (State & Data Agent)
**Last Updated**: December 5, 2024
**Version**: 1.0.0
**License**: Part of Operate/CoachOS
