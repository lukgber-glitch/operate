/**
 * Proactive Suggestions Service
 * Main service for generating proactive AI suggestions based on context and business data
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../cache/redis.service';
import { ContextService } from '../context/context.service';
import { ChatContext } from '../context/context.types';
import {
  Suggestion,
  SuggestionContext,
  GeneratorResult,
  Insight,
  Reminder,
  Optimization,
} from './suggestion.types';

// Generators
import { InvoiceSuggestionsGenerator } from './generators/invoice-suggestions.generator';
import { ExpenseSuggestionsGenerator } from './generators/expense-suggestions.generator';
import { TaxSuggestionsGenerator } from './generators/tax-suggestions.generator';
import { HRSuggestionsGenerator } from './generators/hr-suggestions.generator';
import { BillsSuggestionsGenerator } from './generators/bills-suggestions.generator';
import { BankReconciliationSuggestionsGenerator } from './generators/bank-reconciliation-suggestions.generator';
import { SuggestionGenerator } from './generators/base.generator';

@Injectable()
export class ProactiveSuggestionsService {
  private readonly logger = new Logger(ProactiveSuggestionsService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly generators: SuggestionGenerator[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisService,
    private readonly contextService: ContextService,
    private readonly invoiceGenerator: InvoiceSuggestionsGenerator,
    private readonly expenseGenerator: ExpenseSuggestionsGenerator,
    private readonly taxGenerator: TaxSuggestionsGenerator,
    private readonly hrGenerator: HRSuggestionsGenerator,
    private readonly billsGenerator: BillsSuggestionsGenerator,
    private readonly bankReconciliationGenerator: BankReconciliationSuggestionsGenerator,
  ) {
    // Register all generators
    this.generators = [
      this.invoiceGenerator,
      this.expenseGenerator,
      this.taxGenerator,
      this.hrGenerator,
      this.billsGenerator,
      this.bankReconciliationGenerator,
    ];

    this.logger.log(
      `Proactive Suggestions Service initialized with ${this.generators.length} generators`,
    );
  }

  /**
   * Get suggestions based on current context
   */
  async getSuggestions(context: ChatContext): Promise<Suggestion[]> {
    this.logger.debug(
      `Getting suggestions for org ${context.organization.id}, page ${context.page.type}`,
    );

    try {
      // Check cache first
      const cacheKey = this.buildCacheKey(
        context.organization.id,
        context.user.id,
        context.page.type,
      );
      const cached = await this.cache.get<Suggestion[]>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached suggestions');
        return cached;
      }

      // Build suggestion context
      const suggestionContext: SuggestionContext = {
        orgId: context.organization.id,
        userId: context.user.id,
        page: context.page.route,
        entityType: context.entity?.type,
        entityId: context.entity?.id,
      };

      // Generate suggestions from all generators
      const results = await Promise.all(
        this.generators.map(generator =>
          this.safeGenerate(generator, suggestionContext),
        ),
      );

      // Combine and sort all suggestions
      const allSuggestions = results
        .flatMap(result => result.suggestions)
        .sort(this.compareSuggestions);

      // Take top 10
      const topSuggestions = allSuggestions.slice(0, 10);

      // Cache results
      await this.cache.set(cacheKey, topSuggestions, this.CACHE_TTL);

      this.logger.debug(
        `Generated ${topSuggestions.length} suggestions from ${results.length} generators`,
      );

      return topSuggestions;
    } catch (error) {
      this.logger.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Get suggestions for a specific page/entity
   */
  async getPageSuggestions(
    page: string,
    entityId: string | undefined,
    orgId: string,
    userId?: string,
  ): Promise<Suggestion[]> {
    this.logger.debug(`Getting page suggestions for ${page} in org ${orgId}`);

    const suggestionContext: SuggestionContext = {
      orgId,
      userId,
      page,
      entityId,
    };

    // Generate from all generators
    const results = await Promise.all(
      this.generators.map(generator =>
        this.safeGenerate(generator, suggestionContext),
      ),
    );

    const allSuggestions = results
      .flatMap(result => result.suggestions)
      .sort(this.compareSuggestions);

    return allSuggestions.slice(0, 10);
  }

  /**
   * Get AI-generated insights
   */
  async getInsights(orgId: string): Promise<Insight[]> {
    this.logger.debug(`Getting insights for org ${orgId}`);

    try {
      // Check cache
      const cacheKey = `insights:${orgId}`;
      const cached = await this.cache.get<Insight[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const suggestionContext: SuggestionContext = { orgId };

      // Generate insights from all generators
      const results = await Promise.all(
        this.generators.map(generator =>
          this.safeGenerate(generator, suggestionContext),
        ),
      );

      const allInsights = results
        .flatMap(result => result.insights || [])
        .slice(0, 8);

      // Cache for 10 minutes
      await this.cache.set(cacheKey, allInsights, 600);

      return allInsights;
    } catch (error) {
      this.logger.error('Error getting insights:', error);
      return [];
    }
  }

  /**
   * Get deadline reminders
   */
  async getDeadlineReminders(orgId: string): Promise<Reminder[]> {
    this.logger.debug(`Getting deadline reminders for org ${orgId}`);

    try {
      // Check cache
      const cacheKey = `reminders:${orgId}`;
      const cached = await this.cache.get<Reminder[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const suggestionContext: SuggestionContext = { orgId };

      // Generate reminders from all generators
      const results = await Promise.all(
        this.generators.map(generator =>
          this.safeGenerate(generator, suggestionContext),
        ),
      );

      const allReminders = results
        .flatMap(result => result.reminders || [])
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

      // Cache for 1 hour
      await this.cache.set(cacheKey, allReminders, 3600);

      return allReminders;
    } catch (error) {
      this.logger.error('Error getting reminders:', error);
      return [];
    }
  }

  /**
   * Get optimization suggestions
   */
  async getOptimizations(orgId: string): Promise<Optimization[]> {
    this.logger.debug(`Getting optimizations for org ${orgId}`);

    try {
      // Check cache
      const cacheKey = `optimizations:${orgId}`;
      const cached = await this.cache.get<Optimization[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const suggestionContext: SuggestionContext = { orgId };

      // Generate optimizations from all generators
      const results = await Promise.all(
        this.generators.map(generator =>
          this.safeGenerate(generator, suggestionContext),
        ),
      );

      const allOptimizations = results
        .flatMap(result => result.optimizations || [])
        .slice(0, 5);

      // Cache for 30 minutes
      await this.cache.set(cacheKey, allOptimizations, 1800);

      return allOptimizations;
    } catch (error) {
      this.logger.error('Error getting optimizations:', error);
      return [];
    }
  }

  /**
   * Invalidate cache for an organization
   */
  async invalidateCache(orgId: string, userId?: string): Promise<void> {
    const patterns = [
      `suggestions:${orgId}:*`,
      `insights:${orgId}`,
      `reminders:${orgId}`,
      `optimizations:${orgId}`,
    ];

    if (userId) {
      patterns.push(`suggestions:${orgId}:${userId}:*`);
    }

    await Promise.all(patterns.map(pattern => this.cache.del(pattern)));

    this.logger.debug(`Cache invalidated for org ${orgId}`);
  }

  /**
   * Safely execute a generator (with error handling)
   */
  private async safeGenerate(
    generator: SuggestionGenerator,
    context: SuggestionContext,
  ): Promise<GeneratorResult> {
    try {
      return await generator.generate(context);
    } catch (error) {
      this.logger.error(
        `Error in generator ${generator.getName()}:`,
        error,
      );
      return {
        suggestions: [],
        insights: [],
        reminders: [],
        optimizations: [],
      };
    }
  }

  /**
   * Compare suggestions for sorting (by priority)
   */
  private compareSuggestions(a: Suggestion, b: Suggestion): number {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }

  /**
   * Build cache key
   */
  private buildCacheKey(
    orgId: string,
    userId: string,
    pageType: string,
  ): string {
    return `suggestions:${orgId}:${userId}:${pageType}`;
  }
}
