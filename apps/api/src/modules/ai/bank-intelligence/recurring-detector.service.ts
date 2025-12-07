/**
 * Recurring Transaction Detector Service
 * Detects recurring transactions, subscriptions, and regular payments
 * from bank transaction history
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  RecurringPattern,
  UpcomingPayment,
  RecurringSummary,
  DetectionOptions,
  IntervalAnalysis,
  VendorGroup,
} from './types/recurring.types';
import {
  differenceInDays,
  addDays,
  addWeeks,
  addMonths,
  addQuarters,
  addYears,
  isAfter,
  isBefore,
  startOfDay,
} from 'date-fns';
import { vendorMatcher } from './matchers/vendor-matcher';
import { TaxCategory } from './types/tax-categories.types';

/**
 * Known subscription patterns for quick recognition
 */
const SUBSCRIPTION_PATTERNS = {
  // Cloud Services
  'aws': { category: 'Cloud Services', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },
  'amazon web services': { category: 'Cloud Services', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },
  'google cloud': { category: 'Cloud Services', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },
  'gcp': { category: 'Cloud Services', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },
  'azure': { category: 'Cloud Services', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },
  'microsoft azure': { category: 'Cloud Services', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },
  'digitalocean': { category: 'Cloud Services', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },
  'heroku': { category: 'Cloud Services', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },

  // Dev Tools
  'github': { category: 'Development Tools', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },
  'gitlab': { category: 'Development Tools', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },
  'bitbucket': { category: 'Development Tools', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },
  'jetbrains': { category: 'Development Tools', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'yearly' },

  // Communication
  'slack': { category: 'Communication', taxCategory: TaxCategory.TELEFON_INTERNET, typical: 'monthly' },
  'zoom': { category: 'Communication', taxCategory: TaxCategory.TELEFON_INTERNET, typical: 'monthly' },
  'microsoft teams': { category: 'Communication', taxCategory: TaxCategory.TELEFON_INTERNET, typical: 'monthly' },

  // Design
  'adobe': { category: 'Design Software', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },
  'figma': { category: 'Design Software', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },
  'canva': { category: 'Design Software', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },

  // Productivity
  'office 365': { category: 'Office Software', taxCategory: TaxCategory.BUEROKOSTEN, typical: 'monthly' },
  'microsoft 365': { category: 'Office Software', taxCategory: TaxCategory.BUEROKOSTEN, typical: 'monthly' },
  'google workspace': { category: 'Office Software', taxCategory: TaxCategory.BUEROKOSTEN, typical: 'monthly' },
  'dropbox': { category: 'Cloud Storage', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },

  // Payment Processing
  'stripe': { category: 'Payment Processing', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },
  'paypal': { category: 'Payment Processing', taxCategory: TaxCategory.SONSTIGE_KOSTEN, typical: 'monthly' },

  // Entertainment (likely not business)
  'spotify': { category: 'Entertainment', taxCategory: TaxCategory.PRIVATE_ENTNAHME, typical: 'monthly' },
  'netflix': { category: 'Entertainment', taxCategory: TaxCategory.PRIVATE_ENTNAHME, typical: 'monthly' },

  // Financial
  'insurance': { category: 'Insurance', taxCategory: TaxCategory.VERSICHERUNGEN, typical: 'monthly' },
  'versicherung': { category: 'Insurance', taxCategory: TaxCategory.VERSICHERUNGEN, typical: 'monthly' },
  'miete': { category: 'Rent', taxCategory: TaxCategory.MIETE_PACHT, typical: 'monthly' },
  'rent': { category: 'Rent', taxCategory: TaxCategory.MIETE_PACHT, typical: 'monthly' },
};

