import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { GobdService } from './exports/gobd/gobd.service';
import { SaftService } from './exports/saft/saft.service';
import { SaftVariant, ExportScope } from './exports/saft/interfaces/saft-config.interface';
import { CreateExportDto } from './dto/create-export.dto';
import { ExportResponseDto, PaginatedExportResponseDto } from './dto/export-response.dto';
import { ExportFilterDto } from './dto/export-filter.dto';
import {
  ScheduleExportDto,
  UpdateScheduleExportDto,
  ScheduleResponseDto,
} from './dto/schedule-export.dto';
import { ValidationResultDto } from './dto/validation-result.dto';
import { ExportConfig } from './interfaces/export-config.interface';
import { ExportStatus, ExportProgress } from './interfaces/export-status.interface';
import { ComplianceExport } from './entities/compliance-export.entity';

/**
 * Compliance Service
 * Orchestrates GoBD and SAF-T exports, manages schedules,
 * and handles background processing
 */
@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    private readonly gobdService: GobdService,
    private readonly saftService: SaftService,
    private readonly prisma: PrismaService,
    // TODO: Inject CacheService for caching
    // TODO: Inject QueueService for background jobs
  ) {}

  /**
   * Create a new compliance export
   */
  async createExport(
    dto: CreateExportDto,
    userId: string,
    organizationId: string,
  ): Promise<ExportResponseDto> {
    this.logger.log(`Creating ${dto.type} export for organization ${organizationId}`);

    // Validate date range
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (endDate > new Date()) {
      throw new BadRequestException('End date cannot be in the future');
    }

    // Delegate to appropriate service based on export type
    if (dto.type === 'gobd') {
      const result = await this.gobdService.createExport({
        orgId: organizationId,
        dateRange: {
          startDate,
          endDate,
        },
        documentTypes: [],
        includeDocuments: dto.includeDocuments,
      });

      return {
        id: result.id,
        organizationId,
        type: 'gobd',
        status: result.status as unknown as ExportStatus,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        progress: 0,
        includeDocuments: dto.includeDocuments || false,
        createdBy: userId,
        createdAt: result.createdAt,
        downloadUrl: result.downloadUrl,
      };
    } else if (dto.type === 'saft') {
      // Similar for SAF-T
      const result = await this.saftService.createExport(organizationId, userId, {
        variant: SaftVariant.AUSTRIA, // TODO: Get from organization based on country
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        scope: ExportScope.FULL,
        includeOpeningBalances: true,
        includeClosingBalances: true,
        includeTaxDetails: true,
        includeCustomerSupplierDetails: true,
      });

      return {
        id: result.exportId,
        organizationId,
        type: 'saft',
        status: result.status as unknown as ExportStatus,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        progress: 0,
        includeDocuments: dto.includeDocuments || false,
        createdBy: userId,
        createdAt: result.createdAt,
        downloadUrl: result.downloadUrl,
      };
    }

    throw new BadRequestException(`Unsupported export type: ${dto.type}`);
  }

  /**
   * Get export by ID
   */
  async getExport(exportId: string, organizationId: string): Promise<ExportResponseDto> {
    // Try GoBD first
    const gobdExport = await this.prisma.gobdExport.findFirst({
      where: {
        id: exportId,
        orgId: organizationId,
      },
    });

    if (gobdExport) {
      return {
        id: gobdExport.id,
        organizationId: gobdExport.orgId,
        type: 'gobd',
        status: gobdExport.status as unknown as ExportStatus,
        dateRange: {
          start: gobdExport.startDate?.toISOString() || '',
          end: gobdExport.endDate?.toISOString() || '',
        },
        progress: gobdExport.status === 'completed' ? 100 : gobdExport.status === 'processing' ? 50 : 0,
        fileSize: gobdExport.fileSize || undefined,
        checksum: gobdExport.checksum || undefined,
        createdBy: 'system', // TODO: Track user who created export
        createdAt: gobdExport.createdAt,
        completedAt: gobdExport.completedAt || undefined,
        downloadUrl: gobdExport.status === 'completed' ? `/api/v1/compliance/exports/${exportId}/download` : undefined,
      };
    }

    // Try SAF-T
    const saftExport = await this.prisma.saftExport.findFirst({
      where: {
        id: exportId,
        orgId: organizationId,
      },
    });

    if (saftExport) {
      return {
        id: saftExport.id,
        organizationId: saftExport.orgId,
        type: 'saft',
        status: saftExport.status as unknown as ExportStatus,
        dateRange: {
          start: saftExport.startDate?.toISOString() || '',
          end: saftExport.endDate?.toISOString() || '',
        },
        progress: saftExport.status === 'completed' ? 100 : saftExport.status === 'processing' ? 50 : 0,
        fileSize: saftExport.fileSize || undefined,
        checksum: saftExport.checksum || undefined,
        createdBy: 'system', // TODO: Track user who created export
        createdAt: saftExport.createdAt,
        completedAt: saftExport.completedAt || undefined,
        downloadUrl: saftExport.status === 'completed' ? `/api/v1/compliance/exports/${exportId}/download` : undefined,
      };
    }

    throw new NotFoundException('Export not found');
  }

  /**
   * List exports with filtering and pagination
   */
  async listExports(
    filter: ExportFilterDto,
    organizationId: string,
  ): Promise<PaginatedExportResponseDto> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      orgId: organizationId,
    };

    if (filter.status) {
      whereClause.status = filter.status;
    }

    if (filter.createdAfter) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        gte: new Date(filter.createdAfter),
      };
    }

    if (filter.createdBefore) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: new Date(filter.createdBefore),
      };
    }

    const orderBy = {
      [filter.sortBy || 'createdAt']: filter.sortOrder || 'desc',
    };

    // Combine results from both tables based on filter type
    const results: ExportResponseDto[] = [];
    let total = 0;

    if (!filter.type || filter.type === 'gobd') {
      const [gobdExports, gobdCount] = await Promise.all([
        this.prisma.gobdExport.findMany({
          where: whereClause,
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.gobdExport.count({ where: whereClause }),
      ]);

      results.push(...gobdExports.map((exp: any) => ({
        id: exp.id,
        organizationId: exp.orgId,
        type: 'gobd' as const,
        status: exp.status as unknown as ExportStatus,
        dateRange: {
          start: exp.startDate?.toISOString() || '',
          end: exp.endDate?.toISOString() || '',
        },
        progress: exp.status === 'completed' ? 100 : exp.status === 'processing' ? 50 : 0,
        fileSize: exp.fileSize || undefined,
        checksum: exp.checksum || undefined,
        createdBy: 'system', // TODO: Track user who created export
        createdAt: exp.createdAt,
        completedAt: exp.completedAt || undefined,
        downloadUrl: exp.status === 'completed' ? `/api/v1/compliance/exports/${exp.id}/download` : undefined,
      })));
      total += gobdCount;
    }

    if (!filter.type || filter.type === 'saft') {
      const [saftExports, saftCount] = await Promise.all([
        this.prisma.saftExport.findMany({
          where: whereClause,
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.saftExport.count({ where: whereClause }),
      ]);

      results.push(...saftExports.map((exp: any) => ({
        id: exp.id,
        organizationId: exp.orgId,
        type: 'saft' as const,
        status: exp.status as unknown as ExportStatus,
        dateRange: {
          start: exp.startDate?.toISOString() || '',
          end: exp.endDate?.toISOString() || '',
        },
        progress: exp.status === 'completed' ? 100 : exp.status === 'processing' ? 50 : 0,
        fileSize: exp.fileSize || undefined,
        checksum: exp.checksum || undefined,
        createdBy: 'system', // TODO: Track user who created export
        createdAt: exp.createdAt,
        completedAt: exp.completedAt || undefined,
        downloadUrl: exp.status === 'completed' ? `/api/v1/compliance/exports/${exp.id}/download` : undefined,
      })));
      total += saftCount;
    }

    return {
      data: results,
      meta: {
        total,
        page,
        pageSize: limit,
        hasMore: skip + limit < total,
      },
    };
  }

  /**
   * Delete an export
   */
  async deleteExport(exportId: string, organizationId: string): Promise<void> {
    // Try to find and delete from either table
    const gobdExport = await this.prisma.gobdExport.findFirst({
      where: { id: exportId, orgId: organizationId },
    });

    if (gobdExport) {
      // Check retention policy (90 days)
      const retentionPeriodDays = 90;
      const retentionEndDate = new Date(gobdExport.createdAt);
      retentionEndDate.setDate(retentionEndDate.getDate() + retentionPeriodDays);

      if (new Date() < retentionEndDate) {
        throw new ForbiddenException(
          `Export cannot be deleted within ${retentionPeriodDays} days of creation (retention policy)`,
        );
      }

      await this.gobdService.deleteExport(exportId);
      this.logger.log(`GoBD export ${exportId} deleted`);
      return;
    }

    const saftExport = await this.prisma.saftExport.findFirst({
      where: { id: exportId, orgId: organizationId },
    });

    if (saftExport) {
      // Check retention policy (90 days)
      const retentionPeriodDays = 90;
      const retentionEndDate = new Date(saftExport.createdAt);
      retentionEndDate.setDate(retentionEndDate.getDate() + retentionPeriodDays);

      if (new Date() < retentionEndDate) {
        throw new ForbiddenException(
          `Export cannot be deleted within ${retentionPeriodDays} days of creation (retention policy)`,
        );
      }

      // TODO: Implement saftService.deleteExport
      await this.prisma.saftExport.delete({ where: { id: exportId } });
      this.logger.log(`SAF-T export ${exportId} deleted`);
      return;
    }

    throw new NotFoundException('Export not found');
  }

  /**
   * Validate an export
   */
  async validateExport(exportId: string, organizationId: string): Promise<ValidationResultDto> {
    // TODO: Implement proper export validation
    // For now, just check if export exists
    const exportRecord = await this.getExport(exportId, organizationId);

    if (!exportRecord) {
      throw new NotFoundException('Export not found');
    }

    // Route to appropriate validator
    const validationResult = await this.saftService.validateExport(organizationId, exportId);

    return {
      ...validationResult,
      totalRecords: 0, // TODO: Track total records
      recordsWithErrors: validationResult.errors?.length || 0,
      recordsWithWarnings: validationResult.warnings?.length || 0,
    };
  }

  /**
   * Get export download stream
   */
  async getExportStream(exportId: string, organizationId: string): Promise<NodeJS.ReadableStream> {
    // Try GoBD first
    const gobdExport = await this.prisma.gobdExport.findFirst({
      where: { id: exportId, orgId: organizationId },
    });

    if (gobdExport) {
      if (gobdExport.status !== 'completed' && gobdExport.status !== 'ready') {
        throw new BadRequestException('Export is not ready for download');
      }

      const streamable = await this.gobdService.downloadExport(exportId);
      // Convert StreamableFile to ReadableStream
      return streamable.getStream() as unknown as NodeJS.ReadableStream;
    }

    // Try SAF-T
    const saftExport = await this.prisma.saftExport.findFirst({
      where: { id: exportId, orgId: organizationId },
    });

    if (saftExport) {
      if (saftExport.status !== 'completed' && saftExport.status !== 'ready') {
        throw new BadRequestException('Export is not ready for download');
      }

      // TODO: Implement SAF-T download
      throw new BadRequestException('SAF-T export download not yet implemented');
    }

    throw new NotFoundException('Export not found');
  }

  /**
   * Create a scheduled export
   */
  async createSchedule(
    dto: ScheduleExportDto,
    userId: string,
    organizationId: string,
  ): Promise<ScheduleResponseDto> {
    this.logger.log(`Creating ${dto.frequency} ${dto.type} schedule for organization ${organizationId}`);

    const scheduleId = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate next run
    const nextRun = this.calculateNextRun(dto.frequency, dto.dayOfWeek, dto.dayOfMonth, dto.timezone);

    const schedule = {
      id: scheduleId,
      organizationId,
      type: dto.type,
      frequency: dto.frequency,
      dayOfWeek: dto.dayOfWeek,
      dayOfMonth: dto.dayOfMonth,
      timezone: dto.timezone,
      enabled: dto.enabled,
      includeDocuments: dto.includeDocuments,
      notifyEmail: dto.notifyEmail,
      webhookUrl: dto.webhookUrl,
      nextRun,
      failureCount: 0,
      maxRetries: dto.maxRetries || 3,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.schedules.set(scheduleId, schedule);

    return schedule;
  }

  /**
   * List scheduled exports
   */
  async listSchedules(organizationId: string): Promise<ScheduleResponseDto[]> {
    return Array.from(this.schedules.values()).filter(
      (sched) => sched.organizationId === organizationId,
    );
  }

  /**
   * Update a scheduled export
   */
  async updateSchedule(
    scheduleId: string,
    dto: UpdateScheduleExportDto,
    organizationId: string,
  ): Promise<ScheduleResponseDto> {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    if (schedule.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this schedule');
    }

    // Update fields
    Object.assign(schedule, {
      ...dto,
      updatedAt: new Date(),
    });

    this.schedules.set(scheduleId, schedule);

    return schedule;
  }

  /**
   * Delete a scheduled export
   */
  async deleteSchedule(scheduleId: string, organizationId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    if (schedule.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this schedule');
    }

    this.schedules.delete(scheduleId);

    this.logger.log(`Schedule ${scheduleId} deleted`);
  }

  /**
   * Process scheduled exports (cron job)
   * Runs every hour to check for due exports
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processScheduledExports(): Promise<void> {
    this.logger.log('Processing scheduled exports');

    const now = new Date();

    for (const [scheduleId, schedule] of this.schedules.entries()) {
      if (!schedule.enabled) {
        continue;
      }

      if (schedule.nextRun <= now) {
        this.logger.log(`Executing scheduled export ${scheduleId}`);

        try {
          // Create export
          const dto: CreateExportDto = {
            type: schedule.type,
            startDate: this.getSchedulePeriodStart(schedule.frequency),
            endDate: new Date().toISOString(),
            includeDocuments: schedule.includeDocuments,
            comment: `Scheduled ${schedule.frequency} export`,
          };

          await this.createExport(dto, schedule.createdBy, schedule.organizationId);

          // Update schedule
          schedule.lastRun = now;
          schedule.nextRun = this.calculateNextRun(
            schedule.frequency,
            schedule.dayOfWeek,
            schedule.dayOfMonth,
            schedule.timezone,
          );
          schedule.failureCount = 0;
          schedule.updatedAt = new Date();

          this.schedules.set(scheduleId, schedule);

          // TODO: Send notification emails
          // TODO: Call webhook
        } catch (error) {
          this.logger.error(`Scheduled export failed: ${error.message}`, error.stack);

          schedule.failureCount++;
          if (schedule.failureCount >= schedule.maxRetries) {
            this.logger.warn(`Disabling schedule ${scheduleId} after ${schedule.failureCount} failures`);
            schedule.enabled = false;
          }
          schedule.updatedAt = new Date();
          this.schedules.set(scheduleId, schedule);
        }
      }
    }
  }


  /**
   * Calculate next run time for a schedule
   */
  private calculateNextRun(
    frequency: string,
    dayOfWeek?: number,
    dayOfMonth?: number,
    timezone: string = 'UTC',
  ): Date {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        // Find next occurrence of dayOfWeek
        const currentDay = next.getDay();
        const targetDay = dayOfWeek || 0;
        const daysUntilTarget = (targetDay + 7 - currentDay) % 7 || 7;
        next.setDate(next.getDate() + daysUntilTarget);
        break;
      case 'monthly':
        // Set to next month on specified day
        next.setMonth(next.getMonth() + 1);
        next.setDate(dayOfMonth || 1);
        break;
      case 'quarterly':
        // Set to next quarter
        next.setMonth(next.getMonth() + 3);
        next.setDate(1);
        break;
      case 'yearly':
        // Set to next year
        next.setFullYear(next.getFullYear() + 1);
        next.setMonth(0);
        next.setDate(1);
        break;
    }

    // Reset time to midnight
    next.setHours(0, 0, 0, 0);

    return next;
  }

  /**
   * Get period start date for scheduled export
   */
  private getSchedulePeriodStart(frequency: string): string {
    const now = new Date();

    switch (frequency) {
      case 'daily':
        // Yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      case 'weekly':
        // Last week
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return lastWeek.toISOString().split('T')[0];
      case 'monthly':
        // Last month
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return lastMonth.toISOString().split('T')[0];
      case 'quarterly':
        // Last quarter
        const lastQuarter = new Date(now);
        lastQuarter.setMonth(lastQuarter.getMonth() - 3);
        return lastQuarter.toISOString().split('T')[0];
      case 'yearly':
        // Last year
        const lastYear = new Date(now);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        return lastYear.toISOString().split('T')[0];
      default:
        return now.toISOString().split('T')[0];
    }
  }

  // Note: Schedules remain in-memory for now
  // TODO: Create ComplianceExportSchedule model in Prisma schema
  // and migrate to database storage
  private schedules: Map<string, any> = new Map();
}
