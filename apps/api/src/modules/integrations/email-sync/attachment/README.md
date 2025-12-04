# Email Attachment Processor

Comprehensive email attachment processing system for the Operate/CoachOS platform. Downloads, stores, classifies, and routes email attachments for data extraction.

## Overview

The Attachment Processor handles the complete lifecycle of email attachments from synced emails (Gmail/Outlook):

1. **Download** - Fetches attachments from email providers
2. **Store** - Saves to local filesystem or S3 with streaming support
3. **Scan** - Virus/malware scanning (placeholder for ClamAV/VirusTotal)
4. **Classify** - AI-based classification (invoice, receipt, statement, etc.)
5. **Extract** - Routes to appropriate extractor for data extraction
6. **Track** - Monitors processing status and manages storage quotas

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Email Sync Service                            │
│  (Triggers attachment processing for synced emails)              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            Attachment Processor Service                          │
│  - Orchestrates processing pipeline                              │
│  - Manages storage quotas                                        │
│  - Queues async jobs                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌──────────────┐  ┌─────────────┐  ┌────────────────┐
│   Storage    │  │ Classifier  │  │    Scanner     │
│   Service    │  │   Service   │  │  (Placeholder) │
│              │  │             │  │                │
│ - Local FS   │  │ - Heuristic │  │ - ClamAV      │
│ - AWS S3     │  │ - AI/ML     │  │ - VirusTotal  │
│ - Streaming  │  │ - Routing   │  │               │
└──────────────┘  └─────────────┘  └────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  BullMQ Processing Queue       │
        │  - Async processing            │
        │  - Retry logic                 │
        │  - Rate limiting               │
        └────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│ Invoice Extractor│          │ Receipt Extractor│
│ (Future)         │          │ (Future)         │
└──────────────────┘          └──────────────────┘
```

## Components

### 1. AttachmentProcessorService

Main orchestration service for attachment processing.

**Responsibilities:**
- Process email attachments (single or bulk)
- Coordinate download → store → scan → classify → extract pipeline
- Manage storage quotas and enforce limits
- Track processing status and handle errors

**Key Methods:**
```typescript
// Process all attachments for an email
processEmailAttachments(dto, userId, orgId): Promise<{ queued, jobIds }>

// Process single attachment (called by queue worker)
processSingleAttachment(attachmentId, jobData): Promise<void>

// Get storage quota usage
getStorageQuota(orgId): Promise<StorageQuotaResponseDto>

// List attachments with filters
listAttachments(orgId, dto): Promise<{ attachments, total }>

// Download attachment content
downloadAttachment(dto, orgId): Promise<{ content?, url? }>
```

### 2. AttachmentStorageService

Manages file storage with support for multiple backends.

**Features:**
- Configurable storage backend (LOCAL/S3)
- Streaming upload/download for large files
- SHA-256 content hashing for deduplication
- Signed URL generation for S3
- Automatic directory creation
- Proper cleanup and error handling

**Configuration:**
```bash
# Storage backend (LOCAL or S3)
ATTACHMENT_STORAGE_BACKEND=LOCAL

# Local storage path
ATTACHMENT_STORAGE_PATH=./storage/attachments

# AWS S3 configuration (required for S3 backend)
AWS_S3_BUCKET=operate-attachments
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

**Key Methods:**
```typescript
// Store attachment
storeAttachment(content, filename, orgId, mimeType): Promise<StorageMetadata>

// Retrieve attachment
retrieveAttachment(storagePath, backend): Promise<Buffer>

// Generate signed URL (S3 only)
generateSignedUrl(storagePath, expiresIn): Promise<string>

// Delete attachment
deleteAttachment(storagePath, backend): Promise<void>
```

### 3. AttachmentClassifierService

AI/ML-based classification of attachment types.

**Classification Types:**
- `INVOICE` - Invoice documents
- `RECEIPT` - Receipt/proof of payment
- `STATEMENT` - Bank/financial statements
- `CONTRACT` - Contracts/agreements
- `QUOTE` - Quotes/estimates
- `DELIVERY_NOTE` - Delivery notes/packing slips
- `PAYMENT_PROOF` - Payment confirmations
- `TAX_DOCUMENT` - Tax-related documents
- `OTHER` - Other financial documents
- `NON_FINANCIAL` - Not a financial document

**Classification Methods:**
- Filename analysis (keyword matching)
- MIME type validation
- Email subject context
- Content-based analysis (future: OCR + AI)

**Key Methods:**
```typescript
// Classify attachment
classifyAttachment(filename, mimeType, emailSubject?): Promise<Classification>

// Batch classify
batchClassify(attachments): Promise<Classification[]>

// Check if should extract
shouldExtract(classifiedType, confidence): boolean

// Get extractor route
getExtractorRoute(classifiedType): string | null
```

