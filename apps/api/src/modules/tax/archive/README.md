# Tax Document Archive

Document archiving service for tax-related documents with proper retention policies compliant with German tax law.

## Overview

The Tax Archive module provides secure, long-term storage for tax documents with automatic retention management according to German tax regulations (§147 AO - 10 years).

## Features

- **Automatic Retention**: 10-year retention period calculated from end of tax year
- **Document Integrity**: SHA-256 hash verification for all documents
- **Multiple Document Types**: VAT returns, ELSTER receipts, annual returns, tax assessments, supporting documents
- **Search Capabilities**: Filter by year, type, full-text search
- **Retention Tracking**: Monitor documents approaching retention expiry
- **Audit Trail**: Complete history of archived documents

## Document Types

| Type | Description | Example |
|------|-------------|---------|
| `vat_return` | VAT return submission (UStVA) | Monthly/quarterly VAT filings |
| `elster_receipt` | Official ELSTER receipt PDF | Submission confirmation |
| `annual_return` | Annual tax return | Yearly tax filing |
| `tax_assessment` | Tax assessment notice | Steuerbescheid from tax office |
| `supporting_doc` | Supporting documents | Invoices, receipts, etc. |

## German Tax Retention Requirements

According to §147 AO (Abgabenordnung):

- **Buchungsbelege**: 10 years
- **Handelsbücher**: 10 years
- **Jahresabschlüsse**: 10 years
- **Steuererklärungen**: 10 years
- **Geschäftsbriefe**: 6 years

The retention period starts at the end of the calendar year in which the document was created.

## Usage

### Archiving a VAT Return

```typescript
import { TaxArchiveService } from './tax/archive';

// Archive after ELSTER submission
const document = await taxArchiveService.archiveVatReturn({
  organisationId: org.id,
  type: 'USTVA',
  year: 2025,
  period: 1,
  periodType: 'MONTHLY',
  data: vatReturnData,
  transferTicket: 'ABC123...',
  submittedAt: new Date(),
  submissionId: 'SUB-12345',
});
```

### Archiving ELSTER Receipt

```typescript
// Archive the PDF receipt
const receipt = await taxArchiveService.archiveElsterReceipt(
  organisationId,
  receiptId,
  receiptPdfBuffer,
  '2025-01'
);
```

### Searching Documents

```typescript
// Search by year and type
const documents = await taxArchiveService.searchDocuments(orgId, {
  year: 2025,
  type: 'vat_return',
  search: 'Januar',
});
```

### Getting Year Documents

```typescript
// Get all documents for a tax year
const yearDocs = await taxArchiveService.getYearDocuments(orgId, 2025);
```

### Verifying Integrity

```typescript
// Verify document hasn't been tampered with
const isValid = await taxArchiveService.verifyIntegrity(documentId);
```

### Checking Expiring Documents

```typescript
// Get documents expiring in next 90 days
const expiring = await taxArchiveService.getExpiringDocuments(orgId, 90);
```

## REST API Endpoints

All endpoints require JWT authentication and automatically filter by user's organisation.

### Search Documents

```http
GET /tax/archive?year=2025&type=vat_return&search=Januar
```

### Get Specific Document

```http
GET /tax/archive/:id
```

### Verify Integrity

```http
GET /tax/archive/:id/verify
```

Returns:
```json
{
  "valid": true,
  "documentId": "doc_123",
  "checkedAt": "2025-12-07T10:30:00Z"
}
```

### Get Year Documents

```http
GET /tax/archive/year/2025
```

### Get Archive Statistics

```http
GET /tax/archive/stats
```

Returns:
```json
{
  "totalDocuments": 48,
  "totalSize": 15728640,
  "totalSizeMB": 15.0,
  "documentsByType": {
    "vat_return": 12,
    "elster_receipt": 12,
    "supporting_doc": 24
  },
  "documentsByYear": {
    "2024": 24,
    "2025": 24
  },
  "oldestDocument": "2024-01-15T10:00:00Z",
  "newestDocument": "2025-12-07T10:30:00Z"
}
```

### Get Expiring Documents

