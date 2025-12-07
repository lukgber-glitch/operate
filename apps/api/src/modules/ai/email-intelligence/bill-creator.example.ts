/**
 * BillCreatorService - Usage Examples
 *
 * This file demonstrates how to use the BillCreatorService
 * to automatically create bills from extracted invoice data.
 */

import { Injectable, Logger } from '@nestjs/common';
import { BillCreatorService } from './bill-creator.service';
import { VendorAutoCreatorService } from './vendor-auto-creator.service';
import { ExtractedInvoiceDataDto } from '../extractors/dto/invoice-extraction.dto';

/**
 * Example 1: Basic Bill Creation
 */
@Injectable()
export class BasicBillCreationExample {
  private readonly logger = new Logger(BasicBillCreationExample.name);

  constructor(private readonly billCreator: BillCreatorService) {}

  async createBillFromExtractedData(
    orgId: string,
    extractedInvoice: ExtractedInvoiceDataDto,
  ) {
    // Simple creation - just pass the data
    const result = await this.billCreator.createBillFromExtractedInvoice(
      orgId,
      extractedInvoice,
    );

    // Handle the result
    switch (result.action) {
      case 'CREATED':
        this.logger.log(`✅ Bill created: ${result.bill.id}`);
        this.logger.log(`   Amount: ${result.bill.totalAmount} ${result.bill.currency}`);
        this.logger.log(`   Due: ${result.bill.dueDate}`);
        break;

      case 'DUPLICATE_FOUND':
        this.logger.warn(`⚠️ Duplicate bill found: ${result.duplicateBillId}`);
        this.logger.warn(`   Reason: ${result.reasoning}`);
        break;

      case 'SKIPPED':
        this.logger.warn(`❌ Bill creation skipped`);
        this.logger.warn(`   Reason: ${result.reasoning}`);
        break;
    }

    return result;
  }
}

/**
 * Example 2: Email-to-Bill Pipeline
 * Complete flow from email to bill creation
 */
@Injectable()
export class EmailToBillPipelineExample {
  private readonly logger = new Logger(EmailToBillPipelineExample.name);

  constructor(
    private readonly billCreator: BillCreatorService,
    private readonly vendorAutoCreator: VendorAutoCreatorService,
  ) {}

  async processInvoiceEmail(
    orgId: string,
    email: {
      id: string;
      subject: string;
      body: string;
      from: string;
    },
    extractedInvoice: ExtractedInvoiceDataDto,
  ) {
    this.logger.log(`Processing invoice email: ${email.subject}`);

    // Step 1: Create or match vendor (handled by VendorAutoCreatorService)
    // This example assumes vendor already exists or was created separately

    // Step 2: Create bill with email linkage
    const result = await this.billCreator.createBillFromExtractedInvoice(
      orgId,
      extractedInvoice,
      {
        sourceEmailId: email.id,
        notes: `Received via email: ${email.subject}`,
      },
    );

    if (result.action === 'CREATED') {
      this.logger.log(`✅ Bill created from email: ${result.bill.id}`);

      // You might want to:
      // - Send notification to user
      // - Add to review queue
      // - Update email metadata

      return {
        success: true,
        billId: result.bill.id,
        message: 'Bill created successfully',
      };
    }

    return {
      success: false,
      action: result.action,
      message: result.reasoning,
    };
  }
}

/**
 * Example 3: Batch Bill Creation
 * Process multiple invoices at once
 */
@Injectable()
export class BatchBillCreationExample {
  private readonly logger = new Logger(BatchBillCreationExample.name);

  constructor(private readonly billCreator: BillCreatorService) {}

