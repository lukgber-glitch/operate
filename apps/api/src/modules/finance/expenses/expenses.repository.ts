import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Expense, Prisma, ExpenseStatus, ExpenseCategory } from '@prisma/client';

/**
 * Expenses Repository
 * Handles all database operations for Expense entity
 */
@Injectable()
export class ExpensesRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all expenses for an organisation with filters
   */
  async findAll(params: {
    where?: Prisma.ExpenseWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.ExpenseOrderByWithRelationInput;
  }): Promise<Expense[]> {
    const { where, skip, take, orderBy } = params;

    return this.prisma.expense.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  /**
   * Count expenses matching filters
   */
  async count(where?: Prisma.ExpenseWhereInput): Promise<number> {
    return this.prisma.expense.count({ where });
  }

  /**
   * Find expense by ID
   */
  async findById(id: string): Promise<Expense | null> {
    return this.prisma.expense.findUnique({
      where: { id },
    });
  }

  /**
   * Create new expense
   */
  async create(data: Prisma.ExpenseCreateInput): Promise<Expense> {
    return this.prisma.expense.create({
      data,
    });
  }

  /**
   * Update expense by ID
   */
  async update(id: string, data: Prisma.ExpenseUpdateInput): Promise<Expense> {
    return this.prisma.expense.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete expense by ID
   */
  async delete(id: string): Promise<Expense> {
    return this.prisma.expense.delete({
      where: { id },
    });
  }

  /**
   * Get expense statistics by category
   */
  async getStatisticsByCategory(orgId: string): Promise<
    Array<{
      category: ExpenseCategory;
      count: number;
      totalAmount: number;
    }>
  > {
    const stats = await this.prisma.expense.groupBy({
      by: ['category'],
      where: {
        orgId,
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });

    return stats.map((stat) => ({
      category: stat.category,
      count: stat._count.id,
      totalAmount: Number(stat._sum.amount || 0),
    }));
  }

  /**
   * Get expense statistics by status
   */
  async getStatisticsByStatus(orgId: string): Promise<
    Array<{
      status: ExpenseStatus;
      count: number;
      totalAmount: number;
    }>
  > {
    const stats = await this.prisma.expense.groupBy({
      by: ['status'],
      where: {
        orgId,
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });

    return stats.map((stat) => ({
      status: stat.status,
      count: stat._count.id,
      totalAmount: Number(stat._sum.amount || 0),
    }));
  }

  /**
   * Get pending expenses for approval
   */
  async getPending(orgId: string): Promise<Expense[]> {
    return this.prisma.expense.findMany({
      where: {
        orgId,
        status: ExpenseStatus.PENDING,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }
}
