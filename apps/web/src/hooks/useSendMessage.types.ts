/**
 * Type Definitions for useSendMessage Hook
 *
 * Exports all types used by the optimistic message sending hook
 */

import type { ChatMessage, MessageStatus, Attachment } from '@/types/chat';

/**
 * Optimistic message with additional metadata for tracking send state
 */
export interface OptimisticMessage extends ChatMessage {
  /** Temporary ID assigned before server confirmation */
  tempId: string;

  /** Original message content (preserved for retries) */
  originalContent: string;

  /** File attachments (if any) */
  attachments?: Attachment[];

  /** Current status of the message */
  status: MessageStatus;

  /** Error message if send failed */
  error?: string;

  /** Number of times this message has been retried */
  retryCount: number;
}

/**
 * API response when sending a message
 */
export interface SendMessageResponse {
  /** The user's message as confirmed by server */
  userMessage: ChatMessage;

  /** Optional assistant response (if immediate reply) */
  assistantMessage?: ChatMessage;
}

/**
 * Options for configuring the useSendMessage hook
 */
export interface UseSendMessageOptions {
  /**
   * Called when a message is successfully sent
   * @param message - The confirmed message from the server
   */
  onSuccess?: (message: ChatMessage) => void;

  /**
   * Called when a message fails to send
   * @param error - The error message
   * @param tempId - The temporary ID of the failed message
   */
  onError?: (error: string, tempId: string) => void;

  /**
   * Called when a retry succeeds
   * @param message - The confirmed message from the server
   * @param tempId - The temporary ID that was retried
   */
  onRetrySuccess?: (message: ChatMessage, tempId: string) => void;

  /**
   * Maximum number of retry attempts per message
   * @default 3
   */
  maxRetries?: number;
}

/**
 * Return type of the useSendMessage hook
 */
export interface UseSendMessageReturn {
  /**
   * Send a message optimistically
   * @param content - The message content
   * @param attachments - Optional file attachments
   * @returns Promise resolving to the confirmed message or null if failed
   */
  sendMessage: (content: string, attachments?: File[]) => Promise<ChatMessage | null>;

  /**
   * Retry a failed message
   * @param tempId - The temporary ID of the message to retry
   * @returns Promise resolving to the confirmed message or null if failed
   */
  retryMessage: (tempId: string) => Promise<ChatMessage | null>;

  /**
   * Cancel a pending message
   * @param tempId - The temporary ID of the message to cancel
   */
  cancelMessage: (tempId: string) => void;

  /**
   * Clear all failed messages from state
   */
  clearFailedMessages: () => void;

  /**
   * Get all optimistic messages (pending + failed) sorted by timestamp
   * @returns Array of optimistic messages
   */
  getAllOptimisticMessages: () => OptimisticMessage[];

  /**
   * Messages currently being sent to the server
   */
  pendingMessages: OptimisticMessage[];

  /**
   * Messages that failed to send
   */
  failedMessages: OptimisticMessage[];

  /**
   * Whether a message is currently being sent
   */
  isSending: boolean;
}

/**
 * Internal state for tracking abort controllers
 */
export type AbortControllerMap = Map<string, AbortController>;

/**
 * Type guard to check if a message is optimistic
 */
export function isOptimisticMessage(
  message: ChatMessage | OptimisticMessage
): message is OptimisticMessage {
  return 'tempId' in message && 'retryCount' in message;
}

/**
 * Type guard to check if a message is pending
 */
export function isPendingMessage(message: ChatMessage): boolean {
  return message.status === 'sending';
}

/**
 * Type guard to check if a message is failed
 */
export function isFailedMessage(message: ChatMessage): boolean {
  return message.status === 'error';
}

/**
 * Type guard to check if a message can be retried
 */
export function canRetryMessage(
  message: OptimisticMessage,
  maxRetries: number = 3
): boolean {
  return message.status === 'error' && message.retryCount < maxRetries;
}

/**
 * Utility type for message filters
 */
export type MessageFilter = (message: ChatMessage | OptimisticMessage) => boolean;

/**
 * Utility type for message comparators (for sorting)
 */
export type MessageComparator = (
  a: ChatMessage | OptimisticMessage,
  b: ChatMessage | OptimisticMessage
) => number;

