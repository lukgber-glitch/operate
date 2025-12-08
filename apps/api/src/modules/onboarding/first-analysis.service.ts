import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BankSyncService } from '../finance/bank-sync/bank-sync.service';
import { ClassificationService } from '../ai/classification/classification.service';
import { ProactiveSuggestionsService } from '../chatbot/suggestions/proactive-suggestions.service';
import { EventsGateway } from '../../websocket/events.gateway';
import { AnalysisStatus } from '@prisma/client';
import {
  BankAnalysisResultDto,
  EmailAnalysisResultDto,
  InsightsResultDto,
  AnalysisStatusDto as AnalysisStatusResponse,
  AnalysisResultsDto,
} from './dto/analysis.dto';

/**
 * First Analysis Service
 * Handles the initial AI analysis triggered when a user completes onboarding.
 * This provides immediate value by analyzing connected bank transactions and emails.
 *
 * Features:
 * - Async analysis (doesn't block onboarding completion)
 * - Bank transaction categorization
 * - Email invoice detection
 * - Initial insights generation
 * - WebSocket progress updates
 */
@Injectable()
export class FirstAnalysisService {
  private readonly logger = new Logger(FirstAnalysisService.name);
  private readonly TRANSACTION_LOOKBACK_DAYS = 30;
  private readonly EMAIL_LOOKBACK_DAYS = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly bankSyncService: BankSyncService,
    private readonly classificationService: ClassificationService,
    private readonly proactiveSuggestionsService: ProactiveSuggestionsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Trigger first analysis for a user
   * This is called after onboarding completion
   */
  async triggerAnalysis(
    userId: string,
    orgId: string,
    force = false,
  ): Promise<{ analysisId: string; message: string }> {
    this.logger.log(`Triggering first analysis for user ${userId}`);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Check if analysis already exists
    const existingAnalysis = await this.prisma.onboardingAnalysis.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingAnalysis && !force) {
      if (existingAnalysis.status === AnalysisStatus.COMPLETED) {
        return {
          analysisId: existingAnalysis.id,
          message: 'Analysis already completed. Use force=true to re-run.',
        };
      }

      if (
        existingAnalysis.status === AnalysisStatus.PENDING ||
        existingAnalysis.status === AnalysisStatus.ANALYZING_BANK ||
        existingAnalysis.status === AnalysisStatus.ANALYZING_EMAIL ||
        existingAnalysis.status === AnalysisStatus.GENERATING_INSIGHTS
      ) {
        return {
          analysisId: existingAnalysis.id,
          message: 'Analysis already in progress.',
        };
      }
    }

    // Create new analysis record
    const analysis = await this.prisma.onboardingAnalysis.create({
      data: {
        userId,
        status: AnalysisStatus.PENDING,
      },
    });

    // Start analysis asynchronously (don't await)
    this.executeAnalysis(analysis.id, userId, orgId).catch((error) => {
      this.logger.error(`Analysis ${analysis.id} failed:`, error);
    });

