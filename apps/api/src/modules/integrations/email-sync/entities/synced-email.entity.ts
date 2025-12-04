import { EmailProvider } from '@prisma/client';

/**
 * Synced Email Entity
 * Represents an email that has been synced from Gmail or Outlook
 */
export class SyncedEmailEntity {
  id: string;
  connectionId: string;
  orgId: string;
  userId: string;

  // Provider and external ID
  provider: EmailProvider;
  externalId: string;
  threadId?: string;

  // Email metadata
  subject?: string;
  from?: string;
  fromName?: string;
  to: string[];
  cc: string[];
  bcc: string[];

  // Timestamps
  sentAt?: Date;
  receivedAt: Date;
  internalDate?: Date;

  // Content
  snippet?: string;
  bodyPreview?: string;
  hasHtmlBody: boolean;
  hasTextBody: boolean;

  // Attachments
  hasAttachments: boolean;
  attachmentCount: number;
  attachmentNames: string[];
  attachmentSizes: number[];
  attachmentMimeTypes: string[];

  // Classification
  isInvoice: boolean;
  isReceipt: boolean;
  isFinancial: boolean;
  confidence?: number;

  // Processing status
  processed: boolean;
  processedAt?: Date;
  processingError?: string;
  retryCount: number;

  // Flags
  isRead: boolean;
  isImportant: boolean;
  isDraft: boolean;

  // Labels/Categories
  labels: string[];
  categories: string[];
  folderPath?: string;

  // Sync metadata
  syncJobId?: string;
  lastSyncedAt: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<SyncedEmailEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if email likely contains financial documents based on keywords
   */
  containsFinancialKeywords(): boolean {
    const financialKeywords = [
      'invoice',
      'receipt',
      'bill',
      'payment',
      'statement',
      'quote',
      'estimate',
      'order',
      'purchase',
      'refund',
    ];

    const subject = (this.subject || '').toLowerCase();
    const snippet = (this.snippet || '').toLowerCase();

    return financialKeywords.some(
      (keyword) => subject.includes(keyword) || snippet.includes(keyword),
    );
  }

  /**
   * Check if email has PDF or image attachments (common for invoices)
   */
  hasFinancialAttachmentTypes(): boolean {
    const financialMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      'application/vnd.ms-excel', // XLS
    ];

    return this.attachmentMimeTypes.some((mimeType) =>
      financialMimeTypes.includes(mimeType),
    );
  }

  /**
   * Calculate confidence score for financial document classification
   */
  calculateFinancialConfidence(): number {
    let score = 0;

    // Has attachments (+30%)
    if (this.hasAttachments) {
      score += 0.3;
    }

    // Has financial attachment types (+25%)
    if (this.hasFinancialAttachmentTypes()) {
      score += 0.25;
    }

    // Contains financial keywords (+30%)
    if (this.containsFinancialKeywords()) {
      score += 0.3;
    }

    // From common invoice sender domains (+15%)
    if (this.from) {
      const commonInvoiceDomains = [
        'quickbooks',
        'xero',
        'stripe',
        'paypal',
        'square',
        'invoice',
        'billing',
      ];
      const fromLower = this.from.toLowerCase();
      if (commonInvoiceDomains.some((domain) => fromLower.includes(domain))) {
        score += 0.15;
      }
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Check if email should be processed for financial documents
   */
  shouldProcess(): boolean {
    // Must have attachments
    if (!this.hasAttachments) {
      return false;
    }

    // Already processed successfully
    if (this.processed && !this.processingError) {
      return false;
    }

    // Too many retries
    if (this.retryCount >= 3) {
      return false;
    }

    // Must be classified as financial or contain financial keywords
    return (
      this.isFinancial ||
      this.isInvoice ||
      this.isReceipt ||
      this.containsFinancialKeywords()
    );
  }

  /**
   * Get display name for email sender
   */
  getDisplayFrom(): string {
    if (this.fromName) {
      return `${this.fromName} <${this.from}>`;
    }
    return this.from || 'Unknown Sender';
  }

  /**
   * Get short preview text
   */
  getPreview(maxLength: number = 100): string {
    const text = this.snippet || this.bodyPreview || '';
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Convert to plain object for API responses
   */
  toJSON() {
    return {
      id: this.id,
      externalId: this.externalId,
      provider: this.provider,
      subject: this.subject,
      from: this.from,
      fromName: this.fromName,
      to: this.to,
      cc: this.cc,
      receivedAt: this.receivedAt,
      snippet: this.snippet,
      hasAttachments: this.hasAttachments,
      attachmentCount: this.attachmentCount,
      attachmentNames: this.attachmentNames,
      isInvoice: this.isInvoice,
      isReceipt: this.isReceipt,
      isFinancial: this.isFinancial,
      confidence: this.confidence,
      processed: this.processed,
      processedAt: this.processedAt,
      labels: this.labels,
      categories: this.categories,
      lastSyncedAt: this.lastSyncedAt,
      createdAt: this.createdAt,
    };
  }
}

/**
 * Email Sync Job Entity
 * Represents a sync operation job
 */
export class EmailSyncJobEntity {
  id: string;
  connectionId: string;
  orgId: string;
  userId: string;

  provider: EmailProvider;
  syncType: string;
  status: string;

  startedAt?: Date;
  completedAt?: Date;

  totalEmails: number;
  processedEmails: number;
  newEmails: number;
  updatedEmails: number;
  failedEmails: number;

  syncFromDate?: Date;
  syncToDate?: Date;
  lastMessageId?: string;
  nextPageToken?: string;

  searchQuery?: string;
  labelIds: string[];
  folderIds: string[];

  error?: string;
  errorCount: number;
  retryCount: number;
  maxRetries: number;

  apiCallsMade: number;
  rateLimitHit: boolean;
  rateLimitResetAt?: Date;

  durationMs?: number;
  avgEmailProcessingMs?: number;

  metadata?: any;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<EmailSyncJobEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Calculate progress percentage
   */
  getProgress(): number {
    if (this.totalEmails === 0) {
      return 0;
    }
    return Math.round((this.processedEmails / this.totalEmails) * 100);
  }

  /**
   * Check if job is in a terminal state
   */
  isTerminal(): boolean {
    return ['COMPLETED', 'FAILED', 'CANCELLED'].includes(this.status);
  }

  /**
   * Check if job is still running
   */
  isRunning(): boolean {
    return this.status === 'RUNNING';
  }

  /**
   * Check if job can be retried
   */
  canRetry(): boolean {
    return this.status === 'FAILED' && this.retryCount < this.maxRetries;
  }

  /**
   * Calculate estimated time remaining (in milliseconds)
   */
  getEstimatedTimeRemaining(): number | null {
    if (
      !this.avgEmailProcessingMs ||
      this.totalEmails === 0 ||
      this.processedEmails === 0
    ) {
      return null;
    }

    const remainingEmails = this.totalEmails - this.processedEmails;
    return Math.round(remainingEmails * this.avgEmailProcessingMs);
  }

  /**
   * Convert to plain object for API responses
   */
  toJSON() {
    return {
      jobId: this.id,
      connectionId: this.connectionId,
      provider: this.provider,
      syncType: this.syncType,
      status: this.status,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      totalEmails: this.totalEmails,
      processedEmails: this.processedEmails,
      newEmails: this.newEmails,
      updatedEmails: this.updatedEmails,
      failedEmails: this.failedEmails,
      error: this.error,
      durationMs: this.durationMs,
      progress: this.getProgress(),
      estimatedTimeRemaining: this.getEstimatedTimeRemaining(),
      createdAt: this.createdAt,
    };
  }
}
