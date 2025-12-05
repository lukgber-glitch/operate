'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatConversation, ChatMessage } from '@/types/chat';

/**
 * useConversationHistory - Hook for managing conversation history
 *
 * Manages conversation persistence, CRUD operations, and grouping by date.
 * Uses localStorage for client-side persistence (can be replaced with API calls).
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

  // Load conversations from localStorage on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveConversations();
    }
  }, [conversations, isLoading]);

  const loadConversations = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
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
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConversations = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  };

  // Create a new conversation
  const createConversation = useCallback((firstMessage?: ChatMessage): ChatConversation => {
    const newConversation: ChatConversation = {
      id: crypto.randomUUID(),
      title: firstMessage ? generateTitle(firstMessage.content) : 'New Conversation',
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
  const deleteConversation = useCallback((conversationId: string) => {
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
