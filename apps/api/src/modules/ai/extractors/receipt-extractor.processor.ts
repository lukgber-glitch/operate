/**
 * Receipt Extractor Processor
 * BullMQ processor for async receipt extraction and expense creation
 */

import { Processor, Process, OnQueueError, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ReceiptExtractorService } from './receipt-extractor.service';
import { PrismaService } from '../../../database/prisma.service';
import { ExpensesService } from '../../finance/expenses/expenses.service';
import { ReceiptExtractionStatus } from './dto/receipt-extraction.dto';

interface ExtractReceiptJobData {
  extractionId?: string;
  organisationId: string;
  userId: string;
  file?: Buffer;
  mimeType?: string;
  fileName?: string;
  autoCategorize?: boolean;
  autoCreateExpense?: boolean;
}

interface CreateExpenseJobData {
  extractionId: string;
  organisationId: string;
  userId: string;
}

@Processor('receipt-extraction')
export class ReceiptExtractorProcessor {
  private readonly logger = new Logger(ReceiptExtractorProcessor.name);

  constructor(
    private readonly extractorService: ReceiptExtractorService,
    private readonly prisma: PrismaService,
    private readonly expensesService: ExpensesService,
  ) {}

  /**
   * Process receipt extraction job
   */
  @Process('extract-receipt')
  async handleExtraction(job: Job<ExtractReceiptJobData>): Promise<void> {
    const { extractionId, organisationId, userId, file, mimeType, fileName, autoCategorize, autoCreateExpense } = job.data;

    this.logger.log(`Processing extraction job ${job.id} for org ${organisationId}`);

    try {
      // Update job progress
      await job.progress(10);

      if (!file || !mimeType) {
        throw new Error('Missing file or mimeType in job data');
      }

      // Perform extraction
      await job.progress(30);
      const result = await this.extractorService.extractReceipt({
        file,
        mimeType,
        organisationId,
        userId,
        fileName,
        autoCategorize,
        autoCreateExpense: false, // Don't auto-create in extraction, we'll do it in separate job
      });

      await job.progress(80);

      // If auto-create expense is enabled and extraction successful
      if (autoCreateExpense && result.status === ReceiptExtractionStatus.COMPLETED) {
        await this.createExpenseFromExtraction({
          extractionId: result.id,
          organisationId,
          userId,
        });
      }

      await job.progress(100);

      this.logger.log(`Extraction job ${job.id} completed successfully: ${result.id}`);
    } catch (error) {
      this.logger.error(`Extraction job ${job.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Process expense creation job
   */
  @Process('create-expense')
  async handleExpenseCreation(job: Job<CreateExpenseJobData>): Promise<void> {
    const { extractionId, organisationId, userId } = job.data;

    this.logger.log(`Processing expense creation job ${job.id} for extraction ${extractionId}`);

    try {
      await job.progress(20);

      await this.createExpenseFromExtraction({
        extractionId,
        organisationId,
        userId,
      });

      await job.progress(100);

      this.logger.log(`Expense creation job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Expense creation job ${job.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Handle queue errors
   */
  @OnQueueError()
  async onError(error: Error): void {
    this.logger.error('Queue error:', error);
  }

  /**
   * Handle failed jobs
   */
  @OnQueueFailed()
  async onFailed(job: Job, error: Error): void {
    this.logger.error(`Job ${job.id} failed:`, error);

    // Update extraction status if extraction job failed
    if (job.name === 'extract-receipt' && job.data.extractionId) {
      try {
        await this.prisma.extractedReceipt.update({
          where: { id: job.data.extractionId },
          data: {
            status: ReceiptExtractionStatus.FAILED,
            errorMessage: error.message,
          },
        });
      } catch (updateError) {
        this.logger.error('Failed to update extraction status:', updateError);
      }
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create expense from extraction
   */
  private async createExpenseFromExtraction(params: {
    extractionId: string;
    organisationId: string;
    userId: string;
  }): Promise<string> {
    const { extractionId, organisationId, userId } = params;

    // Get extraction record
    const extraction = await this.prisma.extractedReceipt.findUnique({
      where: { id: extractionId },
    });

    if (!extraction) {
      throw new Error(`Extraction ${extractionId} not found`);
    }

    if (extraction.status !== ReceiptExtractionStatus.COMPLETED) {
      throw new Error(`Extraction ${extractionId} is not completed (status: ${extraction.status})`);
    }

    const data = extraction.extractedData as any;

    if (!data || !data.merchantName || typeof data.total !== 'number') {
      throw new Error('Invalid extraction data for expense creation');
    }

    // Check if expense already exists
    if (extraction.expenseId) {
      this.logger.warn(`Expense already exists for extraction ${extractionId}: ${extraction.expenseId}`);
      return extraction.expenseId;
    }

    // Map expense category
    const category = this.mapToExpenseCategory(extraction.suggestedCategory || 'OTHER');

    // Create expense
    const expense = await this.expensesService.create(organisationId, {
      description: `${data.merchantName}${data.items?.length > 0 ? ` - ${data.items[0].description}` : ''}`,
      amount: data.total,
      currency: data.currency || 'EUR',
      date: new Date(data.date),
      category,
      subcategory: extraction.suggestedSubcategory,
      vendorName: data.merchantName,
      vendorVatId: data.merchantVatId,
      receiptNumber: data.receiptNumber,
      vatAmount: data.tax,
      vatRate: data.taxRate,
      isDeductible: extraction.taxDeductible ?? true,
      submittedBy: userId,
      paymentMethod: this.mapPaymentMethod(data.paymentMethod),
      notes: data.metadata?.warnings?.join('; '),
      metadata: {
        extractionId,
        receiptType: data.receiptType,
        overallConfidence: extraction.overallConfidence,
        aiExtracted: true,
        cardLast4: data.cardLast4,
        tip: data.tip,
        discount: data.discount,
      },
    });

    // Link expense to extraction
    await this.prisma.extractedReceipt.update({
      where: { id: extractionId },
      data: { expenseId: expense.id },
    });

    this.logger.log(`Created expense ${expense.id} from extraction ${extractionId}`);

    return expense.id;
  }

  /**
   * Map to expense category enum
   */
  private mapToExpenseCategory(category: string): any {
    const mapping: Record<string, string> = {
      'OFFICE_SUPPLIES': 'OFFICE_SUPPLIES',
      'MEALS_ENTERTAINMENT': 'MEALS_ENTERTAINMENT',
      'TRAVEL': 'TRAVEL',
      'UTILITIES': 'UTILITIES',
      'INSURANCE': 'INSURANCE',
      'PROFESSIONAL_SERVICES': 'PROFESSIONAL_SERVICES',
      'MARKETING': 'MARKETING',
      'TECHNOLOGY': 'TECHNOLOGY',
      'VEHICLE': 'VEHICLE',
      'RENT': 'RENT',
      'OTHER': 'OTHER',
    };

    return mapping[category] || 'OTHER';
  }

  /**
   * Map payment method to expense format
   */
  private mapPaymentMethod(paymentMethod: string): string {
    const mapping: Record<string, string> = {
      'CASH': 'cash',
      'CREDIT_CARD': 'credit_card',
      'DEBIT_CARD': 'debit_card',
      'MOBILE_PAYMENT': 'mobile_payment',
      'WIRE_TRANSFER': 'bank_transfer',
      'CHECK': 'check',
      'OTHER': 'other',
      'UNKNOWN': 'other',
    };

    return mapping[paymentMethod] || 'other';
  }
}
