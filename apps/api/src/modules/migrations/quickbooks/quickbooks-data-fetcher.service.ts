/**
 * QuickBooks Data Fetcher Service
 * Handles paginated data fetching from QuickBooks API with rate limiting
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { getQuickBooksEndpoints } from '../../quickbooks/quickbooks.config';
import {
  QBCustomer,
  QBVendor,
  QBItem,
  QBInvoice,
  QBBill,
  QBPayment,
  QBAccount,
  QBTaxRate,
  MigrationEntityType,
} from './quickbooks-migration.types';

interface FetchOptions {
  accessToken: string;
  companyId: string;
  includeInactive?: boolean;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  batchSize?: number;
  rateLimitDelay?: number;
}

interface FetchResult<T> {
  items: T[];
  totalCount: number;
  fetchedCount: number;
  hasMore: boolean;
}

@Injectable()
export class QuickBooksDataFetcherService {
  private readonly logger = new Logger(QuickBooksDataFetcherService.name);
  private readonly MAX_RESULTS_PER_PAGE = 1000; // QB API limit
  private readonly DEFAULT_BATCH_SIZE = 100;
  private readonly DEFAULT_RATE_LIMIT_DELAY = 500; // ms

  /**
   * Fetch all customers from QuickBooks
   */
  async fetchCustomers(options: FetchOptions): Promise<FetchResult<QBCustomer>> {
    this.logger.log('Fetching customers from QuickBooks');

    const query = this.buildQuery('Customer', options);
    return this.fetchEntitiesPaginated<QBCustomer>('Customer', query, options);
  }

  /**
   * Fetch all vendors from QuickBooks
   */
  async fetchVendors(options: FetchOptions): Promise<FetchResult<QBVendor>> {
    this.logger.log('Fetching vendors from QuickBooks');

    const query = this.buildQuery('Vendor', options);
    return this.fetchEntitiesPaginated<QBVendor>('Vendor', query, options);
  }

  /**
   * Fetch all items (products/services) from QuickBooks
   */
  async fetchItems(options: FetchOptions): Promise<FetchResult<QBItem>> {
    this.logger.log('Fetching items from QuickBooks');

    const query = this.buildQuery('Item', options);
    return this.fetchEntitiesPaginated<QBItem>('Item', query, options);
  }

  /**
   * Fetch all invoices from QuickBooks
   */
  async fetchInvoices(options: FetchOptions): Promise<FetchResult<QBInvoice>> {
    this.logger.log('Fetching invoices from QuickBooks');

    const query = this.buildQuery('Invoice', options);
    return this.fetchEntitiesPaginated<QBInvoice>('Invoice', query, options);
  }

  /**
   * Fetch all bills from QuickBooks
   */
  async fetchBills(options: FetchOptions): Promise<FetchResult<QBBill>> {
    this.logger.log('Fetching bills from QuickBooks');

    const query = this.buildQuery('Bill', options);
    return this.fetchEntitiesPaginated<QBBill>('Bill', query, options);
  }

  /**
   * Fetch all payments from QuickBooks
   */
  async fetchPayments(options: FetchOptions): Promise<FetchResult<QBPayment>> {
    this.logger.log('Fetching payments from QuickBooks');

    const query = this.buildQuery('Payment', options);
    return this.fetchEntitiesPaginated<QBPayment>('Payment', query, options);
  }

  /**
   * Fetch chart of accounts from QuickBooks
   */
  async fetchAccounts(options: FetchOptions): Promise<FetchResult<QBAccount>> {
    this.logger.log('Fetching accounts from QuickBooks');

    const query = this.buildQuery('Account', options);
    return this.fetchEntitiesPaginated<QBAccount>('Account', query, options);
  }

  /**
   * Fetch tax rates from QuickBooks
   */
  async fetchTaxRates(options: FetchOptions): Promise<FetchResult<QBTaxRate>> {
    this.logger.log('Fetching tax rates from QuickBooks');

    const query = this.buildQuery('TaxRate', options);
    return this.fetchEntitiesPaginated<QBTaxRate>('TaxRate', query, options);
  }

  /**
   * Fetch entities with pagination and rate limiting
   */
  private async fetchEntitiesPaginated<T>(
    entityType: string,
    query: string,
    options: FetchOptions,
  ): Promise<FetchResult<T>> {
    const allItems: T[] = [];
    const batchSize = Math.min(
      options.batchSize || this.DEFAULT_BATCH_SIZE,
      this.MAX_RESULTS_PER_PAGE,
    );
    const rateLimitDelay = options.rateLimitDelay || this.DEFAULT_RATE_LIMIT_DELAY;

    let startPosition = 1;
    let hasMore = true;
    let totalFetched = 0;

    const endpoints = getQuickBooksEndpoints('production'); // Will be dynamic based on env
    const baseUrl = `${endpoints.apiUrl}/company/${options.companyId}/query`;

    while (hasMore) {
      try {
        const paginatedQuery = `${query} STARTPOSITION ${startPosition} MAXRESULTS ${batchSize}`;

        this.logger.debug(
          `Fetching ${entityType} batch: position ${startPosition}, size ${batchSize}`,
        );

        const response = await axios.get(baseUrl, {
          params: {
            query: paginatedQuery,
            minorversion: '65',
          },
          headers: {
            Authorization: `Bearer ${options.accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        });

        const queryResponse = response.data?.QueryResponse;

        if (!queryResponse) {
          this.logger.warn(`No QueryResponse in response for ${entityType}`);
          break;
        }

        const items = queryResponse[entityType] || [];
        const maxResults = queryResponse.maxResults || items.length;

        if (items.length > 0) {
          allItems.push(...items);
          totalFetched += items.length;

          this.logger.log(
            `Fetched ${items.length} ${entityType} items (total: ${totalFetched})`,
          );
        }

        // Check if there are more results
        hasMore = items.length === batchSize && totalFetched < maxResults;
        startPosition += batchSize;

        // Rate limiting delay
        if (hasMore) {
          await this.delay(rateLimitDelay);
        }

      } catch (error) {
        this.logger.error(
          `Error fetching ${entityType} at position ${startPosition}`,
          error,
        );

        // Handle rate limiting (429)
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
          this.logger.warn(
            `Rate limited. Waiting ${retryAfter} seconds before retry...`,
          );
          await this.delay(retryAfter * 1000);
          continue; // Retry same position
        }

        // Handle token expiration (401)
        if (error.response?.status === 401) {
          throw new BadRequestException(
            'QuickBooks access token expired. Please reconnect.',
          );
        }

        throw error;
      }
    }

    this.logger.log(
      `Completed fetching ${totalFetched} ${entityType} items from QuickBooks`,
    );

    return {
      items: allItems,
      totalCount: totalFetched,
      fetchedCount: totalFetched,
      hasMore: false,
    };
  }

  /**
   * Build SQL-like query for QuickBooks API
   */
  private buildQuery(
    entityType: string,
    options: FetchOptions,
  ): string {
    const conditions: string[] = [];

    // Active/Inactive filter
    if (!options.includeInactive) {
      conditions.push("Active = true");
    }

    // Date range filter (for transactional entities)
    if (this.isTransactionalEntity(entityType)) {
      if (options.dateRangeStart) {
        const startDate = this.formatDate(options.dateRangeStart);
        conditions.push(`TxnDate >= '${startDate}'`);
      }

      if (options.dateRangeEnd) {
        const endDate = this.formatDate(options.dateRangeEnd);
        conditions.push(`TxnDate <= '${endDate}'`);
      }
    }

    // Build final query
    let query = `SELECT * FROM ${entityType}`;

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Sort by metadata for consistent ordering
    query += ` ORDERBY MetaData.LastUpdatedTime DESC`;

    return query;
  }

  /**
   * Check if entity type is transactional (has TxnDate)
   */
  private isTransactionalEntity(entityType: string): boolean {
    return ['Invoice', 'Bill', 'Payment', 'Estimate', 'SalesReceipt', 'PurchaseOrder'].includes(
      entityType,
    );
  }

  /**
   * Format date for QuickBooks query (YYYY-MM-DD)
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get count of entities (for progress tracking)
   */
  async getEntityCount(
    entityType: string,
    options: FetchOptions,
  ): Promise<number> {
    try {
      const query = this.buildQuery(entityType, options);
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');

      const endpoints = getQuickBooksEndpoints('production');
      const baseUrl = `${endpoints.apiUrl}/company/${options.companyId}/query`;

      const response = await axios.get(baseUrl, {
        params: {
          query: countQuery,
          minorversion: '65',
        },
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      return response.data?.QueryResponse?.totalCount || 0;
    } catch (error) {
      this.logger.error(`Error getting count for ${entityType}`, error);
      return 0;
    }
  }

  /**
   * Test connection and fetch company info
   */
  async testConnection(
    accessToken: string,
    companyId: string,
  ): Promise<{ success: boolean; companyName?: string; error?: string }> {
    try {
      const endpoints = getQuickBooksEndpoints('production');
      const url = `${endpoints.apiUrl}/company/${companyId}/companyinfo/${companyId}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      const companyInfo = response.data?.CompanyInfo;

      return {
        success: true,
        companyName: companyInfo?.CompanyName,
      };
    } catch (error) {
      this.logger.error('Connection test failed', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fetch single entity by ID (for validation/testing)
   */
  async fetchEntityById<T>(
    entityType: string,
    entityId: string,
    options: FetchOptions,
  ): Promise<T | null> {
    try {
      const endpoints = getQuickBooksEndpoints('production');
      const url = `${endpoints.apiUrl}/company/${options.companyId}/${entityType.toLowerCase()}/${entityId}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
          Accept: 'application/json',
        },
        params: {
          minorversion: '65',
        },
        timeout: 10000,
      });

      return response.data?.[entityType] || null;
    } catch (error) {
      this.logger.error(`Error fetching ${entityType} ${entityId}`, error);
      return null;
    }
  }
}
