/**
 * Notification Store Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotificationStore } from '../notificationStore';
import { api } from '@/lib/api/client';

// Mock the API client
jest.mock('@/lib/api/client', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Notification API
const notificationMock = {
  permission: 'default' as NotificationPermission,
  requestPermission: jest.fn(),
};

Object.defineProperty(window, 'Notification', {
  value: notificationMock,
  writable: true,
});

describe('notificationStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();

    // Reset mocks
    jest.clearAllMocks();

    // Reset Notification permission
    notificationMock.permission = 'default';
    notificationMock.requestPermission.mockResolvedValue('default' as NotificationPermission);

    // Reset store
    const { result } = renderHook(() => useNotificationStore());
    act(() => {
      result.current.resetStore();
    });
  });

  describe('Initial State', () => {
    it('should initialize with default preferences', () => {
      const { result } = renderHook(() => useNotificationStore());

      expect(result.current.showInvoiceSuggestions).toBe(true);
      expect(result.current.showExpenseSuggestions).toBe(true);
      expect(result.current.showTaxDeadlines).toBe(true);
      expect(result.current.showBankAlerts).toBe(true);
      expect(result.current.showAIInsights).toBe(true);
      expect(result.current.suggestionFrequency).toBe('realtime');
      expect(result.current.quietHoursEnabled).toBe(false);
      expect(result.current.quietHoursStart).toBe('22:00');
      expect(result.current.quietHoursEnd).toBe('08:00');
      expect(result.current.pushEnabled).toBe(false);
      expect(result.current.pushPermission).toBe('default');
      expect(result.current.emailDigestEnabled).toBe(true);
      expect(result.current.emailDigestFrequency).toBe('weekly');
    });

    it('should initialize state flags correctly', () => {
      const { result } = renderHook(() => useNotificationStore());

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastSyncedAt).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('updatePreference', () => {
    it('should update a single preference', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.updatePreference('showInvoiceSuggestions', false);
      });

      expect(result.current.showInvoiceSuggestions).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should update quiet hours settings', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.updatePreference('quietHoursEnabled', true);
        result.current.updatePreference('quietHoursStart', '20:00');
        result.current.updatePreference('quietHoursEnd', '07:00');
      });

      expect(result.current.quietHoursEnabled).toBe(true);
      expect(result.current.quietHoursStart).toBe('20:00');
      expect(result.current.quietHoursEnd).toBe('07:00');
    });

    it('should trigger debounced API sync', async () => {
      const mockPut = jest.fn().mockResolvedValue({ data: {} });
      (api.put as jest.Mock) = mockPut;

      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.updatePreference('showInvoiceSuggestions', false);
      });

      // Wait for debounce (1 second)
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

  describe('updatePreferences', () => {
    it('should update multiple preferences at once', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.updatePreferences({
          showInvoiceSuggestions: false,
          showExpenseSuggestions: false,
          suggestionFrequency: 'daily',
        });
      });

      expect(result.current.showInvoiceSuggestions).toBe(false);
      expect(result.current.showExpenseSuggestions).toBe(false);
      expect(result.current.suggestionFrequency).toBe('daily');
    });

    it('should clear error when updating preferences', () => {
      const { result } = renderHook(() => useNotificationStore());

      // Set an error first
      act(() => {
        result.current.setError?.('Test error');
      });

      act(() => {
        result.current.updatePreferences({
          showInvoiceSuggestions: false,
        });
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('syncWithAPI', () => {
    it('should sync preferences with API successfully', async () => {
      const mockPut = jest.fn().mockResolvedValue({ data: {} });
      (api.put as jest.Mock) = mockPut;

      const { result } = renderHook(() => useNotificationStore());

      await act(async () => {
        await result.current.syncWithAPI();
      });

      expect(mockPut).toHaveBeenCalledWith(
        '/user/notification-preferences',
        expect.objectContaining({
          showInvoiceSuggestions: true,
          showExpenseSuggestions: true,
          suggestionFrequency: 'realtime',
        })
      );

      expect(result.current.lastSyncedAt).not.toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle API sync errors', async () => {
      const mockError = new Error('Network error');
      const mockPut = jest.fn().mockRejectedValue(mockError);
      (api.put as jest.Mock) = mockPut;

      const { result } = renderHook(() => useNotificationStore());

      await act(async () => {
        await result.current.syncWithAPI();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isSyncing).toBe(false);
    });

    it('should not sync if already syncing', async () => {
      const mockPut = jest.fn().mockResolvedValue({ data: {} });
      (api.put as jest.Mock) = mockPut;

      const { result } = renderHook(() => useNotificationStore());

      // Start first sync (don't await)
      act(() => {
        result.current.syncWithAPI();
      });

      // Try to start second sync immediately
      await act(async () => {
        await result.current.syncWithAPI();
      });

      // Should only call API once
      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('loadFromAPI', () => {
    it('should load preferences from API successfully', async () => {
      const mockPreferences = {
        showInvoiceSuggestions: false,
        showExpenseSuggestions: true,
        suggestionFrequency: 'hourly' as const,
        quietHoursEnabled: true,
        quietHoursStart: '23:00',
        quietHoursEnd: '07:00',
        pushEnabled: true,
        pushPermission: 'granted' as const,
        emailDigestEnabled: false,
        emailDigestFrequency: 'never' as const,
      };

      const mockGet = jest.fn().mockResolvedValue({ data: mockPreferences });
      (api.get as jest.Mock) = mockGet;

      const { result } = renderHook(() => useNotificationStore());

      await act(async () => {
        await result.current.loadFromAPI();
      });

      expect(mockGet).toHaveBeenCalledWith('/user/notification-preferences');

      expect(result.current.showInvoiceSuggestions).toBe(false);
      expect(result.current.suggestionFrequency).toBe('hourly');
      expect(result.current.quietHoursEnabled).toBe(true);
      expect(result.current.quietHoursStart).toBe('23:00');
      expect(result.current.pushEnabled).toBe(true);
      expect(result.current.emailDigestFrequency).toBe('never');

      expect(result.current.lastSyncedAt).not.toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle API load errors and fallback to defaults', async () => {
      const mockError = new Error('Failed to load');
      const mockGet = jest.fn().mockRejectedValue(mockError);
      (api.get as jest.Mock) = mockGet;

      const { result } = renderHook(() => useNotificationStore());

      await act(async () => {
        await result.current.loadFromAPI();
      });

      expect(result.current.error).toBe('Failed to load');

      // Should fallback to defaults
      expect(result.current.showInvoiceSuggestions).toBe(true);
      expect(result.current.suggestionFrequency).toBe('realtime');
    });
  });

  describe('requestPushPermission', () => {
    it('should request and grant push permission', async () => {
      notificationMock.requestPermission.mockResolvedValue('granted');

      const { result } = renderHook(() => useNotificationStore());

      let granted = false;
      await act(async () => {
        granted = await result.current.requestPushPermission();
      });

      expect(granted).toBe(true);
      expect(result.current.pushPermission).toBe('granted');
      expect(result.current.pushEnabled).toBe(true);
    });

    it('should handle denied push permission', async () => {
      notificationMock.permission = 'denied';

      const { result } = renderHook(() => useNotificationStore());

      let granted = false;
      await act(async () => {
        granted = await result.current.requestPushPermission();
      });

      expect(granted).toBe(false);
      expect(result.current.pushPermission).toBe('denied');
      expect(result.current.pushEnabled).toBe(false);
    });

    it('should return true if permission already granted', async () => {
      notificationMock.permission = 'granted';

      const { result } = renderHook(() => useNotificationStore());

      let granted = false;
      await act(async () => {
        granted = await result.current.requestPushPermission();
      });

      expect(granted).toBe(true);
      expect(notificationMock.requestPermission).not.toHaveBeenCalled();
    });

    it('should handle browsers without Notification API', async () => {
      // Remove Notification API
      const originalNotification = window.Notification;
      // @ts-ignore
      delete window.Notification;

      const { result } = renderHook(() => useNotificationStore());

      let granted = false;
      await act(async () => {
        granted = await result.current.requestPushPermission();
      });

      expect(granted).toBe(false);
      expect(result.current.pushPermission).toBe('denied');
      expect(result.current.pushEnabled).toBe(false);

      // Restore
      window.Notification = originalNotification;
    });
  });

  describe('Persistence', () => {
    it('should persist preferences to localStorage', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.updatePreference('showInvoiceSuggestions', false);
        result.current.updatePreference('suggestionFrequency', 'daily');
      });

      // Check localStorage
      const stored = localStorageMock.getItem('operate-notification-preferences');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.showInvoiceSuggestions).toBe(false);
      expect(parsed.state.suggestionFrequency).toBe('daily');
    });

    it('should restore preferences from localStorage', () => {
      // Set initial preferences
      const { result: result1 } = renderHook(() => useNotificationStore());

      act(() => {
        result1.current.updatePreference('showInvoiceSuggestions', false);
        result1.current.updatePreference('quietHoursEnabled', true);
      });

      // Create new hook instance (simulates page reload)
      const { result: result2 } = renderHook(() => useNotificationStore());

      expect(result2.current.showInvoiceSuggestions).toBe(false);
      expect(result2.current.quietHoursEnabled).toBe(true);
    });

    it('should not persist loading/syncing state', () => {
      const { result } = renderHook(() => useNotificationStore());

      // Manually set loading state (simulating an ongoing operation)
      act(() => {
        // @ts-ignore - accessing internal state for testing
        result.current.isLoading = true;
        result.current.isSyncing = true;
      });

      // Check localStorage
      const stored = localStorageMock.getItem('operate-notification-preferences');
      const parsed = JSON.parse(stored!);

      expect(parsed.state.isLoading).toBeUndefined();
      expect(parsed.state.isSyncing).toBeUndefined();
    });
  });

  describe('resetStore', () => {
    it('should reset all preferences to defaults', () => {
      const { result } = renderHook(() => useNotificationStore());

      // Change some preferences
      act(() => {
        result.current.updatePreferences({
          showInvoiceSuggestions: false,
          suggestionFrequency: 'daily',
          quietHoursEnabled: true,
        });
      });

      // Reset
      act(() => {
        result.current.resetStore();
      });

      expect(result.current.showInvoiceSuggestions).toBe(true);
      expect(result.current.suggestionFrequency).toBe('realtime');
      expect(result.current.quietHoursEnabled).toBe(false);
      expect(result.current.lastSyncedAt).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
});
