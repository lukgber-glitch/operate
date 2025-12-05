# Notification Store Integration Guide

This guide shows how the notification store integrates with other parts of the Operate application.

## Integration Points

### 1. Chat Interface Integration

The notification store works with the chat store to control suggestion visibility:

```typescript
// In chat interface component
import { useSuggestions } from '@/stores/chatStore';
import { useShouldShowSuggestion } from '@/stores/notificationStore';

function ChatSuggestions() {
  const suggestions = useSuggestions();
  const shouldShowInvoice = useShouldShowSuggestion('showInvoiceSuggestions');
  const shouldShowExpense = useShouldShowSuggestion('showExpenseSuggestions');
  const shouldShowAI = useShouldShowSuggestion('showAIInsights');

  const filteredSuggestions = suggestions.filter((suggestion) => {
    switch (suggestion.type) {
      case 'invoice':
        return shouldShowInvoice;
      case 'expense':
        return shouldShowExpense;
      case 'ai-insight':
        return shouldShowAI;
      default:
        return true;
    }
  });

  return (
    <div className="suggestions-container">
      {filteredSuggestions.map((suggestion) => (
        <SuggestionCard key={suggestion.id} suggestion={suggestion} />
      ))}
    </div>
  );
}
```

### 2. Service Worker Integration

Push notifications can be integrated with the service worker:

```typescript
// In service-worker.ts or sw.ts
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'default',
    data: data,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Operate', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle notification click
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
```

### 3. App Initialization

Load preferences when the app starts:

```typescript
// In app/layout.tsx or providers/NotificationProvider.tsx
'use client';

import { useEffect } from 'react';
import { useNotificationActions } from '@/stores/notificationStore';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { loadFromAPI } = useNotificationActions();

  useEffect(() => {
    // Load preferences from API on app mount
    loadFromAPI();
  }, [loadFromAPI]);

  return <>{children}</>;
}
```

Then wrap your app:

```typescript
// In app/layout.tsx
import { NotificationProvider } from '@/providers/NotificationProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
```

### 4. Suggestion Engine Integration

The suggestion engine can check preferences before creating suggestions:

```typescript
// In lib/suggestions/engine.ts
import { useNotificationStore } from '@/stores/notificationStore';

export class SuggestionEngine {
  async createInvoiceSuggestion(invoice: Invoice) {
    const store = useNotificationStore.getState();

    // Check if invoice suggestions are enabled
    if (!store.showInvoiceSuggestions) {
      return null;
    }

    // Check frequency
    if (store.suggestionFrequency === 'off') {
      return null;
    }

    // Check quiet hours
    if (store.quietHoursEnabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const isQuietHours = store.quietHoursStart > store.quietHoursEnd
        ? currentTime >= store.quietHoursStart || currentTime <= store.quietHoursEnd
        : currentTime >= store.quietHoursStart && currentTime <= store.quietHoursEnd;

      if (isQuietHours) {
        return null;
      }
    }

    // Create and return suggestion
    return {
      id: generateId(),
      type: 'invoice',
      title: 'New invoice suggestion',
      // ... other fields
    };
  }
}
```

### 5. Real-time Updates via WebSocket

Integrate with WebSocket for real-time preference sync:

```typescript
// In lib/websocket/client.ts
import { useNotificationStore } from '@/stores/notificationStore';
import { io } from 'socket.io-client';

export function setupNotificationSync() {
  const socket = io(process.env.NEXT_PUBLIC_WS_URL!);

  // Listen for preference updates from other devices
  socket.on('preferences:updated', (preferences) => {
    const store = useNotificationStore.getState();

    // Update local store
    store.updatePreferences(preferences);
  });

  // Send preference updates to server
  useNotificationStore.subscribe((state, prevState) => {
    // Check if preferences changed
    const preferencesChanged =
      state.showInvoiceSuggestions !== prevState.showInvoiceSuggestions ||
      state.showExpenseSuggestions !== prevState.showExpenseSuggestions ||
      state.suggestionFrequency !== prevState.suggestionFrequency;
    // ... check other fields

    if (preferencesChanged) {
      socket.emit('preferences:update', {
        showInvoiceSuggestions: state.showInvoiceSuggestions,
        showExpenseSuggestions: state.showExpenseSuggestions,
        // ... other preferences
      });
    }
  });
}
```

### 6. Backend API Integration

Example NestJS controller for notification preferences:

```typescript
// In apps/api/src/modules/user/user.controller.ts
import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('notification-preferences')
  async getNotificationPreferences(@CurrentUser() user: User) {
    return this.userService.getNotificationPreferences(user.id);
  }

  @Put('notification-preferences')
  async updateNotificationPreferences(
    @CurrentUser() user: User,
    @Body() preferences: NotificationPreferencesDto
  ) {
    await this.userService.updateNotificationPreferences(user.id, preferences);

    // Optionally broadcast to other devices via WebSocket
    this.websocketGateway.broadcastToUser(user.id, 'preferences:updated', preferences);

    return { success: true };
  }
}
```

### 7. Analytics Integration

Track preference changes for insights:

```typescript
// In lib/analytics/tracker.ts
import { useNotificationStore } from '@/stores/notificationStore';

export function setupPreferenceTracking() {
  // Subscribe to store changes
  useNotificationStore.subscribe((state, prevState) => {
    // Track preference changes
    if (state.suggestionFrequency !== prevState.suggestionFrequency) {
      trackEvent('preference_changed', {
        preference: 'suggestionFrequency',
        oldValue: prevState.suggestionFrequency,
        newValue: state.suggestionFrequency,
      });
    }

    if (state.quietHoursEnabled !== prevState.quietHoursEnabled) {
      trackEvent('preference_changed', {
        preference: 'quietHoursEnabled',
        oldValue: prevState.quietHoursEnabled,
        newValue: state.quietHoursEnabled,
      });
    }

    // Track push notification permission changes
    if (state.pushPermission !== prevState.pushPermission) {
      trackEvent('push_permission_changed', {
        permission: state.pushPermission,
      });
    }
  });
}
```

