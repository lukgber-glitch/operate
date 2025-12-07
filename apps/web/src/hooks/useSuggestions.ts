/**
 * useSuggestions Hook
 * Fetch and manage AI suggestions from the chatbot API
 */

import { useEffect, useState, useCallback } from 'react';
import { chatApi } from '@/lib/api/chat';
import { ApiClientError } from '@/lib/api/client';

/**
 * Suggestion from the backend chatbot API
 */
export interface ChatbotSuggestion {
  id: string;
  title: string;
  description: string;
  actionLabel?: string;
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  entityType?: string;
  entityId?: string;
  actionType?: string;
  actionParams?: Record<string, any>;
  data?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
  confidence?: number;
}

interface UseSuggestionsOptions {
  /**
   * Page context to filter suggestions (e.g., 'finance.invoices')
   */
  context?: string;
  /**
   * Maximum number of suggestions to fetch
   */
  limit?: number;
  /**
   * Auto-refresh interval in milliseconds (0 to disable)
   */
  refreshInterval?: number;
}

interface UseSuggestionsReturn {
  suggestions: ChatbotSuggestion[];
  isLoading: boolean;
  error: string | null;
  executeSuggestion: (id: string, params?: Record<string, any>) => Promise<void>;
  dismissSuggestion: (id: string, reason?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSuggestions(
  options: UseSuggestionsOptions = {}
): UseSuggestionsReturn {
  const {
    context,
    limit = 10,
    refreshInterval = 0,
  } = options;

  const [suggestions, setSuggestions] = useState<ChatbotSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch suggestions from the chatbot API
   */
  const fetchSuggestions = useCallback(async () => {
    try {
      setError(null);
      const response = await chatApi.getSuggestions(context) as any;

      // Transform the response to match our ChatbotSuggestion interface
      const fetchedSuggestions: ChatbotSuggestion[] = (response?.suggestions || response || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        actionLabel: s.actionLabel,
        type: s.type,
        priority: s.priority,
        entityType: s.entityType,
        entityId: s.entityId,
        actionType: s.actionType,
        actionParams: s.actionParams,
        data: s.data,
        createdAt: new Date(s.createdAt),
        expiresAt: s.expiresAt ? new Date(s.expiresAt) : undefined,
        confidence: s.confidence,
      }));

      // Apply limit
      const limitedSuggestions = limit > 0
        ? fetchedSuggestions.slice(0, limit)
        : fetchedSuggestions;

      setSuggestions(limitedSuggestions);
    } catch (err) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : 'Failed to fetch suggestions. Please try again.';
      setError(errorMessage);
      console.error('Error fetching suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [context, limit]);

  /**
   * Execute a suggestion
   */
  const executeSuggestion = useCallback(
    async (id: string, params?: Record<string, any>) => {
      try {
        // Find the suggestion
        const suggestion = suggestions.find((s) => s.id === id);
        if (!suggestion) {
          throw new Error('Suggestion not found');
        }

        // Call the API to execute the suggestion (using confirmAction endpoint)
        await chatApi.confirmAction(id, {
          messageId: suggestion.entityId,
          ...params,
        });

        // Optimistically remove the suggestion from the list
        setSuggestions((prev) => prev.filter((s) => s.id !== id));

        // Optionally refresh to get new suggestions
        setTimeout(() => {
          fetchSuggestions();
        }, 500);
      } catch (err) {
        const errorMessage =
          err instanceof ApiClientError
            ? err.message
            : 'Failed to execute suggestion. Please try again.';
        console.error('Error executing suggestion:', err);
        throw new Error(errorMessage);
      }
    },
    [suggestions, fetchSuggestions]
  );

  /**
   * Dismiss a suggestion
   */
  const dismissSuggestion = useCallback(
    async (id: string, reason?: string) => {
      try {
        // Call the API to dismiss the suggestion (using cancelAction endpoint)
        await chatApi.cancelAction(id, { reason });

        // Optimistically remove the suggestion from the list
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        const errorMessage =
          err instanceof ApiClientError
            ? err.message
            : 'Failed to dismiss suggestion. Please try again.';
        console.error('Error dismissing suggestion:', err);
        throw new Error(errorMessage);
      }
    },
    []
  );

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchSuggestions();
  }, [fetchSuggestions]);

  // Initial fetch
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchSuggestions();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    error,
    executeSuggestion,
    dismissSuggestion,
    refresh,
  };
}
