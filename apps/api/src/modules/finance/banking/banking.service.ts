import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { BankingRepository } from './banking.repository';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BankTransactionQueryDto } from './dto/bank-transaction-query.dto';
import { ImportTransactionsDto } from './dto/import-transactions.dto';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Banking Service
 * Business logic for bank account and transaction management
 */
@Injectable()
export class BankingService {
  private readonly logger = new Logger(BankingService.name);

  constructor(private repository: BankingRepository) {}

  // ============================================================================
  // BANK ACCOUNT METHODS
  // ============================================================================

  /**
   * Find all bank accounts
   */
  async findAllAccounts(orgId: string, includeInactive = false) {
    return this.repository.findAllAccounts(orgId, includeInactive);
  }

  /**
   * Find bank account by ID with balance
   */
  async findAccountById(id: string) {
    const account = await this.repository.findAccountById(id);

    if (!account) {
      throw new NotFoundException(`Bank account with ID ${id} not found`);
    }

    // Calculate current balance from transactions
    const calculatedBalance = await this.repository.getAccountBalance(id);

    return {
      ...account,
      currentBalance: calculatedBalance,
    };
  }

  /**
   * Create new bank account
   */
  async createAccount(orgId: string, dto: CreateBankAccountDto) {
    const accountData: Prisma.BankAccountCreateInput = {
      orgId,
      name: dto.name,
      accountNumber: dto.accountNumber,
      iban: dto.iban,
      bic: dto.bic,
      bankName: dto.bankName,
      accountType: dto.accountType,
      currency: dto.currency || 'EUR',
      currentBalance: new Decimal(0),
      availableBalance: new Decimal(0),
      isActive: dto.isActive ?? true,
      isPrimary: false, // Default to false, can be set later
    };

    const account = await this.repository.createAccount(accountData);

    this.logger.log(
      `Created bank account ${account.id} for organisation ${orgId}`,
    );

    return account;
  }

  /**
   * Update bank account
   */
  async updateAccount(id: string, dto: UpdateBankAccountDto) {
    const existing = await this.repository.findAccountById(id);

    if (!existing) {
      throw new NotFoundException(`Bank account with ID ${id} not found`);
    }

    const updateData: Prisma.BankAccountUpdateInput = {};

    if (dto.name) updateData.name = dto.name;
    if (dto.accountNumber !== undefined)
      updateData.accountNumber = dto.accountNumber;
    if (dto.iban !== undefined) updateData.iban = dto.iban;
    if (dto.bic !== undefined) updateData.bic = dto.bic;
    if (dto.bankName !== undefined) updateData.bankName = dto.bankName;
    if (dto.accountType !== undefined) updateData.accountType = dto.accountType;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const account = await this.repository.updateAccount(id, updateData);

    this.logger.log(`Updated bank account ${id}`);

    return account;
  }

  /**
   * Delete bank account
   */
  async deleteAccount(id: string): Promise<void> {
    const existing = await this.repository.findAccountById(id);

    if (!existing) {
      throw new NotFoundException(`Bank account with ID ${id} not found`);
    }

    // Check if this is the primary account
    if (existing.isPrimary) {
      throw new BadRequestException(
        'Cannot delete primary account. Set another account as primary first.',
      );
    }

    await this.repository.deleteAccount(id);

    this.logger.log(`Deleted bank account ${id}`);
  }

  /**
   * Set account as primary
   */
  async setPrimaryAccount(id: string, orgId: string) {
    const existing = await this.repository.findAccountById(id);

    if (!existing) {
      throw new NotFoundException(`Bank account with ID ${id} not found`);
    }

    if (existing.orgId !== orgId) {
      throw new BadRequestException('Account does not belong to organisation');
    }

    if (!existing.isActive) {
      throw new BadRequestException('Cannot set inactive account as primary');
    }

    const account = await this.repository.setPrimaryAccount(id, orgId);

    this.logger.log(`Set bank account ${id} as primary for organisation ${orgId}`);

    return account;
  }

  // ============================================================================
  // BANK TRANSACTION METHODS
  // ============================================================================

  /**
   * Find all transactions for an account with filters
   */
  async findAllTransactions(accountId: string, query: BankTransactionQueryDto) {
    const {
      search,
      fromDate,
      toDate,
      type,
      category,
      isReconciled,
      page = 1,
      pageSize = 50,
      sortBy = 'date',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: Prisma.BankTransactionWhereInput = {
      bankAccountId: accountId,
      ...(type && { type }),
      ...(category && { category }),
      ...(isReconciled !== undefined && { isReconciled }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { counterpartyName: { contains: search, mode: 'insensitive' } },
          { reference: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Date range filter
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) {
        where.date.gte = new Date(fromDate);
      }
      if (toDate) {
        where.date.lte = new Date(toDate);
      }
    }

    const skip = (page - 1) * pageSize;

    const [transactions, total] = await Promise.all([
      this.repository.findAllTransactions({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.repository.countTransactions(where),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Import transactions for an account
   */
  async importTransactions(accountId: string, dto: ImportTransactionsDto) {
    const account = await this.repository.findAccountById(accountId);

    if (!account) {
      throw new NotFoundException(`Bank account with ID ${accountId} not found`);
    }

    // Prepare transaction data
    const transactionsData = dto.transactions.map((txn) => ({
      bankAccountId: accountId,
      externalId: txn.externalId,
      date: new Date(txn.date),
      description: txn.description,
      amount: new Decimal(txn.amount),
      currency: txn.currency,
      type: txn.type,
      counterpartyName: txn.counterpartyName,
      counterpartyIban: txn.counterpartyIban,
      reference: txn.reference,
      bookingText: txn.bookingText,
      isReconciled: false,
    }));

    // Import transactions (skip duplicates)
    const importedCount = await this.repository.createManyTransactions(
      transactionsData,
    );

    // Update account balance
    const newBalance = await this.repository.getAccountBalance(accountId);
    await this.repository.updateAccount(accountId, {
      currentBalance: new Decimal(newBalance),
      availableBalance: new Decimal(newBalance),
      lastSyncedAt: new Date(),
    });

    this.logger.log(
      `Imported ${importedCount} transactions for account ${accountId}`,
    );

    return {
      imported: importedCount,
      skipped: dto.transactions.length - importedCount,
      total: dto.transactions.length,
    };
  }

  /**
   * Update transaction (category, reconciled status)
   */
  async updateTransaction(
    id: string,
    updates: { category?: string; isReconciled?: boolean },
  ) {
    const existing = await this.repository.findTransactionById(id);

    if (!existing) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    const updateData: Prisma.BankTransactionUpdateInput = {};

    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.isReconciled !== undefined)
      updateData.isReconciled = updates.isReconciled;

    const transaction = await this.repository.updateTransaction(id, updateData);

    this.logger.log(`Updated transaction ${id}`);

    return transaction;
  }
}
