/**
 * Chat Store - Zustand State Management
 * Manages conversations, messages, and chat UI state with persistence
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatMessage, ChatConversation, MessageStatus } from '../types/chat';
import type { Suggestion } from '../types/suggestions';

// ============================================================================
// Types
// ============================================================================

export interface PendingMessage extends Omit<ChatMessage, 'status'> {
  tempId: string;
  conversationId: string;
  status: MessageStatus;
  error?: string;
}

export interface ChatStore {
  // ========== State ==========

  // Conversations
  conversations: ChatConversation[];
  activeConversationId: string | null;

  // Messages (indexed by conversationId for performance)
  messages: Record<string, ChatMessage[]>;
  pendingMessages: PendingMessage[];

  // Suggestions
  suggestions: Suggestion[];

  // UI State
  isLoading: boolean;
  isSending: boolean;
  isTyping: boolean; // AI typing indicator
  error: string | null;

  // ========== Actions ==========

  // Conversation Management
  setActiveConversation: (id: string | null) => void;
  addConversation: (conversation: ChatConversation) => void;
  updateConversation: (id: string, updates: Partial<ChatConversation>) => void;
  deleteConversation: (id: string) => void;
  clearConversation: (id: string) => void;

  // Message Management
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;

  // Pending Messages (Optimistic Updates)
  addPendingMessage: (message: Omit<PendingMessage, 'tempId'>) => string; // returns tempId
  confirmMessage: (tempId: string, realMessage: ChatMessage) => void;
  failMessage: (tempId: string, error: string) => void;
  removePendingMessage: (tempId: string) => void;

  // Suggestions
  setSuggestions: (suggestions: Suggestion[]) => void;
  addSuggestion: (suggestion: Suggestion) => void;
  removeSuggestion: (id: string) => void;
  clearSuggestions: () => void;

  // UI State
  setLoading: (isLoading: boolean) => void;
  setSending: (isSending: boolean) => void;
  setTyping: (isTyping: boolean) => void;
  setError: (error: string | null) => void;

  // Bulk Operations
  resetStore: () => void;
  hydrateConversations: (conversations: ChatConversation[]) => void;

  // ========== Selectors (Derived State) ==========

  getActiveConversation: () => ChatConversation | undefined;
  getActiveMessages: () => ChatMessage[];
  getConversation: (id: string) => ChatConversation | undefined;
  getMessages: (conversationId: string) => ChatMessage[];
  getPendingMessagesForConversation: (conversationId: string) => PendingMessage[];
  hasConversations: () => boolean;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  pendingMessages: [],
  suggestions: [],
  isLoading: false,
  isSending: false,
  isTyping: false,
  error: null,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useChatStore = create<ChatStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      ...initialState,

      // ========== Conversation Actions ==========

      setActiveConversation: (id) =>
        set((state) => {
          state.activeConversationId = id;
          state.error = null;
        }),

      addConversation: (conversation) =>
        set((state) => {
          // Check if conversation already exists
          const exists = state.conversations.some((c) => c.id === conversation.id);
          if (!exists) {
            state.conversations.unshift(conversation);
            state.messages[conversation.id] = conversation.messages || [];
          }
        }),

      updateConversation: (id, updates) =>
        set((state) => {
          const index = state.conversations.findIndex((c) => c.id === id);
          const existing = state.conversations[index];
          if (index !== -1 && existing) {
            state.conversations[index] = {
              ...existing,
              ...updates,
              updatedAt: new Date(),
            };
          }
        }),

      deleteConversation: (id) =>
        set((state) => {
          state.conversations = state.conversations.filter((c) => c.id !== id);
          delete state.messages[id];
          if (state.activeConversationId === id) {
            state.activeConversationId = null;
          }
        }),

      clearConversation: (id) =>
        set((state) => {
          state.messages[id] = [];
          state.pendingMessages = state.pendingMessages.filter(
            (m) => m.conversationId !== id
          );
        }),

      // ========== Message Actions ==========

      addMessage: (conversationId, message) =>
        set((state) => {
          if (!state.messages[conversationId]) {
            state.messages[conversationId] = [];
          }
          state.messages[conversationId].push(message);

          // Update conversation updatedAt
          const conversation = state.conversations.find((c) => c.id === conversationId);
          if (conversation) {
            conversation.updatedAt = new Date();
          }
        }),

      updateMessage: (conversationId, messageId, updates) =>
        set((state) => {
          const messages = state.messages[conversationId];
          if (messages) {
            const index = messages.findIndex((m) => m.id === messageId);
            const existing = messages[index];
            if (index !== -1 && existing) {
              messages[index] = { ...existing, ...updates };
            }
          }
        }),

      deleteMessage: (conversationId, messageId) =>
        set((state) => {
          if (state.messages[conversationId]) {
            state.messages[conversationId] = state.messages[conversationId].filter(
              (m) => m.id !== messageId
            );
          }
        }),

      // ========== Pending Message Actions (Optimistic Updates) ==========

      addPendingMessage: (message) => {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const pendingMessage: PendingMessage = {
          ...message,
          tempId,
          status: 'sending',
        };

        set((state) => {
          state.pendingMessages.push(pendingMessage);
          state.isSending = true;
        });

        return tempId;
      },

      confirmMessage: (tempId, realMessage) =>
        set((state) => {
          // Remove from pending
          const pendingIndex = state.pendingMessages.findIndex((m) => m.tempId === tempId);
          if (pendingIndex !== -1) {
            const pending = state.pendingMessages[pendingIndex];
            state.pendingMessages.splice(pendingIndex, 1);

            // Add real message
            if (realMessage.conversationId) {
              if (!state.messages[realMessage.conversationId]) {
                state.messages[realMessage.conversationId] = [];
              }
              state.messages[realMessage.conversationId]!.push(realMessage);

              // Update conversation
              const conversation = state.conversations.find(
                (c) => c.id === realMessage.conversationId
              );
              if (conversation) {
                conversation.updatedAt = new Date();
              }
            }
          }

          // Update isSending
          state.isSending = state.pendingMessages.length > 0;
        }),

      failMessage: (tempId, error) =>
        set((state) => {
          const index = state.pendingMessages.findIndex((m) => m.tempId === tempId);
          const pending = state.pendingMessages[index];
          if (index !== -1 && pending) {
            pending.status = 'error';
            pending.error = error;
          }
          state.isSending = state.pendingMessages.filter((m) => m.status === 'sending').length > 0;
        }),

      removePendingMessage: (tempId) =>
        set((state) => {
          state.pendingMessages = state.pendingMessages.filter((m) => m.tempId !== tempId);
          state.isSending = state.pendingMessages.length > 0;
        }),

      // ========== Suggestion Actions ==========

      setSuggestions: (suggestions) =>
        set((state) => {
          state.suggestions = suggestions;
        }),

      addSuggestion: (suggestion) =>
        set((state) => {
          // Check if suggestion already exists
          const exists = state.suggestions.some((s) => s.id === suggestion.id);
          if (!exists) {
            state.suggestions.push(suggestion);
          }
        }),

      removeSuggestion: (id) =>
        set((state) => {
          state.suggestions = state.suggestions.filter((s) => s.id !== id);
        }),

      clearSuggestions: () =>
        set((state) => {
          state.suggestions = [];
        }),

      // ========== UI State Actions ==========

      setLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }),

      setSending: (isSending) =>
        set((state) => {
          state.isSending = isSending;
        }),

      setTyping: (isTyping) =>
        set((state) => {
          state.isTyping = isTyping;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      // ========== Bulk Operations ==========

      resetStore: () => set(initialState),

      hydrateConversations: (conversations) =>
        set((state) => {
          state.conversations = conversations;
          // Build messages index
          conversations.forEach((conv) => {
            state.messages[conv.id] = conv.messages || [];
          });
        }),

      // ========== Selectors ==========

      getActiveConversation: () => {
        const state = get();
        if (!state.activeConversationId) return undefined;
        return state.conversations.find((c) => c.id === state.activeConversationId);
      },

      getActiveMessages: () => {
        const state = get();
        if (!state.activeConversationId) return [];
        return state.messages[state.activeConversationId] || [];
      },

      getConversation: (id) => {
        const state = get();
        return state.conversations.find((c) => c.id === id);
      },

      getMessages: (conversationId) => {
        const state = get();
        return state.messages[conversationId] || [];
      },

      getPendingMessagesForConversation: (conversationId) => {
        const state = get();
        return state.pendingMessages.filter((m) => m.conversationId === conversationId);
      },

      hasConversations: () => {
        const state = get();
        return state.conversations.length > 0;
      },
    })),
    {
      name: 'operate-chat-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        conversations: state.conversations,
        messages: state.messages,
        activeConversationId: state.activeConversationId,
        // Don't persist UI state, pending messages, or suggestions
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migrations if schema changes in the future
        if (version === 0) {
          // Migration from v0 to v1 (example)
          return persistedState;
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
 * Hook to get active conversation
 */
