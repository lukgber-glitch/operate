import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { AlertStatus, ScreeningStatus, RiskLevel } from '../types/comply-advantage.types';
import { ReviewAlertDto } from '../dto/alert.dto';

/**
 * ComplyAdvantage Case Management Service
 * Handles alert review and case management workflow
 */
@Injectable()
export class CaseManagementService {
  private readonly logger = new Logger(CaseManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Review an alert
   */
  async reviewAlert(alertId: string, dto: ReviewAlertDto): Promise<any> {
    try {
      this.logger.log('Reviewing alert', {
        alertId,
        status: dto.status,
        reviewedBy: dto.reviewedBy,
      });

      // Get alert
      const alert = await this.prisma.amlAlert.findUnique({
        where: { id: alertId },
        include: {
          screening: true,
        },
      });

      if (!alert) {
        throw new NotFoundException('Alert not found');
      }

      // Update alert
      const updatedAlert = await this.prisma.amlAlert.update({
        where: { id: alertId },
        data: {
          status: dto.status,
          reviewedBy: dto.reviewedBy,
          reviewedAt: new Date(),
          reviewNotes: dto.reviewNotes,
        },
      });

      // Update screening status based on alert reviews
      await this.updateScreeningStatus(alert.screeningId);

      // Log audit entry
      await this.logAuditEntry({
        action: 'alert_reviewed',
        organisationId: alert.screening.organisationId,
        userId: dto.reviewedBy,
        metadata: {
          alertId,
          status: dto.status,
          screeningId: alert.screeningId,
        },
      });

      this.logger.log('Alert reviewed', { alertId, status: dto.status });

      return updatedAlert;
    } catch (error) {
      this.logger.error('Failed to review alert', error);
      throw error;
    }
  }

  /**
   * Get alert by ID
   */
  async getAlert(alertId: string): Promise<any> {
    const alert = await this.prisma.amlAlert.findUnique({
      where: { id: alertId },
      include: {
        screening: {
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
        },
      },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return alert;
  }

  /**
   * List alerts for a screening
   */
  async listAlerts(screeningId: string, status?: string): Promise<any> {
    const where: any = { screeningId };

    if (status) {
      where.status = status;
    }

    const alerts = await this.prisma.amlAlert.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // Open alerts first
        { matchScore: 'desc' }, // High scores first
      ],
    });

    return alerts;
  }

  /**
   * Get alert statistics for organization
   */
  async getAlertStatistics(organisationId: string): Promise<any> {
    const totalAlerts = await this.prisma.amlAlert.count({
      where: {
        screening: {
          organisationId,
        },
      },
    });

    const openAlerts = await this.prisma.amlAlert.count({
      where: {
        screening: {
          organisationId,
        },
        status: AlertStatus.OPEN,
      },
    });

    const confirmedMatches = await this.prisma.amlAlert.count({
      where: {
        screening: {
          organisationId,
        },
        status: AlertStatus.CONFIRMED,
      },
    });

    const dismissedAlerts = await this.prisma.amlAlert.count({
      where: {
        screening: {
          organisationId,
        },
        status: AlertStatus.DISMISSED,
      },
    });

    const alertsByType = await this.prisma.amlAlert.groupBy({
      by: ['alertType'],
      where: {
        screening: {
          organisationId,
        },
      },
      _count: true,
    });

    return {
      total: totalAlerts,
      open: openAlerts,
      confirmed: confirmedMatches,
      dismissed: dismissedAlerts,
      byType: alertsByType,
    };
  }

