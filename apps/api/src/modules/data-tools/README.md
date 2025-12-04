# Data Tools Module

Comprehensive data export, deletion, and anonymization infrastructure for GDPR compliance and user data management.

## Features

### Export Capabilities
- **Multi-Format Support**: JSON, CSV, PDF, ZIP
- **Encryption**: Optional AES-256 encryption for sensitive data
- **Compression**: ZIP compression for large exports
- **Scheduled Exports**: Background job processing with BullMQ
- **Download Tokens**: Secure, expiring download links
- **Data Categories**: Profile, Financial, Tax, HR, Documents, Activity, Settings

### Deletion Capabilities
- **Soft Delete**: Mark records as deleted without removing from database
- **Hard Delete**: Permanent removal from database
- **Scheduled Deletion**: Delete at a future date
- **Cascade Deletion**: Automatically delete related records
- **Deletion Preview**: Preview what will be deleted before executing
- **Verification**: Verify deletion completed successfully
- **Confirmation Tokens**: Require confirmation before deletion

### Anonymization
- **GDPR-Compliant**: Replace PII with anonymized values
- **Statistical Integrity**: Preserve data structure for analytics
- **Selective Anonymization**: Anonymize specific fields
- **Audit Trail**: Full logging of anonymization operations

### Bulk Operations
- **Batch Export**: Export data for multiple users
- **Batch Deletion**: Delete data for multiple users
- **Batch Anonymization**: Anonymize multiple users
- **Export & Delete**: Combined workflow for right to be forgotten

## API Endpoints

### Export Endpoints

#### POST /data-tools/export
Start a data export job.

**Request Body:**
```json
{
  "format": "json",
  "categories": ["profile", "financial"],
  "encrypted": false,
  "compress": true,
  "includeDeleted": false,
  "dateRange": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-12-31T23:59:59.999Z"
  }
}
```

**Response:**
```json
{
  "jobId": "export_abc123",
  "status": "completed",
  "fileUrl": "/api/data-tools/download/export_user_123_20240101.zip",
  "fileSize": 1048576,
  "downloadToken": "tok_xyz789",
  "expiresAt": "2024-01-08T00:00:00.000Z",
  "recordsExported": 1234,
  "categoriesExported": ["profile", "financial"]
}
```

#### GET /data-tools/export/:jobId
Get export job status.

#### GET /data-tools/export/:jobId/download?token=xyz
Download export file (requires valid token).

### Deletion Endpoints

#### POST /data-tools/delete
Start a data deletion job.

**Request Body:**
```json
{
  "mode": "soft",
  "categories": ["profile", "financial"],
  "cascade": true,
  "confirmationRequired": true
}
```

**Response (Confirmation Required):**
```json
{
  "jobId": "del_abc123",
  "status": "pending",
  "recordsDeleted": 0,
  "tablesAffected": [],
  "categories": ["profile", "financial"],
  "confirmationToken": "conf_xyz789"
}
```

**Response (After Confirmation):**
```json
{
  "jobId": "del_abc123",
  "status": "completed",
  "recordsDeleted": 456,
  "tablesAffected": ["User", "Invoice", "Expense"],
  "categories": ["profile", "financial"]
}
```

#### GET /data-tools/delete/:jobId
Get deletion job status.

#### POST /data-tools/preview-deletion/:userId
Preview what would be deleted.

**Query Parameters:**
- `categories`: Comma-separated list (e.g., `profile,financial`)
- `organisationId`: Optional organisation ID

**Response:**
```json
{
  "userId": "user_123",
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
  "totalRecords": 235,
  "totalTables": 3,
  "warnings": [
    "Financial records will be permanently deleted. This action cannot be undone."
  ]
}
```

### Anonymization Endpoints

#### POST /data-tools/anonymize
Anonymize user data.

**Query Parameters:**
- `userId`: User ID to anonymize (admin only)
- `organisationId`: Optional organisation ID

