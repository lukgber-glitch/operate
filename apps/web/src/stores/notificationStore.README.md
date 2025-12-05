# Notification Preferences Store

A comprehensive Zustand store for managing user notification preferences with API synchronization, localStorage persistence, and browser push notification support.

## Features

- ✅ **Preference Management**: Control all notification types and settings
- ✅ **API Sync**: Automatic debounced synchronization with backend
- ✅ **Persistence**: LocalStorage persistence across sessions
- ✅ **Push Notifications**: Browser push notification integration
- ✅ **Quiet Hours**: Time-based notification suppression
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Performance**: Optimized with debouncing and selective updates
- ✅ **Convenience Hooks**: Pre-built hooks for common use cases

## Installation

The store is already set up. Import and use:

```typescript
import { useNotificationStore, useNotificationPreferences } from '@/stores/notificationStore';
```

## Preference Types

### Suggestion Types

Control which types of suggestions are shown:

- `showInvoiceSuggestions` - Invoice-related suggestions
- `showExpenseSuggestions` - Expense-related suggestions
- `showTaxDeadlines` - Tax deadline reminders
- `showBankAlerts` - Bank connection alerts
- `showAIInsights` - AI-powered insights

### Frequency Settings

- `suggestionFrequency`: `'realtime' | 'hourly' | 'daily' | 'off'`
- Controls how often suggestions are shown

### Quiet Hours

- `quietHoursEnabled`: Enable/disable quiet hours
- `quietHoursStart`: Start time (e.g., "22:00")
- `quietHoursEnd`: End time (e.g., "08:00")

### Push Notifications

- `pushEnabled`: Enable/disable push notifications
- `pushPermission`: Browser permission status (`'granted' | 'denied' | 'default'`)

### Email Digests

- `emailDigestEnabled`: Enable/disable email digests
- `emailDigestFrequency`: `'daily' | 'weekly' | 'never'`

## Basic Usage

### 1. Display Notification Settings

```typescript
import { useNotificationPreferences, useNotificationActions } from '@/stores/notificationStore';

function NotificationSettings() {
  const preferences = useNotificationPreferences();
  const { updatePreference } = useNotificationActions();

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={preferences.showInvoiceSuggestions}
          onChange={(e) => updatePreference('showInvoiceSuggestions', e.target.checked)}
        />
        Show invoice suggestions
      </label>

      <select
        value={preferences.suggestionFrequency}
        onChange={(e) => updatePreference('suggestionFrequency', e.target.value)}
      >
        <option value="realtime">Real-time</option>
        <option value="hourly">Hourly</option>
        <option value="daily">Daily</option>
        <option value="off">Off</option>
      </select>
    </div>
  );
}
```

### 2. Conditional Suggestion Display

```typescript
import { useShouldShowSuggestion } from '@/stores/notificationStore';

function InvoiceSuggestion() {
  const shouldShow = useShouldShowSuggestion('showInvoiceSuggestions');

  if (!shouldShow) return null;

  return <div>Your invoice suggestion here</div>;
}
```

### 3. Quiet Hours Detection

```typescript
import { useIsQuietHours } from '@/stores/notificationStore';

function NotificationBanner() {
  const isQuietHours = useIsQuietHours();

  return (
    <div>
      {isQuietHours ? (
        <span>🌙 Quiet hours active - notifications paused</span>
      ) : (
        <span>✅ Notifications active</span>
      )}
    </div>
  );
}
```

### 4. Push Notifications

```typescript
import { useNotificationActions, usePushNotificationsAvailable } from '@/stores/notificationStore';

function PushNotificationButton() {
  const { requestPushPermission } = useNotificationActions();
  const isPushAvailable = usePushNotificationsAvailable();

  const handleEnable = async () => {
    const granted = await requestPushPermission();
    if (granted) {
      console.log('Push notifications enabled!');
    }
  };

  if (isPushAvailable) {
    return <span>✅ Push notifications enabled</span>;
  }

  return <button onClick={handleEnable}>Enable Push Notifications</button>;
}
```

### 5. Batch Updates

