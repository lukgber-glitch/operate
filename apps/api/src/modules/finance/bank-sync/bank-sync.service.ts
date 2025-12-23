import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TinkService } from '../../integrations/tink/tink.service';
import { TinkEncryptionUtil } from '../../integrations/tink/utils/tink-encryption.util';
import { ConfigService } from '@nestjs/config';
import {
  BankProvider,
  ConnectionStatus,
  BankAccountType,
  BankTransactionType,
  BankTransactionStatus,
  ReconciliationStatus,
} from '@prisma/client';
import {
  SyncResult,
  SyncError,
  SyncMetrics,
  ConnectionHealth,
  CreateConnectionParams,
  SyncConnectionParams,
  BatchSyncParams,
  BatchSyncResult,
  RefreshExpiredConsentsParams,
  RefreshExpiredConsentsResult,
  ConsentRefreshResult,
} from './bank-sync.types';
import { TinkAccount, TinkTransaction } from '../../integrations/tink/tink.types';

/**
 * Bank Synchronization Service
 * Orchestrates syncing bank data across providers (Tink, Plaid, etc.)
 *
 * Features:
 * - Multi-provider support (currently Tink)
 * - Automatic token refresh
 * - PSD2 consent management
 * - Encrypted credential storage
 * - Comprehensive audit logging
 * - Error handling with retry logic
 */
