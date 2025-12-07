/**
 * Tax Archive Integration Examples
 *
 * This file demonstrates how to integrate the Tax Archive service
 * with other modules like ELSTER, VAT, and background jobs.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TaxArchiveService } from '../tax-archive.service';

/**
 * Example: ELSTER Integration
 *
 * Archive VAT returns and receipts after ELSTER submission
 */
@Injectable()
export class ElsterArchiveIntegration {
  private readonly logger = new Logger(ElsterArchiveIntegration.name);

  constructor(private readonly archiveService: TaxArchiveService) {}

  /**
   * Archive VAT return after successful ELSTER submission
   */
  async afterVatSubmission(elsterFiling: any, receiptPdf?: Buffer): Promise<void> {
    try {
      // Archive the VAT return data
      const document = await this.archiveService.archiveVatReturn({
        organisationId: elsterFiling.organisationId,
        type: elsterFiling.type,
        year: elsterFiling.year,
        period: elsterFiling.period,
        periodType: elsterFiling.periodType,
        data: elsterFiling.data,
        transferTicket: elsterFiling.transferTicket,
        submittedAt: elsterFiling.submittedAt,
        submissionId: elsterFiling.submissionId,
      });

      this.logger.log(`VAT return archived: ${document.id}`);

      // Archive receipt if available
      if (receiptPdf && elsterFiling.transferTicket) {
        const period = `${elsterFiling.year}-${String(elsterFiling.period).padStart(2, '0')}`;
        const receipt = await this.archiveService.archiveElsterReceipt(
          elsterFiling.organisationId,
          elsterFiling.transferTicket,
          receiptPdf,
          period
        );

        this.logger.log(`ELSTER receipt archived: ${receipt.id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to archive ELSTER filing: ${error.message}`, error.stack);
      // Don't throw - archiving failure shouldn't break the submission flow
    }
  }
}

/**
 * Example: Scheduled Cleanup Job
 *
 * Automatically delete expired documents
 */
@Injectable()
export class TaxArchiveCleanupJob {
  private readonly logger = new Logger(TaxArchiveCleanupJob.name);

  constructor(private readonly archiveService: TaxArchiveService) {}

  /**
   * Run weekly cleanup of expired documents
   * Every Sunday at midnight
   */
  @Cron('0 0 * * 0')
  async cleanupExpiredDocuments(): Promise<void> {
    this.logger.log('Starting tax document cleanup job');

    try {
      const deleted = await this.archiveService.deleteExpiredDocuments();
      this.logger.log(`Deleted ${deleted} expired tax documents`);
    } catch (error) {
      this.logger.error(`Cleanup job failed: ${error.message}`, error.stack);
    }
  }
}

/**
 * Example: Expiry Notification Job
 *
 * Notify users of documents approaching retention expiry
 */
@Injectable()
export class TaxArchiveExpiryNotifications {
  private readonly logger = new Logger(TaxArchiveExpiryNotifications.name);

  constructor(
    private readonly archiveService: TaxArchiveService,
    // private readonly notificationService: NotificationService,
    // private readonly organisationService: OrganisationService,
  ) {}

  /**
   * Send expiry notifications
   * Every Monday at 9:00 AM
   */
  @Cron('0 9 * * 1')
  async notifyExpiringDocuments(): Promise<void> {
    this.logger.log('Checking for expiring tax documents');

    try {
      // Get all active organisations
      // const organisations = await this.organisationService.findAll();

      // For demo, using a single org ID
      const orgId = 'example-org-id';

      // Find documents expiring in next 90 days
      const expiring = await this.archiveService.getExpiringDocuments(orgId, 90);

      if (expiring.length > 0) {
        this.logger.log(`Found ${expiring.length} expiring documents for org ${orgId}`);

        // Send notification
        // await this.notificationService.send({
        //   to: org.email,
        //   type: 'tax_retention_expiring',
        //   data: {
        //     count: expiring.length,
        //     documents: expiring,
        //   },
        // });

        this.logger.log(`Sent expiry notification for ${expiring.length} documents`);
      }
    } catch (error) {
      this.logger.error(`Expiry notification job failed: ${error.message}`, error.stack);
    }
  }
}

/**
 * Example: Integrity Check Job
 *
 * Periodically verify document integrity
 */
@Injectable()
export class TaxArchiveIntegrityCheck {
  private readonly logger = new Logger(TaxArchiveIntegrityCheck.name);

  constructor(private readonly archiveService: TaxArchiveService) {}

