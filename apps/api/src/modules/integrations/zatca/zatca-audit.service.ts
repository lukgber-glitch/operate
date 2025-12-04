import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

interface AuditLogData {
  organisationId: string;
  certificateId?: string;
  action: string;
  performedBy: string;
  success: boolean;
  errorMessage?: string;
  errorCode?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  zatcaRequestId?: string;
  zatcaResponseId?: string;
}

/**
 * ZATCA Audit Service
 *
 * Provides immutable audit logging for all ZATCA certificate operations
 * Required for compliance and security auditing
 */
@Injectable()
export class ZatcaAuditService {
  private readonly logger = new Logger(ZatcaAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an action to the audit trail
   */
  async logAction(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.zatcaCertificateAuditLog.create({
        data: {
          organisationId: data.organisationId,
          certificateId: data.certificateId,
          action: data.action,
          performedBy: data.performedBy,
          success: data.success,
          errorMessage: data.errorMessage,
          errorCode: data.errorCode,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          details: data.details,
          zatcaRequestId: data.zatcaRequestId,
          zatcaResponseId: data.zatcaResponseId,
        },
      });

      this.logger.debug(
        `Audit log created: ${data.action} by ${data.performedBy} - ${data.success ? 'success' : 'failed'}`,
      );
    } catch (error) {
      // Audit logging should never fail the main operation
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
    }
  }

  /**
   * Get audit logs for a certificate
   */
  async getCertificateAuditLogs(
    certificateId: string,
    options?: {
      limit?: number;
      offset?: number;
      action?: string;
    },
  ) {
    const { limit = 100, offset = 0, action } = options || {};

    return this.prisma.zatcaCertificateAuditLog.findMany({
      where: {
        certificateId,
        ...(action && { action }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get audit logs for an organisation
   */
  async getOrganisationAuditLogs(
    organisationId: string,
    options?: {
      limit?: number;
      offset?: number;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const { limit = 100, offset = 0, action, startDate, endDate } = options || {};

    return this.prisma.zatcaCertificateAuditLog.findMany({
      where: {
        organisationId,
        ...(action && { action }),
        ...(startDate &&
          endDate && {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get failed operations
   */
  async getFailedOperations(
    organisationId: string,
    options?: {
      limit?: number;
      certificateId?: string;
    },
  ) {
    const { limit = 50, certificateId } = options || {};

    return this.prisma.zatcaCertificateAuditLog.findMany({
      where: {
        organisationId,
        success: false,
        ...(certificateId && { certificateId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Export audit logs for compliance review
   */
  async exportAuditLogs(
    organisationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    const logs = await this.prisma.zatcaCertificateAuditLog.findMany({
      where: {
        organisationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return logs.map((log) => ({
      timestamp: log.createdAt.toISOString(),
      action: log.action,
      performedBy: log.performedBy,
      certificateId: log.certificateId,
      success: log.success,
      errorMessage: log.errorMessage,
      errorCode: log.errorCode,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      zatcaRequestId: log.zatcaRequestId,
      zatcaResponseId: log.zatcaResponseId,
      details: log.details,
    }));
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(
    organisationId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where = {
      organisationId,
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    const [total, successful, failed, byAction] = await Promise.all([
      this.prisma.zatcaCertificateAuditLog.count({ where }),
      this.prisma.zatcaCertificateAuditLog.count({
        where: { ...where, success: true },
      }),
      this.prisma.zatcaCertificateAuditLog.count({
        where: { ...where, success: false },
      }),
      this.prisma.zatcaCertificateAuditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      byAction: byAction.map((item) => ({
        action: item.action,
        count: item._count,
      })),
    };
  }
}
