# Push Notification System - Implementation Guide

## Overview

The Operate/CoachOS platform now includes a comprehensive push notification system that enables real-time notifications for important business events such as invoice reminders, payment confirmations, tax deadlines, and system updates.

## Architecture

### Components

#### 1. Core Hooks

**`usePushNotifications.ts`** - Main hook for managing push notification subscriptions
- Request browser permission
- Subscribe/unsubscribe to push notifications
- Test notifications
- Track subscription status

**`useNotifications.ts`** - Manages notification data and preferences
- Fetch notifications from API
- Real-time updates via Server-Sent Events (SSE)
- Mark notifications as read/unread
- Delete notifications
- Manage notification preferences

#### 2. UI Components

**`NotificationBell.tsx`** - Header notification bell with badge
- Displays unread count
- Opens notification center on click
- Updates app badge on mobile devices

**`NotificationCenter.tsx`** - Enhanced notification dropdown
- Tabbed interface (All, Unread, Read)
- Filter by category (Invoices, Payments, Tasks, Documents, Tax, System)
- Sort by recent, priority, or unread
- Bulk actions support
- Pagination

**`NotificationSettings.tsx`** - Comprehensive settings panel
- Push notification subscription management
- Channel preferences (In-App, Email, Push)
- Do Not Disturb mode
- Quiet hours configuration
- Per-notification-type preferences

**`PushPermissionBanner.tsx`** - User-friendly permission request banner
- Appears after 3 seconds for new users
- Explains benefits of push notifications
- "Enable", "Remind later", "Don't ask again" options
- Respects user's previous dismissal

**`NotificationItem.tsx`** - Individual notification card
- Priority indicators (border color)
- Type-specific icons and colors
- Read/unread status
- Action buttons (mark read, delete, open link)

#### 3. Service Worker Integration

**`sw-custom.js`** - Custom service worker handlers
- Push event listener
- Notification click handler
- Background sync support

### Notification Types

1. **INVOICE_DUE** - Invoice reminders and overdue alerts
2. **PAYMENT_RECEIVED** - Payment confirmation notifications
3. **TASK_ASSIGNED** - Task assignment alerts
4. **DOCUMENT_CLASSIFIED** - Document processing notifications
5. **TAX_DEADLINE** - Tax filing deadline reminders
6. **SYSTEM_UPDATE** - Platform updates and maintenance notices

### Priority Levels

- **LOW** - Informational updates
- **MEDIUM** - Standard notifications
- **HIGH** - Important alerts
- **URGENT** - Critical notifications requiring immediate attention

## User Flow

### Initial Setup

1. User logs into the dashboard
2. After 3 seconds, `PushPermissionBanner` appears (if not previously dismissed)
3. User clicks "Enable notifications"
4. Browser permission dialog appears
5. On approval, system subscribes to push notifications
6. Subscription sent to backend API
7. User can now receive push notifications

### Permission States

- **default** - Not yet requested
- **granted** - Permission approved
- **denied** - Permission blocked (requires browser settings change)

### Notification Delivery Flow

1. **Backend Event** - Server detects business event (invoice due, payment received, etc.)
2. **API Call** - Backend sends notification via Web Push API
3. **Service Worker** - Receives push event and displays notification
4. **User Interaction** - User clicks notification
5. **App Navigation** - Opens relevant page in app

## API Integration

### Required Backend Endpoints

```typescript
// Get push notification configuration
GET /api/notifications/push/config
Response: { vapidPublicKey: string }

// Subscribe to push notifications
POST /api/notifications/push/subscribe
Body: {
  endpoint: string,
  keys: {
    p256dh: string,
    auth: string
  }
}

// Unsubscribe from push notifications
POST /api/notifications/push/unsubscribe

// Send test notification
POST /api/notifications/push/test

// Get all notifications
GET /api/notifications
Response: Notification[]

// Get notification preferences
GET /api/notifications/preferences
Response: NotificationPreferences

// Update notification preferences
PATCH /api/notifications/preferences
Body: Partial<NotificationPreferences>

// Mark notification as read
PATCH /api/notifications/:id/read

// Mark all notifications as read
PATCH /api/notifications/read-all

// Delete notification
DELETE /api/notifications/:id

// SSE stream for real-time notifications
GET /api/notifications/stream?token=<jwt>
```

## Configuration

### Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Browser Requirements

- Push API support
- Notification API support
- Service Worker support
- HTTPS (required for production)

### Supported Browsers

- Chrome 42+
- Firefox 44+
- Safari 16+ (macOS 13+, iOS 16.4+)
- Edge 17+

## Usage Examples

### Basic Implementation

```tsx
import { NotificationBell, PushPermissionBanner } from '@/components/notifications'

export function Layout({ children }) {
  return (
    <div>
      <header>
        <NotificationBell />
      </header>
      <main>
        <PushPermissionBanner />
        {children}
      </main>
    </div>
  )
}
```

### Using the Push Hook

