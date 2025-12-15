'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

import { api } from '@/lib/api/client';

// ============================================
// Type Definitions - Strict TypeScript
// ============================================

export interface Conversation {
  id: string;
  title: string;
  lastMessageAt: Date;
  messages?: Message[];
  contextType?: string;
  pageContext?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  status?: 'sending' | 'sent' | 'error' | 'streaming';
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  actionType?: string;
  actionParams?: Record<string, unknown>;
  actionResult?: ActionResult;
  error?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  entityId?: string;
  entityType?: string;
  data?: Record<string, unknown>;
}

export interface ChatError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
}

export interface QuickAskResponse {
  content: string;
  model?: string;
  usage?: { input: number; output: number };
}

export interface CreateConversationOptions {
  title?: string;
  context?: string;
  pageContext?: string;
}

// ============================================
// Error Handling Utilities
// ============================================

function parseApiError(error: unknown): ChatError {
  if (error instanceof Error) {
    // Handle Axios-style errors
    const axiosError = error as { response?: { data?: { message?: string; code?: string } } };
    if (axiosError.response?.data) {
      return {
        code: axiosError.response.data.code || 'API_ERROR',
        message: axiosError.response.data.message || error.message,
        details: axiosError.response.data as Record<string, unknown>,
      };
    }
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
    };
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
  };
}

// ============================================
// Main Hook
// ============================================

export interface UseChatOptions {
  /** Initial conversations to load */
  initialConversations?: Conversation[];
  /** Called when an error occurs */
  onError?: (error: ChatError) => void;
  /** Enable optimistic updates */
  optimisticUpdates?: boolean;
}

export interface UseChatReturn {
  // State
  conversations: Conversation[];
  activeConversation: Conversation | null;
  isLoading: boolean;
  isSending: boolean;
  error: ChatError | null;

  // Actions
  fetchConversations: () => Promise<Conversation[]>;
  createConversation: (options?: CreateConversationOptions) => Promise<Conversation>;
  sendMessage: (conversationId: string, content: string) => Promise<SendMessageResponse>;
  quickAsk: (content: string) => Promise<string>;
  setActiveConversation: (conversation: Conversation | null) => void;
  clearError: () => void;

  // Computed
  hasConversations: boolean;
  activeConversationId: string | null;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { initialConversations = [], onError, optimisticUpdates = true } = options;

  // State
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);

  // Ref to track in-flight requests (prevents race conditions)
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount - cancel any in-flight requests
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Error handler
  const handleError = useCallback((err: unknown): ChatError => {
    const chatError = parseApiError(err);
    setError(chatError);
    onError?.(chatError);
    return chatError;
  }, [onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch all conversations
  const fetchConversations = useCallback(async (): Promise<Conversation[]> => {
    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<Conversation[]>('/chatbot/conversations', {
        signal: abortControllerRef.current.signal,
      });
      const data = response.data;
      setConversations(data);
      return data;
    } catch (err: unknown) {
      // Don't set error for aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        return conversations;
      }
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [conversations, handleError]);

  // Create a new conversation
  const createConversation = useCallback(async (
    createOptions?: CreateConversationOptions
  ): Promise<Conversation> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<Conversation>('/chatbot/conversations', {
        title: createOptions?.title,
        context: createOptions?.context,
        pageContext: createOptions?.pageContext,
      });

      const newConversation = response.data;

      // Update state atomically
      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversation(newConversation);

      return newConversation;
    } catch (err: unknown) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Send a message in a conversation
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string
  ): Promise<SendMessageResponse> => {
    if (!content.trim()) {
      const emptyError: ChatError = {
        code: 'EMPTY_MESSAGE',
        message: 'Message content cannot be empty',
      };
      setError(emptyError);
      throw new Error(emptyError.message);
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await api.post<SendMessageResponse>(
        `/chatbot/conversations/${conversationId}/messages`,
        { content }
      );

      // Update conversation's lastMessageAt if optimistic updates enabled
      if (optimisticUpdates) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? { ...conv, lastMessageAt: new Date() }
              : conv
          )
        );
      }

      return response.data;
    } catch (err: unknown) {
      handleError(err);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [handleError, optimisticUpdates]);

  // Quick ask - one-off question without conversation
  const quickAsk = useCallback(async (content: string): Promise<string> => {
    if (!content.trim()) {
      const emptyError: ChatError = {
        code: 'EMPTY_QUESTION',
        message: 'Question cannot be empty',
      };
      setError(emptyError);
      throw new Error(emptyError.message);
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await api.post<QuickAskResponse>('/chatbot/quick-ask', { content });
      return response.data.content;
    } catch (err: unknown) {
      handleError(err);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [handleError]);

  // Computed values (memoized)
  const hasConversations = useMemo(() => conversations.length > 0, [conversations.length]);
  const activeConversationId = useMemo(() => activeConversation?.id ?? null, [activeConversation]);

  // Memoize return object to prevent unnecessary re-renders in consumers
  return useMemo(() => ({
    // State
    conversations,
    activeConversation,
    isLoading,
    isSending,
    error,

    // Actions
    fetchConversations,
    createConversation,
    sendMessage,
    quickAsk,
    setActiveConversation,
    clearError,

    // Computed
    hasConversations,
    activeConversationId,
  }), [
    conversations,
    activeConversation,
    isLoading,
    isSending,
    error,
    fetchConversations,
    createConversation,
    sendMessage,
    quickAsk,
    clearError,
    hasConversations,
    activeConversationId,
  ]);
}
