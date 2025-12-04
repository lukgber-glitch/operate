# Notification System

Comprehensive notification management system for Operate/CoachOS with multi-channel delivery, rate limiting, and real-time updates via SSE.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Notification System                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐      ┌─────────────────┐              │
│  │   Controller    │─────▶│    Service      │              │
│  │   (REST/SSE)    │      │  (Enhanced)     │              │
│  └─────────────────┘      └────────┬────────┘              │
│                                     │                        │
│                          ┌──────────┴──────────┐            │
│                          │                     │            │
│                   ┌──────▼──────┐      ┌──────▼──────┐     │
│                   │ Repository  │      │  Channels   │     │
│                   │  (Prisma)   │      │             │     │
│                   └─────────────┘      └──────┬──────┘     │
│                                               │            │
│                       ┌───────────────────────┼────────┐   │
│                       │                       │        │   │
│                  ┌────▼─────┐          ┌─────▼───┐  ┌─▼───┐│
│                  │  Email   │          │  Push   │  │ SSE ││
│                  │ Service  │          │ Service │  │     ││
│                  └──────────┘          └─────────┘  └─────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Core Features
- ✅ Multi-channel delivery (Email, Push, In-App/SSE)
- ✅ Rate limiting (10 notifications/hour per channel)
- ✅ User preferences management
- ✅ Do Not Disturb mode
- ✅ Quiet hours support
- ✅ Priority-based notification delivery
- ✅ Real-time notifications via Server-Sent Events (SSE)
- ✅ Automatic cleanup of old notifications
- ✅ Notification statistics and analytics

### Notification Types
- `invoice_due` - Invoice payment reminders
- `task_assigned` - Task assignment notifications
- `document_classified` - Document classification results
- `tax_deadline` - Tax deadline reminders
- `approval_needed` - Approval requests
- `fraud_alert` - Fraud detection alerts
- `system` - System-wide announcements

## API Endpoints

### Get Notifications
```http
GET /notifications?status=UNREAD&type=invoice_due&page=1&pageSize=20
```

**Query Parameters:**
- `status` - Filter by status: `UNREAD`, `READ`, `ARCHIVED`
- `type` - Filter by notification type
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "orgId": "uuid",
      "type": "invoice_due",
      "title": "Invoice Due Soon",
      "message": "Invoice INV-001 is due on 2024-07-20",
      "data": {
        "invoiceId": "uuid",
        "invoiceNumber": "INV-001",
        "dueDate": "2024-07-20T00:00:00Z",
        "amount": 1500.00
      },
      "status": "UNREAD",
      "priority": 4,
      "readAt": null,
      "createdAt": "2024-07-15T10:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "pageSize": 20
}
```

### Get Unread Count
```http
GET /notifications/unread-count
```

**Response:**
```json
{
  "count": 5
}
```

### Stream Notifications (SSE)
```http
GET /notifications/stream
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response Stream:**
```
Content-Type: text/event-stream

data: {"type":"connected","timestamp":"2024-07-15T10:00:00Z"}

data: {"id":"uuid","type":"invoice_due","title":"Invoice Due Soon","message":"...","priority":4,"createdAt":"2024-07-15T10:01:00Z"}

: keepalive
```

### Mark as Read
```http
PATCH /notifications/:id/read
```

**Response:**
```json
{
  "id": "uuid",
  "status": "READ",
  "readAt": "2024-07-15T10:05:00Z"
}
```

### Mark All as Read
```http
PATCH /notifications/read-all
```

**Response:**
```json
{
  "count": 5
}
```

### Delete Notification
```http
DELETE /notifications/:id
```

**Response:** `204 No Content`

### Get Preferences
```http
GET /notifications/preferences
```

**Response:**
```json
{
  "userId": "uuid",
  "orgId": "uuid",
  "channels": {
    "email": true,
    "push": true,
    "inApp": true
  },
  "types": {
    "invoice_due": true,
    "task_assigned": true,
    "document_classified": true,
    "tax_deadline": true,
    "approval_needed": true,
    "fraud_alert": true,
    "system": true
  },
  "doNotDisturb": false,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "updatedAt": "2024-07-15T10:00:00Z"
}
```

### Update Preferences
```http
PUT /notifications/preferences
```

**Request Body:**
```json
{
  "channels": {
    "email": true,
    "push": false
  },
  "types": {
    "document_classified": false
  },
  "doNotDisturb": false,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00"
}
```

## Usage in Other Services

### Creating Notifications

```typescript
import { NotificationsServiceEnhanced } from '../notifications/notifications.service.enhanced';

@Injectable()
export class InvoiceService {
  constructor(private notificationsService: NotificationsServiceEnhanced) {}

  async sendInvoiceDueReminder(invoice: Invoice) {
    await this.notificationsService.notifyInvoiceDue({
      userId: invoice.userId,
      orgId: invoice.orgId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      dueDate: invoice.dueDate,
      amount: invoice.total,
    });
  }
}
```

### Notification Triggers

The service provides convenience methods for common notification types:

