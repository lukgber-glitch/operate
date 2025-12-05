# Notification Center Usage Guide

## Quick Start

### Basic Implementation

```tsx
// In your layout or header component
import { NotificationBellEnhanced } from '@/components/notifications'

export function AppHeader() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>My App</h1>
      <div className="flex items-center gap-4">
        {/* Other header items */}
        <NotificationBellEnhanced />
      </div>
    </header>
  )
}
```

### Using the Hook Directly

```tsx
import { useNotifications } from '@/hooks/useNotifications'

export function CustomNotificationView() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h2>You have {unreadCount} unread notifications</h2>
      {notifications.map((notification) => (
        <div key={notification.id} onClick={() => markAsRead(notification.id)}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  )
}
```

### Using NotificationList Component

```tsx
import { NotificationList } from '@/components/notifications'
import { useNotifications } from '@/hooks/useNotifications'

export function NotificationPage() {
  const { notifications, markAsRead, deleteNotification } = useNotifications()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">All Notifications</h1>
      <NotificationList
        notifications={notifications}
        onRead={markAsRead}
        onDelete={deleteNotification}
        groupByDate={true}
        maxHeight="600px"
      />
    </div>
  )
}
```

## Notification Type Examples

### Creating Notifications (Backend)

```typescript
// Example backend notification creation
const notificationExamples = {
  invoicePaid: {
    type: 'INVOICE_PAID',
    title: 'Invoice Paid',
    message: 'Invoice #1234 has been paid by Acme Corp.',
    priority: 'MEDIUM',
    actionUrl: '/invoices/1234',
    metadata: {
      invoiceId: '1234',
      amount: 1500.00,
      clientName: 'Acme Corp',
    },
  },

  invoiceOverdue: {
    type: 'INVOICE_OVERDUE',
    title: 'Invoice Overdue',
    message: 'Invoice #5678 is 5 days overdue.',
    priority: 'URGENT',
    actionUrl: '/invoices/5678',
    metadata: {
      invoiceId: '5678',
      daysOverdue: 5,
    },
  },

  expenseApproved: {
    type: 'EXPENSE_APPROVED',
    title: 'Expense Approved',
    message: 'Your expense claim for $250.00 has been approved.',
    priority: 'MEDIUM',
    actionUrl: '/expenses/123',
    metadata: {
      expenseId: '123',
      amount: 250.00,
    },
  },

  expenseRejected: {
    type: 'EXPENSE_REJECTED',
    title: 'Expense Rejected',
    message: 'Your expense claim was rejected. Reason: Missing receipt.',
    priority: 'HIGH',
    actionUrl: '/expenses/456',
    metadata: {
      expenseId: '456',
      reason: 'Missing receipt',
    },
  },

  taskAssigned: {
    type: 'TASK_ASSIGNED',
    title: 'New Task Assigned',
    message: 'You have been assigned: Review Q4 Financial Report',
    priority: 'HIGH',
    actionUrl: '/tasks/789',
    metadata: {
      taskId: '789',
      taskName: 'Review Q4 Financial Report',
      assignedBy: 'John Doe',
    },
  },

  taxDeadline: {
    type: 'TAX_DEADLINE',
    title: 'Tax Deadline Approaching',
    message: 'VAT return due in 3 days (March 31, 2024)',
    priority: 'URGENT',
    actionUrl: '/tax/vat-returns',
    metadata: {
      deadline: '2024-03-31',
      daysRemaining: 3,
      taxType: 'VAT',
    },
  },

  clientActivity: {
    type: 'CLIENT_ACTIVITY',
    title: 'New Client Activity',
    message: 'Acme Corp uploaded 3 new documents',
    priority: 'MEDIUM',
    actionUrl: '/clients/acme-corp',
    metadata: {
      clientId: 'acme-corp',
      activityType: 'document_upload',
      count: 3,
    },
  },

  aiSuggestion: {
    type: 'AI_SUGGESTION',
    title: 'AI Recommendation',
    message: 'We detected potential duplicate expenses. Review now?',
    priority: 'LOW',
    actionUrl: '/expenses/duplicates',
    metadata: {
      suggestionType: 'duplicate_detection',
      affectedItems: ['exp-123', 'exp-456'],
    },
  },

  systemAlert: {
    type: 'SYSTEM_ALERT',
    title: 'Security Alert',
    message: 'New login from unknown device in Berlin, Germany',
    priority: 'HIGH',
    actionUrl: '/settings/security',
    metadata: {
      location: 'Berlin, Germany',
      device: 'Chrome on Windows',
      ip: '192.168.1.1',
    },
  },
}
```

