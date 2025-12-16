# Notification System Documentation

## Overview

The Operate notification system provides real-time, multi-channel notifications for users. It includes in-app notifications with Server-Sent Events (SSE) for real-time updates, email notifications, and push notification support.

## Architecture

### Components Structure

```
apps/web/src/
├── components/notifications/
│   ├── NotificationBell.tsx          # Bell icon with unread badge (used in header)
│   ├── NotificationDropdown.tsx      # Dropdown list of recent notifications
│   ├── NotificationItem.tsx          # Individual notification card
│   ├── NotificationPreferences.tsx   # Settings for notification preferences
│   └── index.ts                      # Barrel exports
├── hooks/
│   └── use-notifications.ts          # Core notification logic and SSE connection
├── app/(dashboard)/
│   └── notifications/
│       └── page.tsx                  # Full notifications page with filters
└── components/ui/
    └── popover.tsx                   # Radix UI Popover component
```

## Real-Time Notification Flow

### 1. SSE Connection Initialization

```typescript
// In use-notifications.ts
useEffect(() => {
  const token = localStorage.getItem('token')
  if (!token) return

  const eventSource = new EventSource(
    `${API_BASE_URL}/api/notifications/stream?token=${token}`
  )

  eventSource.onmessage = (event) => {
    const notification: Notification = JSON.parse(event.data)

    // Update React Query cache
    queryClient.setQueryData(['notifications'], (old = []) => [
      notification,
      ...old,
    ])

    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.priority === 'URGENT' ? 'destructive' : 'default',
    })
  }

  return () => eventSource.close()
}, [queryClient, toast])
```

### 2. Backend SSE Endpoint (Expected)

The frontend expects a backend endpoint at `GET /api/notifications/stream` that:

```typescript
// Expected backend endpoint
@Get('stream')
@Sse('stream')
stream(@Query('token') token: string): Observable<MessageEvent> {
  // Verify JWT token
  const user = await this.authService.verifyToken(token)

  // Create SSE stream for user
  return this.notificationService.createStream(user.id).pipe(
    map(notification => ({
      data: notification,
      id: notification.id,
      type: 'notification',
    }))
  )
}
```

### 3. Notification Event Flow

```
Backend Event → SSE Stream → Frontend EventSource → React Query Cache → UI Update → Toast
```

## Notification Types

Each notification type has specific styling and icons:

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `INVOICE_DUE` | FileText | Orange | Invoices due or overdue |
| `TASK_ASSIGNED` | CheckSquare | Blue | New task assignments |
| `DOCUMENT_CLASSIFIED` | FileSearch | Green | AI document classification |
| `TAX_DEADLINE` | Calendar | Red | Upcoming tax deadlines |
| `SYSTEM` | Bell | Gray | System updates |

## Priority Levels

Notifications have priority-based styling:

| Priority | Border Color | Behavior |
|----------|-------------|----------|
| `LOW` | Gray | Standard notification |
| `MEDIUM` | Blue | Standard notification |
| `HIGH` | Orange | Standard notification |
| `URGENT` | Red | Shows destructive toast |

## API Endpoints

### Required Backend Endpoints

#### 1. Get Notifications List
```
GET /api/notifications
Headers: Authorization: Bearer <token>
Response: Notification[]
```

#### 2. SSE Stream
```
GET /api/notifications/stream?token=<token>
Response: Server-Sent Events stream
```

#### 3. Mark as Read
```
PATCH /api/notifications/:id/read
Headers: Authorization: Bearer <token>
Response: { success: boolean }
```

#### 4. Mark All as Read
```
PATCH /api/notifications/read-all
Headers: Authorization: Bearer <token>
Response: { success: boolean }
```

#### 5. Delete Notification
```
DELETE /api/notifications/:id
Headers: Authorization: Bearer <token>
Response: { success: boolean }
```

#### 6. Get Preferences
```
GET /api/notifications/preferences
Headers: Authorization: Bearer <token>
Response: NotificationPreferences
```

#### 7. Update Preferences
```
PATCH /api/notifications/preferences
Headers: Authorization: Bearer <token>
Body: Partial<NotificationPreferences>
Response: NotificationPreferences
```

## Data Types

### Notification Interface

```typescript
interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  isRead: boolean
  metadata?: {
    link?: string        // Optional navigation link
    [key: string]: any  // Additional metadata
  }
  createdAt: string     // ISO 8601 timestamp
  readAt?: string       // ISO 8601 timestamp
}
```

### NotificationPreferences Interface

