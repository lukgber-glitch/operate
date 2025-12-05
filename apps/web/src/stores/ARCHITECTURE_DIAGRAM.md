# Offline Queue Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Chat Input      │  │ Offline Badge    │  │ Queue Status     │  │
│  │  - Send button   │  │ - Online/Offline │  │ - Count display  │  │
│  │  - Text field    │  │ - Visual alert   │  │ - Sync progress  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│            │                     │                      │            │
└────────────┼─────────────────────┼──────────────────────┼────────────┘
             │                     │                      │
             ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         REACT HOOKS LAYER                            │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              useOfflineChat()                                 │  │
│  │  - Simplified chat message sending                           │  │
│  │  - Auto-generates message IDs                                │  │
│  │  - Returns: sendMessage(), isOnline, queuedCount             │  │
│  └──────────────────┬───────────────────────────────────────────┘  │
│                     │                                               │
│  ┌──────────────────▼───────────────────────────────────────────┐  │
│  │              useOfflineQueue()                                │  │
│  │  - Full queue management                                      │  │
│  │  - Browser event listeners                                    │  │
│  │  - Auto-sync triggers                                         │  │
│  │  - Returns: queue, sync(), queueMessage(), etc.              │  │
│  └──────────────────┬───────────────────────────────────────────┘  │
│                     │                                               │
│  ┌──────────────────▼───────────────────────────────────────────┐  │
│  │              useOfflineStatus()                               │  │
│  │  - Lightweight status only                                    │  │
│  │  - Returns: isOnline                                          │  │
│  └──────────────────┬───────────────────────────────────────────┘  │
│                     │                                               │
└─────────────────────┼───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ZUSTAND STORE LAYER                             │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         offlineQueueStore (Zustand + Persist)                │  │
│  │                                                               │  │
│  │  STATE:                          ACTIONS:                    │  │
│  │  ├─ isOnline: boolean           ├─ addToQueue()             │  │
│  │  ├─ queue: Message[]            ├─ removeFromQueue()        │  │
│  │  ├─ isSyncing: boolean          ├─ clearQueue()             │  │
│  │  ├─ lastSyncAt: Date            ├─ syncQueue()              │  │
│  │  └─ syncErrors: Error[]         └─ setOnlineStatus()        │  │
│  │                                                               │  │
│  └──────────────┬────────────────────────────┬──────────────────┘  │
│                 │                            │                      │
│                 │                            │                      │
│                 ▼                            ▼                      │
│  ┌──────────────────────────┐   ┌──────────────────────────────┐  │
│  │   Persistence Plugin     │   │   Sync Logic                 │  │
│  │   - localStorage         │   │   - FIFO processing          │  │
│  │   - Rehydration          │   │   - Retry management         │  │
│  │   - Partialize state     │   │   - Error classification     │  │
│  └──────────┬───────────────┘   └──────────────┬───────────────┘  │
│             │                                   │                   │
└─────────────┼───────────────────────────────────┼───────────────────┘
              │                                   │
              ▼                                   ▼
┌─────────────────────────┐         ┌─────────────────────────────┐
│     localStorage        │         │      API Client              │
│  - Queue persistence    │         │  - POST /messages            │
│  - Survives refresh     │         │  - Handles responses         │
│  - Error storage        │         │  - Error types               │
└─────────────────────────┘         └─────────────────────────────┘
                                                  │
                                                  ▼
                                    ┌─────────────────────────────┐
                                    │    Backend API               │
                                    │  - Deduplication             │
                                    │  - Message persistence       │
                                    │  - Response handling         │
                                    └─────────────────────────────┘
```

## Data Flow: Sending a Message

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. USER TYPES MESSAGE AND CLICKS SEND                                │
└───────────────────────────┬──────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. Component calls sendMessage()                                      │
│    const { sendMessage } = useOfflineChat()                          │
│    await sendMessage({ content, conversationId })                    │
└───────────────────────────┬──────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3. Hook generates unique ID and queues message                       │
│    const messageId = uuidv4()                                         │
│    queueMessage({ id: messageId, content, conversationId })          │
└───────────────────────────┬──────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 4. Store adds to queue with metadata                                 │
│    queue.push({                                                       │
│      ...message,                                                      │
│      queuedAt: new Date(),                                           │
│      retryCount: 0                                                   │
│    })                                                                 │
└───────────────────────────┬──────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 5. Persist to localStorage                                            │
│    localStorage.setItem('offline-queue-storage', JSON.stringify())   │
└───────────────────────────┬──────────────────────────────────────────┘
                            ▼
                    ┌───────┴────────┐
                    │                │
         Is Online? │                │ No
                    ▼                ▼
            ┌──────────┐    ┌────────────────┐
            │   YES    │    │      NO        │
            └────┬─────┘    └────────┬───────┘
                 │                   │
                 ▼                   ▼
    ┌────────────────────┐  ┌────────────────────────┐
    │ 6a. Auto-sync      │  │ 6b. Stay in queue      │
    │     triggered      │  │     Wait for online    │
    │     (100ms delay)  │  │     event              │
    └─────────┬──────────┘  └────────────────────────┘
              │
              ▼
    ┌──────────────────────────────────────┐
    │ 7. Process queue (FIFO)              │
    │    for (msg of queue) {              │
    │      try {                           │
    │        await api.post(msg)           │
    │        succeeded.push(msg.id)        │
    │      } catch (err) {                 │
    │        if (retryable) {              │
    │          msg.retryCount++            │
    │        }                             │
    │      }                               │
    │    }                                 │
    └─────────────┬────────────────────────┘
                  │
                  ▼
    ┌──────────────────────────────────────┐
    │ 8. Remove successful messages        │
    │    queue = queue.filter(not in       │
    │                 succeeded)           │
    │    lastSyncAt = new Date()           │
    └─────────────┬────────────────────────┘
                  │
                  ▼
    ┌──────────────────────────────────────┐
    │ 9. UI updates                        │
    │    - Message status: 'sent'          │
    │    - Queue count decreases           │
    │    - Offline indicator updates       │
    └──────────────────────────────────────┘
```

