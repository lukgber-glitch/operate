/**
 * Chat Service
 * Handles conversation management and AI interactions
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ClaudeService, ChatMessage } from './claude.service';
import { buildSystemPrompt, CompanyContext } from './prompts/system-prompt';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Conversation, Message, Prisma, UsageFeature } from '@prisma/client';
import { ActionExecutorService } from './actions/action-executor.service';
import { ActionContext } from './actions/action.types';
import { ContextService } from './context/context.service';
import { ContextParams } from './context/context.types';
import { ChatScenarioExtension } from './chat-scenario.extension';
import { UsageMeteringService } from '../subscription/usage/services/usage-metering.service';
import { UsageLimitService } from '../subscription/usage/services/usage-limit.service';

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private claudeService: ClaudeService,
    private actionExecutor: ActionExecutorService,
    private contextService: ContextService,
    private scenarioExtension: ChatScenarioExtension,
    private usageMeteringService: UsageMeteringService,
    private usageLimitService: UsageLimitService,
  ) {}

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    orgId: string,
    dto: CreateConversationDto,
  ): Promise<Conversation> {
    this.logger.log(`Creating conversation for user ${userId} in org ${orgId}`);

    const conversation = await this.prisma.conversation.create({
      data: {
        userId,
        orgId,
        title: dto.title,
        contextType: dto.contextType,
        contextId: dto.contextId,
        pageContext: dto.pageContext,
        metadata: dto.metadata as Prisma.InputJsonValue,
        status: 'ACTIVE',
        messageCount: 0,
      },
    });

    this.logger.debug(`Created conversation: ${conversation.id}`);
    return conversation;
  }

  /**
   * Send a message and get AI response
   * Tracks AI_MESSAGES usage automatically
   * Enforces AI message limits based on subscription tier
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    orgId: string,
    dto: SendMessageDto,
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
    // Verify conversation ownership
    const conversation = await this.getConversation(conversationId, userId, orgId);

    // Check AI message limits before processing
    await this.enforceAiMessageLimit(orgId);

    // Sanitize input
    const sanitizedContent = this.claudeService.sanitizeInput(dto.content);

    // Check if this is a scenario planning query
    if (this.scenarioExtension.isScenarioQuery(sanitizedContent)) {
      this.logger.log('Detected scenario planning query, processing...');

      // Create user message
      const userMessage = await this.prisma.message.create({
        data: {
          conversationId,
          role: 'USER',
          type: 'TEXT',
          content: sanitizedContent,
        },
      });

      // Process scenario query
      const scenarioResponse = await this.scenarioExtension.processScenarioQuery(
        sanitizedContent,
        orgId,
      );

      // Create assistant message with scenario result
      const assistantMessage = await this.prisma.message.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          type: 'TEXT',
          content: scenarioResponse.text,
          // Store scenario data in componentData field (no metadata field in schema)
          componentData: scenarioResponse.data as unknown as Prisma.InputJsonValue,
        },
      });

      // Update conversation
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          messageCount: { increment: 2 },
          lastMessageAt: new Date(),
          title: conversation.title || this.generateTitle(sanitizedContent),
        },
      });

      return { userMessage, assistantMessage };
    }

    // Create user message
    const userMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'USER',
        type: 'TEXT',
        content: sanitizedContent,
      },
    });

    this.logger.debug(`Created user message: ${userMessage.id}`);

    // Create attachments if provided
    if (dto.attachments && dto.attachments.length > 0) {
      await this.prisma.messageAttachment.createMany({
        data: dto.attachments.map(att => ({
          messageId: userMessage.id,
          fileName: att.fileName,
          fileType: att.fileType,
          fileSize: att.fileSize,
          storagePath: att.storagePath,
        })),
      });
    }

    // Get conversation history (last 20 messages for context)
    const history = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // Build message history for Claude
    const messages: ChatMessage[] = history.map(msg => ({
      role: msg.role === 'USER' ? 'user' : 'assistant',
      content: msg.content,
    }));

    // Fetch company context for personalization
    const companyContext = await this.getCompanyContext(orgId);

    // Build context-aware system prompt with company info
    const contextParams: ContextParams = {
      userId,
      organizationId: orgId,
      currentPage: conversation.pageContext || undefined,
      selectedEntityType: conversation.contextType || undefined,
      selectedEntityId: conversation.contextId || undefined,
    };

    let systemPrompt = buildSystemPrompt(conversation.contextType || 'general', companyContext);

    // Enhance with live context
    try {
      const chatContext = await this.contextService.buildContext(contextParams);
      const contextInfo = this.contextService.formatContextForPrompt(chatContext);
      systemPrompt = `${systemPrompt}\n\n## Current Context\n${contextInfo}\n\n## Suggested Actions\n${chatContext.suggestions.join('\n- ')}`;
    } catch (error) {
      this.logger.warn('Failed to build context, using basic prompt:', error.message);
    }

    try {
      // Get AI response
      const aiResponse = await this.claudeService.chat(messages, systemPrompt);

      // Check for action intents in response
      const actionIntent = this.actionExecutor.parseActionIntent(aiResponse.content);

      let finalContent = aiResponse.content;
      let actionResult = null;

      if (actionIntent) {
        this.logger.log(`Detected action intent: ${actionIntent.type}`);

        // Create assistant message first (needed for action log)
        const assistantMessage = await this.prisma.message.create({
          data: {
            conversationId,
            role: 'ASSISTANT',
            type: 'TEXT',
            content: aiResponse.content,
            model: aiResponse.model,
            tokens: aiResponse.usage.inputTokens + aiResponse.usage.outputTokens,
          },
        });

        // Build action context
        const actionContext: ActionContext = {
          userId,
          organizationId: orgId,
          conversationId,
          permissions: await this.getUserPermissions(userId, orgId),
        };

        // Execute action
        actionResult = await this.actionExecutor.executeAction(
          actionIntent,
          actionContext,
          assistantMessage.id,
        );

        // If action requires confirmation, update message
        if (actionResult.data?.requiresConfirmation) {
          finalContent = `${aiResponse.content}\n\n**Confirmation Required**\nPlease confirm to proceed with this action. Reply with "confirm" or "cancel".`;
        } else if (actionResult.success) {
          finalContent = `${aiResponse.content}\n\n**Action Completed:** ${actionResult.message}`;
        } else {
          finalContent = `${aiResponse.content}\n\n**Action Failed:** ${actionResult.error || actionResult.message}`;
        }

        // Update assistant message with final content
        await this.prisma.message.update({
          where: { id: assistantMessage.id },
          data: { content: finalContent },
        });

        // Update conversation
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: {
            messageCount: { increment: 2 },
            lastMessageAt: new Date(),
            title: conversation.title || this.generateTitle(sanitizedContent),
          },
        });

        this.logger.log(`AI response with action generated for conversation ${conversationId}`);

        return { userMessage, assistantMessage: { ...assistantMessage, content: finalContent } };
      }

      // No action detected, create normal assistant message
      const assistantMessage = await this.prisma.message.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          type: 'TEXT',
          content: aiResponse.content,
          model: aiResponse.model,
          tokens: aiResponse.usage.inputTokens + aiResponse.usage.outputTokens,
        },
      });

      // Update conversation
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          messageCount: { increment: 2 },
          lastMessageAt: new Date(),
          title: conversation.title || this.generateTitle(sanitizedContent),
        },
      });

      this.logger.log(`AI response generated for conversation ${conversationId}`);

      // Track AI message usage (background, don't await)
      this.trackAiMessageUsage(orgId, userId).catch((err) =>
        this.logger.warn('Failed to track AI message usage:', err),
      );

      return { userMessage, assistantMessage };
    } catch (error) {
      this.logger.error('Error getting AI response:', error);

      // Create error message
      const errorMessage = await this.prisma.message.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          type: 'TEXT',
          content: 'I apologize, but I encountered an error processing your request. Please try again.',
        },
      });

      return { userMessage, assistantMessage: errorMessage };
    }
  }

  /**
   * Get conversation by ID with ownership verification
   */
  async getConversation(
    conversationId: string,
    userId: string,
    orgId: string,
  ): Promise<Conversation & { messages: Message[] }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            attachments: true,
            actionLogs: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify ownership
    if (conversation.userId !== userId || conversation.orgId !== orgId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    return conversation;
  }

  /**
   * List user's conversations
   */
  async listConversations(
    userId: string,
    orgId: string,
    options: PaginationOptions = {},
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          userId,
          orgId,
          status: { not: 'ARCHIVED' },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.conversation.count({
        where: {
          userId,
          orgId,
          status: { not: 'ARCHIVED' },
        },
      }),
    ]);

    return { conversations, total };
  }

  /**
   * Delete conversation
   */
  async deleteConversation(
    conversationId: string,
    userId: string,
    orgId: string,
  ): Promise<void> {
    // Verify ownership
    await this.getConversation(conversationId, userId, orgId);

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    this.logger.log(`Deleted conversation: ${conversationId}`);
  }

  /**
   * Archive conversation
   */
  async archiveConversation(
    conversationId: string,
    userId: string,
    orgId: string,
  ): Promise<Conversation> {
    // Verify ownership
    await this.getConversation(conversationId, userId, orgId);

    const conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'ARCHIVED',
        resolvedAt: new Date(),
      },
    });

    this.logger.log(`Archived conversation: ${conversationId}`);
    return conversation;
  }

  /**
   * Quick ask - one-off question without saving to conversation
   */
  async quickAsk(
    userId: string,
    orgId: string,
    question: string,
    context?: string,
    pageContext?: string,
  ): Promise<{ answer: string; model: string; usage: { input: number; output: number } }> {
    this.logger.log(`Quick ask from user ${userId}: ${question.substring(0, 50)}...`);

    // Sanitize input
    const sanitizedQuestion = this.claudeService.sanitizeInput(question);

    // Fetch company context for personalization
    const companyContext = await this.getCompanyContext(orgId);

    // Build system prompt with context
    let systemPrompt = buildSystemPrompt(context || 'general', companyContext);

    // Enhance with live context
    try {
      const contextParams: ContextParams = {
        userId,
        organizationId: orgId,
        currentPage: pageContext,
      };

      const chatContext = await this.contextService.buildContext(contextParams);
      const contextInfo = this.contextService.formatContextForPrompt(chatContext);
      systemPrompt = `${systemPrompt}\n\n## Current Context\n${contextInfo}`;
    } catch (error) {
      this.logger.warn('Failed to build context for quick ask:', error.message);
    }

    // Get AI response
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: sanitizedQuestion,
      },
    ];

    const response = await this.claudeService.chat(messages, systemPrompt);

    return {
      answer: response.content,
      model: response.model,
      usage: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens,
      },
    };
  }

  /**
   * Generate a conversation title from the first message
   */
  private generateTitle(content: string): string {
    // Take first 60 chars and add ellipsis if longer
    const title = content.substring(0, 60);
    return content.length > 60 ? title + '...' : title;
  }

  /**
   * Track AI message usage
   */
  private async trackAiMessageUsage(
    orgId: string,
    userId: string,
  ): Promise<void> {
    try {
      await this.usageMeteringService.trackUsage({
        organizationId: orgId,
        feature: UsageFeature.AI_MESSAGES,
        quantity: 1,
        userId,
        metadata: {
          source: 'chat',
        },
      });
    } catch (error) {
      this.logger.error('Failed to track AI message usage', error);
      // Don't throw - usage tracking failures shouldn't break chat
    }
  }

  /**
   * Get user permissions for action execution
   * Fetches user role from Membership and maps to permissions
   */
  private async getUserPermissions(userId: string, orgId: string): Promise<string[]> {
    // Fetch user's membership to get role
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
      select: { role: true },
    });

    if (!membership) {
      return [];
    }

    // Map roles to permissions for chatbot actions
    // These permissions control what chat actions users can perform
    const fullPermissions = [
      // Invoices
      'invoices:create',
      'invoices:update',
      'invoices:send',
      // Expenses
      'expenses:create',
      'expenses:update',
      // Bills
      'bills:create',
      'bills:update',
      'bills:view',
      // Banking
      'banking:view',
      // Clients/Customers
      'clients:create',
      // Contracts
      'contracts:create',
      'contracts:view',
      'contracts:send',
      // Quotes
      'quotes:create',
      'quotes:view',
      'quotes:send',
      'quotes:convert',
      // Projects
      'projects:create',
      'projects:view',
      // Time tracking
      'time:view',
      'time:track',
      // Mileage
      'mileage:view',
      'mileage:create',
      // HR
      'hr:employees:create',
      'hr:employees:terminate',
      'hr:leave:approve',
      'hr:leave:request',
      // Reports
      'reports:generate',
      'reports:view',
      // Tax
      'tax:read',
      // Documents
      'documents:view',
    ];

    const rolePermissions: Record<string, string[]> = {
      OWNER: fullPermissions,
      ADMIN: fullPermissions,
      ACCOUNTANT: [
        'invoices:create',
        'invoices:update',
        'invoices:send',
        'expenses:create',
        'expenses:update',
        'bills:create',
        'bills:update',
        'bills:view',
        'banking:view',
        'reports:generate',
        'reports:view',
        'tax:read',
        'documents:view',
      ],
      MEMBER: [
        'expenses:create',
        'bills:view',
        'time:view',
        'time:track',
        'mileage:view',
        'mileage:create',
        'hr:leave:request',
        'reports:view',
        'documents:view',
      ],
      VIEWER: ['bills:view', 'reports:view', 'documents:view'],
    };

    return rolePermissions[membership.role] || [];
  }

  /**
   * Fetch company context for personalized AI responses
   */
  private async getCompanyContext(orgId: string): Promise<CompanyContext | undefined> {
    try {
      const org = await this.prisma.organisation.findUnique({
        where: { id: orgId },
        select: {
          name: true,
          country: true,
          industry: true,
          currency: true,
          vatNumber: true,
          companyType: true,
          vatScheme: true,
        },
      });

      if (!org) {
        return undefined;
      }

      return {
        name: org.name || undefined,
        country: org.country || undefined,
        industry: org.industry || undefined,
        currency: org.currency || undefined,
        vatNumber: org.vatNumber || undefined,
        companyType: org.companyType || undefined,
        vatScheme: org.vatScheme || undefined,
      };
    } catch (error) {
      this.logger.warn('Failed to fetch company context:', error.message);
      return undefined;
    }
  }

  /**
   * Enforce AI message limit based on subscription tier
   * Free tier: 50 messages/month
   * Starter: 200 messages/month
   * Pro/Business: Unlimited
   */
  private async enforceAiMessageLimit(orgId: string): Promise<void> {
    try {
      const limitCheck = await this.usageLimitService.checkLimit(
        orgId,
        UsageFeature.AI_MESSAGES,
      );

      if (!limitCheck.allowed) {
        this.logger.warn(
          `AI message limit exceeded for org ${orgId}: ${limitCheck.current}/${limitCheck.limit}`,
        );
        throw new ForbiddenException(
          `Sie haben Ihr monatliches Limit von ${limitCheck.limit} KI-Nachrichten erreicht. ` +
          `Aktuell: ${limitCheck.current}/${limitCheck.limit}. ` +
          `Bitte upgraden Sie Ihren Plan für weitere Nachrichten.`,
        );
      }

      // Warn when approaching limit (80%)
      if (limitCheck.limit > 0 && limitCheck.percentage >= 80) {
        this.logger.log(
          `AI message usage at ${limitCheck.percentage.toFixed(0)}% for org ${orgId}: ${limitCheck.current}/${limitCheck.limit}`,
        );
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // Log but don't block on limit check errors
      this.logger.warn('Failed to check AI message limit:', error.message);
    }
  }

  /**
   * Get AI message usage status for organization
   * Used by frontend to show usage indicators
   */
  async getAiUsageStatus(orgId: string): Promise<{
    current: number;
    limit: number;
    percentage: number;
    remaining: number;
    isUnlimited: boolean;
  }> {
    const limitCheck = await this.usageLimitService.checkLimit(
      orgId,
      UsageFeature.AI_MESSAGES,
    );

    const isUnlimited = limitCheck.limit === -1;
    const remaining = isUnlimited ? -1 : Math.max(0, limitCheck.limit - limitCheck.current);

    return {
      current: limitCheck.current,
      limit: limitCheck.limit,
      percentage: limitCheck.percentage,
      remaining,
      isUnlimited,
    };
  }
}
