import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { EmailSyncService } from './email-sync.service';

/**
 * Email Sync Scheduler
 * Automatically syncs all active email connections every 30 minutes
 *
 * Features:
 * - Scheduled automatic sync using @Cron decorator
 * - Syncs all connections with syncEnabled=true
 * - Incremental sync (only new emails since last sync)
 * - Error handling (continues with other connections on failure)
 * - Statistics tracking (total, successful, failed)
 * - Comprehensive logging
 *
 * Schedule:
 * - Runs every 30 minutes (cron: every 30 minutes)
 * - Cron format: minute hour day month weekday
 *
 * Integration:
 * - Uses PrismaService to find active connections
 * - Uses EmailSyncService.triggerSync() to initiate syncs
 * - Each connection sync is independent (failures don't stop others)
 */
@Injectable()
export class EmailSyncScheduler {
  private readonly logger = new Logger(EmailSyncScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailSyncService: EmailSyncService,
  ) {
    this.logger.log('Email Sync Scheduler initialized');
  }

  /**
   * Scheduled email sync job
   * Runs every 30 minutes to sync all active email connections
   *
   * Cron schedule pattern for every 30 minutes
   */
  @Cron('*/30 * * * *', { name: 'email-sync-scheduler' })
  async handleEmailSync(): Promise<void> {
    this.logger.log('Starting scheduled email sync...');

    const startTime = Date.now();
    let totalConnections = 0;
    let successfulSyncs = 0;
    let failedSyncs = 0;
    const errors: Array<{ connectionId: string; error: string }> = [];

    try {
      // Find all active email connections with sync enabled
      const activeConnections = await this.prisma.emailConnection.findMany({
        where: {
          syncEnabled: true,
          // Optional: Only sync verified connections
          // emailVerified: true,
        },
        select: {
          id: true,
          provider: true,
          email: true,
          orgId: true,
          userId: true,
        },
      });

      totalConnections = activeConnections.length;

      if (totalConnections === 0) {
        this.logger.log('No active email connections found with sync enabled');
        return;
      }

      this.logger.log(
        `Found ${totalConnections} active email connection(s) to sync`,
      );

      // Trigger sync for each active connection
      for (const connection of activeConnections) {
        try {
          this.logger.debug(
            `Syncing connection ${connection.id} (${connection.provider} - ${connection.email})`,
          );

          // Trigger incremental sync for this connection
          await this.emailSyncService.triggerSync({
            connectionId: connection.id,
            syncType: 'INCREMENTAL',
          });

          successfulSyncs++;

          this.logger.debug(
            `Successfully queued sync for connection ${connection.id}`,
          );
        } catch (error) {
          failedSyncs++;

          const errorMessage = error?.message || 'Unknown error';
          errors.push({
            connectionId: connection.id,
            error: errorMessage,
          });

          this.logger.error(
            `Failed to sync connection ${connection.id}: ${errorMessage}`,
            error?.stack,
          );

          // Continue with next connection (don't throw)
        }
      }

      // Log completion summary
      const duration = Date.now() - startTime;

      this.logger.log(
        `Scheduled email sync completed in ${duration}ms - ` +
          `Total: ${totalConnections}, ` +
          `Successful: ${successfulSyncs}, ` +
          `Failed: ${failedSyncs}`,
      );

      // Log errors if any
      if (errors.length > 0) {
        this.logger.warn(
          `Failed sync details: ${JSON.stringify(errors, null, 2)}`,
        );
      }
    } catch (error) {
      // Catch any unexpected errors in the main sync loop
      const duration = Date.now() - startTime;

      this.logger.error(
        `Scheduled email sync failed after ${duration}ms: ${error?.message}`,
        error?.stack,
      );

      // Don't re-throw - let scheduler continue on next run
    }
  }
}