## State Transitions

```
┌─────────────┐
│   ONLINE    │◄──────────┐
└──────┬──────┘           │
       │                  │
       │ navigator.       │ online
       │ onLine = false   │ event
       │                  │
       ▼                  │
┌─────────────┐           │
│   OFFLINE   │───────────┘
└──────┬──────┘
       │
       │ Messages queued
       │ localStorage updated
       ▼
┌─────────────┐
│   QUEUED    │
│   MESSAGES  │
└──────┬──────┘
       │
       │ Connection restored
       │ Auto-sync triggered
       ▼
┌─────────────┐
│   SYNCING   │
└──────┬──────┘
       │
       ├────── Success ─────► Remove from queue
       │
       └────── Error ───────► Increment retry count
                               │
                               ├── Retryable ───► Keep in queue
                               │
                               └── Non-retryable ─► Mark failed
```

## Component Hierarchy

```
<ChatInterface>
│
├── <OfflineIndicator>
│   ├── useOfflineQueue()
│   └── Display: Status, Queue Count, Errors
│
├── <ChatMessages>
│   └── {messages.map(msg => <MessageBubble status={msg.status} />)}
│
├── <ChatInput>
│   ├── useOfflineChat()
│   ├── sendMessage()
│   └── Display: Queue status, Sync progress
│
└── <QueueManager> (optional admin)
    ├── useOfflineQueue()
    ├── sync()
    ├── clearQueue()
    └── Display: Queue details, Manual controls
```

## Event Flow

```
Browser Events                Store Actions              UI Updates
──────────────               ──────────────              ──────────

window.online
     │
     └──────────────────► setOnlineStatus(true)
                                   │
                                   └──────────► syncQueue()
                                                    │
                                                    └────► isOnline: true
                                                           isSyncing: true

window.offline
     │
     └──────────────────► setOnlineStatus(false)
                                   │
                                   └────────────────────► isOnline: false

User sends message
     │
     └──────────────────► addToQueue(message)
                                   │
                                   ├──────────► queue.length++
                                   │
                                   └── if online ──► syncQueue()
                                                          │
                                                          └────► isSyncing: true

Sync completes
     │
     └──────────────────────────────────────────────────► queue filtered
                                                           lastSyncAt updated
                                                           isSyncing: false

Error occurs
     │
     └──────────────────────────────────────────────────► syncErrors++
                                                           msg.retryCount++
```

## Persistence Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LIFECYCLE                         │
└─────────────────────────────────────────────────────────────────┘

Initial Load                    During Use              Before Close
─────────────                   ──────────              ────────────

1. Read localStorage       →    Queue messages    →    Warn if unsent
   └─ offlineQueue exists       ├─ Add to queue         └─ beforeunload
                                └─ Persist to LS             event

2. Rehydrate store         →    Sync when online  →    Auto-persist
   ├─ Parse JSON                ├─ Remove synced        (automatic)
   ├─ Convert dates             └─ Persist to LS
   └─ Set initial state

3. Check online status     →    Handle errors     →    Final sync attempt
   └─ navigator.onLine          ├─ Track errors         (if online)
                                └─ Persist to LS

                                                   Page Refresh
                                                   ────────────

                                                   Queue restored
                                                   Errors restored
                                                   Continue sync
```

## Error Handling Flow

```
API Request
     │
     ├────── 200 OK ──────────────────────────► Success
     │                                           Remove from queue
     │
     ├────── 4xx (400, 401, 403, 404, 422) ──► Non-Retryable Error
     │                                           Mark as failed
     │                                           Keep in queue
     │                                           Show error to user
     │
     ├────── 408, 429 ─────────────────────────► Retryable Error
     │                                           Increment retry count
     │                                           Keep in queue
     │                                           Retry later
     │
     ├────── 5xx (500, 502, 503, 504) ────────► Server Error (Retryable)
     │                                           Increment retry count
     │                                           Keep in queue
     │                                           Retry later
     │
     └────── Network Error (TypeError) ────────► Connection Error (Retryable)
                                                 Increment retry count
                                                 Keep in queue
                                                 Wait for online
```

## Retry Strategy

```
Message Added
     │
     ▼
┌─────────────┐
│ retryCount  │
│     = 0     │
└─────┬───────┘
      │
      ▼
   Attempt 1 ──── Fail (Retryable) ──► retryCount = 1
      │                                      │
      │                                      ▼
      │                                 Wait 30s
      │                                      │
      │                                      ▼
      └─────────────────────────────────► Attempt 2 ──── Fail ──► retryCount = 2
                                              │                         │
                                              │                         ▼
                                              │                    Wait 30s
                                              │                         │
                                              │                         ▼
                                              └─────────────────────► Attempt 3 ──── Fail ──► retryCount = 3
                                                                         │                         │
                                                                         │                         ▼
                                                                         │                    MAX_RETRY_COUNT
                                                                         │                    Mark as failed
                                                                         │                    (non-retryable)
                                                                         │
                                                                         ▼
                                                                       Success
                                                                    Remove from queue
```

---

**Legend:**
- `─►` Direct flow
- `└─` Conditional branch
- `├─` Multiple outcomes
- `▼` Sequential step
- `◄─` Return/Loop back
