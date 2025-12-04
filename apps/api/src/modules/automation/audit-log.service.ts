import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma, AutomationAuditLog, AutomationMode } from '@prisma/client';
import {
  AuditLogQueryDto,
  AutomationStatsDto,
  ExportAuditLogsDto,
} from './dto/audit-log.dto';

/**
 * Automation Audit Log Service
 * Manages querying, analyzing, and exporting automation audit logs
 * Ensures security and immutability of audit data
 */
@Injectable()
export class AutomationAuditLogService {
  private readonly logger = new Logger(AutomationAuditLogService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Query audit logs with comprehensive filters and pagination
   * Ensures user can only access logs from their organisation
   */
  async getAuditLogs(
    params: AuditLogQueryDto & { organisationId: string },
  ): Promise<{
    data: AutomationAuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `Querying audit logs for org ${params.organisationId} with filters`,
    );

    const {
      organisationId,
      feature,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      wasAutoApproved,
      userId,
      page = 1,
      limit = 20,
    } = params;

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException(
        'Invalid pagination: page must be >= 1, limit must be 1-100',
      );
    }

    // Build where clause
    const where: Prisma.AutomationAuditLogWhereInput = {
      organisationId,
      ...(feature && { feature }),
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(userId && { userId }),
      ...(typeof wasAutoApproved === 'boolean' && { wasAutoApproved }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    // Execute query with pagination
    const [data, total] = await Promise.all([
      this.prisma.automationAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          organisation: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.automationAuditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    this.logger.log(
      `Found ${total} audit logs, returning page ${page}/${totalPages}`,
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get complete audit trail for a specific entity
   * Useful for tracking all automation actions on a single resource
   */
  async getEntityAuditTrail(
    organisationId: string,
    entityType: string,
    entityId: string,
  ): Promise<AutomationAuditLog[]> {
    this.logger.log(
      `Getting audit trail for ${entityType}:${entityId} in org ${organisationId}`,
    );

    const auditLogs = await this.prisma.automationAuditLog.findMany({
      where: {
        organisationId,
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`Found ${auditLogs.length} audit entries for entity`);

    return auditLogs;
  }

  /**
   * Get automation statistics for analytics dashboard
   * Provides insights into automation effectiveness
   */
  async getAutomationStats(
    organisationId: string,
    period: 'day' | 'week' | 'month',
  ): Promise<AutomationStatsDto> {
    this.logger.log(
      `Calculating automation stats for org ${organisationId}, period: ${period}`,
    );

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);

    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const where: Prisma.AutomationAuditLogWhereInput = {
      organisationId,
      createdAt: {
        gte: startDate,
        lte: now,
      },
    };

    // Get aggregate statistics
    const [
      totalAutomatedActions,
      autoApprovedCount,
      manualOverrideCount,
      avgConfidence,
      byFeature,
      byMode,
    ] = await Promise.all([
      // Total automated actions
      this.prisma.automationAuditLog.count({ where }),

      // Auto-approved count
      this.prisma.automationAuditLog.count({
        where: { ...where, wasAutoApproved: true },
      }),

      // Manual override count (actions by users)
      this.prisma.automationAuditLog.count({
        where: {
          ...where,
          userId: { not: null },
          wasAutoApproved: false,
        },
      }),

      // Average confidence score
      this.prisma.automationAuditLog.aggregate({
        where: {
          ...where,
          confidenceScore: { not: null },
        },
        _avg: {
          confidenceScore: true,
        },
      }),

      // Count by feature
      this.prisma.automationAuditLog.groupBy({
        by: ['feature'],
        where,
        _count: true,
      }),

      // Count by automation mode
      this.prisma.automationAuditLog.groupBy({
        by: ['mode'],
        where,
        _count: true,
      }),
    ]);

    // Transform feature counts into record
    const byFeatureRecord: Record<string, number> = {};
    byFeature.forEach((item) => {
      byFeatureRecord[item.feature] = item._count;
    });

    // Transform mode counts into record
    const byModeRecord: Record<string, number> = {};
    byMode.forEach((item) => {
      byModeRecord[item.mode] = item._count;
    });

    const stats: AutomationStatsDto = {
      totalAutomatedActions,
      autoApprovedCount,
      manualOverrideCount,
      averageConfidenceScore: avgConfidence._avg.confidenceScore || 0,
      byFeature: byFeatureRecord,
      byMode: byModeRecord,
      period,
      startDate,
      endDate: now,
    };

    this.logger.log(
      `Stats calculated: ${totalAutomatedActions} total actions, ${autoApprovedCount} auto-approved`,
    );

    return stats;
  }

  /**
   * Export audit logs for compliance and reporting
   * Supports JSON and CSV formats
   * Rate-limited and admin-only
   */
  async exportAuditLogs(params: ExportAuditLogsDto & { organisationId: string }): Promise<{
    content: string | Buffer;
    filename: string;
    contentType: string;
  }> {
    this.logger.log(
      `Exporting audit logs for org ${params.organisationId}, format: ${params.format}`,
    );

    const { organisationId, startDate, endDate, format, feature, action } =
      params;

    // Validate date range (max 1 year)
    const maxDateRange = 365 * 24 * 60 * 60 * 1000; // 1 year in ms
    if (endDate.getTime() - startDate.getTime() > maxDateRange) {
      throw new BadRequestException(
        'Date range cannot exceed 1 year for exports',
      );
    }

    // Build where clause
    const where: Prisma.AutomationAuditLogWhereInput = {
      organisationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(feature && { feature }),
      ...(action && { action }),
    };

    // Fetch all matching logs (with reasonable limit)
    const logs = await this.prisma.automationAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000, // Maximum 10k records per export
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`Exporting ${logs.length} audit log entries`);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `automation-audit-logs-${organisationId}-${timestamp}`;

    if (format === 'json') {
      return {
        content: JSON.stringify(logs, null, 2),
        filename: `${filename}.json`,
        contentType: 'application/json',
      };
    }

    // CSV format
    if (logs.length === 0) {
      return {
        content: 'No data to export',
        filename: `${filename}.csv`,
        contentType: 'text/csv',
      };
    }

    // Build CSV
    const headers = [
      'ID',
      'Created At',
      'Feature',
      'Action',
      'Mode',
      'Entity Type',
      'Entity ID',
      'Was Auto-Approved',
      'Confidence Score',
      'User Email',
      'User Name',
    ];

    const rows = logs.map((log) => [
      log.id,
      log.createdAt.toISOString(),
      log.feature,
      log.action,
      log.mode,
      log.entityType,
      log.entityId,
      log.wasAutoApproved ? 'Yes' : 'No',
      log.confidenceScore?.toFixed(2) || 'N/A',
      log.user?.email || 'System',
      log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === 'string' && cell.includes(',')
              ? `"${cell}"`
              : cell,
          )
          .join(','),
      ),
    ].join('\n');

    return {
      content: csvContent,
      filename: `${filename}.csv`,
      contentType: 'text/csv',
    };
  }

  /**
   * Create audit log entry (used by other services)
   * This is the only write operation - audit logs are immutable after creation
   */
  async createAuditLog(data: {
    organisationId: string;
    action: string;
    feature: string;
    mode: AutomationMode;
    entityType: string;
    entityId: string;
    confidenceScore?: number;
    wasAutoApproved: boolean;
    inputData?: any;
    outputData?: any;
    userId?: string;
  }): Promise<AutomationAuditLog> {
    this.logger.log(
      `Creating audit log: ${data.feature}.${data.action} for entity ${data.entityType}:${data.entityId}`,
    );

    const auditLog = await this.prisma.automationAuditLog.create({
      data: {
        organisationId: data.organisationId,
        action: data.action,
        feature: data.feature,
        mode: data.mode,
        entityType: data.entityType,
        entityId: data.entityId,
        confidenceScore: data.confidenceScore,
        wasAutoApproved: data.wasAutoApproved,
        inputData: data.inputData,
        outputData: data.outputData,
        userId: data.userId,
      },
    });

    this.logger.log(`Audit log created with ID: ${auditLog.id}`);

    return auditLog;
  }

  /**
   * Check if user has access to view audit logs
   * Users can only view their own actions unless they're admins
   */
  async validateAuditLogAccess(
    userId: string,
    organisationId: string,
    isAdmin: boolean,
  ): Promise<boolean> {
    // Admins can see all audit logs in their org
    if (isAdmin) {
      return true;
    }

    // Regular users can only see their own actions
    // This is enforced by adding userId filter in queries
    return false;
  }
}
