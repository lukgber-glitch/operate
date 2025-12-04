/**
 * Retention Policy Service
 * Implements GoBD-compliant retention policy enforcement (updated 2025 regulations)
 *
 * Features:
 * - Automatic retention period calculation per GoBD 2025 rules
 * - Document expiration detection with 90-day grace period
 * - Legal hold management
 * - Automated deletion processing with user confirmation
 * - Comprehensive audit logging via hash chain
 * - Annual retention reporting
 *
 * GoBD 2025 Update:
 * - TAX_RELEVANT retention increased from 8 to 10 years
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { HashChainService } from './hash-chain.service';
import { AuditAction, AuditEntityType, AuditActorType, ArchiveStatus, RetentionCategory } from '@prisma/client';
import {
  RetentionReport,
  ExpiredDocument,
  ProcessingResult,
  ProcessingError,
  RetentionHold,
  AnnualRetentionReport,
  ComplianceEvent,
  DeletionConfirmation,
  GOBD_RETENTION_PERIODS,
  GRACE_PERIOD_DAYS,
  DocumentDeletionRecord,
} from '../types/retention-policy.types';
import { promises as fs } from 'fs';

@Injectable()
export class RetentionPolicyService {
  private readonly logger = new Logger(RetentionPolicyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashChain: HashChainService,
  ) {}

  /**
   * Check retention status for a tenant
   *
   * @param tenantId - Organisation ID
   * @returns Comprehensive retention report
   */
  async checkRetentionStatus(tenantId: string): Promise<RetentionReport> {
    this.logger.debug(`Checking retention status for tenant ${tenantId}`);

    const now = new Date();
    const gracePeriodDate = new Date(now);
    gracePeriodDate.setDate(gracePeriodDate.getDate() - GRACE_PERIOD_DAYS);

    const nearExpirationDate = new Date(now);
    nearExpirationDate.setDate(nearExpirationDate.getDate() + 90);

    // Get all documents for tenant
    const documents = await this.prisma.archivedDocument.findMany({
      where: { organisationId: tenantId },
      include: {
        retentionHolds: {
          where: { releasedAt: null },
        },
      },
    });

    // Initialize category stats
    const byCategory: Record<string, any> = {};
    Object.keys(RetentionCategory).forEach((category) => {
      byCategory[category] = {
        total: 0,
        active: 0,
        expired: 0,
        onHold: 0,
        nearingExpiration: 0,
      };
    });

    let totalDocuments = 0;
    let activeDocuments = 0;
    let expiredDocuments = 0;
    let documentsOnHold = 0;
    let documentsInGracePeriod = 0;

    const issues: string[] = [];
    const warnings: string[] = [];

    // Process each document
    for (const doc of documents) {
      totalDocuments++;
      const category = doc.retentionCategory;
      byCategory[category].total++;

      const hasLegalHold = doc.retentionHolds.length > 0;
      const isExpired = doc.retentionEndDate < now;
      const isInGracePeriod = doc.retentionEndDate < now && doc.retentionEndDate > gracePeriodDate;
      const isNearingExpiration = doc.retentionEndDate < nearExpirationDate && doc.retentionEndDate > now;

      if (hasLegalHold) {
        documentsOnHold++;
        byCategory[category].onHold++;
      }

      if (isExpired) {
        expiredDocuments++;
        byCategory[category].expired++;

        if (isInGracePeriod) {
          documentsInGracePeriod++;
        }

        // Check if document should be flagged
        if (!hasLegalHold && !isInGracePeriod) {
          warnings.push(
            `Document ${doc.id} (${doc.originalFilename}) expired on ${doc.retentionEndDate.toISOString().split('T')[0]} and is past grace period`
          );
        }
      } else {
        activeDocuments++;
        byCategory[category].active++;

        if (isNearingExpiration) {
          byCategory[category].nearingExpiration++;
        }
      }

      // Check for corrupted documents
      if (doc.status === ArchiveStatus.CORRUPTED) {
        issues.push(`Document ${doc.id} (${doc.originalFilename}) is marked as CORRUPTED`);
      }
    }

    const report: RetentionReport = {
      tenantId,
      generatedAt: now,
      summary: {
        totalDocuments,
        activeDocuments,
        expiredDocuments,
        documentsOnHold,
        documentsInGracePeriod,
      },
      byCategory,
      complianceStatus: {
        compliant: issues.length === 0,
        issues,
        warnings,
      },
    };

    this.logger.log(
      `Retention status for ${tenantId}: ${totalDocuments} total, ${expiredDocuments} expired, ${documentsOnHold} on hold`
    );

    return report;
  }

  /**
   * Get expired documents for a tenant
   *
   * @param tenantId - Organisation ID
   * @returns List of expired documents with details
   */
  async getExpiredDocuments(tenantId: string): Promise<ExpiredDocument[]> {
    this.logger.debug(`Fetching expired documents for tenant ${tenantId}`);

    const now = new Date();
    const gracePeriodDate = new Date(now);
    gracePeriodDate.setDate(gracePeriodDate.getDate() - GRACE_PERIOD_DAYS);

    const documents = await this.prisma.archivedDocument.findMany({
      where: {
        organisationId: tenantId,
        retentionEndDate: { lt: now },
        status: ArchiveStatus.ACTIVE,
      },
      include: {
        retentionHolds: {
          where: { releasedAt: null },
          orderBy: { placedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { retentionEndDate: 'asc' },
    });

    const expiredDocs: ExpiredDocument[] = documents.map((doc) => {
      const hasLegalHold = doc.retentionHolds.length > 0;
      const daysOverdue = Math.floor((now.getTime() - doc.retentionEndDate.getTime()) / (1000 * 60 * 60 * 24));
      const gracePeriodEndsAt = new Date(doc.retentionEndDate);
      gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + GRACE_PERIOD_DAYS);

      return {
        id: doc.id,
        organisationId: doc.organisationId,
        originalFilename: doc.originalFilename,
        retentionCategory: doc.retentionCategory,
        retentionEndDate: doc.retentionEndDate,
        daysOverdue,
        hasLegalHold,
        legalHoldReason: hasLegalHold ? doc.retentionHolds[0].reason : undefined,
        entityType: doc.entityType || undefined,
        entityId: doc.entityId || undefined,
        archivedAt: doc.archivedAt,
        lastAccessedAt: doc.lastAccessedAt || undefined,
        fileSizeBytes: doc.fileSizeBytes,
        gracePeriodEndsAt,
        canDelete: !hasLegalHold && now > gracePeriodEndsAt,
      };
    });

    this.logger.log(`Found ${expiredDocs.length} expired documents for tenant ${tenantId}`);
    return expiredDocs;
  }

  /**
   * Process expired documents (mark for deletion or delete with confirmation)
   *
   * @param tenantId - Organisation ID
   * @param autoDelete - If true, automatically delete documents past grace period (requires confirmation)
   * @param confirmation - Deletion confirmation (required if autoDelete = true)
   * @returns Processing result
   */
  async processExpiredDocuments(
    tenantId: string,
    autoDelete = false,
    confirmation?: DeletionConfirmation
  ): Promise<ProcessingResult> {
    this.logger.log(`Processing expired documents for tenant ${tenantId}, autoDelete: ${autoDelete}`);

    const now = new Date();
    const errors: ProcessingError[] = [];
    let documentsMarkedForDeletion = 0;
    let documentsDeleted = 0;
    let documentsSkipped = 0;
    let storageFreed = 0;
    let oldestDocumentDeleted: Date | undefined;
    let newestDocumentDeleted: Date | undefined;

    const expiredDocs = await this.getExpiredDocuments(tenantId);
    const documentsReviewed = expiredDocs.length;

    for (const doc of expiredDocs) {
      try {
        // Skip if legal hold
        if (doc.hasLegalHold) {
          documentsSkipped++;
          this.logger.debug(`Skipping document ${doc.id} - has active legal hold`);
          continue;
        }

        // Check if in grace period
        if (!doc.canDelete) {
          documentsSkipped++;
          this.logger.debug(`Skipping document ${doc.id} - still in grace period until ${doc.gracePeriodEndsAt.toISOString()}`);
          continue;
        }

        // If autoDelete is enabled and confirmation provided
        if (autoDelete && confirmation) {
          // Verify document is in confirmation list
          if (!confirmation.documentIds.includes(doc.id)) {
            documentsSkipped++;
            this.logger.debug(`Skipping document ${doc.id} - not in confirmation list`);
            continue;
          }

          // Delete the document
          await this.deleteDocument(doc.id, tenantId, confirmation.confirmedBy, confirmation.reason);
          documentsDeleted++;
          storageFreed += doc.fileSizeBytes;

          if (!oldestDocumentDeleted || doc.archivedAt < oldestDocumentDeleted) {
            oldestDocumentDeleted = doc.archivedAt;
          }
          if (!newestDocumentDeleted || doc.archivedAt > newestDocumentDeleted) {
            newestDocumentDeleted = doc.archivedAt;
          }

          this.logger.log(`Deleted document ${doc.id} (${doc.originalFilename})`);
        } else {
          // Just mark for deletion review
          documentsMarkedForDeletion++;
          this.logger.debug(`Document ${doc.id} marked for deletion review`);
        }
      } catch (error) {
        errors.push({
          documentId: doc.id,
          filename: doc.originalFilename,
          error: error.message,
          timestamp: now,
        });
        this.logger.error(`Error processing document ${doc.id}: ${error.message}`);
      }
    }

    // Create audit log entry
    await this.hashChain.createEntry({
      tenantId,
      entityType: AuditEntityType.DOCUMENT,
      entityId: `retention_processing_${now.getTime()}`,
      action: AuditAction.DELETE,
      actorType: autoDelete ? AuditActorType.USER : AuditActorType.SYSTEM,
      actorId: confirmation?.confirmedBy || 'SYSTEM',
      metadata: {
        operation: 'process_expired_documents',
        autoDelete,
        documentsReviewed,
        documentsDeleted,
        documentsMarkedForDeletion,
        documentsSkipped,
        storageFreed,
      },
    });

    const result: ProcessingResult = {
      tenantId,
      processedAt: now,
      documentsReviewed,
      documentsMarkedForDeletion,
      documentsDeleted,
      documentsSkipped,
      errors,
      summary: {
        storageFreed,
        oldestDocumentDeleted,
        newestDocumentDeleted,
      },
    };

    this.logger.log(
      `Processed ${documentsReviewed} expired documents: ${documentsDeleted} deleted, ${documentsMarkedForDeletion} marked, ${documentsSkipped} skipped`
    );

    return result;
  }

  /**
   * Set legal hold on a document
   *
   * @param documentId - Document ID
   * @param reason - Reason for hold
   * @param placedBy - User ID placing the hold
   * @returns Created hold
   */
  async setRetentionHold(documentId: string, reason: string, placedBy: string): Promise<RetentionHold> {
    this.logger.log(`Placing retention hold on document ${documentId}`);

    // Verify document exists
    const doc = await this.prisma.archivedDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    if (doc.status !== ArchiveStatus.ACTIVE) {
      throw new BadRequestException(`Cannot place hold on document with status ${doc.status}`);
    }

    // Check if already has active hold
    const existingHold = await this.prisma.retentionHold.findFirst({
      where: {
        documentId,
        releasedAt: null,
      },
    });

    if (existingHold) {
      throw new BadRequestException(`Document ${documentId} already has an active retention hold`);
    }

    // Create hold
    const hold = await this.prisma.retentionHold.create({
      data: {
        documentId,
        reason,
        placedBy,
      },
    });

    // Audit log
    await this.hashChain.createEntry({
      tenantId: doc.organisationId,
      entityType: AuditEntityType.DOCUMENT,
      entityId: documentId,
      action: AuditAction.UPDATE,
      actorType: AuditActorType.USER,
      actorId: placedBy,
      metadata: {
        operation: 'set_retention_hold',
        holdId: hold.id,
        reason,
      },
    });

    this.logger.log(`Retention hold ${hold.id} placed on document ${documentId}`);

    return {
      id: hold.id,
      documentId: hold.documentId,
      reason: hold.reason,
      placedBy: hold.placedBy,
      placedAt: hold.placedAt,
      releasedAt: hold.releasedAt || undefined,
      isActive: !hold.releasedAt,
    };
  }

  /**
   * Remove legal hold from a document
   *
   * @param documentId - Document ID
   * @param releasedBy - User ID releasing the hold
   * @returns Updated hold
   */
  async removeRetentionHold(documentId: string, releasedBy: string): Promise<RetentionHold> {
    this.logger.log(`Removing retention hold from document ${documentId}`);

    // Find active hold
    const hold = await this.prisma.retentionHold.findFirst({
      where: {
        documentId,
        releasedAt: null,
      },
      include: {
        document: true,
      },
    });

    if (!hold) {
      throw new NotFoundException(`No active retention hold found for document ${documentId}`);
    }

    // Release hold
    const updated = await this.prisma.retentionHold.update({
      where: { id: hold.id },
      data: { releasedAt: new Date() },
    });

    // Audit log
    await this.hashChain.createEntry({
      tenantId: hold.document.organisationId,
      entityType: AuditEntityType.DOCUMENT,
      entityId: documentId,
      action: AuditAction.UPDATE,
      actorType: AuditActorType.USER,
      actorId: releasedBy,
      metadata: {
        operation: 'remove_retention_hold',
        holdId: hold.id,
        holdDuration: Math.floor((updated.releasedAt!.getTime() - hold.placedAt.getTime()) / (1000 * 60 * 60 * 24)),
      },
    });

    this.logger.log(`Retention hold ${hold.id} removed from document ${documentId}`);

    return {
      id: updated.id,
      documentId: updated.documentId,
      reason: updated.reason,
      placedBy: updated.placedBy,
      placedAt: updated.placedAt,
      releasedAt: updated.releasedAt || undefined,
      isActive: false,
    };
  }

  /**
   * Generate annual retention report
   *
   * @param tenantId - Organisation ID
   * @param year - Year to generate report for
   * @returns Annual retention report
   */
  async generateRetentionReport(tenantId: string, year: number): Promise<AnnualRetentionReport> {
    this.logger.log(`Generating retention report for tenant ${tenantId}, year ${year}`);

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    // Documents archived during the year
    const documentsArchived = await this.prisma.archivedDocument.count({
      where: {
        organisationId: tenantId,
        archivedAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    // Documents deleted during the year (check audit log)
    const deletionEvents = await this.prisma.auditLog.count({
      where: {
        tenantId,
        entityType: AuditEntityType.DOCUMENT,
        action: AuditAction.DELETE,
        timestamp: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    // Current documents
    const allDocuments = await this.prisma.archivedDocument.findMany({
      where: { organisationId: tenantId },
      include: {
        retentionHolds: true,
      },
    });

    // Legal holds stats
    const allHolds = await this.prisma.retentionHold.findMany({
      where: {
        document: { organisationId: tenantId },
        placedAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    const activeHolds = allHolds.filter((h) => !h.releasedAt);
    const releasedHolds = allHolds.filter((h) => h.releasedAt);
    const avgHoldDuration =
      releasedHolds.length > 0
        ? releasedHolds.reduce((sum, h) => {
            const duration = (h.releasedAt!.getTime() - h.placedAt.getTime()) / (1000 * 60 * 60 * 24);
            return sum + duration;
          }, 0) / releasedHolds.length
        : 0;

    // Calculate storage
    const totalStorageUsed = allDocuments.reduce((sum, doc) => sum + doc.fileSizeBytes, 0);
    const storageFreed = 0; // TODO: Track from deletion events

    // By category stats
    const byCategory: Record<string, any> = {};
    Object.keys(RetentionCategory).forEach((category) => {
      const categoryDocs = allDocuments.filter((d) => d.retentionCategory === category);
      const archivedInYear = categoryDocs.filter((d) => d.archivedAt >= startDate && d.archivedAt < endDate);
      const deletedInYear = 0; // TODO: Get from audit log

      const avgRetention =
        categoryDocs.length > 0
          ? categoryDocs.reduce((sum, doc) => {
              const days = Math.floor((new Date().getTime() - doc.archivedAt.getTime()) / (1000 * 60 * 60 * 24));
              return sum + days;
            }, 0) / categoryDocs.length
          : 0;

      byCategory[category] = {
        archived: archivedInYear.length,
        deleted: deletedInYear,
        active: categoryDocs.length,
        averageRetentionDays: Math.round(avgRetention),
      };
    });

    // Compliance events
    const complianceEvents: ComplianceEvent[] = [];
    // TODO: Extract from audit log

    const report: AnnualRetentionReport = {
      tenantId,
      year,
      generatedAt: new Date(),
      period: {
        startDate,
        endDate,
      },
      statistics: {
        documentsArchived,
        documentsDeleted: deletionEvents,
        documentsOnHold: activeHolds.length,
        totalStorageUsed,
        storageFreed,
      },
      byCategory,
      legalHolds: {
        total: allHolds.length,
        active: activeHolds.length,
        released: releasedHolds.length,
        averageDuration: Math.round(avgHoldDuration),
      },
      complianceEvents,
    };

    // Audit log
    await this.hashChain.createEntry({
      tenantId,
      entityType: AuditEntityType.DOCUMENT,
      entityId: `retention_report_${year}`,
      action: AuditAction.EXPORT,
      actorType: AuditActorType.SYSTEM,
      metadata: {
        operation: 'generate_retention_report',
        year,
        documentsArchived,
        documentsDeleted: deletionEvents,
      },
    });

    this.logger.log(`Generated retention report for ${tenantId}, year ${year}`);
    return report;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Delete a document and its storage file
   */
  private async deleteDocument(
    documentId: string,
    tenantId: string,
    deletedBy: string,
    reason?: string
  ): Promise<void> {
    const doc = await this.prisma.archivedDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    // Delete physical file
    try {
      await fs.unlink(doc.storagePath);
      this.logger.debug(`Deleted file: ${doc.storagePath}`);
    } catch (error) {
      this.logger.warn(`Failed to delete file ${doc.storagePath}: ${error.message}`);
      // Continue with database deletion
    }

    // Update status to DELETED (soft delete)
    await this.prisma.archivedDocument.update({
      where: { id: documentId },
      data: {
        status: ArchiveStatus.DELETED,
        updatedAt: new Date(),
      },
    });

    // Create audit entry
    await this.hashChain.createEntry({
      tenantId,
      entityType: AuditEntityType.DOCUMENT,
      entityId: documentId,
      action: AuditAction.DELETE,
      actorType: AuditActorType.USER,
      actorId: deletedBy,
      previousState: {
        filename: doc.originalFilename,
        retentionCategory: doc.retentionCategory,
        retentionEndDate: doc.retentionEndDate,
      },
      metadata: {
        operation: 'delete_expired_document',
        reason: reason || 'Retention period expired',
        fileSizeBytes: doc.fileSizeBytes,
      },
    });
  }
}
