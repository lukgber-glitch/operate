import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { DatevExportService } from '../compliance/exports/datev/datev-export.service';
import { SaftService } from '../compliance/exports/saft/saft.service';
import { BmdExportService } from '../compliance/exports/bmd/bmd-export.service';
import {
  CreateScheduledExportDto,
  UpdateScheduledExportDto,
  ScheduledExportResponseDto,
  ScheduledExportRunResponseDto,
  ExportType,
} from './dto';
import * as cronParser from 'cron-parser';

/**
 * Export Scheduler Service
 * Manages scheduled exports and their execution
 */
@Injectable()
export class ExportSchedulerService {
  private readonly logger = new Logger(ExportSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('export-scheduler') private readonly exportQueue: Queue,
    private readonly datevService: DatevExportService,
    private readonly saftService: SaftService,
    private readonly bmdService: BmdExportService,
  ) {}

  /**
   * Create a new scheduled export
   */
  async create(
    dto: CreateScheduledExportDto,
  ): Promise<ScheduledExportResponseDto> {
    this.logger.log(
      `Creating scheduled export: ${dto.name} for org: ${dto.orgId}`,
    );

    // Validate cron expression and calculate next run
    const nextRunAt = this.calculateNextRun(dto.schedule, dto.timezone);

    // Create scheduled export record
    const scheduledExport = await this.prisma.scheduledExport.create({
      data: {
        orgId: dto.orgId,
        name: dto.name,
        exportType: dto.exportType,
        config: dto.config,
        schedule: dto.schedule,
        timezone: dto.timezone || 'Europe/Berlin',
        isActive: dto.isActive ?? true,
        notifyEmail: dto.notifyEmail,
        nextRunAt,
      },
    });

    // Schedule the job
    if (scheduledExport.isActive) {
      await this.scheduleJob(scheduledExport);
    }

    return this.mapToResponseDto(scheduledExport);
  }

  /**
   * Get all scheduled exports for an organization
   */
  async findAll(orgId: string): Promise<ScheduledExportResponseDto[]> {
    const scheduledExports = await this.prisma.scheduledExport.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    return scheduledExports.map((se) => this.mapToResponseDto(se));
  }

  /**
   * Get a single scheduled export
   */
  async findOne(id: string, orgId: string): Promise<ScheduledExportResponseDto> {
    const scheduledExport = await this.prisma.scheduledExport.findFirst({
      where: { id, orgId },
    });

    if (!scheduledExport) {
      throw new NotFoundException(`Scheduled export ${id} not found`);
    }

    return this.mapToResponseDto(scheduledExport);
  }

  /**
   * Update a scheduled export
   */
  async update(
    id: string,
    orgId: string,
    dto: UpdateScheduledExportDto,
  ): Promise<ScheduledExportResponseDto> {
    this.logger.log(`Updating scheduled export: ${id}`);

    const existing = await this.prisma.scheduledExport.findFirst({
      where: { id, orgId },
    });

    if (!existing) {
      throw new NotFoundException(`Scheduled export ${id} not found`);
    }

    // Calculate new next run if schedule changed
    let nextRunAt = existing.nextRunAt;
    if (dto.schedule && dto.schedule !== existing.schedule) {
      nextRunAt = this.calculateNextRun(
        dto.schedule,
        dto.timezone || existing.timezone,
      );
    }

    const updated = await this.prisma.scheduledExport.update({
      where: { id },
      data: {
        ...dto,
        nextRunAt,
      },
    });

    // Reschedule job if active or status changed
    if (updated.isActive) {
      await this.scheduleJob(updated);
    } else {
      await this.removeJob(id);
    }

    return this.mapToResponseDto(updated);
  }

  /**
   * Delete a scheduled export
   */
  async remove(id: string, orgId: string): Promise<void> {
    this.logger.log(`Deleting scheduled export: ${id}`);

    const existing = await this.prisma.scheduledExport.findFirst({
      where: { id, orgId },
    });

    if (!existing) {
      throw new NotFoundException(`Scheduled export ${id} not found`);
    }

    // Remove from queue
    await this.removeJob(id);

    // Delete from database
    await this.prisma.scheduledExport.delete({
      where: { id },
    });
  }

