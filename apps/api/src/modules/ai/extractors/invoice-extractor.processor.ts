/**
 * Invoice Extractor Processor
 * BullMQ processor for async invoice extraction jobs
 */

import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InvoiceExtractorService } from './invoice-extractor.service';
import { InvoiceExtractionResultDto } from './dto/invoice-extraction.dto';

export interface InvoiceExtractionJob {
  organisationId: string;
  fileBuffer: Buffer;
  mimeType: string;
  fileName?: string;
  userId?: string;
  options?: {
    maxRetries?: number;
    timeout?: number;
    enableFallback?: boolean;
  };
}

export interface InvoiceExtractionJobResult {
  extractionId: string;
  result: InvoiceExtractionResultDto;
}

@Processor('invoice-extraction')
export class InvoiceExtractorProcessor {
  private readonly logger = new Logger(InvoiceExtractorProcessor.name);

  constructor(private readonly invoiceExtractorService: InvoiceExtractorService) {}

  @Process('extract')
  async handleExtraction(job: Job<InvoiceExtractionJob>): Promise<InvoiceExtractionJobResult> {
    const { organisationId, fileBuffer, mimeType, fileName, userId, options } = job.data;

    this.logger.log(
      `Processing invoice extraction job ${job.id} for org ${organisationId}, file ${fileName}`,
    );

    // Update progress
    await job.progress(10);

    try {
      // Convert Buffer-like object back to Buffer if needed
      const buffer = Buffer.from(fileBuffer);

      // Update progress
      await job.progress(20);

      // Extract invoice
      const result = await this.invoiceExtractorService.extractInvoice({
        organisationId,
        file: buffer,
        mimeType,
        fileName,
        userId,
        options: {
          ...options,
          maxRetries: options?.maxRetries || 3,
          timeout: options?.timeout || 60000, // 60 seconds for async jobs
          enableFallback: options?.enableFallback ?? true,
        },
      });

      // Update progress
      await job.progress(100);

      this.logger.log(
        `Invoice extraction job ${job.id} completed: ${result.id} with confidence ${result.overallConfidence.toFixed(2)}`,
      );

      return {
        extractionId: result.id,
        result,
      };
    } catch (error) {
      this.logger.error(`Invoice extraction job ${job.id} failed:`, error);
      throw error;
    }
  }

  @Process('extract-batch')
  async handleBatchExtraction(
    job: Job<{ jobs: InvoiceExtractionJob[] }>,
  ): Promise<InvoiceExtractionJobResult[]> {
    const { jobs } = job.data;

    this.logger.log(`Processing batch invoice extraction job ${job.id} with ${jobs.length} items`);

    const results: InvoiceExtractionJobResult[] = [];
    const totalJobs = jobs.length;

    for (let i = 0; i < jobs.length; i++) {
      const jobData = jobs[i];

      try {
        this.logger.debug(`Processing batch item ${i + 1}/${totalJobs}`);

        // Update progress
        await job.progress(Math.round(((i + 1) / totalJobs) * 100));

        const buffer = Buffer.from(jobData.fileBuffer);

        const result = await this.invoiceExtractorService.extractInvoice({
          organisationId: jobData.organisationId,
          file: buffer,
          mimeType: jobData.mimeType,
          fileName: jobData.fileName,
          userId: jobData.userId,
          options: jobData.options,
        });

        results.push({
          extractionId: result.id,
          result,
        });
      } catch (error) {
        this.logger.error(`Batch item ${i + 1} failed:`, error);
        // Continue with other items even if one fails
      }
    }

    this.logger.log(
      `Batch extraction job ${job.id} completed: ${results.length}/${totalJobs} successful`,
    );

    return results;
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`, error.stack);
  }
}
