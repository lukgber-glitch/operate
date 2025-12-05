'use client';

import { useState, useCallback } from 'react';

import { api } from '@/lib/api/client';

export interface Conversation {
  id: string;
  title: string;
  lastMessageAt: Date;
  messages?: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Conversation[]>('/chatbot/conversations');
      setConversations(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (title?: string, context?: string) => {
    setIsLoading(true);
    try {
      const response = await api.post<Conversation>('/chatbot/conversations', {
        title,
        context,
      });
      setConversations((prev) => [response.data, ...prev]);
      setActiveConversation(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    setIsLoading(true);
    try {
      const response = await api.post<{ userMessage: Message; assistantMessage: Message }>(
        `/chatbot/conversations/${conversationId}/messages`,
        { content }
      );
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const quickAsk = useCallback(async (content: string) => {
    setIsLoading(true);
    try {
      const response = await api.post<{ content: string }>('/chatbot/quick-ask', { content });
      return response.data.content;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    conversations,
    activeConversation,
    isLoading,
    error,
    fetchConversations,
    createConversation,
    sendMessage,
    quickAsk,
    setActiveConversation,
  };
}
