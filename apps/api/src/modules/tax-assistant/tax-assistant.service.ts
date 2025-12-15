import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  TaxSuggestionFiltersDto,
  TaxSuggestionType,
  SuggestionStatus,
  SuggestionPriority,
} from './dto';
import { TAX_DEADLINES, DeadlineTemplate } from './constants/tax-deadlines.constant';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TaxAssistantService {
  private readonly logger = new Logger(TaxAssistantService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // SUGGESTION ANALYSIS METHODS
  // ============================================================================

  /**
   * Run all tax analysis and generate suggestions
   */
  async analyzeTaxSavings(organisationId: string) {
    this.logger.log(`Running tax analysis for organization ${organisationId}`);

    const suggestions = await Promise.all([
      this.analyzeMissedDeductions(organisationId),
      this.analyzeQuarterlyEstimates(organisationId),
      this.analyzeMileageOpportunity(organisationId),
      this.analyzeHomeOffice(organisationId),
      this.analyzeEquipmentDepreciation(organisationId),
      this.analyzeRetirementContributions(organisationId),
      this.analyzeExpenseCategorization(organisationId),
    ]);

    const allSuggestions = suggestions.flat();
    this.logger.log(`Generated ${allSuggestions.length} suggestions`);

    return allSuggestions;
  }

  /**
   * Check for uncategorized expenses that could be deductions
   */
  async analyzeMissedDeductions(organisationId: string) {
    const suggestions = [];

    // Find uncategorized expenses in the last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const uncategorizedExpenses = await this.prisma.transaction.count({
      where: {
        organisationId,
        type: 'EXPENSE',
        category: null,
        date: { gte: threeMonthsAgo },
      },
    });

    if (uncategorizedExpenses > 0) {
      // Estimate potential savings (assume 25% of expenses could be deductible)
      const expenseTotal = await this.prisma.transaction.aggregate({
        where: {
          organisationId,
          type: 'EXPENSE',
          category: null,
          date: { gte: threeMonthsAgo },
        },
        _sum: { amount: true },
      });

      const potentialDeduction = new Decimal(expenseTotal._sum.amount || 0);
      const estimatedSavings = potentialDeduction.mul(0.25); // 25% tax rate assumption

      const suggestion = await this.prisma.taxSuggestion.create({
        data: {
          organisationId,
          type: 'MISSED_DEDUCTION',
          category: 'deduction',
          title: 'Uncategorized Expenses May Be Deductible',
          description: `You have ${uncategorizedExpenses} uncategorized expenses totaling ${potentialDeduction.toFixed(2)}. Review these expenses to identify potential tax deductions.`,
          potentialSavings: estimatedSavings,
          priority: 'HIGH',
          actionUrl: '/finance/expenses',
          actionLabel: 'Review Expenses',
          metadata: {
            expenseCount: uncategorizedExpenses,
            totalAmount: potentialDeduction.toString(),
          },
        },
      });

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * Calculate estimated quarterly tax
   */
  async analyzeQuarterlyEstimates(organisationId: string) {
    const suggestions = [];

    // Get organization country
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { country: true },
    });

    // Only for countries with quarterly estimated taxes (e.g., US)
    if (org?.country !== 'US') {
      return suggestions;
    }

    // Calculate income for current quarter
    const currentQuarter = Math.floor((new Date().getMonth() / 3)) + 1;
    const quarterStart = new Date(new Date().getFullYear(), (currentQuarter - 1) * 3, 1);
    const quarterEnd = new Date(new Date().getFullYear(), currentQuarter * 3, 0);

    const income = await this.prisma.transaction.aggregate({
      where: {
        organisationId,
        type: 'INCOME',
        date: { gte: quarterStart, lte: quarterEnd },
      },
      _sum: { amount: true },
    });

    const totalIncome = new Decimal(income._sum.amount || 0);

    if (totalIncome.greaterThan(0)) {
      // Estimate 25% tax rate
      const estimatedTax = totalIncome.mul(0.25);

      const suggestion = await this.prisma.taxSuggestion.create({
        data: {
          organisationId,
          type: 'QUARTERLY_ESTIMATE',
          category: 'optimization',
          title: `Q${currentQuarter} Estimated Tax`,
          description: `Based on your income of ${totalIncome.toFixed(2)} this quarter, you should set aside approximately ${estimatedTax.toFixed(2)} for estimated taxes.`,
          potentialSavings: new Decimal(0), // This is not a saving, but a reminder
          priority: 'HIGH',
          actionUrl: '/tax/filing',
          actionLabel: 'View Tax Estimates',
          metadata: {
            quarter: currentQuarter,
            income: totalIncome.toString(),
            estimatedTax: estimatedTax.toString(),
          },
        },
      });

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * Check if user tracks mileage, calculate potential savings
   */
  async analyzeMileageOpportunity(organisationId: string) {
    const suggestions = [];

    // Check if mileage tracking exists
    const mileageCount = await this.prisma.mileageEntry.count({
      where: { organisationId },
    });

    if (mileageCount === 0) {
      // User doesn't track mileage - suggest they start
      const suggestion = await this.prisma.taxSuggestion.create({
        data: {
          organisationId,
          type: 'MILEAGE_DEDUCTION',
          category: 'deduction',
          title: 'Track Mileage for Tax Deductions',
          description: 'Start tracking your business mileage. The standard mileage rate is $0.67/mile (2024). If you drive 1,000 miles/month for business, that\'s $8,040/year in deductions.',
          potentialSavings: new Decimal(2010), // $8040 * 25% tax rate
          priority: 'MEDIUM',
          actionUrl: '/mileage',
          actionLabel: 'Start Tracking',
          metadata: {
            standardRate: 0.67,
            exampleMiles: 12000,
            exampleDeduction: 8040,
          },
        },
      });

      suggestions.push(suggestion);
    } else {
      // Check if they've tracked any miles in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentMileage = await this.prisma.mileageEntry.count({
        where: {
          organisationId,
          date: { gte: thirtyDaysAgo },
        },
      });

      if (recentMileage === 0) {
        const suggestion = await this.prisma.taxSuggestion.create({
          data: {
            organisationId,
            type: 'MILEAGE_DEDUCTION',
            category: 'warning',
            title: 'No Recent Mileage Entries',
            description: 'You haven\'t logged any mileage in the last 30 days. Remember to track your business miles to maximize deductions.',
            priority: 'LOW',
            actionUrl: '/mileage',
            actionLabel: 'Log Mileage',
          },
        });

        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Check if home office deduction applies
   */
  async analyzeHomeOffice(organisationId: string) {
    const suggestions = [];

    // Check if they have any home office related expenses
    const homeOfficeExpenses = await this.prisma.transaction.count({
      where: {
        organisationId,
        type: 'EXPENSE',
        OR: [
          { description: { contains: 'rent', mode: 'insensitive' } },
          { description: { contains: 'mortgage', mode: 'insensitive' } },
          { description: { contains: 'utilities', mode: 'insensitive' } },
          { description: { contains: 'internet', mode: 'insensitive' } },
        ],
      },
    });

    if (homeOfficeExpenses === 0) {
      // Suggest home office deduction
      const suggestion = await this.prisma.taxSuggestion.create({
        data: {
          organisationId,
          type: 'HOME_OFFICE',
          category: 'deduction',
          title: 'Consider Home Office Deduction',
          description: 'If you use part of your home exclusively for business, you may qualify for the home office deduction. This can include a portion of rent, mortgage interest, utilities, and insurance.',
          potentialSavings: new Decimal(1500), // Average home office deduction
          priority: 'MEDIUM',
          actionUrl: '/tax/deductions',
          actionLabel: 'Learn More',
          metadata: {
            deductionType: 'home_office',
            simplifiedMethod: true,
          },
        },
      });

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * Check for depreciable assets
   */
  async analyzeEquipmentDepreciation(organisationId: string) {
    const suggestions = [];

    // Look for large equipment purchases in the current year
    const yearStart = new Date(new Date().getFullYear(), 0, 1);

    const equipmentExpenses = await this.prisma.transaction.findMany({
      where: {
        organisationId,
        type: 'EXPENSE',
        amount: { gte: new Decimal(500) }, // Equipment over $500
        date: { gte: yearStart },
        OR: [
          { description: { contains: 'computer', mode: 'insensitive' } },
          { description: { contains: 'laptop', mode: 'insensitive' } },
          { description: { contains: 'equipment', mode: 'insensitive' } },
          { description: { contains: 'machinery', mode: 'insensitive' } },
          { description: { contains: 'furniture', mode: 'insensitive' } },
        ],
      },
    });

    if (equipmentExpenses.length > 0) {
      const totalEquipment = equipmentExpenses.reduce(
        (sum, exp) => sum.add(exp.amount),
        new Decimal(0),
      );

      const suggestion = await this.prisma.taxSuggestion.create({
        data: {
          organisationId,
          type: 'EQUIPMENT_DEPRECIATION',
          category: 'optimization',
          title: 'Equipment Depreciation Opportunity',
          description: `You've purchased ${totalEquipment.toFixed(2)} in equipment this year. Consider Section 179 deduction or bonus depreciation to write off these purchases immediately instead of depreciating over time.`,
          potentialSavings: totalEquipment.mul(0.25), // 25% tax rate
          priority: 'MEDIUM',
          actionUrl: '/tax/deductions',
          actionLabel: 'Review Equipment',
          metadata: {
            equipmentCount: equipmentExpenses.length,
            totalValue: totalEquipment.toString(),
          },
        },
      });

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * Suggest retirement contributions for tax benefits
   */
  async analyzeRetirementContributions(organisationId: string) {
    const suggestions = [];

    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { country: true },
    });

    // Only for countries with retirement contribution deductions (e.g., US)
    if (org?.country !== 'US') {
      return suggestions;
    }

    // Check if they have any retirement-related transactions
    const retirementExpenses = await this.prisma.transaction.count({
      where: {
        organisationId,
        type: 'EXPENSE',
        OR: [
          { description: { contains: '401k', mode: 'insensitive' } },
          { description: { contains: 'ira', mode: 'insensitive' } },
          { description: { contains: 'sep', mode: 'insensitive' } },
          { description: { contains: 'retirement', mode: 'insensitive' } },
        ],
      },
    });

    if (retirementExpenses === 0) {
      const suggestion = await this.prisma.taxSuggestion.create({
        data: {
          organisationId,
          type: 'RETIREMENT_CONTRIBUTION',
          category: 'optimization',
          title: 'Retirement Contributions Reduce Taxes',
          description: 'Contributions to retirement accounts like SEP IRA, Solo 401(k), or SIMPLE IRA are tax-deductible and can significantly reduce your taxable income. For 2024, you can contribute up to $69,000 to a SEP IRA or Solo 401(k).',
          potentialSavings: new Decimal(17250), // Max contribution * 25% tax rate
          priority: 'MEDIUM',
          actionUrl: '/tax/deductions',
          actionLabel: 'Learn More',
          metadata: {
            maxContribution: 69000,
            accountTypes: ['SEP IRA', 'Solo 401(k)', 'SIMPLE IRA'],
          },
        },
      });

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * Analyze expense categorization
   */
  async analyzeExpenseCategorization(organisationId: string) {
    const suggestions = [];

    // Count expenses by categorization status
    const totalExpenses = await this.prisma.transaction.count({
      where: {
        organisationId,
        type: 'EXPENSE',
      },
    });

    const categorizedExpenses = await this.prisma.transaction.count({
      where: {
        organisationId,
        type: 'EXPENSE',
        category: { not: null },
      },
    });

    const uncategorizedCount = totalExpenses - categorizedExpenses;
    const categorizationRate = totalExpenses > 0 ? (categorizedExpenses / totalExpenses) * 100 : 100;

    if (categorizationRate < 80 && uncategorizedCount > 5) {
      const suggestion = await this.prisma.taxSuggestion.create({
        data: {
          organisationId,
          type: 'EXPENSE_CATEGORIZATION',
          category: 'warning',
          title: 'Improve Expense Categorization',
          description: `Only ${categorizationRate.toFixed(0)}% of your expenses are categorized. Proper categorization helps maximize deductions and simplifies tax filing. You have ${uncategorizedCount} uncategorized expenses.`,
          priority: 'MEDIUM',
          actionUrl: '/finance/expenses',
          actionLabel: 'Categorize Expenses',
          metadata: {
            totalExpenses,
            categorizedExpenses,
            uncategorizedCount,
            categorizationRate: categorizationRate.toFixed(2),
          },
        },
      });

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  // ============================================================================
  // DEADLINE METHODS
  // ============================================================================

  /**
   * Generate tax deadlines based on country
   */
  async generateDeadlines(organisationId: string, country?: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { country: true },
    });

    const targetCountry = country || org?.country || 'US';
    const templates = TAX_DEADLINES[targetCountry];

    if (!templates) {
      this.logger.warn(`No deadline templates found for country: ${targetCountry}`);
      return [];
    }

    const currentYear = new Date().getFullYear();
    const deadlines = [];

    for (const template of templates) {
      if (template.recurring === 'monthly') {
        // Generate 12 monthly deadlines
        for (let month = 1; month <= 12; month++) {
          const dueDate = new Date(currentYear, month - 1, template.day);
          const reminderDate = new Date(dueDate);
          reminderDate.setDate(reminderDate.getDate() - 7); // 7 days before

          const deadline = await this.prisma.taxDeadline.create({
            data: {
              organisationId,
              name: `${template.name} - ${this.getMonthName(month)}`,
              description: template.description,
              country: targetCountry,
              type: template.type,
              dueDate,
              reminderDate,
              status: this.getDeadlineStatus(dueDate),
            },
          });

          deadlines.push(deadline);
        }
      } else if (template.recurring === 'quarterly') {
        // Generate 4 quarterly deadlines
        const quarterMonths = [3, 6, 9, 12]; // End of each quarter
        for (let i = 0; i < 4; i++) {
          const month = quarterMonths[i];
          const dueDate = new Date(currentYear, month - 1, template.day);
          const reminderDate = new Date(dueDate);
          reminderDate.setDate(reminderDate.getDate() - 14); // 14 days before

          const deadline = await this.prisma.taxDeadline.create({
            data: {
              organisationId,
              name: `${template.name} - Q${i + 1}`,
              description: template.description,
              country: targetCountry,
              type: template.type,
              dueDate,
              reminderDate,
              status: this.getDeadlineStatus(dueDate),
            },
          });

          deadlines.push(deadline);
        }
      } else {
        // Annual or one-time deadline
        const dueDate = new Date(currentYear, (template.month || 1) - 1, template.day);
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - 30); // 30 days before

        const deadline = await this.prisma.taxDeadline.create({
          data: {
            organisationId,
            name: template.name,
            description: template.description,
            country: targetCountry,
            type: template.type,
            dueDate,
            reminderDate,
            status: this.getDeadlineStatus(dueDate),
          },
        });

        deadlines.push(deadline);
      }
    }

    return deadlines;
  }

  /**
   * Get upcoming deadlines
   */
  async getUpcomingDeadlines(organisationId: string, days: number = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.taxDeadline.findMany({
      where: {
        organisationId,
        dueDate: {
          gte: now,
          lte: futureDate,
        },
        status: {
          in: ['UPCOMING', 'DUE_SOON'],
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  /**
   * Check for overdue deadlines
   */
  async checkOverdueDeadlines(organisationId: string) {
    const now = new Date();

    return this.prisma.taxDeadline.findMany({
      where: {
        organisationId,
        dueDate: { lt: now },
        status: { not: 'FILED' },
      },
      orderBy: {
        dueDate: 'desc',
      },
    });
  }

  // ============================================================================
  // CRUD METHODS
  // ============================================================================

  /**
   * Get suggestions with filters
   */
  async getSuggestions(organisationId: string, filters?: TaxSuggestionFiltersDto) {
    return this.prisma.taxSuggestion.findMany({
      where: {
        organisationId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.priority && { priority: filters.priority }),
      },
      orderBy: [
        { priority: 'desc' }, // HIGH first
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get suggestion summary (total potential savings)
   */
  async getSuggestionSummary(organisationId: string) {
    const activeSuggestions = await this.prisma.taxSuggestion.findMany({
      where: {
        organisationId,
        status: 'PENDING',
      },
    });

    const totalPotentialSavings = activeSuggestions.reduce(
      (sum, suggestion) => sum.add(suggestion.potentialSavings || new Decimal(0)),
      new Decimal(0),
    );

    const breakdown = {
      HIGH: { count: 0, savings: new Decimal(0) },
      MEDIUM: { count: 0, savings: new Decimal(0) },
      LOW: { count: 0, savings: new Decimal(0) },
    };

    activeSuggestions.forEach((suggestion) => {
      breakdown[suggestion.priority].count++;
      breakdown[suggestion.priority].savings = breakdown[suggestion.priority].savings.add(
        suggestion.potentialSavings || new Decimal(0),
      );
    });

    return {
      totalSuggestions: activeSuggestions.length,
      totalPotentialSavings: totalPotentialSavings.toNumber(),
      byPriority: {
        HIGH: {
          count: breakdown.HIGH.count,
          savings: breakdown.HIGH.savings.toNumber(),
        },
        MEDIUM: {
          count: breakdown.MEDIUM.count,
          savings: breakdown.MEDIUM.savings.toNumber(),
        },
        LOW: {
          count: breakdown.LOW.count,
          savings: breakdown.LOW.savings.toNumber(),
        },
      },
    };
  }

  /**
   * Dismiss a suggestion
   */
  async dismissSuggestion(id: string, organisationId: string) {
    const suggestion = await this.prisma.taxSuggestion.findFirst({
      where: { id, organisationId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    return this.prisma.taxSuggestion.update({
      where: { id },
      data: {
        status: 'DISMISSED',
        dismissedAt: new Date(),
      },
    });
  }

  /**
   * Mark suggestion as complete (acted upon)
   */
  async completeSuggestion(id: string, organisationId: string) {
    const suggestion = await this.prisma.taxSuggestion.findFirst({
      where: { id, organisationId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    return this.prisma.taxSuggestion.update({
      where: { id },
      data: {
        status: 'ACTED',
        completedAt: new Date(),
      },
    });
  }

  // ============================================================================
  // CRON JOBS
  // ============================================================================

  /**
   * Daily analysis job - Run at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async dailyAnalysis() {
    this.logger.log('Running daily tax analysis for all organizations');

    const organisations = await this.prisma.organisation.findMany({
      select: { id: true, country: true },
    });

    for (const org of organisations) {
      try {
        // Run analysis for each organization
        await this.analyzeTaxSavings(org.id);

        // Update deadline statuses
        await this.updateDeadlineStatuses(org.id);

        // Expire old suggestions (older than 90 days)
        await this.expireOldSuggestions(org.id);
      } catch (error) {
        this.logger.error(
          `Failed to run analysis for organization ${org.id}: ${error.message}`,
          error.stack,
        );
      }
    }

    this.logger.log('Daily tax analysis completed');
  }

  /**
   * Update deadline statuses based on due dates
   */
  private async updateDeadlineStatuses(organisationId: string) {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Mark as DUE_SOON (within 7 days)
    await this.prisma.taxDeadline.updateMany({
      where: {
        organisationId,
        dueDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        status: 'UPCOMING',
      },
      data: {
        status: 'DUE_SOON',
      },
    });

    // Mark as OVERDUE
    await this.prisma.taxDeadline.updateMany({
      where: {
        organisationId,
        dueDate: { lt: now },
        status: { not: 'FILED' },
      },
      data: {
        status: 'OVERDUE',
      },
    });
  }

  /**
   * Expire old suggestions
   */
  private async expireOldSuggestions(organisationId: string) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    await this.prisma.taxSuggestion.updateMany({
      where: {
        organisationId,
        status: 'PENDING',
        createdAt: { lt: ninetyDaysAgo },
      },
      data: {
        status: 'EXPIRED',
      },
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getDeadlineStatus(dueDate: Date): 'UPCOMING' | 'DUE_SOON' | 'OVERDUE' | 'FILED' {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    if (dueDate < now) {
      return 'OVERDUE';
    } else if (dueDate <= sevenDaysFromNow) {
      return 'DUE_SOON';
    } else {
      return 'UPCOMING';
    }
  }

  private getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1];
  }
}
