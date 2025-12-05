/**
 * useAIInsights Hook
 * Fetches and manages AI-generated insights for the dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import {
  AIInsight,
  AIInsightsResponse,
  InsightFilters,
  suggestionToAIInsight,
  insightToAIInsight,
} from '@/types/ai-insights';
import { Suggestion, Insight } from '@/types/suggestions';

interface UseAIInsightsOptions {
  filters?: InsightFilters;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseAIInsightsReturn {
  insights: AIInsight[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  dismissInsight: (insightId: string) => Promise<void>;
  snoozeInsight: (insightId: string, until: Date) => Promise<void>;
  clearDismissed: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function useAIInsights(
  options: UseAIInsightsOptions = {}
): UseAIInsightsReturn {
  const { filters, autoRefresh = false, refreshInterval = 300000 } = options; // 5 min default
  const { user, isAuthenticated } = useAuth();

  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch insights from API
   */
  const fetchInsights = useCallback(async () => {
    if (!isAuthenticated || !user?.orgId) {
      setInsights([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (filters?.categories) {
        params.append('categories', filters.categories.join(','));
      }
      if (filters?.urgency) {
        params.append('urgency', filters.urgency.join(','));
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters?.dismissed !== undefined) {
        params.append('dismissed', filters.dismissed.toString());
      }

      // Fetch suggestions
      const suggestionsUrl = `${API_BASE_URL}/api/suggestions?${params.toString()}`;
      const suggestionsResponse = await fetch(suggestionsUrl, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!suggestionsResponse.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const suggestionsData = await suggestionsResponse.json();
      const suggestions: Suggestion[] = suggestionsData.suggestions || [];

      // Fetch insights
      const insightsUrl = `${API_BASE_URL}/api/insights?orgId=${user.orgId}`;
      const insightsResponse = await fetch(insightsUrl, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let rawInsights: Insight[] = [];
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        rawInsights = insightsData.insights || [];
      }

      // Convert to AIInsight format
      const convertedSuggestions = suggestions.map(suggestionToAIInsight);
      const convertedInsights = rawInsights.map(insightToAIInsight);

      // Merge and sort by priority/urgency
      const allInsights = [...convertedSuggestions, ...convertedInsights]
        .filter((insight) => {
          // Apply filters
          if (filters?.categories && !filters.categories.includes(insight.category)) {
            return false;
          }
          if (filters?.urgency && !filters.urgency.includes(insight.urgency)) {
            return false;
          }
          if (filters?.dismissed === false && insight.isDismissed) {
            return false;
          }
          return true;
        })
        .sort((a, b) => {
          // Sort by urgency first, then by created date
          const urgencyOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          if (urgencyDiff !== 0) return urgencyDiff;

          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      // Apply limit
      const limitedInsights = filters?.limit
        ? allInsights.slice(0, filters.limit)
        : allInsights;

      setInsights(limitedInsights);
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setInsights([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.orgId, filters]);

  /**
   * Dismiss an insight
   */
  const dismissInsight = useCallback(async (insightId: string) => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/suggestions/${insightId}/dismiss`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss insight');
      }

      // Update local state
      setInsights((prev) =>
        prev.map((insight) =>
          insight.id === insightId
            ? { ...insight, isDismissed: true, dismissedAt: new Date() }
            : insight
        )
      );
    } catch (err) {
      console.error('Error dismissing insight:', err);
      throw err;
    }
  }, [isAuthenticated]);

  /**
   * Snooze an insight until a specific date
   */
  const snoozeInsight = useCallback(async (insightId: string, until: Date) => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/suggestions/${insightId}/snooze`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ until }),
      });

      if (!response.ok) {
        throw new Error('Failed to snooze insight');
      }

      // Update local state
      setInsights((prev) =>
        prev.map((insight) =>
          insight.id === insightId
            ? { ...insight, snoozeUntil: until }
            : insight
        )
      );
    } catch (err) {
      console.error('Error snoozing insight:', err);
      throw err;
    }
  }, [isAuthenticated]);

  /**
   * Clear all dismissed insights from local state
   */
  const clearDismissed = useCallback(() => {
    setInsights((prev) => prev.filter((insight) => !insight.isDismissed));
  }, []);

  /**
   * Refresh insights
   */
  const refresh = useCallback(async () => {
    await fetchInsights();
  }, [fetchInsights]);

  // Initial fetch
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchInsights();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchInsights]);

  return {
    insights,
    isLoading,
    error,
    refresh,
    dismissInsight,
    snoozeInsight,
    clearDismissed,
  };
}
