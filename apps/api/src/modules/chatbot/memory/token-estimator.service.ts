import { Injectable } from '@nestjs/common';
import { Message } from '@prisma/client';
import { TokenEstimate, Memory } from './memory.types';

/**
 * Token Estimator Service
 * Estimates token usage for messages and context
 *
 * Uses a simple character-based estimation:
 * - ~4 characters per token for English text
 * - ~2-3 characters per token for structured data
 */
@Injectable()
export class TokenEstimatorService {
  private readonly CHARS_PER_TOKEN = 4;

  /**
   * Estimate tokens for a single message
   */
  estimateMessageTokens(message: Message): number {
    const content = message.content || '';
    const metadata = message.metadata ? JSON.stringify(message.metadata) : '';
    const totalChars = content.length + metadata.length + 20; // +20 for role/structure
    return Math.ceil(totalChars / this.CHARS_PER_TOKEN);
  }

  /**
   * Estimate tokens for multiple messages
   */
  estimateMessagesTokens(messages: Message[]): number {
    return messages.reduce((total, msg) => total + this.estimateMessageTokens(msg), 0);
  }

  /**
   * Estimate tokens for text content
   */
  estimateTextTokens(text: string): number {
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  /**
   * Estimate tokens for user memories
   */
  estimateMemoriesTokens(memories: Memory[]): number {
    const totalChars = memories.reduce((total, mem) => {
      return total + mem.content.length + mem.type.length + 30; // +30 for structure
    }, 0);
    return Math.ceil(totalChars / this.CHARS_PER_TOKEN);
  }

  /**
   * Estimate total context tokens
   */
  estimateContextTokens(
    messages: Message[],
    summary: string | null,
    userMemories: Memory[],
    systemPromptTokens: number,
  ): TokenEstimate {
    const messagesTokens = this.estimateMessagesTokens(messages);
    const summaryTokens = summary ? this.estimateTextTokens(summary) : 0;
    const memoriesTokens = this.estimateMemoriesTokens(userMemories);

    return {
      messages: messagesTokens,
      summary: summaryTokens,
      userMemories: memoriesTokens,
      systemPrompt: systemPromptTokens,
      total: messagesTokens + summaryTokens + memoriesTokens + systemPromptTokens,
    };
  }

  /**
   * Calculate how many messages fit within token budget
   */
  calculateMessageBudget(
    messages: Message[],
    maxTokens: number,
    reservedTokens: number = 0,
  ): Message[] {
    const availableTokens = maxTokens - reservedTokens;
    const result: Message[] = [];
    let totalTokens = 0;

    // Add messages from most recent to oldest until we hit the limit
    for (let i = messages.length - 1; i >= 0; i--) {
      const msgTokens = this.estimateMessageTokens(messages[i]);
      if (totalTokens + msgTokens > availableTokens) {
        break;
      }
      result.unshift(messages[i]);
      totalTokens += msgTokens;
    }

    return result;
  }

  /**
   * Check if token count exceeds limit
   */
  exceedsLimit(estimate: TokenEstimate, limit: number): boolean {
    return estimate.total > limit;
  }
}