@Injectable()
export class RecurringDetectorService {
  private readonly logger = new Logger(RecurringDetectorService.name);

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('Recurring Detector Service initialized');
  }

  /**
   * Detect all recurring transactions for an organization
   */
  async detectRecurringTransactions(
    organizationId: string,
    options?: DetectionOptions,
  ): Promise<RecurringPattern[]> {
    const startTime = Date.now();

    const opts = {
      minOccurrences: options?.minOccurrences ?? 2,
      lookbackDays: options?.lookbackDays ?? 365,
      includeEnded: options?.includeEnded ?? false,
      minConfidence: options?.minConfidence ?? 60,
      vendorName: options?.vendorName,
      activeOnly: options?.activeOnly ?? false,
    };

    this.logger.log(
      `Detecting recurring transactions for org ${organizationId} (lookback: ${opts.lookbackDays} days, min occurrences: ${opts.minOccurrences})`,
    );

    // Step 1: Fetch all debit transactions within lookback period
    const lookbackDate = addDays(new Date(), -opts.lookbackDays);
    const transactions = await this.fetchTransactions(organizationId, lookbackDate);

    this.logger.debug(`Fetched ${transactions.length} debit transactions`);

    if (transactions.length === 0) {
      return [];
    }

    // Step 2: Group transactions by vendor
    const vendorGroups = this.groupByVendor(transactions, opts.vendorName);

    this.logger.debug(`Grouped into ${vendorGroups.length} unique vendors`);

    // Step 3: Analyze each vendor group for patterns
    const patterns: RecurringPattern[] = [];

    for (const group of vendorGroups) {
      if (group.transactions.length < opts.minOccurrences) {
        continue;
      }

      const pattern = this.analyzeVendorGroup(group);

      if (pattern && pattern.confidence >= opts.minConfidence) {
        // Filter by active status if requested
        if (opts.activeOnly && !pattern.isActive) {
          continue;
        }

        // Filter by ended status if requested
        if (!opts.includeEnded && pattern.status === 'ended') {
          continue;
        }

        patterns.push(pattern);
      }
    }

    // Step 4: Sort by total annual cost (highest first)
    patterns.sort((a, b) => {
      const annualA = this.calculateAnnualCost(a);
      const annualB = this.calculateAnnualCost(b);
      return annualB - annualA;
    });

    const processingTime = Date.now() - startTime;
    this.logger.log(
      `Detected ${patterns.length} recurring patterns in ${processingTime}ms`,
    );

    return patterns;
  }

  /**
   * Analyze a specific vendor's payment pattern
   */
  async analyzeVendorPattern(
    organizationId: string,
    vendorName: string,
  ): Promise<RecurringPattern | null> {
    this.logger.log(`Analyzing vendor pattern for: ${vendorName}`);

    const patterns = await this.detectRecurringTransactions(organizationId, {
      vendorName,
      minOccurrences: 2,
      lookbackDays: 730, // 2 years for single vendor analysis
      includeEnded: true,
    });

    return patterns.length > 0 ? patterns[0] : null;
  }

  /**
   * Predict next payments within specified days
   */
  async predictNextPayments(
    organizationId: string,
    days: number = 30,
  ): Promise<UpcomingPayment[]> {
    this.logger.log(`Predicting payments for next ${days} days`);

    const patterns = await this.detectRecurringTransactions(organizationId, {
      activeOnly: true,
      minConfidence: 70,
    });

    const cutoffDate = addDays(new Date(), days);
    const upcomingPayments: UpcomingPayment[] = [];

    for (const pattern of patterns) {
      if (
        pattern.nextExpected &&
        isAfter(pattern.nextExpected, new Date()) &&
        isBefore(pattern.nextExpected, cutoffDate)
      ) {
        const daysTillDue = differenceInDays(
          startOfDay(pattern.nextExpected),
          startOfDay(new Date()),
        );

        upcomingPayments.push({
          vendorName: pattern.vendorName,
          expectedDate: pattern.nextExpected,
          expectedAmount: pattern.averageAmount,
          confidence: pattern.confidence,
          frequency: pattern.frequency,
          lastPaymentDate: pattern.lastSeen,
          daysTillDue,
          amountRange: {
            min: pattern.minAmount,
            max: pattern.maxAmount,
          },
        });
      }
    }

    // Sort by date (soonest first)
    upcomingPayments.sort((a, b) => a.daysTillDue - b.daysTillDue);

    this.logger.log(`Found ${upcomingPayments.length} upcoming payments`);

    return upcomingPayments;
  }

  /**
   * Get comprehensive recurring expense summary
   */
  async getRecurringSummary(
    organizationId: string,
  ): Promise<RecurringSummary> {
    this.logger.log(`Generating recurring summary for org ${organizationId}`);

    const patterns = await this.detectRecurringTransactions(organizationId, {
      activeOnly: true,
      minConfidence: 60,
    });

    // Calculate totals
    const monthlyTotal = patterns.reduce(
      (sum, p) => sum + this.calculateMonthlyCost(p),
      0,
    );
    const yearlyTotal = patterns.reduce(
      (sum, p) => sum + this.calculateAnnualCost(p),
      0,
    );

    // Group by category
    const categoryMap = new Map<string, RecurringPattern[]>();
    for (const pattern of patterns) {
      const category = pattern.category || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(pattern);
    }

    const categories = Array.from(categoryMap.entries()).map(
      ([category, categoryPatterns]) => ({
        category,
        monthlyTotal: categoryPatterns.reduce(
          (sum, p) => sum + this.calculateMonthlyCost(p),
          0,
        ),
        yearlyTotal: categoryPatterns.reduce(
          (sum, p) => sum + this.calculateAnnualCost(p),
          0,
        ),
        count: categoryPatterns.length,
        patterns: categoryPatterns,
      }),
    );

    // Sort categories by yearly total
    categories.sort((a, b) => b.yearlyTotal - a.yearlyTotal);

    // Top 10 expenses
    const topRecurringExpenses = [...patterns]
      .sort((a, b) => this.calculateAnnualCost(b) - this.calculateAnnualCost(a))
      .slice(0, 10);

    // Upcoming payments
    const upcomingWeek = await this.predictNextPayments(organizationId, 7);
    const upcomingMonth = await this.predictNextPayments(organizationId, 30);

    // Potential savings analysis
    const potentialSavings = this.analyzeSavingsOpportunities(patterns);

    // Generate insights
    const insights = this.generateInsights(patterns);

    return {
      totalMonthlyRecurring: Math.round(monthlyTotal),
      totalYearlyRecurring: Math.round(yearlyTotal),
      subscriptionCount: patterns.length,
      categories,
      topRecurringExpenses,
      upcomingWeek,
      upcomingMonth,
      potentialSavings,
      insights,
    };
  }

  /**
   * Fetch debit transactions for analysis
   */
  private async fetchTransactions(
    organizationId: string,
    fromDate: Date,
  ): Promise<
    Array<{
      id: string;
      date: Date;
      description: string;
      amount: number;
      currency: string;
      counterpartyName: string | null;
      category: string | null;
    }>
  > {
    // Get all bank accounts for this organization
    const bankAccounts = await this.prisma.bankAccount.findMany({
      where: { orgId: organizationId },
      select: { id: true },
    });

    const accountIds = bankAccounts.map((acc: { id: string }) => acc.id);

    if (accountIds.length === 0) {
      return [];
    }

    // Fetch debit transactions (expenses)
    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        bankAccountId: { in: accountIds },
        date: { gte: fromDate },
        type: 'debit',
        amount: { lt: 0 }, // Negative amounts are debits
      },
      select: {
        id: true,
        date: true,
        description: true,
        amount: true,
        currency: true,
        counterpartyName: true,
        category: true,
      },
      orderBy: { date: 'asc' },
    });

    return transactions.map((tx: any) => ({
      ...tx,
      date: new Date(tx.date),
      amount: Math.abs(Number(tx.amount) * 100), // Convert to cents and make positive
    }));
  }

  /**
   * Group transactions by vendor using fuzzy matching
   */
  private groupByVendor(
    transactions: Array<{
      id: string;
      date: Date;
      description: string;
      amount: number;
      currency: string;
      counterpartyName: string | null;
    }>,
    filterVendor?: string,
  ): VendorGroup[] {
    const groups = new Map<string, VendorGroup>();

    for (const tx of transactions) {
      // Extract vendor name from description or counterparty
      const vendorName =
        tx.counterpartyName ||
        this.extractVendorName(tx.description) ||
        tx.description.substring(0, 50);

      // Normalize vendor name
      const normalized = this.normalizeVendorName(vendorName);

      // Filter if vendor name specified
      if (filterVendor) {
        const filterNormalized = this.normalizeVendorName(filterVendor);
        if (!normalized.includes(filterNormalized) && !filterNormalized.includes(normalized)) {
          continue;
        }
      }

      // Try to find existing group with fuzzy matching
      let groupKey = normalized;
      let found = false;

      for (const [existingKey, existingGroup] of groups.entries()) {
        // Check if this vendor name is similar to existing group
        const similarity = this.calculateSimilarity(normalized, existingKey);
        if (similarity > 0.85) {
          // 85% similarity threshold
          groupKey = existingKey;
          found = true;
          break;
        }
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          normalizedName: groupKey,
          nameVariations: [],
          transactions: [],
          currency: tx.currency,
        });
      }

      const group = groups.get(groupKey)!;
      if (!group.nameVariations.includes(vendorName)) {
        group.nameVariations.push(vendorName);
      }

      group.transactions.push({
        id: tx.id,
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
      });
    }

    return Array.from(groups.values());
  }

  /**
   * Analyze a vendor group to detect recurring pattern
   */
  private analyzeVendorGroup(group: VendorGroup): RecurringPattern | null {
    if (group.transactions.length < 2) {
      return null;
    }

    // Sort transactions by date
    const sortedTxs = [...group.transactions].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    // Analyze intervals
    const intervalAnalysis = this.analyzeIntervals(
      sortedTxs.map((tx) => tx.date),
    );

    if (intervalAnalysis.frequency === 'irregular') {
      return null;
    }

    // Calculate amount statistics
    const amounts = sortedTxs.map((tx) => tx.amount);
    const averageAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    const amountStdDev = this.calculateStdDev(amounts);

    // Check if active (has payment in last 2 cycles)
    const lastTx = sortedTxs[sortedTxs.length - 1];
    const expectedNextDate = intervalAnalysis.expectedNextDate;
    const daysSinceLastPayment = differenceInDays(new Date(), lastTx.date);
    const expectedGap = intervalAnalysis.averageGapDays;
    const isActive = daysSinceLastPayment <= expectedGap * 2;

    // Determine status
    let status: 'confirmed' | 'predicted' | 'ended' = 'confirmed';
    if (sortedTxs.length === 2) {
      status = 'predicted';
    } else if (!isActive) {
      status = 'ended';
    }

    // Get category from known patterns
    const normalizedLower = group.normalizedName.toLowerCase();
    let category: string | undefined;
    let taxCategory: string | undefined;

    for (const [pattern, info] of Object.entries(SUBSCRIPTION_PATTERNS)) {
      if (normalizedLower.includes(pattern)) {
        category = info.category;
        taxCategory = info.taxCategory;
        break;
      }
    }

    // Use most common display name
    const vendorName = group.nameVariations[0] || group.normalizedName;

    return {
      vendorName,
      normalizedVendorName: group.normalizedName,
      frequency: intervalAnalysis.frequency,
      averageAmount: Math.round(averageAmount),
      minAmount: Math.round(minAmount),
      maxAmount: Math.round(maxAmount),
      currency: group.currency,
      occurrences: sortedTxs.length,
      firstSeen: sortedTxs[0].date,
      lastSeen: lastTx.date,
      nextExpected: expectedNextDate,
      confidence: intervalAnalysis.confidence,
      category,
      taxCategory,
      transactions: sortedTxs.map((tx) => ({
        id: tx.id,
        date: tx.date,
        amount: tx.amount,
      })),
      isActive,
      status,
      intervalStdDev: intervalAnalysis.standardDeviation,
      amountStdDev: Math.round(amountStdDev),
    };
  }

  /**
   * Analyze transaction intervals to detect frequency
   */
  private analyzeIntervals(dates: Date[]): IntervalAnalysis {
    if (dates.length < 2) {
      return {
        frequency: 'irregular',
        averageGapDays: 0,
        standardDeviation: 0,
        confidence: 0,
        gaps: [],
        expectedNextDate: new Date(),
      };
    }

    // Calculate gaps between consecutive transactions
    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      gaps.push(differenceInDays(dates[i], dates[i - 1]));
    }

    const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const stdDev = this.calculateStdDev(gaps);

    // Calculate confidence (inverse of coefficient of variation)
    // Lower stdDev relative to average = higher confidence
    const coefficientOfVariation = averageGap > 0 ? stdDev / averageGap : 1;
    const confidence = Math.max(0, Math.min(100, 100 - coefficientOfVariation * 100));

    // Determine frequency based on average gap
    let frequency: IntervalAnalysis['frequency'] = 'irregular';
    let expectedNextDate = dates[dates.length - 1];

    // Weekly: 7 ±3 days
    if (averageGap >= 4 && averageGap <= 10) {
      frequency = 'weekly';
      expectedNextDate = addWeeks(dates[dates.length - 1], 1);
    }
    // Bi-weekly: 14 ±4 days
    else if (averageGap >= 10 && averageGap <= 18) {
      frequency = 'bi-weekly';
      expectedNextDate = addWeeks(dates[dates.length - 1], 2);
    }
    // Monthly: 28-31 ±5 days
    else if (averageGap >= 23 && averageGap <= 36) {
      frequency = 'monthly';
      expectedNextDate = addMonths(dates[dates.length - 1], 1);
    }
    // Quarterly: 85-95 days
    else if (averageGap >= 80 && averageGap <= 100) {
      frequency = 'quarterly';
      expectedNextDate = addQuarters(dates[dates.length - 1], 1);
    }
    // Yearly: 355-375 days
    else if (averageGap >= 350 && averageGap <= 380) {
      frequency = 'yearly';
      expectedNextDate = addYears(dates[dates.length - 1], 1);
    }

    return {
      frequency,
      averageGapDays: averageGap,
      standardDeviation: stdDev,
      confidence: Math.round(confidence),
      gaps,
      expectedNextDate,
    };
  }

  /**
   * Calculate monthly cost for a pattern
   */
  private calculateMonthlyCost(pattern: RecurringPattern): number {
    switch (pattern.frequency) {
      case 'weekly':
        return pattern.averageAmount * 4.33; // Average weeks per month
      case 'bi-weekly':
        return pattern.averageAmount * 2.17; // Average bi-weeks per month
      case 'monthly':
        return pattern.averageAmount;
      case 'quarterly':
        return pattern.averageAmount / 3;
      case 'yearly':
        return pattern.averageAmount / 12;
      default:
        return 0;
    }
  }

  /**
   * Calculate annual cost for a pattern
   */
  private calculateAnnualCost(pattern: RecurringPattern): number {
    return this.calculateMonthlyCost(pattern) * 12;
  }

  /**
   * Analyze potential savings opportunities
   */
  private analyzeSavingsOpportunities(
    patterns: RecurringPattern[],
  ): RecurringSummary['potentialSavings'] {
    const savings: RecurringSummary['potentialSavings'] = [];

    // Look for duplicate or similar services
    const categoryGroups = new Map<string, RecurringPattern[]>();
    for (const pattern of patterns) {
      const category = pattern.category || 'Other';
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, []);
      }
      categoryGroups.get(category)!.push(pattern);
    }

    // Check for duplicates in same category
    for (const [category, categoryPatterns] of categoryGroups.entries()) {
      if (categoryPatterns.length > 1) {
        const totalMonthlyCost = categoryPatterns.reduce(
          (sum, p) => sum + this.calculateMonthlyCost(p),
          0,
        );

        savings.push({
          vendor: categoryPatterns.map((p) => p.vendorName).join(', '),
          currentMonthlyAmount: Math.round(totalMonthlyCost),
          suggestion: `You have ${categoryPatterns.length} services in ${category}. Consider consolidating.`,
          potentialSavingsPerYear: Math.round(
            (totalMonthlyCost * 12) / categoryPatterns.length,
          ),
        });
      }
    }

    return savings;
  }

  /**
   * Generate insights about recurring patterns
   */
  private generateInsights(patterns: RecurringPattern[]): RecurringSummary['insights'] {
    const insights: RecurringSummary['insights'] = [];

    // Check for duplicate services
    const categoryGroups = new Map<string, RecurringPattern[]>();
    for (const pattern of patterns) {
      const category = pattern.category || 'Other';
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, []);
      }
      categoryGroups.get(category)!.push(pattern);
    }

    for (const [category, categoryPatterns] of categoryGroups.entries()) {
      if (categoryPatterns.length > 1 && category !== 'Other') {
        insights.push({
          type: 'DUPLICATE_SERVICES',
          message: `You have ${categoryPatterns.length} different ${category} subscriptions`,
          affectedVendors: categoryPatterns.map((p) => p.vendorName),
          potentialSavings: Math.round(
            categoryPatterns.reduce((sum, p) => sum + this.calculateAnnualCost(p), 0) / 2,
          ),
        });
      }
    }

    // Check for ended patterns (potential unused subscriptions)
    const endedPatterns = patterns.filter((p) => p.status === 'ended');
    if (endedPatterns.length > 0) {
      insights.push({
        type: 'UNUSED_SUBSCRIPTION',
        message: `${endedPatterns.length} subscriptions appear to have ended`,
        affectedVendors: endedPatterns.map((p) => p.vendorName),
      });
    }

    // Check for irregular patterns
    const irregularPatterns = patterns.filter((p) => p.confidence < 70);
    if (irregularPatterns.length > 0) {
      insights.push({
        type: 'IRREGULAR_PATTERN',
        message: `${irregularPatterns.length} subscriptions have irregular payment patterns`,
        affectedVendors: irregularPatterns.map((p) => p.vendorName),
      });
    }

    return insights;
  }

  /**
   * Normalize vendor name for matching
   */
  private normalizeVendorName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\b(gmbh|ag|ltd|limited|inc|corp|corporation|llc|bv|sa|srl|se|plc|kg|ug|ohg|gbr|ev)\b/gi, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract vendor name from transaction description
   */
  private extractVendorName(description: string): string {
    // Remove common transaction prefixes
    let cleaned = description
      .replace(/^(SEPA|Überweisung|Lastschrift|PAYMENT|DIRECT DEBIT|DD)\s*/i, '')
      .replace(/\d{2}\/\d{2}\/\d{4}/g, '') // Remove dates
      .replace(/\d+\.\d+\s*(EUR|USD|GBP)/gi, '') // Remove amounts
      .trim();

    // Take first meaningful part
    const parts = cleaned.split(/[,;\/]/);
    return parts[0].trim().substring(0, 50);
  }

  /**
   * Calculate string similarity (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
  }

  /**
   * Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1;
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map((val) => Math.pow(val - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;

    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Health check
   */
  isHealthy(): boolean {
    return !!this.prisma;
  }
}
