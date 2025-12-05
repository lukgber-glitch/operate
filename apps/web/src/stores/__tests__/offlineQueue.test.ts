/**
 * Offline Queue Store Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineQueueStore } from '../offlineQueue';

// Mock API
jest.mock('@/lib/api/client', () => ({
  api: {
    post: jest.fn(),
  },
  ApiClientError: class ApiClientError extends Error {
    constructor(message: string, public status?: number) {
      super(message);
    }
  },
}));

describe('offlineQueue Store', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset store
    const { result } = renderHook(() => useOfflineQueueStore());
    act(() => {
      result.current.clearQueue();
      result.current.setOnlineStatus(true);
    });

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('addToQueue', () => {
    it('should add message to queue', () => {
      const { result } = renderHook(() => useOfflineQueueStore());

      act(() => {
        result.current.addToQueue({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'Hello',
        });
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0]).toMatchObject({
        id: 'msg-1',
        conversationId: 'conv-1',
        content: 'Hello',
        retryCount: 0,
      });
      expect(result.current.queue[0].queuedAt).toBeInstanceOf(Date);
    });

    it('should add multiple messages', () => {
      const { result } = renderHook(() => useOfflineQueueStore());

      act(() => {
        result.current.addToQueue({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'Hello',
        });
        result.current.addToQueue({
          id: 'msg-2',
          conversationId: 'conv-1',
          content: 'World',
        });
      });

      expect(result.current.queue).toHaveLength(2);
    });
  });

  describe('removeFromQueue', () => {
    it('should remove message by id', () => {
      const { result } = renderHook(() => useOfflineQueueStore());

      act(() => {
        result.current.addToQueue({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'Hello',
        });
        result.current.addToQueue({
          id: 'msg-2',
          conversationId: 'conv-1',
          content: 'World',
        });
      });

      act(() => {
        result.current.removeFromQueue('msg-1');
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].id).toBe('msg-2');
    });
  });

  describe('clearQueue', () => {
    it('should clear all messages', () => {
      const { result } = renderHook(() => useOfflineQueueStore());

      act(() => {
        result.current.addToQueue({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'Hello',
        });
      });

      act(() => {
        result.current.clearQueue();
      });

      expect(result.current.queue).toHaveLength(0);
    });
  });

  describe('setOnlineStatus', () => {
    it('should update online status', () => {
      const { result } = renderHook(() => useOfflineQueueStore());

      act(() => {
        result.current.setOnlineStatus(false);
      });

      expect(result.current.isOnline).toBe(false);

      act(() => {
        result.current.setOnlineStatus(true);
      });

      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('syncQueue', () => {
    it('should not sync when offline', async () => {
      const { result } = renderHook(() => useOfflineQueueStore());
      const { api } = require('@/lib/api/client');

      act(() => {
        result.current.setOnlineStatus(false);
        result.current.addToQueue({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'Hello',
        });
      });

      await act(async () => {
        await result.current.syncQueue();
      });

      expect(api.post).not.toHaveBeenCalled();
      expect(result.current.queue).toHaveLength(1);
    });

    it('should not sync when already syncing', async () => {
      const { result } = renderHook(() => useOfflineQueueStore());
      const { api } = require('@/lib/api/client');

      // Set isSyncing manually (in real scenario, would be set by syncQueue)
      act(() => {
        result.current.addToQueue({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'Hello',
        });
      });

      // Mock long-running sync
      api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      // Start first sync
      const firstSync = act(async () => {
        await result.current.syncQueue();
      });

      // Try second sync immediately
      await act(async () => {
        const syncResult = await result.current.syncQueue();
        expect(syncResult.total).toBe(0); // Second sync should do nothing
      });

      await firstSync;
    });

    it('should sync messages successfully', async () => {
      const { result } = renderHook(() => useOfflineQueueStore());
      const { api } = require('@/lib/api/client');

      api.post.mockResolvedValue({ data: { success: true } });

      act(() => {
        result.current.addToQueue({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'Hello',
        });
      });

      await act(async () => {
        const syncResult = await result.current.syncQueue();
        expect(syncResult.succeeded).toContain('msg-1');
        expect(syncResult.failed).toHaveLength(0);
      });

      expect(result.current.queue).toHaveLength(0);
      expect(result.current.lastSyncAt).toBeInstanceOf(Date);
    });

    it('should handle retryable errors', async () => {
      const { result } = renderHook(() => useOfflineQueueStore());
      const { api, ApiClientError } = require('@/lib/api/client');

      // Network error (retryable)
      api.post.mockRejectedValue(new TypeError('Network error'));

      act(() => {
        result.current.addToQueue({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'Hello',
        });
      });

      await act(async () => {
        const syncResult = await result.current.syncQueue();
        expect(syncResult.failed).toHaveLength(1);
        expect(syncResult.failed[0].retryable).toBe(true);
      });

      // Message should still be in queue
      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].retryCount).toBe(1);
    });

    it('should handle non-retryable errors', async () => {
      const { result } = renderHook(() => useOfflineQueueStore());
      const { api, ApiClientError } = require('@/lib/api/client');

      // 400 error (non-retryable)
      api.post.mockRejectedValue(new ApiClientError('Bad request', 400));

      act(() => {
        result.current.addToQueue({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'Hello',
        });
      });

      await act(async () => {
        const syncResult = await result.current.syncQueue();
        expect(syncResult.failed).toHaveLength(1);
        expect(syncResult.failed[0].retryable).toBe(false);
      });

      // Message should still be in queue (not removed)
      expect(result.current.queue).toHaveLength(1);
    });

    it('should stop at max retry count', async () => {
      const { result } = renderHook(() => useOfflineQueueStore());
      const { api } = require('@/lib/api/client');

      api.post.mockRejectedValue(new TypeError('Network error'));

      act(() => {
        result.current.addToQueue({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'Hello',
        });
      });

      // Retry 3 times
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await result.current.syncQueue();
        });
      }

      // 4th attempt should skip message
      await act(async () => {
        const syncResult = await result.current.syncQueue();
        expect(syncResult.failed[0].retryable).toBe(false);
        expect(syncResult.failed[0].error).toContain('Maximum retry');
      });
    });
  });

  describe('persistence', () => {
    it('should persist queue to localStorage', () => {
      const { result } = renderHook(() => useOfflineQueueStore());

      act(() => {
        result.current.addToQueue({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'Hello',
        });
      });

      const stored = localStorage.getItem('offline-queue-storage');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.queue).toHaveLength(1);
    });

    it('should restore queue from localStorage', () => {
      // Manually set localStorage
      const mockQueue = {
        state: {
          queue: [
            {
              id: 'msg-1',
              conversationId: 'conv-1',
              content: 'Hello',
              queuedAt: new Date().toISOString(),
              retryCount: 0,
            },
          ],
          syncErrors: [],
          lastSyncAt: null,
        },
        version: 0,
      };

      localStorage.setItem('offline-queue-storage', JSON.stringify(mockQueue));

      // Create new hook instance (simulates page load)
      const { result } = renderHook(() => useOfflineQueueStore());

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].id).toBe('msg-1');
      expect(result.current.queue[0].queuedAt).toBeInstanceOf(Date);
    });
  });
});
