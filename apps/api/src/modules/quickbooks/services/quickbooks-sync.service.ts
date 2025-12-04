import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QuickBooksAuthService } from '../quickbooks-auth.service';
import { QuickBooksMappingService } from './quickbooks-mapping.service';
import { QuickBooksCustomerSyncService } from './quickbooks-customer-sync.service';
import { QuickBooksInvoiceSyncService } from './quickbooks-invoice-sync.service';
import { QuickBooksPaymentSyncService } from './quickbooks-payment-sync.service';
import { QuickBooksSyncEntityType, QuickBooksSyncDirection, QuickBooksSyncStatus } from '@prisma/client';

/**
 * Sync mode types
 */
export type SyncMode = 'full' | 'incremental' | 'realtime';

/**
 * Sync result summary
 */
export interface SyncResult {
  syncLogId: string;
  status: QuickBooksSyncStatus;
  entityType: QuickBooksSyncEntityType;
  direction: QuickBooksSyncDirection;
  itemsProcessed: number;
  itemsSuccess: number;
  itemsFailed: number;
  itemsSkipped: number;
  duration: number;
  error?: string;
}

/**
 * QuickBooks Sync Service
 * Main orchestrator for bidirectional data synchronization
 */
@Injectable()
export class QuickBooksSyncService {
  private readonly logger = new Logger(QuickBooksSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: QuickBooksAuthService,
    private readonly mappingService: QuickBooksMappingService,
    private readonly customerSync: QuickBooksCustomerSyncService,
    private readonly invoiceSync: QuickBooksInvoiceSyncService,
    private readonly paymentSync: QuickBooksPaymentSyncService,
  ) {}

  /**
   * Full sync: Import all data from QuickBooks to Operate
   */
  async performFullSync(
    orgId: string,
    triggeredBy?: string,
  ): Promise<{
    customers: SyncResult;
    invoices: SyncResult;
    payments: SyncResult;
  }> {
    this.logger.log(`Starting full sync for org ${orgId}`);

    // Get active connection
    const connection = await this.getActiveConnection(orgId);

    // Get access token
    const { accessToken } = await this.authService.getDecryptedTokens(orgId);

    // Sync customers first (dependencies)
    const customersResult = await this.syncCustomersFromQuickBooks(
      connection.id,
      orgId,
      accessToken,
      connection.companyId,
      'full',
      triggeredBy,
    );

    // Then sync invoices
    const invoicesResult = await this.syncInvoicesFromQuickBooks(
      connection.id,
      orgId,
      accessToken,
      connection.companyId,
      'full',
      triggeredBy,
    );

    // Finally sync payments
    const paymentsResult = await this.syncPaymentsFromQuickBooks(
      connection.id,
      orgId,
      accessToken,
      connection.companyId,
      'full',
      triggeredBy,
    );

    // Update connection last sync
    await this.prisma.quickBooksConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    this.logger.log(`Full sync completed for org ${orgId}`);

    return {
      customers: customersResult,
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
    triggeredBy?: string,
  ): Promise<{
    customers: SyncResult;
    invoices: SyncResult;
    payments: SyncResult;
  }> {
    this.logger.log(`Starting incremental sync for org ${orgId}`);

    const connection = await this.getActiveConnection(orgId);

    // Determine sync cutoff date
    const cutoffDate = since || connection.lastSyncAt || new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { accessToken } = await this.authService.getDecryptedTokens(orgId);

    // Sync only modified entities
    const customersResult = await this.syncCustomersFromQuickBooks(
      connection.id,
      orgId,
      accessToken,
      connection.companyId,
      'incremental',
      triggeredBy,
      cutoffDate,
    );

    const invoicesResult = await this.syncInvoicesFromQuickBooks(
      connection.id,
      orgId,
      accessToken,
      connection.companyId,
      'incremental',
      triggeredBy,
      cutoffDate,
    );

    const paymentsResult = await this.syncPaymentsFromQuickBooks(
      connection.id,
      orgId,
      accessToken,
      connection.companyId,
      'incremental',
      triggeredBy,
      cutoffDate,
    );

    // Update connection last sync
    await this.prisma.quickBooksConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    this.logger.log(`Incremental sync completed for org ${orgId}`);

    return {
      customers: customersResult,
      invoices: invoicesResult,
      payments: paymentsResult,
    };
  }

  /**
   * Sync customers from QuickBooks
   */
  private async syncCustomersFromQuickBooks(
    connectionId: string,
    orgId: string,
    accessToken: string,
    companyId: string,
    syncMode: SyncMode,
    triggeredBy?: string,
    since?: Date,
  ): Promise<SyncResult> {
    const startTime = Date.now();

    // Create sync log
    const syncLog = await this.prisma.quickBooksSyncLog.create({
      data: {
        connectionId,
        orgId,
        syncType: 'CUSTOMER',
        direction: 'FROM_QUICKBOOKS',
        status: 'IN_PROGRESS',
        syncMode,
        triggeredBy,
      },
    });

    try {
      // TODO: Call QuickBooks API to fetch customers
      // For now, using placeholder data
      const qbCustomers: any[] = [];

      const result = await this.customerSync.syncAllFromQuickBooks(
        connectionId,
        orgId,
        qbCustomers,
      );

      const duration = Date.now() - startTime;

      // Update sync log
      await this.prisma.quickBooksSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration,
          itemsProcessed: result.created + result.updated + result.failed,
          itemsSuccess: result.created + result.updated,
          itemsFailed: result.failed,
          changesSummary: {
            created: result.created,
            updated: result.updated,
            failed: result.failed,
            errors: result.errors,
          },
        },
      });

