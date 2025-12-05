/**
 * Offline Queue Store
 * Manages message queueing for offline functionality with persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, ApiClientError } from '@/lib/api/client';

export interface AttachmentMeta {
  id: string;
  name: string;
  type: string;
  size: number;
  localUrl?: string;
}

export interface QueuedMessage {
  id: string;
  conversationId: string;
  content: string;
  attachments?: AttachmentMeta[];
  queuedAt: Date;
  retryCount: number;
}

export interface SyncError {
  messageId: string;
  error: string;
  timestamp: Date;
  retryable: boolean;
}

export interface SyncResult {
  succeeded: string[];
  failed: SyncError[];
  total: number;
}

export interface OfflineQueueStore {
  // State
  isOnline: boolean;
  queue: QueuedMessage[];
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncErrors: SyncError[];

  // Actions
  addToQueue: (message: Omit<QueuedMessage, 'queuedAt' | 'retryCount'>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  syncQueue: () => Promise<SyncResult>;
  setOnlineStatus: (status: boolean) => void;
  clearSyncErrors: () => void;
  incrementRetryCount: (id: string) => void;
}

const MAX_RETRY_COUNT = 3;

export const useOfflineQueueStore = create<OfflineQueueStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      queue: [],
      isSyncing: false,
      lastSyncAt: null,
      syncErrors: [],

      // Actions
      addToQueue: (message) => {
        const queuedMessage: QueuedMessage = {
          ...message,
          queuedAt: new Date(),
          retryCount: 0,
        };

        set((state) => ({
          queue: [...state.queue, queuedMessage],
        }));

        // If we're online, trigger sync immediately
        if (get().isOnline && !get().isSyncing) {
          setTimeout(() => get().syncQueue(), 100);
        }
      },

      removeFromQueue: (id) => {
        set((state) => ({
          queue: state.queue.filter((msg) => msg.id !== id),
          syncErrors: state.syncErrors.filter((err) => err.messageId !== id),
        }));
      },

      clearQueue: () => {
        set({
          queue: [],
          syncErrors: [],
        });
      },

      incrementRetryCount: (id) => {
        set((state) => ({
          queue: state.queue.map((msg) =>
            msg.id === id ? { ...msg, retryCount: msg.retryCount + 1 } : msg
          ),
        }));
      },

      syncQueue: async () => {
        const { queue, isOnline, isSyncing } = get();

        // Don't sync if offline or already syncing
        if (!isOnline || isSyncing || queue.length === 0) {
          return {
            succeeded: [],
            failed: [],
            total: 0,
          };
        }

        set({ isSyncing: true });

        const succeeded: string[] = [];
        const failed: SyncError[] = [];

        // Process queue in order (FIFO)
        for (const message of queue) {
          // Skip messages that have exceeded retry limit
          if (message.retryCount >= MAX_RETRY_COUNT) {
            failed.push({
              messageId: message.id,
              error: 'Maximum retry attempts exceeded',
              timestamp: new Date(),
              retryable: false,
            });
            continue;
          }

          try {
            // Send message to server
            await api.post(
              `/chatbot/conversations/${message.conversationId}/messages`,
              {
                content: message.content,
                attachments: message.attachments,
                clientMessageId: message.id,
                queuedAt: message.queuedAt,
              }
            );

            // Success - add to succeeded list
            succeeded.push(message.id);
          } catch (error) {
            // Determine if error is retryable
            const isRetryable = isRetryableError(error);

            failed.push({
              messageId: message.id,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
              retryable: isRetryable,
            });

            // Increment retry count for retryable errors
            if (isRetryable) {
              get().incrementRetryCount(message.id);
            }

            // If not retryable or network error, stop processing
            if (!isRetryable || error instanceof TypeError) {
              break;
            }
          }
        }

        // Remove succeeded messages from queue
        set((state) => ({
          queue: state.queue.filter((msg) => !succeeded.includes(msg.id)),
          syncErrors: [...state.syncErrors, ...failed],
          lastSyncAt: new Date(),
          isSyncing: false,
        }));

        return {
          succeeded,
          failed,
          total: succeeded.length + failed.length,
        };
      },

      setOnlineStatus: (status) => {
        const wasOffline = !get().isOnline;
        set({ isOnline: status });

        // If we just came online and have queued messages, sync
        if (status && wasOffline && get().queue.length > 0) {
          setTimeout(() => get().syncQueue(), 500);
        }
      },

      clearSyncErrors: () => {
        set({ syncErrors: [] });
      },
    }),
    {
      name: 'offline-queue-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist queue and sync errors, not transient state
      partialize: (state) => ({
        queue: state.queue,
        syncErrors: state.syncErrors,
        lastSyncAt: state.lastSyncAt,
      }),
      // Restore dates from JSON
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert serialized dates back to Date objects
          state.queue = state.queue.map((msg) => ({
            ...msg,
            queuedAt: new Date(msg.queuedAt),
          }));

          state.syncErrors = state.syncErrors.map((err) => ({
            ...err,
            timestamp: new Date(err.timestamp),
          }));

          if (state.lastSyncAt) {
            state.lastSyncAt = new Date(state.lastSyncAt);
          }

          // Set online status based on current browser state
          state.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        }
      },
    }
  )
);

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  // Network errors (TypeError) are retryable
  if (error instanceof TypeError) {
    return true;
  }

  // API errors with specific status codes
  if (error instanceof ApiClientError) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return error.status ? retryableStatuses.includes(error.status) : false;
  }

  // Default to non-retryable
  return false;
}
