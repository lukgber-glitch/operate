/**
 * useAIInsights Hook
 * Fetches and manages AI-generated insights for the dashboard
 *
 * OPTIMIZATIONS:
 * - AbortController for cleanup on unmount
 * - Stable filter dependencies using JSON serialization
 * - Memoized return object
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  enabled?: boolean; // Allow disabling automatic fetching
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
  const { filters, autoRefresh = false, refreshInterval = 300000, enabled = true } = options; // 5 min default
  const { user, isAuthenticated } = useAuth();

  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // AbortController ref for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // Serialize filters to stable string for dependency comparison
  const filterKey = useMemo(() => JSON.stringify(filters || {}), [filters]);

  /**
   * Fetch insights from API
   */
  const fetchInsights = useCallback(async () => {
    if (!isAuthenticated || !user?.orgId) {
      setInsights([]);
      setIsLoading(false);
      return;
    }

    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      setIsLoading(true);
      setError(null);

      // Parse filters from stable key
      const parsedFilters: InsightFilters = filterKey ? JSON.parse(filterKey) : {};

      // Build query params
      const params = new URLSearchParams();
      if (parsedFilters.categories) {
        params.append('categories', parsedFilters.categories.join(','));
      }
      if (parsedFilters.urgency) {
        params.append('urgency', parsedFilters.urgency.join(','));
      }
      if (parsedFilters.limit) {
        params.append('limit', parsedFilters.limit.toString());
      }
      if (parsedFilters.dismissed !== undefined) {
        params.append('dismissed', parsedFilters.dismissed.toString());
      }

      // Fetch suggestions
      const suggestionsUrl = `${API_BASE_URL}/suggestions?${params.toString()}`;
      const suggestionsResponse = await fetch(suggestionsUrl, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });

      if (!suggestionsResponse.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const suggestionsData = await suggestionsResponse.json();
      const suggestions: Suggestion[] = suggestionsData.suggestions || [];

      // Fetch insights
      const insightsUrl = `${API_BASE_URL}/insights?orgId=${user.orgId}`;
      const insightsResponse = await fetch(insightsUrl, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
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
          if (parsedFilters.categories && !parsedFilters.categories.includes(insight.category)) {
            return false;
          }
          if (parsedFilters.urgency && !parsedFilters.urgency.includes(insight.urgency)) {
            return false;
          }
          if (parsedFilters.dismissed === false && insight.isDismissed) {
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
      const limitedInsights = parsedFilters.limit
        ? allInsights.slice(0, parsedFilters.limit)
        : allInsights;

      setInsights(limitedInsights);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Error fetching AI insights:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setInsights([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.orgId, filterKey]);

  /**
   * Dismiss an insight
   */
  const dismissInsight = useCallback(async (insightId: string) => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(`${API_BASE_URL}/suggestions/${insightId}/dismiss`, {
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
      const response = await fetch(`${API_BASE_URL}/suggestions/${insightId}/snooze`, {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Initial fetch - only if enabled
  useEffect(() => {
    if (enabled) {
      fetchInsights();
    } else {
      setIsLoading(false);
    }
  }, [fetchInsights, enabled]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchInsights();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchInsights]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    insights,
    isLoading,
    error,
    refresh,
    dismissInsight,
    snoozeInsight,
    clearDismissed,
  }), [insights, isLoading, error, refresh, dismissInsight, snoozeInsight, clearDismissed]);
}