  /**
   * Get pending review cases
   */
  async getPendingReviewCases(organisationId: string): Promise<any> {
    const screenings = await this.prisma.amlScreening.findMany({
      where: {
        organisationId,
        status: ScreeningStatus.PENDING_REVIEW,
      },
      include: {
        alerts: {
          where: {
            status: AlertStatus.OPEN,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { riskLevel: 'desc' }, // Critical first
        { createdAt: 'asc' }, // Oldest first
      ],
    });

    return screenings;
  }

  /**
   * Escalate alert to compliance team
   */
  async escalateAlert(alertId: string, escalatedBy: string, reason: string): Promise<any> {
    try {
      this.logger.log('Escalating alert', { alertId, escalatedBy });

      const alert = await this.getAlert(alertId);

      const updatedAlert = await this.prisma.amlAlert.update({
        where: { id: alertId },
        data: {
          status: AlertStatus.ESCALATED,
          reviewNotes: `Escalated by ${escalatedBy}: ${reason}`,
        },
      });

      // Log audit entry
      await this.logAuditEntry({
        action: 'alert_escalated',
        organisationId: alert.screening.organisationId,
        userId: escalatedBy,
        metadata: {
          alertId,
          screeningId: alert.screeningId,
          reason,
        },
      });

      this.logger.log('Alert escalated', { alertId });

      return updatedAlert;
    } catch (error) {
      this.logger.error('Failed to escalate alert', error);
      throw error;
    }
  }

  /**
   * Update screening status based on alert reviews
   */
  private async updateScreeningStatus(screeningId: string): Promise<void> {
    // Get all alerts for screening
    const alerts = await this.prisma.amlAlert.findMany({
      where: { screeningId },
    });

    if (alerts.length === 0) {
      // No alerts, mark as clear
      await this.prisma.amlScreening.update({
        where: { id: screeningId },
        data: { status: ScreeningStatus.CLEAR },
      });
      return;
    }

    // Check if any alerts are confirmed matches
    const hasConfirmedMatch = alerts.some(
      (alert) => alert.status === AlertStatus.CONFIRMED,
    );

    if (hasConfirmedMatch) {
      await this.prisma.amlScreening.update({
        where: { id: screeningId },
        data: {
          status: ScreeningStatus.CONFIRMED_MATCH,
          riskLevel: RiskLevel.CRITICAL,
        },
      });
      return;
    }

    // Check if all alerts are reviewed (dismissed or confirmed)
    const allReviewed = alerts.every(
      (alert) =>
        alert.status === AlertStatus.DISMISSED ||
        alert.status === AlertStatus.CONFIRMED ||
        alert.status === AlertStatus.REVIEWED,
    );

    if (allReviewed) {
      const hasAnyMatch = alerts.some(
        (alert) => alert.status === AlertStatus.REVIEWED,
      );

      await this.prisma.amlScreening.update({
        where: { id: screeningId },
        data: {
          status: hasAnyMatch ? ScreeningStatus.POTENTIAL_MATCH : ScreeningStatus.CLEAR,
        },
      });
    } else {
      // Still has open or escalated alerts
      await this.prisma.amlScreening.update({
        where: { id: screeningId },
        data: { status: ScreeningStatus.PENDING_REVIEW },
      });
    }
  }

  /**
   * Log audit entry
   */
  private async logAuditEntry(entry: any): Promise<void> {
    this.logger.log('Audit log entry', entry);
    // Implementation depends on your audit log system
  }

  /**
   * Get overdue reviews
   */
  async getOverdueReviews(organisationId: string): Promise<any> {
    const now = new Date();

    const overdueScreenings = await this.prisma.amlScreening.findMany({
      where: {
        organisationId,
        nextReviewAt: {
          lt: now,
        },
        status: {
          notIn: [ScreeningStatus.CLEAR, ScreeningStatus.CONFIRMED_MATCH],
        },
      },
      include: {
        alerts: {
          where: { status: AlertStatus.OPEN },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { nextReviewAt: 'asc' },
    });

    return overdueScreenings;
  }

  /**
   * Bulk review alerts
   */
  async bulkReviewAlerts(
    alertIds: string[],
    dto: ReviewAlertDto,
  ): Promise<any> {
    try {
      this.logger.log('Bulk reviewing alerts', {
        count: alertIds.length,
        status: dto.status,
      });

      const results = await Promise.all(
        alertIds.map((id) => this.reviewAlert(id, dto)),
      );

      this.logger.log('Bulk review completed', { count: results.length });

      return results;
    } catch (error) {
      this.logger.error('Failed to bulk review alerts', error);
      throw error;
    }
  }
}