```typescript
// Invoice due notification
await notificationsService.notifyInvoiceDue({
  userId: 'uuid',
  orgId: 'uuid',
  invoiceId: 'uuid',
  invoiceNumber: 'INV-001',
  dueDate: new Date(),
  amount: 1500.00,
});

// Task assigned notification
await notificationsService.notifyTaskAssigned({
  userId: 'uuid',
  orgId: 'uuid',
  taskId: 'uuid',
  taskTitle: 'Review Q2 Reports',
  assignedBy: 'John Doe',
});

// Document classified notification
await notificationsService.notifyDocumentClassified({
  userId: 'uuid',
  orgId: 'uuid',
  documentId: 'uuid',
  documentName: 'receipt.pdf',
  classification: 'expense',
  confidence: 0.95,
});

// Tax deadline notification
await notificationsService.notifyTaxDeadline({
  userId: 'uuid',
  orgId: 'uuid',
  deadlineType: 'VAT Return',
  deadlineDate: new Date('2024-08-10'),
  daysUntil: 5,
});
```

### Manual Notification Creation

```typescript
await notificationsService.createNotification({
  userId: 'uuid',
  orgId: 'uuid',
  type: 'custom_event',
  title: 'Custom Notification',
  message: 'Something important happened',
  data: {
    customField: 'value',
  },
  priority: 3, // 1-5, 5 being highest
});
```

## Rate Limiting

The system implements rate limiting to prevent notification spam:

- **Limit:** 10 notifications per hour per notification type per user
- **Window:** 1 hour rolling window
- **Behavior:** When limit exceeded, notifications are dropped and logged

Rate limits are tracked per:
- User ID
- Notification type
- Channel (email, push, in-app)

## Channels

### In-App (SSE)
- **Always enabled** for all users
- Real-time delivery via Server-Sent Events
- Automatic reconnection on disconnect
- Heartbeat every 30 seconds
- Dead connection cleanup every 5 minutes

### Email
- **Configurable** via environment variables
- HTML email templates with branding
- Priority-based styling
- Placeholder for integration with:
  - Nodemailer (SMTP)
  - Resend
  - AWS SES
  - SendGrid

### Push
- **Configurable** via environment variables
- Device token management
- Multicast support
- Silent data notifications
- Placeholder for integration with:
  - Firebase Cloud Messaging (FCM)
  - Apple Push Notification service (APNs)
  - Web Push API

## Notification Preferences

Users can control:

1. **Channel Preferences**
   - Enable/disable email notifications
   - Enable/disable push notifications
   - Enable/disable in-app notifications (always on)

2. **Type Preferences**
   - Enable/disable specific notification types
   - Granular control per notification category

3. **Do Not Disturb**
   - Global mute for all notifications
   - Override for critical alerts (priority 5)

4. **Quiet Hours**
   - Define time range (e.g., 22:00 - 08:00)
   - Notifications queued during quiet hours
   - Delivered after quiet hours end

## Scheduled Jobs

The service runs several scheduled tasks:

### Daily Cleanup (2 AM)
- Deletes notifications older than 30 days
- Only removes READ or ARCHIVED notifications
- Keeps UNREAD notifications indefinitely

### SSE Heartbeat (Every 30 seconds)
- Sends keep-alive to all SSE connections
- Prevents proxy/firewall timeouts

### Connection Cleanup (Every 5 minutes)
- Detects and removes dead SSE connections
- Frees server resources

## Database Schema

```prisma
model Notification {
  id        String    @id @default(uuid())
  userId    String
  orgId     String
  type      String
  title     String
  message   String
  data      Json?
  status    String    @default("UNREAD")
  priority  Int       @default(3)
  readAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([userId, status])
  @@index([orgId, type])
  @@index([createdAt])
}
```

## Environment Configuration

```env
# Notification System
NOTIFICATIONS_EMAIL_ENABLED=true
NOTIFICATIONS_PUSH_ENABLED=false

# Email Configuration (if using SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# Push Notification Configuration
FCM_SERVER_KEY=your-fcm-server-key
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-team-id
```

## Files Created

### Core Files
- `notifications.module.enhanced.ts` - Enhanced NestJS module with all dependencies
- `notifications.controller.enhanced.ts` - REST controller with SSE endpoint
- `notifications.service.enhanced.ts` - Core service with rate limiting and multi-channel delivery
- `notifications.repository.ts` - Prisma database access layer

### Channel Services
- `channels/email.service.ts` - Email notification delivery
- `channels/push.service.ts` - Push notification delivery (stub)
- `channels/in-app.service.ts` - SSE connection management
- `channels/index.ts` - Channel exports

### DTOs
- `dto/create-notification.dto.ts` - Create notification input
- `dto/notification-filter.dto.ts` - Filter and response DTOs
- `dto/notification-preferences.dto.ts` - Preference management DTOs
- `dto/index.ts` - DTO exports

### Documentation
- `README.md` - This file

## Testing

Example SSE client (JavaScript):

```javascript
const eventSource = new EventSource('/api/notifications/stream', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('Received notification:', notification);

  // Update UI with new notification
  displayNotification(notification);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  // Handle reconnection
};
```

## Future Enhancements

- [ ] Web Push implementation
- [ ] FCM/APNs integration
- [ ] Email template customization
- [ ] Notification batching (digest mode)
- [ ] Webhook notifications
- [ ] SMS notifications
- [ ] Notification analytics dashboard
- [ ] A/B testing for notification content
- [ ] ML-based notification optimization

## Support

For issues or questions, contact the backend team or refer to the main documentation.
