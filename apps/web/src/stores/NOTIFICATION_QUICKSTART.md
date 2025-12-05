# Notification Store - Quick Start Guide

Get started with the notification preferences store in 5 minutes.

## 1. Import the Store

```typescript
import {
  useNotificationPreferences,
  useNotificationActions
} from '@/stores/notificationStore';
```

## 2. Basic Usage

### Display a Setting

```typescript
function NotificationToggle() {
  const { showInvoiceSuggestions } = useNotificationPreferences();
  const { updatePreference } = useNotificationActions();

  return (
    <Switch
      checked={showInvoiceSuggestions}
      onCheckedChange={(v) => updatePreference('showInvoiceSuggestions', v)}
    />
  );
}
```

### Hide Suggestions Based on Preferences

```typescript
import { useShouldShowSuggestion } from '@/stores/notificationStore';

function InvoiceSuggestion() {
  const shouldShow = useShouldShowSuggestion('showInvoiceSuggestions');

  if (!shouldShow) return null;

  return <div>Suggested invoice action...</div>;
}
```

### Check Quiet Hours

```typescript
import { useIsQuietHours } from '@/stores/notificationStore';

function NotificationIndicator() {
  const isQuietHours = useIsQuietHours();

  return isQuietHours ? <Moon /> : <Bell />;
}
```

## 3. Load Preferences on App Start

Add to your app initialization:

```typescript
// In app/layout.tsx or _app.tsx
import { useEffect } from 'react';
import { useNotificationActions } from '@/stores/notificationStore';

export default function Layout({ children }) {
  const { loadFromAPI } = useNotificationActions();

  useEffect(() => {
    loadFromAPI();
  }, [loadFromAPI]);

  return <>{children}</>;
}
```

## 4. Available Preferences

All boolean toggles:
- `showInvoiceSuggestions`
- `showExpenseSuggestions`
- `showTaxDeadlines`
- `showBankAlerts`
- `showAIInsights`

Frequency settings:
- `suggestionFrequency`: `'realtime' | 'hourly' | 'daily' | 'off'`
- `emailDigestFrequency`: `'daily' | 'weekly' | 'never'`

Quiet hours:
- `quietHoursEnabled`: boolean
- `quietHoursStart`: string (e.g., "22:00")
- `quietHoursEnd`: string (e.g., "08:00")

Push notifications:
- `pushEnabled`: boolean
- `pushPermission`: `'granted' | 'denied' | 'default'`

## 5. Common Patterns

### Settings Page

```typescript
function NotificationSettings() {
  const prefs = useNotificationPreferences();
  const { updatePreference, requestPushPermission } = useNotificationActions();
  const { isSyncing } = useNotificationState();

  return (
    <div>
      <Switch
        checked={prefs.showInvoiceSuggestions}
        onCheckedChange={(v) => updatePreference('showInvoiceSuggestions', v)}
        disabled={isSyncing}
      />

      <Select
        value={prefs.suggestionFrequency}
        onValueChange={(v) => updatePreference('suggestionFrequency', v)}
      >
        <option value="realtime">Real-time</option>
        <option value="hourly">Hourly</option>
        <option value="daily">Daily</option>
        <option value="off">Off</option>
      </Select>

      <Button onClick={requestPushPermission}>
        Enable Push Notifications
      </Button>
    </div>
  );
}
```

### Batch Updates (Presets)

```typescript
function QuickPresets() {
  const { updatePreferences } = useNotificationActions();

  return (
    <>
      <Button onClick={() => updatePreferences({
        showInvoiceSuggestions: true,
        showExpenseSuggestions: true,
        showAIInsights: true,
        suggestionFrequency: 'realtime',
      })}>
        Enable All
      </Button>

      <Button onClick={() => updatePreferences({
        showInvoiceSuggestions: false,
        showExpenseSuggestions: false,
        showAIInsights: false,
        suggestionFrequency: 'off',
      })}>
        Disable All
      </Button>
    </>
  );
}
```

## 6. API Requirements

Your backend must implement:

**GET** `/user/notification-preferences`
```json
{
  "showInvoiceSuggestions": true,
  "showExpenseSuggestions": true,
  "suggestionFrequency": "realtime",
  // ... other preferences
}
```

**PUT** `/user/notification-preferences`
```json
{
  "showInvoiceSuggestions": false,
  "suggestionFrequency": "daily"
}
```

## 7. Auto-sync Behavior

The store automatically syncs with the API:
- ✅ 1 second debounce after changes
- ✅ Batches multiple rapid updates
- ✅ Handles errors gracefully
- ✅ Persists to localStorage

No manual sync needed unless you want it:

```typescript
const { syncWithAPI } = useNotificationActions();

// Force immediate sync
await syncWithAPI();
```

## 8. Hooks Reference

| Hook | Returns | Use Case |
|------|---------|----------|
| `useNotificationPreferences()` | All preferences | Display settings |
| `useNotificationActions()` | All actions | Update preferences |
| `useNotificationState()` | Sync state | Loading indicators |
| `useIsQuietHours()` | boolean | Check quiet hours |
| `useShouldShowSuggestion(type)` | boolean | Conditional rendering |
| `usePushNotificationsAvailable()` | boolean | Push capability check |

## 9. TypeScript Support

Full type safety:

```typescript
import type { NotificationPreferences } from '@/stores/notificationStore';

// All actions are typed
const { updatePreference } = useNotificationActions();

// ✅ Type-safe
updatePreference('showInvoiceSuggestions', true);

// ❌ TypeScript error
updatePreference('invalidKey', true);
updatePreference('showInvoiceSuggestions', 'invalid');
```

## 10. Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useNotificationStore } from '@/stores/notificationStore';

test('updates preference', () => {
  const { result } = renderHook(() => useNotificationStore());

  act(() => {
    result.current.updatePreference('showInvoiceSuggestions', false);
  });

  expect(result.current.showInvoiceSuggestions).toBe(false);
});
```

## Next Steps

1. ✅ Import the store in your component
2. ✅ Load preferences on app mount
3. ✅ Use hooks to display/update preferences
4. ✅ Implement backend API endpoints
5. ✅ Test with real data

## Need More Help?

- 📖 Full docs: `notificationStore.README.md`
- 🔗 Integration guide: `notificationStore.integration.md`
- 💡 Examples: `notificationStore.example.tsx`
- 🧪 Tests: `__tests__/notificationStore.test.ts`

## Common Issues

**Preferences not syncing?**
- Check network tab for API errors
- Verify API endpoints are implemented
- Check `error` state: `const { error } = useNotificationState()`

**Push notifications not working?**
- Must be HTTPS (localhost is OK for dev)
- Check browser support: `'Notification' in window`
- Verify permission status: `Notification.permission`

**Quiet hours not working?**
- Ensure `quietHoursEnabled` is `true`
- Time format must be "HH:MM" (24-hour)
- Overnight periods are supported (e.g., 22:00 - 08:00)

---

That's it! You're ready to use the notification preferences store. 🚀
