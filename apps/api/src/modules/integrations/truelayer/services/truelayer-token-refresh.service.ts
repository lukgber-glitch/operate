import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/modules/database/prisma.service';
import { TrueLayerService } from '../truelayer.service';
import { TrueLayerConnectionStatus } from '../truelayer.types';
import { addHours, addSeconds } from 'date-fns';

/**
 * TrueLayer Token Refresh Service
 * Automatically refreshes expiring access tokens to maintain uninterrupted access
 *
 * Features:
 * - Scheduled token refresh every 6 hours
 * - Proactive refresh (12 hours before expiry)
 * - Automatic connection status management
 * - Error handling and logging
 * - Re-authentication detection
 */
@Injectable()
export class TrueLayerTokenRefreshService {
  private readonly logger = new Logger(TrueLayerTokenRefreshService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly trueLayerService: TrueLayerService,
  ) {}

  /**
   * Scheduled token refresh job
   * Runs every 6 hours to refresh expiring tokens
   */
  @Cron(CronExpression.EVERY_6_HOURS, {
    name: 'truelayer-token-refresh',
    timeZone: 'UTC',
  })
  async refreshExpiringTokens(): Promise<void> {
    this.logger.log('Starting scheduled token refresh job');

    const startTime = Date.now();

    try {
      // Find connections with tokens expiring within 12 hours
      const expiringConnections = await this.findExpiringConnections();

      this.logger.log(
        `Found ${expiringConnections.length} connections with expiring tokens`,
      );

      let refreshedCount = 0;
      let failedCount = 0;
      let reauthRequiredCount = 0;

      // Refresh tokens for each connection
      for (const connection of expiringConnections) {
        try {
          await this.trueLayerService.refreshAccessToken(
            connection.user_id,
            connection.id,
          );
          refreshedCount++;
          this.logger.log(`Refreshed tokens for connection ${connection.id}`);
        } catch (error) {
          failedCount++;
          this.logger.error(
            `Failed to refresh tokens for connection ${connection.id}: ${error.message}`,
            error.stack,
          );

          // Check if error indicates need for re-authentication
          if (this.isReauthRequired(error)) {
            await this.markNeedsReauth(connection.id);
            reauthRequiredCount++;
            this.logger.warn(
              `Connection ${connection.id} requires re-authentication`,
            );
          }
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Token refresh job completed: ${refreshedCount} refreshed, ${failedCount} failed, ${reauthRequiredCount} need reauth (${duration}ms)`,
      );
    } catch (error) {
      this.logger.error('Token refresh job failed:', error);
    }
  }

  /**
   * Manually refresh tokens for a specific connection
   */
  async refreshConnection(connectionId: string, userId: string): Promise<void> {
    this.logger.log(`Manually refreshing tokens for connection ${connectionId}`);

    try {
      await this.trueLayerService.refreshAccessToken(userId, connectionId);
      this.logger.log(`Tokens refreshed successfully for connection ${connectionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to refresh tokens for connection ${connectionId}:`,
        error,
      );

      if (this.isReauthRequired(error)) {
        await this.markNeedsReauth(connectionId);
        throw new Error('Connection requires re-authentication');
      }

      throw error;
    }
  }

  /**
   * Find connections with tokens expiring within the threshold
   */
  private async findExpiringConnections(): Promise<any[]> {
    const threshold = addHours(new Date(), 12); // 12 hours from now

    const connections = await this.prisma.$queryRaw<any[]>`
      SELECT id, user_id, provider_id, provider_name, expires_at
      FROM truelayer_connections
      WHERE status = ${TrueLayerConnectionStatus.ACTIVE}
        AND expires_at <= ${threshold}
        AND expires_at > NOW()
      ORDER BY expires_at ASC
    `;

    return connections;
  }

  /**
   * Mark connection as requiring re-authentication
   */
  private async markNeedsReauth(connectionId: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE truelayer_connections
        SET
          status = ${TrueLayerConnectionStatus.EXPIRED},
          updated_at = NOW()
        WHERE id = ${connectionId}
      `;

      this.logger.log(`Marked connection ${connectionId} as expired`);

      // TODO: Trigger notification to user about re-authentication needed
      // await this.notificationService.notifyReauthRequired(connectionId);
    } catch (error) {
      this.logger.error(
        `Failed to mark connection ${connectionId} as expired:`,
        error,
      );
    }
  }

  /**
   * Check if error indicates re-authentication is required
   */
  private isReauthRequired(error: any): boolean {
    // HTTP 401 Unauthorized typically means refresh token is invalid/expired
    if (error.response?.status === 401) {
      return true;
    }

    // Check for specific error codes from TrueLayer
    const errorCode = error.response?.data?.error;
    const reauthErrorCodes = [
      'invalid_grant',
      'unauthorized_client',
      'access_denied',
      'consent_expired',
      'consent_revoked',
    ];

    return reauthErrorCodes.includes(errorCode);
  }

  /**
   * Get token refresh statistics
   */
  async getRefreshStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    expiringWithin24Hours: number;
  }> {
    const threshold = addHours(new Date(), 24);

    const [total, active, expired, expiringSoon] = await Promise.all([
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM truelayer_connections
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM truelayer_connections
        WHERE status = ${TrueLayerConnectionStatus.ACTIVE}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM truelayer_connections
        WHERE status = ${TrueLayerConnectionStatus.EXPIRED}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM truelayer_connections
        WHERE status = ${TrueLayerConnectionStatus.ACTIVE}
          AND expires_at <= ${threshold}
          AND expires_at > NOW()
      `,
    ]);

    return {
      total: Number(total[0].count),
      active: Number(active[0].count),
      expired: Number(expired[0].count),
      expiringWithin24Hours: Number(expiringSoon[0].count),
    };
  }
}