### 4. AttachmentProcessorProcessor

BullMQ worker for async attachment processing.

**Job Types:**
- `process-attachment` - Process single attachment
- `bulk-process` - Process multiple attachments
- `retry-failed` - Retry failed attachments
- `cleanup-storage` - Clean up old attachments

**Configuration:**
- Automatic retry with exponential backoff (3 attempts)
- Progress tracking
- Rate limiting (10 jobs/second)
- Job retention (24h completed, 7d failed)

## Database Schema

### EmailAttachment Model

```prisma
model EmailAttachment {
  id              String   @id @default(cuid())
  emailId         String
  orgId           String
  userId          String

  // Provider details
  provider        EmailProvider
  externalId      String

  // File metadata
  filename        String
  originalFilename String
  mimeType        String
  size            Int
  extension       String?

  // Storage
  storageBackend  AttachmentStorageBackend
  storagePath     String
  storageUrl      String?
  s3Bucket        String?
  s3Key           String?

  // Processing status
  status          AttachmentProcessingStatus
  processedAt     DateTime?
  processingError String?
  retryCount      Int

  // Classification
  classifiedType  AttachmentClassificationType?
  classificationConfidence Float?
  classifiedAt    DateTime?

  // Security
  isScanned       Boolean
  scanResult      String?
  scanProvider    String?
  scannedAt       DateTime?

  // Extraction
  extractedDataId String?
  extractionStatus String?
  extractionError String?
  extractedAt     DateTime?

  // Deduplication
  contentHash     String?

  // Timestamps
  createdAt       DateTime
  updatedAt       DateTime
  deletedAt       DateTime?
}
```

### StorageQuota Model

```prisma
model StorageQuota {
  id              String   @id @default(cuid())
  orgId           String   @unique

  // Quota limits
  totalQuota      BigInt   @default(5368709120) // 5GB
  usedSpace       BigInt
  attachmentCount Int

  // Usage by type
  invoiceSpace    BigInt
  receiptSpace    BigInt
  statementSpace  BigInt
  otherSpace      BigInt

  // Cleanup policy
  autoCleanupEnabled Boolean
  retentionDays      Int
  lastCleanupAt      DateTime?

  // Alerts
  alertThreshold     Int
  alertSent          Boolean
  alertSentAt        DateTime?

  // Timestamps
  createdAt       DateTime
  updatedAt       DateTime
}
```

## Usage Examples

### 1. Process Email Attachments

```typescript
// After email sync, trigger attachment processing
const result = await attachmentProcessorService.processEmailAttachments(
  {
    emailId: 'clxxx123',
    forceReprocess: false,
    skipScanning: false,
  },
  userId,
  orgId,
);

console.log(`Queued ${result.queued} attachments for processing`);
console.log(`Job IDs: ${result.jobIds.join(', ')}`);
```

### 2. Download Attachment

```typescript
// Download attachment content
const { content } = await attachmentProcessorService.downloadAttachment(
  { attachmentId: 'clxxx456' },
  orgId,
);

// Or get signed URL (S3 only)
const { url } = await attachmentProcessorService.downloadAttachment(
  {
    attachmentId: 'clxxx456',
    returnUrl: true,
    expiresIn: 3600,
  },
  orgId,
);
```

### 3. Check Storage Quota

```typescript
const quota = await attachmentProcessorService.getStorageQuota(orgId);

console.log(`Used: ${quota.usedSpace} / ${quota.totalQuota} bytes`);
console.log(`Usage: ${quota.usagePercentage}%`);
console.log(`Near limit: ${quota.isNearLimit}`);
```

### 4. List Attachments

```typescript
const { attachments, total } = await attachmentProcessorService.listAttachments(
  orgId,
  {
    status: AttachmentProcessingStatus.COMPLETED,
    classifiedType: AttachmentClassificationType.INVOICE,
    page: 1,
    limit: 20,
  },
);
```

### 5. Retry Failed Attachments

```typescript
const result = await attachmentProcessorService.retryFailedAttachments(
  orgId,
  {
    maxRetries: 3,
  },
);

console.log(`Queued ${result.queued} failed attachments for retry`);
```

## Processing Pipeline

### Stage 1: Download

1. Fetch attachment from email provider (Gmail/Outlook)
2. Stream content to prevent memory issues
3. Validate file size against limits
4. Update status to `DOWNLOADING` → `DOWNLOADED`

### Stage 2: Storage

1. Calculate SHA-256 hash for deduplication
2. Generate unique storage path
3. Store in LOCAL or S3 backend
4. Update storage quota
5. Save storage metadata in database

### Stage 3: Scanning