    return {
      analysisId: analysis.id,
      message: 'Analysis started. Check status for progress.',
    };
  }

  /**
   * Get analysis status
   */
  async getAnalysisStatus(userId: string): Promise<AnalysisStatusResponse | null> {
    const analysis = await this.prisma.onboardingAnalysis.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!analysis) {
      return null;
    }

    return {
      id: analysis.id,
      userId: analysis.userId,
      status: analysis.status as Prisma.InputJsonValue,
      bankAnalysis: analysis.bankAnalysis as BankAnalysisResultDto | undefined,
      emailAnalysis: analysis.emailAnalysis as EmailAnalysisResultDto | undefined,
      insights: analysis.insights as InsightsResultDto | undefined,
      startedAt: analysis.startedAt?.toISOString(),
      completedAt: analysis.completedAt?.toISOString(),
      error: analysis.error || undefined,
      createdAt: analysis.createdAt.toISOString(),
      updatedAt: analysis.updatedAt.toISOString(),
    };
  }

  /**
   * Get analysis results (only if completed)
   */
  async getAnalysisResults(userId: string): Promise<AnalysisResultsDto | null> {
    const analysis = await this.prisma.onboardingAnalysis.findFirst({
      where: {
        userId,
        status: AnalysisStatus.COMPLETED,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!analysis) {
      return null;
    }

    return {
      id: analysis.id,
      bankAnalysis: analysis.bankAnalysis as BankAnalysisResultDto,
      emailAnalysis: analysis.emailAnalysis as EmailAnalysisResultDto,
      insights: analysis.insights as InsightsResultDto,
      completedAt: analysis.completedAt!.toISOString(),
    };
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Execute the full analysis workflow
   */
  private async executeAnalysis(
    analysisId: string,
    userId: string,
    orgId: string,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Update status to started
      await this.updateAnalysisStatus(analysisId, AnalysisStatus.ANALYZING_BANK, {
        startedAt: new Date(),
      });

      this.emitProgressEvent(orgId, analysisId, 'ANALYZING_BANK', 25);

      // Step 1: Analyze bank transactions
      const bankAnalysis = await this.analyzeBankTransactions(userId, orgId);

      await this.prisma.onboardingAnalysis.update({
        where: { id: analysisId },
        data: { bankAnalysis: bankAnalysis as Prisma.InputJsonValue },
      });

      this.logger.log(
        `Bank analysis completed for ${userId}: ${bankAnalysis.transactionsProcessed} transactions processed`,
      );

      // Step 2: Analyze email invoices
      await this.updateAnalysisStatus(analysisId, AnalysisStatus.ANALYZING_EMAIL);
      this.emitProgressEvent(orgId, analysisId, 'ANALYZING_EMAIL', 50);

      const emailAnalysis = await this.analyzeEmailInvoices(userId, orgId);

      await this.prisma.onboardingAnalysis.update({
        where: { id: analysisId },
        data: { emailAnalysis: emailAnalysis as Prisma.InputJsonValue },
      });

      this.logger.log(
        `Email analysis completed for ${userId}: ${emailAnalysis.emailsScanned} emails scanned`,
      );

      // Step 3: Generate insights
      await this.updateAnalysisStatus(analysisId, AnalysisStatus.GENERATING_INSIGHTS);
      this.emitProgressEvent(orgId, analysisId, 'GENERATING_INSIGHTS', 75);

      const insights = await this.generateInsights(
        userId,
        orgId,
        bankAnalysis,
        emailAnalysis,
      );

      // Mark as completed
      await this.prisma.onboardingAnalysis.update({
        where: { id: analysisId },
        data: {
          insights: insights as Prisma.InputJsonValue,
          status: AnalysisStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      const duration = Date.now() - startTime;
      this.logger.log(
        `Analysis ${analysisId} completed successfully in ${duration}ms`,
      );

      this.emitProgressEvent(orgId, analysisId, 'COMPLETED', 100);
    } catch (error) {
      this.logger.error(`Analysis ${analysisId} failed:`, error);

      await this.prisma.onboardingAnalysis.update({
        where: { id: analysisId },
        data: {
          status: AnalysisStatus.FAILED,
          error: error.message || 'Unknown error',
          completedAt: new Date(),
        },
      });

      this.emitProgressEvent(orgId, analysisId, 'FAILED', 0);
    }
  }

  /**
   * Analyze bank transactions
   */
  private async analyzeBankTransactions(
    userId: string,
    orgId: string,
  ): Promise<BankAnalysisResultDto> {
    this.logger.debug(`Analyzing bank transactions for user ${userId}`);

    try {
      // Get bank connections
      const connections = await this.prisma.bankConnection.findMany({
        where: {
          orgId,
          status: 'ACTIVE',
        },
        include: {
          accounts: {
            where: { isActive: true },
            include: {
              transactions: {
                where: {
                  bookingDate: {
                    gte: new Date(Date.now() - this.TRANSACTION_LOOKBACK_DAYS * 24 * 60 * 60 * 1000),
                  },
                },
                orderBy: { bookingDate: 'desc' },
              },
            },
          },
        },
      });

      if (connections.length === 0) {
        return {
          transactionsProcessed: 0,
          categorized: 0,
          deductionsFound: 0,
          recurringExpenses: [],
          topCategories: [],
        };
      }

      // Collect all transactions
      const allTransactions = connections
        .flatMap((conn) => conn.accounts)
        .flatMap((account) => account.transactions);

      // Classify transactions in batches
      let categorized = 0;
      let deductionsFound = 0;
      const categories = new Map<string, { amount: number; count: number }>();

      for (const tx of allTransactions) {
        try {
          const result = await this.classificationService.classifyTransaction({
            id: tx.id,
            description: tx.description,
            amount: Number(tx.amount),
            currency: tx.currency,
            date: tx.bookingDate.toISOString(),
            counterparty: tx.merchantName || undefined,
            mccCode: tx.merchantCategory || undefined,
          });

          categorized++;

          // Track categories
          const existing = categories.get(result.category) || { amount: 0, count: 0 };
          categories.set(result.category, {
            amount: existing.amount + Math.abs(Number(tx.amount)),
            count: existing.count + 1,
          });

          // Count tax-relevant items
          if (result.taxRelevant) {
            deductionsFound++;
          }
        } catch (error) {
          this.logger.warn(`Failed to classify transaction ${tx.id}:`, error.message);
        }
      }

      // Identify recurring expenses (simple heuristic: similar amounts and descriptions)
      const recurringExpenses = this.identifyRecurringExpenses(allTransactions);

      // Get top 5 categories
      const topCategories = Array.from(categories.entries())
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          count: data.count,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      return {
        transactionsProcessed: allTransactions.length,
        categorized,
        deductionsFound,
        recurringExpenses,
        topCategories,
      };
    } catch (error) {
      this.logger.error('Bank transaction analysis failed:', error);
      return {
        transactionsProcessed: 0,
        categorized: 0,
        deductionsFound: 0,
        recurringExpenses: [],
        topCategories: [],
      };
    }
  }

  /**
   * Analyze email invoices
   */
  private async analyzeEmailInvoices(
    userId: string,
    orgId: string,
  ): Promise<EmailAnalysisResultDto> {
    this.logger.debug(`Analyzing email invoices for user ${userId}`);

    try {
      // Get email connections
      const emailConnections = await this.prisma.emailConnection.findMany({
        where: {
          orgId,
          status: 'CONNECTED',
        },
      });

      if (emailConnections.length === 0) {
        return {
          emailsScanned: 0,
          invoicesFound: 0,
          matched: 0,
          draftsCreated: [],
        };
      }

      // For now, return placeholder data
      // In production, this would scan emails for invoices using the email integration service
      // and match them with bank transactions

      return {
        emailsScanned: 0,
        invoicesFound: 0,
        matched: 0,
        draftsCreated: [],
      };
    } catch (error) {
      this.logger.error('Email invoice analysis failed:', error);
      return {
        emailsScanned: 0,
        invoicesFound: 0,
        matched: 0,
        draftsCreated: [],
      };
    }
  }

  /**
   * Generate insights from analysis data
   */
  private async generateInsights(
    userId: string,
    orgId: string,
    bankAnalysis: BankAnalysisResultDto,
    emailAnalysis: EmailAnalysisResultDto,
  ): Promise<InsightsResultDto> {
    this.logger.debug(`Generating insights for user ${userId}`);

    try {
      // Calculate monthly spending
      const totalSpending = bankAnalysis.topCategories.reduce(
        (sum, cat) => sum + cat.amount,
        0,
      );

      // Get tax suggestions from proactive suggestions service
      const taxSuggestions = await this.proactiveSuggestionsService
        .getOptimizations(orgId)
        .then((opts) => opts.map((opt) => opt.description))
        .catch(() => []);

      // Build insights
      const insights: InsightsResultDto = {
        monthlySpending: {
          total: totalSpending,
          currency: 'EUR', // TODO: Get from org settings
          period: `Last ${this.TRANSACTION_LOOKBACK_DAYS} days`,
        },
        topCategories: bankAnalysis.topCategories.map((cat) => ({
          category: cat.category,
          amount: cat.amount,
          percentage: totalSpending > 0 ? (cat.amount / totalSpending) * 100 : 0,
        })),
        upcomingPayments: [], // TODO: Detect from recurring expenses
        taxSuggestions:
          taxSuggestions.length > 0
            ? taxSuggestions
            : [
                'Review your business expenses for potential deductions',
                'Keep digital copies of all receipts and invoices',
                'Consider quarterly tax prepayments to avoid penalties',
              ],
        costSavings: this.generateCostSavingsSuggestions(bankAnalysis),
      };

      return insights;
    } catch (error) {
      this.logger.error('Insights generation failed:', error);
      throw error;
    }
  }

  /**
   * Identify recurring expenses (simple pattern matching)
   */
  private identifyRecurringExpenses(
    transactions: any[],
  ): Array<{ description: string; amount: number; frequency: string }> {
    // Group transactions by similar description and amount
    const groups = new Map<
      string,
      Array<{ date: Date; amount: number; description: string }>
    >();

    for (const tx of transactions) {
      if (Number(tx.amount) >= 0) continue; // Only expenses

      const normalizedDesc = tx.description
        .toLowerCase()
        .replace(/\d+/g, '')
        .trim();
      const key = `${normalizedDesc}:${Math.round(Math.abs(Number(tx.amount)))}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)!.push({
        date: tx.bookingDate,
        amount: Math.abs(Number(tx.amount)),
        description: tx.description,
      });
    }

    // Find recurring patterns (3+ occurrences)
    const recurring: Array<{ description: string; amount: number; frequency: string }> =
      [];

    for (const [key, txs] of groups.entries()) {
      if (txs.length >= 3) {
        recurring.push({
          description: txs[0].description,
          amount: txs[0].amount,
          frequency: this.detectFrequency(txs),
        });
      }
    }

    return recurring.slice(0, 5); // Top 5
  }

  /**
   * Detect frequency of recurring transactions
   */
  private detectFrequency(transactions: Array<{ date: Date }>): string {
    if (transactions.length < 2) return 'unknown';

    const dates = transactions.map((tx) => tx.date.getTime()).sort((a, b) => a - b);
    const intervals: number[] = [];

    for (let i = 1; i < dates.length; i++) {
      intervals.push(dates[i] - dates[i - 1]);
    }

    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const daysInterval = avgInterval / (1000 * 60 * 60 * 24);

    if (daysInterval < 8) return 'weekly';
    if (daysInterval < 35) return 'monthly';
    if (daysInterval < 100) return 'quarterly';
    return 'unknown';
  }

  /**
   * Generate cost-saving suggestions
   */
  private generateCostSavingsSuggestions(
    bankAnalysis: BankAnalysisResultDto,
  ): Array<{ category: string; suggestion: string; potentialSavings: number }> {
    const suggestions: Array<{
      category: string;
      suggestion: string;
      potentialSavings: number;
    }> = [];

    // Analyze top categories for savings opportunities
    for (const cat of bankAnalysis.topCategories.slice(0, 3)) {
      if (cat.amount > 500) {
        suggestions.push({
          category: cat.category,
          suggestion: `Review ${cat.category} expenses - found ${cat.count} transactions totaling €${cat.amount.toFixed(2)}`,
          potentialSavings: cat.amount * 0.1, // Estimate 10% savings
        });
      }
    }

    return suggestions;
  }

  /**
   * Update analysis status
   */
  private async updateAnalysisStatus(
    analysisId: string,
    status: AnalysisStatus,
    additionalData?: any,
  ): Promise<void> {
    await this.prisma.onboardingAnalysis.update({
      where: { id: analysisId },
      data: {
        status,
        ...additionalData,
      },
    });
  }

  /**
   * Emit WebSocket progress event
   */
  private emitProgressEvent(
    orgId: string,
    analysisId: string,
    status: string,
    progress: number,
  ): void {
    try {
      this.eventsGateway.emitToOrganization(orgId, 'onboarding:analysis:progress', {
        analysisId,
        status,
        progress,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn(`Failed to emit progress event: ${error.message}`);
    }
  }
}
