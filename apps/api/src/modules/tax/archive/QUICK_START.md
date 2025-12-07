# Tax Document Archive - Quick Start Guide

## 1. Database Setup

### Option A: Using Prisma (Recommended)

```bash
cd packages/database
npx prisma migrate dev --name add_tax_document_archive
```

### Option B: Using SQL directly

```bash
psql -d operate -U postgres -f packages/database/prisma/migrations/add_tax_document_archive.sql
```

## 2. Environment Configuration

Add to your `.env` file:

```env
# Tax document storage path (local filesystem)
TAX_STORAGE_PATH=./storage/tax-documents
```

## 3. Basic Usage

### Import the service

```typescript
import { TaxArchiveService } from './modules/tax/archive';

// Inject in constructor
constructor(private readonly taxArchiveService: TaxArchiveService) {}
```

### Archive a VAT return

```typescript
// After successful ELSTER submission
const document = await this.taxArchiveService.archiveVatReturn({
  organisationId: 'org-123',
  type: 'USTVA',
  year: 2025,
  period: 1,
  periodType: 'MONTHLY',
  data: vatReturnData,
  transferTicket: 'ABC123...',
  submittedAt: new Date(),
  submissionId: 'SUB-12345',
});

console.log(`Archived: ${document.id}`);
```

### Archive ELSTER receipt

```typescript
const receipt = await this.taxArchiveService.archiveElsterReceipt(
  'org-123',
  'RECEIPT-ID',
  receiptPdfBuffer,
  '2025-01'
);
```

### Search documents

```typescript
// Get all VAT returns for 2025
const docs = await this.taxArchiveService.searchDocuments('org-123', {
  year: 2025,
  type: 'vat_return',
});

// Full-text search
const results = await this.taxArchiveService.searchDocuments('org-123', {
  search: 'Januar',
});
```

### Get year documents (for tax return prep)

```typescript
const yearDocs = await this.taxArchiveService.getYearDocuments('org-123', 2025);
console.log(`Found ${yearDocs.length} documents for 2025`);
```

### Verify document integrity

```typescript
const isValid = await this.taxArchiveService.verifyIntegrity('doc-123');
console.log(`Document integrity: ${isValid ? 'OK' : 'FAILED'}`);
```

### Get statistics

```typescript
const stats = await this.taxArchiveService.getArchiveStats('org-123');
console.log(`Total documents: ${stats.totalDocuments}`);
console.log(`Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log('By type:', stats.documentsByType);
console.log('By year:', stats.documentsByYear);
```

## 4. REST API Usage

All endpoints require JWT authentication.

### Search documents

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/tax/archive?year=2025&type=vat_return"
```

### Get document

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/tax/archive/doc-123"
```

### Verify integrity

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/tax/archive/doc-123/verify"
```

### Get statistics

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/tax/archive/stats"
```

## 5. Integration with ELSTER

Update your ELSTER submission handler:

```typescript
import { TaxArchiveService } from '../tax/archive';

@Injectable()
export class ElsterService {
  constructor(
    private readonly taxArchiveService: TaxArchiveService,
  ) {}

  async submitVatReturn(vatReturn: any) {
    // Submit to ELSTER
    const result = await this.elsterClient.submit(vatReturn);

    // Archive the submission
    await this.taxArchiveService.archiveVatReturn({
      organisationId: vatReturn.organisationId,
      type: 'USTVA',
      year: vatReturn.year,
      period: vatReturn.period,
      periodType: vatReturn.periodType,
      data: vatReturn.data,
      transferTicket: result.transferTicket,
      submittedAt: new Date(),
      submissionId: result.submissionId,
    });

    // Archive receipt if available
    if (result.receiptPdf) {
      await this.taxArchiveService.archiveElsterReceipt(
        vatReturn.organisationId,
        result.transferTicket,
        result.receiptPdf,
        `${vatReturn.year}-${String(vatReturn.period).padStart(2, '0')}`
      );
    }

    return result;
  }
}
```

## 6. Scheduled Jobs

### Cleanup expired documents

```typescript
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TaxArchiveJobs {
  constructor(private readonly archiveService: TaxArchiveService) {}

  @Cron('0 0 * * 0') // Every Sunday at midnight
  async cleanupExpired() {
    const deleted = await this.archiveService.deleteExpiredDocuments();
    console.log(`Deleted ${deleted} expired documents`);
  }
}
```

### Expiry notifications

```typescript
@Cron('0 9 * * 1') // Every Monday at 9 AM
async notifyExpiring() {
  const expiring = await this.archiveService.getExpiringDocuments('org-123', 90);

  if (expiring.length > 0) {
    // Send notification
    await this.notificationService.send({
      type: 'tax_retention_expiring',
      count: expiring.length,
    });
  }
}
```

## 7. Testing

### Run unit tests

```bash
npm test tax-archive.service.spec.ts
```

### Test API endpoints

```bash
# Start the API server
npm run start:dev

# Test in another terminal
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/tax/archive/stats"
```

## 8. Monitoring

### Check storage usage

```bash
du -sh ./storage/tax-documents
```

### View logs

```bash
# Look for TaxArchiveService logs
tail -f logs/app.log | grep TaxArchiveService
```

## 9. Common Issues

### Issue: Storage directory not writable

**Solution**: Ensure the directory exists and has correct permissions:

```bash
mkdir -p ./storage/tax-documents
chmod 755 ./storage/tax-documents
```

### Issue: Migration fails

**Solution**: Check if TaxDocument table already exists:

```sql
SELECT * FROM "TaxDocument" LIMIT 1;
```

If it exists, skip migration. Otherwise, run manually:

```bash
psql -d operate -f packages/database/prisma/migrations/add_tax_document_archive.sql
```

### Issue: Authentication fails on API endpoints

**Solution**: Ensure JWT token is valid and user has organisationId:

```typescript
// User object must contain organisationId
{
  id: 'user-123',
  email: 'user@example.com',
  organisationId: 'org-123', // Required!
}
```

## 10. Production Checklist

- [ ] Run database migration
- [ ] Set TAX_STORAGE_PATH environment variable
- [ ] Configure backup for storage directory
- [ ] Set up scheduled cleanup job
- [ ] Set up expiry notification job
- [ ] Configure monitoring/alerting
- [ ] Test API endpoints with authentication
- [ ] Verify storage permissions
- [ ] Review security settings
- [ ] Document retention policy

## Support

For issues or questions:
- Check README.md for detailed documentation
- Review IMPLEMENTATION_SUMMARY.md for architecture
- See examples/integration-example.ts for code samples

## Next Steps

1. Complete database setup (step 1)
2. Configure environment (step 2)
3. Integrate with ELSTER module (step 5)
4. Set up scheduled jobs (step 6)
5. Deploy to production

You're ready to go!
