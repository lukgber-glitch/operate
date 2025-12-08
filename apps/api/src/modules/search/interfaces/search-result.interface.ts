/**
 * Search Result Interface
 * Represents a unified search result from any indexable entity
 */

export enum SearchableEntityType {
  INVOICE = 'invoice',
  EXPENSE = 'expense',
  CLIENT = 'client',
  REPORT = 'report',
  EMPLOYEE = 'employee',
}

export interface SearchResult {
  entityType: SearchableEntityType;
  entityId: string;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IndexedEntity {
  entityType: SearchableEntityType;
  entityId: string;
  searchableText: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface SearchIndexStats {
  totalEntities: number;
  entitiesByType: Record<SearchableEntityType, number>;
  lastIndexUpdate: Date;
  indexSize: number;
}
