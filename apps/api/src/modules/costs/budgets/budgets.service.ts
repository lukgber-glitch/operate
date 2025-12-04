import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetResponseDto } from './dto/budget-response.dto';
import { Budget, BudgetAlert, CostCategory, AlertType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BudgetsService {
  private readonly logger = new Logger(BudgetsService.name);

  constructor(private readonly db: PrismaService) {}

  /**
   * Create a new budget
   */
  async create(orgId: string, dto: CreateBudgetDto): Promise<BudgetResponseDto> {
    // Validate dates
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    if (periodStart >= periodEnd) {
      throw new BadRequestException('Period start must be before period end');
    }

    // Validate thresholds
    const warningThreshold = dto.warningThreshold ?? 0.8;
    const criticalThreshold = dto.criticalThreshold ?? 0.95;

    if (warningThreshold >= criticalThreshold) {
      throw new BadRequestException(
        'Warning threshold must be less than critical threshold',
      );
    }

    const budget = await this.db.budget.create({
      data: {
        orgId,
        name: dto.name,
        category: dto.category,
        limitAmount: new Decimal(dto.limitAmount),
        currency: dto.currency ?? 'EUR',
        period: dto.period,
        warningThreshold: new Decimal(warningThreshold),
        criticalThreshold: new Decimal(criticalThreshold),
        autoPause: dto.autoPause ?? false,
        periodStart,
        periodEnd,
      },
      include: {
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    this.logger.log(`Created budget ${budget.id} for org ${orgId}`);
    return this.mapToResponse(budget);
  }

  /**
   * Get all budgets for an organisation
   */
  async findAll(orgId: string): Promise<BudgetResponseDto[]> {
    const budgets = await this.db.budget.findMany({
      where: { orgId },
      include: {
        alerts: {
          where: { acknowledged: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return budgets.map((budget: Budget & { alerts?: BudgetAlert[] }) => this.mapToResponse(budget));
  }

  /**
   * Get a single budget by ID
   */
  async findOne(orgId: string, id: string): Promise<BudgetResponseDto> {
    const budget = await this.db.budget.findUnique({
      where: { id, orgId },
      include: {
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!budget) {
      throw new NotFoundException(`Budget ${id} not found`);
    }

    return this.mapToResponse(budget);
  }

  /**
   * Update a budget
   */
  async update(
    orgId: string,
    id: string,
    dto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const existing = await this.db.budget.findUnique({
      where: { id, orgId },
    });

    if (!existing) {
      throw new NotFoundException(`Budget ${id} not found`);
    }

    // Validate dates if provided
    if (dto.periodStart || dto.periodEnd) {
      const periodStart = dto.periodStart
        ? new Date(dto.periodStart)
        : existing.periodStart;
      const periodEnd = dto.periodEnd
        ? new Date(dto.periodEnd)
        : existing.periodEnd;

      if (periodStart >= periodEnd) {
        throw new BadRequestException('Period start must be before period end');
      }
    }

    // Validate thresholds if provided
    if (dto.warningThreshold !== undefined || dto.criticalThreshold !== undefined) {
      const warningThreshold =
        dto.warningThreshold ?? Number(existing.warningThreshold);
      const criticalThreshold =
        dto.criticalThreshold ?? Number(existing.criticalThreshold);

      if (warningThreshold >= criticalThreshold) {
        throw new BadRequestException(
          'Warning threshold must be less than critical threshold',
        );
      }
    }

    const budget = await this.db.budget.update({
      where: { id, orgId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.limitAmount !== undefined && {
          limitAmount: new Decimal(dto.limitAmount),
        }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.period && { period: dto.period }),
        ...(dto.warningThreshold !== undefined && {
          warningThreshold: new Decimal(dto.warningThreshold),
        }),
        ...(dto.criticalThreshold !== undefined && {
          criticalThreshold: new Decimal(dto.criticalThreshold),
        }),
        ...(dto.autoPause !== undefined && { autoPause: dto.autoPause }),
        ...(dto.periodStart && { periodStart: new Date(dto.periodStart) }),
        ...(dto.periodEnd && { periodEnd: new Date(dto.periodEnd) }),
      },
      include: {
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    this.logger.log(`Updated budget ${id} for org ${orgId}`);
    return this.mapToResponse(budget);
  }

  /**
   * Delete a budget
   */
  async remove(orgId: string, id: string): Promise<void> {
    const budget = await this.db.budget.findUnique({
      where: { id, orgId },
    });

    if (!budget) {
      throw new NotFoundException(`Budget ${id} not found`);
    }

    await this.db.budget.delete({
      where: { id, orgId },
    });

    this.logger.log(`Deleted budget ${id} for org ${orgId}`);
  }

  /**
   * Pause a budget
   */
  async pause(orgId: string, id: string): Promise<BudgetResponseDto> {
    const budget = await this.db.budget.findUnique({
      where: { id, orgId },
    });

    if (!budget) {
      throw new NotFoundException(`Budget ${id} not found`);
    }

    if (budget.isPaused) {
      throw new BadRequestException('Budget is already paused');
    }

    const updated = await this.db.budget.update({
      where: { id, orgId },
      data: { isPaused: true },
      include: {
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    // Create pause alert
    await this.createAlert(
      updated,
      AlertType.PAUSED,
      Number(updated.criticalThreshold),
      'Budget manually paused by user',
    );

    this.logger.log(`Paused budget ${id} for org ${orgId}`);
    return this.mapToResponse(updated);
  }

  /**
   * Resume a budget
   */
  async resume(orgId: string, id: string): Promise<BudgetResponseDto> {
    const budget = await this.db.budget.findUnique({
      where: { id, orgId },
    });

    if (!budget) {
      throw new NotFoundException(`Budget ${id} not found`);
    }

    if (!budget.isPaused) {
      throw new BadRequestException('Budget is not paused');
    }

    const updated = await this.db.budget.update({
      where: { id, orgId },
      data: { isPaused: false },
      include: {
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    this.logger.log(`Resumed budget ${id} for org ${orgId}`);
    return this.mapToResponse(updated);
  }

  /**
   * Get alerts for a budget
   */
  async getAlerts(
    orgId: string,
    budgetId: string,
    limit = 50,
  ): Promise<BudgetAlert[]> {
    const budget = await this.db.budget.findUnique({
      where: { id: budgetId, orgId },
    });

    if (!budget) {
      throw new NotFoundException(`Budget ${budgetId} not found`);
    }

    return this.db.budgetAlert.findMany({
      where: { budgetId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    orgId: string,
    budgetId: string,
    alertId: string,
  ): Promise<BudgetAlert> {
    const budget = await this.db.budget.findUnique({
      where: { id: budgetId, orgId },
    });

    if (!budget) {
      throw new NotFoundException(`Budget ${budgetId} not found`);
    }

    const alert = await this.db.budgetAlert.findUnique({
      where: { id: alertId, budgetId },
    });

    if (!alert) {
      throw new NotFoundException(`Alert ${alertId} not found`);
    }

    return this.db.budgetAlert.update({
      where: { id: alertId },
      data: { acknowledged: true },
    });
  }

  /**
   * Check if a cost can be incurred within budget limits
   * Returns true if cost can be incurred, false otherwise
   */
  async canIncurCost(
    orgId: string,
    category: CostCategory,
    amount: number,
  ): Promise<{ allowed: boolean; reason?: string; budgetId?: string }> {
    // Find applicable budgets (category-specific or all-categories)
    const budgets = await this.db.budget.findMany({
      where: {
        orgId,
        OR: [{ category }, { category: null }],
        periodStart: { lte: new Date() },
        periodEnd: { gte: new Date() },
      },
    });

    if (budgets.length === 0) {
      // No budget configured, allow
      return { allowed: true };
    }

    // Check each applicable budget
    for (const budget of budgets) {
      if (budget.isPaused) {
        return {
          allowed: false,
          reason: `Budget "${budget.name}" is paused`,
          budgetId: budget.id,
        };
      }

      const currentSpend = Number(budget.currentSpend);
      const limitAmount = Number(budget.limitAmount);
      const newSpend = currentSpend + amount;

      if (newSpend > limitAmount) {
        return {
          allowed: false,
          reason: `Would exceed budget "${budget.name}" (${currentSpend + amount}/${limitAmount} ${budget.currency})`,
          budgetId: budget.id,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Record a cost and update budget(s)
   * Checks thresholds and creates alerts if necessary
   */
  async recordCost(
    orgId: string,
    category: CostCategory,
    amount: number,
  ): Promise<void> {
    // Find applicable budgets
    const budgets = await this.db.budget.findMany({
      where: {
        orgId,
        OR: [{ category }, { category: null }],
        periodStart: { lte: new Date() },
        periodEnd: { gte: new Date() },
      },
    });

    for (const budget of budgets) {
      const newSpend = Number(budget.currentSpend) + amount;
      const limitAmount = Number(budget.limitAmount);
      const usagePercentage = (newSpend / limitAmount) * 100;

      // Update budget spend
      const updated = await this.db.budget.update({
        where: { id: budget.id },
        data: { currentSpend: new Decimal(newSpend) },
      });

      // Check thresholds and create alerts
      await this.checkThresholds(updated, usagePercentage);

      // Auto-pause if enabled and exceeded
      if (budget.autoPause && newSpend >= limitAmount && !budget.isPaused) {
        await this.db.budget.update({
          where: { id: budget.id },
          data: { isPaused: true },
        });

        await this.createAlert(
          updated,
          AlertType.PAUSED,
          1.0,
          `Budget exceeded and automatically paused (${newSpend}/${limitAmount} ${budget.currency})`,
        );

        this.logger.warn(
          `Auto-paused budget ${budget.id} after exceeding limit`,
        );
      }
    }
  }

  /**
   * Check thresholds and create alerts if needed
   */
  private async checkThresholds(
    budget: Budget,
    usagePercentage: number,
  ): Promise<void> {
    const warningThreshold = Number(budget.warningThreshold) * 100;
    const criticalThreshold = Number(budget.criticalThreshold) * 100;
    const currentSpend = Number(budget.currentSpend);
    const limitAmount = Number(budget.limitAmount);

    // Check for critical threshold
    if (usagePercentage >= criticalThreshold) {
      // Check if we already have a recent critical alert
      const recentCriticalAlert = await this.db.budgetAlert.findFirst({
        where: {
          budgetId: budget.id,
          type: AlertType.CRITICAL,
          createdAt: { gte: new Date(Date.now() - 3600000) }, // Last hour
        },
      });

      if (!recentCriticalAlert) {
        await this.createAlert(
          budget,
          AlertType.CRITICAL,
          Number(budget.criticalThreshold),
          `Critical: Budget at ${usagePercentage.toFixed(1)}% (${currentSpend}/${limitAmount} ${budget.currency})`,
        );
      }
    }
    // Check for warning threshold
    else if (usagePercentage >= warningThreshold) {
      // Check if we already have a recent warning alert
      const recentWarningAlert = await this.db.budgetAlert.findFirst({
        where: {
          budgetId: budget.id,
          type: AlertType.WARNING,
          createdAt: { gte: new Date(Date.now() - 3600000) }, // Last hour
        },
      });

      if (!recentWarningAlert) {
        await this.createAlert(
          budget,
          AlertType.WARNING,
          Number(budget.warningThreshold),
          `Warning: Budget at ${usagePercentage.toFixed(1)}% (${currentSpend}/${limitAmount} ${budget.currency})`,
        );
      }
    }
  }

  /**
   * Create a budget alert
   */
  private async createAlert(
    budget: Budget,
    type: AlertType,
    threshold: number,
    message: string,
  ): Promise<BudgetAlert> {
    const alert = await this.db.budgetAlert.create({
      data: {
        budgetId: budget.id,
        type,
        threshold: new Decimal(threshold),
        currentSpend: budget.currentSpend,
        message,
      },
    });

    this.logger.warn(`Created ${type} alert for budget ${budget.id}: ${message}`);
    return alert;
  }

  /**
   * Map Prisma Budget to response DTO
   */
  private mapToResponse(
    budget: Budget & { alerts?: BudgetAlert[] },
  ): BudgetResponseDto {
    const currentSpend = Number(budget.currentSpend);
    const limitAmount = Number(budget.limitAmount);
    const usagePercentage = (currentSpend / limitAmount) * 100;
    const remainingBudget = Math.max(0, limitAmount - currentSpend);

    // Determine status
    let status: string;
    if (budget.isPaused) {
      status = 'PAUSED';
    } else if (usagePercentage >= 100) {
      status = 'EXCEEDED';
    } else if (usagePercentage >= Number(budget.criticalThreshold) * 100) {
      status = 'CRITICAL';
    } else if (usagePercentage >= Number(budget.warningThreshold) * 100) {
      status = 'WARNING';
    } else {
      status = 'OK';
    }

    return {
      id: budget.id,
      orgId: budget.orgId,
      name: budget.name,
      category: budget.category,
      limitAmount,
      currency: budget.currency,
      period: budget.period,
      warningThreshold: Number(budget.warningThreshold),
      criticalThreshold: Number(budget.criticalThreshold),
      autoPause: budget.autoPause,
      isPaused: budget.isPaused,
      currentSpend,
      usagePercentage,
      remainingBudget,
      periodStart: budget.periodStart,
      periodEnd: budget.periodEnd,
      status,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
      alerts: budget.alerts?.map((alert) => ({
        id: alert.id,
        budgetId: alert.budgetId,
        type: alert.type,
        threshold: Number(alert.threshold),
        currentSpend: Number(alert.currentSpend),
        message: alert.message,
        acknowledged: alert.acknowledged,
        createdAt: alert.createdAt,
      })),
    };
  }
}