## Customization

### Custom Filter

```tsx
import { NotificationCenterEnhanced } from '@/components/notifications'
import { useNotifications } from '@/hooks/useNotifications'

export function CustomNotificationCenter() {
  const { notifications, markAsRead, deleteNotification } = useNotifications()

  // Filter only urgent notifications
  const urgentNotifications = notifications.filter(
    (n) => n.priority === 'URGENT'
  )

  return (
    <div>
      <h2>Urgent Notifications ({urgentNotifications.length})</h2>
      {/* Custom implementation */}
    </div>
  )
}
```

### Custom Notification Item

```tsx
import { NotificationItemEnhanced } from '@/components/notifications'
import type { Notification } from '@/types/notifications'

export function MyNotificationItem({ notification }: { notification: Notification }) {
  return (
    <NotificationItemEnhanced
      notification={notification}
      onRead={(id) => console.log('Read:', id)}
      onDelete={(id) => console.log('Delete:', id)}
      onClick={(n) => console.log('Clicked:', n)}
    />
  )
}
```

## API Integration

### Backend Endpoints Required

```typescript
// GET /api/notifications
interface NotificationsResponse {
  data: Notification[]
  total: number
  unread: number
}

// PATCH /api/notifications/:id/read
interface MarkReadResponse {
  success: boolean
  notification: Notification
}

// PATCH /api/notifications/read-all
interface MarkAllReadResponse {
  success: boolean
  count: number
}

// DELETE /api/notifications/:id
interface DeleteResponse {
  success: boolean
}

// SSE /api/notifications/stream?token=xxx
// Sends: { data: Notification }
```

### Example Backend Implementation (NestJS)

```typescript
@Controller('notifications')
export class NotificationsController {
  @Get()
  async getNotifications(@Request() req) {
    const notifications = await this.notificationService.findAll(req.user.id)
    return notifications
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    return await this.notificationService.markAsRead(id, req.user.id)
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    return await this.notificationService.markAllAsRead(req.user.id)
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @Request() req) {
    return await this.notificationService.delete(id, req.user.id)
  }

  @Sse('stream')
  streamNotifications(@Query('token') token: string) {
    // Implement SSE stream
    return this.notificationService.createStream(token)
  }
}
```

## Testing

### Example Test Data

```typescript
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'INVOICE_PAID',
    category: 'invoice',
    title: 'Invoice Paid',
    message: 'Invoice #1234 paid by Acme Corp',
    priority: 'MEDIUM',
    isRead: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/invoices/1234',
  },
  {
    id: '2',
    type: 'TAX_DEADLINE',
    category: 'tax',
    title: 'Tax Deadline',
    message: 'VAT return due in 3 days',
    priority: 'URGENT',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    actionUrl: '/tax/vat',
  },
  // Add more test notifications...
]
```

### Component Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationBellEnhanced } from '@/components/notifications'

describe('NotificationBellEnhanced', () => {
  it('displays unread count', () => {
    render(<NotificationBellEnhanced />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('opens dropdown on click', () => {
    render(<NotificationBellEnhanced />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })
})
```

## Best Practices

1. **Keep notifications concise**: Title max 60 chars, message max 120 chars
2. **Use appropriate priority**: Reserve URGENT for critical issues only
3. **Provide actionUrl**: Always link to relevant entity
4. **Include metadata**: Store relevant IDs and data for context
5. **Clean up old notifications**: Implement auto-deletion of read notifications after 30 days
6. **Rate limit**: Don't spam users with notifications
7. **Batch similar notifications**: Group related notifications when possible
8. **Test SSE fallback**: Ensure polling works if SSE connection fails

## Troubleshooting

### Notifications not appearing
- Check localStorage for 'token'
- Verify API endpoint is correct
- Check browser console for errors
- Verify SSE connection in Network tab

### Real-time updates not working
- Ensure SSE endpoint is accessible
- Check CORS settings on backend
- Verify token is being sent correctly
- Check server logs for SSE errors

### Performance issues
- Limit notification list to 100 items
- Implement pagination for older notifications
- Use React.memo for NotificationItem
- Consider virtual scrolling for very long lists
