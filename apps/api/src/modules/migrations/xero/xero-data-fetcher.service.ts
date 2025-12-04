/**
 * Xero Data Fetcher Service
 * Handles fetching all data from Xero API with rate limiting and error handling
 */

import { Injectable, Logger } from '@nestjs/common';
import { XeroClient } from 'xero-node';
import { XeroAuthService } from '../../integrations/xero/xero-auth.service';
import {
  XeroContact,
  XeroItem,
  XeroInvoice,
  XeroCreditNote,
  XeroPayment,
  XeroBankTransaction,
  XeroAccount,
  XeroTaxRate,
  XeroTrackingCategory,
  XeroOrganization,
  XeroEntityType,
  RateLimitState,
} from './xero-migration.types';

/**
 * Xero API Rate Limits
 * - 60 calls per minute per tenant
 * - We'll use 50 to be safe
 */
const RATE_LIMIT_PER_MINUTE = 50;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

@Injectable()
export class XeroDataFetcherService {
  private readonly logger = new Logger(XeroDataFetcherService.name);
  private rateLimitState: Map<string, RateLimitState> = new Map();

  constructor(private readonly xeroAuthService: XeroAuthService) {}

  /**
   * Get Xero client instance with valid tokens
   */
  private async getXeroClient(
    orgId: string,
    xeroTenantId: string,
  ): Promise<{ client: XeroClient; tenantId: string }> {
    const tokens = await this.xeroAuthService.getDecryptedTokens(
      orgId,
      xeroTenantId,
    );

    const client = new XeroClient();
    client.setTokenSet({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    } as any);

    return { client, tenantId: tokens.tenantId };
  }

