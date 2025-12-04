import { Injectable, Logger } from '@nestjs/common';
import { ConsentManagerService } from './services/consent-manager.service';
import { DataSubjectRequestService } from './services/data-subject-request.service';
import { DataRetentionService } from './services/data-retention.service';
import { DataPortabilityService } from './services/data-portability.service';
import { AnonymizationService } from './services/anonymization.service';
import { AuditTrailService } from './services/audit-trail.service';
import {
  DataSubjectRequestType,
  DataSubjectRequestStatus,
  ConsentPurpose,
  DataCategory,
} from './types/gdpr.types';

/**
 * Main GDPR Service
 * Orchestrates all GDPR compliance operations
 * Provides high-level API for GDPR functionality
 */
@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(
    private readonly consentManager: ConsentManagerService,
    private readonly dsrService: DataSubjectRequestService,
    private readonly retentionService: DataRetentionService,
    private readonly portabilityService: DataPortabilityService,
    private readonly anonymizationService: AnonymizationService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  /**
   * Get comprehensive GDPR compliance status
   */
  async getComplianceStatus(organisationId?: string) {
    this.logger.log(`Getting GDPR compliance status for org: ${organisationId}`);

    const [dsrStats, retentionStatus, consentStats] = await Promise.all([
      this.dsrService.getStatistics(organisationId),
      this.retentionService.getComplianceStatus(organisationId),
      this.consentManager.getConsentStats(organisationId),
    ]);

    return {
      organisationId,
      generatedAt: new Date(),
      dataSubjectRequests: {
        total: dsrStats.total,
        pending: dsrStats.byStatus['pending'] || 0,
        overdue: dsrStats.overdue,
        completed: dsrStats.byStatus['completed'] || 0,
        byType: dsrStats.byType,
      },
      retention: {
        totalPolicies: retentionStatus.totalPolicies,
        compliantPolicies: retentionStatus.compliantPolicies,
        complianceRate: retentionStatus.totalPolicies > 0
          ? (retentionStatus.compliantPolicies / retentionStatus.totalPolicies) * 100
          : 100,
      },
      consents: consentStats,
    };
  }

  /**
   * Process a Data Subject Request end-to-end
   */
  async processDataSubjectRequest(
    requestId: string,
    actorId: string,
  ) {
    this.logger.log(`Processing DSR: ${requestId}`);

    const request = await this.dsrService.getRequestByRequestId(requestId);

    // Mark as processing
    await this.dsrService.updateRequestStatus(
      request.id,
      {
        status: DataSubjectRequestStatus.PROCESSING,
      },
      actorId,
    );

    try {
      let resultFileUrl: string | undefined;

      switch (request.requestType) {
        case DataSubjectRequestType.ACCESS:
          // Export user data
          const exportResult = await this.portabilityService.exportUserData({
            userId: request.userId,
            includeAuditLogs: true,
            includeConsents: true,
          });
          resultFileUrl = exportResult.fileUrl;
          break;

        case DataSubjectRequestType.PORTABILITY:
          // Same as access but in structured format
          const portabilityResult = await this.portabilityService.exportUserData({
            userId: request.userId,
            format: 'json',
            includeAuditLogs: false,
            includeConsents: true,
          });
          resultFileUrl = portabilityResult.fileUrl;
          break;

        case DataSubjectRequestType.ERASURE:
          // Anonymize user
          await this.anonymizationService.anonymizeUser(
            request.userId,
            actorId,
            `DSR: ${requestId}`,
          );
          break;

        case DataSubjectRequestType.RECTIFICATION:
          // This requires manual intervention - just acknowledge
          this.logger.log('Rectification requests require manual data update');
          break;

        case DataSubjectRequestType.RESTRICTION:
          // Mark account for processing restriction
          this.logger.log('Processing restriction request');
          break;

        case DataSubjectRequestType.OBJECTION:
          // Revoke relevant consents
          await this.consentManager.revokeAllConsents(request.userId, actorId);
          break;
      }

      // Mark as completed
      await this.dsrService.updateRequestStatus(
        request.id,
        {
          status: DataSubjectRequestStatus.COMPLETED,
          completedBy: actorId,
          resultFileUrl,
        },
        actorId,
      );

      this.logger.log(`DSR ${requestId} completed successfully`);
      return { success: true, requestId, resultFileUrl };
    } catch (error) {
      this.logger.error(`Failed to process DSR ${requestId}: ${error.message}`, error.stack);

      // Mark as failed with reason
      await this.dsrService.updateRequestStatus(
        request.id,
        {
          status: DataSubjectRequestStatus.REJECTED,
          reason: `Processing failed: ${error.message}`,
          completedBy: actorId,
        },
        actorId,
      );

      return { success: false, requestId, error: error.message };
    }
  }

  /**
   * Get user's GDPR data overview
   */
  async getUserGdprOverview(userId: string) {
    const [consents, dsrHistory, anonymizationStatus] = await Promise.all([
      this.consentManager.getUserConsents(userId),
      this.dsrService.queryRequests({ userId }),
      this.anonymizationService.isUserAnonymized(userId),
    ]);

    return {
      userId,
      isAnonymized: anonymizationStatus,
      consents: {
        total: consents.length,
        granted: consents.filter((c) => c.granted).length,
        revoked: consents.filter((c) => !c.granted).length,
        details: consents,
      },
      dataSubjectRequests: {
        total: dsrHistory.length,
        pending: dsrHistory.filter(
          (r) => r.status === DataSubjectRequestStatus.PENDING ||
                r.status === DataSubjectRequestStatus.PROCESSING,
        ).length,
        completed: dsrHistory.filter((r) => r.status === DataSubjectRequestStatus.COMPLETED).length,
        history: dsrHistory,
      },
    };
  }

  /**
   * Handle user account deletion request
   */
  async handleAccountDeletion(
    userId: string,
    actorId: string,
    deleteType: 'anonymize' | 'hard_delete' = 'anonymize',
  ) {
    this.logger.log(`Account deletion requested for user ${userId}, type: ${deleteType}`);

    // Create DSR for audit trail
    const dsr = await this.dsrService.createRequest({
      userId,
      requestType: DataSubjectRequestType.ERASURE,
      metadata: {
        deleteType,
        initiatedBy: actorId,
      },
    });

    // Process deletion
    let result;
    if (deleteType === 'hard_delete') {
      result = await this.anonymizationService.hardDeleteUser(userId, actorId, `DSR: ${dsr.requestId}`);
    } else {
      result = await this.anonymizationService.anonymizeUser(userId, actorId, `DSR: ${dsr.requestId}`);
    }

    // Update DSR status
    if (result.success) {
      await this.dsrService.updateRequestStatus(
        dsr.id,
        {
          status: DataSubjectRequestStatus.COMPLETED,
          completedBy: actorId,
        },
        actorId,
      );
    } else {
      await this.dsrService.updateRequestStatus(
        dsr.id,
        {
          status: DataSubjectRequestStatus.REJECTED,
          reason: result.errors?.join(', ') || 'Unknown error',
          completedBy: actorId,
        },
        actorId,
      );
    }

    return {
      dsrId: dsr.id,
      requestId: dsr.requestId,
      ...result,
    };
  }

  /**
   * Initialize GDPR compliance for a new organisation
   */
  async initializeOrganisationCompliance(organisationId: string, actorId?: string) {
    this.logger.log(`Initializing GDPR compliance for organisation: ${organisationId}`);

    try {
      // Create default retention policies
      const policies = await this.retentionService.initializeDefaultPolicies(
        organisationId,
        actorId,
      );

      this.logger.log(`GDPR compliance initialized for org ${organisationId}`);
      return {
        success: true,
        organisationId,
        policiesCreated: policies.length,
        policies,
      };
    } catch (error) {
      this.logger.error(
        `Failed to initialize GDPR compliance: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        organisationId,
        error: error.message,
      };
    }
  }

  /**
   * Get GDPR dashboard data
   */
  async getDashboardData(organisationId?: string) {
    const [complianceStatus, pendingDSRs, overdueDSRs, recentAuditLogs] = await Promise.all([
      this.getComplianceStatus(organisationId),
      this.dsrService.getPendingRequests(organisationId),
      this.dsrService.getOverdueRequests(organisationId),
      this.auditTrail.searchAuditLogs({
        organisationId,
        limit: 10,
      }),
    ]);

    return {
      compliance: complianceStatus,
      alerts: {
        overdueDSRs: overdueDSRs.length,
        pendingDSRs: pendingDSRs.length,
      },
      pendingRequests: pendingDSRs,
      overdueRequests: overdueDSRs,
      recentActivity: recentAuditLogs.logs,
    };
  }

  /**
   * Export GDPR compliance report
   */
  async exportComplianceReport(
    organisationId: string,
    startDate: Date,
    endDate: Date,
  ) {
    this.logger.log(`Generating GDPR compliance report for ${organisationId}`);

    const [auditLogs, dsrStats, retentionStatus] = await Promise.all([
      this.auditTrail.exportAuditLogs({
        organisationId,
        startDate,
        endDate,
      }),
      this.dsrService.getStatistics(organisationId),
      this.retentionService.getComplianceStatus(organisationId),
    ]);

    return {
      organisationId,
      reportPeriod: {
        start: startDate,
        end: endDate,
      },
      generatedAt: new Date(),
      summary: {
        totalDSRs: dsrStats.total,
        completedDSRs: dsrStats.byStatus['completed'] || 0,
        overdueDSRs: dsrStats.overdue,
        retentionCompliance: {
          totalPolicies: retentionStatus.totalPolicies,
          compliantPolicies: retentionStatus.compliantPolicies,
          complianceRate: retentionStatus.totalPolicies > 0
            ? ((retentionStatus.compliantPolicies / retentionStatus.totalPolicies) * 100).toFixed(2) + '%'
            : '100%',
        },
      },
      auditLogs,
      dataSubjectRequests: dsrStats,
      retentionPolicies: retentionStatus,
    };
  }
}
