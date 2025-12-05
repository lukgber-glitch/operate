/**
 * Notification Preferences Store - Zustand State Management
 * Manages user notification preferences with API sync and push notification handling
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api/client';
import type {
  ExtendedNotificationPreferences,
} from '@/types/notifications';
import { DEFAULT_EXTENDED_NOTIFICATION_PREFERENCES } from '@/types/notifications';

// ============================================================================
// Types
// ============================================================================

// Re-export for convenience
export type NotificationPreferences = ExtendedNotificationPreferences;

export interface NotificationStore extends NotificationPreferences {
  // Actions
  updatePreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void;
  updatePreferences: (updates: Partial<NotificationPreferences>) => void;
  syncWithAPI: () => Promise<void>;
  loadFromAPI: () => Promise<void>;
  requestPushPermission: () => Promise<boolean>;

  // State
  isSyncing: boolean;
  isLoading: boolean;
  lastSyncedAt: Date | null;
  error: string | null;

  // Internal
  resetStore: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const defaultPreferences: NotificationPreferences = DEFAULT_EXTENDED_NOTIFICATION_PREFERENCES;

const initialState = {
  ...defaultPreferences,
  isSyncing: false,
  isLoading: false,
  lastSyncedAt: null,
  error: null,
};

// ============================================================================
// Debounce Helper
// ============================================================================

let syncTimeout: NodeJS.Timeout | null = null;

const debouncedSync = (syncFn: () => Promise<void>, delay = 1000) => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    syncFn();
  }, delay);
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useNotificationStore = create<NotificationStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      ...initialState,

      // ========== Actions ==========

      /**
       * Update a single preference
       * Automatically triggers debounced API sync
       */
      updatePreference: (key, value) => {
        set((state) => {
          (state as any)[key] = value;
          state.error = null;
        });

        // Debounced API sync
        debouncedSync(() => get().syncWithAPI());
      },

      /**
       * Update multiple preferences at once
       * Automatically triggers debounced API sync
       */
      updatePreferences: (updates) => {
        set((state) => {
          Object.entries(updates).forEach(([key, value]) => {
            (state as any)[key] = value;
          });
          state.error = null;
        });

        // Debounced API sync
        debouncedSync(() => get().syncWithAPI());
      },

      /**
       * Sync preferences with API
       */
      syncWithAPI: async () => {
        const state = get();

        // Don't sync if already syncing
        if (state.isSyncing) return;

        set((state) => {
          state.isSyncing = true;
          state.error = null;
        });

        try {
          const preferences: NotificationPreferences = {
            showInvoiceSuggestions: state.showInvoiceSuggestions,
            showExpenseSuggestions: state.showExpenseSuggestions,
            showTaxDeadlines: state.showTaxDeadlines,
            showBankAlerts: state.showBankAlerts,
            showAIInsights: state.showAIInsights,
            suggestionFrequency: state.suggestionFrequency,
            quietHoursEnabled: state.quietHoursEnabled,
            quietHoursStart: state.quietHoursStart,
            quietHoursEnd: state.quietHoursEnd,
            pushEnabled: state.pushEnabled,
            pushPermission: state.pushPermission,
            emailDigestEnabled: state.emailDigestEnabled,
            emailDigestFrequency: state.emailDigestFrequency,
          };

          await api.put('/user/notification-preferences', preferences);

          set((state) => {
            state.lastSyncedAt = new Date();
            state.isSyncing = false;
          });
        } catch (error) {
          console.error('Failed to sync notification preferences:', error);

          set((state) => {
            state.error = error instanceof Error
              ? error.message
              : 'Failed to sync notification preferences';
            state.isSyncing = false;
          });
        }
      },

      /**
       * Load preferences from API
       */
      loadFromAPI: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await api.get<NotificationPreferences>(
            '/user/notification-preferences'
          );

          set((state) => {
            // Update all preference fields
            Object.entries(response.data).forEach(([key, value]) => {
              if (key in defaultPreferences) {
                (state as any)[key] = value;
              }
            });

            state.lastSyncedAt = new Date();
            state.isLoading = false;
          });
        } catch (error) {
          console.error('Failed to load notification preferences:', error);

          set((state) => {
            state.error = error instanceof Error
              ? error.message
              : 'Failed to load notification preferences';
            state.isLoading = false;
          });

          // Fall back to default preferences on error
          set((state) => {
            Object.entries(defaultPreferences).forEach(([key, value]) => {
              (state as any)[key] = value;
            });
          });
        }
      },

      /**
       * Request push notification permission
       * Returns true if granted, false otherwise
       */
      requestPushPermission: async () => {
        // Check if Notification API is supported
        if (!('Notification' in window)) {
          console.warn('Push notifications not supported in this browser');

          set((state) => {
            state.pushPermission = 'denied';
            state.pushEnabled = false;
          });

          return false;
        }

        // Check current permission
        if (Notification.permission === 'granted') {
          set((state) => {
            state.pushPermission = 'granted';
            state.pushEnabled = true;
          });

          // Trigger API sync
          debouncedSync(() => get().syncWithAPI());

          return true;
        }

        if (Notification.permission === 'denied') {
          set((state) => {
            state.pushPermission = 'denied';
            state.pushEnabled = false;
          });

          return false;
        }

        // Request permission
        try {
          const permission = await Notification.requestPermission();

          set((state) => {
            state.pushPermission = permission;
            state.pushEnabled = permission === 'granted';
          });

          // Trigger API sync
          debouncedSync(() => get().syncWithAPI());

          return permission === 'granted';
        } catch (error) {
          console.error('Failed to request push notification permission:', error);

          set((state) => {
            state.pushPermission = 'denied';
            state.pushEnabled = false;
          });

          return false;
        }
      },

      /**
       * Reset store to default state
       */
      resetStore: () => set(initialState),
    })),
    {
      name: 'operate-notification-preferences', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist all preferences
        showInvoiceSuggestions: state.showInvoiceSuggestions,
        showExpenseSuggestions: state.showExpenseSuggestions,
        showTaxDeadlines: state.showTaxDeadlines,
        showBankAlerts: state.showBankAlerts,
        showAIInsights: state.showAIInsights,
        suggestionFrequency: state.suggestionFrequency,
        quietHoursEnabled: state.quietHoursEnabled,
        quietHoursStart: state.quietHoursStart,
        quietHoursEnd: state.quietHoursEnd,
        pushEnabled: state.pushEnabled,
        pushPermission: state.pushPermission,
        emailDigestEnabled: state.emailDigestEnabled,
        emailDigestFrequency: state.emailDigestFrequency,
        lastSyncedAt: state.lastSyncedAt,
        // Don't persist loading/syncing state or errors
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migrations if schema changes in the future
        if (version === 0) {
          // Migration from v0 to v1 (example)
          return {
            ...defaultPreferences,
            ...persistedState,
          };
        }
        return persistedState;
      },
    }
  )
);

