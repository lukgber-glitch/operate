'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatConversation, ChatMessage } from '@/types/chat';

/**
 * useConversationHistoryAPI - Hook for managing conversation history with API integration
 *
 * API-first version that syncs with backend:
 * - GET /api/v1/chatbot/conversations - List conversations
 * - GET /api/v1/chatbot/conversations/:id - Get specific conversation
 * - POST /api/v1/chatbot/conversations - Create conversation
 * - DELETE /api/v1/chatbot/conversations/:id - Delete conversation
 *
 * Falls back to localStorage for offline support.
 */

const STORAGE_KEY = 'operate_conversations';
const MAX_CONVERSATIONS = 100;

interface ConversationGroup {
  label: string;
  conversations: ChatConversation[];
}

interface UseConversationHistoryOptions {
  enableSync?: boolean; // Enable API sync (default: true)
  syncInterval?: number; // Sync interval in ms (default: 30000)
}

export function useConversationHistoryAPI(options: UseConversationHistoryOptions = {}) {
  const { enableSync = true, syncInterval = 30000 } = options;

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    if (!enableSync) return;

    try {
      setError(null);
      const response = await fetch('/api/v1/chatbot/conversations?limit=100&offset=0');

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();

      // Transform API response to ChatConversation format
      const apiConversations: ChatConversation[] = data.map((conv: any) => ({
        id: conv.id,
        title: conv.title || 'New Conversation',
        messages: conv.messages?.map((msg: any) => ({
          id: msg.id,
          conversationId: conv.id,
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          status: 'sent' as const,
          metadata: msg.metadata,
        })) || [],
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.lastMessageAt || conv.createdAt),
      }));

      setConversations(apiConversations);

      // Sync to localStorage for offline access
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apiConversations));
    } catch (err) {      setError(err instanceof Error ? err.message : 'Failed to load conversations');

      // Fall back to localStorage
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }, [enableSync]);

  // Load from localStorage (fallback)
  const loadFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const conversations = parsed.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setConversations(conversations);
      }
    } catch (error) {    }
  }, []);

  // Initial load
  useEffect(() => {
    if (enableSync) {
      fetchConversations();
    } else {
      loadFromLocalStorage();
      setIsLoading(false);
    }
  }, [enableSync, fetchConversations, loadFromLocalStorage]);

  // Auto-sync interval
  useEffect(() => {
    if (!enableSync || !syncInterval) return;

    const interval = setInterval(fetchConversations, syncInterval);
    return () => clearInterval(interval);
  }, [enableSync, syncInterval, fetchConversations]);

  // Create a new conversation (API + localStorage)
  const createConversation = useCallback(
    async (firstMessage?: ChatMessage): Promise<ChatConversation> => {
      const title = firstMessage ? generateTitle(firstMessage.content) : 'New Conversation';

      // Optimistically create conversation locally
      const newConversation: ChatConversation = {
        id: crypto.randomUUID(),
        title,
        messages: firstMessage ? [firstMessage] : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setConversations((prev) => [newConversation, ...prev].slice(0, MAX_CONVERSATIONS));
      setActiveConversationId(newConversation.id);

      // Sync to API if enabled
      if (enableSync) {
        try {
          const response = await fetch('/api/v1/chatbot/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
          });

          if (response.ok) {
            const apiConversation = await response.json();
            // Update with server ID
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === newConversation.id
                  ? { ...conv, id: apiConversation.id }
                  : conv
              )
            );
            setActiveConversationId(apiConversation.id);
            return { ...newConversation, id: apiConversation.id };
          }
        } catch (error) {        }
      }

      return newConversation;
    },
    [enableSync]
  );

  // Add message to conversation
  const addMessage = useCallback((conversationId: string, message: ChatMessage) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          const updatedMessages = [...conv.messages, message];
          const newTitle =
            conv.title === 'New Conversation' && message.role === 'user'
              ? generateTitle(message.content)
              : conv.title;

          return {
            ...conv,
            title: newTitle,
            messages: updatedMessages,
            updatedAt: new Date(),
          };
        }
        return conv;
      })
    );

    // Sync to localStorage
    setTimeout(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const conversations = JSON.parse(stored);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
      }
    }, 100);
  }, []);

  // Update message in conversation
  const updateMessage = useCallback(
    (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              ),
              updatedAt: new Date(),
            };
          }
          return conv;
        })
      );
    },
    []
  );

  // Delete a conversation (API + localStorage)
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      // Optimistically delete locally
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));

      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
      }

      // Sync to API if enabled
      if (enableSync) {
        try {
          await fetch(`/api/v1/chatbot/conversations/${conversationId}`, {
            method: 'DELETE',
          });
        } catch (error) {        }
      }

      // Update localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const conversations = JSON.parse(stored);
        const updated = conversations.filter((c: any) => c.id !== conversationId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    },
    [activeConversationId, enableSync]
  );

  // Get active conversation
  const activeConversation = conversations.find(
    (conv) => conv.id === activeConversationId
  );

  // Generate title from message content
  const generateTitle = (content: string): string => {
    const trimmed = content.trim();
    return trimmed.length > 50 ? `${trimmed.substring(0, 50)}...` : trimmed;
  };

  // Filter conversations by search query
  const filteredConversations = searchQuery
    ? conversations.filter(
        (conv) =>
          conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.messages.some((msg) =>
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : conversations;

  // Group conversations by date
  const groupedConversations = useCallback((): ConversationGroup[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: ConversationGroup[] = [
      { label: 'Today', conversations: [] },
      { label: 'Yesterday', conversations: [] },
      { label: 'This Week', conversations: [] },
      { label: 'Older', conversations: [] },
    ];

    filteredConversations.forEach((conv) => {
      const convDate = new Date(conv.updatedAt);
      const convDateOnly = new Date(
        convDate.getFullYear(),
        convDate.getMonth(),
        convDate.getDate()
      );

      if (convDateOnly.getTime() === today.getTime()) {
        groups[0]!.conversations.push(conv);
      } else if (convDateOnly.getTime() === yesterday.getTime()) {
        groups[1]!.conversations.push(conv);
      } else if (convDate >= weekAgo) {
        groups[2]!.conversations.push(conv);
      } else {
        groups[3]!.conversations.push(conv);
      }
    });

    return groups.filter((group) => group.conversations.length > 0);
  }, [filteredConversations]);

  return {
    conversations: filteredConversations,
    groupedConversations: groupedConversations(),
    activeConversation,
    activeConversationId,
    searchQuery,
    isLoading,
    error,
    setSearchQuery,
    setActiveConversationId,
    createConversation,
    addMessage,
    updateMessage,
    deleteConversation,
    refresh: fetchConversations,
  };
}
