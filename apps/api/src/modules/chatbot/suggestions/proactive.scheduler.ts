/**
 * Proactive Suggestions Scheduler
 * Daily scheduler that generates proactive suggestions for all active organizations
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { ProactiveSuggestionsService } from './proactive-suggestions.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { TaxCalendarService } from '../../tax/calendar/tax-calendar.service';
import { VatService } from '../../tax/vat/vat.service';
import { SuggestionContext, TaxSuggestion, CashFlowSuggestion } from './suggestion.types';
import { Prisma, SuggestionType, SuggestionPriority } from '@prisma/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CashFlowPredictorService } from '../../ai/bank-intelligence/cash-flow-predictor.service';

@Injectable()
export class ProactiveScheduler {
  private readonly logger = new Logger(ProactiveScheduler.name);
  private readonly BATCH_SIZE = 10; // Process 10 organizations at a time
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly proactiveSuggestionsService: ProactiveSuggestionsService,
    private readonly notificationsService: NotificationsService,
    private readonly taxCalendarService: TaxCalendarService,
    private readonly vatService: VatService,
    private readonly cashFlowPredictor: CashFlowPredictorService,
  ) {}

  /**
   * Daily proactive suggestions generation
   * Runs at 8:00 AM Europe/Berlin timezone
   */
  @Cron('0 8 * * *', {
    timeZone: 'Europe/Berlin',
  })
  async generateDailySuggestions(): Promise<void> {
    // Prevent overlapping runs
    if (this.isRunning) {
      this.logger.warn('Previous run still in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    this.logger.log('Starting daily proactive suggestions generation...');

    try {
      // Get all active organizations
      const organizations = await this.getActiveOrganizations();

      this.logger.log(
        `Found ${organizations.length} active organizations to process`,
      );

      // Process in batches
      let totalSuggestions = 0;
      let totalNotifications = 0;

      for (let i = 0; i < organizations.length; i += this.BATCH_SIZE) {
        const batch = organizations.slice(i, i + this.BATCH_SIZE);

        this.logger.debug(
          `Processing batch ${Math.floor(i / this.BATCH_SIZE) + 1}/${Math.ceil(organizations.length / this.BATCH_SIZE)}`,
        );

        const results = await Promise.all(
          batch.map(org => this.processOrganization(org)),
        );

        // Sum up results
        results.forEach(result => {
          totalSuggestions += result.suggestionsCreated;
          totalNotifications += result.notificationsSent;
        });

        // Small delay between batches to avoid overwhelming the system
        if (i + this.BATCH_SIZE < organizations.length) {
          await this.sleep(1000);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `✓ Daily suggestions completed in ${duration}ms - ` +
        `Created ${totalSuggestions} suggestions, sent ${totalNotifications} notifications`,
      );
    } catch (error) {
      this.logger.error('Error in daily suggestions generation:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a single organization
   */
  private async processOrganization(org: {
    id: string;
    name: string;
    timezone: string;
  }): Promise<{ suggestionsCreated: number; notificationsSent: number }> {
    this.logger.debug(`Processing organization: ${org.name} (${org.id})`);

    try {
      const context: SuggestionContext = {
        orgId: org.id,
      };

      // Generate all types of suggestions
      const [suggestions, insights, reminders, optimizations, taxReminders, cashFlowAlerts] = await Promise.all([
        this.proactiveSuggestionsService.getPageSuggestions('dashboard', undefined, org.id),
        this.proactiveSuggestionsService.getInsights(org.id),
        this.proactiveSuggestionsService.getDeadlineReminders(org.id),
        this.proactiveSuggestionsService.getOptimizations(org.id),
        this.generateTaxReminders(org.id),
        this.generateCashFlowAlerts(org.id),
      ]);

      // Store suggestions in database
      const storedSuggestions = await this.storeSuggestions(
        org.id,
        suggestions,
        insights,
        reminders,
        optimizations,
        taxReminders,
        cashFlowAlerts,
      );

      // Send notifications for high-priority suggestions
      const notificationsSent = await this.sendNotifications(org.id, storedSuggestions);

      return {
        suggestionsCreated: storedSuggestions.length,
        notificationsSent,
      };
    } catch (error) {
      this.logger.error(
        `Error processing organization ${org.name}:`,
        error,
      );
      return { suggestionsCreated: 0, notificationsSent: 0 };
    }
  }

  /**
   * Get all active organizations (with active subscriptions or in trial)
   */
  private async getActiveOrganizations(): Promise<
    Array<{ id: string; name: string; timezone: string }>
  > {
    // For now, get all organizations
    // In production, you might want to filter by subscription status
    const orgs = await this.prisma.organisation.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        timezone: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return orgs;
  }

  /**
   * Store suggestions in database with deduplication
   */
  private async storeSuggestions(
    orgId: string,
    suggestions: any[],
    insights: any[],
    reminders: any[],
    optimizations: any[],
    taxReminders: TaxSuggestion[],
    cashFlowAlerts: CashFlowSuggestion[],
  ): Promise<any[]> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const allSuggestions: any[] = [];

    // Convert suggestions to database format
    for (const suggestion of suggestions) {
      // Check if similar suggestion already exists (created in last 24 hours)
      const existing = await this.prisma.suggestion.findFirst({
        where: {
          orgId,
          title: suggestion.title,
          type: this.mapToDbSuggestionType(suggestion.type),
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });

      if (existing) {
        this.logger.debug(
          `Skipping duplicate suggestion: ${suggestion.title}`,
        );
        continue;
      }

      allSuggestions.push({
        orgId,
        userId: null, // Org-wide suggestion
        type: this.mapToDbSuggestionType(suggestion.type) as SuggestionType,
        priority: this.mapToDbPriority(suggestion.priority) as SuggestionPriority,
        title: suggestion.title,
        description: suggestion.description,
        actionLabel: suggestion.action?.label,
        actionType: suggestion.action?.type,
        actionParams: suggestion.action?.params || {},
        entityType: suggestion.metadata?.entityType,
        entityId: suggestion.metadata?.entityId,
        data: suggestion.metadata || {},
        status: 'PENDING',
      });
    }

    // Convert reminders to suggestions
    for (const reminder of reminders) {
      const existing = await this.prisma.suggestion.findFirst({
        where: {
          orgId,
          title: reminder.title,
          type: SuggestionType.TAX_DEADLINE,
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });

      if (existing) continue;

      allSuggestions.push({
        orgId,
        userId: null,
        type: SuggestionType.TAX_DEADLINE,
        priority: this.mapToDbPriority(reminder.severity) as SuggestionPriority,
        title: reminder.title,
        description: reminder.description,
        actionLabel: reminder.action?.label,
        actionType: reminder.action?.type,
        actionParams: reminder.action?.params || {},
        data: {
          dueDate: reminder.dueDate,
          daysRemaining: reminder.daysRemaining,
          reminderType: reminder.type,
        },
        status: 'PENDING',
        expiresAt: new Date(reminder.dueDate),
      });
    }

    // Convert optimizations to suggestions
    for (const optimization of optimizations) {
      const existing = await this.prisma.suggestion.findFirst({
        where: {
          orgId,
          title: optimization.title,
          type: SuggestionType.OPTIMIZATION,
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });

      if (existing) continue;

      allSuggestions.push({
        orgId,
        userId: null,
        type: SuggestionType.OPTIMIZATION,
        priority: SuggestionPriority.MEDIUM,
        title: optimization.title,
        description: optimization.description,
        actionLabel: optimization.action?.label,
        actionType: optimization.action?.type,
        actionParams: optimization.action?.params || {},
        data: {
          potentialSaving: optimization.potentialSaving,
          effort: optimization.effort,
          category: optimization.category,
        },
        status: 'PENDING',
      });
    }

    // Convert tax reminders to suggestions
    for (const taxReminder of taxReminders) {
      const existing = await this.prisma.suggestion.findFirst({
        where: {
          orgId,
          title: taxReminder.title,
          type: SuggestionType.TAX_DEADLINE,
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });

      if (existing) continue;

      allSuggestions.push({
        orgId,
        userId: null,
        type: SuggestionType.TAX_DEADLINE,
        priority: this.mapTaxPriorityToDb(taxReminder.priority),
        title: taxReminder.title,
        description: taxReminder.description,
        actionLabel: taxReminder.action?.label,
        actionType: taxReminder.action?.type,
        actionParams: taxReminder.action?.url ? { url: taxReminder.action.url } : {},
        data: {
          dueDate: taxReminder.dueDate,
          estimatedAmount: taxReminder.estimatedAmount,
          taxDeadlineType: taxReminder.action?.type,
        },
        status: 'PENDING',
        expiresAt: taxReminder.dueDate,
      });
    }

    // Convert cash flow alerts to suggestions
    for (const cashFlowAlert of cashFlowAlerts) {
      const existing = await this.prisma.suggestion.findFirst({
        where: {
          orgId,
          title: cashFlowAlert.title,
          type: SuggestionType.CASH_FLOW,
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });

      if (existing) continue;

      allSuggestions.push({
        orgId,
        userId: null,
        type: SuggestionType.CASH_FLOW,
        priority: this.mapCashFlowPriorityToDb(cashFlowAlert.priority),
        title: cashFlowAlert.title,
        description: cashFlowAlert.description,
        actionLabel: cashFlowAlert.action?.label,
        actionType: cashFlowAlert.action?.type,
        actionParams: { url: cashFlowAlert.action?.url || '/dashboard/cash-flow' },
        data: cashFlowAlert.data || {},
        status: 'PENDING',
      });
    }

    // Store all suggestions
    if (allSuggestions.length > 0) {
      const created = await this.prisma.suggestion.createMany({
        data: allSuggestions,
      });

      this.logger.debug(
        `Created ${created.count} new suggestions for org ${orgId}`,
      );

      // Fetch created suggestions to return with IDs
      return await this.prisma.suggestion.findMany({
        where: {
          orgId,
          createdAt: {
            gte: now,
          },
        },
      });
    }

    return [];
  }

  /**
   * Send notifications for high-priority suggestions
   */
  private async sendNotifications(
    orgId: string,
    suggestions: any[],
  ): Promise<number> {
    let sentCount = 0;

    // Get organization owner/admin users
    const admins = await this.prisma.membership.findMany({
      where: {
        orgId,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
      select: {
        userId: true,
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    // Filter high-priority and urgent suggestions
    const highPrioritySuggestions = suggestions.filter(
      s => s.priority === 'HIGH' || s.priority === 'URGENT',
    );

    if (highPrioritySuggestions.length === 0) {
      return 0;
    }

    // Send notifications to admins
    for (const admin of admins) {
      for (const suggestion of highPrioritySuggestions) {
        try {
          await this.notificationsService.createNotification({
            userId: admin.userId,
            orgId,
            type: 'SUGGESTION',
            title: suggestion.title,
            message: suggestion.description,
            priority: suggestion.priority === 'URGENT' ? 5 : 4,
            data: {
              suggestionId: suggestion.id,
              suggestionType: suggestion.type,
              actionLabel: suggestion.actionLabel,
              actionType: suggestion.actionType,
              actionParams: suggestion.actionParams,
            },
          });

          sentCount++;
        } catch (error) {
          this.logger.error(
            `Failed to send notification to user ${admin.userId}:`,
            error,
          );
        }
      }
    }

    return sentCount;
  }

  /**
   * Map suggestion type from service to database enum
   */
  private mapToDbSuggestionType(type: string): SuggestionType {
    const typeMap: Record<string, SuggestionType> = {
      deadline: SuggestionType.TAX_DEADLINE,
      warning: SuggestionType.INVOICE_REMINDER,
      anomaly: SuggestionType.EXPENSE_ANOMALY,
      insight: SuggestionType.INSIGHT,
      optimization: SuggestionType.OPTIMIZATION,
      opportunity: SuggestionType.OPTIMIZATION,
      quick_action: SuggestionType.INVOICE_REMINDER,
      tip: SuggestionType.INSIGHT,
    };

    return typeMap[type] || SuggestionType.INSIGHT;
  }

  /**
   * Map priority from service to database enum
   */
  private mapToDbPriority(priority: string): SuggestionPriority {
    const priorityMap: Record<string, SuggestionPriority> = {
      high: SuggestionPriority.HIGH,
      medium: SuggestionPriority.MEDIUM,
      low: SuggestionPriority.LOW,
    };

    return priorityMap[priority] || SuggestionPriority.MEDIUM;
  }

  /**
   * Sleep helper for batch processing
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Manual trigger for testing (can be called via API endpoint)
   */
  async triggerManually(): Promise<{
    success: boolean;
    message: string;
  }> {
    this.logger.log('Manual trigger of proactive suggestions generation');

    try {
      await this.generateDailySuggestions();
      return {
        success: true,
        message: 'Proactive suggestions generation completed',
      };
    } catch (error) {
      this.logger.error('Manual trigger failed:', error);
      return {
        success: false,
        message: `Failed: ${error.message}`,
      };
    }
  }

  /**
   * Generate tax deadline reminders for an organization
   */
  private async generateTaxReminders(orgId: string): Promise<TaxSuggestion[]> {
    const suggestions: TaxSuggestion[] = [];
    const now = new Date();

    try {
      // Get upcoming tax deadlines within 14 days
      const upcomingDeadlines = await this.taxCalendarService.getUpcomingDeadlines(orgId, 14);

      for (const deadline of upcomingDeadlines) {
        const daysUntil = Math.ceil(
          (deadline.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Skip if already completed
        if (deadline.status === 'completed') {
          continue;
        }

        // Get German tax messages
        const messages = this.getTaxMessages(deadline, daysUntil);

        // Determine priority based on urgency
        let priority: 'critical' | 'high' | 'medium' | 'low';
        let actionType: 'OPEN_TAX_WIZARD' | 'VIEW_TAX_PREVIEW' | 'DISMISS';
        let actionLabel: string;

        if (daysUntil <= 1) {
          priority = 'critical';
          actionType = 'OPEN_TAX_WIZARD';
          actionLabel = 'Jetzt einreichen';
        } else if (daysUntil <= 3) {
          priority = 'high';
          actionType = 'OPEN_TAX_WIZARD';
          actionLabel = 'Vorbereiten';
        } else if (daysUntil <= 7) {
          priority = 'medium';
          actionType = 'VIEW_TAX_PREVIEW';
          actionLabel = 'Vorschau anzeigen';
        } else {
          priority = 'low';
          actionType = 'DISMISS';
          actionLabel = 'OK';
        }

        // Estimate VAT amount if applicable
        let estimatedAmount = deadline.estimatedAmount;
        if (!estimatedAmount && deadline.type === 'vat_return') {
          estimatedAmount = await this.estimateVatAmount(orgId, deadline);
        }

        // Build description with estimated amount
        let description = messages.message;
        if (estimatedAmount && estimatedAmount > 0) {
          const formattedAmount = new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
          }).format(estimatedAmount);
          description += ` Geschätzter Betrag: ${formattedAmount}`;
        }

        suggestions.push({
          id: `tax-reminder-${deadline.id}`,
          type: 'TAX_DEADLINE',
          priority,
          title: messages.title,
          description,
          action: {
            type: actionType,
            url: deadline.actionUrl || '/tax/elster',
            label: actionLabel,
          },
          estimatedAmount,
          dueDate: deadline.dueDate,
          dismissible: priority === 'low' || priority === 'medium',
          metadata: {
            deadlineId: deadline.id,
            deadlineType: deadline.type,
            daysUntil,
            periodStart: deadline.periodStart,
            periodEnd: deadline.periodEnd,
          },
        });

        // Send escalation notifications based on urgency
        if (daysUntil <= 1) {
          await this.sendTaxNotifications(orgId, {
            title: 'Steuer-Deadline heute!',
            body: messages.message,
            priority: 'high',
            type: 'push',
          });
        } else if (daysUntil <= 3) {
          await this.sendTaxNotifications(orgId, {
            title: `Steuer-Erinnerung: ${messages.title}`,
            body: description,
            priority: 'medium',
            type: 'email',
          });
        }
      }

      this.logger.debug(`Generated ${suggestions.length} tax reminders for org ${orgId}`);
    } catch (error) {
      this.logger.error(`Error generating tax reminders for org ${orgId}:`, error);
    }

    return suggestions;
  }

  /**
   * Get German tax reminder messages based on deadline type and urgency
   */
  private getTaxMessages(deadline: any, daysUntil: number): { title: string; message: string } {
    const dateStr = format(deadline.dueDate, 'dd.MM.yyyy', { locale: de });

    // Determine urgency level
    let urgency: 'urgent' | 'soon' | 'week' | 'early';
    if (daysUntil <= 1) urgency = 'urgent';
    else if (daysUntil <= 3) urgency = 'soon';
    else if (daysUntil <= 7) urgency = 'week';
    else urgency = 'early';

    // Extract period information
    const year = deadline.periodEnd ? deadline.periodEnd.getFullYear() : new Date().getFullYear();
    const month = deadline.periodEnd ? format(deadline.periodEnd, 'MMMM', { locale: de }) : '';
    const quarter = deadline.id.includes('Q') ? deadline.id.match(/Q(\d)/)?.[1] : null;

    const TAX_MESSAGES = {
      vat_return: {
        monthly: {
          urgent: {
            title: `USt-Voranmeldung für ${month} ist HEUTE fällig!`,
            message: `Die Umsatzsteuer-Voranmeldung für ${month} ist heute fällig. Bitte jetzt einreichen.`
          },
          soon: {
            title: `USt-Voranmeldung für ${month} ist in ${daysUntil} Tagen fällig`,
            message: `Die Umsatzsteuer-Voranmeldung für ${month} ist am ${dateStr} fällig.`
          },
          week: {
            title: `USt-Voranmeldung für ${month} nächste Woche`,
            message: `Erinnerung: USt-Voranmeldung für ${month} fällig am ${dateStr}.`
          },
          early: {
            title: `USt-Voranmeldung für ${month} fällig am ${dateStr}`,
            message: `Die Umsatzsteuer-Voranmeldung für ${month} ist am ${dateStr} fällig.`
          },
        },
        quarterly: {
          urgent: {
            title: `USt-Voranmeldung Q${quarter} ${year} ist HEUTE fällig!`,
            message: `Die Umsatzsteuer-Voranmeldung für Q${quarter} ${year} ist heute fällig. Bitte jetzt einreichen.`
          },
          soon: {
            title: `USt-Voranmeldung Q${quarter} ${year} ist in ${daysUntil} Tagen fällig`,
            message: `Die Umsatzsteuer-Voranmeldung für Q${quarter} ${year} ist am ${dateStr} fällig.`
          },
          week: {
            title: `USt-Voranmeldung Q${quarter} ${year} nächste Woche`,
            message: `Erinnerung: USt-Voranmeldung Q${quarter} ${year} fällig am ${dateStr}.`
          },
          early: {
            title: `USt-Voranmeldung Q${quarter} ${year} fällig am ${dateStr}`,
            message: `Die Umsatzsteuer-Voranmeldung für Q${quarter} ${year} ist am ${dateStr} fällig.`
          },
        },
        yearly: {
          urgent: {
            title: `Umsatzsteuerjahreserklärung ${year} ist HEUTE fällig!`,
            message: `Die Umsatzsteuerjahreserklärung für ${year} ist heute fällig. Bitte jetzt einreichen.`
          },
          soon: {
            title: `Umsatzsteuerjahreserklärung ${year} ist in ${daysUntil} Tagen fällig`,
            message: `Die Umsatzsteuerjahreserklärung für ${year} ist am ${dateStr} fällig.`
          },
          week: {
            title: `Umsatzsteuerjahreserklärung ${year} nächste Woche`,
            message: `Erinnerung: Umsatzsteuerjahreserklärung ${year} fällig am ${dateStr}.`
          },
          early: {
            title: `Umsatzsteuerjahreserklärung ${year} fällig am ${dateStr}`,
            message: `Die Umsatzsteuerjahreserklärung für ${year} ist am ${dateStr} fällig.`
          },
        },
      },
      prepayment: {
        urgent: {
          title: `ESt-Vorauszahlung Q${quarter} ist HEUTE fällig!`,
          message: `Die Einkommensteuer-Vorauszahlung für Q${quarter} ist heute fällig. Bitte jetzt zahlen.`
        },
        soon: {
          title: `ESt-Vorauszahlung Q${quarter} ist in ${daysUntil} Tagen fällig`,
          message: `Die Einkommensteuer-Vorauszahlung für Q${quarter} ist am ${dateStr} fällig.`
        },
        week: {
          title: `ESt-Vorauszahlung Q${quarter} nächste Woche`,
          message: `Erinnerung: ESt-Vorauszahlung Q${quarter} fällig am ${dateStr}.`
        },
        early: {
          title: `ESt-Vorauszahlung Q${quarter} fällig am ${dateStr}`,
          message: `Die Einkommensteuer-Vorauszahlung für Q${quarter} ist am ${dateStr} fällig.`
        },
      },
      annual_return: {
        urgent: {
          title: `Einkommensteuererklärung ${year} ist HEUTE fällig!`,
          message: `Die Einkommensteuererklärung für ${year} ist heute fällig. Bitte jetzt einreichen.`
        },
        soon: {
          title: `Einkommensteuererklärung ${year} ist in ${daysUntil} Tagen fällig`,
          message: `Die Einkommensteuererklärung für ${year} ist am ${dateStr} fällig.`
        },
        week: {
          title: `Einkommensteuererklärung ${year} nächste Woche`,
          message: `Erinnerung: Einkommensteuererklärung ${year} fällig am ${dateStr}.`
        },
        early: {
          title: `Einkommensteuererklärung ${year} fällig am ${dateStr}`,
          message: `Die Einkommensteuererklärung für ${year} ist am ${dateStr} fällig.`
        },
      },
    };

    // Determine filing type
    let filingType: 'monthly' | 'quarterly' | 'yearly' = 'quarterly';
    if (deadline.filingType === 'monthly') filingType = 'monthly';
    else if (deadline.filingType === 'yearly') filingType = 'yearly';

    // Get appropriate message
    if (deadline.type === 'vat_return') {
      return TAX_MESSAGES.vat_return[filingType][urgency];
    } else if (deadline.type === 'prepayment') {
      return TAX_MESSAGES.prepayment[urgency];
    } else if (deadline.type === 'annual_return') {
      return TAX_MESSAGES.annual_return[urgency];
    }

    // Fallback to generic message
    return {
      title: deadline.title,
      message: `${deadline.description} Fällig am ${dateStr}.`,
    };
  }

  /**
   * Estimate VAT amount for a deadline
   */
  private async estimateVatAmount(orgId: string, deadline: any): Promise<number | null> {
    try {
      if (!deadline.periodStart || !deadline.periodEnd) {
        return null;
      }

      // Calculate VAT from invoices (output VAT)
      const invoices = await this.prisma.invoice.aggregate({
        where: {
          orgId,
          issueDate: {
            gte: deadline.periodStart,
            lte: deadline.periodEnd,
          },
          status: { in: ['SENT', 'PAID'] },
        },
        _sum: {
          vatAmount: true,
        },
      });

      // Calculate VAT from expenses (input VAT)
      const expenses = await this.prisma.expense.aggregate({
        where: {
          orgId,
          date: {
            gte: deadline.periodStart,
            lte: deadline.periodEnd,
          },
          status: 'APPROVED',
        },
        _sum: {
          vatAmount: true,
        },
      });

      const outputVat = Number(invoices._sum.vatAmount || 0);
      const inputVat = Number(expenses._sum.vatAmount || 0);
      const netVat = outputVat - inputVat;

      return netVat > 0 ? netVat : 0;
    } catch (error) {
      this.logger.error('Error estimating VAT amount:', error);
      return null;
    }
  }

  /**
   * Send tax-specific notifications
   */
  private async sendTaxNotifications(
    orgId: string,
    notification: {
      title: string;
      body: string;
      priority: 'high' | 'medium';
      type: 'push' | 'email';
    },
  ): Promise<void> {
    try {
      // Get organization admins
      const admins = await this.prisma.membership.findMany({
        where: {
          orgId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
        select: {
          userId: true,
        },
      });

      // Send notifications to all admins
      for (const admin of admins) {
        await this.notificationsService.createNotification({
          userId: admin.userId,
          orgId,
          type: 'TAX_REMINDER',
          title: notification.title,
          message: notification.body,
          priority: notification.priority === 'high' ? 5 : 4,
          data: {
            notificationType: notification.type,
          },
        });
      }
    } catch (error) {
      this.logger.error('Error sending tax notifications:', error);
    }
  }

  /**
   * Map tax priority to database priority enum
   */
  private mapTaxPriorityToDb(priority: 'critical' | 'high' | 'medium' | 'low'): SuggestionPriority {
    if (priority === 'critical' || priority === 'high') {
      return SuggestionPriority.HIGH;
    } else if (priority === 'medium') {
      return SuggestionPriority.MEDIUM;
    }
    return SuggestionPriority.LOW;
  }

  /**
   * Map cash flow priority to database priority enum
   */
  private mapCashFlowPriorityToDb(priority: 'critical' | 'high' | 'medium' | 'low'): SuggestionPriority {
    if (priority === 'critical' || priority === 'high') {
      return SuggestionPriority.HIGH;
    } else if (priority === 'medium') {
      return SuggestionPriority.MEDIUM;
    }
    return SuggestionPriority.LOW;
  }

  /**
   * Generate cash flow alerts for an organization
   */
  private async generateCashFlowAlerts(orgId: string): Promise<CashFlowSuggestion[]> {
    const suggestions: CashFlowSuggestion[] = [];

    try {
      // Get 30-day forecast
      const forecast = await this.cashFlowPredictor.predictCashFlow(orgId, 30);
      const runway = await this.cashFlowPredictor.calculateRunway(orgId);

      // Alert: Critical runway (< 1 month)
      if (runway.runwayMonths < 1 && runway.runwayMonths > 0) {
        suggestions.push({
          id: `cashflow-critical-${Date.now()}`,
          type: 'CASH_FLOW_ALERT',
          priority: 'critical',
          title: 'Kritische Liquiditätslage',
          description: `Runway unter 1 Monat! Aktueller Kontostand: €${forecast.currentBalance.toLocaleString('de-DE')}. Sofortige Maßnahmen erforderlich.`,
          dismissible: false,
          action: {
            type: 'VIEW_CASH_FLOW',
            url: '/dashboard/cash-flow',
            label: 'Cash Flow analysieren',
          },
          data: {
            currentBalance: forecast.currentBalance,
            runwayMonths: runway.runwayMonths,
            burnRate: runway.monthlyBurnRate,
          },
        });

        // Send push notification for critical alerts
        await this.sendCashFlowNotification(orgId, {
          title: 'Kritische Liquiditätslage!',
          body: `Runway unter 1 Monat. Aktueller Kontostand: €${forecast.currentBalance.toLocaleString('de-DE')}`,
          priority: 'high',
          url: '/dashboard/cash-flow',
        });
      }
      // Alert: Caution runway (< 3 months)
      else if (runway.runwayMonths < 3 && runway.runwayMonths >= 1) {
        suggestions.push({
          id: `cashflow-warning-${Date.now()}`,
          type: 'CASH_FLOW_ALERT',
          priority: 'high',
          title: 'Liquiditätswarnung',
          description: `Runway bei ${runway.runwayMonths.toFixed(1)} Monaten. Empfehlung: Einnahmen beschleunigen oder Ausgaben reduzieren.`,
          dismissible: true,
          action: {
            type: 'VIEW_RECEIVABLES',
            url: '/invoices?status=overdue',
            label: 'Überfällige Rechnungen',
          },
          data: {
            runwayMonths: runway.runwayMonths,
            burnRate: runway.monthlyBurnRate,
          },
        });
      }

      // Alert: Low balance point in next 30 days
      if (forecast.lowestPoint.isCritical) {
        const daysUntil = forecast.lowestPoint.daysFromNow;
        suggestions.push({
          id: `cashflow-lowpoint-${Date.now()}`,
          type: 'CASH_FLOW_ALERT',
          priority: daysUntil <= 7 ? 'critical' : 'high',
          title: `Niedriger Kontostand in ${daysUntil} Tagen`,
          description: `Am ${format(forecast.lowestPoint.date, 'dd.MM.', { locale: de })} wird Kontostand bei €${forecast.lowestPoint.projectedBalance.toLocaleString('de-DE')} sein.`,
          dismissible: daysUntil > 7,
          action: {
            type: 'VIEW_FORECAST',
            url: '/dashboard/cash-flow?view=forecast',
            label: 'Prognose anzeigen',
          },
          data: {
            lowestDate: forecast.lowestPoint.date,
            lowestBalance: forecast.lowestPoint.projectedBalance,
            riskFactors: forecast.lowestPoint.riskFactors,
          },
        });

        // Send push notification if critical and soon
        if (daysUntil <= 7) {
          await this.sendCashFlowNotification(orgId, {
            title: `Niedriger Kontostand in ${daysUntil} Tagen`,
            body: `Kontostand wird bei €${forecast.lowestPoint.projectedBalance.toLocaleString('de-DE')} sein`,
            priority: 'high',
            url: '/dashboard/cash-flow?view=forecast',
          });
        }
      }

      // Alert: Large upcoming expenses
      const largeExpenses = forecast.outflows.breakdown.filter(
        item => item.amount > forecast.currentBalance * 0.2
      );
      for (const expense of largeExpenses.slice(0, 2)) {
        suggestions.push({
          id: `cashflow-expense-${expense.source}-${Date.now()}`,
          type: 'CASH_FLOW_ALERT',
          priority: 'medium',
          title: `Große Zahlung: ${expense.description}`,
          description: `€${expense.amount.toLocaleString('de-DE')} fällig am ${format(expense.expectedDate, 'dd.MM.', { locale: de })}`,
          dismissible: true,
          action: {
            type: 'VIEW_BILL',
            url: expense.type === 'bill' ? `/bills/${expense.source}` : '/dashboard/cash-flow',
            label: 'Details anzeigen',
          },
        });
      }

      // Alert: Overdue receivables affecting cash flow
      const overdueReceivables = await this.getOverdueReceivables(orgId);
      if (overdueReceivables.total > runway.monthlyBurnRate * 0.5) {
        const runwayExtension = (overdueReceivables.total / runway.monthlyBurnRate).toFixed(1);
        suggestions.push({
          id: `cashflow-receivables-${Date.now()}`,
          type: 'CASH_FLOW_ALERT',
          priority: 'high',
          title: 'Überfällige Forderungen belasten Cash Flow',
          description: `€${overdueReceivables.total.toLocaleString('de-DE')} überfällig. Eintreiben würde Runway um ${runwayExtension} Monate verlängern.`,
          dismissible: true,
          action: {
            type: 'SEND_REMINDERS',
            url: '/invoices?status=overdue',
            label: 'Mahnungen senden',
          },
        });
      }

      this.logger.debug(`Generated ${suggestions.length} cash flow alerts for org ${orgId}`);
    } catch (error) {
      this.logger.error(`Cash flow alerts failed for ${orgId}:`, error);
    }

    return suggestions;
  }

  /**
   * Get overdue receivables summary
   */
  private async getOverdueReceivables(orgId: string) {
    const overdue = await this.prisma.invoice.findMany({
      where: {
        orgId,
        status: 'OVERDUE',
      },
    });
    return {
      count: overdue.length,
      total: overdue.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
    };
  }

  /**
   * Send cash flow-specific notifications
   */
  private async sendCashFlowNotification(
    orgId: string,
    notification: {
      title: string;
      body: string;
      priority: 'high' | 'medium';
      url: string;
    },
  ): Promise<void> {
    try {
      // Get organization admins
      const admins = await this.prisma.membership.findMany({
        where: {
          orgId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
        select: {
          userId: true,
        },
      });

      // Send notifications to all admins
      for (const admin of admins) {
        await this.notificationsService.createNotification({
          userId: admin.userId,
          orgId,
          type: 'CASH_FLOW_ALERT',
          title: notification.title,
          message: notification.body,
          priority: notification.priority === 'high' ? 5 : 4,
          data: {
            url: notification.url,
          },
        });
      }
    } catch (error) {
      this.logger.error('Error sending cash flow notifications:', error);
    }
  }
}
