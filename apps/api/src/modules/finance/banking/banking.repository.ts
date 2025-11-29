import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BankAccount, BankTransaction, Prisma } from '@prisma/client';

/**
 * Banking Repository
 * Handles all database operations for BankAccount and BankTransaction entities
 */
@Injectable()
export class BankingRepository {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // BANK ACCOUNT METHODS
  // ============================================================================

  /**
   * Find all bank accounts for an organisation
   */
  async findAllAccounts(
    orgId: string,
    includeInactive = false,
  ): Promise<BankAccount[]> {
    return this.prisma.bankAccount.findMany({
      where: {
        orgId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Find bank account by ID
   */
  async findAccountById(id: string): Promise<BankAccount | null> {
    return this.prisma.bankAccount.findUnique({
      where: { id },
    });
  }

  /**
   * Create new bank account
   */
  async createAccount(
    data: Prisma.BankAccountCreateInput,
  ): Promise<BankAccount> {
    return this.prisma.bankAccount.create({
      data,
    });
  }

  /**
   * Update bank account by ID
   */
  async updateAccount(
    id: string,
    data: Prisma.BankAccountUpdateInput,
  ): Promise<BankAccount> {
    return this.prisma.bankAccount.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete bank account by ID
   */
  async deleteAccount(id: string): Promise<BankAccount> {
    return this.prisma.$transaction(async (tx) => {
      // Delete all transactions for this account
      await tx.bankTransaction.deleteMany({
        where: { bankAccountId: id },
      });

      // Delete account
      return tx.bankAccount.delete({
        where: { id },
      });
    });
  }

  /**
   * Set bank account as primary (unset others)
   */
  async setPrimaryAccount(id: string, orgId: string): Promise<BankAccount> {
    return this.prisma.$transaction(async (tx) => {
      // Unset all other primary accounts
      await tx.bankAccount.updateMany({
        where: {
          orgId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });

      // Set this account as primary
      return tx.bankAccount.update({
        where: { id },
        data: {
          isPrimary: true,
        },
      });
    });
  }

  /**
   * Get primary bank account for organisation
   */
  async getPrimaryAccount(orgId: string): Promise<BankAccount | null> {
    return this.prisma.bankAccount.findFirst({
      where: {
        orgId,
        isPrimary: true,
        isActive: true,
      },
    });
  }

  // ============================================================================
  // BANK TRANSACTION METHODS
  // ============================================================================

  /**
   * Find all transactions for a bank account with filters
   */
  async findAllTransactions(params: {
    where?: Prisma.BankTransactionWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.BankTransactionOrderByWithRelationInput;
  }): Promise<BankTransaction[]> {
    const { where, skip, take, orderBy } = params;

    return this.prisma.bankTransaction.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  /**
   * Count transactions matching filters
   */
  async countTransactions(
    where?: Prisma.BankTransactionWhereInput,
  ): Promise<number> {
    return this.prisma.bankTransaction.count({ where });
  }

  /**
   * Find transaction by ID
   */
  async findTransactionById(id: string): Promise<BankTransaction | null> {
    return this.prisma.bankTransaction.findUnique({
      where: { id },
    });
  }

  /**
   * Create bank transaction
   */
  async createTransaction(
    data: Prisma.BankTransactionCreateInput,
  ): Promise<BankTransaction> {
    return this.prisma.bankTransaction.create({
      data,
    });
  }

  /**
   * Create multiple transactions (bulk import)
   */
  async createManyTransactions(
    data: Prisma.BankTransactionCreateManyInput[],
  ): Promise<number> {
    const result = await this.prisma.bankTransaction.createMany({
      data,
      skipDuplicates: true, // Skip transactions with duplicate externalId
    });
    return result.count;
  }

  /**
   * Update transaction by ID
   */
  async updateTransaction(
    id: string,
    data: Prisma.BankTransactionUpdateInput,
  ): Promise<BankTransaction> {
    return this.prisma.bankTransaction.update({
      where: { id },
      data,
    });
  }

  /**
   * Check if transaction exists by external ID
   */
  async transactionExistsByExternalId(
    bankAccountId: string,
    externalId: string,
  ): Promise<boolean> {
    const count = await this.prisma.bankTransaction.count({
      where: {
        bankAccountId,
        externalId,
      },
    });
    return count > 0;
  }

  /**
   * Get account balance (calculated from transactions)
   */
  async getAccountBalance(accountId: string): Promise<number> {
    const result = await this.prisma.bankTransaction.aggregate({
      where: { bankAccountId: accountId },
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }
}