      return {
        syncLogId: syncLog.id,
        status: 'COMPLETED',
        entityType: 'CUSTOMER',
        direction: 'FROM_QUICKBOOKS',
        itemsProcessed: result.created + result.updated + result.failed,
        itemsSuccess: result.created + result.updated,
        itemsFailed: result.failed,
        itemsSkipped: 0,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Update sync log with error
      await this.prisma.quickBooksSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration,
          error: error.message,
          errorDetails: {
            stack: error.stack,
            name: error.name,
          },
        },
      });

      throw error;
    }
  }

  /**
   * Sync invoices from QuickBooks
   */
  private async syncInvoicesFromQuickBooks(
    connectionId: string,
    orgId: string,
    accessToken: string,
    companyId: string,
    syncMode: SyncMode,
    triggeredBy?: string,
    since?: Date,
  ): Promise<SyncResult> {
    const startTime = Date.now();

    const syncLog = await this.prisma.quickBooksSyncLog.create({
      data: {
        connectionId,
        orgId,
        syncType: 'INVOICE',
        direction: 'FROM_QUICKBOOKS',
        status: 'IN_PROGRESS',
        syncMode,
        triggeredBy,
      },
    });

    try {
      // TODO: Call QuickBooks API to fetch invoices
      const qbInvoices: any[] = [];

      const result = await this.invoiceSync.syncAllFromQuickBooks(
        connectionId,
        orgId,
        qbInvoices,
      );

      const duration = Date.now() - startTime;

      await this.prisma.quickBooksSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration,
          itemsProcessed: result.created + result.updated + result.failed,
          itemsSuccess: result.created + result.updated,
          itemsFailed: result.failed,
          changesSummary: {
            created: result.created,
            updated: result.updated,
            failed: result.failed,
            errors: result.errors,
          },
        },
      });

      return {
        syncLogId: syncLog.id,
        status: 'COMPLETED',
        entityType: 'INVOICE',
        direction: 'FROM_QUICKBOOKS',
        itemsProcessed: result.created + result.updated + result.failed,
        itemsSuccess: result.created + result.updated,
        itemsFailed: result.failed,
        itemsSkipped: 0,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      await this.prisma.quickBooksSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration,
          error: error.message,
          errorDetails: {
            stack: error.stack,
            name: error.name,
          },
        },
      });

      throw error;
    }
  }

  /**
   * Sync payments from QuickBooks
   */
  private async syncPaymentsFromQuickBooks(
    connectionId: string,
    orgId: string,
    accessToken: string,
    companyId: string,
    syncMode: SyncMode,
    triggeredBy?: string,
    since?: Date,
  ): Promise<SyncResult> {
    const startTime = Date.now();

    const syncLog = await this.prisma.quickBooksSyncLog.create({
      data: {
        connectionId,
        orgId,
        syncType: 'PAYMENT',
        direction: 'FROM_QUICKBOOKS',
        status: 'IN_PROGRESS',
        syncMode,
        triggeredBy,
      },
    });

    try {
      // TODO: Call QuickBooks API to fetch payments
      const qbPayments: any[] = [];

      const result = await this.paymentSync.syncAllFromQuickBooks(
        connectionId,
        orgId,
        qbPayments,
      );

      const duration = Date.now() - startTime;

      await this.prisma.quickBooksSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration,
          itemsProcessed: result.created + result.updated + result.failed,
          itemsSuccess: result.created + result.updated,
          itemsFailed: result.failed,
          changesSummary: {
            created: result.created,
            updated: result.updated,
            failed: result.failed,
            errors: result.errors,
          },
        },
      });

      return {
        syncLogId: syncLog.id,
        status: 'COMPLETED',
        entityType: 'PAYMENT',
        direction: 'FROM_QUICKBOOKS',
        itemsProcessed: result.created + result.updated + result.failed,
        itemsSuccess: result.created + result.updated,
        itemsFailed: result.failed,
        itemsSkipped: 0,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      await this.prisma.quickBooksSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration,
          error: error.message,
          errorDetails: {
            stack: error.stack,
            name: error.name,
          },
        },
      });

      throw error;
    }
  }

  /**
   * Get active connection for organization
   */
  private async getActiveConnection(orgId: string) {
    const connection = await this.prisma.quickBooksConnection.findFirst({
      where: {
        orgId,
        isConnected: true,
        status: 'CONNECTED',
      },
    });

    if (!connection) {
      throw new NotFoundException(`No active QuickBooks connection found for org ${orgId}`);
    }

    return connection;
  }

  /**
   * Get sync history for an organization
   */
  async getSyncHistory(
    orgId: string,
    entityType?: QuickBooksSyncEntityType,
    limit = 50,
  ) {
    return this.prisma.quickBooksSyncLog.findMany({
      where: {
        orgId,
        ...(entityType && { syncType: entityType }),
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(orgId: string) {
    const connection = await this.getActiveConnection(orgId);

    const [customerStats, invoiceStats, paymentStats] = await Promise.all([
      this.mappingService.getSyncStats(connection.id, 'CUSTOMER'),
      this.mappingService.getSyncStats(connection.id, 'INVOICE'),
      this.mappingService.getSyncStats(connection.id, 'PAYMENT'),
    ]);

    return {
      lastSyncAt: connection.lastSyncAt,
      customers: customerStats,
      invoices: invoiceStats,
      payments: paymentStats,
    };
  }
}
