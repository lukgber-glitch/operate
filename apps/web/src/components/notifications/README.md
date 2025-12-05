# Notifications Components - Quick Reference

## Components

### NotificationBell
Header bell icon with unread badge. Opens NotificationCenter on click.

```tsx
import { NotificationBell } from '@/components/notifications'

<NotificationBell />
```

### NotificationCenter
Enhanced dropdown with tabs, filters, and sorting.

```tsx
import { NotificationCenter } from '@/components/notifications'

<Popover>
  <PopoverTrigger>...</PopoverTrigger>
  <PopoverContent>
    <NotificationCenter />
  </PopoverContent>
</Popover>
```

### NotificationSettings
Comprehensive settings panel with push notification controls.

```tsx
import { NotificationSettings } from '@/components/notifications'

<NotificationSettings />
```

### PushPermissionBanner
Auto-appearing permission request banner.

```tsx
import { PushPermissionBanner } from '@/components/notifications'

<PushPermissionBanner />
```

### NotificationItem
Individual notification card (used internally).

```tsx
import { NotificationItem } from '@/components/notifications'

<NotificationItem
  notification={notification}
  onRead={markAsRead}
  onDelete={deleteNotification}
/>
```

## Hooks

### usePushNotifications
Manage push notification subscriptions.

```tsx
import { usePushNotifications } from '@/hooks/usePushNotifications'

const {
  permissionState,   // 'default' | 'granted' | 'denied'
  isSubscribed,      // boolean
  isLoading,         // boolean
  subscribe,         // () => Promise<boolean>
  unsubscribe,       // () => Promise<boolean>
  testNotification,  // () => Promise<void>
} = usePushNotifications()
```

### useNotifications
Manage notification data and preferences.

```tsx
import { useNotifications } from '@/hooks/use-notifications'

const {
  notifications,      // Notification[]
  unreadCount,        // number
  isLoading,          // boolean
  markAsRead,         // (id: string) => void
  markAllAsRead,      // () => void
  deleteNotification, // (id: string) => void
  preferences,        // NotificationPreferences
  updatePreferences,  // (prefs: Partial<NotificationPreferences>) => void
} = useNotifications()
```

## Types

```typescript
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationPreferences,
  PushPermissionState,
  PushSubscriptionData,
} from '@/types/notifications'
```

## Notification Types

- `INVOICE_DUE` - Invoice reminders
- `PAYMENT_RECEIVED` - Payment confirmations
- `TASK_ASSIGNED` - Task assignments
- `DOCUMENT_CLASSIFIED` - Document processing
- `TAX_DEADLINE` - Tax deadlines
- `SYSTEM_UPDATE` - System updates

## Priority Levels

- `LOW` - Informational
- `MEDIUM` - Standard
- `HIGH` - Important
- `URGENT` - Critical

## Pages

- `/notifications` - Full notification history
- `/settings/notifications` - Notification settings

## Common Patterns

### Add notification bell to header
```tsx
import { NotificationBell } from '@/components/notifications'

function Header() {
  return (
    <header>
      <NotificationBell />
    </header>
  )
}
```

### Add permission banner to layout
```tsx
import { PushPermissionBanner } from '@/components/notifications'

function Layout({ children }) {
  return (
    <main>
      <PushPermissionBanner />
      {children}
    </main>
  )
}
```

### Create settings page
```tsx
import { NotificationSettings } from '@/components/notifications'

export default function SettingsPage() {
  return <NotificationSettings />
}
```

## Documentation

- [Complete Implementation Guide](../../../PUSH_NOTIFICATIONS.md)
- [Task Summary](../../../TASK_W17-T5_SUMMARY.md)
- [Service Worker Guide](../../../README-SERVICE-WORKER.md)
