# Data Tools Module - Quick Start Guide

## Installation

The module is already created and ready to use. Add to your main app module:

```typescript
// apps/api/src/app.module.ts
import { DataToolsModule } from './modules/data-tools';

@Module({
  imports: [
    // ... other modules
    DataToolsModule,
  ],
})
export class AppModule {}
```

## Required Dependencies

Add to `package.json`:

```bash
npm install archiver
npm install --save-dev @types/archiver
```

Optional (for PDF support):
```bash
npm install pdfkit
# or
npm install puppeteer
```

## Basic Usage

### 1. Export User Data

```bash
# Export as JSON
curl -X POST http://localhost:3000/api/data-tools/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "json",
    "categories": ["profile", "financial"],
    "compressed": true,
    "encrypted": false
  }'

# Response
{
  "jobId": "export_abc123",
  "status": "completed",
  "fileUrl": "/api/data-tools/download/export_user_123.zip",
  "downloadToken": "tok_xyz789",
  "expiresAt": "2024-01-08T00:00:00Z",
  "recordsExported": 1234
}
```

### 2. Preview Deletion

```bash
# Preview what would be deleted
curl -X POST http://localhost:3000/api/data-tools/preview-deletion/user_123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  ?categories=profile,financial

# Response
{
  "userId": "user_123",
  "totalRecords": 235,
  "totalTables": 3,
  "categories": [
    {
      "category": "profile",
      "recordCount": 1,
      "tables": ["User"],
      "impact": "User account and profile information"
    },
    {
      "category": "financial",
      "recordCount": 234,
      "tables": ["Invoice", "Expense"],
      "impact": "123 invoices and 111 expenses"
    }
  ],
  "warnings": [
    "Financial records will be permanently deleted. This action cannot be undone."
  ]
}
```

### 3. Delete User Data

```bash
# Step 1: Request deletion (with confirmation)
curl -X POST http://localhost:3000/api/data-tools/delete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "hard",
    "categories": ["profile", "financial"],
    "cascade": true,
    "confirmationRequired": true
  }'

# Response (confirmation required)
{
  "jobId": "del_abc123",
  "status": "pending",
  "confirmationToken": "conf_xyz789"
}

# Step 2: Confirm deletion
curl -X POST http://localhost:3000/api/data-tools/delete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "hard",
    "categories": ["profile", "financial"],
    "cascade": true,
    "confirmationToken": "conf_xyz789"
  }'

# Response (deletion executed)
{
  "jobId": "del_abc123",
  "status": "completed",
  "recordsDeleted": 235,
  "tablesAffected": ["User", "Invoice", "Expense"]
}
```

### 4. Anonymize User Data

```bash
curl -X POST http://localhost:3000/api/data-tools/anonymize \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response
{
  "userId": "user_123",
  "anonymizedAt": "2024-01-01T10:00:00Z",
  "recordsAnonymized": 150,
  "tablesAffected": ["User", "Employee", "GdprAuditLog"],
  "fieldsAnonymized": ["email", "firstName", "lastName", "phoneNumber"],
  "success": true
}
```

## Configuration

### Environment Variables

```env
# Export directory (default: ./storage/exports)
EXPORT_DIR=/path/to/exports

# Export expiration (default: 7 days)
EXPORT_EXPIRATION_DAYS=7

# Max batch size for bulk operations (default: 100)
MAX_BULK_BATCH_SIZE=100
```

### Storage Directory

Ensure the export directory exists and is writable:

```bash
mkdir -p storage/exports
chmod 755 storage/exports
```

## Testing

### Manual Testing

```bash
# Run the API server
npm run start:dev

# Test export endpoint
curl -X POST http://localhost:3000/api/data-tools/export \
  -H "Content-Type: application/json" \
  -d '{"format":"json","categories":["profile"]}'

# Check OpenAPI docs
open http://localhost:3000/api/docs
```

### Unit Tests

```bash
# Test all services
npm test data-tools

# Test specific service
npm test data-exporter.service
npm test data-deletion.service
npm test data-anonymizer.service
```

## Common Scenarios

### Right to Be Forgotten (GDPR Article 17)

```typescript
// 1. Export user data first
const exportResult = await dataToolsService.startExport(
  {
    format: ExportFormat.JSON,
    categories: [DataCategory.ALL],
    encrypted: true,
    compress: true,
  },
  userId,
);

// 2. Preview deletion
const preview = await dataToolsService.previewDeletion(
  userId,
  [DataCategory.ALL],
);

// 3. Delete user data
const deletionResult = await dataToolsService.startDeletion(
  {
    mode: DeletionMode.HARD,
    categories: [DataCategory.ALL],
    cascade: true,
    confirmationToken: 'conf_xyz',
  },
  userId,
);
```

### Data Portability (GDPR Article 20)

```typescript
// Export in machine-readable format
const result = await dataToolsService.startExport(
  {
    format: ExportFormat.JSON,
    categories: [DataCategory.ALL],
    compress: true,
  },
  userId,
);

// Download link valid for 7 days
console.log(result.fileUrl);
console.log(result.downloadToken);
```

### Scheduled Data Deletion

```typescript
// Schedule deletion for 30 days from now
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 30);

const result = await dataToolsService.startDeletion(
  {
    mode: DeletionMode.HARD,
    categories: [DataCategory.ALL],
    scheduledFor: futureDate.toISOString(),
  },
  userId,
);
```

## Troubleshooting

### Export file not found
- Check export directory exists and is writable
- Check file hasn't expired (7 day default)
- Check download token is valid

### Deletion fails
- Check cascade relationships
- Check foreign key constraints
- Review deletion preview warnings
- Check confirmation token

### Anonymization incomplete
- Check error messages in result
- Review audit logs
- Verify table permissions

## Integration Points

### With GDPR Module
```typescript
// Audit logging is automatic
import { AuditTrailService } from '../gdpr/services/audit-trail.service';

// All operations logged:
// - GdprEventType.DATA_EXPORTED
// - GdprEventType.DATA_DELETED
// - GdprEventType.DATA_ANONYMIZED
```

### With BullMQ
```typescript
// Background job processing
import { DataExportProcessor } from './jobs/data-export.processor';
import { DataDeletionProcessor } from './jobs/data-deletion.processor';

// Jobs auto-processed in background
// Progress tracking available
```

## Security Checklist

- [ ] Enable JWT authentication guards
- [ ] Configure admin role for user/org overrides
- [ ] Set up rate limiting
- [ ] Enable export file encryption
- [ ] Configure deletion confirmation tokens
- [ ] Review audit logs regularly
- [ ] Set appropriate file permissions
- [ ] Configure automatic export cleanup

## Next Steps

1. Enable authentication guards in controller
2. Add role-based access control
3. Implement rate limiting
4. Set up BullMQ queue management
5. Configure production storage
6. Add email notifications
7. Create automated tests
8. Set up monitoring/alerts

## Support

For issues or questions:
- Check README.md for detailed documentation
- Review IMPLEMENTATION_SUMMARY.md
- Check audit logs for operation history
- Review error messages in service logs
