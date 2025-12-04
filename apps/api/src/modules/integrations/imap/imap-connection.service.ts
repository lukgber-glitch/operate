/**
 * IMAP Connection Service
 * Manages connection pool and connection lifecycle
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { PrismaService } from '@operate/database';
import { ImapService } from './imap.service';
import {
  ImapConnectionConfig,
  ImapConnectionStatus,
  ImapConnectionPoolStats,
} from './imap.types';
import { CONNECTION_POOL_CONFIG, IMAP_ERROR_MESSAGES } from './imap.constants';

interface PooledConnection {
  client: ImapFlow;
  connectionId: string;
  lastUsed: Date;
  inUse: boolean;
}

@Injectable()
export class ImapConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(ImapConnectionService.name);
  private readonly connectionPool = new Map<string, PooledConnection[]>();
  private readonly activeConnections = new Map<string, ImapFlow>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly imapService: ImapService,
  ) {
    // Start connection cleanup interval
    this.cleanupInterval = setInterval(
      () => this.cleanupIdleConnections(),
      CONNECTION_POOL_CONFIG.idleTimeoutMillis,
    );
  }

  async onModuleDestroy() {
    clearInterval(this.cleanupInterval);
    await this.closeAllConnections();
  }

  /**
   * Get or create an IMAP connection for a user
   */
  async getConnection(connectionId: string): Promise<ImapFlow> {
    // Check if connection already exists and is active
    if (this.activeConnections.has(connectionId)) {
      const client = this.activeConnections.get(connectionId);
      if (client && client.usable) {
        return client;
      }
      // Connection exists but not usable, remove it
      this.activeConnections.delete(connectionId);
    }

    // Try to get from pool
    const pooledConnection = await this.getFromPool(connectionId);
    if (pooledConnection) {
      this.activeConnections.set(connectionId, pooledConnection);
      return pooledConnection;
    }

    // Create new connection
    const newConnection = await this.createNewConnection(connectionId);
    this.activeConnections.set(connectionId, newConnection);
    return newConnection;
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(connectionId: string): void {
    const client = this.activeConnections.get(connectionId);
    if (client && client.usable) {
      this.returnToPool(connectionId, client);
    }
    this.activeConnections.delete(connectionId);
  }

  /**
   * Test connection for a specific email connection
   */
  async testConnection(connectionId: string): Promise<ImapConnectionStatus> {
    try {
      const emailConnection = await this.prisma.emailConnection.findUnique({
        where: { id: connectionId },
      });

      if (!emailConnection) {
        return {
          connected: false,
          authenticated: false,
          error: 'Email connection not found',
        };
      }

      if (emailConnection.provider !== 'IMAP') {
        return {
          connected: false,
          authenticated: false,
          error: 'Not an IMAP connection',
        };
      }

      const config = await this.buildConnectionConfig(emailConnection);
      return await this.imapService.testConnection(config);
    } catch (error) {
      this.logger.error(`Test connection failed: ${error.message}`, error.stack);
      return {
        connected: false,
        authenticated: false,
        error: error.message,
      };
    }
  }

  /**
   * Save IMAP connection configuration
   */
  async saveConnection(
    userId: string,
    orgId: string,
    email: string,
    password: string,
    serverConfig?: Partial<ImapConnectionConfig>,
  ): Promise<string> {
    try {
      // Encrypt password
      const encrypted = this.imapService.encryptPassword(password);

      // Store configuration in custom JSON field if provided
      const imapConfig = serverConfig
        ? JSON.stringify({
            host: serverConfig.host,
            port: serverConfig.port,
            secure: serverConfig.secure,
          })
        : null;

      // Create or update email connection
      const connection = await this.prisma.emailConnection.upsert({
        where: {
          userId_provider: {
            userId,
            provider: 'IMAP',
          },
        },
        create: {
          userId,
          orgId,
          provider: 'IMAP',
          email,
          accessToken: encrypted.encryptedPassword,
          encryptionIv: encrypted.iv,
          encryptionTag: encrypted.authTag,
          // Store IMAP config in metadata field if available
          ...(imapConfig && { metadata: { imapConfig } }),
        },
        update: {
          email,
          accessToken: encrypted.encryptedPassword,
          encryptionIv: encrypted.iv,
          encryptionTag: encrypted.authTag,
          ...(imapConfig && { metadata: { imapConfig } }),
        },
      });

      this.logger.log(`IMAP connection saved for user ${userId}`);
      return connection.id;
    } catch (error) {
      this.logger.error(`Failed to save connection: ${error.message}`, error.stack);
      throw new Error('Failed to save IMAP connection');
    }
  }

  /**
   * Delete IMAP connection
   */
  async deleteConnection(connectionId: string): Promise<void> {
    try {
      // Close active connection if exists
      const client = this.activeConnections.get(connectionId);
      if (client) {
        await this.imapService.closeConnection(client);
        this.activeConnections.delete(connectionId);
      }

      // Remove from pool
      this.connectionPool.delete(connectionId);

      // Delete from database
      await this.prisma.emailConnection.delete({
        where: { id: connectionId },
      });

      this.logger.log(`IMAP connection deleted: ${connectionId}`);
    } catch (error) {
      this.logger.error(`Failed to delete connection: ${error.message}`, error.stack);
      throw new Error('Failed to delete IMAP connection');
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats(): ImapConnectionPoolStats {
    let activeCount = 0;
    let idleCount = 0;

    for (const connections of this.connectionPool.values()) {
      for (const conn of connections) {
        if (conn.inUse) {
          activeCount++;
        } else {
          idleCount++;
        }
      }
    }

    return {
      active: activeCount,
      idle: idleCount,
      waiting: 0, // We don't track waiting connections in this simple implementation
      total: activeCount + idleCount,
    };
  }

  /**
   * Build IMAP connection config from database record
   */
  private async buildConnectionConfig(
    emailConnection: any,
  ): Promise<ImapConnectionConfig> {
    // Decrypt password
    const password = this.imapService.decryptPassword({
      encryptedPassword: emailConnection.accessToken,
      iv: emailConnection.encryptionIv,
      authTag: emailConnection.encryptionTag,
    });

    // Check if custom IMAP config is stored
    let config: ImapConnectionConfig;

    if (emailConnection.metadata?.imapConfig) {
      const imapConfig = JSON.parse(emailConnection.metadata.imapConfig);
      config = {
        host: imapConfig.host,
        port: imapConfig.port,
        secure: imapConfig.secure,
        auth: {
          user: emailConnection.email,
          pass: password,
        },
      };
    } else {
      // Try to infer from email domain
      const domain = emailConnection.email.split('@')[1]?.toLowerCase();
      const preset = this.inferPresetFromDomain(domain);

      if (!preset) {
        throw new Error('IMAP server configuration not found');
      }

      config = {
        ...preset,
        auth: {
          user: emailConnection.email,
          pass: password,
        },
      };
    }

    return config;
  }

  /**
   * Infer IMAP preset from email domain
   */
  private inferPresetFromDomain(domain: string): ImapConnectionConfig | null {
    if (domain.includes('gmail.com')) {
      return this.imapService.getPresetConfig('GMAIL');
    }
    if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) {
      return this.imapService.getPresetConfig('OUTLOOK');
    }
    if (domain.includes('yahoo.com')) {
      return this.imapService.getPresetConfig('YAHOO');
    }
    if (domain.includes('icloud.com') || domain.includes('me.com')) {
      return this.imapService.getPresetConfig('ICLOUD');
    }
    if (domain.includes('aol.com')) {
      return this.imapService.getPresetConfig('AOL');
    }

    return null;
  }

  /**
   * Create new IMAP connection
   */
  private async createNewConnection(connectionId: string): Promise<ImapFlow> {
    try {
      const emailConnection = await this.prisma.emailConnection.findUnique({
        where: { id: connectionId },
      });

      if (!emailConnection) {
        throw new Error(IMAP_ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      const config = await this.buildConnectionConfig(emailConnection);
      return await this.imapService.createConnection(config);
    } catch (error) {
      this.logger.error(`Failed to create connection: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get connection from pool
   */
  private async getFromPool(connectionId: string): Promise<ImapFlow | null> {
    const poolConnections = this.connectionPool.get(connectionId);
    if (!poolConnections || poolConnections.length === 0) {
      return null;
    }

    // Find an idle connection
    const available = poolConnections.find((conn) => !conn.inUse && conn.client.usable);
    if (available) {
      available.inUse = true;
      available.lastUsed = new Date();
      return available.client;
    }

    return null;
  }

  /**
   * Return connection to pool
   */
  private returnToPool(connectionId: string, client: ImapFlow): void {
    if (!this.connectionPool.has(connectionId)) {
      this.connectionPool.set(connectionId, []);
    }

    const poolConnections = this.connectionPool.get(connectionId)!;

    // Check if we're at max pool size
    if (poolConnections.length >= CONNECTION_POOL_CONFIG.max) {
      // Close the connection instead of returning to pool
      this.imapService.closeConnection(client).catch(() => {});
      return;
    }

    poolConnections.push({
      client,
      connectionId,
      lastUsed: new Date(),
      inUse: false,
    });
  }

  /**
   * Clean up idle connections
   */
  private async cleanupIdleConnections(): Promise<void> {
    const now = Date.now();

    for (const [connectionId, connections] of this.connectionPool.entries()) {
      const toRemove: number[] = [];

      for (let i = 0; i < connections.length; i++) {
        const conn = connections[i];
        const idleTime = now - conn.lastUsed.getTime();

        if (!conn.inUse && idleTime > CONNECTION_POOL_CONFIG.idleTimeoutMillis) {
          toRemove.push(i);
          await this.imapService.closeConnection(conn.client);
        }
      }

      // Remove closed connections
      for (const index of toRemove.reverse()) {
        connections.splice(index, 1);
      }

      // Remove empty pools
      if (connections.length === 0) {
        this.connectionPool.delete(connectionId);
      }
    }
  }

  /**
   * Close all connections
   */
  private async closeAllConnections(): Promise<void> {
    // Close active connections
    for (const client of this.activeConnections.values()) {
      try {
        await this.imapService.closeConnection(client);
      } catch (error) {
        // Ignore errors during shutdown
      }
    }
    this.activeConnections.clear();

    // Close pooled connections
    for (const connections of this.connectionPool.values()) {
      for (const conn of connections) {
        try {
          await this.imapService.closeConnection(conn.client);
        } catch (error) {
          // Ignore errors during shutdown
        }
      }
    }
    this.connectionPool.clear();

    this.logger.log('All IMAP connections closed');
  }
}
