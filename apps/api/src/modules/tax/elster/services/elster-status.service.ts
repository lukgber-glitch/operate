import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  StatusDetails,
  StatusEvent,
  WebhookPayload,
  StatusUpdateResult,
  PollOptions,
  StatusStatistics,
  ElsterStatusError,
  ElsterStatusErrorCode,
  VALID_STATUS_TRANSITIONS,
  STATUS_PRIORITY,
  StatusSource,
  DEFAULT_POLLING_CONFIG,
  NotificationTemplateData,
  StatusCheckJobData,
} from '../types/elster-status.types';
import { ElsterFilingStatus } from '../types/elster-vat.types';

/**
 * ELSTER Status Service
 *
 * Manages status tracking and updates for ELSTER submissions.
 *
 * Features:
 * - Status update tracking with audit trail
 * - Polling tigerVAT for status updates
 * - Webhook processing for real-time updates
 * - Automatic notifications on status changes
 * - Status timeline and history
 * - BullMQ job scheduling for background polling
 *
 * Status Flow:
 * DRAFT -> SUBMITTED -> PENDING -> ACCEPTED/REJECTED
 *                   \-> ERROR
 */
@Injectable()
export class ElsterStatusService {
  private readonly logger = new Logger(ElsterStatusService.name);
  private readonly tigerVATBaseUrl: string;
  private readonly tigerVATApiKey: string;
  private readonly pollingEnabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {
    this.tigerVATBaseUrl = this.config.get<string>(
      'TIGERVAT_BASE_URL',
      'https://api.tigervat.de/v1',
    );
    this.tigerVATApiKey = this.config.get<string>('TIGERVAT_API_KEY', '');
    this.pollingEnabled = this.config.get<boolean>(
      'ELSTER_POLLING_ENABLED',
      true,
    );
  }

