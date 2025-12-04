/**
 * Search Indexer Service
 * Core service for indexing entities into Redis for fast search
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PrismaService } from '../database/prisma.service';
import {
  SearchableEntityType,
  IndexedEntity,
  SearchIndexStats,
} from './interfaces/search-result.interface';

@Injectable()
export class SearchIndexerService implements OnModuleInit {
  private readonly logger = new Logger(SearchIndexerService.name);
  private readonly INDEX_PREFIX = 'search:index:';
  private readonly STATS_KEY = 'search:stats';
  private readonly ANALYTICS_PREFIX = 'search:analytics:';

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.logger.log('Search Indexer Service initialized');
  }

  /**
   * Index a single entity
   */
  async indexEntity(
    entityType: SearchableEntityType,
    entityId: string,
    searchableText: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    try {
      const timestamp = Date.now();
      const indexKey = this.getIndexKey(entityType);
      const entityKey = this.getEntityKey(entityType, entityId);

      // Store searchable text in a hash for the entity
      await this.redis.hset(entityKey, {
        searchableText: searchableText.toLowerCase(),
        metadata: JSON.stringify(metadata),
        timestamp: timestamp.toString(),
      });

      // Add to sorted set for scoring and retrieval
      await this.redis.zadd(indexKey, timestamp, entityId);

      // Update stats
      await this.updateStats(entityType, 1);

      this.logger.debug(
        `Indexed ${entityType} entity ${entityId} with ${searchableText.length} chars`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to index ${entityType} ${entityId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Remove entity from index
   */
  async removeEntity(
    entityType: SearchableEntityType,
    entityId: string,
  ): Promise<void> {
    try {
      const indexKey = this.getIndexKey(entityType);
      const entityKey = this.getEntityKey(entityType, entityId);

      // Remove from sorted set
      await this.redis.zrem(indexKey, entityId);

      // Delete entity data
      await this.redis.del(entityKey);

      // Update stats
      await this.updateStats(entityType, -1);

      this.logger.debug(`Removed ${entityType} entity ${entityId} from index`);
    } catch (error) {
      this.logger.error(
        `Failed to remove ${entityType} ${entityId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Search for entities matching query
   */
  async search(
    query: string,
    entityTypes: SearchableEntityType[],
    limit: number = 10,
    offset: number = 0,
  ): Promise<IndexedEntity[]> {
    try {
      const normalizedQuery = query.toLowerCase().trim();
      const results: IndexedEntity[] = [];

      for (const entityType of entityTypes) {
        const indexKey = this.getIndexKey(entityType);

        // Get all entity IDs from sorted set (reverse chronological)
        const entityIds = await this.redis.zrevrange(
          indexKey,
          0,
          -1,
        );

        // Search through entities
        for (const entityId of entityIds) {
          const entityKey = this.getEntityKey(entityType, entityId);
          const entityData = await this.redis.hgetall(entityKey);

          if (!entityData.searchableText) continue;

          // Check if searchable text matches query (prefix or contains)
          const searchableText = entityData.searchableText;
          if (
            searchableText.includes(normalizedQuery) ||
            this.hasWordMatch(searchableText, normalizedQuery)
          ) {
            results.push({
              entityType,
              entityId,
              searchableText: entityData.searchableText,
              metadata: JSON.parse(entityData.metadata || '{}'),
              timestamp: parseInt(entityData.timestamp || '0'),
            });
          }

          // Stop if we have enough results
          if (results.length >= limit + offset) break;
        }

        // Stop if we have enough results
        if (results.length >= limit + offset) break;
      }

      // Sort by relevance (exact matches first, then by timestamp)
      results.sort((a, b) => {
        const aExact = a.searchableText.startsWith(normalizedQuery);
        const bExact = b.searchableText.startsWith(normalizedQuery);

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        return b.timestamp - a.timestamp;
      });

      // Apply pagination
      const paginatedResults = results.slice(offset, offset + limit);

      // Track search query
      await this.trackSearchQuery(query, paginatedResults.length);

      return paginatedResults;
    } catch (error) {
      this.logger.error(`Search failed for query "${query}": ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Re-index all entities of a specific type
   */
  async reindexEntityType(
    orgId: string,
    entityType: SearchableEntityType,
  ): Promise<number> {
    this.logger.log(`Starting reindex for ${entityType} in org ${orgId}`);
    let count = 0;

    try {
      switch (entityType) {
        case SearchableEntityType.INVOICE:
          count = await this.reindexInvoices(orgId);
          break;
        case SearchableEntityType.EXPENSE:
          count = await this.reindexExpenses(orgId);
          break;
        case SearchableEntityType.CLIENT:
          count = await this.reindexClients(orgId);
          break;
        case SearchableEntityType.REPORT:
          count = await this.reindexReports(orgId);
          break;
        case SearchableEntityType.EMPLOYEE:
          count = await this.reindexEmployees(orgId);
          break;
      }

      this.logger.log(`Reindexed ${count} ${entityType} entities for org ${orgId}`);
      return count;
    } catch (error) {
      this.logger.error(
        `Reindex failed for ${entityType} in org ${orgId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Re-index all invoices
   */
  private async reindexInvoices(orgId: string): Promise<number> {
    const invoices = await this.prisma.invoice.findMany({
      where: { orgId },
      select: {
        id: true,
        number: true,
        customerName: true,
        totalAmount: true,
        status: true,
        issueDate: true,
        dueDate: true,
      },
    });

    for (const invoice of invoices) {
      const searchableText = [
        invoice.number,
        invoice.customerName,
        invoice.totalAmount?.toString() || '',
        invoice.status,
      ]
        .filter(Boolean)
        .join(' ');

      await this.indexEntity(
        SearchableEntityType.INVOICE,
        invoice.id,
        searchableText,
        {
          number: invoice.number,
          customerName: invoice.customerName,
          amount: invoice.totalAmount,
          status: invoice.status,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
        },
      );
    }

    return invoices.length;
  }

  /**
   * Re-index all expenses
   */
  private async reindexExpenses(orgId: string): Promise<number> {
    const expenses = await this.prisma.transaction.findMany({
      where: {
        orgId,
        type: 'EXPENSE',
      },
      select: {
        id: true,
        description: true,
        amount: true,
        category: true,
        date: true,
        vendor: true,
      },
    });

    for (const expense of expenses) {
      const searchableText = [
        expense.vendor || '',
        expense.description || '',
        expense.category || '',
        expense.amount?.toString() || '',
      ]
        .filter(Boolean)
        .join(' ');

      await this.indexEntity(
        SearchableEntityType.EXPENSE,
        expense.id,
        searchableText,
        {
          vendor: expense.vendor,
          category: expense.category,
          amount: expense.amount,
          date: expense.date,
          description: expense.description,
        },
      );
    }

    return expenses.length;
  }

  /**
   * Re-index all clients
   */
  private async reindexClients(orgId: string): Promise<number> {
    const clients = await this.prisma.client.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        taxId: true,
      },
    });

    for (const client of clients) {
      const searchableText = [
        client.name,
        client.email || '',
        client.company || '',
        client.taxId || '',
      ]
        .filter(Boolean)
        .join(' ');

      await this.indexEntity(
        SearchableEntityType.CLIENT,
        client.id,
        searchableText,
        {
          name: client.name,
          email: client.email,
          company: client.company,
          taxId: client.taxId,
        },
      );
    }

    return clients.length;
  }

  /**
   * Re-index all reports
   */
  private async reindexReports(orgId: string): Promise<number> {
    // Assuming there's a Report model - adjust as needed
    // For now, we'll return 0 as placeholder
    this.logger.warn('Report reindexing not yet implemented');
    return 0;
  }

  /**
   * Re-index all employees
   */
  private async reindexEmployees(orgId: string): Promise<number> {
    const employees = await this.prisma.employee.findMany({
      where: { orgId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
      },
    });

    for (const employee of employees) {
      const searchableText = [
        employee.firstName,
        employee.lastName,
        employee.email || '',
        employee.department || '',
      ]
        .filter(Boolean)
        .join(' ');

      await this.indexEntity(
        SearchableEntityType.EMPLOYEE,
        employee.id,
        searchableText,
        {
          firstName: employee.firstName,
          lastName: employee.lastName,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          department: employee.department,
        },
      );
    }

    return employees.length;
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<SearchIndexStats> {
    try {
      const stats = await this.redis.hgetall(this.STATS_KEY);
      const entitiesByType: Record<SearchableEntityType, number> = {
        [SearchableEntityType.INVOICE]: parseInt(stats[SearchableEntityType.INVOICE] || '0'),
        [SearchableEntityType.EXPENSE]: parseInt(stats[SearchableEntityType.EXPENSE] || '0'),
        [SearchableEntityType.CLIENT]: parseInt(stats[SearchableEntityType.CLIENT] || '0'),
        [SearchableEntityType.REPORT]: parseInt(stats[SearchableEntityType.REPORT] || '0'),
        [SearchableEntityType.EMPLOYEE]: parseInt(stats[SearchableEntityType.EMPLOYEE] || '0'),
      };

      const totalEntities = Object.values(entitiesByType).reduce((sum, count) => sum + count, 0);

      return {
        totalEntities,
        entitiesByType,
        lastIndexUpdate: new Date(parseInt(stats.lastUpdate || '0')),
        indexSize: totalEntities,
      };
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Clear all search indices
   */
  async clearAll(): Promise<void> {
    try {
      const pattern = `${this.INDEX_PREFIX}*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      await this.redis.del(this.STATS_KEY);

      this.logger.log(`Cleared ${keys.length} index keys`);
    } catch (error) {
      this.logger.error(`Failed to clear indices: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Track search query for analytics
   */
  private async trackSearchQuery(query: string, resultCount: number): Promise<void> {
    try {
      const analyticsKey = `${this.ANALYTICS_PREFIX}queries`;
      const timestamp = Date.now();

      await this.redis.zadd(analyticsKey, timestamp, JSON.stringify({
        query,
        resultCount,
        timestamp,
      }));

      // Keep only last 1000 queries
      await this.redis.zremrangebyrank(analyticsKey, 0, -1001);
    } catch (error) {
      this.logger.warn(`Failed to track search query: ${error.message}`);
    }
  }

  /**
   * Get popular search queries
   */
  async getPopularQueries(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
    try {
      const analyticsKey = `${this.ANALYTICS_PREFIX}queries`;
      const queries = await this.redis.zrevrange(analyticsKey, 0, 999);

      const queryMap = new Map<string, number>();

      for (const item of queries) {
        try {
          const data = JSON.parse(item);
          const count = queryMap.get(data.query) || 0;
          queryMap.set(data.query, count + 1);
        } catch {
          continue;
        }
      }

      return Array.from(queryMap.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get popular queries: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Helper: Get index key for entity type
   */
  private getIndexKey(entityType: SearchableEntityType): string {
    return `${this.INDEX_PREFIX}${entityType}`;
  }

  /**
   * Helper: Get entity key
   */
  private getEntityKey(entityType: SearchableEntityType, entityId: string): string {
    return `${this.INDEX_PREFIX}${entityType}:${entityId}`;
  }

  /**
   * Helper: Update statistics
   */
  private async updateStats(entityType: SearchableEntityType, delta: number): Promise<void> {
    try {
      await this.redis.hincrby(this.STATS_KEY, entityType, delta);
      await this.redis.hset(this.STATS_KEY, 'lastUpdate', Date.now().toString());
    } catch (error) {
      this.logger.warn(`Failed to update stats: ${error.message}`);
    }
  }

  /**
   * Helper: Check if query matches any word in text (prefix matching)
   */
  private hasWordMatch(text: string, query: string): boolean {
    const words = text.split(/\s+/);
    const queryWords = query.split(/\s+/);

    for (const queryWord of queryWords) {
      const hasMatch = words.some(word => word.startsWith(queryWord));
      if (!hasMatch) return false;
    }

    return true;
  }
}
