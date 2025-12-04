import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ExpensesRepository } from './expenses.repository';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { Prisma, ExpenseStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Expenses Service
 * Business logic for expense management operations
 */
@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(private repository: ExpensesRepository) {}

  /**
   * Find all expenses with pagination and filters
   */
  async findAll(orgId: string, query: ExpenseQueryDto) {
    const {
      search,
      status,
      category,
      submittedBy,
      fromDate,
      toDate,
      page = 1,
      pageSize = 20,
      sortBy = 'date',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: Prisma.ExpenseWhereInput = {
      orgId,
      ...(status && { status }),
      ...(category && { category }),
      ...(submittedBy && { submittedBy }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { vendorName: { contains: search, mode: 'insensitive' } },
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

    const [expenses, total] = await Promise.all([
      this.repository.findAll({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.repository.count(where),
    ]);

    return {
      data: expenses,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get expense statistics
   */
  async getStatistics(orgId: string) {
    const [byCategory, byStatus] = await Promise.all([
      this.repository.getStatisticsByCategory(orgId),
      this.repository.getStatisticsByStatus(orgId),
    ]);

    return {
      byCategory,
      byStatus,
    };
  }

  /**
   * Get pending expenses
   */
  async getPending(orgId: string) {
    return this.repository.getPending(orgId);
  }

  /**
   * Find expense by ID
   */
  async findById(id: string) {
    const expense = await this.repository.findById(id);

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  /**
   * Create new expense
   */
  async create(orgId: string, dto: CreateExpenseDto) {
    const expenseData: Prisma.ExpenseCreateInput = {
      orgId,
      description: dto.description,
      amount: new Decimal(dto.amount),
      currency: dto.currency || 'EUR',
      date: new Date(dto.date),
      category: dto.category,
      subcategory: dto.subcategory,
      vendorName: dto.vendorName,
      vendorVatId: dto.vendorVatId,
      receiptUrl: dto.receiptUrl,
      receiptNumber: dto.receiptNumber,
      status: ExpenseStatus.PENDING,
      vatAmount: dto.vatAmount ? new Decimal(dto.vatAmount) : undefined,
      vatRate: dto.vatRate,
      isDeductible: dto.isDeductible ?? true,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes,
      metadata: dto.metadata ?? undefined,
      submittedBy: dto.submittedBy,
    };

    const expense = await this.repository.create(expenseData);

    this.logger.log(`Created expense ${expense.id} for organisation ${orgId}`);

    return expense;
  }

  /**
   * Update expense (only PENDING expenses)
   */
  async update(id: string, dto: UpdateExpenseDto) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    if (existing.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException(
        `Cannot update expense with status ${existing.status}. Only PENDING expenses can be updated.`,
      );
    }

    const updateData: Prisma.ExpenseUpdateInput = {};

    if (dto.description) updateData.description = dto.description;
    if (dto.amount !== undefined) updateData.amount = new Decimal(dto.amount);
    if (dto.date) updateData.date = new Date(dto.date);
    if (dto.category) updateData.category = dto.category;
    if (dto.subcategory !== undefined) updateData.subcategory = dto.subcategory;
    if (dto.vendorName !== undefined) updateData.vendorName = dto.vendorName;
    if (dto.vendorVatId !== undefined) updateData.vendorVatId = dto.vendorVatId;
    if (dto.receiptUrl !== undefined) updateData.receiptUrl = dto.receiptUrl;
    if (dto.receiptNumber !== undefined)
      updateData.receiptNumber = dto.receiptNumber;
    if (dto.vatAmount !== undefined)
      updateData.vatAmount = dto.vatAmount ? new Decimal(dto.vatAmount) : null;
    if (dto.vatRate !== undefined) updateData.vatRate = dto.vatRate;
    if (dto.isDeductible !== undefined)
      updateData.isDeductible = dto.isDeductible;
    if (dto.paymentMethod !== undefined)
      updateData.paymentMethod = dto.paymentMethod;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;

    const expense = await this.repository.update(id, updateData);

    this.logger.log(`Updated expense ${id}`);

    return expense;
  }

  /**
   * Approve expense
   */
  async approve(id: string, approvedBy: string) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    if (existing.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve expense with status ${existing.status}`,
      );
    }

    const expense = await this.repository.update(id, {
      status: ExpenseStatus.APPROVED,
      approvedBy,
      approvedAt: new Date(),
    });

    this.logger.log(`Approved expense ${id} by user ${approvedBy}`);

    return expense;
  }

  /**
   * Reject expense
   */
  async reject(id: string, rejectionReason: string) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    if (existing.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject expense with status ${existing.status}`,
      );
    }

    const expense = await this.repository.update(id, {
      status: ExpenseStatus.REJECTED,
      rejectionReason,
    });

    this.logger.log(`Rejected expense ${id}: ${rejectionReason}`);

    return expense;
  }

  /**
   * Mark expense as reimbursed
   */
  async reimburse(id: string) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    if (existing.status !== ExpenseStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot reimburse expense with status ${existing.status}. Only APPROVED expenses can be reimbursed.`,
      );
    }

    const expense = await this.repository.update(id, {
      status: ExpenseStatus.REIMBURSED,
      reimbursedAt: new Date(),
    });

    this.logger.log(`Marked expense ${id} as reimbursed`);

    return expense;
  }

  /**
   * Delete expense (only PENDING expenses)
   */
  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    if (existing.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException(
        `Cannot delete expense with status ${existing.status}. Only PENDING expenses can be deleted.`,
      );
    }

    await this.repository.delete(id);

    this.logger.log(`Deleted expense ${id}`);
  }
}