  async processBatchInvoices(
    orgId: string,
    invoices: Array<{
      data: ExtractedInvoiceDataDto;
      emailId?: string;
      attachmentId?: string;
    }>,
  ) {
    this.logger.log(`Processing batch of ${invoices.length} invoices`);

    // Use batch method for efficiency
    const results = await this.billCreator.createBillsFromExtractedInvoices(
      orgId,
      invoices.map((invoice) => ({
        data: invoice.data,
        options: {
          sourceEmailId: invoice.emailId,
          sourceAttachmentId: invoice.attachmentId,
        },
      })),
    );

    // Analyze results
    const created = results.filter((r) => r.action === 'CREATED');
    const duplicates = results.filter((r) => r.action === 'DUPLICATE_FOUND');
    const skipped = results.filter((r) => r.action === 'SKIPPED');

    this.logger.log(`Batch processing complete:`);
    this.logger.log(`  ✅ Created: ${created.length}`);
    this.logger.log(`  ⚠️  Duplicates: ${duplicates.length}`);
    this.logger.log(`  ❌ Skipped: ${skipped.length}`);

    return {
      total: invoices.length,
      created: created.map((r) => r.bill.id),
      duplicates: duplicates.map((r) => r.duplicateBillId),
      skipped: skipped.map((r) => r.reasoning),
      summary: {
        createdCount: created.length,
        duplicateCount: duplicates.length,
        skippedCount: skipped.length,
      },
    };
  }
}

/**
 * Example 4: Auto-Approval Based on Rules
 * Automatically approve bills from trusted vendors
 */
@Injectable()
export class AutoApprovalExample {
  private readonly logger = new Logger(AutoApprovalExample.name);

  constructor(private readonly billCreator: BillCreatorService) {}

  async createBillWithAutoApproval(
    orgId: string,
    extractedInvoice: ExtractedInvoiceDataDto,
    vendorIsTrusted: boolean,
    amountUnderThreshold: boolean,
  ) {
    // Decide whether to auto-approve based on rules
    const shouldAutoApprove = vendorIsTrusted && amountUnderThreshold;

    const result = await this.billCreator.createBillFromExtractedInvoice(
      orgId,
      extractedInvoice,
      {
        autoApprove: shouldAutoApprove,
        notes: shouldAutoApprove
          ? 'Auto-approved: trusted vendor under threshold'
          : 'Requires manual review',
        categoryId: this.inferCategory(extractedInvoice),
      },
    );

    if (result.action === 'CREATED') {
      const status = result.bill.status;
      this.logger.log(
        `Bill created with status: ${status} (auto-approve: ${shouldAutoApprove})`,
      );
    }

    return result;
  }

  private inferCategory(invoice: ExtractedInvoiceDataDto): string | undefined {
    // Simple category inference based on vendor or line items
    const vendorName = invoice.vendorName?.toLowerCase() || '';

    if (vendorName.includes('software') || vendorName.includes('saas')) {
      return 'software-subscriptions';
    }
    if (vendorName.includes('office') || vendorName.includes('supplies')) {
      return 'office-supplies';
    }
    if (vendorName.includes('telecom') || vendorName.includes('phone')) {
      return 'telecommunications';
    }

    return undefined;
  }
}

/**
 * Example 5: Bill Creation with Statistics
 * Track and monitor bill creation metrics
 */
@Injectable()
export class BillCreationWithStatsExample {
  private readonly logger = new Logger(BillCreationWithStatsExample.name);

  constructor(private readonly billCreator: BillCreatorService) {}

  async createBillAndLogStats(
    orgId: string,
    extractedInvoice: ExtractedInvoiceDataDto,
  ) {
    // Create the bill
    const result = await this.billCreator.createBillFromExtractedInvoice(
      orgId,
      extractedInvoice,
    );

    // Get statistics for the last 30 days
    const stats = await this.billCreator.getBillCreationStats(orgId, 30);

    this.logger.log(`Bill creation stats (last 30 days):`);
    this.logger.log(`  Total bills created via email: ${stats.total}`);

    stats.stats.forEach((stat) => {
      this.logger.log(
        `  ${stat.sourceType} - ${stat.status}: ${stat._count} bills`,
      );
    });

    return {
      currentBill: result,
      statistics: stats,
    };
  }

  async getMonthlyReport(orgId: string) {
    // Get stats for different time periods
    const last7Days = await this.billCreator.getBillCreationStats(orgId, 7);
    const last30Days = await this.billCreator.getBillCreationStats(orgId, 30);
    const last90Days = await this.billCreator.getBillCreationStats(orgId, 90);

    return {
      weekly: {
        period: last7Days.period,
        total: last7Days.total,
        breakdown: last7Days.stats,
      },
      monthly: {
        period: last30Days.period,
        total: last30Days.total,
        breakdown: last30Days.stats,
      },
      quarterly: {
        period: last90Days.period,
        total: last90Days.total,
        breakdown: last90Days.stats,
      },
    };
  }
}

