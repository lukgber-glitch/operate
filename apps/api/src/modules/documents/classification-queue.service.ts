/**
 * Classification Queue Service
 * Handles async document classification with queue management,
 * retry logic, and rate limiting.
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClassificationService, ClassificationResult } from './classification.service';
import { DocumentsRepository } from './documents.repository';
import { Prisma, DocumentStatus } from '@prisma/client';

export interface ClassificationJob {
  id: string;
  documentId: string;
  orgId: string;
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
  priority: 'high' | 'normal' | 'low';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  lastAttemptAt?: Date;
  error?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ClassificationQueueConfig {
  maxConcurrent: number;
  maxRetries: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  rateLimit: {
    maxPerMinute: number;
    maxPerHour: number;
  };
  batchSize: number;
  processingTimeoutMs: number;
}

export interface ClassificationEvent {
  documentId: string;
  orgId: string;
  result?: ClassificationResult;
  error?: string;
  processingTimeMs: number;
}

const DEFAULT_CONFIG: ClassificationQueueConfig = {
  maxConcurrent: 5,
  maxRetries: 3,
  retryDelayMs: 2000,
  retryBackoffMultiplier: 2,
  rateLimit: {
    maxPerMinute: 30,
    maxPerHour: 500,
  },
  batchSize: 10,
  processingTimeoutMs: 60000, // 60 seconds
};

@Injectable()
export class ClassificationQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClassificationQueueService.name);
  private readonly config: ClassificationQueueConfig;
  private readonly queue: Map<string, ClassificationJob> = new Map();
  private readonly processing: Set<string> = new Set();
  private readonly results: Map<string, ClassificationResult> = new Map();

  // Rate limiting
  private requestsThisMinute = 0;
  private requestsThisHour = 0;
  private minuteResetTimer?: NodeJS.Timeout;
  private hourResetTimer?: NodeJS.Timeout;

  // Processing
  private processingInterval?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(
    private classificationService: ClassificationService,
    private documentsRepository: DocumentsRepository,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    // Load config from environment or use defaults
    this.config = {
      ...DEFAULT_CONFIG,
      maxConcurrent: this.configService.get<number>('CLASSIFICATION_MAX_CONCURRENT', DEFAULT_CONFIG.maxConcurrent),
      maxRetries: this.configService.get<number>('CLASSIFICATION_MAX_RETRIES', DEFAULT_CONFIG.maxRetries),
      retryDelayMs: this.configService.get<number>('CLASSIFICATION_RETRY_DELAY_MS', DEFAULT_CONFIG.retryDelayMs),
    };
  }

  onModuleInit() {
    this.startProcessing();
    this.startRateLimitResets();
    this.logger.log('Classification queue service initialized');
  }

  onModuleDestroy() {
    this.stopProcessing();
  }

  /**
   * Add a document to the classification queue
   */
  async enqueue(
    documentId: string,
    orgId: string,
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string,
    priority: 'high' | 'normal' | 'low' = 'normal',
  ): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const job: ClassificationJob = {
      id: jobId,
      documentId,
      orgId,
      fileBuffer,
      mimeType,
      fileName,
      priority,
      attempts: 0,
      maxAttempts: this.config.maxRetries + 1,
      createdAt: new Date(),
      status: 'pending',
    };

    this.queue.set(jobId, job);
    this.logger.log(`Enqueued classification job ${jobId} for document ${documentId}`);

    // Emit event
    this.eventEmitter.emit('classification.queued', {
      jobId,
      documentId,
      orgId,
    });

    return jobId;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): ClassificationJob | undefined {
    return this.queue.get(jobId);
  }

  /**
   * Get result for a completed job
   */
  getResult(jobId: string): ClassificationResult | undefined {
    return this.results.get(jobId);
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    requestsThisMinute: number;
    requestsThisHour: number;
  } {
    let pending = 0;
    let completed = 0;
    let failed = 0;

    this.queue.forEach((job) => {
      switch (job.status) {
        case 'pending':
          pending++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
      }
    });

    return {
      pending,
      processing: this.processing.size,
      completed,
      failed,
      requestsThisMinute: this.requestsThisMinute,
      requestsThisHour: this.requestsThisHour,
    };
  }

  /**
   * Cancel a pending job
   */
  cancelJob(jobId: string): boolean {
    const job = this.queue.get(jobId);
    if (!job || job.status !== 'pending') {
      return false;
    }

    this.queue.delete(jobId);
    this.logger.log(`Cancelled classification job ${jobId}`);
    return true;
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    const job = this.queue.get(jobId);
    if (!job || job.status !== 'failed') {
      return false;
    }

    job.status = 'pending';
    job.attempts = 0;
    job.error = undefined;
    this.logger.log(`Retrying classification job ${jobId}`);
    return true;
  }

  /**
   * Clear completed and failed jobs older than specified time
   */
  cleanupOldJobs(olderThanMs: number = 3600000): number {
    const cutoff = Date.now() - olderThanMs;
    let cleaned = 0;

    this.queue.forEach((job, jobId) => {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.createdAt.getTime() < cutoff
      ) {
        this.queue.delete(jobId);
        this.results.delete(jobId);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} old classification jobs`);
    }

    return cleaned;
  }

  // Private methods

  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 500);
  }

  private stopProcessing(): void {
    this.isShuttingDown = true;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.minuteResetTimer) {
      clearInterval(this.minuteResetTimer);
    }
    if (this.hourResetTimer) {
      clearInterval(this.hourResetTimer);
    }
  }

  private startRateLimitResets(): void {
    this.minuteResetTimer = setInterval(() => {
      this.requestsThisMinute = 0;
    }, 60000);

    this.hourResetTimer = setInterval(() => {
      this.requestsThisHour = 0;
    }, 3600000);
  }

  private canProcessMore(): boolean {
    if (this.isShuttingDown) return false;
    if (this.processing.size >= this.config.maxConcurrent) return false;
    if (this.requestsThisMinute >= this.config.rateLimit.maxPerMinute) return false;
    if (this.requestsThisHour >= this.config.rateLimit.maxPerHour) return false;
    return true;
  }

  private async processQueue(): Promise<void> {
    if (!this.canProcessMore()) return;

    // Get pending jobs sorted by priority
    const pendingJobs = Array.from(this.queue.values())
      .filter((job) => job.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    const availableSlots = this.config.maxConcurrent - this.processing.size;
    const jobsToProcess = pendingJobs.slice(0, Math.min(availableSlots, this.config.batchSize));

    for (const job of jobsToProcess) {
      if (!this.canProcessMore()) break;
      this.processJob(job);
    }
  }

  private async processJob(job: ClassificationJob): Promise<void> {
    job.status = 'processing';
    job.attempts++;
    job.lastAttemptAt = new Date();
    this.processing.add(job.id);
    this.requestsThisMinute++;
    this.requestsThisHour++;

    const startTime = Date.now();

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Classification timeout'));
        }, this.config.processingTimeoutMs);
      });

      // Race classification against timeout
      const result = await Promise.race([
        this.classificationService.classifyDocument(
          job.fileBuffer,
          job.mimeType,
          job.fileName,
        ),
        timeoutPromise,
      ]);

      const processingTimeMs = Date.now() - startTime;

      // Store result
      this.results.set(job.id, result);
      job.status = 'completed';

      // Update document with classification result
      await this.updateDocumentWithResult(job.documentId, job.orgId, result);

      // Emit success event
      const event: ClassificationEvent = {
        documentId: job.documentId,
        orgId: job.orgId,
        result,
        processingTimeMs,
      };
      this.eventEmitter.emit('classification.completed', event);

      this.logger.log(
        `Completed classification for document ${job.documentId} in ${processingTimeMs}ms (confidence: ${result.confidence})`,
      );
    } catch (error: any) {
      const processingTimeMs = Date.now() - startTime;
      job.error = error.message || 'Classification failed';

      if (job.attempts < job.maxAttempts) {
        // Schedule retry with exponential backoff
        const delay =
          this.config.retryDelayMs *
          Math.pow(this.config.retryBackoffMultiplier, job.attempts - 1);

        job.status = 'pending';
        this.logger.warn(
          `Classification attempt ${job.attempts}/${job.maxAttempts} failed for document ${job.documentId}. Retrying in ${delay}ms`,
        );

        setTimeout(() => {
          if (job.status === 'pending' && !this.isShuttingDown) {
            // Job will be picked up by the queue processor
          }
        }, delay);
      } else {
        job.status = 'failed';

        // Emit failure event
        const event: ClassificationEvent = {
          documentId: job.documentId,
          orgId: job.orgId,
          error: job.error,
          processingTimeMs,
        };
        this.eventEmitter.emit('classification.failed', event);

        this.logger.error(
          `Classification failed for document ${job.documentId} after ${job.attempts} attempts: ${job.error}`,
        );
      }
    } finally {
      this.processing.delete(job.id);
    }
  }

  private async updateDocumentWithResult(
    documentId: string,
    orgId: string,
    result: ClassificationResult,
  ): Promise<void> {
    try {
      const document = await this.documentsRepository.findById(documentId);
      if (!document || document.orgId !== orgId) return;

      const metadata = (document.metadata as Record<string, any>) || {};

      await this.documentsRepository.update(documentId, {
        type: result.confidence >= 0.8 ? result.type : document.type,
        metadata: {
          ...metadata,
          classification: {
            type: result.type,
            confidence: result.confidence,
            extractedData: result.extractedData,
            autoCategorizationRecommended: result.confidence >= 0.8,
          },
          classifiedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update document ${documentId} with classification result:`,
        error,
      );
    }
  }
}
