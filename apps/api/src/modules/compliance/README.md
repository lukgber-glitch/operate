# Compliance Export Module

## Overview

The Compliance Export Module provides a unified API for managing GoBD and SAF-T compliance exports. It orchestrates the generation, validation, scheduling, and download of compliance exports for SME business operations.

## Features

- **Multiple Export Types**: Support for GoBD (Germany) and SAF-T (Austria/EU) exports
- **Background Processing**: Asynchronous export generation with progress tracking
- **Scheduled Exports**: Recurring exports (daily, weekly, monthly, quarterly, yearly)
- **Validation**: Schema validation for generated exports
- **Retention Policy**: Automatic enforcement of data retention requirements
- **Access Control**: Organization-based access control with RBAC
- **Download Management**: Secure download URLs with expiration
- **Notification**: Email and webhook notifications on completion

## Architecture

```
compliance/
├── compliance.module.ts          # Module definition
├── compliance.controller.ts      # REST API endpoints
├── compliance.service.ts         # Business logic & orchestration
├── interfaces/                   # TypeScript interfaces
│   ├── export-config.interface.ts
│   ├── export-status.interface.ts
│   └── scheduled-export.interface.ts
├── dto/                          # Data Transfer Objects
│   ├── create-export.dto.ts
│   ├── export-response.dto.ts
│   ├── export-filter.dto.ts
│   ├── schedule-export.dto.ts
│   └── validation-result.dto.ts
├── entities/                     # Database entities
│   └── compliance-export.entity.ts
├── guards/                       # Access control guards
│   └── export-access.guard.ts
├── exports/                      # Export implementations
│   ├── gobd/
│   │   └── gobd.service.ts       # GoBD export logic (OP-050)
│   └── saft/
│       └── saft.service.ts       # SAF-T export logic (OP-051)
└── __tests__/                    # Unit tests
    ├── compliance.controller.spec.ts
    └── compliance.service.spec.ts
```

## API Endpoints

### Exports

#### Create Export
```http
POST /api/v1/compliance/exports
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "gobd",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "includeDocuments": true,
  "comment": "Q1 2024 tax audit"
}
```

**Response:**
```json
{
  "id": "exp_123456789",
  "organizationId": "org_987654321",
  "type": "gobd",
  "status": "pending",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-03-31"
  },
  "progress": 0,
  "includeDocuments": true,
  "comment": "Q1 2024 tax audit",
  "createdBy": "user_123",
  "createdAt": "2024-04-01T10:00:00Z"
}
```

#### List Exports
```http
GET /api/v1/compliance/exports?type=gobd&status=completed&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Export Details
```http
GET /api/v1/compliance/exports/:id
Authorization: Bearer <token>
```

#### Download Export
```http
GET /api/v1/compliance/exports/:id/download
Authorization: Bearer <token>
```

Returns a ZIP file containing the export.

#### Validate Export
```http
POST /api/v1/compliance/exports/:id/validate
Authorization: Bearer <token>
```

#### Delete Export
```http
DELETE /api/v1/compliance/exports/:id
Authorization: Bearer <token>
```

**Note:** Subject to retention policy (90 days).

### Scheduled Exports

#### Create Schedule
```http
POST /api/v1/compliance/schedules
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "gobd",
  "frequency": "monthly",
  "dayOfMonth": 1,
  "timezone": "Europe/Berlin",
  "enabled": true,
  "includeDocuments": false,
  "notifyEmail": ["accountant@example.com"],
  "webhookUrl": "https://example.com/webhooks/export",
  "maxRetries": 3
}
```

#### List Schedules
```http
GET /api/v1/compliance/schedules
Authorization: Bearer <token>
```

#### Update Schedule
```http
PATCH /api/v1/compliance/schedules/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": false
}
```

#### Delete Schedule
```http
DELETE /api/v1/compliance/schedules/:id
Authorization: Bearer <token>
```

## Export Status Flow

```
PENDING → PROCESSING → COMPLETED
                    ↘ FAILED
                    ↘ CANCELLED
