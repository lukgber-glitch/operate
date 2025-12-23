import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { XeroAuthService } from '../xero-auth.service';
import { XeroMappingService, XeroSyncEntityType } from './xero-mapping.service';
import { XeroCustomerSyncService } from './xero-customer-sync.service';
import { XeroInvoiceSyncService } from './xero-invoice-sync.service';
import { XeroPaymentSyncService } from './xero-payment-sync.service';
import { XeroClient } from 'xero-node';

/**
 * Sync mode types
 */
export type SyncMode = 'full' | 'incremental' | 'realtime';

/**
 * Sync direction
 */
export enum SyncDirection {
  FROM_XERO = 'FROM_XERO',
  TO_XERO = 'TO_XERO',
  BIDIRECTIONAL = 'BIDIRECTIONAL',
}

/**
 * Sync status
 */
export enum SyncStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

/**
 * Sync result summary
 */
export interface SyncResult {
  syncLogId: string;
  status: SyncStatus;
  entityType: XeroSyncEntityType;
  direction: SyncDirection;
  itemsProcessed: number;
  itemsSuccess: number;
  itemsFailed: number;
  itemsSkipped: number;
  duration: number;
  error?: string;
}

/**
 * Rate limit configuration for Xero API
 * Xero allows 60 requests per minute
 */
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 60,
  RETRY_DELAY_MS: 1000, // Initial retry delay
  MAX_RETRIES: 3,
  BACKOFF_MULTIPLIER: 2, // Exponential backoff
};

/**
 * Xero Sync Service
 * Main orchestrator for bidirectional data synchronization with Xero
 *
 * Features:
 * - Full sync: Import all data from Xero to Operate
 * - Incremental sync: Sync only changed data since last sync
 * - Realtime sync: Push single entity changes to Xero
 * - Rate limiting: Respect Xero's 60 requests/minute limit
 * - Conflict detection: Identify when both sides have been modified
 * - Comprehensive logging: Track all sync operations
 */
@Injectable()
export class XeroSyncService {
  private readonly logger = new Logger(XeroSyncService.name);

