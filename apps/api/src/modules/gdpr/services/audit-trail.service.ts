import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GdprEventType, ActorType } from '../types/gdpr.types';

/**
 * Interface for logging GDPR events
 */
export interface GdprLogEventDto {
  eventType: GdprEventType;
  userId?: string;
  organisationId?: string;
  actorId?: string;
  actorType: ActorType;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit Trail Service
 * Comprehensive logging for all GDPR-related activities
 * Implements Article 5 (Accountability) requirements
 */
@Injectable()
export class AuditTrailService {
  private readonly logger = new Logger(AuditTrailService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log a GDPR event
   */
  async logEvent(dto: GdprLogEventDto) {
    try {
      const auditLog = await this.prisma.gdprAuditLog.create({
        data: {
          eventType: dto.eventType,
          userId: dto.userId,
          organisationId: dto.organisationId,
          actorId: dto.actorId,
          actorType: dto.actorType,
          resourceType: dto.resourceType,
          resourceId: dto.resourceId,
          details: dto.details || {},
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
        },
      });

      this.logger.log(
        `GDPR Event logged: ${dto.eventType} by ${dto.actorType} ${dto.actorId || 'unknown'}`,
      );

      return auditLog;
    } catch (error) {
      this.logger.error(`Failed to log GDPR event: ${error.message}`, error.stack);
      // Don't throw - we don't want audit logging failures to break operations
      // But we do log the error for monitoring
    }
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: string, limit = 100, offset = 0) {
    return this.prisma.gdprAuditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get audit logs for an organisation
   */
  async getOrganisationAuditLogs(organisationId: string, limit = 100, offset = 0) {
    return this.prisma.gdprAuditLog.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get audit logs by event type
   */
  async getAuditLogsByEventType(eventType: GdprEventType, limit = 100, offset = 0) {
    return this.prisma.gdprAuditLog.findMany({
      where: { eventType },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get audit logs within a date range
   */
  async getAuditLogsByDateRange(startDate: Date, endDate: Date, userId?: string) {
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (userId) {
      where.userId = userId;
    }

    return this.prisma.gdprAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(params: {
    userId?: string;
    organisationId?: string;
    eventType?: GdprEventType;
    actorId?: string;
    actorType?: ActorType;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (params.userId) where.userId = params.userId;
    if (params.organisationId) where.organisationId = params.organisationId;
    if (params.eventType) where.eventType = params.eventType;
    if (params.actorId) where.actorId = params.actorId;
    if (params.actorType) where.actorType = params.actorType;
    if (params.resourceType) where.resourceType = params.resourceType;
    if (params.resourceId) where.resourceId = params.resourceId;

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [total, logs] = await Promise.all([
      this.prisma.gdprAuditLog.count({ where }),
      this.prisma.gdprAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit || 100,
        skip: params.offset || 0,
      }),
    ]);

    return {
      total,
      logs,
      limit: params.limit || 100,
      offset: params.offset || 0,
    };
  }

  /**
   * Get event type statistics
   */
  async getEventTypeStats(organisationId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (organisationId) where.organisationId = organisationId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const stats = await this.prisma.gdprAuditLog.groupBy({
      by: ['eventType'],
      where,
      _count: true,
    });

    return stats.reduce((acc, stat) => {
      acc[stat.eventType] = stat._count;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get actor statistics
   */
  async getActorStats(organisationId?: string) {
    const where: any = {};
    if (organisationId) where.organisationId = organisationId;

    const stats = await this.prisma.gdprAuditLog.groupBy({
      by: ['actorType'],
      where,
      _count: true,
    });

    return stats.reduce((acc, stat) => {
      acc[stat.actorType] = stat._count;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Delete old audit logs (for retention policy compliance)
   */
  async deleteOldLogs(retentionDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.gdprAuditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Deleted ${result.count} audit logs older than ${retentionDays} days`);
    return result.count;
  }

  /**
   * Export audit logs for compliance reporting
   */
  async exportAuditLogs(params: {
    userId?: string;
    organisationId?: string;
    startDate: Date;
    endDate: Date;
  }) {
    const logs = await this.getAuditLogsByDateRange(
      params.startDate,
      params.endDate,
      params.userId,
    );

    return {
      exportedAt: new Date(),
      period: {
        start: params.startDate,
        end: params.endDate,
      },
      userId: params.userId,
      organisationId: params.organisationId,
      totalLogs: logs.length,
      logs: logs.map((log) => ({
        timestamp: log.createdAt,
        eventType: log.eventType,
        actor: {
          id: log.actorId,
          type: log.actorType,
        },
        resource: {
          type: log.resourceType,
          id: log.resourceId,
        },
        details: log.details,
        metadata: {
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
        },
      })),
    };
  }
}