```

- **PENDING**: Export created and queued
- **PROCESSING**: Export generation in progress
- **COMPLETED**: Export ready for download
- **FAILED**: Export generation failed
- **CANCELLED**: Export cancelled by user

## Export Frequencies

- **DAILY**: End of day export
- **WEEKLY**: End of week export (specify day of week 0-6)
- **MONTHLY**: End of month export (specify day of month 1-31)
- **QUARTERLY**: End of quarter export
- **YEARLY**: End of fiscal year export

## Security & Access Control

### Role-Based Access

| Operation | Required Roles |
|-----------|---------------|
| Create Export | ADMIN, ACCOUNTANT |
| List/View Exports | Any authenticated user |
| Download Export | Any authenticated user (own org) |
| Delete Export | ADMIN |
| Validate Export | Any authenticated user (own org) |
| Create Schedule | ADMIN |
| Update/Delete Schedule | ADMIN |

### Organization Isolation

All exports and schedules are scoped to the user's organization. Users cannot access exports from other organizations.

### Retention Policy

Exports cannot be deleted within 90 days of creation to comply with tax audit requirements.

## Background Processing

Exports are processed asynchronously using a job queue:

1. Export request is validated and queued
2. Background worker picks up the job
3. Progress updates are written to the database
4. On completion, the export is uploaded to object storage
5. Notifications are sent (email/webhook)
6. Download URL is generated with 7-day expiration

## Progress Tracking

Exports report progress updates:

```json
{
  "status": "processing",
  "progress": 65,
  "currentStep": "Generating transaction data",
  "totalRecords": 10000,
  "processedRecords": 6500
}
```

## Validation

Exports can be validated against their respective schemas:

- **GoBD**: Validates XML structure and content against GoBD requirements
- **SAF-T**: Validates XML against SAF-T XSD schema

Validation returns:
- List of errors (critical issues)
- List of warnings (recommendations)
- Total records validated
- Records with errors/warnings

## Notifications

### Email Notifications

Scheduled exports can send email notifications on completion:
- Success notification with download link
- Failure notification with error details

### Webhook Notifications

POST request to configured webhook URL:

```json
{
  "event": "export.completed",
  "exportId": "exp_123456789",
  "type": "gobd",
  "status": "completed",
  "organizationId": "org_987654321",
  "timestamp": "2024-04-01T10:05:30Z",
  "downloadUrl": "https://api.example.com/api/v1/compliance/exports/exp_123456789/download"
}
```

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "statusCode": 400,
  "message": "Start date must be before end date",
  "error": "Bad Request"
}
```

**403 Forbidden**
```json
{
  "statusCode": 403,
  "message": "Export cannot be deleted within 90 days of creation (retention policy)",
  "error": "Forbidden"
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Export not found",
  "error": "Not Found"
}
```

## Configuration

### Environment Variables

```env
# Retention period in days
EXPORT_RETENTION_DAYS=90

# Download link expiration in days
EXPORT_DOWNLOAD_EXPIRY_DAYS=7

# Maximum export file size (bytes)
EXPORT_MAX_FILE_SIZE=5368709120  # 5GB

# Object storage configuration
EXPORT_STORAGE_BUCKET=compliance-exports
EXPORT_STORAGE_REGION=eu-central-1

# Notification configuration
EXPORT_NOTIFICATION_FROM_EMAIL=noreply@example.com
```

## Future Enhancements

### Planned for OP-050 (GoBD Implementation)
- Full GoBD XML generation
- Document attachment handling
- GoBD schema validation
- Index file generation

### Planned for OP-051 (SAF-T Implementation)
- Full SAF-T XML generation
- Master data extraction
- General ledger export
- SAF-T XSD validation

### Additional Features
- Export templates for common periods
- Multi-country support
- Audit trail for all operations
- Export comparison and diff tools
- Incremental exports
- Export encryption
- Advanced filtering options
- Export merging for multi-entity organizations

## Testing

### Run Unit Tests
```bash
npm test compliance.service.spec.ts
npm test compliance.controller.spec.ts
```

### Test Coverage
```bash
npm run test:cov -- --testPathPattern=compliance
```

## Dependencies

- **@nestjs/common**: Core NestJS functionality
- **@nestjs/schedule**: Cron job support
- **class-validator**: DTO validation
- **class-transformer**: Object transformation

## Related Tasks

- **OP-050**: GoBD Export Implementation
- **OP-051**: SAF-T Export Implementation
- **OP-052**: Compliance Export API Endpoints (this task)

## Support

For questions or issues, please refer to:
- [Project Documentation](../../../../../../docs)
- [API Documentation](http://localhost:3000/api/docs)
- [Issue Tracker](https://github.com/yourorg/operate/issues)
