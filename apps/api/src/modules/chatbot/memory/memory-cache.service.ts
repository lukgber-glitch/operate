import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../cache/redis.service';
import { ConversationContext, Memory } from './memory.types';

/**
 * Memory Cache Service
 * Handles Redis caching for conversation memory to improve performance
 */
@Injectable()
export class MemoryCacheService {
  private readonly logger = new Logger(MemoryCacheService.name);
  private readonly CACHE_PREFIX = 'chatbot:memory';
  private readonly TTL = {
    CONVERSATION_CONTEXT: 3600,  // 1 hour
    USER_MEMORIES: 7200,          // 2 hours
    SUMMARY: 86400,               // 24 hours
  };

  constructor(private readonly redis: RedisService) {}

  /**
   * Generate cache key for conversation context
   */
  private getContextKey(conversationId: string): string {
    return `${this.CACHE_PREFIX}:context:${conversationId}`;
  }

  /**
   * Generate cache key for user memories
   */
  private getUserMemoriesKey(userId: string): string {
    return `${this.CACHE_PREFIX}:user:${userId}`;
  }

  /**
   * Generate cache key for conversation summary
   */
  private getSummaryKey(conversationId: string): string {
    return `${this.CACHE_PREFIX}:summary:${conversationId}`;
  }

  /**
   * Cache conversation context
   */
  async cacheConversationContext(
    conversationId: string,
    context: ConversationContext,
  ): Promise<void> {
    try {
      const key = this.getContextKey(conversationId);
      await this.redis.set(key, context, this.TTL.CONVERSATION_CONTEXT);
      this.logger.debug(`Cached conversation context: ${conversationId}`);
    } catch (error) {
      this.logger.error('Failed to cache conversation context', error);
    }
  }

  /**
   * Get cached conversation context
   */
  async getCachedConversationContext(
    conversationId: string,
  ): Promise<ConversationContext | null> {
    try {
      const key = this.getContextKey(conversationId);
      const context = await this.redis.get<ConversationContext>(key);
      if (context) {
        this.logger.debug(`Cache hit for conversation context: ${conversationId}`);
      }
      return context;
    } catch (error) {
      this.logger.error('Failed to get cached conversation context', error);
      return null;
    }
  }

  /**
   * Cache user memories
   */
  async cacheUserMemories(userId: string, memories: Memory[]): Promise<void> {
    try {
      const key = this.getUserMemoriesKey(userId);
      await this.redis.set(key, memories, this.TTL.USER_MEMORIES);
      this.logger.debug(`Cached user memories: ${userId}`);
    } catch (error) {
      this.logger.error('Failed to cache user memories', error);
    }
  }

  /**
   * Get cached user memories
   */
  async getCachedUserMemories(userId: string): Promise<Memory[] | null> {
    try {
      const key = this.getUserMemoriesKey(userId);
      const memories = await this.redis.get<Memory[]>(key);
      if (memories) {
        this.logger.debug(`Cache hit for user memories: ${userId}`);
      }
      return memories;
    } catch (error) {
      this.logger.error('Failed to get cached user memories', error);
      return null;
    }
  }

  /**
   * Cache conversation summary
   */
  async cacheSummary(conversationId: string, summary: string): Promise<void> {
    try {
      const key = this.getSummaryKey(conversationId);
      await this.redis.set(key, summary, this.TTL.SUMMARY);
      this.logger.debug(`Cached summary: ${conversationId}`);
    } catch (error) {
      this.logger.error('Failed to cache summary', error);
    }
  }

  /**
   * Get cached summary
   */
  async getCachedSummary(conversationId: string): Promise<string | null> {
    try {
      const key = this.getSummaryKey(conversationId);
      const summary = await this.redis.get<string>(key);
      if (summary) {
        this.logger.debug(`Cache hit for summary: ${conversationId}`);
      }
      return summary;
    } catch (error) {
      this.logger.error('Failed to get cached summary', error);
      return null;
    }
  }

  /**
   * Invalidate conversation context cache
   */
  async invalidateConversationContext(conversationId: string): Promise<void> {
    try {
      const key = this.getContextKey(conversationId);
      await this.redis.del(key);
      this.logger.debug(`Invalidated conversation context cache: ${conversationId}`);
    } catch (error) {
      this.logger.error('Failed to invalidate conversation context cache', error);
    }
  }

  /**
   * Invalidate user memories cache
   */
  async invalidateUserMemories(userId: string): Promise<void> {
    try {
      const key = this.getUserMemoriesKey(userId);
      await this.redis.del(key);
      this.logger.debug(`Invalidated user memories cache: ${userId}`);
    } catch (error) {
      this.logger.error('Failed to invalidate user memories cache', error);
    }
  }

  /**
   * Invalidate all caches for a user
   */
  async invalidateUserCaches(userId: string): Promise<void> {
    try {
      await this.invalidateUserMemories(userId);
      // Could also invalidate all conversation contexts for this user
      this.logger.debug(`Invalidated all caches for user: ${userId}`);
    } catch (error) {
      this.logger.error('Failed to invalidate user caches', error);
    }
  }

  /**
   * Clear all conversation memory (for GDPR compliance)
   */
  async clearAllMemory(conversationId: string): Promise<void> {
    try {
      await this.invalidateConversationContext(conversationId);
      await this.redis.del(this.getSummaryKey(conversationId));
      this.logger.log(`Cleared all memory for conversation: ${conversationId}`);
    } catch (error) {
      this.logger.error('Failed to clear conversation memory', error);
    }
  }
}
