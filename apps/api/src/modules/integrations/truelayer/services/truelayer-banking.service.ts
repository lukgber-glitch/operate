import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { TrueLayerService } from '../truelayer.service';
import { ConfigService } from '@nestjs/config';
import { TrueLayerEncryptionUtil } from '../utils/truelayer-encryption.util';
import {
  TrueLayerAccount,
  TrueLayerBalance,
  TrueLayerTransaction,
  TrueLayerAccountType,
  TrueLayerTransactionType,
} from '../truelayer.types';

/**
 * TrueLayer Banking Service
 * Manages bank accounts and transactions via TrueLayer Open Banking
 *
 * Features:
 * - Get all connected bank accounts
 * - Real-time balance refresh
 * - Transaction history retrieval
 * - Incremental transaction sync
 * - Transaction categorization
 * - Webhook-driven updates
 */
@Injectable()
export class TrueLayerBankingService {
  private readonly logger = new Logger(TrueLayerBankingService.name);
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly trueLayerService: TrueLayerService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey =
      this.configService.get<string>('TRUELAYER_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET') ||
      '';
  }

  /**
   * Get all connected bank accounts for an organization
   */
  async getBankAccounts(orgId: string, connectionId?: string) {
    try {
      const where: any = { orgId, isActive: true };
      if (connectionId) {
        where.trueLayerConnectionId = connectionId;
      }

      const accounts = await this.prisma.trueLayerBankAccount.findMany({
        where,
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      });

      this.logger.log(
        `Retrieved ${accounts.length} bank accounts for org ${orgId}`,
      );
      return accounts;
    } catch (error) {
      this.logger.error('Failed to retrieve bank accounts', error);
      throw new InternalServerErrorException('Failed to retrieve bank accounts');
    }
  }

  /**
   * Get a specific bank account by ID
   */
  async getBankAccount(orgId: string, accountId: string) {
    const account = await this.prisma.trueLayerBankAccount.findFirst({
      where: {
        id: accountId,
        orgId,
        isActive: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    return account;
  }

  /**
   * Refresh account balances from TrueLayer (real-time)
   */
  async refreshAccountBalances(
    orgId: string,
    userId: string,
    connectionId: string,
  ) {
    const startTime = Date.now();

    try {
      this.logger.log(`Refreshing balances for connection ${connectionId}`);

      // Get all accounts for this connection
      const accounts = await this.prisma.trueLayerBankAccount.findMany({
        where: {
          orgId,
          trueLayerConnectionId: connectionId,
          isActive: true,
        },
      });

      if (accounts.length === 0) {
        throw new NotFoundException('No accounts found for this connection');
      }

      // Fetch balances from TrueLayer for each account
      const updatePromises = accounts.map(async (account) => {
        try {
          const balance = await this.trueLayerService.getBalance(
            userId,
            connectionId,
            account.trueLayerAccountId,
          );

          return this.prisma.trueLayerBankAccount.update({
            where: { id: account.id },
            data: {
              currentBalance: balance.current ? Number(balance.current) : null,
              availableBalance: balance.available
                ? Number(balance.available)
                : null,
              overdraft: balance.overdraft ? Number(balance.overdraft) : null,
              lastBalanceUpdate: new Date(),
              balanceAsOf: new Date(balance.update_timestamp),
              updatedAt: new Date(),
            },
          });
        } catch (error) {
          this.logger.warn(
            `Failed to refresh balance for account ${account.trueLayerAccountId}: ${error.message}`,
          );
          return null;
        }
      });

      const results = await Promise.all(updatePromises);
      const successCount = results.filter((r) => r !== null).length;

      // Log audit event
      await this.logAuditEvent({
        orgId,
        userId,
        action: 'BALANCES_REFRESHED',
        metadata: {
          connectionId,
          accountCount: successCount,
          duration: Date.now() - startTime,
        },
      });

      this.logger.log(`Refreshed balances for ${successCount} accounts`);

      return results.filter((r) => r !== null);
    } catch (error) {
      this.logger.error('Failed to refresh balances', error);
      throw new InternalServerErrorException('Failed to refresh account balances');
    }
  }

  /**
   * Sync and store all accounts from TrueLayer
   */
  async syncAccounts(orgId: string, userId: string, connectionId: string) {
    try {
      this.logger.log(`Syncing accounts for connection ${connectionId}`);

      // Get accounts from TrueLayer
      const trueLayerAccounts = await this.trueLayerService.getAccounts(
        userId,
        connectionId,
      );

      // Upsert accounts to database
      const upsertPromises = trueLayerAccounts.map(async (account) => {
        return this.prisma.trueLayerBankAccount.upsert({
          where: {
            orgId_trueLayerAccountId: {
              orgId,
              trueLayerAccountId: account.account_id,
            },
          },
          create: {
            orgId,
            trueLayerAccountId: account.account_id,
            trueLayerConnectionId: connectionId,
            providerId: account.provider?.provider_id || null,
            providerName: account.provider?.display_name || null,
            displayName: account.display_name,
            accountType: this.mapTrueLayerAccountType(account.account_type),
            currency: account.currency || 'GBP',
            iban: account.account_number?.iban || null,
            sortCode: account.account_number?.sort_code || null,
            accountNumber: account.account_number?.number || null,
            swiftBic: account.account_number?.swift_bic || null,
            isActive: true,
            metadata: account as Prisma.InputJsonValue,
          },
          update: {
            displayName: account.display_name,
            providerId: account.provider?.provider_id || null,
            providerName: account.provider?.display_name || null,
            accountType: this.mapTrueLayerAccountType(account.account_type),
            currency: account.currency || 'GBP',
            iban: account.account_number?.iban || null,
            sortCode: account.account_number?.sort_code || null,
            accountNumber: account.account_number?.number || null,
            swiftBic: account.account_number?.swift_bic || null,
            isActive: true,
            updatedAt: new Date(),
          },
        });
      });

      const accounts = await Promise.all(upsertPromises);

      this.logger.log(`Synced ${accounts.length} accounts for org ${orgId}`);
      return accounts;
    } catch (error) {
      this.logger.error('Failed to sync accounts', error);
      throw new InternalServerErrorException('Failed to sync accounts');
    }
  }

  /**
   * Get transaction history with pagination
   */
  async getTransactions(
    orgId: string,
    accountId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    try {
      const where: any = {
        orgId,
        accountId,
      };

      if (options?.startDate || options?.endDate) {
        where.timestamp = {};
        if (options.startDate) {
          where.timestamp.gte = options.startDate;
        }
        if (options.endDate) {
          where.timestamp.lte = options.endDate;
        }
      }

      const [transactions, total] = await Promise.all([
        this.prisma.trueLayerTransaction.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: options?.limit || 100,
          skip: options?.offset || 0,
        }),
        this.prisma.trueLayerTransaction.count({ where }),
      ]);

      return {
        transactions,
        total,
        limit: options?.limit || 100,
        offset: options?.offset || 0,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve transactions', error);
      throw new InternalServerErrorException('Failed to retrieve transactions');
    }
  }

  /**
   * Sync transactions incrementally using cursor-based pagination
   */
  async syncTransactions(
    orgId: string,
    userId: string,
    accountId: string,
  ): Promise<{
    added: number;
    modified: number;
    removed: number;
    hasMore: boolean;
  }> {
    const startTime = Date.now();

    try {
      this.logger.log(`Syncing transactions for account ${accountId}`);

      // Get account with sync cursor
      const account = await this.prisma.trueLayerBankAccount.findFirst({
        where: {
          id: accountId,
          orgId,
          isActive: true,
        },
      });

      if (!account) {
        throw new NotFoundException('Bank account not found');
      }

      // Determine date range for sync
      let fromDate: Date | undefined;
      let toDate: Date | undefined;

      if (account.lastSyncAt) {
        // Incremental sync: get transactions since last sync
        fromDate = new Date(account.lastSyncAt);
        toDate = new Date();
      } else {
        // Initial sync: get last 365 days (UK Open Banking standard)
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 365);
        toDate = new Date();
      }

      // Fetch transactions from TrueLayer
      const trueLayerTransactions = await this.trueLayerService.getTransactions(
        userId,
        account.trueLayerConnectionId,
        account.trueLayerAccountId,
        fromDate,
        toDate,
      );

      let addedCount = 0;
      let modifiedCount = 0;

      // Process transactions
      if (trueLayerTransactions.length > 0) {
        const upsertPromises = trueLayerTransactions.map(async (txn) => {
          const existing = await this.prisma.trueLayerTransaction.findUnique({
            where: { trueLayerTransactionId: txn.transaction_id },
          });

          if (existing) {
            modifiedCount++;
          } else {
            addedCount++;
          }

          return this.upsertTransaction(
            orgId,
            account.id,
            account.trueLayerConnectionId,
            txn,
          );
        });

        await Promise.all(upsertPromises);
      }

      // Update sync cursor and timestamp
      await this.prisma.trueLayerBankAccount.update({
        where: { id: accountId },
        data: {
          lastSyncAt: new Date(),
          initialSyncComplete: true,
        },
      });

      // Log audit event
      await this.logAuditEvent({
        orgId,
        userId,
        action: 'TRANSACTIONS_SYNCED',
        metadata: {
          accountId,
          connectionId: account.trueLayerConnectionId,
          added: addedCount,
          modified: modifiedCount,
          removed: 0,
          hasMore: false,
          duration: Date.now() - startTime,
        },
      });

      this.logger.log(
        `Synced transactions: +${addedCount} ~${modifiedCount}`,
      );

      return {
        added: addedCount,
        modified: modifiedCount,
        removed: 0,
        hasMore: false,
      };
    } catch (error) {
      this.logger.error('Failed to sync transactions', error);
      throw new InternalServerErrorException('Failed to sync transactions');
    }
  }

  /**
   * Handle transaction removal
   */
  async removeTransactions(orgId: string, transactionIds: string[]) {
    try {
      // Mark transactions as removed
      await this.prisma.trueLayerTransaction.updateMany({
        where: {
          orgId,
          trueLayerTransactionId: { in: transactionIds },
        },
        data: {
          status: 'REMOVED',
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Marked ${transactionIds.length} transactions as removed`);
    } catch (error) {
      this.logger.error('Failed to remove transactions', error);
      throw new InternalServerErrorException('Failed to remove transactions');
    }
  }

  /**
   * Upsert a single transaction
   */
  private async upsertTransaction(
    orgId: string,
    accountId: string,
    connectionId: string,
    txn: TrueLayerTransaction,
  ) {
    const isIncome = txn.transaction_type === TrueLayerTransactionType.CREDIT;
    const amount = Math.abs(txn.amount);

    return this.prisma.trueLayerTransaction.upsert({
      where: {
        trueLayerTransactionId: txn.transaction_id,
      },
      create: {
        orgId,
        accountId,
        trueLayerTransactionId: txn.transaction_id,
        trueLayerAccountId: txn.transaction_id.split('_')[0] || '',
        trueLayerConnectionId: connectionId,
        amount,
        currency: txn.currency || 'GBP',
        transactionType: txn.transaction_type,
        transactionCategory: txn.transaction_category || null,
        timestamp: new Date(txn.timestamp),
        postDate: txn.timestamp ? new Date(txn.timestamp) : null,
        description: txn.description,
        merchantName: txn.merchant_name || null,
        transactionClassification: txn.transaction_classification || [],
        runningBalanceAmount: txn.running_balance?.amount
          ? Number(txn.running_balance.amount)
          : null,
        runningBalanceCurrency: txn.running_balance?.currency || null,
        status: 'POSTED',
        pending: false,
        isIncome,
        rawData: txn as Prisma.InputJsonValue,
        syncedAt: new Date(),
        updatedFromTrueLayer: new Date(),
      },
      update: {
        amount,
        description: txn.description,
        merchantName: txn.merchant_name || null,
        transactionCategory: txn.transaction_category || null,
        transactionClassification: txn.transaction_classification || [],
        runningBalanceAmount: txn.running_balance?.amount
          ? Number(txn.running_balance.amount)
          : null,
        runningBalanceCurrency: txn.running_balance?.currency || null,
        updatedFromTrueLayer: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Map TrueLayer account type to our enum
   */
  private mapTrueLayerAccountType(type: string): any {
    const typeMap: Record<string, string> = {
      TRANSACTION: 'TRANSACTION',
      SAVINGS: 'SAVINGS',
      CURRENT: 'CURRENT',
    };
    return typeMap[type.toUpperCase()] || 'TRANSACTION';
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(event: {
    orgId: string;
    userId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO truelayer_audit_logs
        (user_id, action, metadata, created_at)
        VALUES
        (${event.userId}, ${event.action}, ${JSON.stringify(event.metadata)}::jsonb, NOW())
      `;
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
    }
  }
}