  // Rate limiting state
  private requestQueue: Array<() => Promise<any>> = [];
  private requestCount = 0;
  private resetTime = Date.now() + 60000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: XeroAuthService,
    private readonly mappingService: XeroMappingService,
    private readonly customerSync: XeroCustomerSyncService,
    private readonly invoiceSync: XeroInvoiceSyncService,
    private readonly paymentSync: XeroPaymentSyncService,
  ) {
    // Start rate limit reset timer
    this.startRateLimitReset();
  }

  /**
   * Full sync: Import all data from Xero to Operate
   */
  async performFullSync(
    orgId: string,
    xeroTenantId?: string,
    triggeredBy?: string,
  ): Promise<{
    contacts: SyncResult;
    invoices: SyncResult;
    payments: SyncResult;
  }> {
    this.logger.log(`Starting full sync for org ${orgId}`);

    // Get active connection
    const connection = await this.getActiveConnection(orgId, xeroTenantId);

    // Get access token and tenant ID
    const { accessToken, tenantId } = await this.authService.getDecryptedTokens(
      orgId,
      xeroTenantId,
    );

    // Initialize Xero client
    const xeroClient = new XeroClient();
    xeroClient.setTokenSet({
      access_token: accessToken,
    } as unknown as import('xero-node').TokenSetParameters);

    // Sync contacts first (dependencies)
    const contactsResult = await this.syncContactsFromXero(
      connection.id,
      orgId,
      xeroClient,
      tenantId,
      'full',
      triggeredBy,
    );

    // Then sync invoices
    const invoicesResult = await this.syncInvoicesFromXero(
      connection.id,
      orgId,
      xeroClient,
      tenantId,
      'full',
      triggeredBy,
    );

    // Finally sync payments
    const paymentsResult = await this.syncPaymentsFromXero(
      connection.id,
      orgId,
      xeroClient,
      tenantId,
      'full',
      triggeredBy,
    );

    // Update connection last sync
    await this.prisma.xeroConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    this.logger.log(`Full sync completed for org ${orgId}`);

    return {
      contacts: contactsResult,
      invoices: invoicesResult,
      payments: paymentsResult,
    };
  }

  /**
   * Incremental sync: Sync only changed data since last sync
   */
  async performIncrementalSync(
    orgId: string,
    since?: Date,
    xeroTenantId?: string,
    triggeredBy?: string,
  ): Promise<{
    contacts: SyncResult;
    invoices: SyncResult;
    payments: SyncResult;
  }> {
    this.logger.log(`Starting incremental sync for org ${orgId}`);

    const connection = await this.getActiveConnection(orgId, xeroTenantId);

    // Determine sync cutoff date (default: last 24 hours)
    const cutoffDate =
      since || connection.lastSyncAt || new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { accessToken, tenantId } = await this.authService.getDecryptedTokens(
      orgId,
      xeroTenantId,
    );

    // Initialize Xero client
    const xeroClient = new XeroClient();
    xeroClient.setTokenSet({
      access_token: accessToken,
    } as unknown as import('xero-node').TokenSetParameters);

    // Sync only modified entities
    const contactsResult = await this.syncContactsFromXero(
      connection.id,
      orgId,
      xeroClient,
      tenantId,
      'incremental',
      triggeredBy,
      cutoffDate,
    );

    const invoicesResult = await this.syncInvoicesFromXero(
      connection.id,
      orgId,
      xeroClient,
      tenantId,
      'incremental',
      triggeredBy,
      cutoffDate,
    );

    const paymentsResult = await this.syncPaymentsFromXero(
      connection.id,
      orgId,
      xeroClient,
      tenantId,
      'incremental',
      triggeredBy,
      cutoffDate,
    );

    // Update connection last sync
    await this.prisma.xeroConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    this.logger.log(`Incremental sync completed for org ${orgId}`);

    return {
      contacts: contactsResult,
      invoices: invoicesResult,
      payments: paymentsResult,
    };
  }

  /**
   * Sync contacts from Xero
   */
  private async syncContactsFromXero(
    connectionId: string,
    orgId: string,
    xeroClient: XeroClient,
    tenantId: string,
    syncMode: SyncMode,
    triggeredBy?: string,
    since?: Date,
  ): Promise<SyncResult> {
    const startTime = Date.now();

    // Create sync log (placeholder - needs Prisma model)
    const syncLog = {
      id: `sync_${Date.now()}`,
      connectionId,
      orgId,
      entityType: XeroSyncEntityType.CONTACT,
      direction: SyncDirection.FROM_XERO,
      status: SyncStatus.IN_PROGRESS,
      syncMode,
      triggeredBy,
    };

    try {
      // Fetch contacts from Xero with rate limiting
      const where = since ? `UpdatedDateUTC>DateTime(${since.toISOString()})` : undefined;

      const response = await this.executeWithRateLimit(() =>
        xeroClient.accountingApi.getContacts(tenantId, undefined, where),
      );

      const xeroContacts = response.body.contacts || [];

      const result = await this.customerSync.syncAllFromXero(
        connectionId,
        orgId,
        xeroContacts,
      );

      const duration = Date.now() - startTime;

      this.logger.log(
        `Contacts sync completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
      );

      return {
        syncLogId: syncLog.id,
        status: result.failed > 0 ? SyncStatus.PARTIAL : SyncStatus.COMPLETED,
        entityType: XeroSyncEntityType.CONTACT,
        direction: SyncDirection.FROM_XERO,
        itemsProcessed: result.created + result.updated + result.failed,
        itemsSuccess: result.created + result.updated,
        itemsFailed: result.failed,
        itemsSkipped: 0,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Contacts sync failed: ${error.message}`, error.stack);

      return {
        syncLogId: syncLog.id,
        status: SyncStatus.FAILED,
        entityType: XeroSyncEntityType.CONTACT,
        direction: SyncDirection.FROM_XERO,
        itemsProcessed: 0,
        itemsSuccess: 0,
        itemsFailed: 0,
        itemsSkipped: 0,
        duration,
        error: error.message,
      };
    }
  }

  /**
   * Sync invoices from Xero
   */
  private async syncInvoicesFromXero(
    connectionId: string,
    orgId: string,
    xeroClient: XeroClient,
    tenantId: string,
    syncMode: SyncMode,
    triggeredBy?: string,
    since?: Date,
  ): Promise<SyncResult> {
    const startTime = Date.now();

    const syncLog = {
      id: `sync_${Date.now()}`,
      connectionId,
      orgId,
      entityType: XeroSyncEntityType.INVOICE,
      direction: SyncDirection.FROM_XERO,
      status: SyncStatus.IN_PROGRESS,
      syncMode,
      triggeredBy,
    };

    try {
      // Fetch invoices from Xero with rate limiting
      const where = since ? `UpdatedDateUTC>DateTime(${since.toISOString()})` : undefined;

      const response = await this.executeWithRateLimit(() =>
        xeroClient.accountingApi.getInvoices(tenantId, undefined, where),
      );

      const xeroInvoices = response.body.invoices || [];

      const result = await this.invoiceSync.syncAllFromXero(
        connectionId,
        orgId,
        xeroInvoices,
      );

      const duration = Date.now() - startTime;

      this.logger.log(
        `Invoices sync completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
      );

      return {
        syncLogId: syncLog.id,
        status: result.failed > 0 ? SyncStatus.PARTIAL : SyncStatus.COMPLETED,
        entityType: XeroSyncEntityType.INVOICE,
        direction: SyncDirection.FROM_XERO,
        itemsProcessed: result.created + result.updated + result.failed,
        itemsSuccess: result.created + result.updated,
        itemsFailed: result.failed,
        itemsSkipped: 0,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Invoices sync failed: ${error.message}`, error.stack);

      return {
        syncLogId: syncLog.id,
        status: SyncStatus.FAILED,
        entityType: XeroSyncEntityType.INVOICE,
        direction: SyncDirection.FROM_XERO,
        itemsProcessed: 0,
        itemsSuccess: 0,
        itemsFailed: 0,
        itemsSkipped: 0,
        duration,
        error: error.message,
      };
    }
  }

  /**
   * Sync payments from Xero
   */
  private async syncPaymentsFromXero(
    connectionId: string,
    orgId: string,
    xeroClient: XeroClient,
    tenantId: string,
    syncMode: SyncMode,
    triggeredBy?: string,
    since?: Date,
  ): Promise<SyncResult> {
    const startTime = Date.now();

    const syncLog = {
      id: `sync_${Date.now()}`,
      connectionId,
      orgId,
      entityType: XeroSyncEntityType.PAYMENT,
      direction: SyncDirection.FROM_XERO,
      status: SyncStatus.IN_PROGRESS,
      syncMode,
      triggeredBy,
    };

    try {
      // Fetch payments from Xero with rate limiting
      const where = since ? `UpdatedDateUTC>DateTime(${since.toISOString()})` : undefined;

      const response = await this.executeWithRateLimit(() =>
        xeroClient.accountingApi.getPayments(tenantId, undefined, where),
      );

      const xeroPayments = response.body.payments || [];

      const result = await this.paymentSync.syncAllFromXero(
        connectionId,
        orgId,
        xeroPayments,
      );

      const duration = Date.now() - startTime;

      this.logger.log(
        `Payments sync completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
      );

      return {
        syncLogId: syncLog.id,
        status: result.failed > 0 ? SyncStatus.PARTIAL : SyncStatus.COMPLETED,
        entityType: XeroSyncEntityType.PAYMENT,
        direction: SyncDirection.FROM_XERO,
        itemsProcessed: result.created + result.updated + result.failed,
        itemsSuccess: result.created + result.updated,
        itemsFailed: result.failed,
        itemsSkipped: 0,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Payments sync failed: ${error.message}`, error.stack);

      return {
        syncLogId: syncLog.id,
        status: SyncStatus.FAILED,
        entityType: XeroSyncEntityType.PAYMENT,
        direction: SyncDirection.FROM_XERO,
        itemsProcessed: 0,
        itemsSuccess: 0,
        itemsFailed: 0,
        itemsSkipped: 0,
        duration,
        error: error.message,
      };
    }
  }

  /**
   * Execute API call with rate limiting
   * Implements exponential backoff for rate limit errors
   */
  private async executeWithRateLimit<T>(
    apiCall: () => Promise<T>,
    retries = 0,
  ): Promise<T> {
    // Check rate limit
    if (Date.now() > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = Date.now() + 60000;
    }

    if (this.requestCount >= RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
      const waitTime = this.resetTime - Date.now();
      this.logger.warn(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.resetTime = Date.now() + 60000;
    }

    try {
      this.requestCount++;
      return await apiCall();
    } catch (error) {
      // Handle rate limit errors (HTTP 429)
      if (error.response?.status === 429 && retries < RATE_LIMIT.MAX_RETRIES) {
        const delay =
          RATE_LIMIT.RETRY_DELAY_MS * Math.pow(RATE_LIMIT.BACKOFF_MULTIPLIER, retries);
        this.logger.warn(`Rate limited, retrying in ${delay}ms (attempt ${retries + 1})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.executeWithRateLimit(apiCall, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Start rate limit reset timer
   */
  private startRateLimitReset(): void {
    setInterval(() => {
      if (Date.now() > this.resetTime) {
        this.requestCount = 0;
        this.resetTime = Date.now() + 60000;
      }
    }, 60000);
  }

  /**
   * Get active connection for organization
   */
  private async getActiveConnection(orgId: string, xeroTenantId?: string) {
    const where: any = {
      orgId,
      isConnected: true,
      status: 'CONNECTED',
    };

    if (xeroTenantId) {
      where.xeroTenantId = xeroTenantId;
    }

    const connection = await this.prisma.xeroConnection.findFirst({
      where,
      orderBy: {
        connectedAt: 'desc',
      },
    });

    if (!connection) {
      throw new NotFoundException(`No active Xero connection found for org ${orgId}`);
    }

    return connection;
  }

  /**
   * Get sync history for an organization
   */
  async getSyncHistory(
    orgId: string,
    entityType?: XeroSyncEntityType,
    limit = 50,
  ) {
    // TODO: Implement after Prisma model is created
    return [];
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(orgId: string, xeroTenantId?: string) {
    const connection = await this.getActiveConnection(orgId, xeroTenantId);

    const [contactStats, invoiceStats, paymentStats] = await Promise.all([
      this.mappingService.getSyncStats(connection.id, XeroSyncEntityType.CONTACT),
      this.mappingService.getSyncStats(connection.id, XeroSyncEntityType.INVOICE),
      this.mappingService.getSyncStats(connection.id, XeroSyncEntityType.PAYMENT),
    ]);

    return {
      lastSyncAt: connection.lastSyncAt,
      contacts: contactStats,
      invoices: invoiceStats,
      payments: paymentStats,
    };
  }

  /**
   * Sync single entity to Xero (realtime sync)
   */
  async syncEntityToXero(
    orgId: string,
    entityType: XeroSyncEntityType,
    entityId: string,
    xeroTenantId?: string,
  ): Promise<string> {
    const connection = await this.getActiveConnection(orgId, xeroTenantId);

    const { accessToken, tenantId } = await this.authService.getDecryptedTokens(
      orgId,
      xeroTenantId,
    );

    const xeroClient = new XeroClient();
    xeroClient.setTokenSet({
      access_token: accessToken,
    } as unknown as import('xero-node').TokenSetParameters);

    switch (entityType) {
      case XeroSyncEntityType.CONTACT:
        return this.customerSync.syncCustomerToXero(
          entityId,
          xeroClient,
          tenantId,
          connection.id,
          orgId,
        );
      case XeroSyncEntityType.INVOICE:
        return this.invoiceSync.syncInvoiceToXero(
          entityId,
          xeroClient,
          tenantId,
          connection.id,
          orgId,
        );
      case XeroSyncEntityType.PAYMENT:
        return this.paymentSync.syncPaymentToXero(
          entityId,
          xeroClient,
          tenantId,
          connection.id,
          orgId,
        );
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }
}