/**
 * Common message comparators
 */
export const MessageComparators = {
  /** Sort by timestamp ascending (oldest first) */
  byTimestampAsc: ((a, b) =>
    a.timestamp.getTime() - b.timestamp.getTime()
  ) as MessageComparator,

  /** Sort by timestamp descending (newest first) */
  byTimestampDesc: ((a, b) =>
    b.timestamp.getTime() - a.timestamp.getTime()
  ) as MessageComparator,

  /** Sort by status (sending, error, sent) */
  byStatus: ((a, b) => {
    const statusOrder = { sending: 0, error: 1, retrying: 2, sent: 3, received: 4, streaming: 5 };
    const aStatus = a.status || 'sent';
    const bStatus = b.status || 'sent';
    return statusOrder[aStatus] - statusOrder[bStatus];
  }) as MessageComparator,
};

/**
 * Common message filters
 */
export const MessageFilters = {
  /** Filter to only user messages */
  userMessages: ((msg) => msg.role === 'user') as MessageFilter,

  /** Filter to only assistant messages */
  assistantMessages: ((msg) => msg.role === 'assistant') as MessageFilter,

  /** Filter to only pending messages */
  pendingMessages: ((msg) => msg.status === 'sending') as MessageFilter,

  /** Filter to only failed messages */
  failedMessages: ((msg) => msg.status === 'error') as MessageFilter,

  /** Filter to only sent messages */
  sentMessages: ((msg) => msg.status === 'sent') as MessageFilter,

  /** Filter to messages with attachments */
  withAttachments: ((msg) => !!msg.metadata?.attachments?.length) as MessageFilter,

  /** Filter to messages with errors */
  withErrors: ((msg) => !!msg.metadata?.error) as MessageFilter,
};

/**
 * Error types that can occur during message sending
 */
export enum SendMessageErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Structured error for message sending
 */
export interface SendMessageError {
  type: SendMessageErrorType;
  message: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Helper to parse API errors into structured format
 */
export function parseSendMessageError(error: unknown): SendMessageError {
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      return {
        type: SendMessageErrorType.NETWORK_ERROR,
        message: 'Network error. Please check your connection.',
      };
    }

    // Other errors
    return {
      type: SendMessageErrorType.UNKNOWN,
      message: error.message,
    };
  }

  // Unknown error type
  return {
    type: SendMessageErrorType.UNKNOWN,
    message: 'An unknown error occurred',
  };
}

/**
 * Constants for the hook
 */
export const SEND_MESSAGE_CONSTANTS = {
  /** Default maximum retry attempts */
  DEFAULT_MAX_RETRIES: 3,

  /** Maximum content length */
  MAX_CONTENT_LENGTH: 10000,

  /** Maximum number of attachments */
  MAX_ATTACHMENTS: 10,

  /** Maximum file size (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** Allowed file types */
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
  ],
} as const;

/**
 * Validation helper for message content
 */
export function validateMessageContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (!content.trim()) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (content.length > SEND_MESSAGE_CONSTANTS.MAX_CONTENT_LENGTH) {
    return {
      valid: false,
      error: `Message too long (max ${SEND_MESSAGE_CONSTANTS.MAX_CONTENT_LENGTH} characters)`,
    };
  }

  return { valid: true };
}

/**
 * Validation helper for attachments
 */
export function validateAttachments(files: File[]): {
  valid: boolean;
  error?: string;
} {
  if (files.length > SEND_MESSAGE_CONSTANTS.MAX_ATTACHMENTS) {
    return {
      valid: false,
      error: `Too many attachments (max ${SEND_MESSAGE_CONSTANTS.MAX_ATTACHMENTS})`,
    };
  }

  for (const file of files) {
    if (file.size > SEND_MESSAGE_CONSTANTS.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File "${file.name}" is too large (max ${SEND_MESSAGE_CONSTANTS.MAX_FILE_SIZE / 1024 / 1024}MB)`,
      };
    }

    if (!(SEND_MESSAGE_CONSTANTS.ALLOWED_FILE_TYPES as readonly string[]).includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" is not allowed`,
      };
    }
  }

  return { valid: true };
}
