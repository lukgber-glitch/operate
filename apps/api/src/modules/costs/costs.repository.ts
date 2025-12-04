import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma, CostCategory } from '@prisma/client';

/**
 * Repository for cost entry database operations
 */
@Injectable()
export class CostsRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new cost entry
   */
  async create(data: Prisma.CostEntryCreateInput) {
    return this.prisma.costEntry.create({
      data,
    });
  }

  /**
   * Find cost entries with filters
   */
  async findAll(params: {
    where?: Prisma.CostEntryWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.CostEntryOrderByWithRelationInput;
  }) {
    return this.prisma.costEntry.findMany(params);
  }

  /**
   * Count cost entries
   */
  async count(where?: Prisma.CostEntryWhereInput): Promise<number> {
    return this.prisma.costEntry.count({ where });
  }

  /**
   * Find a single cost entry by ID
   */
  async findById(id: string) {
    return this.prisma.costEntry.findUnique({
      where: { id },
    });
  }

  /**
   * Get aggregated costs grouped by category
   */
  async aggregateByCategory(
    orgId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    {
      category: CostCategory;
      _sum: { amount: Prisma.Decimal | null };
      _count: number;
    }[]
  > {
    const where: Prisma.CostEntryWhereInput = {
      orgId,
      ...(startDate && {
        createdAt: {
          gte: startDate,
          ...(endDate && { lte: endDate }),
        },
      }),
    };

    return this.prisma.costEntry.groupBy({
      by: ['category'],
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    }) as any;
  }

  /**
   * Get aggregated costs grouped by automation
   */
  async aggregateByAutomation(
    orgId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    {
      automationId: string | null;
      _sum: { amount: Prisma.Decimal | null };
      _count: number;
    }[]
  > {
    const where: Prisma.CostEntryWhereInput = {
      orgId,
      ...(startDate && {
        createdAt: {
          gte: startDate,
          ...(endDate && { lte: endDate }),
        },
      }),
    };

    return this.prisma.costEntry.groupBy({
      by: ['automationId'],
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    }) as any;
  }

  /**
   * Get total cost for an organisation
   */
  async getTotalCost(
    orgId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ _sum: { amount: Prisma.Decimal | null }; _count: number }> {
    const where: Prisma.CostEntryWhereInput = {
      orgId,
      ...(startDate && {
        createdAt: {
          gte: startDate,
          ...(endDate && { lte: endDate }),
        },
      }),
    };

    return this.prisma.costEntry.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    });
  }
}