  /**
   * Verify integrity of recent documents
   * Every day at 2:00 AM
   */
  @Cron('0 2 * * *')
  async verifyRecentDocuments(): Promise<void> {
    this.logger.log('Starting integrity check for recent documents');

    try {
      // Get documents from last 30 days
      const orgId = 'example-org-id';
      const currentYear = new Date().getFullYear();
      const documents = await this.archiveService.getYearDocuments(orgId, currentYear);

      let verified = 0;
      let failed = 0;

      for (const doc of documents) {
        const isValid = await this.archiveService.verifyIntegrity(doc.id);

        if (isValid) {
          verified++;
        } else {
          failed++;
          this.logger.error(`Integrity check failed for document ${doc.id}: ${doc.title}`);

          // Send alert
          // await this.alertService.send({
          //   severity: 'high',
          //   type: 'document_integrity_failed',
          //   documentId: doc.id,
          //   title: doc.title,
          // });
        }
      }

      this.logger.log(
        `Integrity check complete: ${verified} verified, ${failed} failed out of ${documents.length} documents`
      );
    } catch (error) {
      this.logger.error(`Integrity check job failed: ${error.message}`, error.stack);
    }
  }
}

/**
 * Example: Annual Tax Return Preparation
 *
 * Get all documents for a tax year
 */
@Injectable()
export class AnnualTaxReturnService {
  private readonly logger = new Logger(AnnualTaxReturnService.name);

  constructor(private readonly archiveService: TaxArchiveService) {}

  /**
   * Prepare data for annual tax return
   */
  async prepareAnnualReturn(orgId: string, year: number): Promise<any> {
    this.logger.log(`Preparing annual tax return for org ${orgId}, year ${year}`);

    // Get all documents for the year
    const documents = await this.archiveService.getYearDocuments(orgId, year);

    // Filter by type
    const vatReturns = documents.filter(d => d.type === 'vat_return');
    const receipts = documents.filter(d => d.type === 'elster_receipt');
    const supportingDocs = documents.filter(d => d.type === 'supporting_doc');

    this.logger.log(
      `Found ${vatReturns.length} VAT returns, ${receipts.length} receipts, ${supportingDocs.length} supporting docs`
    );

    // Extract data from VAT returns
    const vatData = vatReturns.map(doc => {
      if (doc.metadata && typeof doc.metadata === 'object' && 'archivedData' in doc.metadata) {
        return {
          period: doc.period,
          data: (doc.metadata as any).archivedData,
        };
      }
      return null;
    }).filter(d => d !== null);

    return {
      year,
      vatReturns: vatData,
      documentCount: {
        total: documents.length,
        vatReturns: vatReturns.length,
        receipts: receipts.length,
        supportingDocs: supportingDocs.length,
      },
    };
  }
}

/**
 * Example: Archive Statistics Dashboard
 *
 * Get statistics for admin dashboard
 */
@Injectable()
export class TaxArchiveDashboard {
  constructor(private readonly archiveService: TaxArchiveService) {}

  /**
   * Get dashboard data
   */
  async getDashboardData(orgId: string): Promise<any> {
    // Get overall statistics
    const stats = await this.archiveService.getArchiveStats(orgId);

    // Get expiring documents (next 90 days)
    const expiringSoon = await this.archiveService.getExpiringDocuments(orgId, 90);

    // Get current year documents
    const currentYear = new Date().getFullYear();
    const currentYearDocs = await this.archiveService.getYearDocuments(orgId, currentYear);

    return {
      overview: {
        totalDocuments: stats.totalDocuments,
        totalSizeMB: (stats.totalSize / 1024 / 1024).toFixed(2),
        oldestDocument: stats.oldestDocument,
        newestDocument: stats.newestDocument,
      },
      byType: stats.documentsByType,
      byYear: stats.documentsByYear,
      alerts: {
        expiringSoon: expiringSoon.length,
        currentYearDocs: currentYearDocs.length,
      },
    };
  }
}

/**
 * Example: Search and Filter
 *
 * Advanced search functionality
 */
@Injectable()
export class TaxArchiveSearch {
  constructor(private readonly archiveService: TaxArchiveService) {}

  /**
   * Search for VAT returns from a specific year
   */
  async searchVatReturns(orgId: string, year: number): Promise<any[]> {
    return this.archiveService.searchDocuments(orgId, {
      year,
      type: 'vat_return',
    });
  }

  /**
   * Search for documents containing specific text
   */
  async searchByText(orgId: string, searchTerm: string): Promise<any[]> {
    return this.archiveService.searchDocuments(orgId, {
      search: searchTerm,
    });
  }

  /**
   * Get all ELSTER receipts
   */
  async getElsterReceipts(orgId: string): Promise<any[]> {
    return this.archiveService.getDocumentsByType(orgId, 'elster_receipt');
  }
}
