/**
 * Indexable Entity Interface
 * Contract for entities that can be indexed for search
 */

import { SearchableEntityType, SearchResult } from './search-result.interface';

export interface IndexableEntity {
  /**
   * Convert entity to searchable text for indexing
   */
  toSearchableText(): string;

  /**
   * Convert entity to search result format
   */
  toSearchResult(): SearchResult;

  /**
   * Get the entity type for indexing
   */
  getEntityType(): SearchableEntityType;

  /**
   * Get unique identifier
   */
  getId(): string;

  /**
   * Get metadata for indexing
   */
  getMetadata(): Record<string, any>;
}
