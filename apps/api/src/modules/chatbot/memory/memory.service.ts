import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { Message, MemoryType as PrismaMemoryType } from '@prisma/client';
import {
  ConversationContext,
  Memory,
  MemoryType,
  MemorySource,
  DEFAULT_SLIDING_WINDOW_CONFIG,
  SlidingWindowConfig,
} from './memory.types';
import { TokenEstimatorService } from './token-estimator.service';
import { SlidingWindowService } from './sliding-window.service';
import { MemoryExtractorService } from './extractor.service';
import { MemoryCacheService } from './memory-cache.service';

/**
 * Conversation Memory Service
 * Main service for managing conversation memory and context
 */
@Injectable()
export class ConversationMemoryService {
  private readonly logger = new Logger(ConversationMemoryService.name);
  private readonly claudeApiKey: string;
  private readonly claudeModel: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly tokenEstimator: TokenEstimatorService,
    private readonly slidingWindow: SlidingWindowService,
    private readonly extractor: MemoryExtractorService,
    private readonly cache: MemoryCacheService,
  ) {
    this.claudeApiKey = this.configService.get<string>('ANTHROPIC_API_KEY', '');
    this.claudeModel = this.configService.get<string>(
      'CLAUDE_MODEL',
      'claude-3-5-sonnet-20241022',
    );
  }

  /**
   * Get conversation context with sliding window approach
   */
  async getConversationContext(
    conversationId: string,
    maxTokens: number = DEFAULT_SLIDING_WINDOW_CONFIG.maxTokens,
  ): Promise<ConversationContext> {
    try {
      // Check cache first
      const cached = await this.cache.getCachedConversationContext(conversationId);
      if (cached) {
        return cached;
      }

      // Get conversation details
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Get user memories
      const userMemories = await this.getUserMemories(conversation.userId);

      // Get existing summary
      const summaryRecord = await this.prisma.conversationSummary.findUnique({
        where: { conversationId },
      });

      // Build context with sliding window
      const context = this.slidingWindow.buildContext(
        conversation.messages,
        userMemories,
        summaryRecord?.summary || null,
        {
          ...DEFAULT_SLIDING_WINDOW_CONFIG,
          maxTokens,
        },
      );

      // Cache the context
      await this.cache.cacheConversationContext(conversationId, context);

      return context;
    } catch (error) {
      this.logger.error('Failed to get conversation context', error);
      throw error;
    }
  }

  /**
   * Summarize older messages to save context space
   */
  async summarizeOldMessages(conversationId: string): Promise<string> {
    try {
      // Check cache first
      const cachedSummary = await this.cache.getCachedSummary(conversationId);
      if (cachedSummary) {
        return cachedSummary;
      }

      // Get conversation messages
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Select messages to summarize
      const messagesToSummarize = this.slidingWindow.selectMessagesForSummary(
        conversation.messages,
      );

      if (messagesToSummarize.length === 0) {
        return '';
      }

      // Call Claude to create summary
      const summary = await this.callClaudeForSummary(messagesToSummarize);

      // Store summary in database
      const summaryRecord = await this.prisma.conversationSummary.upsert({
        where: { conversationId },
        create: {
          conversationId,
          summary,
          messagesIncluded: messagesToSummarize.length,
          tokensUsed: this.tokenEstimator.estimateTextTokens(summary),
        },
        update: {
          summary,
          messagesIncluded: messagesToSummarize.length,
          tokensUsed: this.tokenEstimator.estimateTextTokens(summary),
        },
      });

      // Cache the summary
      await this.cache.cacheSummary(conversationId, summary);

      // Invalidate conversation context cache (it now has a new summary)
      await this.cache.invalidateConversationContext(conversationId);

      return summary;
    } catch (error) {
      this.logger.error('Failed to summarize old messages', error);
      throw error;
    }
  }

  /**
   * Extract and store memories from conversation
   */
  async extractAndStoreMemories(
    conversationId: string,
    messages: Message[],
  ): Promise<Memory[]> {
    try {
      // Get conversation to get userId and orgId
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Extract memories using Claude
      const result = await this.extractor.extractMemories(
        messages,
        conversation.userId,
        conversation.orgId,
        conversationId,
      );

      if (result.memories.length === 0) {
        return [];
      }

      // Get existing memories to check for conflicts
      const existingMemories = await this.prisma.conversationMemory.findMany({
        where: {
          userId: conversation.userId,
          organizationId: conversation.orgId,
        },
      });

      // Store new memories (and update conflicting ones)
      const storedMemories: Memory[] = [];

      for (const memory of result.memories) {
        // Check for conflicts
        const conflict = this.extractor.detectConflicts(
          memory,
          existingMemories.map((m) => ({
            type: this.mapPrismaMemoryType(m.type),
            content: m.content,
          })),
        );

        if (conflict) {
          // Update existing memory with newer information
          this.logger.debug(`Detected conflict for memory: ${memory.content}`);
          // In a real implementation, you might want to be smarter about merging
        }

        // Create new memory
        const created = await this.prisma.conversationMemory.create({
          data: {
            userId: conversation.userId,
            organizationId: conversation.orgId,
            conversationId,
            type: this.mapMemoryTypeToPrisma(memory.type),
            content: memory.content,
            confidence: memory.confidence,
            source: memory.source,
            metadata: memory.metadata,
          },
        });

        storedMemories.push(this.mapPrismaMemoryToMemory(created));
      }

      // Invalidate user memories cache
      await this.cache.invalidateUserMemories(conversation.userId);

      this.logger.log(
        `Extracted and stored ${storedMemories.length} memories for conversation ${conversationId}`,
      );

      return storedMemories;
    } catch (error) {
      this.logger.error('Failed to extract and store memories', error);
      return [];
    }
  }

  /**
   * Retrieve user-specific memories
   */
  async getUserMemories(userId: string): Promise<Memory[]> {
    try {
      // Check cache first
      const cached = await this.cache.getCachedUserMemories(userId);
      if (cached) {
        return cached;
      }

      // Get from database
      const memories = await this.prisma.conversationMemory.findMany({
        where: {
          userId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50, // Limit to prevent overwhelming context
      });

      const mappedMemories = memories.map((m) => this.mapPrismaMemoryToMemory(m));

      // Cache the memories
      await this.cache.cacheUserMemories(userId, mappedMemories);

      return mappedMemories;
    } catch (error) {
      this.logger.error('Failed to get user memories', error);
      return [];
    }
  }

  /**
   * Clear conversation memory (for privacy/GDPR)
   */
  async clearConversationMemory(conversationId: string): Promise<void> {
    try {
      // Delete conversation-specific memories
      await this.prisma.conversationMemory.deleteMany({
        where: { conversationId },
      });

      // Delete conversation summary
      await this.prisma.conversationSummary.deleteMany({
        where: { conversationId },
      });

      // Clear caches
      await this.cache.clearAllMemory(conversationId);

      this.logger.log(`Cleared all memory for conversation ${conversationId}`);
    } catch (error) {
      this.logger.error('Failed to clear conversation memory', error);
      throw error;
    }
  }

  /**
   * Call Claude to create summary of messages
   */
  private async callClaudeForSummary(messages: Message[]): Promise<string> {
    const conversationText = messages
      .map((msg) => {
        const role = msg.role === 'USER' ? 'User' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');

    const systemPrompt = `You are a conversation summarizer. Create a concise summary of the conversation that captures:
1. Main topics discussed
2. Important decisions or agreements
3. Key facts or information shared
4. Action items or next steps

Keep the summary under 500 words and focus on information that would be useful for future reference.
Do not include pleasantries or small talk.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.claudeModel,
          max_tokens: 2048,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Summarize this conversation:\n\n${conversationText}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create summary');
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      this.logger.error('Failed to call Claude for summary', error);
      throw error;
    }
  }

  /**
   * Map Prisma MemoryType to app MemoryType
   */
  private mapPrismaMemoryType(type: PrismaMemoryType): MemoryType {
    return MemoryType[type as keyof typeof MemoryType];
  }

  /**
   * Map app MemoryType to Prisma MemoryType
   */
  private mapMemoryTypeToPrisma(type: MemoryType): PrismaMemoryType {
    return type as unknown as PrismaMemoryType;
  }

  /**
   * Map Prisma ConversationMemory to app Memory
   */
  private mapPrismaMemoryToMemory(prismaMemory: any): Memory {
    return {
      id: prismaMemory.id,
      type: this.mapPrismaMemoryType(prismaMemory.type),
      content: prismaMemory.content,
      confidence: prismaMemory.confidence,
      source: prismaMemory.source as MemorySource,
      conversationId: prismaMemory.conversationId,
      metadata: prismaMemory.metadata,
      createdAt: prismaMemory.createdAt,
      updatedAt: prismaMemory.updatedAt,
      expiresAt: prismaMemory.expiresAt,
    };
  }

  /**
   * Check if conversation needs summarization and create summary if needed
   */
  async checkAndSummarizeIfNeeded(conversationId: string): Promise<void> {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            select: { id: true },
          },
        },
      });

      if (!conversation) {
        return;
      }

      // Get existing summary
      const existingSummary = await this.prisma.conversationSummary.findUnique({
        where: { conversationId },
      });

      // Check if summarization is needed
      const needsSummary = this.slidingWindow.needsSummarization(
        conversation.messages.length,
        existingSummary?.summary || null,
      );

      if (needsSummary) {
        this.logger.log(`Creating summary for conversation ${conversationId}`);
        await this.summarizeOldMessages(conversationId);
      }
    } catch (error) {
      this.logger.error('Failed to check and summarize', error);
    }
  }
}
