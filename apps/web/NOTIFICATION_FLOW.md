# Notification System Flow Diagram

## Real-Time Notification Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (NestJS)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Business Event Occurs (e.g., Invoice Due, Task Assigned)        │
│     │                                                                 │
│     ▼                                                                 │
│  ┌──────────────────────────────────────┐                           │
│  │  NotificationService.create()        │                           │
│  │  - Save to database                  │                           │
│  │  - Emit to SSE stream                │                           │
│  │  - Send email (if enabled)           │                           │
│  │  - Queue push notification           │                           │
│  └──────────────────────────────────────┘                           │
│     │                                                                 │
│     ▼                                                                 │
│  ┌──────────────────────────────────────┐                           │
│  │  SSE Stream (per user)               │                           │
│  │  GET /api/notifications/stream       │                           │
│  └──────────────────────────────────────┘                           │
│                                                                       │
└──────────────────────────│──────────────────────────────────────────┘
                           │
                           │ Server-Sent Event
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                      FRONTEND (Next.js)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  2. EventSource Connection (use-notifications.ts)                   │
│     │                                                                 │
│     ▼                                                                 │
│  ┌──────────────────────────────────────┐                           │
│  │  eventSource.onmessage               │                           │
│  │  - Parse notification data           │                           │
│  │  - Update React Query cache          │                           │
│  │  - Trigger toast notification        │                           │
│  └──────────────────────────────────────┘                           │
│     │                                                                 │
│     ├─────────────────┬──────────────────┬────────────────┐         │
│     ▼                 ▼                  ▼                ▼         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │  Cache   │  │  Badge   │  │  Dropdown     │  │  Toast       │  │
│  │  Update  │  │  Count   │  │  List         │  │  Alert       │  │
│  └──────────┘  └──────────┘  └───────────────┘  └──────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
Header
├── NotificationBell (Popover Trigger)
│   ├── Bell Icon
│   └── Unread Badge (count)
│
└── NotificationDropdown (Popover Content)
    ├── Header
    │   ├── Title: "Notifications"
    │   └── "Mark all read" Button
    │
    ├── ScrollArea (max 10 items)
    │   └── NotificationItem[] (list)
    │       ├── Icon (type-specific)
    │       ├── Title
    │       ├── Message
    │       ├── Time (relative)
    │       ├── Unread Indicator
    │       └── Actions (hover)
    │           ├── Open Link
    │           └── Delete
    │
    └── Footer
        └── "View all" Link → /notifications
```

## Full Notifications Page Structure

```
/notifications Page
├── Header
│   ├── Title + Unread Count
│   └── Action Buttons
│       ├── Settings
│       └── Mark All Read
│
├── Filters Card
│   ├── Tabs: All / Unread
│   ├── Search Input
│   ├── Type Filter Dropdown
│   └── Bulk Actions Bar (when items selected)
│       ├── Selected Count
│       └── Actions
│           ├── Mark Read
│           └── Delete
│
└── Notification List
    ├── Checkbox (bulk select)
    ├── NotificationItem[]
    └── Pagination
        ├── Page Info
        └── Previous/Next Buttons
```

## User Interaction Flow

### Receiving a New Notification

```
1. Backend Event
   ↓
2. SSE Message Received
   ↓
3. React Query Cache Updated
   ↓
4. UI Updates (all happen simultaneously)
   ├─→ Toast Appears (top-right)
   ├─→ Badge Count Increments
   ├─→ Dropdown List Updates (if open)
   └─→ Full Page Updates (if open)
```

### Marking as Read

```
User Click
   ↓
1. Optimistic Update
   ├─→ UI immediately reflects change
   ├─→ Badge count decrements
   └─→ Notification styled as read
   ↓
2. API Call: PATCH /api/notifications/:id/read
   ↓
3. On Success: Keep optimistic update
   ↓
4. On Error: Rollback to previous state
```

### Opening Notification Dropdown

```
Click Bell Icon
   ↓
1. Popover Opens
   ↓
2. Show Recent 10 Notifications
   ↓
