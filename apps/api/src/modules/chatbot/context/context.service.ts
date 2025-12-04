/**
 * Context Service
 * Main service for building context-aware information for AI assistant
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);
  private readonly contextProviders: Map<string, any>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceProvider: InvoiceContextProvider,
    private readonly expenseProvider: ExpenseContextProvider,
    private readonly taxProvider: TaxContextProvider,
    private readonly orgProvider: OrganizationContextProvider,
  ) {
    // Register context providers
    this.contextProviders = new Map([
      ['invoice', this.invoiceProvider],
      ['expense', this.expenseProvider],
      ['tax-summary', this.taxProvider],
    ]);

    this.logger.log('Context service initialized');
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
   * Get user context
   */
  async getUserContext(userId: string): Promise<UserContext> {
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

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: membership?.role,
      permissions: membership?.permissions as string[] | undefined,
      locale: user.locale,
    };
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
   * Get user's recent activity
   */
  async getActivityContext(
    userId: string,
    limit: number = 10,
  ): Promise<ActivityContext[]> {
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
