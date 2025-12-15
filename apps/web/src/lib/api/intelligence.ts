/**
 * Email Intelligence API Client
 * Handles all email intelligence-related API calls
 */

import { api } from './client';

export interface EmailActivityItem {
  id: string;
  date: Date;
  subject: string;
  from: string;
  category: string;
  action: string;
  entityType?: string;
  entityName?: string;
  amount?: number;
  currency?: string;
}

export interface RelationshipHealthSummary {
  total: number;
  byStatus: {
    EXCELLENT: number;
    GOOD: number;
    NEEDS_ATTENTION: number;
    AT_RISK: number;
    DORMANT: number;
  };
}

export interface AtRiskRelationship {
  id: string;
  type: 'CUSTOMER' | 'VENDOR';
  name: string;
  email?: string;
  healthStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'AT_RISK' | 'DORMANT';
  healthScore: number;
  lastContactDate: Date | null;
  daysSinceLastContact: number | null;
}

export interface EmailSuggestion {
  id: string;
  organisationId: string;
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'COMPLETED' | 'DISMISSED' | 'EXPIRED';
  title: string;
  message: string;
  entityId?: string;
  entityType?: 'CUSTOMER' | 'VENDOR' | 'INVOICE' | 'BILL' | 'CONTACT';
  entityName?: string;
  sourceEmailId?: string;
  sourceEmailSubject?: string;
  actionType?: string;
  actionMetadata?: any;
  actionTaken?: string;
  completedAt?: Date;
  dismissedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoCreatedEntity {
  id: string;
  type: 'CUSTOMER' | 'VENDOR';
  name: string;
  email?: string;
  createdAt: Date;
  source: string;
  emailCount: number;
}

export interface GetSuggestionsFilters {
  type?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'PENDING' | 'COMPLETED' | 'DISMISSED' | 'EXPIRED';
  limit?: number;
}

export interface GetAutoCreatedEntitiesFilters {
  dateFrom?: string;
  dateTo?: string;
}

class IntelligenceApi {
  /**
   * Get organisation ID from auth context
   * The orgId is set in window.__orgId by the useAuth hook when user authenticates
   *
   * NOTE: This method now returns empty string instead of throwing to prevent page crashes.
   * The API call will handle auth errors gracefully via the fetch() error handling.
   */
  private getOrgId(): string {
    // Try multiple sources for orgId
    if (typeof window !== 'undefined') {
      // First try window.__orgId (set by useAuth)
      if ((window as any).__orgId) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[IntelligenceAPI] Using window.__orgId:', (window as any).__orgId);
        }
        return (window as any).__orgId;
      }

      // Fallback: try to parse from cookie
      const authCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('op_auth='));

      if (authCookie) {
        try {
          const authValue = decodeURIComponent(authCookie.split('=')[1] || '');
          if (process.env.NODE_ENV === 'development') {
            console.log('[IntelligenceAPI] Found op_auth cookie, attempting to parse...');
          }
          const authData = JSON.parse(authValue);

          // Parse JWT to extract orgId
          if (authData.a) {
            const payload = JSON.parse(atob(authData.a.split('.')[1]));
            if (payload.orgId) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[IntelligenceAPI] Extracted orgId from JWT:', payload.orgId);
              }
              return payload.orgId;
            }
          }
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[IntelligenceAPI] Failed to parse auth cookie:', e);
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[IntelligenceAPI] No op_auth cookie found');
        }
      }
    }

    // Return empty string instead of throwing - let the API call handle the 401/403
    if (process.env.NODE_ENV === 'development') {
      console.warn('[IntelligenceAPI] Organisation ID not available - returning empty string');
    }
    return '';
  }

  /**
   * Get recent email activity with classifications and actions
   */
  async getEmailActivity(limit: number = 50): Promise<EmailActivityItem[]> {
    const orgId = this.getOrgId();
    const response = await api.get<{ data: EmailActivityItem[] }>(
      `/organisations/${orgId}/intelligence/email/activity`,
      { params: { limit: limit.toString() } }
    );
    return response.data.data;
  }

  /**
   * Get relationship health summary
   */
  async getRelationshipSummary(): Promise<RelationshipHealthSummary> {
    const orgId = this.getOrgId();
    const response = await api.get<{ data: RelationshipHealthSummary }>(
      `/organisations/${orgId}/intelligence/email/relationships/summary`
    );
    return response.data.data;
  }

  /**
   * Get at-risk relationships requiring attention
   */
  async getAtRiskRelationships(): Promise<AtRiskRelationship[]> {
    const orgId = this.getOrgId();
    const response = await api.get<{ data: AtRiskRelationship[] }>(
      `/organisations/${orgId}/intelligence/email/relationships/at-risk`
    );
    return response.data.data;
  }

  /**
   * Get active suggestions
   */
  async getSuggestions(filters?: GetSuggestionsFilters): Promise<EmailSuggestion[]> {
    const orgId = this.getOrgId();
    const response = await api.get<{ data: EmailSuggestion[] }>(
      `/organisations/${orgId}/intelligence/email/suggestions`,
      { params: filters as any }
    );
    return response.data.data;
  }

  /**
   * Dismiss a suggestion
   */
  async dismissSuggestion(suggestionId: string): Promise<EmailSuggestion> {
    const orgId = this.getOrgId();
    const response = await api.patch<{ data: EmailSuggestion }>(
      `/organisations/${orgId}/intelligence/email/suggestions/${suggestionId}/dismiss`
    );
    return response.data.data;
  }

  /**
   * Mark suggestion as completed
   */
  async completeSuggestion(suggestionId: string, actionTaken?: string): Promise<EmailSuggestion> {
    const orgId = this.getOrgId();
    const response = await api.patch<{ data: EmailSuggestion }>(
      `/organisations/${orgId}/intelligence/email/suggestions/${suggestionId}/complete`,
      { actionTaken }
    );
    return response.data.data;
  }

  /**
   * Get auto-created entities (customers/vendors) from email
   */
  async getAutoCreatedEntities(filters?: GetAutoCreatedEntitiesFilters): Promise<AutoCreatedEntity[]> {
    const orgId = this.getOrgId();
    const response = await api.get<{ data: AutoCreatedEntity[] }>(
      `/organisations/${orgId}/intelligence/email/auto-created`,
      { params: filters as any }
    );
    return response.data.data;
  }
}

export const intelligenceApi = new IntelligenceApi();
