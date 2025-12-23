/**
 * Search Service
 * High-level search API for converting indexed entities to search results
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SearchIndexerService } from './search-indexer.service';
import {
  SearchableEntityType,
  SearchResult,
  SearchIndexStats,
} from './interfaces/search-result.interface';
import { SearchQueryDto, SearchResponseDto, SearchResultDto } from './dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly searchIndexer: SearchIndexerService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Execute search query and return formatted results
   */
  async search(
    orgId: string,
    queryDto: SearchQueryDto,
  ): Promise<SearchResponseDto> {
    const startTime = Date.now();

    try {
      // Determine which entity types to search
      const entityTypes = queryDto.types && queryDto.types.length > 0
        ? queryDto.types
        : Object.values(SearchableEntityType);

      // Execute search
      const indexedEntities = await this.searchIndexer.search(
        queryDto.q,
        entityTypes,
        queryDto.limit || 10,
        queryDto.offset || 0,
      );

      // Convert indexed entities to search results
      const results = await Promise.all(
        indexedEntities.map(entity =>
          this.convertToSearchResult(orgId, entity),
        ),
      );

      // Filter out null results (entities that may have been deleted)
      const validResults = results.filter(r => r !== null) as SearchResultDto[];

      const executionTime = Date.now() - startTime;

      return {
        results: validResults,
        total: validResults.length,
        query: queryDto.q,
        executionTime,
        types: entityTypes,
      };
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Convert indexed entity to search result
   */
  private async convertToSearchResult(
    orgId: string,
    indexedEntity: any,
  ): Promise<SearchResultDto | null> {
    try {
      switch (indexedEntity.entityType) {
        case SearchableEntityType.INVOICE:
          return await this.invoiceToSearchResult(orgId, indexedEntity);
        case SearchableEntityType.EXPENSE:
          return await this.expenseToSearchResult(orgId, indexedEntity);
        case SearchableEntityType.CLIENT:
          return await this.clientToSearchResult(orgId, indexedEntity);
        case SearchableEntityType.REPORT:
          return await this.reportToSearchResult(orgId, indexedEntity);
        case SearchableEntityType.EMPLOYEE:
          return await this.employeeToSearchResult(orgId, indexedEntity);
        default:
          return null;
      }
    } catch (error) {
      this.logger.warn(
        `Failed to convert ${indexedEntity.entityType} ${indexedEntity.entityId}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Convert invoice to search result
   */
  private async invoiceToSearchResult(
    orgId: string,
    indexedEntity: any,
  ): Promise<SearchResultDto | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: indexedEntity.entityId, orgId },
    });

    if (!invoice) return null;

    const metadata = indexedEntity.metadata || {};

    return {
      entityType: SearchableEntityType.INVOICE,
      entityId: invoice.id,
      title: metadata.number || invoice.number || 'Invoice',
      subtitle: `${metadata.customerName || invoice.customerName} - ${this.formatCurrency(metadata.amount || invoice.totalAmount)}`,
      description: `${metadata.status || invoice.status} - Due: ${this.formatDate(metadata.dueDate || invoice.dueDate)}`,
      url: `/invoices/${invoice.id}`,
      relevanceScore: this.calculateRelevance(indexedEntity),
      metadata: {
        status: invoice.status,
        amount: invoice.totalAmount,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
      },
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  /**
   * Convert expense to search result
   */
  private async expenseToSearchResult(
    orgId: string,
    indexedEntity: any,
  ): Promise<SearchResultDto | null> {
    const expense = await this.prisma.transaction.findUnique({
      where: { id: indexedEntity.entityId, orgId },
      include: {
        vendor: true,
      },
    });

    if (!expense) return null;

    const metadata = indexedEntity.metadata || {};

    return {
      entityType: SearchableEntityType.EXPENSE,
      entityId: expense.id,
      title: metadata.vendor || expense.vendor?.name || 'Expense',
      subtitle: `${metadata.category || expense.category} - ${this.formatCurrency(metadata.amount || expense.amount)}`,
      description: metadata.description || expense.description || '',
      url: `/expenses/${expense.id}`,
      relevanceScore: this.calculateRelevance(indexedEntity),
      metadata: {
        vendor: expense.vendor?.name,
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
      },
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }

  /**
   * Convert client to search result
   */
  private async clientToSearchResult(
    orgId: string,
    indexedEntity: any,
  ): Promise<SearchResultDto | null> {
    const client = await this.prisma.client.findUnique({
      where: { id: indexedEntity.entityId, orgId },
    });

    if (!client) return null;

    const metadata = indexedEntity.metadata || {};

    return {
      entityType: SearchableEntityType.CLIENT,
      entityId: client.id,
      title: metadata.name || client.name,
      subtitle: metadata.company || client.company || metadata.email || client.email || '',
      description: metadata.taxId || client.taxId ? `Tax ID: ${metadata.taxId || client.taxId}` : '',
      url: `/clients/${client.id}`,
      relevanceScore: this.calculateRelevance(indexedEntity),
      metadata: {
        name: client.name,
        email: client.email,
        company: client.company,
        taxId: client.taxId,
      },
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }

  /**
   * Convert report to search result
   */
  private async reportToSearchResult(
    orgId: string,
    indexedEntity: any,
  ): Promise<SearchResultDto | null> {
    // Placeholder - implement when Report model is available
    this.logger.warn('Report search result conversion not yet implemented');
    return null;
  }

  /**
   * Convert employee to search result
   */
  private async employeeToSearchResult(
    orgId: string,
    indexedEntity: any,
  ): Promise<SearchResultDto | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: indexedEntity.entityId, orgId },
    });

    if (!employee) return null;

    const metadata = indexedEntity.metadata || {};

    return {
      entityType: SearchableEntityType.EMPLOYEE,
      entityId: employee.id,
      title: metadata.name || `${employee.firstName} ${employee.lastName}`,
      subtitle: metadata.email || employee.email || '',
      description: metadata.department || employee.department || '',
      url: `/employees/${employee.id}`,
      relevanceScore: this.calculateRelevance(indexedEntity),
      metadata: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        department: employee.department,
      },
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  /**
   * Reindex all entities for an organization
   */
  async reindexAll(orgId: string): Promise<{
    total: number;
    byType: Record<SearchableEntityType, number>;
  }> {
    this.logger.log(`Starting full reindex for org ${orgId}`);

    const byType: Record<SearchableEntityType, number> = {
      [SearchableEntityType.INVOICE]: 0,
      [SearchableEntityType.EXPENSE]: 0,
      [SearchableEntityType.CLIENT]: 0,
      [SearchableEntityType.REPORT]: 0,
      [SearchableEntityType.EMPLOYEE]: 0,
    };

    for (const entityType of Object.values(SearchableEntityType)) {
      try {
        const count = await this.searchIndexer.reindexEntityType(orgId, entityType);
        byType[entityType] = count;
      } catch (error) {
        this.logger.error(
          `Failed to reindex ${entityType}: ${error.message}`,
          error.stack,
        );
      }
    }

    const total = Object.values(byType).reduce((sum, count) => sum + count, 0);

    this.logger.log(`Completed reindex for org ${orgId}: ${total} total entities`);

    return { total, byType };
  }

  /**
   * Get search index statistics
   */
  async getStats(): Promise<SearchIndexStats> {
    return this.searchIndexer.getStats();
  }

  /**
   * Get popular search queries
   */
  async getPopularQueries(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
    return this.searchIndexer.getPopularQueries(limit);
  }

  /**
   * Helper: Calculate relevance score
   */
  private calculateRelevance(indexedEntity: any): number {
    // Simple relevance based on recency (0-1 scale)
    const age = Date.now() - indexedEntity.timestamp;
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
    return Math.max(0, 1 - age / maxAge);
  }

  /**
   * Helper: Format currency
   */
  private formatCurrency(amount: any): string {
    if (amount === null || amount === undefined) return '$0.00';
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    return `$${num.toFixed(2)}`;
  }

  /**
   * Helper: Format date
   */
  private formatDate(date: any): string {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
