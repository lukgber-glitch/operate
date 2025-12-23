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
import { CreateBillHandler } from './handlers/create-bill.handler';
import { PayBillHandler } from './handlers/pay-bill.handler';
import { ListBillsHandler } from './handlers/list-bills.handler';
import { BillStatusHandler } from './handlers/bill-status.handler';
import { GetCashFlowHandler } from './handlers/get-cash-flow.handler';
import { GetRunwayHandler } from './handlers/get-runway.handler';
import { GetBurnRateHandler } from './handlers/get-burn-rate.handler';
import { GetCashForecastHandler } from './handlers/get-cash-forecast.handler';
import { HireEmployeeHandler } from './handlers/hire-employee.handler';
import { TerminateEmployeeHandler } from './handlers/terminate-employee.handler';
import { RequestLeaveHandler } from './handlers/request-leave.handler';
import { ApproveLeaveHandler } from './handlers/approve-leave.handler';
import { SearchDocumentsHandler } from './handlers/search-documents.handler';
import { ReduceExpensesHandler } from './handlers/reduce-expenses.handler';
import { TaxConsultationHandler } from './handlers/tax-consultation.handler';
import { CreateCustomerHandler } from './handlers/create-customer.handler';
import { GetBankBalanceHandler } from './handlers/get-bank-balance.handler';
import { GetBankTransactionsHandler } from './handlers/get-bank-transactions.handler';
// Quotes handlers
import { CreateQuoteHandler } from './handlers/create-quote.handler';
import { SendQuoteHandler } from './handlers/send-quote.handler';
import { GetQuoteStatusHandler } from './handlers/get-quote-status.handler';
import { ConvertQuoteToInvoiceHandler } from './handlers/convert-quote-to-invoice.handler';
// Time tracking handlers
import { StartTimerHandler } from './handlers/start-timer.handler';
import { StopTimerHandler } from './handlers/stop-timer.handler';
import { GetTimeSummaryHandler } from './handlers/get-time-summary.handler';
import { LogTimeHandler } from './handlers/log-time.handler';
// Mileage handlers
import { LogMileageHandler } from './handlers/log-mileage.handler';
import { GetMileageSummaryHandler } from './handlers/get-mileage-summary.handler';
// Contract handlers
import { CreateContractHandler } from './handlers/create-contract.handler';
import { SendContractHandler } from './handlers/send-contract.handler';
import { GetContractStatusHandler } from './handlers/get-contract-status.handler';
// Health score handlers
import { GetBusinessHealthHandler } from './handlers/get-business-health.handler';
import { GetHealthRecommendationsHandler } from './handlers/get-health-recommendations.handler';
// Project handlers
import { CreateProjectHandler } from './handlers/create-project.handler';
import { GetProjectStatusHandler } from './handlers/get-project-status.handler';
// Payment initiation handlers
import { InitiatePaymentHandler } from './handlers/initiate-payment.handler';
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
    private createBillHandler: CreateBillHandler,
    private payBillHandler: PayBillHandler,
    private listBillsHandler: ListBillsHandler,
    private billStatusHandler: BillStatusHandler,
    private getCashFlowHandler: GetCashFlowHandler,
    private getRunwayHandler: GetRunwayHandler,
    private getBurnRateHandler: GetBurnRateHandler,
    private getCashForecastHandler: GetCashForecastHandler,
    private hireEmployeeHandler: HireEmployeeHandler,
    private terminateEmployeeHandler: TerminateEmployeeHandler,
    private requestLeaveHandler: RequestLeaveHandler,
    private approveLeaveHandler: ApproveLeaveHandler,
    private searchDocumentsHandler: SearchDocumentsHandler,
    private reduceExpensesHandler: ReduceExpensesHandler,
    private taxConsultationHandler: TaxConsultationHandler,
    private createCustomerHandler: CreateCustomerHandler,
    private getBankBalanceHandler: GetBankBalanceHandler,
    private getBankTransactionsHandler: GetBankTransactionsHandler,
    // Quotes handlers
    private createQuoteHandler: CreateQuoteHandler,
    private sendQuoteHandler: SendQuoteHandler,
    private getQuoteStatusHandler: GetQuoteStatusHandler,
    private convertQuoteToInvoiceHandler: ConvertQuoteToInvoiceHandler,
    // Time tracking handlers
    private startTimerHandler: StartTimerHandler,
    private stopTimerHandler: StopTimerHandler,
    private getTimeSummaryHandler: GetTimeSummaryHandler,
    private logTimeHandler: LogTimeHandler,
    // Mileage handlers
    private logMileageHandler: LogMileageHandler,
    private getMileageSummaryHandler: GetMileageSummaryHandler,
    // Contract handlers
    private createContractHandler: CreateContractHandler,
    private sendContractHandler: SendContractHandler,
    private getContractStatusHandler: GetContractStatusHandler,
    // Health score handlers
    private getBusinessHealthHandler: GetBusinessHealthHandler,
    private getHealthRecommendationsHandler: GetHealthRecommendationsHandler,
    // Project handlers
    private createProjectHandler: CreateProjectHandler,
    private getProjectStatusHandler: GetProjectStatusHandler,
    // Payment initiation handlers
    private initiatePaymentHandler: InitiatePaymentHandler,
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
    this.handlers.set(ActionType.CREATE_BILL, this.createBillHandler);
    this.handlers.set(ActionType.PAY_BILL, this.payBillHandler);
    this.handlers.set(ActionType.LIST_BILLS, this.listBillsHandler);
    this.handlers.set(ActionType.BILL_STATUS, this.billStatusHandler);
    this.handlers.set(ActionType.GET_CASH_FLOW, this.getCashFlowHandler);
    this.handlers.set(ActionType.GET_RUNWAY, this.getRunwayHandler);
    this.handlers.set(ActionType.GET_BURN_RATE, this.getBurnRateHandler);
    this.handlers.set(ActionType.GET_CASH_FORECAST, this.getCashForecastHandler);
    this.handlers.set(ActionType.HIRE_EMPLOYEE, this.hireEmployeeHandler);
    this.handlers.set(ActionType.TERMINATE_EMPLOYEE, this.terminateEmployeeHandler);
    this.handlers.set(ActionType.REQUEST_LEAVE, this.requestLeaveHandler);
    this.handlers.set(ActionType.APPROVE_LEAVE, this.approveLeaveHandler);
    this.handlers.set(ActionType.SEARCH_DOCUMENTS, this.searchDocumentsHandler);
    this.handlers.set(ActionType.REDUCE_EXPENSES, this.reduceExpensesHandler);
    this.handlers.set(ActionType.CONSULT_TAXES, this.taxConsultationHandler);
    this.handlers.set(ActionType.CREATE_CUSTOMER, this.createCustomerHandler);
    this.handlers.set(ActionType.GET_BANK_BALANCE, this.getBankBalanceHandler);
    this.handlers.set(ActionType.GET_BANK_TRANSACTIONS, this.getBankTransactionsHandler);
    // Quotes handlers
    this.handlers.set(ActionType.CREATE_QUOTE, this.createQuoteHandler);
    this.handlers.set(ActionType.SEND_QUOTE, this.sendQuoteHandler);
    this.handlers.set(ActionType.GET_QUOTE_STATUS, this.getQuoteStatusHandler);
    this.handlers.set(ActionType.CONVERT_QUOTE_TO_INVOICE, this.convertQuoteToInvoiceHandler);
    // Time tracking handlers
    this.handlers.set(ActionType.START_TIMER, this.startTimerHandler);
    this.handlers.set(ActionType.STOP_TIMER, this.stopTimerHandler);
    this.handlers.set(ActionType.GET_TIME_SUMMARY, this.getTimeSummaryHandler);
    this.handlers.set(ActionType.LOG_TIME, this.logTimeHandler);
    // Mileage handlers
    this.handlers.set(ActionType.LOG_MILEAGE, this.logMileageHandler);
    this.handlers.set(ActionType.GET_MILEAGE_SUMMARY, this.getMileageSummaryHandler);
    // Contract handlers
    this.handlers.set(ActionType.CREATE_CONTRACT, this.createContractHandler);
    this.handlers.set(ActionType.SEND_CONTRACT, this.sendContractHandler);
    this.handlers.set(ActionType.GET_CONTRACT_STATUS, this.getContractStatusHandler);
    // Health score handlers
    this.handlers.set(ActionType.GET_BUSINESS_HEALTH, this.getBusinessHealthHandler);
    this.handlers.set(ActionType.GET_HEALTH_RECOMMENDATIONS, this.getHealthRecommendationsHandler);
    // Project handlers
    this.handlers.set(ActionType.CREATE_PROJECT, this.createProjectHandler);
    this.handlers.set(ActionType.GET_PROJECT_STATUS, this.getProjectStatusHandler);
    // Payment initiation handlers
    this.handlers.set(ActionType.INITIATE_PAYMENT, this.initiatePaymentHandler);

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
        const pending = await this.confirmation.storePendingAction(action, context);
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
    const pendingAction = await this.confirmation.confirmAction(confirmationId, userId);

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
  async cancelPendingAction(confirmationId: string, userId: string): Promise<boolean> {
    return await this.confirmation.cancelAction(confirmationId, userId);
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
      {
        type: ActionType.CREATE_BILL,
        name: 'Create Bill',
        description: 'Create a new bill (accounts payable) from a vendor',
        parameters: this.createBillHandler.getRequiredParameters(),
        requiredPermissions: ['bills:create'],
        requiresConfirmation: true,
        riskLevel: 'medium',
        examples: [
          '[ACTION:create_bill params={"vendorName":"AWS","amount":200,"currency":"EUR","description":"Cloud hosting services"}]',
          '[ACTION:create_bill params={"vendorName":"Office Depot","amount":500,"dueDate":"2024-12-31"}]',
        ],
      },
      {
        type: ActionType.PAY_BILL,
        name: 'Pay Bill',
        description: 'Record a payment for a bill',
        parameters: this.payBillHandler.getRequiredParameters(),
        requiredPermissions: ['bills:update'],
        requiresConfirmation: true,
        riskLevel: 'high',
        examples: [
          '[ACTION:pay_bill params={"billId":"bill_123","amount":200,"paymentMethod":"bank_transfer"}]',
        ],
      },
      {
        type: ActionType.LIST_BILLS,
        name: 'List Bills',
        description: 'List and filter bills by various criteria',
        parameters: this.listBillsHandler.getRequiredParameters(),
        requiredPermissions: ['bills:view'],
        requiresConfirmation: false,
        riskLevel: 'low',
        examples: [
          '[ACTION:list_bills params={"filter":"overdue","limit":10}]',
          '[ACTION:list_bills params={"filter":"due_soon","limit":5}]',
          '[ACTION:list_bills params={"vendorName":"AWS"}]',
        ],
      },
      {
        type: ActionType.BILL_STATUS,
        name: 'Bill Status',
        description: 'Check the status of a specific bill or bills from a vendor',
        parameters: this.billStatusHandler.getRequiredParameters(),
        requiredPermissions: ['bills:view'],
        requiresConfirmation: false,
        riskLevel: 'low',
        examples: [
          '[ACTION:bill_status params={"billId":"bill_123"}]',
          '[ACTION:bill_status params={"vendorName":"AWS"}]',
        ],
      },
      {
        type: ActionType.GET_CASH_FLOW,
        name: 'Get Cash Flow',
        description: 'Get current cash flow overview with burn rate and runway',
        parameters: this.getCashFlowHandler.getRequiredParameters(),
        requiredPermissions: ['reports:generate'],
        requiresConfirmation: false,
        riskLevel: 'low',
        examples: [
          '[ACTION:get_cash_flow params={}]',
          '[ACTION:get_cash_flow params={"days":60}]',
        ],
      },
      {
        type: ActionType.GET_RUNWAY,
        name: 'Get Runway',
        description: 'Get runway analysis showing how long cash will last',
        parameters: this.getRunwayHandler.getRequiredParameters(),
        requiredPermissions: ['reports:generate'],
        requiresConfirmation: false,
        riskLevel: 'low',
        examples: [
          '[ACTION:get_runway params={}]',
        ],
      },
      {
        type: ActionType.GET_BURN_RATE,
        name: 'Get Burn Rate',
        description: 'Get monthly and daily burn rate analysis',
        parameters: this.getBurnRateHandler.getRequiredParameters(),
        requiredPermissions: ['reports:generate'],
        requiresConfirmation: false,
        riskLevel: 'low',
        examples: [
          '[ACTION:get_burn_rate params={}]',
        ],
      },
      {
        type: ActionType.GET_CASH_FORECAST,
        name: 'Get Cash Forecast',
        description: 'Get detailed cash flow forecast with daily projections',
        parameters: this.getCashForecastHandler.getRequiredParameters(),
        requiredPermissions: ['reports:generate'],
        requiresConfirmation: false,
        riskLevel: 'low',
        examples: [
          '[ACTION:get_cash_forecast params={"days":30}]',
          '[ACTION:get_cash_forecast params={"days":90}]',
        ],
      },
      {
        type: ActionType.HIRE_EMPLOYEE,
        name: 'Hire Employee',
        description: 'Create a new employee record and hire them',
        parameters: this.hireEmployeeHandler.getRequiredParameters(),
        requiredPermissions: ['hr:employees:create'],
        requiresConfirmation: true,
        riskLevel: 'high',
        examples: [
          '[ACTION:hire_employee params={"firstName":"John","lastName":"Doe","email":"john.doe@example.com","position":"Software Engineer","startDate":"2024-01-15","countryCode":"DE"}]',
        ],
      },
      {
        type: ActionType.TERMINATE_EMPLOYEE,
        name: 'Terminate Employee',
        description: 'Terminate an employee and end their employment contract',
        parameters: this.terminateEmployeeHandler.getRequiredParameters(),
        requiredPermissions: ['hr:employees:terminate'],
        requiresConfirmation: true,
        riskLevel: 'high',
        examples: [
          '[ACTION:terminate_employee params={"employeeId":"emp_123","terminationDate":"2024-12-31","reason":"Resignation"}]',
          '[ACTION:terminate_employee params={"employeeName":"John Doe","terminationDate":"2024-12-31"}]',
        ],
      },
      {
        type: ActionType.REQUEST_LEAVE,
        name: 'Request Leave',
        description: 'Submit a leave request for the current user',
        parameters: this.requestLeaveHandler.getRequiredParameters(),
        requiredPermissions: ['hr:leave:request'],
        requiresConfirmation: false,
        riskLevel: 'low',
        examples: [
          '[ACTION:request_leave params={"startDate":"2024-12-20","endDate":"2024-12-24","leaveType":"VACATION","reason":"Holiday vacation"}]',
          '[ACTION:request_leave params={"startDate":"2024-11-15","endDate":"2024-11-15","leaveType":"SICK"}]',
        ],
      },
      {
        type: ActionType.APPROVE_LEAVE,
        name: 'Approve Leave',
        description: 'Approve or reject a leave request',
        parameters: this.approveLeaveHandler.getRequiredParameters(),
        requiredPermissions: ['hr:leave:approve'],
        requiresConfirmation: true,
        riskLevel: 'medium',
        examples: [
          '[ACTION:approve_leave params={"leaveRequestId":"req_123","approved":true,"comment":"Approved"}]',
          '[ACTION:approve_leave params={"leaveRequestId":"req_123","approved":false,"comment":"Not enough coverage"}]',
        ],
      },
      {
        type: ActionType.SEARCH_DOCUMENTS,
        name: 'Search Documents',
        description: 'Search for documents by name, description, type, or date range',
        parameters: this.searchDocumentsHandler.getRequiredParameters(),
        requiredPermissions: ['documents:view'],
        requiresConfirmation: false,
        riskLevel: 'low',
        examples: [
          '[ACTION:search_documents params={"query":"invoices","documentType":"INVOICE"}]',
          '[ACTION:search_documents params={"query":"contracts","dateFrom":"2024-10-01"}]',
          '[ACTION:search_documents params={"query":"Q3","documentType":"REPORT"}]',
          '[ACTION:search_documents params={"query":"Acme Corp"}]',
        ],
      },
      {
        type: ActionType.CREATE_CUSTOMER,
        name: 'Create Customer',
        description: 'Create a new customer or client record',
        parameters: this.createCustomerHandler.getRequiredParameters(),
        requiredPermissions: ['customers:create'],
        requiresConfirmation: false,
        riskLevel: 'low',
        examples: [
          '[ACTION:create_customer params={"name":"Acme Corporation","email":"contact@acme.com"}]',
          '[ACTION:create_customer params={"name":"John Smith","phone":"+49 30 12345678","email":"john@example.com"}]',
          '[ACTION:create_customer params={"name":"Tech Solutions GmbH","vatId":"DE123456789","address":"Berlin, Germany"}]',
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