```tsx
import { usePushNotifications } from '@/hooks/usePushNotifications'

function NotificationSettings() {
  const {
    permissionState,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    testNotification
  } = usePushNotifications()

  return (
    <div>
      <p>Status: {permissionState}</p>
      <button onClick={subscribe} disabled={isLoading}>
        {isSubscribed ? 'Subscribed' : 'Subscribe'}
      </button>
      {isSubscribed && (
        <button onClick={testNotification}>
          Test Notification
        </button>
      )}
    </div>
  )
}
```

### Using the Notifications Hook

```tsx
import { useNotifications } from '@/hooks/use-notifications'

function NotificationList() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    preferences,
    updatePreferences
  } = useNotifications()

  return (
    <div>
      <h2>Notifications ({unreadCount} unread)</h2>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRead={markAsRead}
          onDelete={deleteNotification}
        />
      ))}
    </div>
  )
}
```

## Features

### In-App Notifications

- Real-time updates via Server-Sent Events
- Unread badge counter
- Notification center with filtering and search
- Bulk actions (mark read, delete)
- Notification history
- Mobile app badge support

### Push Notifications

- Browser push notifications (even when app is closed)
- Priority-based notifications
- Action buttons on notifications
- Click handling to navigate to relevant pages
- Test notification functionality

### Settings & Preferences

- Enable/disable push notifications
- Per-notification-type channel preferences
- Do Not Disturb mode
- Quiet hours scheduling
- In-app, email, and push channel toggles

### User Experience

- Non-intrusive permission request banner
- Clear permission state indicators
- Helpful error messages
- Browser compatibility detection
- Graceful fallbacks

## Testing

### Test Push Notifications

1. Navigate to Settings > Notifications
2. Enable push notifications if not already enabled
3. Click "Send test notification" button
4. Verify notification appears on desktop

### Test Permission Flow

1. Open app in incognito/private window
2. Wait for permission banner to appear
3. Test all three actions:
   - Enable notifications
   - Remind me later
   - Don't ask again

### Test Notification Preferences

1. Go to Settings > Notifications
2. Toggle different notification types
3. Enable/disable different channels
4. Configure quiet hours
5. Verify changes persist after page reload

## Troubleshooting

### Push Notifications Not Working

**Issue**: No notifications received
**Solutions**:
- Check browser permissions in browser settings
- Verify VAPID keys are configured on backend
- Ensure HTTPS is enabled (required in production)
- Check service worker is active (DevTools > Application > Service Workers)
- Verify push subscription exists in database

**Issue**: Permission denied
**Solutions**:
- Clear site data and request permission again
- Check browser notification settings
- Ensure HTTPS is enabled

### Service Worker Issues

**Issue**: Service worker not registering
**Solutions**:
- Check console for errors
- Verify service worker file exists at /sw.js
- Ensure app is served over HTTPS (or localhost)
- Clear cache and hard reload

### Notification Bell Not Updating

**Issue**: Unread count not updating
**Solutions**:
- Check SSE connection in Network tab
- Verify API authentication token is valid
- Check for console errors
- Refresh the page

## Security Considerations

1. **HTTPS Required**: Push notifications require HTTPS in production
2. **Token Authentication**: All API calls require valid JWT tokens
3. **VAPID Keys**: Use secure VAPID keys for push subscriptions
4. **Permission Checks**: Always check permission state before subscribing
5. **Data Privacy**: Notification content should not include sensitive data

## Performance

- **SSE Connection**: Maintains single connection for real-time updates
- **Optimistic Updates**: UI updates immediately before API confirmation
- **Pagination**: Notification history is paginated
- **Lazy Loading**: Components load only when needed
- **Service Worker Caching**: Offline support for previously viewed notifications

## Future Enhancements

- [ ] Rich notification content with images
- [ ] Notification sound preferences
- [ ] Scheduled notifications
- [ ] Notification templates
- [ ] Analytics and tracking
- [ ] Custom notification actions
- [ ] Desktop notification persistence
- [ ] Multi-device sync
- [ ] Notification categories/folders

## Files Modified/Created

### New Files
- `apps/web/src/types/notifications.ts`
- `apps/web/src/hooks/usePushNotifications.ts`
- `apps/web/src/components/notifications/PushPermissionBanner.tsx`
- `apps/web/src/components/notifications/NotificationCenter.tsx`
- `apps/web/src/components/notifications/NotificationSettings.tsx`
- `apps/web/src/app/(dashboard)/settings/notifications/page.tsx`
- `apps/web/PUSH_NOTIFICATIONS.md`

### Modified Files
- `apps/web/src/components/notifications/NotificationBell.tsx`
- `apps/web/src/components/notifications/index.ts`
- `apps/web/src/app/(dashboard)/layout.tsx`

## Resources

- [Web Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Notification API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [VAPID Key Generation](https://github.com/web-push-libs/web-push#command-line)

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Check service worker status in DevTools
4. Verify API endpoints are working
5. Contact development team

---

**Last Updated**: 2025-12-02
**Agent**: PRISM
**Task**: W17-T5 (Push Notification UI)