3. If notification clicked
   ├─→ Mark as read (if unread)
   └─→ Navigate to link (if metadata.link exists)
```

## State Management Flow

```
┌─────────────────────────────────────────┐
│        React Query Cache                │
│  Key: ['notifications']                 │
├─────────────────────────────────────────┤
│                                          │
│  Data: Notification[]                   │
│  - Automatically deduplicated           │
│  - Sorted by createdAt (newest first)   │
│  - Synced across all components         │
│                                          │
└─────────────────────────────────────────┘
         ▲              │
         │              │
    Updates from:   Used by:
         │              │
    ┌────┴──────┐  ┌───▼───────────┐
    │           │  │                │
    │  SSE      │  │  Components:   │
    │  Stream   │  │  - Bell        │
    │           │  │  - Dropdown    │
    │  API      │  │  - Full Page   │
    │  Calls    │  │  - Hook        │
    │           │  │                │
    └───────────┘  └────────────────┘
```

## SSE Connection Lifecycle

```
Component Mount
   ↓
1. Check for auth token
   ↓ (if token exists)
2. Create EventSource
   `${API_URL}/api/notifications/stream?token=${token}`
   ↓
3. Connection Established
   ├─→ eventSource.onmessage: Handle notifications
   ├─→ eventSource.onerror: Log errors & close
   └─→ eventSource.onopen: Connection ready
   ↓
4. Component Unmount
   ↓
5. Close Connection
   `eventSource.close()`
```

## Error Handling Flow

```
API Error Occurs
   ↓
1. Mutation onError Hook
   ↓
2. Rollback Optimistic Update
   ├─→ Restore previous cache state
   └─→ Revert UI changes
   ↓
3. Show Error Toast (optional)
   ↓
4. Invalidate Query (refetch)
```

## Preference Management Flow

```
User Changes Preference
   ↓
1. Update UI Immediately (Switch toggles)
   ↓
2. API Call: PATCH /api/notifications/preferences
   ↓
3. On Success
   ├─→ Update cache
   ├─→ Show success toast
   └─→ Backend applies changes to future notifications
   ↓
4. On Error
   ├─→ Revert switch
   └─→ Show error toast
```

## Integration Points

### Required Backend Events

The notification system can be triggered from any backend service:

```typescript
// Example: From Invoice Service
@Injectable()
export class InvoiceService {
  constructor(
    private notificationService: NotificationService,
  ) {}

  async checkDueInvoices() {
    const dueInvoices = await this.findDueInvoices()

    for (const invoice of dueInvoices) {
      await this.notificationService.create({
        userId: invoice.userId,
        type: 'INVOICE_DUE',
        title: 'Invoice Due',
        message: `Invoice #${invoice.number} is due in 3 days`,
        priority: 'HIGH',
        metadata: {
          link: `/finance/invoices/${invoice.id}`,
          invoiceId: invoice.id,
        },
      })
    }
  }
}
```

### Required Backend Endpoints

1. **SSE Stream** - Long-lived connection
2. **List** - Get all notifications (paginated)
3. **Mark Read** - Single notification
4. **Mark All Read** - Bulk operation
5. **Delete** - Remove notification
6. **Preferences Get** - User settings
7. **Preferences Update** - Save settings

## Performance Considerations

### Client-Side
- Single SSE connection per user (not per tab)
- React Query caching reduces API calls
- Optimistic updates for instant feedback
- Pagination limits data transfer

### Server-Side
- SSE scales with concurrent users
- Consider Redis pub/sub for multi-instance
- Database indexing on userId + createdAt
- Cleanup old notifications periodically

## Security Considerations

1. **Authentication**
   - SSE requires JWT token in URL (EventSource limitation)
   - All API calls use Bearer token in header
   - Token validation on every SSE message

2. **Authorization**
   - Users only see their own notifications
   - Preferences scoped to user

3. **XSS Prevention**
   - All user content sanitized
   - React escapes content by default

4. **Rate Limiting**
   - Limit notification creation per user
   - Prevent SSE connection spam
