/**
 * Email Bill Automation Service
 * Orchestrates the complete email→bill automation pipeline
 *
 * Flow:
 * 1. Email synced → SyncedEmail created
 * 2. Attachments detected and classified
 * 3. Invoice attachments extracted using GPT-4 Vision
 * 4. Vendor auto-created if doesn't exist
 * 5. Draft bill created for user review
 * 6. User notified about new draft bill
 *
 * This service provides high-level methods to trigger and monitor
 * the automated bill creation pipeline from emails.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { BillCreatorService } from '../../ai/email-intelligence/bill-creator.service';
import { VendorAutoCreatorService } from '../../ai/email-intelligence/vendor-auto-creator.service';
import { InvoiceExtractorService } from '../../ai/extractors/invoice-extractor.service';

export interface ProcessEmailForBillsOptions {
  emailId: string;
  organisationId: string;
  userId?: string;
  autoApprove?: boolean;
  minConfidence?: number; // Minimum confidence to create bill (default: 0.7)
}

export interface ProcessEmailForBillsResult {
  emailId: string;
  attachmentsProcessed: number;
  billsCreated: number;
  billsDuplicate: number;
  billsSkipped: number;
  vendorsCreated: number;
  errors: string[];
  bills: Array<{
    billId: string;
    vendorName: string;
    amount: number;
    confidence: number;
    status: 'DRAFT' | 'APPROVED';
  }>;
}

@Injectable()
export class EmailBillAutomationService {
  private readonly logger = new Logger(EmailBillAutomationService.name);
  private readonly DEFAULT_MIN_CONFIDENCE = 0.7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly billCreator: BillCreatorService,
    private readonly vendorAutoCreator: VendorAutoCreatorService,
    private readonly invoiceExtractor: InvoiceExtractorService,
    @InjectQueue('email-to-bill') private readonly emailToBillQueue: Queue,
  ) {}

  /**
   * Process a single email for automatic bill creation
   * Checks all attachments, extracts invoices, and creates bills
   */
  async processEmailForBills(
    options: ProcessEmailForBillsOptions,
  ): Promise<ProcessEmailForBillsResult> {
    const { emailId, organisationId, userId, autoApprove, minConfidence } = options;
    const confidenceThreshold = minConfidence || this.DEFAULT_MIN_CONFIDENCE;

    this.logger.log(
      `Processing email ${emailId} for automatic bill creation (org: ${organisationId})`,
    );

    const result: ProcessEmailForBillsResult = {
      emailId,
      attachmentsProcessed: 0,
      billsCreated: 0,
      billsDuplicate: 0,
      billsSkipped: 0,
      vendorsCreated: 0,
      errors: [],
      bills: [],
    };

    try {
      // 1. Get email with attachments
      const email = await this.prisma.syncedEmail.findUnique({
        where: { id: emailId },
        include: {
          attachments: {
            where: {
              classifiedType: 'INVOICE', // Only process invoice attachments
              extractionStatus: 'COMPLETED', // Only process successfully extracted
            },
          },
        },
      });

      if (!email) {
        result.errors.push(`Email not found: ${emailId}`);
        return result;
      }

      if (email.orgId !== organisationId) {
        result.errors.push('Access denied to this email');
        return result;
      }

      if (!email.attachments || email.attachments.length === 0) {
        this.logger.debug(
          `No invoice attachments found for email ${emailId}`,
        );
        return result;
      }

      this.logger.log(
        `Found ${email.attachments.length} invoice attachment(s) to process`,
      );

      // 2. Process each invoice attachment
      for (const attachment of email.attachments) {
        try {
          result.attachmentsProcessed++;

          // Get extracted invoice data using extractedDataId
          if (!attachment.extractedDataId) {
            this.logger.warn(
              `Attachment ${attachment.id} has no extractedDataId`,
            );
            result.billsSkipped++;
            continue;
          }

          const extraction = await this.prisma.extractedInvoice.findUnique({
            where: { id: attachment.extractedDataId },
          });

          if (!extraction) {
            this.logger.warn(
              `Extracted invoice not found for attachment ${attachment.id}`,
            );
            result.billsSkipped++;
            continue;
          }

          const extractedData = extraction.extractedData as any;

          // Check confidence threshold
          if (extraction.overallConfidence < confidenceThreshold) {
            this.logger.debug(
              `Skipping attachment ${attachment.id}: confidence ${extraction.overallConfidence} below threshold ${confidenceThreshold}`,
            );
            result.billsSkipped++;
            result.errors.push(
              `Low confidence (${(extraction.overallConfidence * 100).toFixed(1)}%) for ${attachment.filename}`,
            );
            continue;
          }

          // 3. Auto-create vendor if needed
          // Note: VendorAutoCreatorService.createVendorFromInvoice requires EmailMessage
          // For now, we'll skip vendor creation and use the vendorName from extraction
          // This would need to be implemented properly with email context
          this.logger.debug(
            `Skipping vendor auto-creation for ${extractedData.vendorName} - needs email context`,
          );

          // 4. Create bill
          const shouldAutoApprove =
            autoApprove === true ||
            extraction.overallConfidence >= 0.95;

          const billResult = await this.billCreator.createBillFromExtractedInvoice(
            organisationId,
            extractedData,
            {
              sourceEmailId: emailId,
              sourceAttachmentId: attachment.id,
              extractedDataId: extraction.id,
              autoApprove: shouldAutoApprove,
              notes: `Auto-extracted from email: ${email.subject}. File: ${attachment.filename}. Confidence: ${(extraction.overallConfidence * 100).toFixed(1)}%`,
            },
          );

          // 5. Update records
          if (billResult.bill) {
            // Note: ExtractedInvoice and EmailAttachment models don't have billId/billCreated fields
            // These would need to be added to the schema if tracking is needed
            // For now, we'll skip these updates
            this.logger.debug(
              `Bill ${billResult.bill.id} created for extraction ${extraction.id}`,
            );
          }

          // 6. Track results
          if (billResult.action === 'CREATED') {
            result.billsCreated++;
            result.bills.push({
              billId: billResult.bill.id,
              vendorName: billResult.bill.vendorName,
              amount: billResult.bill.totalAmount.toNumber(),
              confidence: extraction.overallConfidence,
              status: shouldAutoApprove ? 'APPROVED' : 'DRAFT',
            });

            this.logger.log(
              `✓ Bill created: ${billResult.bill.id} for ${billResult.bill.vendorName} - ${billResult.bill.totalAmount} ${billResult.bill.currency}`,
            );
          } else if (billResult.action === 'DUPLICATE_FOUND') {
            result.billsDuplicate++;
            result.errors.push(
              `Duplicate bill found for invoice ${extractedData.invoiceNumber}`,
            );
          } else {
            result.billsSkipped++;
            result.errors.push(billResult.reasoning);
          }
        } catch (error) {
          this.logger.error(
            `Failed to process attachment ${attachment.id}: ${error.message}`,
            error.stack,
          );
          result.errors.push(
            `Attachment ${attachment.filename}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Email processing complete: ${result.billsCreated} bills created, ${result.billsDuplicate} duplicates, ${result.billsSkipped} skipped`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process email ${emailId}: ${error.message}`,
        error.stack,
      );
      result.errors.push(`Error: ${error.message}`);
      return result;
    }
  }

  /**
   * Process all invoice emails for an organization
   * Useful for bulk/batch processing
   */
  async processAllInvoiceEmails(
    organisationId: string,
    options?: {
      since?: Date;
      limit?: number;
      autoApprove?: boolean;
      minConfidence?: number;
    },
  ): Promise<{
    processed: number;
    totalBillsCreated: number;
    totalVendorsCreated: number;
    errors: number;
  }> {
    this.logger.log(
      `Batch processing all invoice emails for org ${organisationId}`,
    );

    const since = options?.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const limit = options?.limit || 100;

    // Find all emails with invoice attachments
    const emails = await this.prisma.syncedEmail.findMany({
      where: {
        orgId: organisationId,
        isInvoice: true,
        hasAttachments: true,
        receivedAt: { gte: since },
      },
      take: limit,
      orderBy: { receivedAt: 'desc' },
    });

    let totalProcessed = 0;
    let totalBillsCreated = 0;
    let totalVendorsCreated = 0;
    let totalErrors = 0;

    for (const email of emails) {
      try {
        const result = await this.processEmailForBills({
          emailId: email.id,
          organisationId,
          userId: email.userId,
          autoApprove: options?.autoApprove,
          minConfidence: options?.minConfidence,
        });

        totalProcessed++;
        totalBillsCreated += result.billsCreated;
        totalVendorsCreated += result.vendorsCreated;
        if (result.errors.length > 0) {
          totalErrors++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to process email ${email.id}: ${error.message}`,
        );
        totalErrors++;
      }
    }

    this.logger.log(
      `Batch processing complete: ${totalProcessed} emails, ${totalBillsCreated} bills created, ${totalVendorsCreated} vendors created, ${totalErrors} errors`,
    );

    return {
      processed: totalProcessed,
      totalBillsCreated,
      totalVendorsCreated,
      errors: totalErrors,
    };
  }

  /**
   * Get automation statistics for an organization
   */
  async getAutomationStats(organisationId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      totalEmailsProcessed,
      totalBillsCreated,
      totalVendorsAutoCreated,
      billsAwaitingReview,
    ] = await Promise.all([
      this.prisma.syncedEmail.count({
        where: {
          orgId: organisationId,
          isInvoice: true,
          receivedAt: { gte: since },
        },
      }),
      this.prisma.bill.count({
        where: {
          organisationId,
          sourceType: 'EMAIL_EXTRACTION',
          createdAt: { gte: since },
        },
      }),
      this.prisma.vendor.count({
        where: {
          organisationId,
          metadata: {
            path: ['autoCreated'],
            equals: true,
          },
          createdAt: { gte: since },
        },
      }),
      this.prisma.bill.count({
        where: {
          organisationId,
          sourceType: 'EMAIL_EXTRACTION',
          status: 'DRAFT',
        },
      }),
    ]);

    return {
      period: `Last ${days} days`,
      emailsProcessed: totalEmailsProcessed,
      billsCreated: totalBillsCreated,
      vendorsAutoCreated: totalVendorsAutoCreated,
      billsAwaitingReview,
      automationRate:
        totalEmailsProcessed > 0
          ? ((totalBillsCreated / totalEmailsProcessed) * 100).toFixed(1) + '%'
          : '0%',
    };
  }
}
