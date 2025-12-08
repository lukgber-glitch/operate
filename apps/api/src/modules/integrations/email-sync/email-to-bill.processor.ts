/**
 * Email-to-Bill Automation Processor
 * Automatically creates bills from extracted invoice data from emails
 *
 * Pipeline:
 * 1. Invoice extracted from email attachment (via InvoiceExtractorProcessor)
 * 2. Vendor auto-created if doesn't exist (via VendorAutoCreatorService)
 * 3. Bill created in DRAFT status for user review (via BillCreatorService)
 * 4. User receives notification about new draft bill
 *
 * This processor listens to invoice-extraction-completed events
 * and automatically creates draft bills for user approval.
 */

import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { BillCreatorService } from '../../ai/email-intelligence/bill-creator.service';
import { VendorAutoCreatorService } from '../../ai/email-intelligence/vendor-auto-creator.service';
import { ExtractedInvoiceDataDto } from '../../ai/extractors/dto/invoice-extraction.dto';

export interface EmailToBillJob {
  extractionId: string;
  attachmentId?: string;
  emailId?: string;
  organisationId: string;
  userId?: string;
  autoApprove?: boolean; // For high-confidence extractions
}

export interface EmailToBillResult {
  billId?: string;
  vendorId?: string;
  action: 'BILL_CREATED' | 'BILL_DUPLICATE' | 'VENDOR_CREATED' | 'SKIPPED' | 'ERROR';
  reasoning: string;
}

@Processor('email-to-bill')
@Injectable()
export class EmailToBillProcessor {
  private readonly logger = new Logger(EmailToBillProcessor.name);

  // Confidence threshold for auto-approval
  private readonly AUTO_APPROVE_CONFIDENCE_THRESHOLD = 0.95;

  constructor(
    private readonly prisma: PrismaService,
    private readonly billCreator: BillCreatorService,
    private readonly vendorAutoCreator: VendorAutoCreatorService,
  ) {}