@Injectable()
export class BankSyncService {
  private readonly logger = new Logger(BankSyncService.name);
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tinkService: TinkService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('TINK_ENCRYPTION_KEY') ||
                         this.configService.get<string>('JWT_SECRET') || '';
  }

  /**
   * Create a new bank connection after OAuth authorization
   */
  async createConnection(params: CreateConnectionParams): Promise<{ connectionId: string }> {
    const startTime = Date.now();
    const { orgId, provider, authCode, state, institutionId, institutionName } = params;

    try {
      this.logger.log(`Creating bank connection for org ${orgId}, provider ${provider}`);

      // Verify organization exists
      const org = await this.prisma.organisation.findUnique({ where: { id: orgId } });
      if (!org) {
        throw new NotFoundException(`Organisation ${orgId} not found`);
      }

      // Complete OAuth authorization based on provider
      let tokens;
      let providerConnectionId: string;

      if (provider === BankProvider.TINK) {
        tokens = await this.tinkService.completeAuthorization(authCode, state);
        // Use orgId as provider connection ID for Tink
        providerConnectionId = `tink_${orgId}_${Date.now()}`;
      } else {
        throw new BadRequestException(`Provider ${provider} not supported yet`);
      }

      // Encrypt tokens
      const accessTokenEncrypted = TinkEncryptionUtil.encrypt(
        tokens.accessToken,
        this.encryptionKey,
      );
      const refreshTokenEncrypted = TinkEncryptionUtil.encrypt(
        tokens.refreshToken,
        this.encryptionKey,
      );

      // Calculate consent expiry (PSD2 90 days)
      const consentExpiresAt = new Date();
      consentExpiresAt.setDate(consentExpiresAt.getDate() + 90);

      // Create connection record
      const connection = await this.prisma.bankConnection.create({
        data: {
          orgId,
          provider,
          providerConnectionId,
          institutionId: institutionId || 'unknown',
          institutionName: institutionName || 'Unknown Bank',
          status: ConnectionStatus.ACTIVE,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          consentExpiresAt,
          lastSyncAt: null,
          nextSyncAt: new Date(), // Trigger immediate sync
        },
      });

      this.logger.log(
        `Bank connection created: ${connection.id}, duration: ${Date.now() - startTime}ms`,
      );

      // Trigger initial sync asynchronously (don't wait)
      this.syncConnection({ connectionId: connection.id })
        .catch(err => this.logger.error(`Initial sync failed for ${connection.id}:`, err));

      return { connectionId: connection.id };
    } catch (error) {
      this.logger.error(`Failed to create bank connection:`, error);
      throw new InternalServerErrorException('Failed to create bank connection');
    }
  }

  /**
   * Sync a connection: fetch accounts and transactions
   */
  async syncConnection(params: SyncConnectionParams): Promise<SyncResult> {
    const startTime = Date.now();
    const { connectionId, forceFullSync = false, accountIds, startDate, endDate } = params;

    const metrics: SyncMetrics = {
      accountsProcessed: 0,
      accountsCreated: 0,
      accountsUpdated: 0,
      accountsSkipped: 0,
      transactionsProcessed: 0,
      transactionsCreated: 0,
      transactionsDuplicate: 0,
      transactionsSkipped: 0,
      apiCallsCount: 0,
      totalDataSize: 0,
      averageResponseTime: 0,
    };

    const errors: SyncError[] = [];
    let newAccounts = 0;
    let newTransactions = 0;

    try {
      // Get connection
      const connection = await this.prisma.bankConnection.findUnique({
        where: { id: connectionId },
        include: { accounts: true },
      });

      if (!connection) {
        throw new NotFoundException(`Connection ${connectionId} not found`);
      }

      if (connection.status === ConnectionStatus.DISCONNECTED) {
        throw new BadRequestException('Connection is disconnected');
      }

      this.logger.log(`Starting sync for connection ${connectionId}`);

      // Decrypt tokens
      const accessToken = TinkEncryptionUtil.decrypt(
        connection.accessTokenEncrypted || '',
        this.encryptionKey,
      );

      // Check if token needs refresh
      if (connection.consentExpiresAt && connection.consentExpiresAt < new Date()) {
        errors.push({
          type: 'AUTHENTICATION',
          message: 'Consent expired, requires re-authorization',
          timestamp: new Date(),
          retryable: false,
        });

        await this.prisma.bankConnection.update({
          where: { id: connectionId },
          data: { status: ConnectionStatus.REQUIRES_REAUTH },
        });

        throw new BadRequestException('Consent expired, re-authorization required');
      }

      // Sync accounts
      const accountsSyncResult = await this.syncAccounts(connection.orgId, connectionId, connection.provider);
      metrics.accountsCreated = accountsSyncResult.created;
      metrics.accountsUpdated = accountsSyncResult.updated;
      metrics.accountsProcessed = accountsSyncResult.processed;
      newAccounts = accountsSyncResult.created;
      metrics.apiCallsCount++;

      // Sync transactions for each account
      const accountsToSync = accountIds && accountIds.length > 0
        ? connection.accounts.filter(acc => accountIds.includes(acc.id))
        : connection.accounts;

      for (const account of accountsToSync) {
        try {
          const txSyncResult = await this.syncTransactions(
            connection.orgId,
            connectionId,
            account.id,
            account.accountId,
            connection.provider,
            startDate || connection.lastSyncAt || undefined,
            endDate,
          );

          metrics.transactionsCreated += txSyncResult.created;
          metrics.transactionsDuplicate += txSyncResult.duplicate;
          metrics.transactionsProcessed += txSyncResult.processed;
          newTransactions += txSyncResult.created;
          metrics.apiCallsCount++;
        } catch (error) {
          this.logger.error(`Failed to sync transactions for account ${account.id}:`, error);
          errors.push({
            type: 'TRANSACTION',
            message: error.message,
            accountId: account.id,
            timestamp: new Date(),
            retryable: true,
          });
        }
      }

      // Update connection sync status
      await this.prisma.bankConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncAt: new Date(),
          nextSyncAt: this.calculateNextSyncTime(),
          status: errors.length === 0 ? ConnectionStatus.ACTIVE : connection.status,
        },
      });

      const completedAt = new Date();
      const duration = Date.now() - startTime;

      this.logger.log(
        `Sync completed for connection ${connectionId}: ` +
        `${newAccounts} new accounts, ${newTransactions} new transactions, duration: ${duration}ms`,
      );

      return {
        connectionId,
        success: errors.length === 0,
        accountsSynced: metrics.accountsProcessed,
        transactionsSynced: metrics.transactionsCreated,
        newAccounts,
        newTransactions,
        errors,
        metrics,
        startedAt: new Date(startTime),
        completedAt,
        duration,
      };
    } catch (error) {
      const completedAt = new Date();
      const duration = Date.now() - startTime;

      this.logger.error(`Sync failed for connection ${connectionId}:`, error);

      // Update connection status on critical error
      if (error.message?.includes('expired') || error.message?.includes('unauthorized')) {
        await this.prisma.bankConnection.update({
          where: { id: connectionId },
          data: { status: ConnectionStatus.REQUIRES_REAUTH },
        });
      }

      errors.push({
        type: 'UNKNOWN',
        message: error.message || 'Unknown error',
        timestamp: new Date(),
        retryable: false,
      });

      return {
        connectionId,
        success: false,
        accountsSynced: 0,
        transactionsSynced: 0,
        newAccounts,
        newTransactions,
        errors,
        metrics,
        startedAt: new Date(startTime),
        completedAt,
        duration,
      };
    }
  }

  /**
   * Sync all active connections for an organization
   */
  async syncAllConnections(params: BatchSyncParams): Promise<BatchSyncResult> {
    const startTime = Date.now();
    const { orgId, connectionIds, concurrency = 3, continueOnError = true } = params;

    this.logger.log(`Starting batch sync for org ${orgId}`);

    // Get connections to sync
    const connections = await this.prisma.bankConnection.findMany({
      where: {
        orgId,
        id: connectionIds ? { in: connectionIds } : undefined,
        status: { in: [ConnectionStatus.ACTIVE, ConnectionStatus.ERROR] },
      },
    });

    if (connections.length === 0) {
      this.logger.warn(`No active connections found for org ${orgId}`);
    }

    const results: SyncResult[] = [];
    const errors: SyncError[] = [];

    // Sync connections with concurrency control
    for (let i = 0; i < connections.length; i += concurrency) {
      const batch = connections.slice(i, i + concurrency);
      const batchPromises = batch.map(conn =>
        this.syncConnection({ connectionId: conn.id })
          .catch(error => {
            errors.push({
              type: 'UNKNOWN',
              message: `Connection ${conn.id}: ${error.message}`,
              timestamp: new Date(),
              retryable: true,
            });
            return null;
          }),
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(r => r !== null) as SyncResult[]);

      if (!continueOnError && errors.length > 0) {
        break;
      }
    }

    const completedAt = new Date();
    const duration = Date.now() - startTime;

    const successfulSyncs = results.filter(r => r.success).length;
    const failedSyncs = results.length - successfulSyncs;

    this.logger.log(
      `Batch sync completed for org ${orgId}: ` +
      `${successfulSyncs}/${results.length} successful, duration: ${duration}ms`,
    );

    return {
      orgId,
      totalConnections: connections.length,
      successfulSyncs,
      failedSyncs,
      results,
      errors,
      startedAt: new Date(startTime),
      completedAt,
      duration,
    };
  }

  /**
   * Refresh PSD2 consents that are about to expire
   */
  async refreshExpiredConsents(
    params: RefreshExpiredConsentsParams = {},
  ): Promise<RefreshExpiredConsentsResult> {
    const { daysBeforeExpiry = 7, batchSize = 10 } = params;

    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + daysBeforeExpiry);

    this.logger.log(`Refreshing consents expiring before ${expiryThreshold.toISOString()}`);

    // Find connections with expiring consents
    const connections = await this.prisma.bankConnection.findMany({
      where: {
        status: { in: [ConnectionStatus.ACTIVE, ConnectionStatus.ERROR] },
        consentExpiresAt: {
          lte: expiryThreshold,
          gt: new Date(), // Not already expired
        },
      },
      take: batchSize,
    });

    const results: ConsentRefreshResult[] = [];
    let successfulRefresh = 0;
    let failedRefresh = 0;
    let requiresUserAction = 0;

    for (const connection of connections) {
      try {
        // For Tink and most PSD2 providers, consent renewal requires user re-authorization
        // Mark connection as requiring reauth
        await this.prisma.bankConnection.update({
          where: { id: connection.id },
          data: { status: ConnectionStatus.REQUIRES_REAUTH },
        });

        requiresUserAction++;

        results.push({
          connectionId: connection.id,
          success: false,
          previousExpiryDate: connection.consentExpiresAt,
          newExpiryDate: null,
          error: 'Requires user re-authorization',
        });
      } catch (error) {
        failedRefresh++;
        results.push({
          connectionId: connection.id,
          success: false,
          previousExpiryDate: connection.consentExpiresAt,
          newExpiryDate: null,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Consent refresh completed: ${connections.length} processed, ` +
      `${successfulRefresh} refreshed, ${requiresUserAction} require user action`,
    );

    return {
      totalProcessed: connections.length,
      successfulRefresh,
      failedRefresh,
      requiresUserAction,
      results,
    };
  }

  /**
   * Disconnect a bank connection and revoke access
   */
  async disconnectBank(connectionId: string): Promise<void> {
    this.logger.log(`Disconnecting bank connection ${connectionId}`);

    const connection = await this.prisma.bankConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException(`Connection ${connectionId} not found`);
    }

    // Update status to disconnected
    await this.prisma.bankConnection.update({
      where: { id: connectionId },
      data: {
        status: ConnectionStatus.DISCONNECTED,
        accessTokenEncrypted: null,
        refreshTokenEncrypted: null,
      },
    });

    // Note: In production, also call provider's revoke endpoint if available
    // For Tink: await this.tinkService.deleteCredentials(orgId, userId);

    this.logger.log(`Bank connection ${connectionId} disconnected`);
  }

  /**
   * Get connection health status
   */
  async getConnectionStatus(connectionId: string): Promise<ConnectionHealth> {
    const connection = await this.prisma.bankConnection.findUnique({
      where: { id: connectionId },
      include: {
        accounts: {
          where: { isActive: true },
        },
      },
    });

    if (!connection) {
      throw new NotFoundException(`Connection ${connectionId} not found`);
    }

    const now = new Date();
    const consentDaysRemaining = connection.consentExpiresAt
      ? Math.floor((connection.consentExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check consent expiry
    if (consentDaysRemaining !== null) {
      if (consentDaysRemaining <= 0) {
        errors.push('Consent has expired');
      } else if (consentDaysRemaining <= 7) {
        warnings.push(`Consent expires in ${consentDaysRemaining} days`);
      }
    }

    // Check last sync
    if (connection.lastSyncAt) {
      const hoursSinceSync = (now.getTime() - connection.lastSyncAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceSync > 48) {
        warnings.push(`Last sync was ${Math.floor(hoursSinceSync)} hours ago`);
      }
    }

    const isHealthy =
      connection.status === ConnectionStatus.ACTIVE &&
      errors.length === 0 &&
      (consentDaysRemaining === null || consentDaysRemaining > 7);

    return {
      connectionId: connection.id,
      status: connection.status,
      isHealthy,
      lastSyncAt: connection.lastSyncAt,
      nextSyncAt: connection.nextSyncAt,
      consentExpiresAt: connection.consentExpiresAt,
      consentDaysRemaining,
      requiresReauth: connection.status === ConnectionStatus.REQUIRES_REAUTH,
      errors,
      warnings,
      metadata: {
        provider: connection.provider,
        institutionName: connection.institutionName,
        accountCount: connection.accounts.length,
        lastSuccessfulSync: connection.lastSyncAt,
        consecutiveFailures: 0, // TODO: Track this
      },
    };
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Sync accounts for a connection
   * OPTIMIZED: Uses batch fetch and upsert pattern to avoid N+1 queries
   */
  private async syncAccounts(
    orgId: string,
    connectionId: string,
    provider: BankProvider,
  ): Promise<{ processed: number; created: number; updated: number }> {
    let accounts: TinkAccount[] = [];

    if (provider === BankProvider.TINK) {
      // For Tink, we need to get user ID from connection
      accounts = await this.tinkService.getAccounts(orgId, orgId); // Using orgId as userId
    } else {
      throw new BadRequestException(`Provider ${provider} not supported`);
    }

    if (accounts.length === 0) {
      return { processed: 0, created: 0, updated: 0 };
    }

    // OPTIMIZATION: Batch fetch all existing accounts for this connection in ONE query
    const existingAccounts = await this.prisma.bankAccountNew.findMany({
      where: {
        bankConnectionId: connectionId,
        accountId: { in: accounts.map(a => a.id) },
      },
      select: { id: true, accountId: true },
    });

    // Create lookup map for O(1) access
    const existingAccountMap = new Map(
      existingAccounts.map(a => [a.accountId, a.id])
    );

    let created = 0;
    let updated = 0;

    // OPTIMIZATION: Use transaction for batch operations
    await this.prisma.$transaction(async (tx) => {
      const toCreate: Array<{
        accountId: string;
        accountType: BankAccountType;
        name: string;
        iban: string | null;
        accountNumber: string | null;
        sortCode: string | null;
        currency: string;
        currentBalance: number;
        availableBalance: number | null;
        lastBalanceUpdate: Date;
        isActive: boolean;
        bankConnectionId: string;
      }> = [];
      const updateOperations: Promise<unknown>[] = [];

      for (const account of accounts) {
        const accountData = {
          accountId: account.id,
          accountType: this.mapAccountType(account.type),
          name: account.name,
          iban: account.identifiers.iban || null,
          accountNumber: account.identifiers.accountNumber || null,
          sortCode: account.identifiers.sortCode || null,
          currency: account.balances.booked.amount.currencyCode,
          currentBalance: account.balances.booked.amount.value,
          availableBalance: account.balances.available?.amount.value || null,
          lastBalanceUpdate: new Date(),
          isActive: true,
        };

        const existingId = existingAccountMap.get(account.id);
        if (existingId) {
          // Queue update operation
          updateOperations.push(
            tx.bankAccountNew.update({
              where: { id: existingId },
              data: accountData,
            })
          );
          updated++;
        } else {
          // Collect for batch create
          toCreate.push({
            ...accountData,
            bankConnectionId: connectionId,
          });
          created++;
        }
      }

      // Execute batch updates in parallel
      if (updateOperations.length > 0) {
        await Promise.all(updateOperations);
      }

      // Batch create new accounts
      if (toCreate.length > 0) {
        await tx.bankAccountNew.createMany({ data: toCreate });
      }
    });

    return { processed: accounts.length, created, updated };
  }

  /**
   * Sync transactions for an account
   * OPTIMIZED: Uses batch fetch and createMany to avoid N+1 queries
   */
  private async syncTransactions(
    orgId: string,
    connectionId: string,
    bankAccountId: string,
    externalAccountId: string,
    provider: BankProvider,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ processed: number; created: number; duplicate: number }> {
    let transactions: TinkTransaction[] = [];

    if (provider === BankProvider.TINK) {
      transactions = await this.tinkService.getTransactions(
        orgId,
        orgId,
        externalAccountId,
        startDate,
        endDate,
      );
    } else {
      throw new BadRequestException(`Provider ${provider} not supported`);
    }

    if (transactions.length === 0) {
      return { processed: 0, created: 0, duplicate: 0 };
    }

    // OPTIMIZATION: Batch fetch all existing transaction IDs in ONE query
    const existingTransactions = await this.prisma.bankTransactionNew.findMany({
      where: {
        bankAccountId,
        transactionId: { in: transactions.map(tx => tx.id) },
      },
      select: { transactionId: true },
    });

    // Create Set for O(1) lookup
    const existingTransactionIds = new Set(
      existingTransactions.map(t => t.transactionId)
    );

    // Filter out duplicates and prepare data for batch insert
    const newTransactions = transactions.filter(tx => !existingTransactionIds.has(tx.id));
    const duplicate = transactions.length - newTransactions.length;

    if (newTransactions.length === 0) {
      return { processed: transactions.length, created: 0, duplicate };
    }

    // OPTIMIZATION: Batch create all new transactions at once
    const transactionData = newTransactions.map(tx => ({
      bankAccountId,
      transactionId: tx.id,
      amount: tx.amount.value,
      currency: tx.amount.currencyCode,
      description: tx.descriptions.display,
      merchantName: tx.merchantInformation?.merchantName || null,
      merchantCategory: tx.merchantInformation?.merchantCategoryCode || null,
      bookingDate: tx.dates.booked,
      valueDate: tx.dates.value || tx.dates.booked,
      transactionType: tx.amount.value >= 0 ? BankTransactionType.CREDIT : BankTransactionType.DEBIT,
      status: tx.status === 'BOOKED' ? BankTransactionStatus.BOOKED : BankTransactionStatus.PENDING,
      reconciliationStatus: ReconciliationStatus.UNMATCHED,
      rawData: tx as unknown as Prisma.InputJsonValue,
    }));

    await this.prisma.bankTransactionNew.createMany({
      data: transactionData,
      skipDuplicates: true, // Extra safety against race conditions
    });

    return { processed: transactions.length, created: newTransactions.length, duplicate };
  }

  /**
   * Map Tink account type to Prisma enum
   */
  private mapAccountType(tinkType: string): BankAccountType {
    const mapping: Record<string, BankAccountType> = {
      'CHECKING': BankAccountType.CHECKING,
      'SAVINGS': BankAccountType.SAVINGS,
      'CREDIT_CARD': BankAccountType.CREDIT_CARD,
      'LOAN': BankAccountType.LOAN,
      'INVESTMENT': BankAccountType.INVESTMENT,
    };

    return mapping[tinkType] || BankAccountType.OTHER;
  }

  /**
   * Calculate next sync time (default: 24 hours)
   */
  private calculateNextSyncTime(): Date {
    const nextSync = new Date();
    nextSync.setHours(nextSync.getHours() + 24);
    return nextSync;
  }
}
