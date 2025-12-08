import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SuggestionType, SuggestionPriority } from './dto/suggestions.dto';

interface ContextAnalysis {
  contextType: string;
  pendingActions: PendingAction[];
  userPatterns: UserPattern[];
  suggestions: SuggestionTemplate[];
}

interface PendingAction {
  type: string;
  count: number;
  priority: SuggestionPriority;
  data: any;
}

interface UserPattern {
  action: string;
  frequency: number;
  lastOccurrence: Date;
}

interface SuggestionTemplate {
  type: SuggestionType;
  priority: SuggestionPriority;
  title: string;
  description: string;
  actionLabel: string;
  actionType: string;
  actionParams: Record<string, any>;
  entityType?: string;
  entityId?: string;
  data?: Record<string, any>;
}

@Injectable()
export class ContextAnalyzerService {
  private readonly logger = new Logger(ContextAnalyzerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analyze page context and generate suggestions
   */
  async analyzeContext(
    page: string,
    orgId: string,
    userId: string,
    filters?: Record<string, any>,
    selectedItems?: string[],
  ): Promise<ContextAnalysis> {
    this.logger.debug(`Analyzing context for page: ${page}`);

    const contextType = this.parseContextType(page);

    // Run parallel analysis
    const [pendingActions, userPatterns] = await Promise.all([
      this.findPendingActions(contextType, orgId, filters),
      this.analyzeUserPatterns(userId, contextType),
    ]);

    // Generate suggestions based on analysis
    const suggestions = await this.generateSuggestions(
      contextType,
      pendingActions,
      userPatterns,
      orgId,
      selectedItems,
    );

    return {
      contextType,
      pendingActions,
      userPatterns,
      suggestions,
    };
  }

  /**
   * Parse page path to context type
   */
  private parseContextType(page: string): string {
    const segments = page.split('/').filter(Boolean);

    if (segments.length === 0) return 'dashboard';
    if (segments.length === 1) return segments[0];

    // finance/invoices -> finance.invoices
    return segments.slice(0, 2).join('.');
  }

  /**
   * Find pending actions for the context
   */
  private async findPendingActions(
    contextType: string,
    orgId: string,
    filters?: Record<string, any>,
  ): Promise<PendingAction[]> {
    const actions: PendingAction[] = [];

    switch (contextType) {
      case 'finance.invoices':
        actions.push(...await this.findInvoiceActions(orgId, filters));
        break;
      case 'finance.expenses':
        actions.push(...await this.findExpenseActions(orgId, filters));
        break;
      case 'hr.employees':
        actions.push(...await this.findHRActions(orgId, filters));
        break;
      case 'tax.vat':
        actions.push(...await this.findTaxActions(orgId, filters));
        break;
      case 'dashboard':
        actions.push(...await this.findDashboardActions(orgId));
        break;
    }

    return actions;
  }

  /**
   * Find invoice-related pending actions
   */
  private async findInvoiceActions(
    orgId: string,
    filters?: Record<string, any>,
  ): Promise<PendingAction[]> {
    const actions: PendingAction[] = [];

    // Overdue invoices
    const overdueCount = await this.prisma.invoice.count({
      where: {
        orgId,
        status: 'SENT',
        dueDate: { lt: new Date() },
      },
    });

    if (overdueCount > 0) {
      actions.push({
        type: 'overdue_invoices',
        count: overdueCount,
        priority: SuggestionPriority.HIGH,
        data: { overdueCount },
      });
    }

    // Draft invoices
    const draftCount = await this.prisma.invoice.count({
      where: { orgId, status: 'DRAFT' },
    });

    if (draftCount > 0) {
      actions.push({
        type: 'draft_invoices',
        count: draftCount,
        priority: SuggestionPriority.MEDIUM,
        data: { draftCount },
      });
    }

    return actions;
  }

  /**
   * Find expense-related pending actions
   */
  private async findExpenseActions(
    orgId: string,
    filters?: Record<string, any>,
  ): Promise<PendingAction[]> {
    const actions: PendingAction[] = [];

    // Uncategorized expenses
    const uncategorizedCount = await this.prisma.expense.count({
      where: {
        orgId,
        category: null as Prisma.InputJsonValue, // ExpenseCategory enum doesn't accept null in Prisma types
      },
    });

    if (uncategorizedCount > 0) {
      actions.push({
        type: 'uncategorized_expenses',
        count: uncategorizedCount,
        priority: SuggestionPriority.MEDIUM,
        data: { uncategorizedCount },
      });
    }

    // Missing receipts
    const missingReceiptsCount = await this.prisma.expense.count({
      where: {
        orgId,
        receiptUrl: null,
        amount: { gt: 150 }, // €150+ requires receipt
      },
    });

    if (missingReceiptsCount > 0) {
      actions.push({
        type: 'missing_receipts',
        count: missingReceiptsCount,
        priority: SuggestionPriority.HIGH,
        data: { missingReceiptsCount },
      });
    }

    return actions;
  }

  /**
   * Find HR-related pending actions
   */
  private async findHRActions(
    orgId: string,
    filters?: Record<string, any>,
  ): Promise<PendingAction[]> {
    const actions: PendingAction[] = [];

    // Pending leave requests
    const pendingLeaveCount = await this.prisma.leaveRequest.count({
      where: {
        employee: { orgId },
        status: 'PENDING',
      },
    });

    if (pendingLeaveCount > 0) {
      actions.push({
        type: 'pending_leave_requests',
        count: pendingLeaveCount,
        priority: SuggestionPriority.MEDIUM,
        data: { pendingLeaveCount },
      });
    }

    return actions;
  }

  /**
   * Find tax-related pending actions
   */
  private async findTaxActions(
    orgId: string,
    filters?: Record<string, any>,
  ): Promise<PendingAction[]> {
    const actions: PendingAction[] = [];

    // Check upcoming VAT deadline (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Note: taxReturn model doesn't exist yet - this is a placeholder
    const upcomingDeadlines = 0; // TODO: Replace when taxReturn model is added
    /* const upcomingDeadlines = await this.prisma.taxReturn.count({
      where: {
        orgId,
        dueDate: { lte: nextWeek, gte: new Date() },
        status: 'DRAFT',
      },
    }); */

    if (upcomingDeadlines > 0) {
      actions.push({
        type: 'vat_deadline_approaching',
        count: upcomingDeadlines,
        priority: SuggestionPriority.URGENT,
        data: { upcomingDeadlines },
      });
    }

    return actions;
  }

  /**
   * Find dashboard-level actions
   */
  private async findDashboardActions(orgId: string): Promise<PendingAction[]> {
    const actions: PendingAction[] = [];

    // Unread notifications
    const unreadCount = await this.prisma.notification.count({
      where: { orgId, status: 'UNREAD' }, // Use 'status' field instead of 'read'
    });

    if (unreadCount > 0) {
      actions.push({
        type: 'unread_notifications',
        count: unreadCount,
        priority: SuggestionPriority.LOW,
        data: { unreadCount },
      });
    }

    return actions;
  }

  /**
   * Analyze user behavior patterns
   */
  private async analyzeUserPatterns(
    userId: string,
    contextType: string,
  ): Promise<UserPattern[]> {
    // This is a placeholder for ML-based pattern analysis
    // In production, this would analyze ChatMessage history, UserActivity logs, etc.
    return [];
  }

  /**
   * Generate suggestions from analysis
   */
  private async generateSuggestions(
    contextType: string,
    pendingActions: PendingAction[],
    userPatterns: UserPattern[],
    orgId: string,
    selectedItems?: string[],
  ): Promise<SuggestionTemplate[]> {
    const suggestions: SuggestionTemplate[] = [];

    for (const action of pendingActions) {
      const template = this.createSuggestionTemplate(action, contextType);
      if (template) {
        suggestions.push(template);
      }
    }

    // Sort by priority (URGENT -> HIGH -> MEDIUM -> LOW)
    const priorityOrder = {
      [SuggestionPriority.URGENT]: 0,
      [SuggestionPriority.HIGH]: 1,
      [SuggestionPriority.MEDIUM]: 2,
      [SuggestionPriority.LOW]: 3,
    };

    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return suggestions;
  }

  /**
   * Create suggestion template from pending action
   */
  private createSuggestionTemplate(
    action: PendingAction,
    contextType: string,
  ): SuggestionTemplate | null {
    switch (action.type) {
      case 'overdue_invoices':
        return {
          type: SuggestionType.INVOICE_REMINDER,
          priority: action.priority,
          title: `${action.count} Overdue Invoice${action.count > 1 ? 's' : ''}`,
          description: `You have ${action.count} invoice${action.count > 1 ? 's' : ''} past their due date. Send reminders to clients.`,
          actionLabel: 'Send Reminders',
          actionType: 'navigate',
          actionParams: { path: '/finance/invoices', filter: 'overdue' },
          entityType: 'invoice',
        };

      case 'draft_invoices':
        return {
          type: SuggestionType.OPTIMIZATION,
          priority: action.priority,
          title: `${action.count} Draft Invoice${action.count > 1 ? 's' : ''}`,
          description: `Complete and send ${action.count} draft invoice${action.count > 1 ? 's' : ''} to improve cash flow.`,
          actionLabel: 'Review Drafts',
          actionType: 'navigate',
          actionParams: { path: '/finance/invoices', filter: 'draft' },
          entityType: 'invoice',
        };

      case 'uncategorized_expenses':
        return {
          type: SuggestionType.EXPENSE_ANOMALY,
          priority: action.priority,
          title: `${action.count} Uncategorized Expense${action.count > 1 ? 's' : ''}`,
          description: `Categorize ${action.count} expense${action.count > 1 ? 's' : ''} for accurate tax reporting.`,
          actionLabel: 'Categorize Now',
          actionType: 'navigate',
          actionParams: { path: '/finance/expenses', filter: 'uncategorized' },
          entityType: 'expense',
        };

      case 'missing_receipts':
        return {
          type: SuggestionType.COMPLIANCE,
          priority: action.priority,
          title: `${action.count} Missing Receipt${action.count > 1 ? 's' : ''}`,
          description: `Upload receipts for ${action.count} expense${action.count > 1 ? 's' : ''} over €150 to remain compliant.`,
          actionLabel: 'Upload Receipts',
          actionType: 'navigate',
          actionParams: { path: '/finance/expenses', filter: 'missing_receipts' },
          entityType: 'expense',
        };

      case 'pending_leave_requests':
        return {
          type: SuggestionType.CLIENT_FOLLOWUP,
          priority: action.priority,
          title: `${action.count} Pending Leave Request${action.count > 1 ? 's' : ''}`,
          description: `Review and approve/reject ${action.count} leave request${action.count > 1 ? 's' : ''}.`,
          actionLabel: 'Review Requests',
          actionType: 'navigate',
          actionParams: { path: '/hr/leave-requests', filter: 'pending' },
          entityType: 'leave_request',
        };

      case 'vat_deadline_approaching':
        return {
          type: SuggestionType.TAX_DEADLINE,
          priority: action.priority,
          title: 'VAT Return Due Soon',
          description: `You have ${action.count} VAT return${action.count > 1 ? 's' : ''} due within 7 days. Complete and file now.`,
          actionLabel: 'File VAT Return',
          actionType: 'navigate',
          actionParams: { path: '/tax/vat' },
          entityType: 'tax_return',
        };

      case 'unread_notifications':
        return {
          type: SuggestionType.INSIGHT,
          priority: action.priority,
          title: `${action.count} Unread Notification${action.count > 1 ? 's' : ''}`,
          description: `Review ${action.count} new notification${action.count > 1 ? 's' : ''}.`,
          actionLabel: 'View Notifications',
          actionType: 'navigate',
          actionParams: { path: '/notifications' },
        };

      default:
        return null;
    }
  }
}