// ============================================================================
// Typed Hooks for Convenience
// ============================================================================

/**
 * Hook to get all notification preferences
 */
export const useNotificationPreferences = () =>
  useNotificationStore((state) => ({
    showInvoiceSuggestions: state.showInvoiceSuggestions,
    showExpenseSuggestions: state.showExpenseSuggestions,
    showTaxDeadlines: state.showTaxDeadlines,
    showBankAlerts: state.showBankAlerts,
    showAIInsights: state.showAIInsights,
    suggestionFrequency: state.suggestionFrequency,
    quietHoursEnabled: state.quietHoursEnabled,
    quietHoursStart: state.quietHoursStart,
    quietHoursEnd: state.quietHoursEnd,
    pushEnabled: state.pushEnabled,
    pushPermission: state.pushPermission,
    emailDigestEnabled: state.emailDigestEnabled,
    emailDigestFrequency: state.emailDigestFrequency,
  }));

/**
 * Hook to get notification actions
 */
export const useNotificationActions = () =>
  useNotificationStore((state) => ({
    updatePreference: state.updatePreference,
    updatePreferences: state.updatePreferences,
    syncWithAPI: state.syncWithAPI,
    loadFromAPI: state.loadFromAPI,
    requestPushPermission: state.requestPushPermission,
  }));

/**
 * Hook to get notification state
 */
export const useNotificationState = () =>
  useNotificationStore((state) => ({
    isSyncing: state.isSyncing,
    isLoading: state.isLoading,
    lastSyncedAt: state.lastSyncedAt,
    error: state.error,
  }));

/**
 * Hook to check if currently in quiet hours
 */
export const useIsQuietHours = () => {
  const { quietHoursEnabled, quietHoursStart, quietHoursEnd } = useNotificationPreferences();

  if (!quietHoursEnabled) return false;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (quietHoursStart > quietHoursEnd) {
    return currentTime >= quietHoursStart || currentTime <= quietHoursEnd;
  }

  // Handle same-day quiet hours (e.g., 13:00 - 14:00)
  return currentTime >= quietHoursStart && currentTime <= quietHoursEnd;
};

/**
 * Hook to check if a specific suggestion type should be shown
 */
export const useShouldShowSuggestion = (type: keyof Pick<
  NotificationPreferences,
  'showInvoiceSuggestions' | 'showExpenseSuggestions' | 'showTaxDeadlines' | 'showBankAlerts' | 'showAIInsights'
>) => {
  const preferences = useNotificationPreferences();
  const isQuietHours = useIsQuietHours();

  // Don't show during quiet hours
  if (isQuietHours) return false;

  // Check if frequency is off
  if (preferences.suggestionFrequency === 'off') return false;

  // Check specific preference
  return preferences[type];
};

/**
 * Hook to check if push notifications are available and enabled
 */
export const usePushNotificationsAvailable = () => {
  const { pushEnabled, pushPermission } = useNotificationPreferences();

  return (
    'Notification' in window &&
    pushPermission === 'granted' &&
    pushEnabled
  );
};
