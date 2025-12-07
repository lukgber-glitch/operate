/**
 * Action Confirmation Service
 * Manages pending actions awaiting user confirmation
 * Uses Redis for distributed storage with in-memory fallback
 */

import { Injectable, Logger } from '@nestjs/common';
import { PendingAction, ActionIntent, ActionContext } from './action.types';
import { RedisService } from '../../cache/redis.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConfirmationService {
  private readonly logger = new Logger(ConfirmationService.name);

  // In-memory fallback store when Redis is unavailable
  private pendingActions: Map<string, PendingAction> = new Map();

  // Default expiration time (5 minutes)
  private readonly DEFAULT_EXPIRATION_MS = 5 * 60 * 1000;
  private readonly DEFAULT_EXPIRATION_SEC = 300; // 5 minutes in seconds

  // Redis availability flag
  private redisAvailable = false;

  constructor(private readonly redisService: RedisService) {
    this.checkRedisAvailability();
  }

  /**
   * Check if Redis is available
   */
  private async checkRedisAvailability(): Promise<void> {
    try {
      this.redisAvailable = await this.redisService.ping();
      if (this.redisAvailable) {
        this.logger.log('Redis available - using distributed pending actions storage');
      } else {
        this.logger.warn('Redis unavailable - falling back to in-memory storage');
      }
    } catch (error) {
      this.logger.warn('Redis unavailable - falling back to in-memory storage', error);
      this.redisAvailable = false;
    }
  }

  /**
   * Get Redis key for a pending action
   */
  private getRedisKey(actionId: string): string {
    return `pending_action:${actionId}`;
  }

  /**
   * Get Redis key for user's pending actions index
   */
  private getUserIndexKey(userId: string): string {
    return `pending_actions:user:${userId}`;
  }

  /**
   * Get Redis key for conversation's pending actions index
   */
  private getConversationIndexKey(conversationId: string): string {
    return `pending_actions:conversation:${conversationId}`;
  }

  /**
   * Store a pending action awaiting confirmation
   */
  async storePendingAction(
    action: ActionIntent,
    context: ActionContext,
  ): Promise<PendingAction> {
    const id = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.DEFAULT_EXPIRATION_MS);

    const pendingAction: PendingAction = {
      id,
      action,
      context,
      createdAt: now,
      expiresAt,
    };

    // Try Redis first, fallback to in-memory
    if (this.redisAvailable) {
      try {
        // Store the action with TTL
        await this.redisService.set(
          this.getRedisKey(id),
          pendingAction,
          this.DEFAULT_EXPIRATION_SEC,
        );

        // Add to user index
        const userKey = this.getUserIndexKey(context.userId);
        const client = this.redisService.getClient();
        await client.sadd(userKey, id);
        await client.expire(userKey, this.DEFAULT_EXPIRATION_SEC);

        // Add to conversation index if present
        if (context.conversationId) {
          const convKey = this.getConversationIndexKey(context.conversationId);
          await client.sadd(convKey, id);
          await client.expire(convKey, this.DEFAULT_EXPIRATION_SEC);
        }

        this.logger.log(
          `Stored pending action ${id} in Redis for user ${context.userId}, expires in ${this.DEFAULT_EXPIRATION_SEC}s`,
        );
      } catch (error) {
        this.logger.error('Failed to store action in Redis, using in-memory fallback', error);
        this.redisAvailable = false;
        this.pendingActions.set(id, pendingAction);
      }
    } else {
      // In-memory fallback
      this.pendingActions.set(id, pendingAction);
      this.logger.debug(
        `Stored pending action ${id} in memory for user ${context.userId}, expires at ${expiresAt.toISOString()}`,
      );
      this.cleanupExpiredActions();
    }

    return pendingAction;
  }

  /**
   * Retrieve a pending action by ID
   */
  async getPendingAction(actionId: string): Promise<PendingAction | null> {
    // Try Redis first, fallback to in-memory
    if (this.redisAvailable) {
      try {
        const action = await this.redisService.get<PendingAction>(this.getRedisKey(actionId));

        if (!action) {
          return null;
        }

        // Redis TTL handles expiration, but double-check
        const expiresAt = new Date(action.expiresAt);
        if (new Date() > expiresAt) {
          await this.redisService.del(this.getRedisKey(actionId));
          this.logger.log(`Pending action ${actionId} has expired`);
          return null;
        }

        return action;
      } catch (error) {
        this.logger.error('Failed to get action from Redis, using in-memory fallback', error);
        this.redisAvailable = false;
      }
    }

    // In-memory fallback
    const action = this.pendingActions.get(actionId);

    if (!action) {
      return null;
    }

    // Check if expired
    if (new Date() > action.expiresAt) {
      this.pendingActions.delete(actionId);
      this.logger.log(`Pending action ${actionId} has expired`);
      return null;
    }

    return action;
  }

  /**
   * Confirm and remove a pending action
   */
  async confirmAction(actionId: string, userId: string): Promise<PendingAction | null> {
    const action = await this.getPendingAction(actionId);

    if (!action) {
      this.logger.warn(`Attempt to confirm non-existent action: ${actionId}`);
      return null;
    }

    // Verify user owns the action
    if (action.context.userId !== userId) {
      this.logger.warn(
        `User ${userId} attempted to confirm action belonging to ${action.context.userId}`,
      );
      return null;
    }

    // Remove from pending storage
    if (this.redisAvailable) {
      try {
        await this.redisService.del(this.getRedisKey(actionId));

        // Remove from indexes
        const userKey = this.getUserIndexKey(userId);
        const client = this.redisService.getClient();
        await client.srem(userKey, actionId);

        if (action.context.conversationId) {
          const convKey = this.getConversationIndexKey(action.context.conversationId);
          await client.srem(convKey, actionId);
        }
      } catch (error) {
        this.logger.error('Failed to delete action from Redis', error);
        this.redisAvailable = false;
      }
    } else {
      this.pendingActions.delete(actionId);
    }

    this.logger.log(`Action ${actionId} confirmed by user ${userId}`);

    return action;
  }

  /**
   * Cancel a pending action
   */
  async cancelAction(actionId: string, userId: string): Promise<boolean> {
    const action = await this.getPendingAction(actionId);

    if (!action) {
      return false;
    }

    // Verify user owns the action
    if (action.context.userId !== userId) {
      this.logger.warn(
        `User ${userId} attempted to cancel action belonging to ${action.context.userId}`,
      );
      return false;
    }

    // Remove from storage
    if (this.redisAvailable) {
      try {
        await this.redisService.del(this.getRedisKey(actionId));

        // Remove from indexes
        const userKey = this.getUserIndexKey(userId);
        const client = this.redisService.getClient();
        await client.srem(userKey, actionId);

        if (action.context.conversationId) {
          const convKey = this.getConversationIndexKey(action.context.conversationId);
          await client.srem(convKey, actionId);
        }
      } catch (error) {
        this.logger.error('Failed to delete action from Redis', error);
        this.redisAvailable = false;
      }
    } else {
      this.pendingActions.delete(actionId);
    }

    this.logger.log(`Action ${actionId} cancelled by user ${userId}`);

    return true;
  }

  /**
   * Get all pending actions for a user
   */
  async getUserPendingActions(userId: string): Promise<PendingAction[]> {
    // Try Redis first, fallback to in-memory
    if (this.redisAvailable) {
      try {
        const userKey = this.getUserIndexKey(userId);
        const client = this.redisService.getClient();
        const actionIds = await client.smembers(userKey);

        if (actionIds.length === 0) {
          return [];
        }

        const userActions: PendingAction[] = [];
        const now = new Date();

        for (const actionId of actionIds) {
          const action = await this.redisService.get<PendingAction>(this.getRedisKey(actionId));

          if (action) {
            const expiresAt = new Date(action.expiresAt);
            if (now <= expiresAt) {
              userActions.push(action);
            } else {
              // Clean up expired action
              await this.redisService.del(this.getRedisKey(actionId));
              await client.srem(userKey, actionId);
            }
          }
        }

        return userActions;
      } catch (error) {
        this.logger.error('Failed to get user actions from Redis, using in-memory fallback', error);
        this.redisAvailable = false;
      }
    }

    // In-memory fallback
    const userActions: PendingAction[] = [];
    const now = new Date();

    for (const [id, action] of this.pendingActions.entries()) {
      // Skip expired actions
      if (now > action.expiresAt) {
        this.pendingActions.delete(id);
        continue;
      }

      // Filter by user
      if (action.context.userId === userId) {
        userActions.push(action);
      }
    }

    return userActions;
  }

  /**
   * Get pending actions for a conversation
   */
  async getConversationPendingActions(conversationId: string): Promise<PendingAction[]> {
    // Try Redis first, fallback to in-memory
    if (this.redisAvailable) {
      try {
        const convKey = this.getConversationIndexKey(conversationId);
        const client = this.redisService.getClient();
        const actionIds = await client.smembers(convKey);

        if (actionIds.length === 0) {
          return [];
        }

        const conversationActions: PendingAction[] = [];
        const now = new Date();

        for (const actionId of actionIds) {
          const action = await this.redisService.get<PendingAction>(this.getRedisKey(actionId));

          if (action) {
            const expiresAt = new Date(action.expiresAt);
            if (now <= expiresAt) {
              conversationActions.push(action);
            } else {
              // Clean up expired action
              await this.redisService.del(this.getRedisKey(actionId));
              await client.srem(convKey, actionId);
            }
          }
        }

        return conversationActions;
      } catch (error) {
        this.logger.error('Failed to get conversation actions from Redis, using in-memory fallback', error);
        this.redisAvailable = false;
      }
    }

    // In-memory fallback
    const conversationActions: PendingAction[] = [];
    const now = new Date();

    for (const [id, action] of this.pendingActions.entries()) {
      // Skip expired actions
      if (now > action.expiresAt) {
        this.pendingActions.delete(id);
        continue;
      }

      // Filter by conversation
      if (action.context.conversationId === conversationId) {
        conversationActions.push(action);
      }
    }

    return conversationActions;
  }

  /**
   * Clean up expired actions
   */
  private cleanupExpiredActions(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [id, action] of this.pendingActions.entries()) {
      if (now > action.expiresAt) {
        this.pendingActions.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired actions`);
    }
  }

  /**
   * Clear all pending actions (for testing)
   */
  async clearAll(): Promise<void> {
    if (this.redisAvailable) {
      try {
        // Delete all pending action keys
        await this.redisService.delByPattern('pending_action:*');
        await this.redisService.delByPattern('pending_actions:user:*');
        await this.redisService.delByPattern('pending_actions:conversation:*');
        this.logger.log('Cleared all pending actions from Redis');
      } catch (error) {
        this.logger.error('Failed to clear Redis actions', error);
        this.redisAvailable = false;
      }
    } else {
      this.pendingActions.clear();
      this.logger.log('Cleared all pending actions from memory');
    }
  }

  /**
   * Get total count of pending actions
   */
  async getPendingCount(): Promise<number> {
    if (this.redisAvailable) {
      try {
        const keys = await this.redisService.keys('pending_action:*');
        return keys.length;
      } catch (error) {
        this.logger.error('Failed to get count from Redis', error);
        this.redisAvailable = false;
      }
    }

    this.cleanupExpiredActions();
    return this.pendingActions.size;
  }
}