/**
 * Example 6: Error Handling and Recovery
 * Robust error handling for production use
 */
@Injectable()
export class ErrorHandlingExample {
  private readonly logger = new Logger(ErrorHandlingExample.name);

  constructor(private readonly billCreator: BillCreatorService) {}

  async createBillSafely(
    orgId: string,
    extractedInvoice: ExtractedInvoiceDataDto,
    options?: {
      sourceEmailId?: string;
      retryOnError?: boolean;
    },
  ) {
    try {
      const result = await this.billCreator.createBillFromExtractedInvoice(
        orgId,
        extractedInvoice,
        {
          sourceEmailId: options?.sourceEmailId,
        },
      );

      // Handle different outcomes
      if (result.action === 'CREATED') {
        return {
          success: true,
          bill: result.bill,
        };
      }

      if (result.action === 'DUPLICATE_FOUND') {
        this.logger.warn(
          `Duplicate bill detected: ${result.duplicateBillId}`,
        );
        return {
          success: false,
          error: 'DUPLICATE',
          message: result.reasoning,
          existingBillId: result.duplicateBillId,
        };
      }

      if (result.action === 'SKIPPED') {
        this.logger.warn(`Bill creation skipped: ${result.reasoning}`);
        return {
          success: false,
          error: 'SKIPPED',
          message: result.reasoning,
        };
      }
    } catch (error) {
      this.logger.error(
        `Error creating bill: ${error.message}`,
        error.stack,
      );

      // Optionally retry
      if (options?.retryOnError) {
        this.logger.log('Retrying bill creation...');
        return this.createBillSafely(orgId, extractedInvoice, {
          ...options,
          retryOnError: false, // Prevent infinite retry
        });
      }

      return {
        success: false,
        error: 'EXCEPTION',
        message: error.message,
      };
    }
  }
}

/**
 * Example 7: Integration with Notification System
 * Notify users about auto-created bills
 */
@Injectable()
export class BillCreationWithNotificationsExample {
  private readonly logger = new Logger(
    BillCreationWithNotificationsExample.name,
  );

  constructor(
    private readonly billCreator: BillCreatorService,
    // private readonly notificationService: NotificationService, // Assume exists
  ) {}

  async createBillWithNotification(
    orgId: string,
    userId: string,
    extractedInvoice: ExtractedInvoiceDataDto,
  ) {
    const result = await this.billCreator.createBillFromExtractedInvoice(
      orgId,
      extractedInvoice,
    );

    if (result.action === 'CREATED') {
      // Send notification to user
      // await this.notificationService.send({
      //   userId,
      //   type: 'BILL_AUTO_CREATED',
      //   title: 'New Bill Created',
      //   message: `Bill from ${result.bill.vendorName} for ${result.bill.totalAmount} ${result.bill.currency} has been auto-created from email.`,
      //   data: {
      //     billId: result.bill.id,
      //     vendorName: result.bill.vendorName,
      //     amount: result.bill.totalAmount,
      //     currency: result.bill.currency,
      //     dueDate: result.bill.dueDate,
      //   },
      //   actions: [
      //     { label: 'Review', action: 'review-bill', billId: result.bill.id },
      //     { label: 'Approve', action: 'approve-bill', billId: result.bill.id },
      //   ],
      // });

      this.logger.log(`Notification sent for bill: ${result.bill.id}`);
    }

    return result;
  }
}

/**
 * Example Usage in a Controller or Service
 */
export class UsageInController {
  constructor(private readonly billCreator: BillCreatorService) {}

  async handleIncomingInvoice(
    orgId: string,
    extractedInvoice: ExtractedInvoiceDataDto,
  ) {
    // Simple usage - let the service handle everything
    const result = await this.billCreator.createBillFromExtractedInvoice(
      orgId,
      extractedInvoice,
    );

    // Return appropriate HTTP response based on action
    if (result.action === 'CREATED') {
      return {
        status: 201,
        data: {
          billId: result.bill.id,
          message: 'Bill created successfully',
        },
      };
    }

    if (result.action === 'DUPLICATE_FOUND') {
      return {
        status: 409,
        error: 'Duplicate bill',
        data: {
          existingBillId: result.duplicateBillId,
          message: result.reasoning,
        },
      };
    }

    return {
      status: 400,
      error: 'Bill creation failed',
      message: result.reasoning,
    };
  }
}
