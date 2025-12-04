/**
 * Transaction Categorization Service
 * AI-powered categorization for bank transactions using rule-based patterns
 *
 * Features:
 * - Merchant name pattern matching
 * - MCC code mapping
 * - Keyword analysis
 * - Historical pattern learning
 * - Multi-suggestion ranking
 * - Confidence scoring
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ExpenseCategory } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CategorizationRequest,
  CategorizationResult,
  CategorySuggestion,
  BatchCategorizationResult,
  PatternMatch,
  HistoricalPattern,
  MCCMapping,
  LearningData,
} from './transaction-categorization.types';

@Injectable()
export class TransactionCategorizationService {
  private readonly logger = new Logger(TransactionCategorizationService.name);

  // Merchant name patterns (case-insensitive regex patterns)
  private readonly merchantPatterns: Map<RegExp, ExpenseCategory> = new Map([
    // Office & Software
    [/amazon|office depot|staples|office supply/i, ExpenseCategory.OFFICE],
    [/adobe|microsoft|google workspace|slack|zoom|dropbox|notion|asana/i, ExpenseCategory.SOFTWARE],
    [/github|aws|azure|digitalocean|heroku|vercel/i, ExpenseCategory.SOFTWARE],

    // Travel & Transport
    [/uber|lyft|taxi|lufthansa|ryanair|booking|airbnb|hotel|expedia/i, ExpenseCategory.TRAVEL],
    [/shell|bp|esso|total|aral|tankstelle|petrol|gas station/i, ExpenseCategory.TRAVEL],
    [/deutsche bahn|db|train|railway|bus|metro/i, ExpenseCategory.TRAVEL],

    // Meals & Entertainment
    [/restaurant|cafe|coffee|starbucks|mcdonald|burger|pizza|diner/i, ExpenseCategory.MEALS],
    [/bar|pub|brewery|wine|bistro|cantina/i, ExpenseCategory.ENTERTAINMENT],

    // Utilities
    [/telekom|vodafone|o2|internet|phone|mobile|electricity|gas|water/i, ExpenseCategory.UTILITIES],
    [/stadtwerke|energie|strom|power|heating/i, ExpenseCategory.UTILITIES],

    // Professional Services
    [/lawyer|attorney|legal|steuerberater|accountant|consultant|beratung/i, ExpenseCategory.PROFESSIONAL_SERVICES],
    [/notary|notar|audit|rechtsanwalt/i, ExpenseCategory.PROFESSIONAL_SERVICES],

    // Equipment
    [/apple|dell|hp|lenovo|computer|laptop|printer|monitor|equipment/i, ExpenseCategory.EQUIPMENT],
    [/furniture|desk|chair|office furniture/i, ExpenseCategory.EQUIPMENT],

    // Insurance
    [/versicherung|insurance|allianz|axa|ergo/i, ExpenseCategory.INSURANCE],

    // Rent
    [/miete|rent|lease|immobilien|property/i, ExpenseCategory.RENT],
  ]);

  // MCC code mappings (Merchant Category Codes)
  private readonly mccMappings: Map<string, MCCMapping> = new Map([
    // Office & Software
    ['5734', { code: '5734', description: 'Computer Software Stores', category: ExpenseCategory.SOFTWARE, confidence: 0.95 }],
    ['5045', { code: '5045', description: 'Computer/Peripherals', category: ExpenseCategory.EQUIPMENT, confidence: 0.90 }],
    ['5943', { code: '5943', description: 'Stationery Stores', category: ExpenseCategory.OFFICE, confidence: 0.90 }],

    // Travel & Transport
    ['3000', { code: '3000', description: 'Airlines', category: ExpenseCategory.TRAVEL, confidence: 0.95 }],
    ['3504', { code: '3504', description: 'Hotels/Motels', category: ExpenseCategory.TRAVEL, confidence: 0.95 }],
    ['5541', { code: '5541', description: 'Service Stations', category: ExpenseCategory.TRAVEL, confidence: 0.85 }],
    ['4111', { code: '4111', description: 'Transportation', category: ExpenseCategory.TRAVEL, confidence: 0.90 }],
    ['7011', { code: '7011', description: 'Lodging', category: ExpenseCategory.TRAVEL, confidence: 0.95 }],

    // Meals & Entertainment
    ['5812', { code: '5812', description: 'Eating Places/Restaurants', category: ExpenseCategory.MEALS, confidence: 0.90 }],
    ['5814', { code: '5814', description: 'Fast Food Restaurants', category: ExpenseCategory.MEALS, confidence: 0.90 }],
    ['5813', { code: '5813', description: 'Bars/Taverns', category: ExpenseCategory.ENTERTAINMENT, confidence: 0.85 }],

    // Utilities
    ['4814', { code: '4814', description: 'Telecommunication', category: ExpenseCategory.UTILITIES, confidence: 0.95 }],
    ['4900', { code: '4900', description: 'Utilities', category: ExpenseCategory.UTILITIES, confidence: 0.95 }],

    // Professional Services
    ['8111', { code: '8111', description: 'Legal Services', category: ExpenseCategory.PROFESSIONAL_SERVICES, confidence: 0.95 }],
    ['8931', { code: '8931', description: 'Accounting Services', category: ExpenseCategory.PROFESSIONAL_SERVICES, confidence: 0.95 }],
  ]);

  // Keyword mappings
  private readonly keywordMap: Map<string, ExpenseCategory> = new Map([
    ['subscription', ExpenseCategory.SOFTWARE],
    ['license', ExpenseCategory.SOFTWARE],
    ['consulting', ExpenseCategory.PROFESSIONAL_SERVICES],
    ['meeting', ExpenseCategory.MEALS],
    ['business lunch', ExpenseCategory.MEALS],
    ['parking', ExpenseCategory.TRAVEL],
    ['toll', ExpenseCategory.TRAVEL],
    ['office rent', ExpenseCategory.RENT],
    ['premium', ExpenseCategory.INSURANCE],
    ['policy', ExpenseCategory.INSURANCE],
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Categorize a single transaction
   */
  async categorizeTransaction(request: CategorizationRequest): Promise<CategorizationResult> {
    this.logger.log(`Categorizing transaction ${request.transactionId} for org ${request.orgId}`);

    const patterns = await this.analyzeTransaction(request);
    const historicalMatches = await this.getHistoricalPatterns(request.orgId, request.merchantName);

    // Combine all pattern matches
    const allMatches = [...patterns];

    // Add historical patterns with boosted confidence
    if (historicalMatches.length > 0) {
      const historicalMatch = historicalMatches[0];
      allMatches.push({
        pattern: 'historical',
        category: historicalMatch.category,
        confidence: Math.min(0.95, 0.7 + (historicalMatch.frequency * 0.05)),
        type: 'historical',
      });
    }

    // Sort by confidence and group by category
    const categoryScores = this.aggregateScores(allMatches);
    const suggestions = this.buildSuggestions(categoryScores, allMatches);

    if (suggestions.length === 0) {
      // Fallback to OTHER category
      suggestions.push({
        categoryId: ExpenseCategory.OTHER,
        categoryName: this.formatCategoryName(ExpenseCategory.OTHER),
        confidence: 0.5,
        reasoning: 'No specific pattern matched, categorized as OTHER',
      });
    }

    const result: CategorizationResult = {
      transactionId: request.transactionId,
      primarySuggestion: suggestions[0],
      alternateSuggestions: suggestions.slice(1, 3),
      confidence: suggestions[0].confidence,
      autoCategorizationEnabled: suggestions[0].confidence >= 0.8,
      categorizedAt: new Date(),
      metadata: {
        merchantName: request.merchantName,
        merchantCategory: request.merchantCategory,
        description: request.description,
        amount: request.amount,
        currency: request.currency,
      },
    };

    // Emit categorization event
    this.eventEmitter.emit('transaction.categorized', {
      transactionId: request.transactionId,
      orgId: request.orgId,
      category: result.primarySuggestion.categoryId,
      confidence: result.confidence,
      timestamp: new Date(),
    });

    this.logger.log(
      `Transaction ${request.transactionId} categorized as ${result.primarySuggestion.categoryName} ` +
      `(confidence: ${result.confidence.toFixed(2)})`,
    );

    return result;
  }

  /**
   * Categorize multiple transactions in batch
   */
  async batchCategorize(requests: CategorizationRequest[]): Promise<BatchCategorizationResult> {
    const startTime = Date.now();
    this.logger.log(`Batch categorizing ${requests.length} transactions`);

    const results: CategorizationResult[] = [];
    const failed: string[] = [];

    for (const request of requests) {
      try {
        const result = await this.categorizeTransaction(request);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to categorize transaction ${request.transactionId}:`, error);
        failed.push(request.transactionId);
      }
    }

    const duration = Date.now() - startTime;

    const batchResult: BatchCategorizationResult = {
      total: requests.length,
      categorized: results.length,
      failed: failed.length,
      results,
      duration,
    };

    this.logger.log(
      `Batch categorization complete: ${results.length}/${requests.length} successful ` +
      `(${duration}ms, ${(duration / requests.length).toFixed(0)}ms avg)`,
    );

    return batchResult;
  }

  /**
   * Get top category suggestions for a transaction
   */
  async getCategorySuggestions(
    orgId: string,
    transactionId: string,
  ): Promise<CategorySuggestion[]> {
    // Fetch transaction from database
    const transaction = await this.prisma.bankTransactionNew.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const request: CategorizationRequest = {
      transactionId: transaction.id,
      merchantName: transaction.merchantName || undefined,
      merchantCategory: transaction.merchantCategory || undefined,
      description: transaction.description,
      amount: transaction.amount.toNumber(),
      currency: transaction.currency,
      date: transaction.bookingDate,
      orgId,
    };

    const result = await this.categorizeTransaction(request);

    return [result.primarySuggestion, ...result.alternateSuggestions];
  }

  /**
   * Learn from user's category choice
   */
  async learnFromUserChoice(
    transactionId: string,
    chosenCategory: ExpenseCategory,
    orgId: string,
  ): Promise<void> {
    this.logger.log(`Learning from user choice: ${transactionId} → ${chosenCategory}`);

    // Fetch transaction to get merchant info
    const transaction = await this.prisma.bankTransactionNew.findUnique({
      where: { id: transactionId },
    });

    if (!transaction || !transaction.merchantName) {
      return;
    }

    // Store/update historical pattern
    await this.updateHistoricalPattern(
      orgId,
      transaction.merchantName,
      chosenCategory,
    );

    // Emit learning event for potential future ML improvements
    this.eventEmitter.emit('transaction.learning', {
      transactionId,
      orgId,
      merchantName: transaction.merchantName,
      category: chosenCategory,
      timestamp: new Date(),
    });

    this.logger.log(`Updated historical pattern for merchant: ${transaction.merchantName}`);
  }

  /**
   * Analyze transaction and find matching patterns
   */
  private async analyzeTransaction(request: CategorizationRequest): Promise<PatternMatch[]> {
    const matches: PatternMatch[] = [];

    // 1. Check merchant name patterns
    if (request.merchantName) {
      for (const [pattern, category] of this.merchantPatterns.entries()) {
        if (pattern.test(request.merchantName)) {
          matches.push({
            pattern: pattern.source,
            category,
            confidence: 0.85,
            type: 'merchant_name',
          });
        }
      }
    }

    // 2. Check MCC code
    if (request.mccCode) {
      const mccMapping = this.mccMappings.get(request.mccCode);
      if (mccMapping) {
        matches.push({
          pattern: `MCC:${request.mccCode}`,
          category: mccMapping.category,
          confidence: mccMapping.confidence,
          type: 'mcc_code',
        });
      }
    }

    // 3. Check merchant category (from bank)
    if (request.merchantCategory) {
      const categoryMatch = this.matchMerchantCategory(request.merchantCategory);
      if (categoryMatch) {
        matches.push(categoryMatch);
      }
    }

    // 4. Check keywords in description
    const keywordMatches = this.analyzeKeywords(request.description);
    matches.push(...keywordMatches);

    return matches;
  }

  /**
   * Match merchant category from bank data
   */
  private matchMerchantCategory(merchantCategory: string): PatternMatch | null {
    const normalized = merchantCategory.toLowerCase();

    const categoryMap: Record<string, ExpenseCategory> = {
      'restaurant': ExpenseCategory.MEALS,
      'food': ExpenseCategory.MEALS,
      'hotel': ExpenseCategory.TRAVEL,
      'transportation': ExpenseCategory.TRAVEL,
      'software': ExpenseCategory.SOFTWARE,
      'office': ExpenseCategory.OFFICE,
      'professional': ExpenseCategory.PROFESSIONAL_SERVICES,
      'utility': ExpenseCategory.UTILITIES,
      'insurance': ExpenseCategory.INSURANCE,
    };

    for (const [key, category] of Object.entries(categoryMap)) {
      if (normalized.includes(key)) {
        return {
          pattern: `merchant_category:${merchantCategory}`,
          category,
          confidence: 0.75,
          type: 'merchant_name',
        };
      }
    }

    return null;
  }

  /**
   * Analyze keywords in description
   */
  private analyzeKeywords(description: string): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const normalized = description.toLowerCase();

    for (const [keyword, category] of this.keywordMap.entries()) {
      if (normalized.includes(keyword)) {
        matches.push({
          pattern: `keyword:${keyword}`,
          category,
          confidence: 0.65,
          type: 'keyword',
        });
      }
    }

    return matches;
  }

  /**
   * Get historical patterns for organization
   */
  private async getHistoricalPatterns(
    orgId: string,
    merchantName?: string,
  ): Promise<HistoricalPattern[]> {
    if (!merchantName) {
      return [];
    }

    // Query metadata JSON field for historical patterns
    // In production, this would be a separate table or cache
    const patterns = await this.prisma.$queryRaw<any[]>`
      SELECT
        merchant_name,
        category,
        COUNT(*) as frequency,
        MAX(booking_date) as last_used
      FROM "BankTransactionNew"
      WHERE
        bank_account_id IN (
          SELECT id FROM "BankAccount" WHERE org_id = ${orgId}
        )
        AND merchant_name ILIKE ${`%${merchantName}%`}
        AND category IS NOT NULL
      GROUP BY merchant_name, category
      ORDER BY frequency DESC, last_used DESC
      LIMIT 1
    `;

    return patterns.map(p => ({
      orgId,
      merchantName: p.merchant_name,
      category: p.category as ExpenseCategory,
      frequency: parseInt(p.frequency),
      lastUsed: new Date(p.last_used),
    }));
  }

  /**
   * Update historical pattern for merchant
   */
  private async updateHistoricalPattern(
    orgId: string,
    merchantName: string,
    category: ExpenseCategory,
  ): Promise<void> {
    // Store in metadata or separate learning table
    // For now, we rely on the actual transaction category updates
    // In production, implement a dedicated learning/patterns table
    this.logger.debug(`Historical pattern updated: ${merchantName} → ${category}`);
  }

  /**
   * Aggregate scores by category
   */
  private aggregateScores(matches: PatternMatch[]): Map<ExpenseCategory, number> {
    const scores = new Map<ExpenseCategory, number>();

    for (const match of matches) {
      const current = scores.get(match.category) || 0;
      // Use max confidence instead of sum to avoid over-weighting
      scores.set(match.category, Math.max(current, match.confidence));
    }

    return scores;
  }

  /**
   * Build category suggestions from scores
   */
  private buildSuggestions(
    scores: Map<ExpenseCategory, number>,
    matches: PatternMatch[],
  ): CategorySuggestion[] {
    const suggestions: CategorySuggestion[] = [];

    // Sort categories by score
    const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);

    for (const [category, confidence] of sorted) {
      // Find all matches for this category
      const categoryMatches = matches.filter(m => m.category === category);

      const reasoning = this.buildReasoning(categoryMatches);

      suggestions.push({
        categoryId: category,
        categoryName: this.formatCategoryName(category),
        confidence,
        reasoning,
        metadata: {
          merchantPattern: categoryMatches.find(m => m.type === 'merchant_name')?.pattern,
          mccCode: categoryMatches.find(m => m.type === 'mcc_code')?.pattern,
          historicalMatch: categoryMatches.some(m => m.type === 'historical'),
          keywordMatch: categoryMatches
            .filter(m => m.type === 'keyword')
            .map(m => m.pattern),
        },
      });
    }

    return suggestions;
  }

  /**
   * Build reasoning text from matches
   */
  private buildReasoning(matches: PatternMatch[]): string {
    const reasons: string[] = [];

    const merchantMatch = matches.find(m => m.type === 'merchant_name');
    if (merchantMatch) {
      reasons.push('merchant name pattern');
    }

    const mccMatch = matches.find(m => m.type === 'mcc_code');
    if (mccMatch) {
      reasons.push('merchant category code');
    }

    const historicalMatch = matches.find(m => m.type === 'historical');
    if (historicalMatch) {
      reasons.push('historical usage in your organization');
    }

    const keywordMatches = matches.filter(m => m.type === 'keyword');
    if (keywordMatches.length > 0) {
      reasons.push('transaction description keywords');
    }

    if (reasons.length === 0) {
      return 'Based on transaction analysis';
    }

    return `Matched based on ${reasons.join(', ')}`;
  }

  /**
   * Format category name for display
   */
  private formatCategoryName(category: ExpenseCategory): string {
    const names: Record<ExpenseCategory, string> = {
      [ExpenseCategory.TRAVEL]: 'Travel & Transport',
      [ExpenseCategory.OFFICE]: 'Office Supplies',
      [ExpenseCategory.SOFTWARE]: 'Software & Subscriptions',
      [ExpenseCategory.EQUIPMENT]: 'Equipment & Hardware',
      [ExpenseCategory.MEALS]: 'Meals & Entertainment',
      [ExpenseCategory.ENTERTAINMENT]: 'Entertainment',
      [ExpenseCategory.UTILITIES]: 'Utilities',
      [ExpenseCategory.RENT]: 'Rent & Facilities',
      [ExpenseCategory.INSURANCE]: 'Insurance',
      [ExpenseCategory.PROFESSIONAL_SERVICES]: 'Professional Services',
      [ExpenseCategory.OTHER]: 'Other',
    };

    return names[category] || category;
  }
}
