import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AutopilotService } from './autopilot.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AutopilotCronService {
  private readonly logger = new Logger(AutopilotCronService.name);

  constructor(
    private readonly autopilotService: AutopilotService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Run detection methods every 15 minutes for active autopilot organizations
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async runDetectionTasks() {
    this.logger.log('Running autopilot detection tasks');

    try {
      // Get all organizations with autopilot enabled
      const configs = await this.prisma.autopilotConfig.findMany({
        where: { enabled: true },
        select: { organisationId: true },
      });

      this.logger.log(
        `Found ${configs.length} organizations with autopilot enabled`,
      );

      // Run detection methods for each organization
      for (const config of configs) {
        const orgId = config.organisationId;

        try {
          await Promise.all([
            this.autopilotService.detectCategorizableTransactions(orgId),
            this.autopilotService.detectInvoiceOpportunities(orgId),
            this.autopilotService.detectOverdueInvoices(orgId),
            this.autopilotService.detectReconciliationMatches(orgId),
            this.autopilotService.detectUnprocessedReceipts(orgId),
            this.autopilotService.detectPayableBills(orgId),
          ]);
        } catch (error) {
          this.logger.error(
            `Error running detection tasks for org ${orgId}:`,
            error,
          );
        }
      }

      this.logger.log('Completed autopilot detection tasks');
    } catch (error) {
      this.logger.error('Error in runDetectionTasks:', error);
    }
  }

  /**
   * Execute approved actions every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async executeApprovedActions() {
    this.logger.log('Executing approved autopilot actions');

    try {
      // Get all organizations with autopilot enabled
      const configs = await this.prisma.autopilotConfig.findMany({
        where: { enabled: true },
        select: { organisationId: true },
      });

      this.logger.log(
        `Processing actions for ${configs.length} organizations`,
      );

      // Process queue for each organization
      for (const config of configs) {
        try {
          await this.autopilotService.processQueue(config.organisationId);
        } catch (error) {
          this.logger.error(
            `Error processing queue for org ${config.organisationId}:`,
            error,
          );
        }
      }

      this.logger.log('Completed executing approved actions');
    } catch (error) {
      this.logger.error('Error in executeApprovedActions:', error);
    }
  }

  /**
   * Generate daily summaries at configured times
   * Runs every hour and checks if it's time to send summaries
   */
  @Cron(CronExpression.EVERY_HOUR)
  async generateDailySummaries() {
    this.logger.log('Checking for daily summaries to generate');

    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

      // Get all configs with daily summary enabled at this hour
      const configs = await this.prisma.autopilotConfig.findMany({
        where: {
          enabled: true,
          dailySummaryEnabled: true,
        },
      });

      for (const config of configs) {
        // Check if this is the right hour for this org
        const [summaryHour, summaryMinute] = config.dailySummaryTime
          .split(':')
          .map(Number);

        if (currentHour === summaryHour) {
          try {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);

            await this.autopilotService.generateDailySummary(
              config.organisationId,
              yesterday,
            );

            this.logger.log(
              `Generated daily summary for org ${config.organisationId}`,
            );

            // TODO: Send email summary to organization admins
          } catch (error) {
            this.logger.error(
              `Error generating summary for org ${config.organisationId}:`,
              error,
            );
          }
        }
      }

      this.logger.log('Completed daily summary generation');
    } catch (error) {
      this.logger.error('Error in generateDailySummaries:', error);
    }
  }

  /**
   * Cleanup old autopilot actions (older than 90 days)
   * Runs daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldActions() {
    this.logger.log('Cleaning up old autopilot actions');

    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await this.prisma.autopilotAction.deleteMany({
        where: {
          createdAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      this.logger.log(`Deleted ${result.count} old autopilot actions`);
    } catch (error) {
      this.logger.error('Error in cleanupOldActions:', error);
    }
  }
}
