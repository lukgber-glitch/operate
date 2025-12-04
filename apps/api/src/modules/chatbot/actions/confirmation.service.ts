/**
 * Action Confirmation Service
 * Manages pending actions awaiting user confirmation
 */

import { Injectable, Logger } from '@nestjs/common';
import { PendingAction, ActionIntent, ActionContext } from './action.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConfirmationService {
  private readonly logger = new Logger(ConfirmationService.name);

  // In-memory store for pending actions (use Redis in production)
  private pendingActions: Map<string, PendingAction> = new Map();

  // Default expiration time (5 minutes)
  private readonly DEFAULT_EXPIRATION_MS = 5 * 60 * 1000;

  /**
   * Store a pending action awaiting confirmation
   */
  storePendingAction(
    action: ActionIntent,
    context: ActionContext,
  ): PendingAction {
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

    this.pendingActions.set(id, pendingAction);

    this.logger.log(
      `Stored pending action ${id} for user ${context.userId}, expires at ${expiresAt.toISOString()}`,
    );

    // Clean up expired actions
    this.cleanupExpiredActions();

    return pendingAction;
  }

  /**
   * Retrieve a pending action by ID
   */
  getPendingAction(actionId: string): PendingAction | null {
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
  confirmAction(actionId: string, userId: string): PendingAction | null {
    const action = this.getPendingAction(actionId);

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

    // Remove from pending
    this.pendingActions.delete(actionId);

    this.logger.log(`Action ${actionId} confirmed by user ${userId}`);

    return action;
  }

  /**
   * Cancel a pending action
   */
  cancelAction(actionId: string, userId: string): boolean {
    const action = this.getPendingAction(actionId);

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

    this.pendingActions.delete(actionId);

    this.logger.log(`Action ${actionId} cancelled by user ${userId}`);

    return true;
  }

  /**
   * Get all pending actions for a user
   */
  getUserPendingActions(userId: string): PendingAction[] {
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
  getConversationPendingActions(conversationId: string): PendingAction[] {
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
  clearAll(): void {
    this.pendingActions.clear();
    this.logger.log('Cleared all pending actions');
  }

  /**
   * Get total count of pending actions
   */
  getPendingCount(): number {
    this.cleanupExpiredActions();
    return this.pendingActions.size;
  }
}