  /**
   * Update status for a filing
   */
  async updateStatus(
    filingId: string,
    status: ElsterFilingStatus,
    details?: StatusDetails,
  ): Promise<any> {
    this.logger.log(`Updating status for filing ${filingId} to ${status}`);

    try {
      // Get current filing
      const filing = await this.prisma.elsterFiling.findUnique({
        where: { id: filingId },
      });

      if (!filing) {
        throw new ElsterStatusError(
          `Filing ${filingId} not found`,
          ElsterStatusErrorCode.FILING_NOT_FOUND,
        );
      }

      const previousStatus = filing.status as ElsterFilingStatus;

      // Validate status transition
      this.validateStatusTransition(previousStatus, status);

      // Update filing status
      const updatedFiling = await this.prisma.elsterFiling.update({
        where: { id: filingId },
        data: {
          status,
          responseAt:
            status !== ElsterFilingStatus.SUBMITTED &&
            status !== ElsterFilingStatus.PENDING
              ? new Date()
              : filing.responseAt,
          errors:
            details?.errorDetails || details?.errorCode
              ? {
                  code: details.errorCode,
                  message: details.errorDetails || details.message,
                  timestamp: details.timestamp,
                }
              : filing.errors,
        },
      });

      // Create status event
      await this.createStatusEvent(filingId, previousStatus, status, details);

      // Send notification if status changed
      const notificationSent =
        previousStatus !== status
          ? await this.notifyStatusChange(updatedFiling, previousStatus)
          : false;

      this.logger.log(
        `Status updated for filing ${filingId}: ${previousStatus} -> ${status}`,
      );

      return {
        success: true,
        filing: updatedFiling,
        statusChanged: previousStatus !== status,
        previousStatus,
        newStatus: status,
        notificationSent,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update status for filing ${filingId}: ${error.message}`,
        error.stack,
      );

      if (error instanceof ElsterStatusError) {
        throw error;
      }

      throw new ElsterStatusError(
        'Failed to update filing status',
        ElsterStatusErrorCode.UPDATE_FAILED,
        { originalError: error.message },
      );
    }
  }

  /**
   * Poll tigerVAT for status updates
   */
  async pollForUpdates(
    filingId: string,
    options: PollOptions = {},
  ): Promise<any> {
    this.logger.log(`Polling tigerVAT for updates on filing ${filingId}`);

    try {
      const filing = await this.prisma.elsterFiling.findUnique({
        where: { id: filingId },
      });

      if (!filing) {
        throw new ElsterStatusError(
          `Filing ${filingId} not found`,
          ElsterStatusErrorCode.FILING_NOT_FOUND,
        );
      }

      // Skip if status is terminal (ACCEPTED/REJECTED)
      if (
        filing.status === ElsterFilingStatus.ACCEPTED ||
        filing.status === ElsterFilingStatus.REJECTED
      ) {
        this.logger.log(
          `Skipping poll for filing ${filingId} - terminal status: ${filing.status}`,
        );
        return filing;
      }

      // Check if we need to poll (avoid too frequent polling)
      if (!options.force) {
        const lastEvent =
          await this.prisma.elsterFilingStatusEvent.findFirst({
            where: { filingId },
            orderBy: { createdAt: 'desc' },
          });

        if (lastEvent) {
          const timeSinceLastCheck =
            Date.now() - lastEvent.createdAt.getTime();
          if (timeSinceLastCheck < 60000) {
            // Less than 1 minute
            this.logger.debug(
              `Skipping poll for filing ${filingId} - checked ${timeSinceLastCheck}ms ago`,
            );
            return filing;
          }
        }
      }

      // Poll tigerVAT API
      if (!filing.transferTicket && !filing.submissionId) {
        this.logger.warn(
          `Filing ${filingId} has no transfer ticket or submission ID - cannot poll`,
        );
        return filing;
      }

      const statusData = await this.pollTigerVAT(
        filing.transferTicket || filing.submissionId,
        options.timeout,
      );

      // Map tigerVAT status to our status
      const newStatus = this.mapTigerVATStatus(statusData.status);

      // Update if status changed
      if (newStatus !== filing.status) {
        return await this.updateStatus(filingId, newStatus, {
          message: statusData.message,
          timestamp: new Date(),
          source: StatusSource.POLLING,
          rawData: statusData,
          errorCode: statusData.errorCode,
          errorDetails: statusData.errors?.join(', '),
        });
      }

      // Create event even if status didn't change (for audit trail)
      await this.createStatusEvent(
        filingId,
        filing.status as ElsterFilingStatus,
        filing.status as ElsterFilingStatus,
        {
          message: 'Status check - no change',
          timestamp: new Date(),
          source: StatusSource.POLLING,
        },
      );

      return filing;
    } catch (error) {
      this.logger.error(
        `Failed to poll for updates on filing ${filingId}: ${error.message}`,
        error.stack,
      );

      throw new ElsterStatusError(
        'Failed to poll for status updates',
        ElsterStatusErrorCode.POLL_FAILED,
        { originalError: error.message },
      );
    }
  }

  /**
   * Get all pending filings that need status check
   */
  async getPendingFilings(): Promise<any[]> {
    this.logger.log('Getting pending filings for status check');

    const filings = await this.prisma.elsterFiling.findMany({
      where: {
        status: {
          in: [
            ElsterFilingStatus.SUBMITTED,
            ElsterFilingStatus.PENDING,
            ElsterFilingStatus.ERROR,
          ],
        },
        // Only check filings submitted in the last 7 days
        submittedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        submittedAt: 'asc',
      },
    });

    this.logger.log(`Found ${filings.length} pending filings`);
    return filings;
  }

  /**
   * Schedule status check job (BullMQ integration placeholder)
   *
   * Note: This method prepares job data. Actual BullMQ integration
   * should be done in a separate queue module.
   */
  async scheduleStatusCheck(
    filingId: string,
    delay: number = DEFAULT_POLLING_CONFIG.intervalMs,
  ): Promise<StatusCheckJobData> {
    this.logger.log(
      `Scheduling status check for filing ${filingId} with delay ${delay}ms`,
    );

    const filing = await this.prisma.elsterFiling.findUnique({
      where: { id: filingId },
    });

    if (!filing) {
      throw new ElsterStatusError(
        `Filing ${filingId} not found`,
        ElsterStatusErrorCode.FILING_NOT_FOUND,
      );
    }

    const jobData: StatusCheckJobData = {
      filingId: filing.id,
      organisationId: filing.organisationId,
      submissionId: filing.submissionId,
      transferTicket: filing.transferTicket,
      retryCount: 0,
    };

    // TODO: Integrate with BullMQ
    // await this.statusQueue.add('check-status', jobData, {
    //   delay,
    //   attempts: DEFAULT_POLLING_CONFIG.maxRetries,
    //   backoff: {
    //     type: 'exponential',
    //     delay: DEFAULT_POLLING_CONFIG.retryDelayMs,
    //   },
    // });

    this.logger.log(
      `Status check job prepared for filing ${filingId} (BullMQ integration pending)`,
    );

    return jobData;
  }

  /**
   * Process webhook from tigerVAT
   */
  async handleWebhook(payload: WebhookPayload): Promise<any> {
    this.logger.log('Processing webhook from tigerVAT');

    try {
      // Validate payload
      this.validateWebhookPayload(payload);

      // Find filing by transfer ticket or submission ID
      const filing = await this.prisma.elsterFiling.findFirst({
        where: {
          OR: [
            { transferTicket: payload.transferTicket },
            { submissionId: payload.submissionId },
            { id: payload.filingId },
          ],
        },
      });

      if (!filing) {
        throw new ElsterStatusError(
          'Filing not found for webhook',
          ElsterStatusErrorCode.FILING_NOT_FOUND,
          { payload },
        );
      }

      // Map status
      const newStatus = this.mapTigerVATStatus(payload.status);

      // Update status
      return await this.updateStatus(filing.id, newStatus, {
        message: payload.message,
        timestamp: new Date(payload.timestamp),
        source: StatusSource.WEBHOOK,
        rawData: payload.data,
        errorDetails: payload.errors?.join(', '),
      });
    } catch (error) {
      this.logger.error(
        `Failed to process webhook: ${error.message}`,
        error.stack,
      );

      if (error instanceof ElsterStatusError) {
        throw error;
      }

      throw new ElsterStatusError(
        'Failed to process webhook',
        ElsterStatusErrorCode.WEBHOOK_VALIDATION_FAILED,
        { originalError: error.message },
      );
    }
  }

  /**
   * Get filing timeline/history
   */
  async getFilingTimeline(filingId: string): Promise<StatusEvent[]> {
    this.logger.log(`Getting timeline for filing ${filingId}`);

    const events = await this.prisma.elsterFilingStatusEvent.findMany({
      where: { filingId },
      orderBy: { createdAt: 'asc' },
    });

    return events.map((e) => ({
      id: e.id,
      filingId: e.filingId,
      fromStatus: e.fromStatus as ElsterFilingStatus | null,
      toStatus: e.toStatus as ElsterFilingStatus,
      details: e.details as any,
      createdAt: e.createdAt,
    }));
  }

  /**
   * Get status statistics
   */
  async getStatusStatistics(organisationId: string): Promise<StatusStatistics> {
    this.logger.log(`Getting status statistics for org ${organisationId}`);

    const filings = await this.prisma.elsterFiling.findMany({
      where: { organisationId },
      select: { status: true },
    });

    const byStatus = filings.reduce(
      (acc, f) => {
        const status = f.status as ElsterFilingStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<ElsterFilingStatus, number>,
    );

    const pending =
      (byStatus[ElsterFilingStatus.SUBMITTED] || 0) +
      (byStatus[ElsterFilingStatus.PENDING] || 0);

    const needsAttention =
      (byStatus[ElsterFilingStatus.REJECTED] || 0) +
      (byStatus[ElsterFilingStatus.ERROR] || 0);

    return {
      total: filings.length,
      byStatus,
      pending,
      needsAttention,
      lastUpdated: new Date(),
    };
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Send notification on status change
   */
  async notifyStatusChange(filing: any, oldStatus: string): Promise<boolean> {
    this.logger.log(
      `Sending notification for filing ${filing.id} status change: ${oldStatus} -> ${filing.status}`,
    );

    try {
      // Get organisation details for notification
      const org = await this.prisma.organisation.findUnique({
        where: { id: filing.organisationId },
      });

      if (!org) {
        this.logger.warn(`Organisation ${filing.organisationId} not found`);
        return false;
      }

      const templateData: NotificationTemplateData = {
        organisationName: org.name,
        filingType: filing.type,
        period: `${filing.year}/${filing.period}`,
        status: filing.status as ElsterFilingStatus,
        timestamp: new Date(),
        message: (filing.errors as any)?.message,
        errors: (filing.errors as any)?.errors,
        transferTicket: filing.transferTicket,
      };

      // Create notification
      const priority = STATUS_PRIORITY[filing.status as ElsterFilingStatus];

      await this.prisma.notification.create({
        data: {
          userId: filing.createdBy,
          orgId: filing.organisationId,
          type: 'elster_status_change',
          title: `ELSTER Filing Status: ${filing.status}`,
          message: this.buildNotificationMessage(templateData),
          data: templateData as any,
          priority,
          status: 'UNREAD',
        },
      });

      this.logger.log(`Notification sent for filing ${filing.id}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send notification for filing ${filing.id}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Build notification message
   */
  private buildNotificationMessage(data: NotificationTemplateData): string {
    const { filingType, period, status, message } = data;

    let msg = `Your ${filingType} filing for ${period} status: ${status}`;

    if (message) {
      msg += `\n\n${message}`;
    }

    switch (status) {
      case ElsterFilingStatus.ACCEPTED:
        msg += '\n\nYour filing has been successfully accepted by ELSTER.';
        break;
      case ElsterFilingStatus.REJECTED:
        msg += '\n\nYour filing was rejected. Please review the errors and resubmit.';
        break;
      case ElsterFilingStatus.ERROR:
        msg += '\n\nAn error occurred during processing. Please try again or contact support.';
        break;
      case ElsterFilingStatus.PENDING:
        msg += '\n\nYour filing is being processed by ELSTER.';
        break;
    }

    return msg;
  }

  /**
   * Create status event record
   */
  private async createStatusEvent(
    filingId: string,
    fromStatus: ElsterFilingStatus | null,
    toStatus: ElsterFilingStatus,
    details?: StatusDetails,
  ): Promise<void> {
    await this.prisma.elsterFilingStatusEvent.create({
      data: {
        filingId,
        fromStatus,
        toStatus,
        details: details as any,
      },
    });
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    from: ElsterFilingStatus,
    to: ElsterFilingStatus,
  ): void {
    const allowedTransitions = VALID_STATUS_TRANSITIONS[from] || [];

    if (!allowedTransitions.includes(to)) {
      throw new ElsterStatusError(
        `Invalid status transition from ${from} to ${to}`,
        ElsterStatusErrorCode.INVALID_STATUS,
        { from, to, allowedTransitions },
      );
    }
  }

  /**
   * Validate webhook payload
   */
  private validateWebhookPayload(payload: WebhookPayload): void {
    if (!payload.status) {
      throw new ElsterStatusError(
        'Webhook payload missing status',
        ElsterStatusErrorCode.WEBHOOK_VALIDATION_FAILED,
      );
    }

    if (
      !payload.filingId &&
      !payload.submissionId &&
      !payload.transferTicket
    ) {
      throw new ElsterStatusError(
        'Webhook payload missing filing identifier',
        ElsterStatusErrorCode.WEBHOOK_VALIDATION_FAILED,
      );
    }
  }

  /**
   * Poll tigerVAT API for status
   */
  private async pollTigerVAT(
    identifier: string,
    timeout: number = 10000,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.tigerVATBaseUrl}/vat/status/${identifier}`, {
          headers: {
            Authorization: `Bearer ${this.tigerVATApiKey}`,
          },
          timeout,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`tigerVAT poll failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Map tigerVAT status to our status enum
   */
  private mapTigerVATStatus(tigerVATStatus: string): ElsterFilingStatus {
    const statusMap: Record<string, ElsterFilingStatus> = {
      DRAFT: ElsterFilingStatus.DRAFT,
      SUBMITTED: ElsterFilingStatus.SUBMITTED,
      PROCESSING: ElsterFilingStatus.PENDING,
      PENDING: ElsterFilingStatus.PENDING,
      ACCEPTED: ElsterFilingStatus.ACCEPTED,
      APPROVED: ElsterFilingStatus.ACCEPTED,
      REJECTED: ElsterFilingStatus.REJECTED,
      DECLINED: ElsterFilingStatus.REJECTED,
      ERROR: ElsterFilingStatus.ERROR,
      FAILED: ElsterFilingStatus.ERROR,
    };

    return (
      statusMap[tigerVATStatus.toUpperCase()] || ElsterFilingStatus.ERROR
    );
  }
}