  /**
   * Get run history for a scheduled export
   */
  async getRunHistory(
    id: string,
    orgId: string,
    limit: number = 20,
  ): Promise<ScheduledExportRunResponseDto[]> {
    // Verify ownership
    const scheduledExport = await this.prisma.scheduledExport.findFirst({
      where: { id, orgId },
    });

    if (!scheduledExport) {
      throw new NotFoundException(`Scheduled export ${id} not found`);
    }

    const runs = await this.prisma.scheduledExportRun.findMany({
      where: { scheduledExportId: id },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return runs.map((run) => this.mapRunToResponseDto(run));
  }

  /**
   * Execute a scheduled export immediately
   */
  async executeNow(id: string, orgId: string): Promise<void> {
    this.logger.log(`Manually executing scheduled export: ${id}`);

    const scheduledExport = await this.prisma.scheduledExport.findFirst({
      where: { id, orgId },
    });

    if (!scheduledExport) {
      throw new NotFoundException(`Scheduled export ${id} not found`);
    }

    // Add job to queue with high priority
    await this.exportQueue.add(
      'execute-export',
      { scheduledExportId: id },
      { priority: 1 },
    );
  }

  /**
   * Process a scheduled export (called by processor)
   */
  async processExport(scheduledExportId: string): Promise<void> {
    this.logger.log(`Processing scheduled export: ${scheduledExportId}`);

    const scheduledExport = await this.prisma.scheduledExport.findUnique({
      where: { id: scheduledExportId },
    });

    if (!scheduledExport) {
      throw new NotFoundException(
        `Scheduled export ${scheduledExportId} not found`,
      );
    }

    // Create run record
    const run = await this.prisma.scheduledExportRun.create({
      data: {
        scheduledExportId,
        status: 'processing',
      },
    });

    try {
      // Execute export based on type
      let exportId: string;

      switch (scheduledExport.exportType) {
        case ExportType.DATEV:
          const datevResult = await this.datevService.createExport(
            scheduledExport.config,
          );
          exportId = datevResult.id;
          break;

        case ExportType.SAFT:
          const saftResult = await this.saftService.createExport(
            scheduledExport.orgId,
            'system',
            scheduledExport.config,
          );
          exportId = saftResult.exportId;
          break;

        case ExportType.BMD:
          const bmdResult = await this.bmdService.createExport(
            scheduledExport.config,
          );
          exportId = bmdResult.id;
          break;

        default:
          throw new BadRequestException(
            `Unsupported export type: ${scheduledExport.exportType}`,
          );
      }

      // Update run record
      await this.prisma.scheduledExportRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          exportId,
          completedAt: new Date(),
        },
      });

      // Update scheduled export
      const nextRunAt = this.calculateNextRun(
        scheduledExport.schedule,
        scheduledExport.timezone,
      );

      await this.prisma.scheduledExport.update({
        where: { id: scheduledExportId },
        data: {
          lastRunAt: new Date(),
          lastStatus: 'completed',
          nextRunAt,
        },
      });

      // Send notification if configured
      if (scheduledExport.notifyEmail) {
        await this.sendNotification(
          scheduledExport,
          'completed',
          exportId,
        );
      }

      this.logger.log(
        `Scheduled export ${scheduledExportId} completed successfully`,
      );
    } catch (error) {
      this.logger.error(
        `Scheduled export ${scheduledExportId} failed:`,
        error.stack,
      );

      // Update run record
      await this.prisma.scheduledExportRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        },
      });

      // Update scheduled export
      await this.prisma.scheduledExport.update({
        where: { id: scheduledExportId },
        data: {
          lastRunAt: new Date(),
          lastStatus: 'failed',
        },
      });

      // Send error notification if configured
      if (scheduledExport.notifyEmail) {
        await this.sendNotification(
          scheduledExport,
          'failed',
          undefined,
          error.message,
        );
      }

      throw error;
    }
  }

  /**
   * Schedule all active exports (called on startup)
   */
  async scheduleAllActive(): Promise<void> {
    this.logger.log('Scheduling all active exports...');

    const activeExports = await this.prisma.scheduledExport.findMany({
      where: { isActive: true },
    });

    for (const scheduledExport of activeExports) {
      try {
        await this.scheduleJob(scheduledExport);
      } catch (error) {
        this.logger.error(
          `Failed to schedule export ${scheduledExport.id}:`,
          error,
        );
      }
    }

    this.logger.log(`Scheduled ${activeExports.length} active exports`);
  }

  /**
   * Private helper methods
   */

  private async scheduleJob(scheduledExport: any): Promise<void> {
    // Remove existing job if any
    await this.removeJob(scheduledExport.id);

    // Calculate delay until next run
    const now = new Date();
    const nextRun = scheduledExport.nextRunAt;
    const delay = nextRun.getTime() - now.getTime();

    if (delay <= 0) {
      // Should run now or overdue
      await this.exportQueue.add(
        'execute-export',
        { scheduledExportId: scheduledExport.id },
        { jobId: scheduledExport.id },
      );
    } else {
      // Schedule for future
      await this.exportQueue.add(
        'execute-export',
        { scheduledExportId: scheduledExport.id },
        {
          jobId: scheduledExport.id,
          delay,
        },
      );
    }

    this.logger.log(
      `Scheduled export ${scheduledExport.id} for ${scheduledExport.nextRunAt}`,
    );
  }

  private async removeJob(scheduledExportId: string): Promise<void> {
    const job = await this.exportQueue.getJob(scheduledExportId);
    if (job) {
      await job.remove();
      this.logger.log(`Removed job for scheduled export ${scheduledExportId}`);
    }
  }

  private calculateNextRun(cronExpression: string, timezone: string): Date {
    try {
      const interval = cronParser.parseExpression(cronExpression, {
        currentDate: new Date(),
        tz: timezone,
      });
      return interval.next().toDate();
    } catch (error) {
      throw new BadRequestException(`Invalid cron expression: ${error.message}`);
    }
  }

  private async sendNotification(
    scheduledExport: any,
    status: 'completed' | 'failed',
    exportId?: string,
    error?: string,
  ): Promise<void> {
    // TODO: Implement email notification
    // This would integrate with your email service
    this.logger.log(
      `Sending ${status} notification for scheduled export ${scheduledExport.id} to ${scheduledExport.notifyEmail}`,
    );

    // Example structure:
    // await this.emailService.send({
    //   to: scheduledExport.notifyEmail,
    //   subject: `Export ${status}: ${scheduledExport.name}`,
    //   template: 'scheduled-export-notification',
    //   context: {
    //     name: scheduledExport.name,
    //     status,
    //     exportId,
    //     error,
    //     downloadUrl: exportId ? `${baseUrl}/exports/${exportId}/download` : undefined,
    //   },
    // });
  }

  private mapToResponseDto(scheduledExport: any): ScheduledExportResponseDto {
    return {
      id: scheduledExport.id,
      orgId: scheduledExport.orgId,
      name: scheduledExport.name,
      exportType: scheduledExport.exportType,
      config: scheduledExport.config,
      schedule: scheduledExport.schedule,
      timezone: scheduledExport.timezone,
      isActive: scheduledExport.isActive,
      lastRunAt: scheduledExport.lastRunAt,
      nextRunAt: scheduledExport.nextRunAt,
      lastStatus: scheduledExport.lastStatus,
      notifyEmail: scheduledExport.notifyEmail,
      createdAt: scheduledExport.createdAt,
      updatedAt: scheduledExport.updatedAt,
    };
  }

  private mapRunToResponseDto(run: any): ScheduledExportRunResponseDto {
    return {
      id: run.id,
      scheduledExportId: run.scheduledExportId,
      status: run.status,
      exportId: run.exportId,
      error: run.error,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
    };
  }
}
