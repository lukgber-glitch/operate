/**
 * Context Service
 * Main service for building context-aware information for AI assistant
 *
 * Performance Optimizations:
 * - LRU caching for user context (reduces DB queries)
 * - LRU caching for organization context
 * - Parallel context building
 * - Configurable cache TTLs
 */

import { Injectable, Logger, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  ContextParams,
  ChatContext,
  UserContext,
  PageContext,
  ActivityContext,
  EntityContext,
} from './context.types';
import {
  getPageContextConfig,
  extractEntityIdFromRoute,
} from './page-context.config';
import { InvoiceContextProvider } from './providers/invoice-context.provider';
import { ExpenseContextProvider } from './providers/expense-context.provider';
import { TaxContextProvider } from './providers/tax-context.provider';
import { OrganizationContextProvider } from './providers/organization-context.provider';

// ============================================
// LRU Cache Implementation
// ============================================

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize: number = 100, ttlMs: number = 60000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    // Delete if exists (will be re-added at end)
    this.cache.delete(key);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// ============================================
// Cache Configuration
// ============================================

const CACHE_CONFIG = {
  user: {
    maxSize: 500,
    ttlMs: 5 * 60 * 1000, // 5 minutes
  },
  organization: {
    maxSize: 200,
    ttlMs: 10 * 60 * 1000, // 10 minutes
  },
  activity: {
    maxSize: 300,
    ttlMs: 2 * 60 * 1000, // 2 minutes
  },
};

@Injectable()
export class ContextService implements OnModuleDestroy {
  private readonly logger = new Logger(ContextService.name);
  private readonly contextProviders: Map<string, any>;

