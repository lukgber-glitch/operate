import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateDataSubjectRequestDto,
  UpdateDataSubjectRequestDto,
  ExtendDataSubjectRequestDto,
  QueryDataSubjectRequestDto,
} from '../dto/data-subject-request.dto';
import { DataSubjectRequestType, DataSubjectRequestStatus, GdprEventType, ActorType, SlaDeadlines } from '../types/gdpr.types';
import { AuditTrailService } from './audit-trail.service';

/**
 * Data Subject Request Service
 * Handles all GDPR data subject rights requests (Articles 15-21)
 * Tracks 30-day SLA compliance
 */
@Injectable()
export class DataSubjectRequestService {
  private readonly logger = new Logger(DataSubjectRequestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  /**
   * Create a new Data Subject Request
   */
  async createRequest(dto: CreateDataSubjectRequestDto) {
    this.logger.log(`Creating DSR for user ${dto.userId}, type: ${dto.requestType}`);

    try {
      // Calculate due date (30 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + SlaDeadlines.DSR_RESPONSE);

      const request = await this.prisma.dataSubjectRequest.create({
        data: {
          userId: dto.userId,
          organisationId: dto.organisationId,
          requestType: dto.requestType,
          status: DataSubjectRequestStatus.PENDING,
          requestedAt: new Date(),
          dueDate,
          metadata: dto.metadata || {},
        },
      });

      // Log to audit trail
      await this.auditTrail.logEvent({
        eventType: GdprEventType.DSR_CREATED,
        userId: dto.userId,
        organisationId: dto.organisationId,
        actorId: dto.userId,
        actorType: ActorType.USER,
        resourceType: 'DataSubjectRequest',
        resourceId: request.id,
        details: {
          requestType: dto.requestType,
          requestId: request.requestId,
          dueDate: request.dueDate,
        },
      });

      this.logger.log(`DSR created successfully: ${request.requestId}`);
      return request;
    } catch (error) {
      this.logger.error(`Failed to create DSR: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get request by ID
   */
  async getRequest(id: string) {
    const request = await this.prisma.dataSubjectRequest.findUnique({
      where: { id },
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

    if (!request) {
      throw new NotFoundException(`Data Subject Request ${id} not found`);
    }

    return this.enrichRequestWithMetrics(request);
  }

  /**
   * Get request by request ID
   */
  async getRequestByRequestId(requestId: string) {
    const request = await this.prisma.dataSubjectRequest.findUnique({
      where: { requestId },
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

    if (!request) {
      throw new NotFoundException(`Data Subject Request ${requestId} not found`);
    }

    return this.enrichRequestWithMetrics(request);
  }

  /**
   * Update request status
   */
  async updateRequestStatus(id: string, dto: UpdateDataSubjectRequestDto, actorId?: string) {
    this.logger.log(`Updating DSR ${id} status to ${dto.status}`);

    try {
      const existing = await this.getRequest(id);

      // Validate status transition
      this.validateStatusTransition(existing.status, dto.status);

      // Rejection requires a reason
      if (dto.status === DataSubjectRequestStatus.REJECTED && !dto.reason) {
        throw new BadRequestException('Reason is required when rejecting a request');
      }

      const updateData: any = {
        status: dto.status,
      };

      if (dto.status === DataSubjectRequestStatus.ACKNOWLEDGED) {
        updateData.acknowledgedAt = new Date();
      }

      if (dto.status === DataSubjectRequestStatus.COMPLETED) {
        updateData.completedAt = new Date();
        updateData.completedBy = dto.completedBy || actorId;
        if (dto.resultFileUrl) {
          updateData.resultFileUrl = dto.resultFileUrl;
        }
      }

      if (dto.status === DataSubjectRequestStatus.REJECTED) {
        updateData.reason = dto.reason;
        updateData.completedAt = new Date();
        updateData.completedBy = dto.completedBy || actorId;
      }

      const request = await this.prisma.dataSubjectRequest.update({
        where: { id },
        data: updateData,
      });

      // Log status change
      await this.auditTrail.logEvent({
        eventType: this.getEventTypeForStatus(dto.status),
        userId: request.userId,
        organisationId: request.organisationId,
        actorId: actorId || 'system',
        actorType: actorId ? ActorType.ADMIN : ActorType.SYSTEM,
        resourceType: 'DataSubjectRequest',
        resourceId: request.id,
        details: {
          requestId: request.requestId,
          requestType: request.requestType,
          previousStatus: existing.status,
          newStatus: dto.status,
          reason: dto.reason,
        },
      });

      return request;
    } catch (error) {
      this.logger.error(`Failed to update DSR status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Extend request deadline
   */
  async extendDeadline(id: string, dto: ExtendDataSubjectRequestDto, actorId?: string) {
    this.logger.log(`Extending deadline for DSR ${id}`);

    try {
      const existing = await this.getRequest(id);

      // Can only extend once and within the original 30-day period
      if (existing.extendedDueDate) {
        throw new BadRequestException('Request deadline has already been extended');
      }

      // Calculate new due date (default: +60 days from original)
      const extendedDueDate = dto.extendedDueDate
        ? new Date(dto.extendedDueDate)
        : new Date(existing.dueDate.getTime() + SlaDeadlines.DSR_EXTENSION_MAX * 24 * 60 * 60 * 1000);

      // Max extension is 2 months (60 days)
      const maxExtension = new Date(existing.dueDate);
      maxExtension.setDate(maxExtension.getDate() + SlaDeadlines.DSR_EXTENSION_MAX);

      if (extendedDueDate > maxExtension) {
        throw new BadRequestException('Extension cannot exceed 2 additional months');
      }

      const request = await this.prisma.dataSubjectRequest.update({
        where: { id },
        data: {
          status: DataSubjectRequestStatus.EXTENDED,
          extendedDueDate,
          extensionReason: dto.extensionReason,
        },
      });

      // Log extension
      await this.auditTrail.logEvent({
        eventType: GdprEventType.DSR_EXTENDED,
        userId: request.userId,
        organisationId: request.organisationId,
        actorId: actorId || 'system',
        actorType: actorId ? ActorType.ADMIN : ActorType.SYSTEM,
        resourceType: 'DataSubjectRequest',
        resourceId: request.id,
        details: {
          requestId: request.requestId,
          originalDueDate: existing.dueDate,
          extendedDueDate,
          reason: dto.extensionReason,
        },
      });

      return request;
    } catch (error) {
      this.logger.error(`Failed to extend deadline: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Query requests
   */
  async queryRequests(query: QueryDataSubjectRequestDto) {
    this.logger.log('Querying DSRs');

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.organisationId) where.organisationId = query.organisationId;
    if (query.requestType) where.requestType = query.requestType;
    if (query.status) where.status = query.status;

    if (query.overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: [DataSubjectRequestStatus.COMPLETED, DataSubjectRequestStatus.REJECTED] };
    }

    const requests = await this.prisma.dataSubjectRequest.findMany({
      where,
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
      orderBy: { requestedAt: 'desc' },
    });

    return requests.map((req) => this.enrichRequestWithMetrics(req));
  }

  /**
   * Get pending requests (for admin dashboard)
   */
  async getPendingRequests(organisationId?: string) {
    const where: any = {
      status: {
        in: [
          DataSubjectRequestStatus.PENDING,
          DataSubjectRequestStatus.ACKNOWLEDGED,
          DataSubjectRequestStatus.PROCESSING,
        ],
      },
    };

    if (organisationId) {
      where.organisationId = organisationId;
    }

    return this.prisma.dataSubjectRequest.findMany({
      where,
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
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Get overdue requests
   */
  async getOverdueRequests(organisationId?: string) {
    const where: any = {
      dueDate: { lt: new Date() },
      status: {
        notIn: [DataSubjectRequestStatus.COMPLETED, DataSubjectRequestStatus.REJECTED],
      },
    };

    if (organisationId) {
      where.organisationId = organisationId;
    }

    return this.prisma.dataSubjectRequest.findMany({
      where,
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
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Get DSR statistics
   */
  async getStatistics(organisationId?: string) {
    const where: any = {};
    if (organisationId) where.organisationId = organisationId;

    const [total, byStatus, byType, overdue] = await Promise.all([
      this.prisma.dataSubjectRequest.count({ where }),
      this.prisma.dataSubjectRequest.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.dataSubjectRequest.groupBy({
        by: ['requestType'],
        where,
        _count: true,
      }),
      this.prisma.dataSubjectRequest.count({
        where: {
          ...where,
          dueDate: { lt: new Date() },
          status: { notIn: [DataSubjectRequestStatus.COMPLETED, DataSubjectRequestStatus.REJECTED] },
        },
      }),
    ]);

    return {
      total,
      overdue,
      byStatus: byStatus.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>),
      byType: byType.reduce((acc, stat) => {
        acc[stat.requestType] = stat._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Enrich request with calculated metrics
   */
  private enrichRequestWithMetrics(request: any) {
    const effectiveDueDate = request.extendedDueDate || request.dueDate;
    const now = new Date();
    const daysRemaining = Math.ceil((effectiveDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysRemaining < 0 &&
      ![DataSubjectRequestStatus.COMPLETED, DataSubjectRequestStatus.REJECTED].includes(request.status);

    return {
      ...request,
      daysRemaining,
      isOverdue,
      effectiveDueDate,
    };
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(currentStatus: string, newStatus: string) {
    const validTransitions: Record<string, string[]> = {
      [DataSubjectRequestStatus.PENDING]: [
        DataSubjectRequestStatus.ACKNOWLEDGED,
        DataSubjectRequestStatus.PROCESSING,
        DataSubjectRequestStatus.REJECTED,
      ],
      [DataSubjectRequestStatus.ACKNOWLEDGED]: [
        DataSubjectRequestStatus.PROCESSING,
        DataSubjectRequestStatus.REJECTED,
      ],
      [DataSubjectRequestStatus.PROCESSING]: [
        DataSubjectRequestStatus.COMPLETED,
        DataSubjectRequestStatus.REJECTED,
      ],
      [DataSubjectRequestStatus.EXTENDED]: [
        DataSubjectRequestStatus.PROCESSING,
        DataSubjectRequestStatus.COMPLETED,
        DataSubjectRequestStatus.REJECTED,
      ],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Get event type for status change
   */
  private getEventTypeForStatus(status: DataSubjectRequestStatus): GdprEventType {
    const mapping: Record<string, GdprEventType> = {
      [DataSubjectRequestStatus.ACKNOWLEDGED]: GdprEventType.DSR_ACKNOWLEDGED,
      [DataSubjectRequestStatus.PROCESSING]: GdprEventType.DSR_PROCESSING,
      [DataSubjectRequestStatus.COMPLETED]: GdprEventType.DSR_COMPLETED,
      [DataSubjectRequestStatus.REJECTED]: GdprEventType.DSR_REJECTED,
      [DataSubjectRequestStatus.EXTENDED]: GdprEventType.DSR_EXTENDED,
    };

    return mapping[status] || GdprEventType.DSR_CREATED;
  }
}
