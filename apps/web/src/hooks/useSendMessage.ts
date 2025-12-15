'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { api } from '@/lib/api/client';
import type { ChatMessage, MessageStatus, Attachment } from '@/types/chat';

/**
 * Optimistic Message for tracking pending/failed sends
 */
export interface OptimisticMessage extends ChatMessage {
  tempId: string;
  originalContent: string;
  attachments?: Attachment[];
  status: MessageStatus;
  error?: string;
  retryCount: number;
}

/**
 * API Response for message sending
 */
interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage?: ChatMessage;
}

/**
 * Hook options
 */
interface UseSendMessageOptions {
  onSuccess?: (message: ChatMessage) => void;
  onError?: (error: string, tempId: string) => void;
  onRetrySuccess?: (message: ChatMessage, tempId: string) => void;
  maxRetries?: number;
}

/**
 * useSendMessage - Optimistic message sending with rollback
 *
 * Features:
 * - Immediate optimistic updates
 * - Background API calls
 * - Automatic rollback on failure
 * - Retry support for failed messages
 * - Message ordering preservation
 * - Attachment support
 *
 * @param conversationId - The conversation to send messages to
 * @param options - Configuration options
 * @returns Hook API for sending and managing messages
 */
export function useSendMessage(
  conversationId: string,
  options: UseSendMessageOptions = {}
) {
  const { onSuccess, onError, onRetrySuccess, maxRetries = 3 } = options;

  // Track pending and failed messages
  const [pendingMessages, setPendingMessages] = useState<OptimisticMessage[]>([]);
  const [failedMessages, setFailedMessages] = useState<OptimisticMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Abort controllers for cancellation
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  /**
   * Generate temporary ID for optimistic message
   */
  const generateTempId = useCallback((): string => {
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  /**
   * Create optimistic message
   */
  const createOptimisticMessage = useCallback(
    (content: string, attachments?: File[]): OptimisticMessage => {
      const tempId = generateTempId();
      const now = new Date();

      return {
        id: tempId,
        tempId,
        conversationId,
        role: 'user',
        content,
        originalContent: content,
        timestamp: now,
        status: 'sending',
        retryCount: 0,
        metadata: {
          attachments: attachments?.map((file) => ({
            id: `attachment_${tempId}_${file.name}`,
            name: file.name,
            type: file.type,
            size: file.size,
          })),
        },
      };
    },
    [conversationId, generateTempId]
  );

  /**
   * Send message to API
   */
  const sendToAPI = useCallback(
    async (
      optimisticMessage: OptimisticMessage,
      attachments?: File[]
    ): Promise<SendMessageResponse> => {
      const abortController = new AbortController();
      abortControllersRef.current.set(optimisticMessage.tempId, abortController);

      try {
        // Prepare request body
        let body: FormData | { content: string };

        if (attachments && attachments.length > 0) {
          // Use FormData for attachments
          const formData = new FormData();
          formData.append('content', optimisticMessage.content);
          attachments.forEach((file) => {
            formData.append('attachments', file);
          });
          body = formData;
        } else {
          // JSON for text-only messages
          body = { content: optimisticMessage.content };
        }

        const response = await api.post<SendMessageResponse>(
          `/chatbot/conversations/${conversationId}/messages`,
          body,
          { signal: abortController.signal }
        );

        return response.data;
      } finally {
        abortControllersRef.current.delete(optimisticMessage.tempId);
      }
    },
    [conversationId]
  );

  /**
   * Update message status in state
   */
  const updateMessageStatus = useCallback(
    (
      tempId: string,
      updates: Partial<OptimisticMessage>,
      moveToFailed: boolean = false
    ) => {
      setPendingMessages((prev) => {
        const message = prev.find((m) => m.tempId === tempId);
        if (!message) return prev;

        const updated = { ...message, ...updates };

        if (moveToFailed) {
          setFailedMessages((failed) => [...failed, updated]);
          return prev.filter((m) => m.tempId !== tempId);
        }

        return prev.map((m) => (m.tempId === tempId ? updated : m));
      });
    },
    []
  );

  /**
   * Send message with optimistic update
   */
  const sendMessage = useCallback(
    async (content: string, attachments?: File[]): Promise<ChatMessage | null> => {
      if (!content.trim()) {
        throw new Error('Message content cannot be empty');
      }

      setIsSending(true);

      // Create optimistic message
      const optimisticMessage = createOptimisticMessage(content, attachments);

      // Add to pending immediately
      setPendingMessages((prev) => [...prev, optimisticMessage]);

      try {
        // Send to API
        const response = await sendToAPI(optimisticMessage, attachments);

        // On success: remove from pending
        setPendingMessages((prev) => prev.filter((m) => m.tempId !== optimisticMessage.tempId));

        // Call success callback
        onSuccess?.(response.userMessage);

        return response.userMessage;
      } catch (error: any) {
        // On failure: move to failed messages
        const errorMessage = error.message || 'Failed to send message';

        updateMessageStatus(
          optimisticMessage.tempId,
          {
            status: 'error',
            error: errorMessage,
            metadata: {
              ...optimisticMessage.metadata,
              error: errorMessage,
            },
          },
          true // Move to failed
        );

        // Call error callback
        onError?.(errorMessage, optimisticMessage.tempId);

        return null;
      } finally {
        setIsSending(false);
      }
    },
    [createOptimisticMessage, sendToAPI, updateMessageStatus, onSuccess, onError]
  );

  /**
   * Retry a failed message
   */
  const retryMessage = useCallback(
    async (tempId: string): Promise<ChatMessage | null> => {
      const failedMessage = failedMessages.find((m) => m.tempId === tempId);

      if (!failedMessage) {
        throw new Error('Failed message not found');
      }

      if (failedMessage.retryCount >= maxRetries) {
        throw new Error('Maximum retry attempts exceeded');
      }

      // Remove from failed
      setFailedMessages((prev) => prev.filter((m) => m.tempId !== tempId));

      // Add back to pending with retry status
      const retryingMessage: OptimisticMessage = {
        ...failedMessage,
        status: 'sending',
        retryCount: failedMessage.retryCount + 1,
        error: undefined,
      };

      setPendingMessages((prev) => [...prev, retryingMessage]);
      setIsSending(true);

      try {
        // Re-send to API
        const response = await sendToAPI(retryingMessage);

        // On success: remove from pending
        setPendingMessages((prev) => prev.filter((m) => m.tempId !== tempId));

        // Call retry success callback
        onRetrySuccess?.(response.userMessage, tempId);
        onSuccess?.(response.userMessage);

        return response.userMessage;
      } catch (error: any) {
        // On failure: move back to failed
        const errorMessage = error.message || 'Failed to retry message';

        updateMessageStatus(
          tempId,
          {
            status: 'error',
            error: errorMessage,
            metadata: {
              ...retryingMessage.metadata,
              error: errorMessage,
              retryCount: retryingMessage.retryCount,
            },
          },
          true // Move to failed
        );

        onError?.(errorMessage, tempId);

        return null;
      } finally {
        setIsSending(false);
      }
    },
    [failedMessages, maxRetries, sendToAPI, updateMessageStatus, onSuccess, onError, onRetrySuccess]
  );

  /**
   * Cancel a pending message
   */
  const cancelMessage = useCallback((tempId: string) => {
    // Abort the API request
    const abortController = abortControllersRef.current.get(tempId);
    if (abortController) {
      abortController.abort();
      abortControllersRef.current.delete(tempId);
    }

    // Remove from pending
    setPendingMessages((prev) => prev.filter((m) => m.tempId !== tempId));

    // Remove from failed (if present)
    setFailedMessages((prev) => prev.filter((m) => m.tempId !== tempId));
  }, []);

  /**
   * Clear all failed messages
   */
  const clearFailedMessages = useCallback(() => {
    setFailedMessages([]);
  }, []);

  /**
   * Get combined pending and failed messages for display
   * Memoized to prevent recalculation on every render
   */
  const allOptimisticMessages = useMemo((): OptimisticMessage[] => {
    return [...pendingMessages, ...failedMessages].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }, [pendingMessages, failedMessages]);

  // Cleanup on unmount - abort all pending requests
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach((controller) => {
        controller.abort();
      });
      abortControllersRef.current.clear();
    };
  }, []);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    pendingMessages,
    failedMessages,
    isSending,

    // Actions
    sendMessage,
    retryMessage,
    cancelMessage,
    clearFailedMessages,

    // Utilities - expose as memoized value directly
    allOptimisticMessages,
    // Also keep a getter for backwards compatibility
    getAllOptimisticMessages: () => allOptimisticMessages,
  }), [
    pendingMessages,
    failedMessages,
    isSending,
    sendMessage,
    retryMessage,
    cancelMessage,
    clearFailedMessages,
    allOptimisticMessages,
  ]);
}
