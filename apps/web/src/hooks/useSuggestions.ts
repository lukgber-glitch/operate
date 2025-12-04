/**
 * useSuggestions Hook
 * Fetch and manage AI suggestions, insights, and deadlines
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Suggestion,
  Insight,
  Deadline,
  SuggestionsResponse,
  InsightsResponse,
  DeadlinesResponse,
} from '@/types/suggestions';

interface UseSuggestionsOptions {
  page?: string;
  entityId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseSuggestionsReturn {
  suggestions: Suggestion[];
  insights: Insight[];
  deadlines: Deadline[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  dismissSuggestion: (id: string) => Promise<void>;
  applySuggestion: (id: string) => Promise<void>;
  dismissDeadline: (id: string, remindLater?: Date) => Promise<void>;
}

export function useSuggestions(
  options: UseSuggestionsOptions = {}
): UseSuggestionsReturn {
  const {
    page = 'dashboard',
    entityId,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
  } = options;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams({ page });
      if (entityId) params.append('entityId', entityId);

      const response = await fetch(`/api/v1/suggestions?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.statusText}`);
      }

      const data: SuggestionsResponse = await response.json();

      // Convert date strings to Date objects
      const parsedSuggestions = data.suggestions.map((s) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        expiresAt: s.expiresAt ? new Date(s.expiresAt) : undefined,
      }));

      const parsedInsights = data.insights.map((i) => ({
        ...i,
        createdAt: new Date(i.createdAt),
      }));

      const parsedDeadlines = data.deadlines.map((d) => ({
        ...d,
        dueDate: new Date(d.dueDate),
        remindLater: d.remindLater ? new Date(d.remindLater) : undefined,
      }));

      setSuggestions(parsedSuggestions);
      setInsights(parsedInsights);
      setDeadlines(parsedDeadlines);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, entityId]);

  const fetchInsights = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/suggestions/insights', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return;

      const data: InsightsResponse = await response.json();
      const parsedInsights = data.insights.map((i) => ({
        ...i,
        createdAt: new Date(i.createdAt),
      }));

      setInsights(parsedInsights);
    } catch (err) {
      console.error('Error fetching insights:', err);
    }
  }, []);

  const fetchDeadlines = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/suggestions/deadlines', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return;

      const data: DeadlinesResponse = await response.json();
      const parsedDeadlines = data.deadlines.map((d) => ({
        ...d,
        dueDate: new Date(d.dueDate),
        remindLater: d.remindLater ? new Date(d.remindLater) : undefined,
      }));

      setDeadlines(parsedDeadlines);
    } catch (err) {
      console.error('Error fetching deadlines:', err);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchSuggestions(), fetchInsights(), fetchDeadlines()]);
  }, [fetchSuggestions, fetchInsights, fetchDeadlines]);

  const dismissSuggestion = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/v1/suggestions/${id}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss suggestion');
      }

      // Remove from local state
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Error dismissing suggestion:', err);
      throw err;
    }
  }, []);

  const applySuggestion = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/v1/suggestions/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to apply suggestion');
      }

      // Remove from local state after applying
      setSuggestions((prev) => prev.filter((s) => s.id !== id));

      // Optionally return result
      return await response.json();
    } catch (err) {
      console.error('Error applying suggestion:', err);
      throw err;
    }
  }, []);

  const dismissDeadline = useCallback(async (id: string, remindLater?: Date) => {
    try {
      const response = await fetch(`/api/v1/suggestions/deadlines/${id}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remindLater }),
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss deadline');
      }

      // Update local state
      setDeadlines((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, isDismissed: true, remindLater } : d
        )
      );
    } catch (err) {
      console.error('Error dismissing deadline:', err);
      throw err;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSuggestions();
    // Only fetch insights and deadlines on initial load if needed
    if (!autoRefresh) {
      fetchInsights();
      fetchDeadlines();
    }
  }, [fetchSuggestions, fetchInsights, fetchDeadlines, autoRefresh]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    suggestions,
    insights,
    deadlines,
    isLoading,
    error,
    refresh,
    dismissSuggestion,
    applySuggestion,
    dismissDeadline,
  };
}
