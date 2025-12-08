import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Response as ExpressResponse } from 'express';

/**
 * In-app notification channel
 * Handles in-app notifications via SSE (Server-Sent Events) and event emitters
 */
@Injectable()
export class InAppService {
  private readonly logger = new Logger(InAppService.name);

  // Store active SSE connections by user ID
  private readonly connections = new Map<string, Set<ExpressResponse>>();

  constructor(private eventEmitter: EventEmitter2) {
    this.logger.log('In-app notification channel initialized');
  }

  /**
   * Send an in-app notification
   * Emits event that will be caught by SSE connections
   */
  async sendNotification(
    userId: string,
    notification: {
      id: string;
      type: string;
      title: string;
      message: string;
      data?: Record<string, any>;
      priority: number;
      createdAt: Date;
    },
  ): Promise<boolean> {
    try {
      // Emit event for real-time updates
      this.eventEmitter.emit('notification.created', {
        userId,
        notification,
      });

      // Send to active SSE connections
      await this.sendToConnections(userId, notification);

      this.logger.log(
        `[IN-APP] Sent notification to user ${userId}: ${notification.title}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send in-app notification to user ${userId}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Send notification to all active SSE connections for a user
   */
  private async sendToConnections(
    userId: string,
    notification: Record<string, any>,
  ): Promise<void> {
    const userConnections = this.connections.get(userId);

    if (!userConnections || userConnections.size === 0) {
      this.logger.debug(`No active SSE connections for user ${userId}`);
      return;
    }

    const data = JSON.stringify(notification);
    const deadConnections: ExpressResponse[] = [];

    for (const response of userConnections) {
      try {
        // Send SSE event
        (response as Prisma.InputJsonValue).write(`data: ${data}\n\n`);
      } catch (error) {
        this.logger.warn(
          `Failed to write to SSE connection for user ${userId}: ${error.message}`,
        );
        deadConnections.push(response);
      }
    }

    // Clean up dead connections
    deadConnections.forEach(conn => {
      userConnections.delete(conn);
    });

    if (userConnections.size === 0) {
      this.connections.delete(userId);
    }
  }

  /**
   * Register an SSE connection for a user
   */
  registerConnection(userId: string, response: ExpressResponse): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    this.connections.get(userId)!.add(response);

    this.logger.debug(
      `Registered SSE connection for user ${userId}. Total connections: ${this.connections.get(userId)!.size}`,
    );
  }

  /**
   * Unregister an SSE connection
   */
  unregisterConnection(userId: string, response: ExpressResponse): void {
    const userConnections = this.connections.get(userId);

    if (userConnections) {
      userConnections.delete(response);

      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }

      this.logger.debug(
        `Unregistered SSE connection for user ${userId}. Remaining: ${userConnections.size}`,
      );
    }
  }

  /**
   * Get the number of active connections for a user
   */
  getConnectionCount(userId: string): number {
    return this.connections.get(userId)?.size || 0;
  }

  /**
   * Get total number of active connections
   */
  getTotalConnections(): number {
    let total = 0;
    for (const connections of this.connections.values()) {
      total += connections.size;
    }
    return total;
  }

  /**
   * Broadcast notification to all users (admin use)
   */
  async broadcastNotification(notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    priority: number;
    createdAt: Date;
  }): Promise<void> {
    const data = JSON.stringify(notification);

    for (const [userId, connections] of this.connections.entries()) {
      for (const response of connections) {
        try {
          (response as Prisma.InputJsonValue).write(`data: ${data}\n\n`);
        } catch (error) {
          this.logger.warn(
            `Failed to broadcast to user ${userId}: ${error.message}`,
          );
        }
      }
    }

    this.logger.log(
      `Broadcast notification to ${this.connections.size} users: ${notification.title}`,
    );
  }

  /**
   * Send heartbeat to all connections (keep-alive)
   */
  sendHeartbeat(): void {
    const heartbeat = JSON.stringify({ type: 'heartbeat', timestamp: new Date() });

    for (const connections of this.connections.values()) {
      for (const response of connections) {
        try {
          (response as Prisma.InputJsonValue).write(`: ${heartbeat}\n\n`);
        } catch (error) {
          // Connection is dead, will be cleaned up on next send
        }
      }
    }
  }

  /**
   * Clean up dead connections (scheduled job)
   */
  cleanupDeadConnections(): void {
    let cleaned = 0;

    for (const [userId, connections] of this.connections.entries()) {
      const deadConnections: ExpressResponse[] = [];

      for (const response of connections) {
        // Try to write a comment (won't affect client)
        try {
          (response as Prisma.InputJsonValue).write(':ping\n\n');
        } catch (error) {
          deadConnections.push(response);
        }
      }

      deadConnections.forEach(conn => {
        connections.delete(conn);
        cleaned++;
      });

      if (connections.size === 0) {
        this.connections.delete(userId);
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} dead SSE connections`);
    }
  }

  /**
   * Get statistics about active connections
   */
  getStats() {
    return {
      totalUsers: this.connections.size,
      totalConnections: this.getTotalConnections(),
      userBreakdown: Array.from(this.connections.entries()).map(([userId, conns]) => ({
        userId,
        connections: conns.size,
      })),
    };
  }
}
