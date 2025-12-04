import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { ContextAnalyzerService } from './context-analyzer.service';
import {
  SuggestionDto,
  ContextDto,
  SuggestionPriority,
  SuggestionType,
} from './dto/suggestions.dto';

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisService,
    private readonly contextAnalyzer: ContextAnalyzerService,
  ) {}

  /**
   * Get suggestions for current context
   */
  async getSuggestions(
    orgId: string,
    userId: string,
    context?: ContextDto,
    limit = 5,
    minPriority?: SuggestionPriority,
  ): Promise<SuggestionDto[]> {
    this.logger.debug(`Getting suggestions for org ${orgId}, user ${userId}`);

    // Check cache first
    const cacheKey = this.buildCacheKey(orgId, userId, context);
    const cached = await this.cache.get<SuggestionDto[]>(cacheKey);
    if (cached) {
      this.logger.debug('Returning cached suggestions');
      return this.filterAndLimitSuggestions(cached, limit, minPriority);
    }

    // Get existing suggestions from DB
    const existingSuggestions = await this.getExistingSuggestions(
      orgId,
      userId,
      minPriority,
    );

    // If we have a context, analyze and generate new suggestions
    if (context?.page) {
      const analysis = await this.contextAnalyzer.analyzeContext(
        context.page,
        orgId,
        userId,
        context.filters,
        context.selectedItems,
      );

      // Create new suggestions from analysis
      await this.createSuggestionsFromAnalysis(
        orgId,
        userId,
        analysis.suggestions,
      );

      // Fetch updated suggestions
      const updatedSuggestions = await this.getExistingSuggestions(
        orgId,
        userId,
        minPriority,
      );

      // Cache for future requests
      await this.cache.set(cacheKey, updatedSuggestions, this.CACHE_TTL);

      return this.filterAndLimitSuggestions(updatedSuggestions, limit, minPriority);
    }

    // Cache and return existing suggestions
    await this.cache.set(cacheKey, existingSuggestions, this.CACHE_TTL);
    return this.filterAndLimitSuggestions(existingSuggestions, limit, minPriority);
  }

  /**
   * Get suggestions by specific context path
   */
  async getSuggestionsByContext(
    orgId: string,
    userId: string,
    contextPath: string,
    limit = 5,
  ): Promise<SuggestionDto[]> {
    this.logger.debug(`Getting suggestions for context: ${contextPath}`);

    const context: ContextDto = { page: `/${contextPath.replace('.', '/')}` };
    return this.getSuggestions(orgId, userId, context, limit);
  }

  /**
   * Apply a suggestion (execute its action)
   */
  async applySuggestion(
    suggestionId: string,
    orgId: string,
    userId: string,
    params?: Record<string, any>,
  ): Promise<{ success: boolean; result?: any }> {
    this.logger.debug(`Applying suggestion ${suggestionId}`);

    const suggestion = await this.prisma.suggestion.findFirst({
      where: { id: suggestionId, orgId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    // Update suggestion status
    await this.prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'ACTED',
        actedAt: new Date(),
      },
    });

    // Track acceptance for learning
    await this.trackSuggestionAcceptance(suggestionId, orgId, userId);

    // Clear cache
    await this.invalidateCache(orgId, userId);

    // Execute action based on actionType
    const result = await this.executeAction(
      suggestion.actionType,
      suggestion.actionParams as Record<string, any>,
      params,
      orgId,
      userId,
    );

    return { success: true, result };
  }

  /**
   * Dismiss a suggestion
   */
  async dismissSuggestion(
    suggestionId: string,
    orgId: string,
    userId: string,
    reason?: string,
  ): Promise<void> {
    this.logger.debug(`Dismissing suggestion ${suggestionId}`);

    const suggestion = await this.prisma.suggestion.findFirst({
      where: { id: suggestionId, orgId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    await this.prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'DISMISSED',
        dismissedAt: new Date(),
        dismissReason: reason,
      },
    });

    // Track dismissal for learning
    await this.trackSuggestionDismissal(suggestionId, orgId, userId, reason);

    // Clear cache
    await this.invalidateCache(orgId, userId);
  }

  /**
   * Mark suggestion as viewed
   */
  async markAsViewed(suggestionId: string, orgId: string): Promise<void> {
    await this.prisma.suggestion.updateMany({
      where: {
        id: suggestionId,
        orgId,
        viewedAt: null,
      },
      data: {
        status: 'VIEWED',
        viewedAt: new Date(),
      },
    });
  }

  /**
   * Get existing suggestions from database
   */
  private async getExistingSuggestions(
    orgId: string,
    userId: string,
    minPriority?: SuggestionPriority,
  ): Promise<SuggestionDto[]> {
    const now = new Date();

    const where: any = {
      orgId,
      status: { in: ['PENDING', 'VIEWED'] },
      showAfter: { lte: now },
      OR: [
        { userId }, // User-specific
        { userId: null }, // Org-wide
      ],
      AND: [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
      ],
    };

    if (minPriority) {
      const priorities = this.getPrioritiesAbove(minPriority);
      where.priority = { in: priorities };
    }

    const suggestions = await this.prisma.suggestion.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return suggestions.map(this.mapToDto);
  }

  /**
   * Create suggestions from context analysis
   */
  private async createSuggestionsFromAnalysis(
    orgId: string,
    userId: string,
    templates: any[],
  ): Promise<void> {
    const now = new Date();

    for (const template of templates) {
      // Check if similar suggestion already exists
      const exists = await this.prisma.suggestion.findFirst({
        where: {
          orgId,
          type: template.type,
          status: { in: ['PENDING', 'VIEWED'] },
          entityType: template.entityType || undefined,
          entityId: template.entityId || undefined,
        },
      });

      if (exists) {
        this.logger.debug(
          `Suggestion of type ${template.type} already exists, skipping`,
        );
        continue;
      }

      // Create new suggestion
      await this.prisma.suggestion.create({
        data: {
          orgId,
          userId: null, // Org-wide for now
          type: template.type,
          priority: template.priority,
          title: template.title,
          description: template.description,
          actionLabel: template.actionLabel,
          entityType: template.entityType,
          entityId: template.entityId,
          data: template.data || {},
          actionType: template.actionType,
          actionParams: template.actionParams || {},
          status: 'PENDING',
          showAfter: now,
        },
      });

      this.logger.debug(`Created new suggestion: ${template.title}`);
    }
  }

  /**
   * Execute suggestion action
   */
  private async executeAction(
    actionType: string | null,
    actionParams: Record<string, any> | null,
    customParams?: Record<string, any>,
    orgId?: string,
    userId?: string,
  ): Promise<any> {
    const params = { ...actionParams, ...customParams };

    switch (actionType) {
      case 'navigate':
        // Return navigation params for frontend to handle
        return { action: 'navigate', ...params };

      case 'api_call':
        // Execute internal API call
        // This would be expanded based on specific API actions needed
        this.logger.debug('Executing API call action', params);
        return { action: 'api_call', ...params };

      case 'open_chat':
        // Open chatbot with specific context
        return { action: 'open_chat', ...params };

      default:
        return { action: 'unknown', ...params };
    }
  }

  /**
   * Track suggestion acceptance for ML learning
   */
  private async trackSuggestionAcceptance(
    suggestionId: string,
    orgId: string,
    userId: string,
  ): Promise<void> {
    // This would log to an analytics/ML system
    // For now, we just log it
    this.logger.debug(
      `Suggestion ${suggestionId} accepted by user ${userId} in org ${orgId}`,
    );
  }

  /**
   * Track suggestion dismissal for ML learning
   */
  private async trackSuggestionDismissal(
    suggestionId: string,
    orgId: string,
    userId: string,
    reason?: string,
  ): Promise<void> {
    this.logger.debug(
      `Suggestion ${suggestionId} dismissed by user ${userId}: ${reason}`,
    );
  }

  /**
   * Filter and limit suggestions
   */
  private filterAndLimitSuggestions(
    suggestions: SuggestionDto[],
    limit: number,
    minPriority?: SuggestionPriority,
  ): SuggestionDto[] {
    let filtered = suggestions;

    if (minPriority) {
      const priorities = this.getPrioritiesAbove(minPriority);
      filtered = suggestions.filter((s) => priorities.includes(s.priority));
    }

    return filtered.slice(0, limit);
  }

  /**
   * Get priorities above or equal to given priority
   */
  private getPrioritiesAbove(priority: SuggestionPriority): SuggestionPriority[] {
    const order = [
      SuggestionPriority.URGENT,
      SuggestionPriority.HIGH,
      SuggestionPriority.MEDIUM,
      SuggestionPriority.LOW,
    ];

    const index = order.indexOf(priority);
    return order.slice(0, index + 1);
  }

  /**
   * Build cache key
   */
  private buildCacheKey(
    orgId: string,
    userId: string,
    context?: ContextDto,
  ): string {
    const contextStr = context
      ? `:${context.page}:${JSON.stringify(context.filters || {})}`
      : '';
    return `suggestions:${orgId}:${userId}${contextStr}`;
  }

  /**
   * Invalidate cache for user
   */
  private async invalidateCache(orgId: string, userId: string): Promise<void> {
    const pattern = `suggestions:${orgId}:${userId}*`;
    await this.cache.del(pattern);
  }

  /**
   * Map Prisma model to DTO
   */
  private mapToDto(suggestion: any): SuggestionDto {
    return {
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      actionLabel: suggestion.actionLabel,
      type: suggestion.type as SuggestionType,
      priority: suggestion.priority as SuggestionPriority,
      entityType: suggestion.entityType,
      entityId: suggestion.entityId,
      actionType: suggestion.actionType,
      actionParams: suggestion.actionParams as Record<string, any>,
      data: suggestion.data as Record<string, any>,
      createdAt: suggestion.createdAt,
      expiresAt: suggestion.expiresAt,
      confidence: suggestion.confidence
        ? parseFloat(suggestion.confidence.toString())
        : undefined,
    };
  }
}