**Response:**
```json
{
  "userId": "user_123",
  "anonymizedAt": "2024-01-01T10:00:00.000Z",
  "recordsAnonymized": 150,
  "tablesAffected": ["User", "Employee", "GdprAuditLog"],
  "fieldsAnonymized": ["email", "firstName", "lastName", "phoneNumber", "ssn"],
  "success": true
}
```

### Statistics Endpoints

#### GET /data-tools/statistics
Get data tools usage statistics.

## Data Categories

- `profile`: User profile information
- `financial`: Invoices, expenses, transactions
- `tax`: Tax returns, VAT records
- `hr`: Employee records, contracts, leave
- `documents`: Documents and attachments
- `activity`: Audit logs, activity history
- `settings`: User settings and preferences
- `all`: All categories

## Export Formats

- `json`: Machine-readable JSON format
- `csv`: Spreadsheet-compatible CSV format
- `pdf`: Human-readable PDF document
- `zip`: ZIP archive containing multiple files

## Deletion Modes

- `soft`: Mark as deleted but keep in database
- `hard`: Permanently remove from database
- `anonymize`: Replace with anonymized data

## Security

### Authentication & Authorization
- All endpoints require authentication (JWT)
- Admin-only endpoints for user/organisation overrides
- Rate limiting on bulk operations (TODO)

### Encryption
- Export files can be encrypted with AES-256
- Encryption key provided in response
- Files auto-expire after 7 days

### Audit Logging
- All operations logged via GDPR Audit Trail
- Includes user, timestamp, IP address, user agent
- Tracks export, deletion, anonymization events

### Deletion Safeguards
- Confirmation tokens for destructive operations
- Deletion preview before execution
- Post-deletion verification
- Warnings for critical data categories

## Background Jobs

### BullMQ Processors

#### DataExportProcessor
- Processes export jobs in background
- Updates job progress
- Logs success/failure
- Handles large exports without blocking

#### DataDeletionProcessor
- Processes deletion jobs in background
- Verifies confirmation tokens
- Handles scheduled deletions
- Validates completion

## Usage Examples

### Export User Data
```typescript
import { DataToolsService } from './modules/data-tools';

// Inject service
constructor(private readonly dataTools: DataToolsService) {}

// Export user data
const result = await this.dataTools.startExport(
  {
    format: ExportFormat.JSON,
    categories: [DataCategory.PROFILE, DataCategory.FINANCIAL],
    encrypted: true,
    compress: true,
  },
  userId,
  ipAddress,
  userAgent,
);
```

### Delete User Data
```typescript
// Preview deletion first
const preview = await this.dataTools.previewDeletion(
  userId,
  [DataCategory.ALL],
  organisationId,
);

// Delete with confirmation
const result = await this.dataTools.startDeletion(
  {
    mode: DeletionMode.HARD,
    categories: [DataCategory.ALL],
    cascade: true,
    confirmationRequired: true,
    confirmationToken: 'conf_xyz789',
  },
  userId,
  ipAddress,
  userAgent,
);
```

### Anonymize User
```typescript
const result = await this.dataTools.anonymizeUser(
  userId,
  organisationId,
  ipAddress,
  userAgent,
);
```

## Integration with GDPR Module

The Data Tools module integrates with the GDPR module for:
- Audit logging via `AuditTrailService`
- GDPR event types
- Compliance tracking
- Right to be forgotten workflows

## Future Enhancements

- [ ] Rate limiting on bulk operations
- [ ] Email notifications for job completion
- [ ] Webhook support for job status updates
- [ ] Advanced export filtering
- [ ] Incremental exports
- [ ] Export templates
- [ ] Custom anonymization rules
- [ ] Data archival before deletion
- [ ] Compliance report generation
- [ ] Integration with cloud storage (S3, Azure Blob)

## Testing

```bash
# Unit tests
npm test data-tools

# Integration tests
npm run test:e2e data-tools

# Coverage
npm run test:cov -- data-tools
```

## Related Modules

- **GDPR Module**: Compliance, audit logging, consent management
- **Database Module**: Prisma ORM, database access
- **Users Module**: User management
- **HR Module**: Employee data
- **Finance Module**: Financial records
