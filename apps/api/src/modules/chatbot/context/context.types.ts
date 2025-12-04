/**
 * Context Types
 * Defines types for the context-awareness engine
 */

export interface ContextParams {
  userId: string;
  organizationId: string;
  currentPage?: string; // e.g., "/dashboard", "/invoices/123", "/tax/vat"
  selectedEntityType?: string; // e.g., "invoice", "expense", "contact"
  selectedEntityId?: string;
  additionalContext?: Record<string, any>;
}

export interface ChatContext {
  user: UserContext;
  organization: OrgContext;
  page: PageContext;
  entity?: EntityContext;
  recentActivity: ActivityContext[];
  suggestions: string[];
  metadata?: Record<string, any>;
}

export interface UserContext {
  id: string;
  name: string;
  email: string;
  role?: string;
  permissions?: string[];
  locale?: string;
}

export interface OrgContext {
  id: string;
  name: string;
  country: string;
  currency: string;
  industry?: string;
  taxRegime?: string;
  fiscalYearEnd?: string;
  features?: string[];
}

export interface PageContext {
  type: string; // e.g., "invoice-detail", "dashboard", "tax-overview"
  route: string;
  description: string;
  relevantEntities?: string[]; // Entity types relevant to this page
  availableActions?: string[]; // Actions user can take on this page
}

export interface EntityContext {
  type: string; // e.g., "invoice", "expense", "contact"
  id: string;
  summary: string; // Human-readable summary for AI
  data: Record<string, any>; // Relevant fields only (not all)
  relatedEntities?: Array<{
    type: string;
    id: string;
    relation: string;
  }>;
  metadata?: Record<string, any>;
}

export interface ActivityContext {
  action: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  timestamp: Date;
  description?: string;
}

export interface ContextProviderInterface {
  entityType: string;

  /**
   * Get full context for an entity
   */
  getContext(entityId: string, orgId: string): Promise<EntityContext>;

  /**
   * Generate human-readable summary
   */
  getSummary(entity: any): string;

  /**
   * Extract only relevant fields
   */
  getRelevantFields(entity: any): Record<string, any>;

  /**
   * Get suggested actions for this entity
   */
  getSuggestedActions(entity: any): string[];
}

export interface PageContextConfig {
  pattern: RegExp; // Route pattern to match
  type: string;
  description: string;
  relevantEntityTypes?: string[];
  defaultSuggestions?: string[];
  availableActions?: string[];
}
