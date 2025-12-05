/**
 * Notification Store - Example Usage
 *
 * This file demonstrates how to use the notification preferences store
 * in various scenarios throughout the application.
 */

import React from 'react';
import {
  useNotificationStore,
  useNotificationPreferences,
  useNotificationActions,
  useNotificationState,
  useIsQuietHours,
  useShouldShowSuggestion,
  usePushNotificationsAvailable,
} from './notificationStore';

// ============================================================================
// Example 1: Notification Settings Page
// ============================================================================

export function NotificationSettingsPage() {
  const preferences = useNotificationPreferences();
  const { updatePreference, requestPushPermission } = useNotificationActions();
  const { isSyncing, error } = useNotificationState();

  const handleEnablePushNotifications = async () => {
    const granted = await requestPushPermission();
    if (granted) {
      alert('Push notifications enabled!');
    } else {
      alert('Push notifications were denied. Please enable them in your browser settings.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Preferences</h2>
        <p className="text-muted-foreground">
          Control what notifications you receive and when
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Suggestion Types */}
      <section className="space-y-4">
        <h3 className="font-semibold">Suggestion Types</h3>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={preferences.showInvoiceSuggestions}
            onChange={(e) => updatePreference('showInvoiceSuggestions', e.target.checked)}
            disabled={isSyncing}
          />
          <span>Invoice suggestions</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={preferences.showExpenseSuggestions}
            onChange={(e) => updatePreference('showExpenseSuggestions', e.target.checked)}
            disabled={isSyncing}
          />
          <span>Expense suggestions</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={preferences.showTaxDeadlines}
            onChange={(e) => updatePreference('showTaxDeadlines', e.target.checked)}
            disabled={isSyncing}
          />
          <span>Tax deadline reminders</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={preferences.showBankAlerts}
            onChange={(e) => updatePreference('showBankAlerts', e.target.checked)}
            disabled={isSyncing}
          />
          <span>Bank connection alerts</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={preferences.showAIInsights}
            onChange={(e) => updatePreference('showAIInsights', e.target.checked)}
            disabled={isSyncing}
          />
          <span>AI-powered insights</span>
        </label>
      </section>

      {/* Frequency */}
      <section className="space-y-4">
        <h3 className="font-semibold">Notification Frequency</h3>

        <select
          value={preferences.suggestionFrequency}
          onChange={(e) => updatePreference('suggestionFrequency', e.target.value as any)}
          disabled={isSyncing}
          className="w-full p-2 border rounded"
        >
          <option value="realtime">Real-time</option>
          <option value="hourly">Hourly digest</option>
          <option value="daily">Daily digest</option>
          <option value="off">Off</option>
        </select>
      </section>

      {/* Quiet Hours */}
      <section className="space-y-4">
        <h3 className="font-semibold">Quiet Hours</h3>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={preferences.quietHoursEnabled}
            onChange={(e) => updatePreference('quietHoursEnabled', e.target.checked)}
            disabled={isSyncing}
          />
          <span>Enable quiet hours</span>
        </label>

        {preferences.quietHoursEnabled && (
          <div className="flex gap-4 items-center ml-7">
            <label>
              <span className="text-sm text-muted-foreground">From</span>
              <input
                type="time"
                value={preferences.quietHoursStart}
                onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                disabled={isSyncing}
                className="block w-full p-2 border rounded mt-1"
              />
            </label>
            <label>
              <span className="text-sm text-muted-foreground">To</span>
              <input
                type="time"
                value={preferences.quietHoursEnd}
                onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                disabled={isSyncing}
                className="block w-full p-2 border rounded mt-1"
              />
            </label>
          </div>
        )}
      </section>

      {/* Push Notifications */}
      <section className="space-y-4">
        <h3 className="font-semibold">Push Notifications</h3>

        {preferences.pushPermission === 'granted' ? (
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.pushEnabled}
              onChange={(e) => updatePreference('pushEnabled', e.target.checked)}
              disabled={isSyncing}
            />
            <span>Enable push notifications</span>
          </label>
        ) : preferences.pushPermission === 'denied' ? (
          <p className="text-destructive text-sm">
            Push notifications are blocked. Please enable them in your browser settings.
          </p>
        ) : (
          <button
            onClick={handleEnablePushNotifications}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Enable Push Notifications
          </button>
        )}
      </section>

      {/* Email Digests */}
      <section className="space-y-4">
        <h3 className="font-semibold">Email Digests</h3>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={preferences.emailDigestEnabled}
            onChange={(e) => updatePreference('emailDigestEnabled', e.target.checked)}
            disabled={isSyncing}
          />
          <span>Receive email digests</span>
        </label>

        {preferences.emailDigestEnabled && (
          <select
            value={preferences.emailDigestFrequency}
            onChange={(e) => updatePreference('emailDigestFrequency', e.target.value as any)}
            disabled={isSyncing}
            className="w-full p-2 border rounded ml-7"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="never">Never</option>
          </select>
        )}
      </section>

      {isSyncing && (
        <div className="text-sm text-muted-foreground">
          Saving preferences...
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 2: Conditional Suggestion Display
// ============================================================================

export function SuggestionCard({ type }: { type: 'invoice' | 'expense' | 'tax' | 'bank' | 'ai' }) {
  const shouldShow = useShouldShowSuggestion(
    type === 'invoice' ? 'showInvoiceSuggestions' :
    type === 'expense' ? 'showExpenseSuggestions' :
    type === 'tax' ? 'showTaxDeadlines' :
    type === 'bank' ? 'showBankAlerts' :
    'showAIInsights'
  );

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="p-4 border rounded bg-card">
      <h3 className="font-semibold">Suggestion</h3>
      <p className="text-sm text-muted-foreground">
        This suggestion is shown based on your notification preferences.
      </p>
    </div>
  );
}

// ============================================================================
// Example 3: Quiet Hours Indicator
// ============================================================================

export function QuietHoursIndicator() {
  const isQuietHours = useIsQuietHours();
  const preferences = useNotificationPreferences();

  if (!preferences.quietHoursEnabled) {
    return null;
  }

  return (
    <div className={`px-3 py-1 rounded-full text-xs ${
      isQuietHours
        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
        : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
    }`}>
      {isQuietHours ? (
        <>🌙 Quiet hours active</>
      ) : (
        <>✅ Notifications active</>
      )}
    </div>
  );
}

// ============================================================================
// Example 4: Push Notification Handler
// ============================================================================

export function usePushNotification() {
  const isPushAvailable = usePushNotificationsAvailable();

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!isPushAvailable) {
      console.warn('Push notifications not available');
      return;
    }

    try {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options,
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  };

  return { sendNotification, isPushAvailable };
}

// Example usage of push notification hook
export function InvoiceProcessedNotification() {
  const { sendNotification } = usePushNotification();
  const shouldShowInvoices = useShouldShowSuggestion('showInvoiceSuggestions');

  const handleInvoiceProcessed = () => {
    if (!shouldShowInvoices) return;

    sendNotification('Invoice Processed', {
      body: 'Your invoice has been successfully processed and categorized.',
      tag: 'invoice-processed',
      requireInteraction: false,
    });
  };

  return (
    <button onClick={handleInvoiceProcessed}>
      Test Invoice Notification
    </button>
  );
}

// ============================================================================
// Example 5: Load Preferences on App Mount
// ============================================================================

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { loadFromAPI } = useNotificationActions();
  const { isLoading } = useNotificationState();

  React.useEffect(() => {
    // Load preferences from API on mount
    loadFromAPI();
  }, [loadFromAPI]);

  if (isLoading) {
    return <div>Loading notification preferences...</div>;
  }

  return <>{children}</>;
}

// ============================================================================
// Example 6: Direct Store Access (for advanced use cases)
// ============================================================================

export function DirectStoreAccess() {
  const store = useNotificationStore();

  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset all notification preferences?')) {
      store.resetStore();
    }
  };

  const handleForceSync = () => {
    store.syncWithAPI();
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleForceSync}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Force Sync Now
      </button>

      <button
        onClick={handleResetAll}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Reset All Preferences
      </button>

      {store.lastSyncedAt && (
        <p className="text-sm text-muted-foreground">
          Last synced: {new Date(store.lastSyncedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Example 7: Batch Preference Updates
// ============================================================================

export function QuickPresets() {
  const { updatePreferences } = useNotificationActions();

  const applyMinimalPreset = () => {
    updatePreferences({
      showInvoiceSuggestions: false,
      showExpenseSuggestions: false,
      showTaxDeadlines: true,  // Only tax deadlines
      showBankAlerts: true,     // Only bank alerts
      showAIInsights: false,
      suggestionFrequency: 'daily',
    });
  };

  const applyMaximalPreset = () => {
    updatePreferences({
      showInvoiceSuggestions: true,
      showExpenseSuggestions: true,
      showTaxDeadlines: true,
      showBankAlerts: true,
      showAIInsights: true,
      suggestionFrequency: 'realtime',
    });
  };

  const applyWorkHoursPreset = () => {
    updatePreferences({
      quietHoursEnabled: true,
      quietHoursStart: '18:00',
      quietHoursEnd: '09:00',
    });
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Quick Presets</h3>

      <button
        onClick={applyMinimalPreset}
        className="block w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
      >
        Minimal (Only critical notifications)
      </button>

      <button
        onClick={applyMaximalPreset}
        className="block w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
      >
        Maximal (All notifications)
      </button>

      <button
        onClick={applyWorkHoursPreset}
        className="block w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
      >
        Work Hours (6pm - 9am quiet)
      </button>
    </div>
  );
}
