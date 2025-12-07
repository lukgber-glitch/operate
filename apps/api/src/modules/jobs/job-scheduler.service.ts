/**
 * Job Scheduler Service
 * Schedules daily insight jobs for all active organizations
 * Runs at 6:00 AM in each organization's timezone
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { DAILY_INSIGHT_QUEUE } from './daily-insight.processor';
import { InsightJobData } from './types';

@Injectable()
export class JobSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(JobSchedulerService.name);
  private readonly INSIGHT_HOUR = 6; // 6 AM

  constructor(
    @InjectQueue(DAILY_INSIGHT_QUEUE)
    private readonly insightQueue: Queue<InsightJobData>,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Initialize - schedule jobs for all organizations on startup
   */
  async onModuleInit() {
    this.logger.log('Job Scheduler Service initialized');
    // Optionally trigger manual check on startup for testing
    // await this.scheduleDailyInsights();
  }

  /**
   * Schedule daily insight jobs every hour
   * Check which organizations need their 6 AM job
   */
  @Cron('0 * * * *', {
    name: 'check-daily-insights',
    timeZone: 'UTC',
  })
  async scheduleDailyInsights() {
    this.logger.log('Checking which organizations need daily insights');

    try {
      // Get all active organizations
      const organizations = await this.prisma.organisation.findMany({
        where: {
          // Add status field if available, otherwise just get all
          // status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          timezone: true,
        },
      });

      const now = new Date();
      let jobsScheduled = 0;

      for (const org of organizations) {
        // Calculate the current hour in the organization's timezone
        const orgTime = this.getLocalTime(now, org.timezone);
        const orgHour = orgTime.getHours();

        // Check if it's 6 AM in the org's timezone
        if (orgHour === this.INSIGHT_HOUR) {
          // Check if we already ran today
          const alreadyRan = await this.checkIfRanToday(org.id);

          if (!alreadyRan) {
            await this.scheduleInsightJob(org.id, 'scheduler');
            jobsScheduled++;
            this.logger.log(`Scheduled daily insights for ${org.name} (${org.timezone})`);
          }
        }
      }

      if (jobsScheduled > 0) {
        this.logger.log(`Scheduled daily insights for ${jobsScheduled} organization(s)`);
      }
    } catch (error) {
      this.logger.error(`Failed to schedule daily insights: ${error.message}`);
    }
  }

  /**
   * Schedule an insight job for a specific organization
   */
  async scheduleInsightJob(orgId: string, triggeredBy: 'scheduler' | 'manual' = 'manual') {
    try {
      const job = await this.insightQueue.add(
        'generate-insights',
        {
          orgId,
          triggeredBy,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000, // 1 minute
          },
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50, // Keep last 50 failed jobs
        },
      );

      this.logger.log(`Daily insight job scheduled for org ${orgId} with ID ${job.id}`);
      return { jobId: job.id };
    } catch (error) {
      this.logger.error(`Failed to schedule insight job for org ${orgId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Manually trigger insights for a specific organization
   */
  async triggerManualInsights(orgId: string) {
    this.logger.log(`Manually triggering daily insights for org ${orgId}`);
    return this.scheduleInsightJob(orgId, 'manual');
  }

  /**
   * Manually trigger insights for all active organizations
   */
  async triggerAllInsights() {
    this.logger.log('Manually triggering daily insights for all organizations');

    try {
      const organizations = await this.prisma.organisation.findMany({
        select: { id: true, name: true },
      });

      const results = [];

      for (const org of organizations) {
        try {
          const result = await this.scheduleInsightJob(org.id, 'manual');
          results.push({ orgId: org.id, orgName: org.name, success: true, jobId: result.jobId });
        } catch (error) {
          results.push({ orgId: org.id, orgName: org.name, success: false, error: error.message });
        }
      }

      this.logger.log(`Triggered insights for ${results.length} organization(s)`);
      return results;
    } catch (error) {
      this.logger.error(`Failed to trigger all insights: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if insight job already ran today for this org
   */
  private async checkIfRanToday(orgId: string): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if there are any suggestions created today
      const count = await this.prisma.suggestion.count({
        where: {
          orgId,
          createdAt: { gte: today },
          // Could add a specific flag or source to identify auto-generated insights
        },
      });

      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking if job ran today for org ${orgId}:`, error);
      return false; // If error, allow job to run
    }
  }

  /**
   * Get local time for a timezone
   */
  private getLocalTime(date: Date, timezone: string): Date {
    try {
      // Convert to the organization's timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const parts = formatter.formatToParts(date);
      const getValue = (type: string) => {
        const part = parts.find(p => p.type === type);
        return part ? part.value : '0';
      };

      const year = parseInt(getValue('year'));
      const month = parseInt(getValue('month')) - 1; // months are 0-indexed
      const day = parseInt(getValue('day'));
      const hour = parseInt(getValue('hour'));
      const minute = parseInt(getValue('minute'));
      const second = parseInt(getValue('second'));

      return new Date(year, month, day, hour, minute, second);
    } catch (error) {
      this.logger.error(`Error converting to timezone ${timezone}:`, error);
      return date; // Fallback to UTC
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.insightQueue.getWaitingCount(),
        this.insightQueue.getActiveCount(),
        this.insightQueue.getCompletedCount(),
        this.insightQueue.getFailedCount(),
        this.insightQueue.getDelayedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + delayed,
      };
    } catch (error) {
      this.logger.error('Error getting queue stats:', error);
      throw error;
    }
  }
}