export const useActiveConversation = () =>
  useChatStore((state) => state.getActiveConversation());

/**
 * Hook to get active messages (including pending)
 */
export const useActiveMessages = () => {
  const messages = useChatStore((state) => state.getActiveMessages());
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const pendingMessages = useChatStore((state) =>
    activeConversationId
      ? state.getPendingMessagesForConversation(activeConversationId)
      : []
  );

  // Combine real and pending messages
  return [...messages, ...pendingMessages];
};

/**
 * Hook to get conversation by ID
 */
export const useConversation = (id: string) =>
  useChatStore((state) => state.getConversation(id));

/**
 * Hook to get messages for a conversation
 */
export const useMessages = (conversationId: string) =>
  useChatStore((state) => state.getMessages(conversationId));

/**
 * Hook to check if chat has any conversations
 */
export const useHasConversations = () =>
  useChatStore((state) => state.hasConversations());

/**
 * Hook to get chat UI state
 */
export const useChatUIState = () =>
  useChatStore((state) => ({
    isLoading: state.isLoading,
    isSending: state.isSending,
    isTyping: state.isTyping,
    error: state.error,
  }));

/**
 * Hook to get suggestions
 */
export const useSuggestions = () => useChatStore((state) => state.suggestions);

/**
 * Hook to get chat actions
 */
export const useChatActions = () =>
  useChatStore((state) => ({
    // Conversation actions
    setActiveConversation: state.setActiveConversation,
    addConversation: state.addConversation,
    updateConversation: state.updateConversation,
    deleteConversation: state.deleteConversation,
    clearConversation: state.clearConversation,

    // Message actions
    addMessage: state.addMessage,
    updateMessage: state.updateMessage,
    deleteMessage: state.deleteMessage,

    // Pending message actions
    addPendingMessage: state.addPendingMessage,
    confirmMessage: state.confirmMessage,
    failMessage: state.failMessage,
    removePendingMessage: state.removePendingMessage,

    // Suggestion actions
    setSuggestions: state.setSuggestions,
    addSuggestion: state.addSuggestion,
    removeSuggestion: state.removeSuggestion,
    clearSuggestions: state.clearSuggestions,

    // UI state actions
    setLoading: state.setLoading,
    setSending: state.setSending,
    setTyping: state.setTyping,
    setError: state.setError,

    // Bulk operations
    resetStore: state.resetStore,
    hydrateConversations: state.hydrateConversations,
  }));
