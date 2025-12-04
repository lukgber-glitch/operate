import { Injectable, Logger } from '@nestjs/common';
import { Message } from '@prisma/client';
import {
  ConversationContext,
  Memory,
  DEFAULT_SLIDING_WINDOW_CONFIG,
  SlidingWindowConfig,
} from './memory.types';
import { TokenEstimatorService } from './token-estimator.service';

/**
 * Sliding Window Service
 * Manages conversation context using a sliding window approach
 * Keeps recent messages in full, summarizes older messages
 */
@Injectable()
export class SlidingWindowService {
  private readonly logger = new Logger(SlidingWindowService.name);

  constructor(private readonly tokenEstimator: TokenEstimatorService) {}

  /**
   * Build conversation context with sliding window
   */
  buildContext(
    allMessages: Message[],
    userMemories: Memory[],
    existingSummary: string | null,
    config: SlidingWindowConfig = DEFAULT_SLIDING_WINDOW_CONFIG,
  ): ConversationContext {
    // Calculate token budget
    const systemPromptTokens = 1500; // Estimated
    const memoriesTokens = this.tokenEstimator.estimateMemoriesTokens(userMemories);
    const summaryTokens = existingSummary
      ? this.tokenEstimator.estimateTextTokens(existingSummary)
      : 0;
    const reservedTokens = systemPromptTokens + memoriesTokens + summaryTokens;
    const availableForMessages = config.maxTokens - reservedTokens;

    // Get recent messages that fit within token budget
    const recentMessages = this.tokenEstimator.calculateMessageBudget(
      allMessages,
      availableForMessages,
      0,
    );

    // Ensure we have at least the configured minimum recent messages
    const minMessages = Math.min(config.recentMessageCount, allMessages.length);
    let finalMessages = recentMessages;

    if (recentMessages.length < minMessages) {
      // Take the most recent N messages regardless of token count
      finalMessages = allMessages.slice(-minMessages);
    }

    // Calculate total tokens used
    const totalTokensUsed =
      this.tokenEstimator.estimateMessagesTokens(finalMessages) +
      memoriesTokens +
      summaryTokens +
      systemPromptTokens;

    return {
      recentMessages: finalMessages,
      summary: existingSummary,
      userMemories,
      totalTokensUsed,
    };
  }

  /**
   * Determine if conversation needs summarization
   */
  needsSummarization(
    messageCount: number,
    existingSummary: string | null,
    config: SlidingWindowConfig = DEFAULT_SLIDING_WINDOW_CONFIG,
  ): boolean {
    // Need summary if we have more messages than trigger count and no summary exists
    if (!existingSummary && messageCount > config.summaryTriggerCount) {
      return true;
    }

    // Need new summary if we have significantly more messages since last summary
    if (existingSummary && messageCount > config.summaryTriggerCount * 2) {
      return true;
    }

    return false;
  }

  /**
   * Select messages to include in summary
   */
  selectMessagesForSummary(
    allMessages: Message[],
    config: SlidingWindowConfig = DEFAULT_SLIDING_WINDOW_CONFIG,
  ): Message[] {
    // Exclude the most recent messages (they'll be kept in full)
    const excludeCount = config.recentMessageCount;
    if (allMessages.length <= excludeCount) {
      return [];
    }

    // Return all messages except the most recent ones
    return allMessages.slice(0, -excludeCount);
  }

  /**
   * Optimize context by removing less important messages
   */
  optimizeContext(
    context: ConversationContext,
    maxTokens: number,
  ): ConversationContext {
    const currentEstimate = this.tokenEstimator.estimateContextTokens(
      context.recentMessages,
      context.summary,
      context.userMemories,
      1500,
    );

    if (currentEstimate.total <= maxTokens) {
      return context; // Already within budget
    }

    this.logger.debug(
      `Optimizing context: current ${currentEstimate.total} tokens, target ${maxTokens}`,
    );

    // Calculate how many tokens we need to save
    const tokensToSave = currentEstimate.total - maxTokens;

    // Remove older messages until we're within budget
    const optimizedMessages = [...context.recentMessages];
    let savedTokens = 0;

    while (savedTokens < tokensToSave && optimizedMessages.length > 2) {
      // Keep at least 2 messages (1 exchange)
      const removed = optimizedMessages.shift();
      if (removed) {
        savedTokens += this.tokenEstimator.estimateMessageTokens(removed);
      }
    }

    return {
      ...context,
      recentMessages: optimizedMessages,
      totalTokensUsed: currentEstimate.total - savedTokens,
    };
  }

  /**
   * Get statistics about the sliding window
   */
  getContextStats(context: ConversationContext): {
    messageCount: number;
    hasSummary: boolean;
    memoryCount: number;
    tokenBreakdown: {
      messages: number;
      summary: number;
      memories: number;
      total: number;
    };
  } {
    const messagesTokens = this.tokenEstimator.estimateMessagesTokens(
      context.recentMessages,
    );
    const summaryTokens = context.summary
      ? this.tokenEstimator.estimateTextTokens(context.summary)
      : 0;
    const memoriesTokens = this.tokenEstimator.estimateMemoriesTokens(
      context.userMemories,
    );

    return {
      messageCount: context.recentMessages.length,
      hasSummary: !!context.summary,
      memoryCount: context.userMemories.length,
      tokenBreakdown: {
        messages: messagesTokens,
        summary: summaryTokens,
        memories: memoriesTokens,
        total: messagesTokens + summaryTokens + memoriesTokens,
      },
    };
  }

  /**
   * Create a pruned version of context for display/debugging
   */
  pruneContextForDisplay(context: ConversationContext, maxMessages: number = 5): {
    recentMessages: Array<{ role: string; preview: string }>;
    summary: string | null;
    memoryCount: number;
  } {
    return {
      recentMessages: context.recentMessages.slice(-maxMessages).map((msg) => ({
        role: msg.role,
        preview: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
      })),
      summary: context.summary
        ? context.summary.substring(0, 200) +
          (context.summary.length > 200 ? '...' : '')
        : null,
      memoryCount: context.userMemories.length,
    };
  }
}
