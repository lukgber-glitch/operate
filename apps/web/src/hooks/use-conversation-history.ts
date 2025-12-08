'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatConversation, ChatMessage } from '@/types/chat';

/**
 * useConversationHistory - Hook for managing conversation history
 *
 * Manages conversation persistence, CRUD operations, and grouping by date.
 * Now uses backend API for persistence with localStorage fallback.
 */

const STORAGE_KEY = 'operate_conversations';
const MAX_CONVERSATIONS = 100; // Limit stored conversations

interface ConversationGroup {
  label: string;
  conversations: ChatConversation[];
}

export function useConversationHistory() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations from backend on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      // Try to fetch from backend first
      const response = await fetch('/api/v1/chatbot/conversations?limit=100', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const backendConversations = data.conversations.map((conv: any) => ({
          id: conv.id,
          title: conv.title || 'New Conversation',
          messages: conv.messages?.map((msg: any) => ({
            id: msg.id,
            conversationId: msg.conversationId,
            role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
            content: msg.content,
            timestamp: new Date(msg.createdAt),
            status: 'sent' as const,
            metadata: {
              actionType: msg.actionType,
              actionParams: msg.actionParams,
              actionResult: msg.actionResult,
              actionStatus: msg.actionStatus,
            },
          })) || [],
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
        }));
        setConversations(backendConversations);
      } else {
        // Fallback to localStorage if backend fails
        loadFromLocalStorage();
      }
    } catch (error) {
      // Fallback to localStorage on API error
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
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
    } catch (error) {
      // Start with empty conversations if loading fails
    }
  };

  const saveConversations = () => {
    try {
      // Keep localStorage sync as fallback
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      // Silent fail on storage error
    }
  };

  // Create a new conversation
  const createConversation = useCallback(async (firstMessage?: ChatMessage): Promise<ChatConversation> => {
    const title = firstMessage ? generateTitle(firstMessage.content) : 'New Conversation';

    try {
      // Try to create on backend first
      const response = await fetch('/api/v1/chatbot/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        const data = await response.json();
        const newConversation: ChatConversation = {
          id: data.id,
          title: data.title || title,
          messages: firstMessage ? [firstMessage] : [],
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        };

        setConversations((prev) => {
          const updated = [newConversation, ...prev].slice(0, MAX_CONVERSATIONS);
          return updated;
        });

        setActiveConversationId(newConversation.id);
        return newConversation;
      }
    } catch (error) {
      // Fallback to local-only conversation
    }

    // Fallback to local-only conversation
    const newConversation: ChatConversation = {
      id: crypto.randomUUID(),
      title,
      messages: firstMessage ? [firstMessage] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations((prev) => {
      const updated = [newConversation, ...prev].slice(0, MAX_CONVERSATIONS);
      return updated;
    });

    setActiveConversationId(newConversation.id);
    return newConversation;
  }, []);

  // Add message to conversation
  const addMessage = useCallback((conversationId: string, message: ChatMessage) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          const updatedMessages = [...conv.messages, message];
          // Update title based on first user message if still default
          const newTitle = conv.title === 'New Conversation' && message.role === 'user'
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
  }, []);

  // Update message in conversation
  const updateMessage = useCallback((conversationId: string, messageId: string, updates: Partial<ChatMessage>) => {
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
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      // Try to delete on backend
      await fetch(`/api/v1/chatbot/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      // Continue with local deletion
    }

    // Update local state regardless
    setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }
  }, [activeConversationId]);

  // Get active conversation
  const activeConversation = conversations.find(
    (conv) => conv.id === activeConversationId
  );

  // Generate title from message content (first 50 chars)
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

    // Filter out empty groups
    return groups.filter((group) => group.conversations.length > 0);
  }, [filteredConversations]);

  return {
    conversations: filteredConversations,
    groupedConversations: groupedConversations(),
    activeConversation,
    activeConversationId,
    searchQuery,
    isLoading,
    setSearchQuery,
    setActiveConversationId,
    createConversation,
    addMessage,
    updateMessage,
    deleteConversation,
  };
}
