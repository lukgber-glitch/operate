import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateAutopilotConfigDto } from './dto/update-config.dto';
import { ActionQueryDto } from './dto/action-query.dto';
import {
  AutopilotConfig,
  AutopilotAction,
  AutopilotSummary,
  AutopilotActionType,
  AutopilotActionStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Time estimates for each action type (in minutes)
const TIME_ESTIMATES = {
  CATEGORIZE_TRANSACTION: 1,
  CREATE_INVOICE: 5,
  SEND_REMINDER: 2,
  RECONCILE_TRANSACTION: 3,
  EXTRACT_RECEIPT: 4,
  PAY_BILL: 3,
  FILE_EXPENSE: 2,
  CREATE_CLIENT: 4,
  MATCH_PAYMENT: 2,
};

@Injectable()
export class AutopilotService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // CONFIGURATION METHODS
  // ============================================================================

  async getConfig(organisationId: string): Promise<AutopilotConfig> {
    let config = await this.prisma.autopilotConfig.findUnique({
      where: { organisationId },
    });

    // Create default config if it doesn't exist
    if (!config) {
      config = await this.prisma.autopilotConfig.create({
        data: {
          organisationId,
          enabled: false,
        },
      });
    }

    return config;
  }

  async updateConfig(
    organisationId: string,
    dto: UpdateAutopilotConfigDto,
  ): Promise<AutopilotConfig> {
    // Ensure config exists first
    await this.getConfig(organisationId);

    return this.prisma.autopilotConfig.update({
      where: { organisationId },
      data: {
        ...dto,
        maxAutoAmount: dto.maxAutoAmount ? new Decimal(dto.maxAutoAmount) : undefined,
      },
    });
  }

  async enableAutopilot(organisationId: string): Promise<AutopilotConfig> {
    return this.updateConfig(organisationId, { enabled: true });
  }

  async disableAutopilot(organisationId: string): Promise<AutopilotConfig> {
    return this.updateConfig(organisationId, { enabled: false });
  }

  // ============================================================================
  // ACTION PROCESSING METHODS
  // ============================================================================

  async processQueue(organisationId: string): Promise<void> {
    const config = await this.getConfig(organisationId);

    if (!config.enabled) {
      return;
    }

    // Get all approved actions that haven't been executed
    const actions = await this.prisma.autopilotAction.findMany({
      where: {
        organisationId,
        status: AutopilotActionStatus.APPROVED,
        executedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Execute each action
    for (const action of actions) {
      try {
        await this.executeAction(action.id);
      } catch (error) {
        console.error(`Failed to execute action ${action.id}:`, error);
      }
    }
  }

  async executeAction(actionId: string): Promise<AutopilotAction> {
    const action = await this.prisma.autopilotAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (action.status !== AutopilotActionStatus.APPROVED) {
      throw new BadRequestException('Action must be approved before execution');
    }

    try {
      // TODO: Implement actual execution logic based on action type
      // This will integrate with other services (invoices, transactions, etc.)

      await this.prisma.autopilotAction.update({
        where: { id: actionId },
        data: {
          status: AutopilotActionStatus.EXECUTED,
          executedAt: new Date(),
        },
      });

      return await this.prisma.autopilotAction.findUnique({
        where: { id: actionId },
      });
    } catch (error) {
      await this.prisma.autopilotAction.update({
        where: { id: actionId },
        data: {
          status: AutopilotActionStatus.FAILED,
          error: error.message,
        },
      });

      throw error;
    }
  }

  async approveAction(actionId: string, userId: string): Promise<AutopilotAction> {
    const action = await this.prisma.autopilotAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (action.status !== AutopilotActionStatus.PENDING) {
      throw new BadRequestException('Only pending actions can be approved');
    }

    return this.prisma.autopilotAction.update({
      where: { id: actionId },
      data: {
        status: AutopilotActionStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });
  }

  async rejectAction(
    actionId: string,
    userId: string,
    reason: string,
  ): Promise<AutopilotAction> {
    const action = await this.prisma.autopilotAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (action.status !== AutopilotActionStatus.PENDING) {
      throw new BadRequestException('Only pending actions can be rejected');
    }

    return this.prisma.autopilotAction.update({
      where: { id: actionId },
      data: {
        status: AutopilotActionStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedReason: reason,
      },
    });
  }

  // ============================================================================
  // AUTO-DETECTION METHODS
  // ============================================================================

  async detectCategorizableTransactions(organisationId: string): Promise<void> {
    const config = await this.getConfig(organisationId);

    if (!config.enabled || !config.autoCategorizeTx) {
      return;
    }

    // TODO: Find uncategorized bank transactions
    // TODO: Use AI classification service
    // TODO: Create CATEGORIZE_TRANSACTION actions
  }

  async detectInvoiceOpportunities(organisationId: string): Promise<void> {
    const config = await this.getConfig(organisationId);

    if (!config.enabled || !config.autoCreateInvoices) {
      return;
    }

    // TODO: Find completed work without invoices
    // TODO: Create CREATE_INVOICE actions
  }

  async detectOverdueInvoices(organisationId: string): Promise<void> {
    const config = await this.getConfig(organisationId);

    if (!config.enabled || !config.autoSendReminders) {
      return;
    }

    // TODO: Find overdue invoices
    // TODO: Create SEND_REMINDER actions
  }

  async detectReconciliationMatches(organisationId: string): Promise<void> {
    const config = await this.getConfig(organisationId);

    if (!config.enabled || !config.autoReconcile) {
      return;
    }

    // TODO: Find bank transactions that match invoices/expenses
    // TODO: Create RECONCILE_TRANSACTION actions
  }

  async detectUnprocessedReceipts(organisationId: string): Promise<void> {
    const config = await this.getConfig(organisationId);

    if (!config.enabled || !config.autoExtractReceipts) {
      return;
    }

    // TODO: Find emails/uploads with receipts
    // TODO: Create EXTRACT_RECEIPT actions
  }

  async detectPayableBills(organisationId: string): Promise<void> {
    const config = await this.getConfig(organisationId);

    if (!config.enabled || !config.autoPayBills) {
      return;
    }

    // TODO: Find bills due soon
    // TODO: Create PAY_BILL actions (if under threshold)
  }

  // ============================================================================
  // ACTION LISTING & QUERYING
  // ============================================================================

  async listActions(organisationId: string, query: ActionQueryDto) {
    const { type, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { organisationId };
    if (type) where.type = type;
    if (status) where.status = status;

    const [actions, total] = await Promise.all([
      this.prisma.autopilotAction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.autopilotAction.count({ where }),
    ]);

    return {
      data: actions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingActions(organisationId: string) {
    return this.prisma.autopilotAction.findMany({
      where: {
        organisationId,
        status: AutopilotActionStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================================
  // SUMMARY METHODS
  // ============================================================================

  async generateDailySummary(
    organisationId: string,
    date: Date,
  ): Promise<AutopilotSummary> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all actions for the day
    const actions = await this.prisma.autopilotAction.findMany({
      where: {
        organisationId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Calculate stats
    const actionsCompleted = actions.filter(
      (a) => a.status === AutopilotActionStatus.EXECUTED,
    ).length;
    const actionsPending = actions.filter(
      (a) => a.status === AutopilotActionStatus.PENDING,
    ).length;
    const actionsRejected = actions.filter(
      (a) => a.status === AutopilotActionStatus.REJECTED,
    ).length;

    const transactionsCategorized = actions.filter(
      (a) =>
        a.type === AutopilotActionType.CATEGORIZE_TRANSACTION &&
        a.status === AutopilotActionStatus.EXECUTED,
    ).length;
    const receiptsProcessed = actions.filter(
      (a) =>
        a.type === AutopilotActionType.EXTRACT_RECEIPT &&
        a.status === AutopilotActionStatus.EXECUTED,
    ).length;
    const invoicesCreated = actions.filter(
      (a) =>
        a.type === AutopilotActionType.CREATE_INVOICE &&
        a.status === AutopilotActionStatus.EXECUTED,
    ).length;
    const remindersSent = actions.filter(
      (a) =>
        a.type === AutopilotActionType.SEND_REMINDER &&
        a.status === AutopilotActionStatus.EXECUTED,
    ).length;
    const reconciliationsCompleted = actions.filter(
      (a) =>
        a.type === AutopilotActionType.RECONCILE_TRANSACTION &&
        a.status === AutopilotActionStatus.EXECUTED,
    ).length;

    // Calculate time saved
    const timeSavedMinutes = actions
      .filter((a) => a.status === AutopilotActionStatus.EXECUTED)
      .reduce((total, action) => total + TIME_ESTIMATES[action.type], 0);

    // TODO: Generate AI summary of the day's activities

    // Upsert summary
    return this.prisma.autopilotSummary.upsert({
      where: {
        organisationId_date: {
          organisationId,
          date: startOfDay,
        },
      },
      create: {
        organisationId,
        date: startOfDay,
        actionsCompleted,
        actionsPending,
        actionsRejected,
        transactionsCategorized,
        receiptsProcessed,
        invoicesCreated,
        remindersSent,
        reconciliationsCompleted,
        timeSavedMinutes,
      },
      update: {
        actionsCompleted,
        actionsPending,
        actionsRejected,
        transactionsCategorized,
        receiptsProcessed,
        invoicesCreated,
        remindersSent,
        reconciliationsCompleted,
        timeSavedMinutes,
      },
    });
  }

  async getDailySummary(
    organisationId: string,
    date: Date,
  ): Promise<AutopilotSummary | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.autopilotSummary.findUnique({
      where: {
        organisationId_date: {
          organisationId,
          date: startOfDay,
        },
      },
    });
  }

  async getWeeklySummary(organisationId: string) {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const summaries = await this.prisma.autopilotSummary.findMany({
      where: {
        organisationId,
        date: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { date: 'desc' },
    });

    // Aggregate weekly stats
    const totalActionsCompleted = summaries.reduce(
      (sum, s) => sum + s.actionsCompleted,
      0,
    );
    const totalActionsPending = summaries.reduce((sum, s) => sum + s.actionsPending, 0);
    const totalActionsRejected = summaries.reduce(
      (sum, s) => sum + s.actionsRejected,
      0,
    );
    const totalTimeSavedMinutes = summaries.reduce(
      (sum, s) => sum + s.timeSavedMinutes,
      0,
    );

    return {
      summaries,
      weeklyStats: {
        totalActionsCompleted,
        totalActionsPending,
        totalActionsRejected,
        totalTimeSavedMinutes,
        totalTimeSavedHours: Math.round(totalTimeSavedMinutes / 60),
      },
    };
  }

  // ============================================================================
  // STATS METHODS
  // ============================================================================

  async getStats(organisationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [config, todayActions, pendingActions, todaySummary] = await Promise.all([
      this.getConfig(organisationId),
      this.prisma.autopilotAction.count({
        where: {
          organisationId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      this.prisma.autopilotAction.count({
        where: {
          organisationId,
          status: AutopilotActionStatus.PENDING,
        },
      }),
      this.getDailySummary(organisationId, today),
    ]);

    return {
      enabled: config.enabled,
      actionsToday: todayActions,
      pendingApproval: pendingActions,
      timeSavedToday: todaySummary?.timeSavedMinutes || 0,
      summary: todaySummary,
    };
  }
}
