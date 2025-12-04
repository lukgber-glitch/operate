/**
 * Action Executor Service
 * Orchestrates action execution from AI assistant
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActionParserService } from './action-parser.service';
import { ConfirmationService } from './confirmation.service';
import {
  ActionIntent,
  ActionResult,
  ActionContext,
  ActionDefinition,
  ValidationResult,
  ActionExecutionOptions,
  ActionType,
} from './action.types';
import { BaseActionHandler } from './handlers/base.handler';
import { CreateInvoiceHandler } from './handlers/create-invoice.handler';
import { CreateExpenseHandler } from './handlers/create-expense.handler';
import { GenerateReportHandler } from './handlers/generate-report.handler';
import { SendReminderHandler } from './handlers/send-reminder.handler';
import { UpdateStatusHandler } from './handlers/update-status.handler';
import { ActionStatus } from '@prisma/client';

@Injectable()
export class ActionExecutorService {
  private readonly logger = new Logger(ActionExecutorService.name);
  private handlers: Map<ActionType, BaseActionHandler> = new Map();

  // Rate limiting (actions per hour)
  private readonly RATE_LIMIT_PER_HOUR = 10;
  private readonly RATE_LIMIT_PER_DAY = 50;

  constructor(
    private prisma: PrismaService,
    private parser: ActionParserService,
    private confirmation: ConfirmationService,
    // Handlers
    private createInvoiceHandler: CreateInvoiceHandler,
    private createExpenseHandler: CreateExpenseHandler,
    private generateReportHandler: GenerateReportHandler,
    private sendReminderHandler: SendReminderHandler,
    private updateStatusHandler: UpdateStatusHandler,
  ) {
    this.registerHandlers();
  }

  /**
   * Register all action handlers
   */
  private registerHandlers(): void {
    this.handlers.set(ActionType.CREATE_INVOICE, this.createInvoiceHandler);
    this.handlers.set(ActionType.CREATE_EXPENSE, this.createExpenseHandler);
    this.handlers.set(ActionType.GENERATE_REPORT, this.generateReportHandler);
    this.handlers.set(ActionType.SEND_REMINDER, this.sendReminderHandler);
    this.handlers.set(ActionType.UPDATE_STATUS, this.updateStatusHandler);

    this.logger.log(`Registered ${this.handlers.size} action handlers`);
  }

  /**
   * Parse AI response for action intents
   */
  parseActionIntent(aiResponse: string): ActionIntent | null {
    return this.parser.parseActionIntent(aiResponse);
  }

  /**
   * Parse multiple action intents
   */
  parseMultipleActions(aiResponse: string): ActionIntent[] {
    return this.parser.parseMultipleActions(aiResponse);
  }

  /**
   * Execute an action
   */
  async executeAction(
    action: ActionIntent,
    context: ActionContext,
    messageId: string,
    options: ActionExecutionOptions = {},
  ): Promise<ActionResult> {
    try {
      // Check rate limits
      if (!options.dryRun) {
        const rateLimitOk = await this.checkRateLimit(
          context.userId,
          context.organizationId,
        );
        if (!rateLimitOk) {
          return {
            success: false,
            message: 'Rate limit exceeded. Please try again later.',
            error: 'RATE_LIMIT_EXCEEDED',
          };
        }
      }

      // Get handler for action type
      const handler = this.handlers.get(action.type);
      if (!handler) {
        return {
          success: false,
          message: `No handler found for action type: ${action.type}`,
          error: 'HANDLER_NOT_FOUND',
        };
      }

      // Validate action
      const validation = handler.validate(action.parameters, context);
      if (!validation.valid) {
        return {
          success: false,
          message: 'Action validation failed',
          error: validation.errors.join('; '),
        };
      }

      // Check if confirmation required
      if (action.confirmationRequired && !options.skipConfirmation) {
        const pending = this.confirmation.storePendingAction(action, context);
        return {
          success: false,
          message: `Action requires confirmation. Please confirm action ID: ${pending.id}`,
          data: { confirmationId: pending.id, requiresConfirmation: true },
        };
      }

      // Create action log entry
      const actionLog = await this.prisma.messageActionLog.create({
        data: {
          messageId,
          actionType: action.type,
          status: ActionStatus.EXECUTING,
        },
      });

      // Execute action
      let result: ActionResult;
      try {
        if (options.dryRun) {
          result = {
            success: true,
            message: 'Dry run completed successfully',
            data: { dryRun: true },
          };
        } else {
          result = await handler.execute(action.parameters, context);
        }

        // Update action log
        await this.prisma.messageActionLog.update({
          where: { id: actionLog.id },
          data: {
            status: result.success
              ? ActionStatus.COMPLETED
              : ActionStatus.FAILED,
            entityType: result.entityType,
            entityId: result.entityId,
            result: result.data || {},
            error: result.error,
            completedAt: new Date(),
          },
        });

        this.logger.log(
          `Action ${action.type} executed ${result.success ? 'successfully' : 'with error'}`,
        );

        return result;
      } catch (error) {
        // Update action log with error
        await this.prisma.messageActionLog.update({
          where: { id: actionLog.id },
          data: {
            status: ActionStatus.FAILED,
            error: error.message || 'Unknown error',
            completedAt: new Date(),
          },
        });

        throw error;
      }
    } catch (error) {
      this.logger.error('Failed to execute action:', error);
      return {
        success: false,
        message: 'Failed to execute action',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Confirm and execute a pending action
   */
  async confirmAndExecute(
    confirmationId: string,
    userId: string,
    messageId: string,
  ): Promise<ActionResult> {
    const pendingAction = this.confirmation.confirmAction(confirmationId, userId);

    if (!pendingAction) {
      return {
        success: false,
        message: 'Confirmation not found or expired',
        error: 'CONFIRMATION_NOT_FOUND',
      };
    }

    // Execute with confirmation skipped
    return this.executeAction(
      pendingAction.action,
      pendingAction.context,
      messageId,
      { skipConfirmation: true },
    );
  }

  /**
   * Cancel a pending action
   */
  cancelPendingAction(confirmationId: string, userId: string): boolean {
    return this.confirmation.cancelAction(confirmationId, userId);
  }

  /**
   * Validate action
   */
  validateAction(
    action: ActionIntent,
    context: ActionContext,
  ): ValidationResult {
    const handler = this.handlers.get(action.type);

    if (!handler) {
      return {
        valid: false,
        errors: [`No handler found for action type: ${action.type}`],
      };
    }

    return handler.validate(action.parameters, context);
  }

  /**
   * Get available actions for context
   */
  getAvailableActions(context: ActionContext): ActionDefinition[] {
    const definitions: ActionDefinition[] = [];

    // Define all available actions
    const allActions: ActionDefinition[] = [
      {
        type: ActionType.CREATE_INVOICE,
        name: 'Create Invoice',
        description: 'Create a new invoice for a customer',
        parameters: this.createInvoiceHandler.getRequiredParameters(),
        requiredPermissions: ['invoices:create'],
        requiresConfirmation: true,
        riskLevel: 'medium',
        examples: [
          '[ACTION:create_invoice params={"customerName":"Contoso Ltd","amount":500,"currency":"EUR","description":"Consulting services"}]',
        ],
      },
      {
        type: ActionType.CREATE_EXPENSE,
        name: 'Create Expense',
        description: 'Record a new business expense',
        parameters: this.createExpenseHandler.getRequiredParameters(),
        requiredPermissions: ['expenses:create'],
        requiresConfirmation: false,
        riskLevel: 'low',
        examples: [
          '[ACTION:create_expense params={"description":"Office supplies","amount":150,"category":"supplies","currency":"EUR"}]',
        ],
      },
      {
        type: ActionType.SEND_REMINDER,
        name: 'Send Payment Reminder',
        description: 'Send a payment reminder for an overdue invoice',
        parameters: this.sendReminderHandler.getRequiredParameters(),
        requiredPermissions: ['invoices:send'],
        requiresConfirmation: true,
        riskLevel: 'medium',
        examples: [
          '[ACTION:send_reminder params={"invoiceId":"inv_123","reminderType":"gentle"}]',
        ],
      },
      {
        type: ActionType.GENERATE_REPORT,
        name: 'Generate Report',
        description: 'Generate financial or tax reports',
        parameters: this.generateReportHandler.getRequiredParameters(),
        requiredPermissions: ['reports:generate'],
        requiresConfirmation: false,
        riskLevel: 'low',
        examples: [
          '[ACTION:generate_report params={"reportType":"income","fromDate":"2024-01-01","toDate":"2024-12-31","format":"pdf"}]',
        ],
      },
      {
        type: ActionType.UPDATE_STATUS,
        name: 'Update Status',
        description: 'Update the status of invoices, expenses, or tasks',
        parameters: this.updateStatusHandler.getRequiredParameters(),
        requiredPermissions: ['invoices:update', 'expenses:update'],
        requiresConfirmation: false,
        riskLevel: 'low',
        examples: [
          '[ACTION:update_status params={"entityType":"expense","entityId":"exp_123","status":"approved"}]',
        ],
      },
    ];

    // Filter by permissions
    for (const action of allActions) {
      const hasPermission = action.requiredPermissions.some((perm) =>
        context.permissions.includes(perm),
      );

      if (hasPermission) {
        definitions.push(action);
      }
    }

    return definitions;
  }

  /**
   * Check rate limits
   */
  private async checkRateLimit(
    userId: string,
    orgId: string,
  ): Promise<boolean> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count actions in last hour
    const actionsLastHour = await this.prisma.messageActionLog.count({
      where: {
        message: {
          conversation: {
            userId,
            orgId,
          },
        },
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (actionsLastHour >= this.RATE_LIMIT_PER_HOUR) {
      this.logger.warn(
        `Rate limit exceeded (hourly) for user ${userId}: ${actionsLastHour} actions`,
      );
      return false;
    }

    // Count actions in last day
    const actionsLastDay = await this.prisma.messageActionLog.count({
      where: {
        message: {
          conversation: {
            userId,
            orgId,
          },
        },
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    if (actionsLastDay >= this.RATE_LIMIT_PER_DAY) {
      this.logger.warn(
        `Rate limit exceeded (daily) for user ${userId}: ${actionsLastDay} actions`,
      );
      return false;
    }

    return true;
  }

  /**
   * Get action execution statistics
   */
  async getStatistics(
    userId: string,
    orgId: string,
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    byType: Record<string, number>;
  }> {
    const logs = await this.prisma.messageActionLog.findMany({
      where: {
        message: {
          conversation: {
            userId,
            orgId,
          },
        },
      },
    });

    const stats = {
      total: logs.length,
      successful: logs.filter((log) => log.status === ActionStatus.COMPLETED)
        .length,
      failed: logs.filter((log) => log.status === ActionStatus.FAILED).length,
      byType: {} as Record<string, number>,
    };

    for (const log of logs) {
      stats.byType[log.actionType] = (stats.byType[log.actionType] || 0) + 1;
    }

    return stats;
  }
}