  /**
   * Main processor: Convert extracted invoice to bill
   */
  @Process('create-bill-from-extraction')
  async handleCreateBill(job: Job<EmailToBillJob>): Promise<EmailToBillResult> {
    const { extractionId, attachmentId, emailId, organisationId, userId, autoApprove } = job.data;

    this.logger.log(
      `Processing email-to-bill job ${job.id} for extraction ${extractionId} (org: ${organisationId})`,
    );

    try {
      // 1. Get extraction data
      const extraction = await this.prisma.extractedInvoice.findUnique({
        where: { id: extractionId },
      });

      if (!extraction) {
        throw new Error(`Extraction not found: ${extractionId}`);
      }

      if (extraction.status !== 'COMPLETED') {
        return {
          action: 'SKIPPED',
          reasoning: `Extraction status is ${extraction.status}, expected COMPLETED`,
        };
      }

      // Get extracted data
      const extractedData = extraction.extractedData as unknown as ExtractedInvoiceDataDto;

      if (!extractedData) {
        return {
          action: 'SKIPPED',
          reasoning: 'No extracted data found',
        };
      }

      await job.progress(20);

      // 2. Auto-create vendor if doesn't exist
      this.logger.debug(`Checking/creating vendor: ${extractedData.vendorName}`);

      const vendorResult = await this.vendorAutoCreator.autoCreateVendor(
        organisationId,
        {
          name: extractedData.vendorName,
          email: extractedData.vendorEmail,
          address: extractedData.vendorAddress,
          vatId: extractedData.vendorVatId,
          iban: extractedData.iban,
        },
        {
          source: 'EMAIL_INVOICE_EXTRACTION',
          sourceEmailId: emailId,
          sourceAttachmentId: attachmentId,
        },
      );

      await job.progress(50);

      if (!vendorResult.vendor) {
        return {
          action: 'SKIPPED',
          reasoning: `Vendor creation failed: ${vendorResult.reasoning}`,
        };
      }

      this.logger.log(
        `Vendor ${vendorResult.action === 'CREATED' ? 'created' : 'found'}: ${vendorResult.vendor.id}`,
      );

      // 3. Determine auto-approval based on confidence
      const shouldAutoApprove =
        autoApprove === true ||
        (extraction.overallConfidence >= this.AUTO_APPROVE_CONFIDENCE_THRESHOLD);

      // 4. Create bill
      this.logger.debug(`Creating bill for vendor ${vendorResult.vendor.id}`);

      const billResult = await this.billCreator.createBillFromExtractedInvoice(
        organisationId,
        extractedData,
        {
          sourceEmailId: emailId,
          sourceAttachmentId: attachmentId,
          extractedDataId: extractionId,
          autoApprove: shouldAutoApprove,
          notes: `Automatically extracted from email${fileName ? `: ${fileName}` : ''}. Confidence: ${(extraction.overallConfidence * 100).toFixed(1)}%`,
        },
      );

      await job.progress(90);

      // 5. Update extraction record with bill reference
      if (billResult.bill) {
        await this.prisma.extractedInvoice.update({
          where: { id: extractionId },
          data: {
            billCreated: true,
            billId: billResult.bill.id,
          },
        }).catch(error => {
          this.logger.warn(`Failed to update extraction with bill reference: ${error.message}`);
        });

        // Update email attachment with bill reference
        if (attachmentId) {
          await this.prisma.emailAttachment.update({
            where: { id: attachmentId },
            data: {
              billId: billResult.bill.id,
            },
          }).catch(error => {
            this.logger.warn(`Failed to update attachment with bill reference: ${error.message}`);
          });
        }
      }

      await job.progress(100);

      // Log success
      if (billResult.action === 'CREATED') {
        this.logger.log(
          `✓ Bill created successfully: ${billResult.bill.id} for vendor ${vendorResult.vendor.name} (${shouldAutoApprove ? 'AUTO-APPROVED' : 'DRAFT'})`,
        );
      } else if (billResult.action === 'DUPLICATE_FOUND') {
        this.logger.log(
          `✓ Duplicate bill found: ${billResult.duplicateBillId} for invoice ${extractedData.invoiceNumber}`,
        );
      }

      return {
        billId: billResult.bill?.id,
        vendorId: vendorResult.vendor.id,
        action: billResult.action === 'CREATED' ? 'BILL_CREATED' : 'BILL_DUPLICATE',
        reasoning: billResult.reasoning,
      };
    } catch (error) {
      this.logger.error(
        `Email-to-bill job ${job.id} failed: ${error.message}`,
        error.stack,
      );

      return {
        action: 'ERROR',
        reasoning: `Error: ${error.message}`,
      };
    }
  }

  /**
   * Batch process multiple extractions
   */
  @Process('create-bills-batch')
  async handleCreateBillsBatch(
    job: Job<{ extractions: EmailToBillJob[] }>,
  ): Promise<EmailToBillResult[]> {
    const { extractions } = job.data;

    this.logger.log(
      `Processing batch email-to-bill job ${job.id} with ${extractions.length} extractions`,
    );

    const results: EmailToBillResult[] = [];
    const totalJobs = extractions.length;

    for (let i = 0; i < extractions.length; i++) {
      const extractionJob = extractions[i];

      try {
        // Update progress
        await job.progress(Math.round(((i + 1) / totalJobs) * 100));

        // Create a mock job for the individual extraction
        const mockJob: any = {
          id: `${job.id}-${i}`,
          data: extractionJob,
          progress: async (percent: number) => {},
        };

        const result = await this.handleCreateBill(mockJob);
        results.push(result);
      } catch (error) {
        this.logger.error(`Batch item ${i + 1} failed: ${error.message}`);
        results.push({
          action: 'ERROR',
          reasoning: `Error: ${error.message}`,
        });
      }
    }

    const created = results.filter((r) => r.action === 'BILL_CREATED').length;
    const duplicates = results.filter((r) => r.action === 'BILL_DUPLICATE').length;
    const errors = results.filter((r) => r.action === 'ERROR').length;
    const skipped = results.filter((r) => r.action === 'SKIPPED').length;

    this.logger.log(
      `Batch email-to-bill completed: ${created} created, ${duplicates} duplicates, ${skipped} skipped, ${errors} errors`,
    );

    return results;
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: EmailToBillResult | EmailToBillResult[]) {
    this.logger.log(
      `Email-to-bill job ${job.id} completed successfully`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Email-to-bill job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }
}

// Helper to get filename from extraction
function fileName(extraction: any): string | undefined {
  return extraction?.fileName || undefined;
}
