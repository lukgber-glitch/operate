import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PlaidService } from '../plaid.service';
import {
  AccountsGetRequest,
  AccountsBalanceGetRequest,
  TransactionsSyncRequest,
  RemovedTransaction,
} from 'plaid';
import { PlaidEncryptionUtil } from '../utils/plaid-encryption.util';
import { ConfigService } from '@nestjs/config';

/**
 * Plaid Bank Service
 * Manages bank accounts and transactions via Plaid
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
export class PlaidBankService {
  private readonly logger = new Logger(PlaidBankService.name);
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly plaidService: PlaidService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey =
      this.configService.get<string>('PLAID_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET') ||
      '';
  }

  /**
   * Get all connected bank accounts for an organization
   */
  async getBankAccounts(orgId: string, itemId?: string) {
    try {
      const where: any = { orgId, isActive: true };
      if (itemId) {
        where.plaidItemId = itemId;
      }

      const accounts = await this.prisma.plaidBankAccount.findMany({
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
    const account = await this.prisma.plaidBankAccount.findFirst({
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
   * Refresh account balances from Plaid (real-time)
   */
  async refreshAccountBalances(orgId: string, userId: string, itemId: string) {
    const startTime = Date.now();

    try {
      this.logger.log(`Refreshing balances for item ${itemId}`);

      // Get encrypted access token
      const connection = await this.prisma.$queryRaw<
        Array<{ access_token: string }>
      >`
        SELECT access_token
        FROM plaid_connections
        WHERE item_id = ${itemId} AND status = 'ACTIVE'
        LIMIT 1
      `;

      if (!connection || connection.length === 0) {
        throw new NotFoundException('Plaid connection not found');
      }

      // Decrypt access token
      const accessToken = PlaidEncryptionUtil.decrypt(
        connection[0].access_token,
        this.encryptionKey,
      );

      // Fetch balances from Plaid
      const request: AccountsBalanceGetRequest = {
        access_token: accessToken,
      };

      const response = await this.plaidService['plaidClient'].accountsBalanceGet(request);

      // Update balances in database
      const updatePromises = response.data.accounts.map(async (account) => {
        return this.prisma.plaidBankAccount.updateMany({
          where: {
            orgId,
            plaidAccountId: account.account_id,
          },
          data: {
            currentBalance: account.balances.current
              ? Number(account.balances.current)
              : null,
            availableBalance: account.balances.available
              ? Number(account.balances.available)
              : null,
            lastBalanceUpdate: new Date(),
            balanceAsOf: new Date(),
            updatedAt: new Date(),
          },
        });
      });

      await Promise.all(updatePromises);

      // Log audit event
      await this.logAuditEvent({
        orgId,
        userId,
        action: 'BALANCES_REFRESHED',
        metadata: {
          itemId,
          accountCount: response.data.accounts.length,
          duration: Date.now() - startTime,
        },
      });

      this.logger.log(
        `Refreshed balances for ${response.data.accounts.length} accounts`,
      );

      return response.data.accounts;
    } catch (error) {
      this.logger.error('Failed to refresh balances', error);
      throw new InternalServerErrorException('Failed to refresh account balances');
    }
  }

  /**
   * Sync and store all accounts from Plaid
   */
  async syncAccounts(orgId: string, userId: string, itemId: string) {
    try {
      this.logger.log(`Syncing accounts for item ${itemId}`);

      // Get accounts from Plaid via PlaidService
      const plaidAccounts = await this.plaidService.getAccounts(userId, itemId);

      // Upsert accounts to database
      const upsertPromises = plaidAccounts.map(async (account) => {
        // Determine account type and subtype
        const accountType = this.mapPlaidAccountType(account.type);
        const accountSubtype = this.mapPlaidAccountSubtype(account.subtype);

        return this.prisma.plaidBankAccount.upsert({
          where: {
            orgId_plaidAccountId: {
              orgId,
              plaidAccountId: account.account_id,
            },
          },
          create: {
            orgId,
            plaidAccountId: account.account_id,
            plaidItemId: itemId,
            name: account.name,
            officialName: account.official_name || null,
            mask: account.mask || null,
            accountType,
            accountSubtype,
            currentBalance: account.balances.current
              ? Number(account.balances.current)
              : null,
            availableBalance: account.balances.available
              ? Number(account.balances.available)
              : null,
            currency: account.balances.iso_currency_code || 'USD',
            lastBalanceUpdate: new Date(),
            balanceAsOf: new Date(),
            isActive: true,
            metadata: account as any,
          },
          update: {
            name: account.name,
            officialName: account.official_name || null,
            mask: account.mask || null,
            accountType,
            accountSubtype,
            currentBalance: account.balances.current
              ? Number(account.balances.current)
              : null,
            availableBalance: account.balances.available
              ? Number(account.balances.available)
              : null,
            currency: account.balances.iso_currency_code || 'USD',
            lastBalanceUpdate: new Date(),
            balanceAsOf: new Date(),
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
        where.date = {};
        if (options.startDate) {
          where.date.gte = options.startDate;
        }
        if (options.endDate) {
          where.date.lte = options.endDate;
        }
      }

      const [transactions, total] = await Promise.all([
        this.prisma.plaidTransaction.findMany({
          where,
          orderBy: { date: 'desc' },
          take: options?.limit || 100,
          skip: options?.offset || 0,
        }),
        this.prisma.plaidTransaction.count({ where }),
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
   * Sync transactions incrementally using Plaid's sync cursor
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
      const account = await this.prisma.plaidBankAccount.findFirst({
        where: {
          id: accountId,
          orgId,
          isActive: true,
        },
      });

      if (!account) {
        throw new NotFoundException('Bank account not found');
      }

      // Use PlaidService to sync transactions
      const syncResult = await this.plaidService.syncTransactions(
        userId,
        account.plaidItemId,
        account.syncCursor || undefined,
      );

      let addedCount = 0;
      let modifiedCount = 0;
      let removedCount = 0;

      // Process added/modified transactions
      if (syncResult.transactions.length > 0) {
        const upsertPromises = syncResult.transactions.map(async (txn) => {
          const existing = await this.prisma.plaidTransaction.findUnique({
            where: { plaidTransactionId: txn.transaction_id },
          });

          if (existing) {
            modifiedCount++;
          } else {
            addedCount++;
          }

          return this.upsertTransaction(orgId, account.id, txn);
        });

        await Promise.all(upsertPromises);
      }

      // Update sync cursor and timestamp
      await this.prisma.plaidBankAccount.update({
        where: { id: accountId },
        data: {
          syncCursor: syncResult.nextCursor,
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
          itemId: account.plaidItemId,
          added: addedCount,
          modified: modifiedCount,
          removed: removedCount,
          hasMore: syncResult.hasMore,
          duration: Date.now() - startTime,
        },
      });

      this.logger.log(
        `Synced transactions: +${addedCount} ~${modifiedCount} -${removedCount}`,
      );

      return {
        added: addedCount,
        modified: modifiedCount,
        removed: removedCount,
        hasMore: syncResult.hasMore,
      };
    } catch (error) {
      this.logger.error('Failed to sync transactions', error);
      throw new InternalServerErrorException('Failed to sync transactions');
    }
  }

  /**
   * Handle transaction removal (via webhook or sync)
   */
  async removeTransactions(orgId: string, transactionIds: string[]) {
    try {
      // Mark transactions as removed
      await this.prisma.plaidTransaction.updateMany({
        where: {
          orgId,
          plaidTransactionId: { in: transactionIds },
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
  private async upsertTransaction(orgId: string, accountId: string, txn: any) {
    const isIncome = txn.amount < 0; // Plaid uses negative for income
    const absoluteAmount = Math.abs(txn.amount);

    return this.prisma.plaidTransaction.upsert({
      where: {
        plaidTransactionId: txn.transaction_id,
      },
      create: {
        orgId,
        accountId,
        plaidTransactionId: txn.transaction_id,
        plaidAccountId: txn.account_id,
        plaidItemId: txn.item_id || null,
        amount: absoluteAmount,
        isoCurrencyCode: txn.iso_currency_code || 'USD',
        unofficialCurrencyCode: txn.unofficial_currency_code || null,
        date: new Date(txn.date),
        authorizedDate: txn.authorized_date ? new Date(txn.authorized_date) : null,
        postedDate: txn.datetime ? new Date(txn.datetime) : null,
        name: txn.name,
        merchantName: txn.merchant_name || null,
        originalDescription: txn.original_description || null,
        status: txn.pending ? 'PENDING' : 'POSTED',
        pending: txn.pending || false,
        category: txn.category || [],
        categoryId: txn.category_id || null,
        personalFinanceCategoryPrimary:
          txn.personal_finance_category?.primary || null,
        personalFinanceCategoryDetailed:
          txn.personal_finance_category?.detailed || null,
        personalFinanceCategory: txn.personal_finance_category || null,
        paymentChannel: txn.payment_channel || null,
        paymentMeta: txn.payment_meta || null,
        locationAddress: txn.location?.address || null,
        locationCity: txn.location?.city || null,
        locationRegion: txn.location?.region || null,
        locationPostalCode: txn.location?.postal_code || null,
        locationCountry: txn.location?.country || null,
        locationLat: txn.location?.lat ? Number(txn.location.lat) : null,
        locationLon: txn.location?.lon ? Number(txn.location.lon) : null,
        checkNumber: txn.check_number || null,
        counterpartyName: txn.counterparties?.[0]?.name || null,
        counterpartyType: txn.counterparties?.[0]?.type || null,
        counterpartyLogoUrl: txn.counterparties?.[0]?.logo_url || null,
        counterpartyWebsite: txn.counterparties?.[0]?.website || null,
        isIncome,
        rawData: txn,
        syncedAt: new Date(),
        updatedFromPlaid: new Date(),
      },
      update: {
        amount: absoluteAmount,
        name: txn.name,
        merchantName: txn.merchant_name || null,
        status: txn.pending ? 'PENDING' : 'POSTED',
        pending: txn.pending || false,
        category: txn.category || [],
        personalFinanceCategoryPrimary:
          txn.personal_finance_category?.primary || null,
        personalFinanceCategoryDetailed:
          txn.personal_finance_category?.detailed || null,
        personalFinanceCategory: txn.personal_finance_category || null,
        updatedFromPlaid: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Map Plaid account type to our enum
   */
  private mapPlaidAccountType(type: string): string {
    const typeMap: Record<string, string> = {
      depository: 'DEPOSITORY',
      credit: 'CREDIT',
      loan: 'LOAN',
      investment: 'INVESTMENT',
      other: 'OTHER',
    };
    return typeMap[type.toLowerCase()] || 'OTHER';
  }

  /**
   * Map Plaid account subtype to our enum
   */
  private mapPlaidAccountSubtype(subtype?: string): string | null {
    if (!subtype) return null;

    const subtypeMap: Record<string, string> = {
      checking: 'CHECKING',
      savings: 'SAVINGS',
      'money market': 'MONEY_MARKET',
      cd: 'CD',
      'credit card': 'CREDIT_CARD',
      paypal: 'PAYPAL',
    };

    return subtypeMap[subtype.toLowerCase()] || 'OTHER';
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(event: {
    orgId: string;
    userId: string;
    action: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO plaid_audit_logs
        (user_id, action, metadata, created_at)
        VALUES
        (${event.userId}, ${event.action}, ${JSON.stringify(event.metadata)}::jsonb, NOW())
      `;
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
    }
  }
}