### 8. Settings Page Component

Complete settings page using the store:

```typescript
// In app/(dashboard)/settings/notifications/page.tsx
'use client';

import { useNotificationPreferences, useNotificationActions, useNotificationState } from '@/stores/notificationStore';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function NotificationSettingsPage() {
  const preferences = useNotificationPreferences();
  const { updatePreference, updatePreferences, requestPushPermission } = useNotificationActions();
  const { isSyncing, lastSyncedAt, error } = useNotificationState();

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground">
          Control what notifications you receive and when
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-destructive/10 text-destructive">
          <p>{error}</p>
        </Card>
      )}

      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Suggestion Types</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="invoice-suggestions">Invoice Suggestions</Label>
              <Switch
                id="invoice-suggestions"
                checked={preferences.showInvoiceSuggestions}
                onCheckedChange={(checked) => updatePreference('showInvoiceSuggestions', checked)}
                disabled={isSyncing}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="expense-suggestions">Expense Suggestions</Label>
              <Switch
                id="expense-suggestions"
                checked={preferences.showExpenseSuggestions}
                onCheckedChange={(checked) => updatePreference('showExpenseSuggestions', checked)}
                disabled={isSyncing}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="tax-deadlines">Tax Deadlines</Label>
              <Switch
                id="tax-deadlines"
                checked={preferences.showTaxDeadlines}
                onCheckedChange={(checked) => updatePreference('showTaxDeadlines', checked)}
                disabled={isSyncing}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="bank-alerts">Bank Alerts</Label>
              <Switch
                id="bank-alerts"
                checked={preferences.showBankAlerts}
                onCheckedChange={(checked) => updatePreference('showBankAlerts', checked)}
                disabled={isSyncing}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ai-insights">AI Insights</Label>
              <Switch
                id="ai-insights"
                checked={preferences.showAIInsights}
                onCheckedChange={(checked) => updatePreference('showAIInsights', checked)}
                disabled={isSyncing}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Frequency</h2>

          <Select
            value={preferences.suggestionFrequency}
            onValueChange={(value) => updatePreference('suggestionFrequency', value as any)}
            disabled={isSyncing}
          >
            <option value="realtime">Real-time</option>
            <option value="hourly">Hourly Digest</option>
            <option value="daily">Daily Digest</option>
            <option value="off">Off</option>
          </Select>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Quiet Hours</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
              <Switch
                id="quiet-hours"
                checked={preferences.quietHoursEnabled}
                onCheckedChange={(checked) => updatePreference('quietHoursEnabled', checked)}
                disabled={isSyncing}
              />
            </div>

            {preferences.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <Label htmlFor="quiet-start">From</Label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={preferences.quietHoursStart}
                    onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                    disabled={isSyncing}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="quiet-end">To</Label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={preferences.quietHoursEnd}
                    onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                    disabled={isSyncing}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Push Notifications</h2>

          {preferences.pushPermission === 'granted' ? (
            <div className="flex items-center justify-between">
              <Label htmlFor="push-enabled">Enable Push Notifications</Label>
              <Switch
                id="push-enabled"
                checked={preferences.pushEnabled}
                onCheckedChange={(checked) => updatePreference('pushEnabled', checked)}
                disabled={isSyncing}
              />
            </div>
          ) : preferences.pushPermission === 'denied' ? (
            <p className="text-sm text-muted-foreground">
              Push notifications are blocked. Please enable them in your browser settings.
            </p>
          ) : (
            <Button onClick={() => requestPushPermission()}>
              Enable Push Notifications
            </Button>
          )}
        </div>

        {lastSyncedAt && (
          <p className="text-xs text-muted-foreground text-right">
            Last synced: {new Date(lastSyncedAt).toLocaleString()}
          </p>
        )}
      </Card>
    </div>
  );
}
```

## Testing Integration

Example integration test:

```typescript
// In __tests__/integration/notifications.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNotificationStore } from '@/stores/notificationStore';
import { api } from '@/lib/api/client';

jest.mock('@/lib/api/client');

describe('Notification Integration', () => {
  it('should update preferences and sync with API', async () => {
    const mockPut = jest.fn().mockResolvedValue({ data: {} });
    (api.put as jest.Mock) = mockPut;

    const { result } = renderHook(() => useNotificationStore());

    // Update preference
    act(() => {
      result.current.updatePreference('showInvoiceSuggestions', false);
    });

    // Wait for debounced sync
    await waitFor(
      () => {
        expect(mockPut).toHaveBeenCalledWith(
          '/user/notification-preferences',
          expect.objectContaining({
            showInvoiceSuggestions: false,
          })
        );
      },
      { timeout: 2000 }
    );
  });
});
```

## Environment Variables

No additional environment variables needed. The store uses the standard API client which should be configured with:

```env
NEXT_PUBLIC_API_URL=https://operate.guru/api/v1
```

## Summary

The notification store integrates seamlessly with:

1. ✅ Chat system for suggestion filtering
2. ✅ Service workers for push notifications
3. ✅ App initialization for loading preferences
4. ✅ Suggestion engine for preference-aware suggestions
5. ✅ WebSocket for real-time multi-device sync
6. ✅ Backend API for persistence
7. ✅ Analytics for tracking user preferences
8. ✅ Settings UI for user control

All integration points respect the user's notification preferences and provide a consistent experience across the application.
