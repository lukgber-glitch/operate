/**
 * Example: Integration of Memory Service with Chat Service
 *
 * This file shows how to integrate the conversation memory system
 * with the existing chat service to enable multi-turn conversations
 * with context retention.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConversationMemoryService } from './memory.service';
import { Message } from '@prisma/client';

/**
 * Example Enhanced Chat Service
 *
 * This demonstrates how to integrate memory into the chat flow:
 * 1. Load conversation context before sending to Claude
 * 2. Include user memories in system prompt
 * 3. Extract memories after each conversation turn
 * 4. Automatically create summaries when needed
 */
@Injectable()
export class EnhancedChatService {
  private readonly logger = new Logger(EnhancedChatService.name);

  constructor(private readonly memoryService: ConversationMemoryService) {}

  /**
   * Send message with memory context
   */
  async sendMessage(data: {
    conversationId: string;
    userId: string;
    orgId: string;
    content: string;
  }): Promise<{ userMessage: Message; assistantMessage: Message }> {
    // 1. Get conversation context with sliding window
    const context = await this.memoryService.getConversationContext(
      data.conversationId,
    );

    this.logger.debug(
      `Context loaded: ${context.recentMessages.length} messages, ` +
        `${context.userMemories.length} memories, ` +
        `${context.totalTokensUsed} tokens`,
    );

    // 2. Build system prompt with user memories
    const systemPrompt = this.buildSystemPromptWithMemories(context.userMemories);

    // 3. Build messages array for Claude
    const claudeMessages = [
      // Include summary if available
      ...(context.summary
        ? [
            {
              role: 'user' as const,
              content: `Previous conversation summary:\n${context.summary}`,
            },
            {
              role: 'assistant' as const,
              content: 'I understand the context from our previous conversation.',
            },
          ]
        : []),
      // Include recent messages
      ...context.recentMessages.map((msg) => ({
        role: (msg.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content,
      })),
      // Add new user message
      {
        role: 'user' as const,
        content: data.content,
      },
    ];

    // 4. Call Claude API (simplified - actual implementation would be in ClaudeService)
    // const response = await this.claudeService.sendMessage({
    //   systemPrompt,
    //   messages: claudeMessages,
    // });

    // 5. Save user and assistant messages (simplified)
    // const userMessage = await this.saveMessage(...);
    // const assistantMessage = await this.saveMessage(...);

    // 6. Extract memories from the latest exchange
    // This should be done asynchronously to not block the response
    this.extractMemoriesAsync(data.conversationId, [
      // userMessage,
      // assistantMessage,
    ]);

    // 7. Check if summarization is needed
    this.checkSummarizationAsync(data.conversationId);

    // Return messages (simplified)
    return {
      userMessage: {} as Message,
      assistantMessage: {} as Message,
    };
  }

  /**
   * Build system prompt with user memories
   */
  private buildSystemPromptWithMemories(memories: any[]): string {
    const basePrompt = `You are Operate Assistant, an AI helper for the Operate business management platform.

You help users with:
- Financial questions and tax compliance (German/Austrian tax law)
- HR management and employee-related queries
- Business operations and workflow optimization
- Integration setup and troubleshooting

Be concise, professional, and helpful. If you're unsure about specific regulations, recommend consulting a professional.`;

    if (memories.length === 0) {
      return basePrompt;
    }

    // Group memories by type
    const preferences = memories.filter((m) => m.type === 'PREFERENCE');
    const facts = memories.filter((m) => m.type === 'FACT');
    const instructions = memories.filter((m) => m.type === 'INSTRUCTION');
    const context = memories.filter((m) => m.type === 'CONTEXT');

    let memorySection = '\n\nIMPORTANT CONTEXT TO REMEMBER:\n';

    if (instructions.length > 0) {
      memorySection += '\nInstructions:\n';
      instructions.forEach((m) => {
        memorySection += `- ${m.content}\n`;
      });
    }

    if (preferences.length > 0) {
      memorySection += '\nUser Preferences:\n';
      preferences.forEach((m) => {
        memorySection += `- ${m.content}\n`;
      });
    }

    if (facts.length > 0) {
      memorySection += '\nKnown Facts:\n';
      facts.forEach((m) => {
        memorySection += `- ${m.content}\n`;
      });
    }

    if (context.length > 0) {
      memorySection += '\nBusiness Context:\n';
      context.forEach((m) => {
        memorySection += `- ${m.content}\n`;
      });
    }

    return basePrompt + memorySection;
  }

  /**
   * Extract memories asynchronously (don't block response)
   */
  private async extractMemoriesAsync(
    conversationId: string,
    recentMessages: Message[],
  ): Promise<void> {
    try {
      if (recentMessages.length < 2) {
        return; // Need at least one exchange to extract memories
      }

      const memories = await this.memoryService.extractAndStoreMemories(
        conversationId,
        recentMessages,
      );

      if (memories.length > 0) {
        this.logger.log(
          `Extracted ${memories.length} memories from conversation ${conversationId}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to extract memories', error);
    }
  }

  /**
   * Check if summarization is needed and create summary asynchronously
   */
  private async checkSummarizationAsync(conversationId: string): Promise<void> {
    try {
      await this.memoryService.checkAndSummarizeIfNeeded(conversationId);
    } catch (error) {
      this.logger.error('Failed to check/create summary', error);
    }
  }

  /**
   * Example: Get conversation context for display
   */
  async getConversationContextPreview(conversationId: string): Promise<{
    messageCount: number;
    hasSummary: boolean;
    memoryCount: number;
    tokenUsage: number;
  }> {
    const context = await this.memoryService.getConversationContext(conversationId);

    return {
      messageCount: context.recentMessages.length,
      hasSummary: !!context.summary,
      memoryCount: context.userMemories.length,
      tokenUsage: context.totalTokensUsed,
    };
  }

  /**
   * Example: Clear user's conversation history (GDPR compliance)
   */
  async clearConversationData(conversationId: string): Promise<void> {
    await this.memoryService.clearConversationMemory(conversationId);
    this.logger.log(`Cleared conversation data: ${conversationId}`);
  }
}

/**
 * INTEGRATION STEPS:
 *
 * 1. Update ChatService to inject ConversationMemoryService
 * 2. Before calling Claude, load conversation context
 * 3. Build system prompt with user memories
 * 4. Include conversation summary in messages if available
 * 5. After receiving response, extract memories asynchronously
 * 6. Periodically check if summarization is needed
 *
 * Example usage in ChatService:
 *
 * ```typescript
 * async sendMessage(data: SendMessageDto) {
 *   // Load context
 *   const context = await this.memoryService.getConversationContext(
 *     data.conversationId,
 *   );
 *
 *   // Build prompt with memories
 *   const systemPrompt = this.buildPromptWithMemories(context.userMemories);
 *
 *   // Call Claude with context
 *   const response = await this.claudeService.sendMessage({
 *     systemPrompt,
 *     messages: this.buildMessagesWithContext(context),
 *   });
 *
 *   // Extract memories async (don't await)
 *   this.memoryService.extractAndStoreMemories(
 *     data.conversationId,
 *     [userMessage, assistantMessage],
 *   );
 *
 *   return response;
 * }
 * ```
 */