```typescript
import { useNotificationActions } from '@/stores/notificationStore';

function QuickPresets() {
  const { updatePreferences } = useNotificationActions();

  const setMinimalMode = () => {
    updatePreferences({
      showInvoiceSuggestions: false,
      showExpenseSuggestions: false,
      showTaxDeadlines: true,
      showBankAlerts: true,
      showAIInsights: false,
      suggestionFrequency: 'daily',
    });
  };

  return <button onClick={setMinimalMode}>Minimal Notifications</button>;
}
```

## Advanced Usage

### Load Preferences on App Mount

```typescript
import { useEffect } from 'react';
import { useNotificationActions } from '@/stores/notificationStore';

function App() {
  const { loadFromAPI } = useNotificationActions();

  useEffect(() => {
    loadFromAPI();
  }, [loadFromAPI]);

  return <YourApp />;
}
```

### Manual Sync

```typescript
import { useNotificationActions, useNotificationState } from '@/stores/notificationStore';

function SyncButton() {
  const { syncWithAPI } = useNotificationActions();
  const { isSyncing, lastSyncedAt } = useNotificationState();

  return (
    <div>
      <button onClick={syncWithAPI} disabled={isSyncing}>
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
      {lastSyncedAt && <p>Last synced: {new Date(lastSyncedAt).toLocaleString()}</p>}
    </div>
  );
}
```

### Direct Store Access

```typescript
import { useNotificationStore } from '@/stores/notificationStore';

function AdvancedComponent() {
  const store = useNotificationStore();

  // Access all state and actions
  const handleReset = () => {
    store.resetStore();
  };

  return (
    <div>
      <p>Is syncing: {store.isSyncing ? 'Yes' : 'No'}</p>
      <p>Error: {store.error || 'None'}</p>
      <button onClick={handleReset}>Reset All</button>
    </div>
  );
}
```

## API Endpoints

The store expects the following API endpoints:

### GET `/user/notification-preferences`

Returns current user preferences.

**Response:**
```json
{
  "showInvoiceSuggestions": true,
  "showExpenseSuggestions": true,
  "showTaxDeadlines": true,
  "showBankAlerts": true,
  "showAIInsights": true,
  "suggestionFrequency": "realtime",
  "quietHoursEnabled": false,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "pushEnabled": false,
  "pushPermission": "default",
  "emailDigestEnabled": true,
  "emailDigestFrequency": "weekly"
}
```

### PUT `/user/notification-preferences`

Updates user preferences.

**Request Body:**
```json
{
  "showInvoiceSuggestions": false,
  "suggestionFrequency": "daily",
  // ... other preferences
}
```

**Response:**
```json
{
  "data": {},
  "status": 200
}
```

## Available Hooks

### `useNotificationStore()`

Direct access to the entire store.

### `useNotificationPreferences()`

Returns all notification preferences (read-only).

### `useNotificationActions()`

Returns all action functions:
- `updatePreference(key, value)`
- `updatePreferences(updates)`
- `syncWithAPI()`
- `loadFromAPI()`
- `requestPushPermission()`

### `useNotificationState()`

Returns sync state:
- `isSyncing`
- `isLoading`
- `lastSyncedAt`
- `error`

### `useIsQuietHours()`

Returns `true` if currently in quiet hours.

### `useShouldShowSuggestion(type)`

Returns `true` if a specific suggestion type should be shown (respects quiet hours and frequency).

**Parameters:**
- `type`: `'showInvoiceSuggestions' | 'showExpenseSuggestions' | 'showTaxDeadlines' | 'showBankAlerts' | 'showAIInsights'`

### `usePushNotificationsAvailable()`

Returns `true` if push notifications are available and enabled.

## Debouncing

All preference updates trigger a **debounced API sync** (1 second delay). This means:

- Multiple rapid changes only trigger one API call
- Prevents overwhelming the backend
- Provides a smoother UX

Example:
```typescript
// These 5 updates will only trigger ONE API call after 1 second
updatePreference('showInvoiceSuggestions', false);
updatePreference('showExpenseSuggestions', false);
updatePreference('showTaxDeadlines', true);
updatePreference('suggestionFrequency', 'daily');
updatePreference('quietHoursEnabled', true);
```

