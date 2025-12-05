/**
 * Offline Queue Type Definitions
 * Centralized type exports for offline queue functionality
 */

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

export interface OfflineQueueState {
  isOnline: boolean;
  queue: QueuedMessage[];
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncErrors: SyncError[];
}

export interface OfflineQueueActions {
  addToQueue: (message: Omit<QueuedMessage, 'queuedAt' | 'retryCount'>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  syncQueue: () => Promise<SyncResult>;
  setOnlineStatus: (status: boolean) => void;
  clearSyncErrors: () => void;
  incrementRetryCount: (id: string) => void;
}

export type OfflineQueueStore = OfflineQueueState & OfflineQueueActions;

// Hook return types
export interface UseOfflineQueueReturn {
  // State
  isOnline: boolean;
  queuedCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  hasErrors: boolean;
  errorCount: number;

  // Actions
  queueMessage: (message: Omit<QueuedMessage, 'queuedAt' | 'retryCount'>) => void;
  sync: () => Promise<SyncResult>;
  clearQueue: () => void;
  clearErrors: () => void;

  // Queue data
  queue: QueuedMessage[];
}

export interface UseOfflineChatReturn {
  sendMessage: (options: SendMessageOptions) => Promise<void>;
  isOnline: boolean;
  queuedCount: number;
  isSyncing: boolean;
}

export interface SendMessageOptions {
  conversationId: string;
  content: string;
  attachments?: AttachmentMeta[];
}

export interface UseOfflineStatusReturn {
  isOnline: boolean;
}

// Constants
export const MAX_RETRY_COUNT = 3;
export const SYNC_INTERVAL_MS = 30000; // 30 seconds
export const AUTO_SYNC_DELAY_MS = 100; // 100ms after adding to queue

// Error classification
export const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504] as const;
export const NON_RETRYABLE_STATUS_CODES = [400, 401, 403, 404, 422] as const;

// Type guards
export function isRetryableStatusCode(
  status: number
): status is typeof RETRYABLE_STATUS_CODES[number] {
  return RETRYABLE_STATUS_CODES.includes(status as any);
}

export function isNonRetryableStatusCode(
  status: number
): status is typeof NON_RETRYABLE_STATUS_CODES[number] {
  return NON_RETRYABLE_STATUS_CODES.includes(status as any);
}

// Storage key
export const OFFLINE_QUEUE_STORAGE_KEY = 'offline-queue-storage';
