/**
 * Tax Suggestions Generator
 * Generates suggestions related to tax (VAT, deadlines, estimates, etc.)
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
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
export class TaxSuggestionsGenerator extends BaseSuggestionGenerator {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async generate(context: SuggestionContext): Promise<GeneratorResult> {
    this.logger.debug(`Generating tax suggestions for org ${context.orgId}`);

    const suggestions: Suggestion[] = [];
    const reminders: Reminder[] = [];

    try {
      // Get organization details for country-specific rules
      const org = await this.prisma.organisation.findUnique({
        where: { id: context.orgId },
        select: { country: true },
      });

      if (!org) {
        return this.emptyResult();
      }

      // Check VAT return deadlines
      const vatReminders = await this.checkVATDeadlines(context, org.country);
      reminders.push(...vatReminders);

      // Create suggestions from reminders
      for (const reminder of vatReminders) {
        if (reminder.daysRemaining <= 7) {
          suggestions.push({
            id: reminder.id,
            type: SuggestionType.DEADLINE,
            title: reminder.title,
            description: reminder.description,
            action: reminder.action,
            priority: reminder.severity,
            dismissible: false,
            metadata: {
              dueDate: reminder.dueDate,
              daysRemaining: reminder.daysRemaining,
              type: reminder.type,
            },
          });
        }
      }

      // Check estimated tax liability
      const taxEstimate = await this.getEstimatedTaxLiability(context);
      if (taxEstimate) {
        suggestions.push(taxEstimate);
      }

      // Check missing receipts for tax period
      const missingReceipts = await this.checkMissingTaxDocuments(context);
      if (missingReceipts) {
        suggestions.push(missingReceipts);
      }

      return {
        suggestions,
        insights: [],
        reminders,
        optimizations: [],
      };
    } catch (error) {
      this.logger.error('Error generating tax suggestions:', error);
      return this.emptyResult();
    }
  }

  /**
   * Check VAT return deadlines
   */
  private async checkVATDeadlines(
    context: SuggestionContext,
    country: string,
  ): Promise<Reminder[]> {
    const reminders: Reminder[] = [];
    const now = new Date();

    // Get VAT filing frequency (monthly/quarterly)
    // For now, assume quarterly (can be enhanced with org settings)
    const quarters = this.getQuarterDeadlines(now.getFullYear(), country);

    for (const quarter of quarters) {
      const daysRemaining = this.getDaysBetween(now, quarter.dueDate);

      if (daysRemaining >= 0 && daysRemaining <= 30) {
        const severity =
          daysRemaining <= 5
            ? SuggestionPriority.HIGH
            : daysRemaining <= 14
              ? SuggestionPriority.MEDIUM
              : SuggestionPriority.LOW;

        reminders.push({
          id: this.createSuggestionId(
            'reminder',
            'vat',
            quarter.quarter,
            context.orgId,
          ),
          title: `${quarter.quarter} VAT return due soon`,
          description: `${quarter.quarter} VAT return due ${this.formatDate(quarter.dueDate)} (in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''})`,
          dueDate: quarter.dueDate,
          daysRemaining,
          type: ReminderType.VAT_RETURN,
          severity,
          action: {
            type: 'prepare_vat',
            label: 'Prepare VAT Return',
            params: {
              path: '/tax/vat',
              quarter: quarter.quarter,
            },
          },
        });
      }
    }

    return reminders;
  }

  /**
   * Get estimated tax liability
   */
  private async getEstimatedTaxLiability(
    context: SuggestionContext,
  ): Promise<Suggestion | null> {
    try {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Calculate revenue
      const revenue = await this.prisma.invoice.aggregate({
        where: {
          orgId: context.orgId,
          status: { in: ['SENT', 'PAID'] },
          issueDate: { gte: startOfYear },
        },
        _sum: { totalAmount: true },
      });

      // Calculate expenses
      const expenses = await this.prisma.expense.aggregate({
        where: {
          orgId: context.orgId,
          status: 'APPROVED',
          date: { gte: startOfYear },
        },
        _sum: { amount: true },
      });

      const totalRevenue = Number(revenue._sum.totalAmount || 0);
      const totalExpenses = Number(expenses._sum.amount || 0);
      const profit = totalRevenue - totalExpenses;

      if (profit > 0) {
        // Simplified estimate (use actual tax rates based on country/regime)
        const estimatedTaxRate = 0.25; // 25% corporate tax rate
        const estimatedTax = profit * estimatedTaxRate;

        return {
          id: this.createSuggestionId('tax', 'estimate', context.orgId),
          type: SuggestionType.INSIGHT,
          title: 'Estimated tax liability',
          description: `Based on year-to-date profit of ${this.formatCurrency(profit)}, estimated tax liability: ${this.formatCurrency(estimatedTax)}`,
          priority: SuggestionPriority.MEDIUM,
          dismissible: true,
          metadata: {
            revenue: totalRevenue,
            expenses: totalExpenses,
            profit,
            estimatedTax,
            taxRate: estimatedTaxRate,
          },
        };
      }
    } catch (error) {
      this.logger.error('Error calculating tax estimate:', error);
    }

    return null;
  }

  /**
   * Check for missing tax documents
   */
  private async checkMissingTaxDocuments(
    context: SuggestionContext,
  ): Promise<Suggestion | null> {
    try {
      const now = new Date();
      const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
      const startOfQuarter = new Date(
        now.getFullYear(),
        (currentQuarter - 1) * 3,
        1,
      );

      // Check for expenses without receipts in current quarter
      const missingReceiptsCount = await this.prisma.expense.count({
        where: {
          orgId: context.orgId,
          receiptUrl: null,
          date: { gte: startOfQuarter },
          status: { in: ['PENDING', 'APPROVED'] },
        },
      });

      if (missingReceiptsCount > 0) {
        return {
          id: this.createSuggestionId('tax', 'missing_docs', context.orgId),
          type: SuggestionType.WARNING,
          title: `Missing receipts for Q${currentQuarter}`,
          description: `${missingReceiptsCount} expense${missingReceiptsCount > 1 ? 's' : ''} in Q${currentQuarter} ${missingReceiptsCount > 1 ? 'are' : 'is'} missing receipt documentation required for tax filing.`,
          action: {
            type: 'navigate',
            label: 'Add Receipts',
            params: { path: '/expenses?missing_receipts=true' },
          },
          priority: SuggestionPriority.MEDIUM,
          dismissible: true,
          metadata: {
            count: missingReceiptsCount,
            quarter: currentQuarter,
          },
        };
      }
    } catch (error) {
      this.logger.error('Error checking missing tax documents:', error);
    }

    return null;
  }

  /**
   * Get quarter deadlines for a given year
   */
  private getQuarterDeadlines(
    year: number,
    country: string,
  ): Array<{ quarter: string; dueDate: Date }> {
    // Default deadlines (can be customized per country)
    // Most countries: 10th day of the month following the quarter
    const deadlines = [
      { quarter: 'Q1', dueDate: new Date(year, 4, 10) }, // May 10
      { quarter: 'Q2', dueDate: new Date(year, 7, 10) }, // August 10
      { quarter: 'Q3', dueDate: new Date(year, 10, 10) }, // November 10
      { quarter: 'Q4', dueDate: new Date(year + 1, 1, 10) }, // February 10 next year
    ];

    // Country-specific adjustments
    if (country === 'DE') {
      // Germany: 10th day of the following month
      return deadlines;
    } else if (country === 'AT') {
      // Austria: 15th day of the following month
      return deadlines.map(d => ({
        ...d,
        dueDate: new Date(d.dueDate.getFullYear(), d.dueDate.getMonth(), 15),
      }));
    }

    return deadlines;
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }
}