## Persistence

The store automatically persists to **localStorage** under the key `operate-notification-preferences`.

**What's persisted:**
- All preference values
- `lastSyncedAt` timestamp

**What's NOT persisted:**
- `isSyncing`
- `isLoading`
- `error`

## Error Handling

Errors are automatically captured and exposed via the `error` state:

```typescript
const { error } = useNotificationState();

if (error) {
  console.error('Notification preferences error:', error);
}
```

On API errors:
- The error is logged to console
- The error state is set
- The store falls back to local/default values (for `loadFromAPI`)

## Browser Compatibility

### Push Notifications

The store checks for `Notification` API support:

```typescript
if (!('Notification' in window)) {
  // Push notifications not supported
  // Store sets pushPermission to 'denied'
}
```

**Supported browsers:**
- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅ (desktop), ⚠️ (iOS requires Add to Home Screen)
- Opera: ✅

## Testing

Comprehensive test suite included in `__tests__/notificationStore.test.ts`:

- ✅ Initial state
- ✅ Single preference updates
- ✅ Batch preference updates
- ✅ API sync (success and error cases)
- ✅ Loading from API
- ✅ Push notification permission
- ✅ localStorage persistence
- ✅ Reset functionality
- ✅ Debouncing behavior

Run tests:
```bash
npm test notificationStore
```

## Migration

If you need to migrate preferences schema in the future:

```typescript
// In notificationStore.ts
{
  version: 2, // Increment version
  migrate: (persistedState: any, version: number) => {
    if (version === 1) {
      // Migrate from v1 to v2
      return {
        ...persistedState,
        newField: 'default value',
      };
    }
    return persistedState;
  },
}
```

## Examples

See `notificationStore.example.tsx` for comprehensive examples including:

1. Complete notification settings page
2. Conditional suggestion display
3. Quiet hours indicator
4. Push notification handling
5. Load preferences on mount
6. Direct store access
7. Batch preference updates (presets)

## Performance Tips

1. **Use selective hooks**: Import only what you need
   ```typescript
   // ❌ Don't do this if you only need preferences
   const store = useNotificationStore();

   // ✅ Do this instead
   const preferences = useNotificationPreferences();
   ```

2. **Batch updates**: Use `updatePreferences` for multiple changes
   ```typescript
   // ❌ Multiple calls = multiple re-renders
   updatePreference('showInvoiceSuggestions', false);
   updatePreference('showExpenseSuggestions', false);

   // ✅ Single call = single re-render
   updatePreferences({
     showInvoiceSuggestions: false,
     showExpenseSuggestions: false,
   });
   ```

3. **Manual sync control**: Disable auto-sync for bulk operations
   ```typescript
   // Update many preferences without triggering sync
   // (Currently auto-syncs; consider adding a manual mode if needed)
   ```

## Troubleshooting

### Preferences not syncing

1. Check network tab for API calls
2. Check `error` state: `const { error } = useNotificationState()`
3. Verify API endpoints are implemented
4. Check browser console for errors

### Push notifications not working

1. Check browser support: `'Notification' in window`
2. Check permission: `Notification.permission`
3. Ensure HTTPS (required for push notifications)
4. Check browser settings (notifications may be blocked)

### Quiet hours not working

1. Verify `quietHoursEnabled` is `true`
2. Check time format (must be "HH:MM")
3. Overnight ranges are supported (e.g., 22:00 - 08:00)

### LocalStorage quota exceeded

The store uses minimal space, but if issues occur:
1. Check localStorage usage
2. Consider clearing old data
3. Implement cleanup strategy if needed

## Future Enhancements

Potential improvements:

- [ ] Per-category notification sound settings
- [ ] Custom notification templates
- [ ] Notification history/log
- [ ] Smart frequency based on user activity
- [ ] Integration with service workers for background sync
- [ ] Multi-device sync status
- [ ] A/B testing for notification strategies

## License

Part of Operate/CoachOS - Internal use only.