  /**
   * Rate-limited API call wrapper
   */
  private async rateLimitedCall<T>(
    tenantId: string,
    apiCall: () => Promise<T>,
  ): Promise<T> {
    // Initialize rate limit state for tenant if not exists
    if (!this.rateLimitState.has(tenantId)) {
      this.rateLimitState.set(tenantId, {
        requestsThisMinute: 0,
        minuteStartTime: Date.now(),
        requestQueue: [],
      });
    }

    const state = this.rateLimitState.get(tenantId)!;
    const now = Date.now();

    // Reset counter if minute window has passed
    if (now - state.minuteStartTime >= RATE_LIMIT_WINDOW_MS) {
      state.requestsThisMinute = 0;
      state.minuteStartTime = now;
    }

    // Check if we've hit rate limit
    if (state.requestsThisMinute >= RATE_LIMIT_PER_MINUTE) {
      const waitTime =
        RATE_LIMIT_WINDOW_MS - (now - state.minuteStartTime) + 100; // Add 100ms buffer
      this.logger.warn(
        `Rate limit reached for tenant ${tenantId}, waiting ${waitTime}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      // Reset counter after waiting
      state.requestsThisMinute = 0;
      state.minuteStartTime = Date.now();
    }

    // Increment counter and make call
    state.requestsThisMinute++;

    try {
      return await apiCall();
    } catch (error) {
      // Handle rate limit errors from Xero
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : RATE_LIMIT_WINDOW_MS;
        this.logger.warn(
          `Xero returned 429, waiting ${waitTime}ms before retry`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        // Reset and retry
        state.requestsThisMinute = 0;
        state.minuteStartTime = Date.now();
        return await apiCall();
      }
      throw error;
    }
  }

  /**
   * Fetch organization details
   */
  async fetchOrganization(
    orgId: string,
    xeroTenantId: string,
  ): Promise<XeroOrganization> {
    const { client, tenantId } = await this.getXeroClient(orgId, xeroTenantId);

    return this.rateLimitedCall(tenantId, async () => {
      this.logger.log(`Fetching organization details for tenant ${tenantId}`);
      const response = await client.accountingApi.getOrganisations(tenantId);
      return response.body.organisations[0] as any;
    });
  }

  /**
   * Fetch all contacts (customers and suppliers)
   */
  async fetchContacts(
    orgId: string,
    xeroTenantId: string,
    modifiedAfter?: Date,
    onProgress?: (count: number, total: number) => void,
  ): Promise<XeroContact[]> {
    const { client, tenantId } = await this.getXeroClient(orgId, xeroTenantId);

    return this.fetchPaginated<XeroContact>(
      tenantId,
      async (page) => {
        const response = await client.accountingApi.getContacts(
          tenantId,
          modifiedAfter,
          undefined,
          undefined,
          undefined,
          page,
          100,
        );
        return response.body.contacts as any[];
      },
      'Contacts',
      onProgress,
    );
  }

  /**
   * Fetch all items (products/services)
   */
  async fetchItems(
    orgId: string,
    xeroTenantId: string,
    modifiedAfter?: Date,
    onProgress?: (count: number, total: number) => void,
  ): Promise<XeroItem[]> {
    const { client, tenantId } = await this.getXeroClient(orgId, xeroTenantId);

    return this.fetchPaginated<XeroItem>(
      tenantId,
      async (page) => {
        const response = await client.accountingApi.getItems(
          tenantId,
          modifiedAfter,
          undefined,
          undefined,
          page,
          100,
        );
        return response.body.items as any[];
      },
      'Items',
      onProgress,
    );
  }

  /**
   * Fetch all invoices (sales and purchase)
   */
  async fetchInvoices(
    orgId: string,
    xeroTenantId: string,
    modifiedAfter?: Date,
    onProgress?: (count: number, total: number) => void,
  ): Promise<XeroInvoice[]> {
    const { client, tenantId } = await this.getXeroClient(orgId, xeroTenantId);

    return this.fetchPaginated<XeroInvoice>(
      tenantId,
      async (page) => {
        const response = await client.accountingApi.getInvoices(
          tenantId,
          modifiedAfter,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          page,
          100,
        );
        return response.body.invoices as any[];
      },
      'Invoices',
      onProgress,
    );
  }

  /**
   * Fetch all credit notes
   */
  async fetchCreditNotes(
    orgId: string,
    xeroTenantId: string,
    modifiedAfter?: Date,
    onProgress?: (count: number, total: number) => void,
  ): Promise<XeroCreditNote[]> {
    const { client, tenantId } = await this.getXeroClient(orgId, xeroTenantId);

    return this.fetchPaginated<XeroCreditNote>(
      tenantId,
      async (page) => {
        const response = await client.accountingApi.getCreditNotes(
          tenantId,
          modifiedAfter,
          undefined,
          undefined,
          undefined,
          page,
          100,
        );
        return response.body.creditNotes as any[];
      },
      'CreditNotes',
      onProgress,
    );
  }

  /**
   * Fetch all payments
   */
  async fetchPayments(
    orgId: string,
    xeroTenantId: string,
    modifiedAfter?: Date,
    onProgress?: (count: number, total: number) => void,
  ): Promise<XeroPayment[]> {
    const { client, tenantId } = await this.getXeroClient(orgId, xeroTenantId);

    return this.fetchPaginated<XeroPayment>(
      tenantId,
      async (page) => {
        const response = await client.accountingApi.getPayments(
          tenantId,
          modifiedAfter,
          undefined,
          page,
          100,
        );
        return response.body.payments as any[];
      },
      'Payments',
      onProgress,
    );
  }

  /**
   * Fetch all bank transactions
   */
  async fetchBankTransactions(
    orgId: string,
    xeroTenantId: string,
    modifiedAfter?: Date,
    onProgress?: (count: number, total: number) => void,
  ): Promise<XeroBankTransaction[]> {
    const { client, tenantId } = await this.getXeroClient(orgId, xeroTenantId);

    return this.fetchPaginated<XeroBankTransaction>(
      tenantId,
      async (page) => {
        const response = await client.accountingApi.getBankTransactions(
          tenantId,
          modifiedAfter,
          undefined,
          undefined,
          undefined,
          page,
          100,
        );
        return response.body.bankTransactions as any[];
      },
      'BankTransactions',
      onProgress,
    );
  }

  /**
   * Fetch all accounts (chart of accounts)
   */
  async fetchAccounts(
    orgId: string,
    xeroTenantId: string,
    modifiedAfter?: Date,
    onProgress?: (count: number, total: number) => void,
  ): Promise<XeroAccount[]> {
    const { client, tenantId } = await this.getXeroClient(orgId, xeroTenantId);

    return this.rateLimitedCall(tenantId, async () => {
      this.logger.log(`Fetching accounts for tenant ${tenantId}`);
      const response = await client.accountingApi.getAccounts(
        tenantId,
        modifiedAfter,
      );
      const accounts = (response.body.accounts as any[]) || [];
      if (onProgress) {
        onProgress(accounts.length, accounts.length);
      }
      return accounts;
    });
  }

  /**
   * Fetch all tax rates
   */
  async fetchTaxRates(
    orgId: string,
    xeroTenantId: string,
    onProgress?: (count: number, total: number) => void,
  ): Promise<XeroTaxRate[]> {
    const { client, tenantId } = await this.getXeroClient(orgId, xeroTenantId);

    return this.rateLimitedCall(tenantId, async () => {
      this.logger.log(`Fetching tax rates for tenant ${tenantId}`);
      const response = await client.accountingApi.getTaxRates(tenantId);
      const taxRates = (response.body.taxRates as any[]) || [];
      if (onProgress) {
        onProgress(taxRates.length, taxRates.length);
      }
      return taxRates;
    });
  }

  /**
   * Fetch all tracking categories
   */
  async fetchTrackingCategories(
    orgId: string,
    xeroTenantId: string,
    onProgress?: (count: number, total: number) => void,
  ): Promise<XeroTrackingCategory[]> {
    const { client, tenantId } = await this.getXeroClient(orgId, xeroTenantId);

    return this.rateLimitedCall(tenantId, async () => {
      this.logger.log(`Fetching tracking categories for tenant ${tenantId}`);
      const response =
        await client.accountingApi.getTrackingCategories(tenantId);
      const categories = (response.body.trackingCategories as any[]) || [];
      if (onProgress) {
        onProgress(categories.length, categories.length);
      }
      return categories;
    });
  }

  /**
   * Fetch data for a specific entity type
   */
  async fetchEntityData(
    entityType: XeroEntityType,
    orgId: string,
    xeroTenantId: string,
    modifiedAfter?: Date,
    onProgress?: (count: number, total: number) => void,
  ): Promise<any[]> {
    switch (entityType) {
      case XeroEntityType.CONTACTS:
        return this.fetchContacts(orgId, xeroTenantId, modifiedAfter, onProgress);
      case XeroEntityType.ITEMS:
        return this.fetchItems(orgId, xeroTenantId, modifiedAfter, onProgress);
      case XeroEntityType.INVOICES:
        return this.fetchInvoices(orgId, xeroTenantId, modifiedAfter, onProgress);
      case XeroEntityType.CREDIT_NOTES:
        return this.fetchCreditNotes(orgId, xeroTenantId, modifiedAfter, onProgress);
      case XeroEntityType.PAYMENTS:
        return this.fetchPayments(orgId, xeroTenantId, modifiedAfter, onProgress);
      case XeroEntityType.BANK_TRANSACTIONS:
        return this.fetchBankTransactions(
          orgId,
          xeroTenantId,
          modifiedAfter,
          onProgress,
        );
      case XeroEntityType.ACCOUNTS:
        return this.fetchAccounts(orgId, xeroTenantId, modifiedAfter, onProgress);
      case XeroEntityType.TAX_RATES:
        return this.fetchTaxRates(orgId, xeroTenantId, onProgress);
      case XeroEntityType.TRACKING_CATEGORIES:
        return this.fetchTrackingCategories(orgId, xeroTenantId, onProgress);
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Generic paginated fetch helper
   */
  private async fetchPaginated<T>(
    tenantId: string,
    fetchPage: (page: number) => Promise<T[]>,
    entityName: string,
    onProgress?: (count: number, total: number) => void,
  ): Promise<T[]> {
    const allResults: T[] = [];
    let page = 1;
    let hasMore = true;

    this.logger.log(`Fetching ${entityName} for tenant ${tenantId}`);

    while (hasMore) {
      const results = await this.rateLimitedCall(tenantId, () =>
        fetchPage(page),
      );

      if (results && results.length > 0) {
        allResults.push(...results);
        this.logger.debug(
          `Fetched page ${page} of ${entityName}: ${results.length} records (total: ${allResults.length})`,
        );

        if (onProgress) {
          onProgress(allResults.length, allResults.length);
        }

        // Xero returns 100 records max per page
        // If we got less than 100, we've reached the end
        if (results.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    this.logger.log(
      `Completed fetching ${entityName}: ${allResults.length} total records`,
    );
    return allResults;
  }

  /**
   * Get entity count without fetching all data
   */
  async getEntityCount(
    entityType: XeroEntityType,
    orgId: string,
    xeroTenantId: string,
  ): Promise<number> {
    try {
      // For a rough count, fetch first page only
      const firstPageData = await this.fetchEntityData(
        entityType,
        orgId,
        xeroTenantId,
        undefined,
        undefined,
      );

      // This is a simplified count - in reality we'd need to fetch all pages
      // But this gives us a starting estimate
      return firstPageData.length;
    } catch (error) {
      this.logger.error(
        `Failed to get count for ${entityType}: ${error.message}`,
      );
      return 0;
    }
  }
}