```typescript
interface NotificationPreferences {
  [notificationType: string]: {
    inApp: boolean
    email: boolean
    push: boolean
  }
  doNotDisturb: boolean
  quietHoursStart?: string    // HH:MM format
  quietHoursEnd?: string      // HH:MM format
}
```

## Usage Examples

### 1. Add NotificationBell to Header

```tsx
import { NotificationBell } from '@/components/notifications'

export function Header() {
  return (
    <header>
      {/* Other header content */}
      <NotificationBell />
    </header>
  )
}
```

### 2. Use Notification Hook

```tsx
import { useNotifications } from '@/hooks/use-notifications'

export function MyComponent() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map(notification => (
        <div key={notification.id}>
          {notification.title}
          <button onClick={() => markAsRead(notification.id)}>
            Mark Read
          </button>
        </div>
      ))}
    </div>
  )
}
```

### 3. Trigger Backend Notification

```typescript
// Backend example (NestJS)
await this.notificationService.create({
  userId: user.id,
  type: 'INVOICE_DUE',
  title: 'Invoice Overdue',
  message: `Invoice #${invoice.id} is overdue by ${days} days`,
  priority: 'HIGH',
  metadata: {
    link: `/finance/invoices/${invoice.id}`,
    invoiceId: invoice.id,
    amount: invoice.total,
  },
})
```

## Features

### 1. Real-Time Updates
- SSE connection for instant notifications
- Automatic reconnection on connection loss
- Fallback polling every 60 seconds

### 2. Optimistic Updates
- Immediate UI feedback for mark as read/delete actions
- Automatic rollback on API errors
- React Query cache synchronization

### 3. Toast Notifications
- New notifications trigger toast alerts
- Urgent notifications use destructive variant
- Dismissible toasts

### 4. Notification Management
- Mark individual notifications as read
- Mark all as read
- Delete notifications
- Filter by type and read status
- Search notifications
- Pagination (20 per page)

### 5. Preferences
- Per-type channel preferences (in-app, email, push)
- Do Not Disturb mode
- Quiet hours configuration
- Persistent backend storage

## Mobile Responsiveness

- Dropdown adjusts to screen size
- Full page optimized for mobile
- Touch-friendly interactions
- Accessible keyboard navigation

## Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- Focus management in dropdown

## Performance Considerations

1. **SSE Connection**: Single persistent connection per user
2. **Cache Strategy**: React Query handles caching and invalidation
3. **Pagination**: Only 10 notifications in dropdown, 20 on full page
4. **Optimistic Updates**: Reduces perceived latency

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Testing

### Test Scenarios

1. **Real-time delivery**: Trigger notification from backend, verify toast and badge update
2. **Mark as read**: Click notification, verify read state and unread count update
3. **Delete**: Delete notification, verify removal from list
4. **Preferences**: Toggle settings, verify persistence across sessions
5. **Connection loss**: Disconnect network, reconnect, verify catchup
6. **Multiple tabs**: Open multiple tabs, verify sync across tabs

## Troubleshooting

### SSE Connection Issues

```typescript
// Check browser console for errors
eventSource.onerror = (error) => {
  console.error('SSE Error:', error)
}
```

### CORS Issues

Ensure backend allows SSE connections:
```typescript
// Backend CORS config
app.enableCors({
  origin: 'http://localhost:3001',
  credentials: true,
})
```

### Token Expiry

SSE connection uses token from localStorage. On 401 errors:
1. Close SSE connection
2. Refresh token
3. Reconnect with new token

## Future Enhancements

1. **Push Notifications**: Web Push API integration
2. **Sound Alerts**: Optional audio notifications
3. **Rich Media**: Image/video attachments
4. **Action Buttons**: Quick actions in notifications
5. **Notification Groups**: Group related notifications
6. **Snooze**: Temporarily dismiss notifications
7. **Priority Inbox**: Separate urgent notifications

## Dependencies

- `@radix-ui/react-popover`: Dropdown component
- `@tanstack/react-query`: State management
- `lucide-react`: Icons
- `axios`: HTTP client
- Native EventSource API: SSE connection

## File Locations

All files are located at absolute paths:

- `/c/Users/grube/op/operate/apps/web/src/components/notifications/`
- `/c/Users/grube/op/operate/apps/web/src/hooks/use-notifications.ts`
- `/c/Users/grube/op/operate/apps/web/src/app/(dashboard)/notifications/page.tsx`
- `/c/Users/grube/op/operate/apps/web/src/components/ui/popover.tsx`
- `/c/Users/grube/op/operate/apps/web/src/lib/utils.ts` (updated with formatRelativeTime)