1. Update status to `SCANNING`
2. Scan for viruses/malware (placeholder)
3. Update scan results
4. Quarantine if infected

### Stage 4: Classification

1. Update status to `CLASSIFYING`
2. Analyze filename and MIME type
3. Use email subject for context
4. Calculate confidence score
5. Update status to `CLASSIFIED`

### Stage 5: Routing

1. Check if should extract (confidence threshold)
2. Get extractor route (invoice/receipt)
3. Queue extraction job
4. Update status to `EXTRACTING`

### Stage 6: Completion

1. Update status to `COMPLETED`
2. Link extracted data ID
3. Update processing timestamp

## Storage Quota Management

### Default Limits

- **Default Quota**: 5GB per organization
- **Alert Threshold**: 80% usage
- **Retention**: 365 days (configurable)

### Quota Enforcement

1. Check quota before processing
2. Reject if over limit
3. Send alerts at threshold
4. Track usage by classification type

### Cleanup Policy

```typescript
// Schedule cleanup job
await attachmentQueue.add('cleanup-storage', {
  orgId,
  retentionDays: 365,
  dryRun: false,
});
```

## Error Handling

### Retry Logic

- **Attempts**: 3 retries with exponential backoff
- **Backoff**: 1s, 2s, 4s
- **Max Retries**: Configurable per organization

### Error Types

1. **Download Errors**
   - Provider API failures
   - Network timeouts
   - Invalid attachment IDs

2. **Storage Errors**
   - Disk full (local)
   - S3 access denied
   - Quota exceeded

3. **Classification Errors**
   - Invalid file format
   - Corrupted content

4. **Extraction Errors**
   - OCR failures
   - AI service unavailable

## Security Considerations

### Virus Scanning

**Current**: Placeholder implementation
**Future**: Integrate with ClamAV or VirusTotal

```typescript
// TODO: Implement virus scanning
private async scanAttachment(attachmentId, content): Promise<void> {
  // Integrate with ClamAV
  // Or use VirusTotal API
  // Quarantine if infected
}
```

### Content Hashing

- SHA-256 hash for deduplication
- Prevents duplicate storage
- Detects content tampering

### Access Control

- Organization-level isolation
- User permissions checked
- Signed URLs for S3 (time-limited)

## Performance Optimization

### Streaming

- Large files streamed (not loaded in memory)
- Chunked uploads to S3
- Efficient buffer management

### Concurrency

- Parallel processing of multiple attachments
- Rate limiting per organization
- Queue-based async processing

### Caching

- S3 signed URLs cached
- Classification results cached
- Storage quota cached (Redis future)

## Monitoring & Logging

### Metrics to Track

- Attachments processed per hour
- Processing time per attachment
- Storage usage per organization
- Classification accuracy
- Error rates by type

### Logs

```typescript
// Success
logger.log(`Successfully processed attachment: ${attachmentId}`);

// Error
logger.error(`Failed to process attachment: ${error.message}`, error.stack);

// Warning
logger.warn(`Storage quota alert: ${usagePercentage}% used`);
```

## Future Enhancements

### Phase 1: Core Improvements

- [ ] Implement virus scanning (ClamAV/VirusTotal)
- [ ] Add OCR for image-based documents
- [ ] Integrate with Claude AI for classification
- [ ] Add content extraction preview

### Phase 2: Advanced Features

- [ ] Duplicate detection across organizations
- [ ] Automatic image enhancement (deskew, contrast)
- [ ] Multi-page PDF splitting
- [ ] Thumbnail generation

### Phase 3: Enterprise Features

- [ ] Azure Blob Storage support
- [ ] Google Cloud Storage support
- [ ] CDN integration
- [ ] Advanced analytics dashboard

## Testing

### Unit Tests

```bash
npm run test apps/api/src/modules/integrations/email-sync/attachment
```

### Integration Tests

```bash
npm run test:e2e apps/api/src/modules/integrations/email-sync/attachment
```

### Manual Testing

1. Sync emails with attachments
2. Trigger attachment processing
3. Verify storage
4. Check classification
5. Validate extraction routing

## Troubleshooting

### Issue: Attachments not processing

**Check:**
1. BullMQ queue is running
2. Redis connection is active
3. Storage backend is accessible
4. Email provider credentials are valid

### Issue: Storage quota exceeded

**Solution:**
1. Increase quota limits
2. Enable auto-cleanup
3. Reduce retention period
4. Delete old attachments

### Issue: Classification confidence low

**Solution:**
1. Improve filename analysis
2. Add more keywords
3. Integrate AI classification
4. Use email body context

## API Reference

See [attachment.dto.ts](./dto/attachment.dto.ts) for complete API reference.

## License

Copyright (c) 2024 Operate/CoachOS. All rights reserved.
