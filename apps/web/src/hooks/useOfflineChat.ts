/**
 * Offline-Aware Chat Hook
 * Extends chat functionality with offline queue support
 */

'use client';

import { useCallback } from 'react';
import { useOfflineQueue } from './useOfflineQueue';
import { v4 as uuidv4 } from 'uuid';
import type { AttachmentMeta } from '@/stores/offlineQueue';

export interface SendMessageOptions {
  conversationId: string;
  content: string;
  attachments?: AttachmentMeta[];
}

export interface UseOfflineChatReturn {
  sendMessage: (options: SendMessageOptions) => Promise<void>;
  isOnline: boolean;
  queuedCount: number;
  isSyncing: boolean;
}

/**
 * Hook that combines chat messaging with offline queue
 *
 * Usage:
 * ```tsx
 * const { sendMessage, isOnline, queuedCount } = useOfflineChat();
 *
 * await sendMessage({
 *   conversationId: 'conv-123',
 *   content: 'Hello!',
 *   attachments: []
 * });
 * ```
 */
export function useOfflineChat(): UseOfflineChatReturn {
  const {
    isOnline,
    queuedCount,
    isSyncing,
    queueMessage,
  } = useOfflineQueue();

  /**
   * Send a message - queues if offline, sends immediately if online
   */
  const sendMessage = useCallback(
    async ({ conversationId, content, attachments }: SendMessageOptions) => {
      const messageId = uuidv4();

      // Always queue the message
      queueMessage({
        id: messageId,
        conversationId,
        content,
        attachments,
      });

      // The queue store will automatically sync if online
      // If offline, message stays in queue until connection restored
    },
    [queueMessage]
  );

  return {
    sendMessage,
    isOnline,
    queuedCount,
    isSyncing,
  };
}