  // Caches for frequently accessed data
  private readonly userCache: LRUCache<UserContext>;
  private readonly orgCache: LRUCache<any>;
  private readonly activityCache: LRUCache<ActivityContext[]>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceProvider: InvoiceContextProvider,
    private readonly expenseProvider: ExpenseContextProvider,
    private readonly taxProvider: TaxContextProvider,
    private readonly orgProvider: OrganizationContextProvider,
  ) {
    // Initialize caches
    this.userCache = new LRUCache<UserContext>(
      CACHE_CONFIG.user.maxSize,
      CACHE_CONFIG.user.ttlMs,
    );
    this.orgCache = new LRUCache<any>(
      CACHE_CONFIG.organization.maxSize,
      CACHE_CONFIG.organization.ttlMs,
    );
    this.activityCache = new LRUCache<ActivityContext[]>(
      CACHE_CONFIG.activity.maxSize,
      CACHE_CONFIG.activity.ttlMs,
    );

    // Register context providers
    this.contextProviders = new Map([
      ['invoice', this.invoiceProvider],
      ['expense', this.expenseProvider],
      ['tax-summary', this.taxProvider],
    ]);

    this.logger.log('Context service initialized with LRU caching');
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    this.userCache.clear();
    this.orgCache.clear();
    this.activityCache.clear();
    this.logger.log('Context service caches cleared');
  }

  /**
   * Invalidate user cache (call after user updates)
   */
  invalidateUserCache(userId: string): void {
    this.userCache.invalidate(userId);
    this.activityCache.invalidate(userId);
  }

  /**
   * Invalidate organization cache (call after org updates)
   */
  invalidateOrgCache(orgId: string): void {
    this.orgCache.invalidate(orgId);
  }

  /**
   * Build comprehensive context for AI assistant
   */
  async buildContext(params: ContextParams): Promise<ChatContext> {
    this.logger.debug(
      `Building context for user ${params.userId} on page ${params.currentPage || 'unknown'}`,
    );

    try {
      // Build all context parts in parallel
      const [user, organization, page, entity, recentActivity] =
        await Promise.all([
          this.getUserContext(params.userId),
          this.orgProvider.getOrgContext(params.organizationId),
          this.getPageContext(
            params.currentPage || '/dashboard',
            params.organizationId,
          ),
          this.getEntityContextIfPresent(params),
          this.getActivityContext(params.userId, 5),
        ]);

      // Build suggestions based on context
      const suggestions = this.buildSuggestions(page, entity);

      const context: ChatContext = {
        user,
        organization,
        page,
        entity,
        recentActivity,
        suggestions,
        metadata: params.additionalContext,
      };

      this.logger.debug(
        `Context built successfully: ${entity ? 'with' : 'without'} entity context`,
      );

      return context;
    } catch (error) {
      this.logger.error('Error building context:', error);
      throw error;
    }
  }

  /**
   * Get user context with caching
   */
  async getUserContext(userId: string): Promise<UserContext> {
    // Check cache first
    const cached = this.userCache.get(userId);
    if (cached) {
      this.logger.debug(`User context cache hit for ${userId}`);
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        locale: true,
        memberships: {
          select: {
            role: true,
            permissions: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const membership = user.memberships[0];

    const userContext: UserContext = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: membership?.role,
      permissions: membership?.permissions as string[] | undefined,
      locale: user.locale,
    };

    // Cache the result
    this.userCache.set(userId, userContext);
    this.logger.debug(`User context cached for ${userId}`);

    return userContext;
  }

  /**
   * Get page context based on current route
   */
  async getPageContext(
    currentPage: string,
    orgId: string,
  ): Promise<PageContext> {
    const config = getPageContextConfig(currentPage);

    return {
      type: config.type,
      route: currentPage,
      description: config.description,
      relevantEntities: config.relevantEntityTypes,
      availableActions: config.availableActions,
    };
  }

  /**
   * Get entity context if entity is specified or can be extracted from route
   */
  async getEntityContextIfPresent(
    params: ContextParams,
  ): Promise<EntityContext | undefined> {
    let entityType = params.selectedEntityType;
    let entityId = params.selectedEntityId;

    // Try to extract from route if not explicitly provided
    if (!entityType || !entityId) {
      if (params.currentPage) {
        const extracted = extractEntityIdFromRoute(params.currentPage);
        entityType = entityType || extracted.entityType;
        entityId = entityId || extracted.entityId;
      }
    }

    // If we have both type and id, fetch entity context
    if (entityType && entityId) {
      return this.getEntityContext(entityType, entityId, params.organizationId);
    }

    return undefined;
  }

  /**
   * Get entity context by type and ID
   */
  async getEntityContext(
    entityType: string,
    entityId: string,
    orgId: string,
  ): Promise<EntityContext> {
    const provider = this.contextProviders.get(entityType);

    if (!provider) {
      throw new Error(`No context provider registered for type: ${entityType}`);
    }

    return provider.getContext(entityId, orgId);
  }

  /**
   * Get user's recent activity with caching
   */
  async getActivityContext(
    userId: string,
    limit: number = 10,
  ): Promise<ActivityContext[]> {
    // Create cache key including limit
    const cacheKey = `${userId}:${limit}`;

    // Check cache first
    const cached = this.activityCache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Activity context cache hit for ${userId}`);
      return cached;
    }

    // Get recent conversations/messages from this user
    const recentConversations = await this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        contextType: true,
        contextId: true,
        lastMessageAt: true,
      },
    });

    // Convert to activity context
    const activities: ActivityContext[] = recentConversations.map(conv => ({
      action: 'viewed_chat',
      entityType: conv.contextType || undefined,
      entityId: conv.contextId || undefined,
      entityName: conv.title,
      timestamp: conv.lastMessageAt || conv.lastMessageAt,
      description: `Discussed ${conv.title}`,
    }));

    // Cache the result
    this.activityCache.set(cacheKey, activities);

    return activities;
  }

  /**
   * Build contextual suggestions based on page and entity
   */
  private buildSuggestions(
    page: PageContext,
    entity?: EntityContext,
  ): string[] {
    const suggestions: string[] = [];

    // Add entity-specific suggestions first
    if (entity) {
      const provider = this.contextProviders.get(entity.type);
      if (provider && provider.getSuggestedActions) {
        const entitySuggestions = provider.getSuggestedActions(entity);
        suggestions.push(...entitySuggestions);
      }
    }

    // Add page-specific suggestions from config
    const pageConfig = getPageContextConfig(page.route);
    if (pageConfig.defaultSuggestions && suggestions.length < 5) {
      const remainingSlots = 5 - suggestions.length;
      suggestions.push(...pageConfig.defaultSuggestions.slice(0, remainingSlots));
    }

    return suggestions.slice(0, 5); // Limit to 5 total
  }

  /**
   * Format context for AI prompt
   * Returns a human-readable string representation of the context
   */
  formatContextForPrompt(context: ChatContext): string {
    const parts: string[] = [];

    // User info
    parts.push(
      `User: ${context.user.name} (${context.user.email}), Role: ${context.user.role || 'member'}`,
    );

    // Organization info
    parts.push(
      `Organization: ${context.organization.name}, Country: ${context.organization.country}, Currency: ${context.organization.currency}`,
    );

    if (context.organization.taxRegime) {
      parts.push(`Tax Regime: ${context.organization.taxRegime}`);
    }

    // Page context
    parts.push(`Current Page: ${context.page.description} (${context.page.route})`);

    // Entity context
    if (context.entity) {
      parts.push(`Viewing: ${context.entity.summary}`);
      parts.push(
        `Entity Details: ${JSON.stringify(context.entity.data, null, 2)}`,
      );
    }

    // Recent activity
    if (context.recentActivity.length > 0) {
      parts.push(`Recent Activity:`);
      context.recentActivity.slice(0, 3).forEach(activity => {
        const timeAgo = this.getTimeAgo(activity.timestamp);
        parts.push(`  - ${activity.description || activity.action} (${timeAgo})`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Get human-readable time ago string
   */
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  }
}
