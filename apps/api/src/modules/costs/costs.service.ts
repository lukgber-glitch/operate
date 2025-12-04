import { Injectable, Logger } from '@nestjs/common';
import { CostsRepository } from './costs.repository';
import { CreateCostEntryDto } from './dto/create-cost-entry.dto';
import { CostQueryDto } from './dto/cost-query.dto';
import { CostEntryResponseDto } from './dto/cost-entry-response.dto';
import {
  CostSummaryDto,
  CategoryBreakdown,
  AutomationBreakdown,
} from './dto/cost-summary.dto';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Service for cost tracking operations
 */
@Injectable()
export class CostsService {
  private readonly logger = new Logger(CostsService.name);

  constructor(private repository: CostsRepository) {}

  /**
   * Record a new cost entry
   */
  async create(
    orgId: string,
    dto: CreateCostEntryDto,
  ): Promise<CostEntryResponseDto> {
    const costEntry = await this.repository.create({
      organisation: { connect: { id: orgId } },
      category: dto.category,
      amount: new Decimal(dto.amount),
      currency: dto.currency || 'EUR',
      description: dto.description,
      automationId: dto.automationId,
      metadata: dto.metadata || Prisma.JsonNull,
    });

    this.logger.log(
      `Created cost entry ${costEntry.id} for org ${orgId}: ${dto.category} - ${dto.amount} ${dto.currency || 'EUR'}`,
    );

    return this.mapToResponseDto(costEntry);
  }

  /**
   * List cost entries with filters and pagination
   */
  async findAll(
    orgId: string,
    query: CostQueryDto,
  ): Promise<{
    data: CostEntryResponseDto[];
    meta: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }> {
    const {
      category,
      automationId,
      startDate,
      endDate,
      page = 1,
      pageSize = 50,
    } = query;

    // Build where clause
    const where: Prisma.CostEntryWhereInput = {
      orgId,
      ...(category && { category }),
      ...(automationId && { automationId }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      ...(startDate &&
        !endDate && {
          createdAt: {
            gte: new Date(startDate),
          },
        }),
      ...(!startDate &&
        endDate && {
          createdAt: {
            lte: new Date(endDate),
          },
        }),
    };

    const skip = (page - 1) * pageSize;

    const [entries, total] = await Promise.all([
      this.repository.findAll({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.repository.count(where),
    ]);

    return {
      data: entries.map((entry) => this.mapToResponseDto(entry)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get aggregated cost summary
   */
  async getSummary(
    orgId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<CostSummaryDto> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Get total costs
    const totalAgg = await this.repository.getTotalCost(orgId, start, end);
    const totalAmount = totalAgg._sum.amount
      ? parseFloat(totalAgg._sum.amount.toString())
      : 0;
    const totalEntries = totalAgg._count;

    // Get category breakdown
    const categoryAgg = await this.repository.aggregateByCategory(
      orgId,
      start,
      end,
    );
    const byCategory: CategoryBreakdown[] = categoryAgg.map((agg) => ({
      category: agg.category,
      totalAmount: agg._sum.amount
        ? parseFloat(agg._sum.amount.toString())
        : 0,
      count: agg._count,
      percentage:
        totalAmount > 0
          ? parseFloat(
              (
                ((agg._sum.amount
                  ? parseFloat(agg._sum.amount.toString())
                  : 0) /
                  totalAmount) *
                100
              ).toFixed(2),
            )
          : 0,
    }));

    // Get automation breakdown
    const automationAgg = await this.repository.aggregateByAutomation(
      orgId,
      start,
      end,
    );
    const byAutomation: AutomationBreakdown[] = automationAgg.map((agg) => ({
      automationId: agg.automationId,
      totalAmount: agg._sum.amount
        ? parseFloat(agg._sum.amount.toString())
        : 0,
      count: agg._count,
    }));

    // Sort by total amount descending
    byCategory.sort((a, b) => b.totalAmount - a.totalAmount);
    byAutomation.sort((a, b) => b.totalAmount - a.totalAmount);

    const averageCostPerEntry =
      totalEntries > 0
        ? parseFloat((totalAmount / totalEntries).toFixed(4))
        : 0;

    return {
      totalAmount,
      totalEntries,
      currency: 'EUR',
      startDate: start,
      endDate: end,
      byCategory,
      byAutomation,
      averageCostPerEntry,
    };
  }

  /**
   * Get costs by category
   */
  async getCostsByCategory(
    orgId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<CategoryBreakdown[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const totalAgg = await this.repository.getTotalCost(orgId, start, end);
    const totalAmount = totalAgg._sum.amount
      ? parseFloat(totalAgg._sum.amount.toString())
      : 0;

    const categoryAgg = await this.repository.aggregateByCategory(
      orgId,
      start,
      end,
    );

    const breakdown = categoryAgg.map((agg) => ({
      category: agg.category,
      totalAmount: agg._sum.amount
        ? parseFloat(agg._sum.amount.toString())
        : 0,
      count: agg._count,
      percentage:
        totalAmount > 0
          ? parseFloat(
              (
                ((agg._sum.amount
                  ? parseFloat(agg._sum.amount.toString())
                  : 0) /
                  totalAmount) *
                100
              ).toFixed(2),
            )
          : 0,
    }));

    return breakdown.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Get costs by automation
   */
  async getCostsByAutomation(
    orgId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AutomationBreakdown[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const automationAgg = await this.repository.aggregateByAutomation(
      orgId,
      start,
      end,
    );

    const breakdown = automationAgg.map((agg) => ({
      automationId: agg.automationId,
      totalAmount: agg._sum.amount
        ? parseFloat(agg._sum.amount.toString())
        : 0,
      count: agg._count,
    }));

    return breakdown.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Map database entity to response DTO
   */
  private mapToResponseDto(costEntry: any): CostEntryResponseDto {
    return {
      id: costEntry.id,
      orgId: costEntry.orgId,
      category: costEntry.category,
      amount: parseFloat(costEntry.amount.toString()),
      currency: costEntry.currency,
      description: costEntry.description,
      automationId: costEntry.automationId,
      metadata: costEntry.metadata,
      createdAt: costEntry.createdAt,
    };
  }
}
