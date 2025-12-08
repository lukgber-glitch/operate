/**
 * Bills Suggestions Generator
 * Generates proactive suggestions for bills (accounts payable)
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { BaseSuggestionGenerator } from './base.generator';
import {
  GeneratorResult,
  Suggestion,
  SuggestionContext,
  SuggestionPriority,
  SuggestionType,
  Reminder,
  ReminderType,
} from '../suggestion.types';

@Injectable()
export class BillsSuggestionsGenerator extends BaseSuggestionGenerator {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async generate(context: SuggestionContext): Promise<GeneratorResult> {
    this.logger.debug(`Generating bills suggestions for org ${context.orgId}`);

    const suggestions: Suggestion[] = [];
    const reminders: Reminder[] = [];

    try {
      // Get overdue bills
      const overdueResult = await this.checkOverdueBills(context);
      suggestions.push(...overdueResult.suggestions);

      // Get bills due in next 7 days
      const dueSoonResult = await this.checkBillsDueSoon(context);
      suggestions.push(...dueSoonResult.suggestions);
      reminders.push(...dueSoonResult.reminders);

      // Get unpaid bills needing approval
      const approvalResult = await this.checkBillsPendingApproval(context);
      suggestions.push(...approvalResult.suggestions);

      // Check for duplicate bills
      const duplicatesResult = await this.checkForDuplicateBills(context);
      suggestions.push(...duplicatesResult.suggestions);

      return {
        suggestions,
        insights: [],
        reminders,
        optimizations: [],
      };
    } catch (error) {
      this.logger.error('Error generating bills suggestions:', error);
      return this.emptyResult();
    }
  }

  /**
   * Check for overdue bills
   */
  private async checkOverdueBills(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[] }> {
    const now = new Date();

    const overdueBills = await this.prisma.bill.findMany({
      where: {
        organisationId: context.orgId,
        status: { in: ['PENDING', 'APPROVED'] },
        dueDate: { lt: now },
      },
      select: {
        id: true,
        billNumber: true,
        vendorName: true,
        totalAmount: true,
        currency: true,
        dueDate: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    if (overdueBills.length === 0) {
      return { suggestions: [] };
    }

    const totalOverdue = overdueBills.reduce(
      (sum, bill) => sum + Number(bill.totalAmount),
      0,
    );

    const billIds = overdueBills.map(bill => bill.id);
    const vendorNames = overdueBills
      .slice(0, 3)
      .map(bill => bill.vendorName)
      .join(', ');

    const daysOverdue = Math.ceil(
      (now.getTime() - overdueBills[0].dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const description =
      overdueBills.length <= 3
        ? `Bills from ${vendorNames} are overdue by ${daysOverdue} days. Total: ${this.formatCurrency(totalOverdue)}`
        : `${overdueBills.length} bills are overdue (${vendorNames}, ...). Total: ${this.formatCurrency(totalOverdue)}`;

    const suggestion: Suggestion = {
      id: this.createSuggestionId('bill', 'overdue', context.orgId),
      type: SuggestionType.WARNING,
      title: `${overdueBills.length} overdue bill${overdueBills.length > 1 ? 's' : ''}`,
      description,
      action: {
        type: 'pay_bills',
        label: 'Pay Bills',
        params: { billIds },
        confirmation: true,
      },
      priority: SuggestionPriority.HIGH,
      dismissible: false,
      metadata: {
        entityType: 'bill',
        count: overdueBills.length,
        totalAmount: totalOverdue,
        billIds,
        daysOverdue,
      },
    };

    return { suggestions: [suggestion] };
  }

  /**
   * Check for bills due in the next 7 days
   */
  private async checkBillsDueSoon(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[]; reminders: Reminder[] }> {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const dueSoonBills = await this.prisma.bill.findMany({
      where: {
        organisationId: context.orgId,
        status: { in: ['PENDING', 'APPROVED'] },
        dueDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      select: {
        id: true,
        billNumber: true,
        vendorName: true,
        totalAmount: true,
        currency: true,
        dueDate: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    if (dueSoonBills.length === 0) {
      return { suggestions: [], reminders: [] };
    }

    const totalAmount = dueSoonBills.reduce(
      (sum, bill) => sum + Number(bill.totalAmount),
      0,
    );

    const billIds = dueSoonBills.map(bill => bill.id);

    const suggestions: Suggestion[] = [];
    const reminders: Reminder[] = [];

    // Create suggestion for all bills due soon
    suggestions.push({
      id: this.createSuggestionId('bill', 'due_soon', context.orgId),
      type: SuggestionType.DEADLINE,
      title: `${dueSoonBills.length} bill${dueSoonBills.length > 1 ? 's' : ''} due within 7 days`,
      description: `${dueSoonBills.length} unpaid bill${dueSoonBills.length > 1 ? 's' : ''} (total: ${this.formatCurrency(totalAmount)}) will be due within the next week.`,
      action: {
        type: 'navigate',
        label: 'Review Bills',
        params: { path: '/bills?status=pending&due_soon=true' },
      },
      priority: SuggestionPriority.HIGH,
      dismissible: true,
      metadata: {
        entityType: 'bill',
        count: dueSoonBills.length,
        totalAmount,
        billIds,
      },
    });

    // Create individual reminders for bills due in next 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const urgentBills = dueSoonBills.filter(
      bill => bill.dueDate <= threeDaysFromNow
    );

    for (const bill of urgentBills) {
      const daysRemaining = Math.ceil(
        (bill.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      reminders.push({
        id: this.createSuggestionId('reminder', 'bill', bill.id),
        title: `Bill ${bill.billNumber} due ${daysRemaining === 0 ? 'today' : `in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`}`,
        description: `Payment to ${bill.vendorName} (${this.formatCurrency(Number(bill.totalAmount))}) is due ${daysRemaining === 0 ? 'today' : `on ${bill.dueDate.toLocaleDateString()}`}`,
        dueDate: bill.dueDate,
        daysRemaining,
        type: ReminderType.INVOICE_DUE,
        severity: daysRemaining <= 1 ? SuggestionPriority.HIGH : SuggestionPriority.MEDIUM,
        action: {
          type: 'pay_bill',
          label: 'Pay Now',
          params: { billId: bill.id },
          confirmation: true,
        },
      });
    }

    return { suggestions, reminders };
  }

  /**
   * Check for bills pending approval
   */
  private async checkBillsPendingApproval(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[] }> {
    const pendingBills = await this.prisma.bill.count({
      where: {
        organisationId: context.orgId,
        status: 'DRAFT',
      },
    });

    if (pendingBills === 0) {
      return { suggestions: [] };
    }

    const suggestion: Suggestion = {
      id: this.createSuggestionId('bill', 'pending_approval', context.orgId),
      type: SuggestionType.QUICK_ACTION,
      title: `${pendingBills} bill${pendingBills > 1 ? 's' : ''} pending approval`,
      description: `You have ${pendingBills} bill${pendingBills > 1 ? 's' : ''} waiting to be reviewed and approved for payment.`,
      action: {
        type: 'navigate',
        label: 'Review Bills',
        params: { path: '/bills?status=draft' },
      },
      priority: SuggestionPriority.MEDIUM,
      dismissible: true,
      metadata: {
        entityType: 'bill',
        count: pendingBills,
      },
    };

    return { suggestions: [suggestion] };
  }

  /**
   * Check for potential duplicate bills
   */
  private async checkForDuplicateBills(
    context: SuggestionContext,
  ): Promise<{ suggestions: Suggestion[] }> {
    // Get bills from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBills = await this.prisma.bill.findMany({
      where: {
        organisationId: context.orgId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        billNumber: true,
        vendorName: true,
        totalAmount: true,
        dueDate: true,
        status: true,
      },
    });

    const suggestions: Suggestion[] = [];

    // Group by vendor and amount (potential duplicates)
    const grouped = new Map<string, typeof recentBills>();

    for (const bill of recentBills) {
      const key = `${bill.vendorName}_${bill.totalAmount}`;
      const existing = grouped.get(key) || [];
      existing.push(bill);
      grouped.set(key, existing);
    }

    // Find duplicates (same vendor, same amount, within 7 days)
    const entries = Array.from(grouped.entries());
    for (const [key, bills] of entries) {
      if (bills.length < 2) continue;

      // Check if they're within 7 days of each other
      bills.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

      for (let i = 0; i < bills.length - 1; i++) {
        const daysDiff = this.getDaysBetween(bills[i].dueDate, bills[i + 1].dueDate);

        if (daysDiff <= 7) {
          suggestions.push({
            id: this.createSuggestionId('bill', 'duplicate', bills[i].id, bills[i + 1].id),
            type: SuggestionType.ANOMALY,
            title: 'Potential duplicate bills detected',
            description: `Bills ${bills[i].billNumber} and ${bills[i + 1].billNumber} from ${bills[i].vendorName} have the same amount (${this.formatCurrency(Number(bills[i].totalAmount))}) and similar due dates. Please review.`,
            action: {
              type: 'navigate',
              label: 'Review Bills',
              params: { path: `/bills/${bills[i].id}` },
            },
            priority: SuggestionPriority.MEDIUM,
            dismissible: true,
            metadata: {
              entityType: 'bill',
              billIds: [bills[i].id, bills[i + 1].id],
              vendor: bills[i].vendorName,
              amount: Number(bills[i].totalAmount),
            },
          });

          // Only report the first duplicate pair to avoid spam
          break;
        }
      }
    }

    return { suggestions: suggestions.slice(0, 3) }; // Limit to 3 duplicate warnings
  }
}