```http
GET /tax/archive/expiring?days=90
```

### Get Documents by Type

```http
GET /tax/archive/type/vat_return
```

## Storage

The archive currently uses a local filesystem storage service. For production deployments, implement the `IStorageService` interface for cloud storage (S3, Azure Blob, etc.).

### Storage Interface

```typescript
interface IStorageService {
  upload(path: string, data: Buffer | string, mimeType: string): Promise<string>;
  download(url: string): Promise<Buffer>;
  delete(url: string): Promise<void>;
  exists(url: string): Promise<boolean>;
}
```

### Configuration

Set the storage path via environment variable:

```env
TAX_STORAGE_PATH=./storage/tax-documents
```

## Database Schema

```prisma
model TaxDocument {
  id             String   @id @default(cuid())
  organisationId String

  type   String   // Document type
  year   Int      // Tax year
  period String?  // Period (Q1 2025, 2025-01, etc.)

  title       String
  description String?

  fileUrl  String  // Storage path/URL
  fileSize Int     // Size in bytes
  mimeType String  // MIME type
  hash     String  // SHA-256 hash

  retentionUntil DateTime // 10 years from end of tax year
  metadata       Json?    // Flexible metadata

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organisationId, year])
  @@index([organisationId, type])
  @@index([type])
  @@index([year])
  @@index([retentionUntil])
}
```

## Integration with ELSTER Module

The archive service should be called automatically after successful VAT return submissions:

```typescript
// In ELSTER submission handler
const filing = await elsterService.submitVatReturn(vatReturn);

// Archive the filing
await taxArchiveService.archiveVatReturn({
  organisationId: filing.organisationId,
  type: filing.type,
  year: filing.year,
  period: filing.period,
  periodType: filing.periodType,
  data: filing.data,
  transferTicket: filing.transferTicket,
  submittedAt: filing.submittedAt,
  submissionId: filing.submissionId,
});

// Archive receipt if available
if (receiptPdf) {
  await taxArchiveService.archiveElsterReceipt(
    filing.organisationId,
    filing.transferTicket,
    receiptPdf,
    `${filing.year}-${filing.period.toString().padStart(2, '0')}`
  );
}
```

## Retention Management

### Automatic Cleanup Job

Create a scheduled job to delete expired documents:

```typescript
@Cron('0 0 * * 0') // Weekly on Sunday
async cleanupExpiredDocuments() {
  const deleted = await taxArchiveService.deleteExpiredDocuments();
  this.logger.log(`Deleted ${deleted} expired tax documents`);
}
```

### Warning Notifications

Notify users of documents approaching retention expiry:

```typescript
const expiring = await taxArchiveService.getExpiringDocuments(orgId, 90);

if (expiring.length > 0) {
  await notificationService.send({
    type: 'tax_retention_expiring',
    count: expiring.length,
    documents: expiring,
  });
}
```

## Security Considerations

1. **Access Control**: All endpoints check organisation ownership
2. **Integrity Verification**: SHA-256 hashes prevent tampering
3. **Retention Enforcement**: Documents can only be deleted after retention period
4. **Audit Trail**: All operations logged with timestamps
5. **Encryption**: Consider encrypting sensitive documents at rest

## Future Enhancements

- [ ] S3/Azure Blob storage implementation
- [ ] Document encryption at rest
- [ ] Digital signatures for legal validity
- [ ] Automatic backup to secondary storage
- [ ] Compliance audit reports
- [ ] Document version history
- [ ] Automated retention policy management
- [ ] Integration with tax office APIs for automatic retrieval

## Testing

```bash
# Unit tests
npm test tax-archive.service.spec.ts

# Integration tests
npm test tax-archive.integration.spec.ts

# E2E tests
npm run test:e2e -- --grep "Tax Archive"
```

## References

- [§147 AO - Aufbewahrungsfristen](https://www.gesetze-im-internet.de/ao_1977/__147.html)
- [GoBD - Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern](https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Weitere_Steuerthemen/Abgabenordnung/2019-11-28-GoBD.html)
- [ELSTER Documentation](https://www.elster.de/)
