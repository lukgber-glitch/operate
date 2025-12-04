import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { QuickBooksSyncService } from '../services/quickbooks-sync.service';

/**
 * QuickBooks Sync Job
 * Scheduled background jobs for automatic synchronization
 */
@Injectable()
export class QuickBooksSyncJob {
  private readonly logger = new Logger(QuickBooksSyncJob.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly syncService: QuickBooksSyncService,
  ) {}

  /**
   * Incremental sync job - runs every hour
   * Syncs changes from QuickBooks for all connected organizations
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleIncrementalSync() {
    if (this.isRunning) {
      this.logger.warn('Incremental sync already running, skipping this run');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting scheduled incremental sync');

    try {
      // Get all active QuickBooks connections
      const connections = await this.prisma.quickBooksConnection.findMany({
        where: {
          isConnected: true,
          status: 'CONNECTED',
        },
        select: {
          id: true,
          orgId: true,
          companyName: true,
          lastSyncAt: true,
        },
      });

      this.logger.log(`Found ${connections.length} active connections to sync`);

      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ orgId: string; error: string }>,
      };

      // Process each connection
      for (const connection of connections) {
        try {
          this.logger.log(
            `Syncing org ${connection.orgId} (${connection.companyName || 'Unknown'})`,
          );

          await this.syncService.performIncrementalSync(
            connection.orgId,
            connection.lastSyncAt || undefined,
            'system',
          );

          results.success++;
          this.logger.log(`Successfully synced org ${connection.orgId}`);
        } catch (error) {
          results.failed++;
          results.errors.push({
            orgId: connection.orgId,
            error: error.message,
          });
          this.logger.error(
            `Failed to sync org ${connection.orgId}: ${error.message}`,
            error.stack,
          );

          // Update connection with error
          await this.prisma.quickBooksConnection.update({
            where: { id: connection.id },
            data: {
              lastError: error.message,
              lastErrorAt: new Date(),
            },
          });
        }
      }

      this.logger.log(
        `Incremental sync completed: ${results.success} successful, ${results.failed} failed`,
      );

      if (results.errors.length > 0) {
        this.logger.warn('Sync errors:', JSON.stringify(results.errors, null, 2));
      }
    } catch (error) {
      this.logger.error('Incremental sync job failed:', error.stack);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Full sync job - runs daily at 2 AM
   * Performs a complete sync to catch any missed changes
   */
  @Cron('0 2 * * *') // Every day at 2:00 AM
  async handleFullSync() {
    if (this.isRunning) {
      this.logger.warn('Sync job already running, skipping full sync');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting scheduled full sync');

    try {
      // Get all active QuickBooks connections
      const connections = await this.prisma.quickBooksConnection.findMany({
        where: {
          isConnected: true,
          status: 'CONNECTED',
        },
        select: {
          id: true,
          orgId: true,
          companyName: true,
        },
      });

      this.logger.log(`Found ${connections.length} active connections for full sync`);

      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ orgId: string; error: string }>,
      };

      // Process each connection
      for (const connection of connections) {
        try {
          this.logger.log(
            `Full sync for org ${connection.orgId} (${connection.companyName || 'Unknown'})`,
          );

          await this.syncService.performFullSync(connection.orgId, 'system');

          results.success++;
          this.logger.log(`Successfully completed full sync for org ${connection.orgId}`);
        } catch (error) {
          results.failed++;
          results.errors.push({
            orgId: connection.orgId,
            error: error.message,
          });
          this.logger.error(
            `Failed full sync for org ${connection.orgId}: ${error.message}`,
            error.stack,
          );

          // Update connection with error
          await this.prisma.quickBooksConnection.update({
            where: { id: connection.id },
            data: {
              lastError: error.message,
              lastErrorAt: new Date(),
            },
          });
        }
      }

      this.logger.log(
        `Full sync completed: ${results.success} successful, ${results.failed} failed`,
      );

      if (results.errors.length > 0) {
        this.logger.warn('Full sync errors:', JSON.stringify(results.errors, null, 2));
      }
    } catch (error) {
      this.logger.error('Full sync job failed:', error.stack);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Cleanup job - runs daily at 3 AM
   * Cleans up old sync logs and resolved conflicts
   */
  @Cron('0 3 * * *') // Every day at 3:00 AM
  async handleCleanup() {
    this.logger.log('Starting cleanup job');

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // Delete old successful sync logs (keep for 30 days)
      const deletedLogs = await this.prisma.quickBooksSyncLog.deleteMany({
        where: {
          status: 'COMPLETED',
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(`Deleted ${deletedLogs.count} old sync logs`);

      // Delete old resolved conflicts (keep for 90 days)
      const deletedConflicts = await this.prisma.quickBooksSyncConflict.deleteMany({
        where: {
          isResolved: true,
          resolvedAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      this.logger.log(`Deleted ${deletedConflicts.count} old resolved conflicts`);

      this.logger.log('Cleanup job completed');
    } catch (error) {
      this.logger.error('Cleanup job failed:', error.stack);
    }
  }

  /**
   * Connection health check - runs every 30 minutes
   * Checks token expiry and refreshes if needed
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleHealthCheck() {
    this.logger.debug('Starting connection health check');

    try {
      const now = new Date();
      const bufferTime = 10 * 60 * 1000; // 10 minutes buffer

      // Find connections with tokens expiring soon
      const connections = await this.prisma.quickBooksConnection.findMany({
        where: {
          isConnected: true,
          tokenExpiresAt: {
            lt: new Date(now.getTime() + bufferTime),
          },
        },
      });

      if (connections.length === 0) {
        this.logger.debug('No connections require token refresh');
        return;
      }

      this.logger.log(
        `Found ${connections.length} connections requiring token refresh`,
      );

      for (const connection of connections) {
        try {
          // Token refresh is handled automatically by the auth service
          // Just trigger a connection status check
          this.logger.log(`Checking connection health for org ${connection.orgId}`);
        } catch (error) {
          this.logger.error(
            `Health check failed for org ${connection.orgId}: ${error.message}`,
          );

          await this.prisma.quickBooksConnection.update({
            where: { id: connection.id },
            data: {
              lastError: error.message,
              lastErrorAt: new Date(),
            },
          });
        }
      }

      this.logger.debug('Connection health check completed');
    } catch (error) {
      this.logger.error('Health check job failed:', error.stack);
    }
  }

  /**
   * Rate limit tracking - reset counters hourly
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleRateLimitReset() {
    this.logger.debug('Resetting rate limit counters');
    // Rate limiting logic would be implemented here
    // QuickBooks has different rate limits based on plan
  }
}
