/**
 * Tax Assistant API Client
 * Handles all tax assistant-related API calls
 */

// Tax Suggestion Types
export interface TaxSuggestion {
  id: string;
  type: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  potentialSavings: number;
  expiresAt?: string;
  actionUrl?: string;
  actionLabel?: string;
  status: "ACTIVE" | "COMPLETED" | "DISMISSED";
  createdAt: string;
  updatedAt: string;
}

// Tax Deadline Types
export interface TaxDeadline {
  id: string;
  name: string;
  description?: string;
  date: string;
  type: string;
  actionUrl?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tax Summary Types
export interface TaxSummary {
  totalPotentialSavings: number;
  activeSuggestionsCount: number;
  completedSuggestionsCount: number;
  dismissedSuggestionsCount: number;
  upcomingDeadlinesCount: number;
}

// Filters
export interface SuggestionsFilters {
  priority?: string[];
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface DeadlinesFilters {
  daysAhead?: number;
  type?: string;
  limit?: number;
  offset?: number;
}

class TaxAssistantApi {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  private getOrgId(): string {
    if (typeof window !== 'undefined') {
      if ((window as any).__orgId) {
        return (window as any).__orgId;
      }

      const authCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('op_auth='));

      if (authCookie) {
        try {
          const cookieValue = authCookie.split('=')[1];
          if (cookieValue) {
            const authData = JSON.parse(decodeURIComponent(cookieValue));
            if (authData.organisationId) {
              return authData.organisationId;
            }
          }
        } catch (e) {
          console.error('[TaxAssistantAPI] Failed to parse auth cookie:', e);
        }
      }
    }

    return '';
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const orgId = this.getOrgId();

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge existing headers if any
    if (options?.headers) {
      const existingHeaders = options.headers;
      if (existingHeaders instanceof Headers) {
        existingHeaders.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(existingHeaders)) {
        existingHeaders.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, existingHeaders);
      }
    }

    if (orgId) {
      headers['x-organisation-id'] = orgId;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || response.statusText;
      } catch {
        errorMessage = errorText || response.statusText;
      }

      throw new Error(errorMessage);
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  }

  // Tax Suggestions
  async getSuggestions(filters?: SuggestionsFilters): Promise<TaxSuggestion[]> {
    const params = new URLSearchParams();

    if (filters?.priority?.length) {
      filters.priority.forEach(p => params.append("priority", p));
    }
    if (filters?.type) params.append("type", filters.type);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    const queryString = params.toString();
    const endpoint = `/tax-assistant/suggestions${queryString ? `?${queryString}` : ''}`;

    return this.request<TaxSuggestion[]>(endpoint);
  }

  async dismissSuggestion(suggestionId: string): Promise<void> {
    return this.request<void>(`/tax-assistant/suggestions/${suggestionId}/dismiss`, {
      method: 'POST',
    });
  }

  async completeSuggestion(suggestionId: string): Promise<void> {
    return this.request<void>(`/tax-assistant/suggestions/${suggestionId}/complete`, {
      method: 'POST',
    });
  }

  // Tax Deadlines
  async getDeadlines(filters?: DeadlinesFilters): Promise<TaxDeadline[]> {
    const params = new URLSearchParams();

    if (filters?.daysAhead) params.append("daysAhead", filters.daysAhead.toString());
    if (filters?.type) params.append("type", filters.type);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    const queryString = params.toString();
    const endpoint = `/tax-assistant/deadlines${queryString ? `?${queryString}` : ''}`;

    return this.request<TaxDeadline[]>(endpoint);
  }

  // Tax Summary
  async getSummary(): Promise<TaxSummary> {
    return this.request<TaxSummary>('/tax-assistant/summary');
  }

  // Run Analysis
  async runAnalysis(): Promise<void> {
    return this.request<void>('/tax-assistant/analyze', {
      method: 'POST',
    });
  }
}

export const taxAssistantApi = new TaxAssistantApi();
