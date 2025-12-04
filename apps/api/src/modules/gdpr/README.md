# GDPR Compliance Module

Comprehensive GDPR compliance infrastructure for Operate/CoachOS.

## Overview

This module implements all major GDPR requirements for a compliant SaaS platform:

- **Consent Management** (Article 7)
- **Data Subject Requests** (Articles 15-21)
- **Data Retention Policies** (Article 5 - Storage Limitation)
- **Data Portability** (Article 20)
- **Right to Erasure** (Article 17)
- **Audit Logging** (Article 5 - Accountability)
- **30-day SLA tracking** for all Data Subject Requests
- **Automated retention policy enforcement**

## Architecture

```
gdpr/
├── gdpr.module.ts                    # NestJS module configuration
├── gdpr.service.ts                   # Main orchestration service
├── gdpr.controller.ts                # REST API endpoints
├── services/
│   ├── consent-manager.service.ts    # Consent recording & management
│   ├── data-subject-request.service.ts  # DSR handling & SLA tracking
│   ├── data-retention.service.ts     # Retention policies & cleanup
│   ├── data-portability.service.ts   # Data export (JSON/CSV/XML)
│   ├── anonymization.service.ts      # User anonymization & deletion
│   └── audit-trail.service.ts        # GDPR event logging
├── dto/                              # Data Transfer Objects
│   ├── consent.dto.ts
│   ├── data-subject-request.dto.ts
│   ├── data-export.dto.ts
│   └── retention-policy.dto.ts
└── types/
    └── gdpr.types.ts                 # TypeScript types & enums
```

## Database Schema

### UserConsent
Tracks user consent for different purposes (marketing, analytics, etc.)

```prisma
model UserConsent {
  id        String   @id @default(uuid())
  userId    String
  purpose   String   // marketing, analytics, essential, third_party
  granted   Boolean
  grantedAt DateTime?
  revokedAt DateTime?
  source    String   // web_form, api, migration
  version   String   // Consent policy version
  // ...
}
```

### DataSubjectRequest
Handles GDPR rights requests with 30-day SLA tracking

```prisma
model DataSubjectRequest {
  id         String   @id @default(uuid())
  requestId  String   @unique
  userId     String
  requestType String  // access, erasure, portability, etc.
  status     String   // pending, processing, completed, rejected
  dueDate    DateTime // 30 days from request
  // ...
}
```

### DataRetentionPolicy
Defines retention periods for different data categories

```prisma
model DataRetentionPolicy {
  id              String  @id @default(uuid())
  dataCategory    String  // financial_records, employee_data, etc.
  retentionPeriod Int     // Days
  autoDelete      Boolean @default(false)
  // ...
}
```

### GdprAuditLog
Comprehensive audit trail for all GDPR operations

```prisma
model GdprAuditLog {
  id        String   @id @default(uuid())
  eventType String   // consent_granted, dsr_created, data_deleted, etc.
  userId    String?
  actorId   String?
  details   Json
  // ...
}
```

## API Endpoints

### Consent Management

```
POST   /gdpr/consent                    # Record consent
GET    /gdpr/consent/:userId            # Get user's consents
PUT    /gdpr/consent/:userId/:purpose   # Update consent
DELETE /gdpr/consent/:userId/:purpose   # Revoke consent
GET    /gdpr/consent/stats              # Consent statistics
```

### Data Subject Requests

```
POST   /gdpr/requests                   # Create DSR
GET    /gdpr/requests/:id               # Get DSR by ID
PUT    /gdpr/requests/:id/status        # Update DSR status
PUT    /gdpr/requests/:id/extend        # Extend deadline
GET    /gdpr/requests/pending           # Get pending DSRs
GET    /gdpr/requests/overdue           # Get overdue DSRs (SLA breach)
POST   /gdpr/requests/:id/process       # Process DSR end-to-end
```

### Data Portability

```
POST   /gdpr/export                     # Export user data
GET    /gdpr/export/:fileName           # Download export file
```

### Retention Policies

```
POST   /gdpr/retention-policies         # Create policy
GET    /gdpr/retention-policies         # List policies
PUT    /gdpr/retention-policies/:id     # Update policy
POST   /gdpr/retention-policies/:category/apply  # Apply policy
GET    /gdpr/retention-policies/compliance-status  # Check compliance
```

### Anonymization

```
POST   /gdpr/anonymize/:userId          # Anonymize user (soft delete)
POST   /gdpr/anonymize/:userId/preview  # Preview anonymization
DELETE /gdpr/users/:userId/hard-delete  # Hard delete (permanent)
DELETE /gdpr/account                     # Delete own account
```

### Audit Logs

```
GET    /gdpr/audit-log                  # Search audit logs
GET    /gdpr/audit-log/user/:userId     # Get user's audit logs
GET    /gdpr/audit-log/stats            # Audit statistics
POST   /gdpr/audit-log/export           # Export audit logs
```

### General

```
GET    /gdpr/compliance-status          # Overall compliance status
GET    /gdpr/dashboard                  # GDPR dashboard data
GET    /gdpr/user-overview/:userId      # User's GDPR overview
POST   /gdpr/initialize/:orgId          # Initialize compliance
POST   /gdpr/compliance-report          # Generate compliance report
```

## Usage Examples

### 1. Record User Consent

```typescript
import { ConsentManagerService } from './modules/gdpr';

// Record consent
await consentManager.recordConsent({
  userId: 'user-123',
  purpose: ConsentPurpose.MARKETING,
  granted: true,
  source: ConsentSource.WEB_FORM,
  ipAddress: '192.168.1.1',
  version: 'v1.0',
});
```

### 2. Create Data Subject Request

```typescript
import { DataSubjectRequestService } from './modules/gdpr';

// User requests data export
const dsr = await dsrService.createRequest({
  userId: 'user-123',
  requestType: DataSubjectRequestType.ACCESS,
  organisationId: 'org-456',
});

// Auto-calculated due date: now + 30 days
console.log(dsr.dueDate);
```

### 3. Export User Data

```typescript
import { DataPortabilityService } from './modules/gdpr';

// Export all user data in JSON format
const result = await portabilityService.exportUserData({
  userId: 'user-123',
  format: DataExportFormat.JSON,
  includeAuditLogs: true,
  includeConsents: true,
});

console.log(result.fileUrl); // Download URL
console.log(result.expiresAt); // Expires in 7 days
```

### 4. Anonymize User (Right to be Forgotten)

```typescript
import { AnonymizationService } from './modules/gdpr';

// Soft delete (anonymize)
const result = await anonymizationService.anonymizeUser(
  'user-123',
  'admin-456',
  'User requested account deletion'
);

console.log(result.recordsAnonymized); // Number of records affected
console.log(result.tablesAffected); // Tables modified
```

### 5. Setup Retention Policies

```typescript
import { DataRetentionService } from './modules/gdpr';

// Create retention policy
await retentionService.createPolicy({
  organisationId: 'org-123',
  dataCategory: DataCategory.LOGS,
  retentionPeriod: 90, // 90 days
  legalBasis: LegalBasis.LEGITIMATE_INTERESTS,
  autoDelete: true, // Auto-delete after retention period
});

// Apply policy (dry run)
const result = await retentionService.applyRetentionPolicy(
  DataCategory.LOGS,
  'org-123',
  true // dryRun
);

console.log(result.recordsDeleted); // How many would be deleted
```

## Data Subject Rights

### Article 15: Right to Access
User can request a copy of their personal data.
- **Implementation**: `DataPortabilityService.exportUserData()`
- **Format**: JSON, CSV, XML, PDF
- **SLA**: 30 days

### Article 16: Right to Rectification
User can request correction of inaccurate data.
- **Implementation**: Manual process, tracked via DSR
- **SLA**: 30 days

### Article 17: Right to Erasure (Right to be Forgotten)
User can request deletion of their data.
- **Implementation**: `AnonymizationService.anonymizeUser()`
- **Options**: Soft delete (anonymize) or hard delete
- **SLA**: 30 days

### Article 18: Right to Restriction
User can request limiting processing of their data.
- **Implementation**: Tracked via DSR, manual restriction
- **SLA**: 30 days

### Article 20: Right to Data Portability
User can receive data in machine-readable format.
- **Implementation**: `DataPortabilityService.exportUserData()`
- **Formats**: JSON (default), CSV, XML
- **SLA**: 30 days

### Article 21: Right to Object
User can object to processing of their data.
- **Implementation**: Revoke all consents via `ConsentManagerService`
- **SLA**: 30 days

## Retention Periods

Default retention policies by data category:

| Category | Retention Period | Legal Basis |
|----------|-----------------|-------------|
| Financial Records | 10 years | Legal requirement |
| Employee Data | 7 years | Legal requirement |
| Customer Data | 3 years | Legitimate interest |
| Logs | 90 days | Security/audit |
| Marketing Data | Until revoked | Consent |

## SLA Tracking

Data Subject Requests automatically track the 30-day SLA:

- **Due Date**: Calculated as `requestedAt + 30 days`
- **Extension**: Can be extended by up to 60 additional days (GDPR allows 2 months)
- **Overdue Tracking**: `daysRemaining` and `isOverdue` calculated in real-time
- **Alerts**: `/gdpr/requests/overdue` endpoint for monitoring

## Automated Cleanup

The `DataRetentionService` runs a daily cron job (2 AM) to automatically delete data according to retention policies:

```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async runAutomaticCleanup() {
  // Apply all retention policies with autoDelete=true
}
```

## Audit Logging

All GDPR operations are automatically logged to `GdprAuditLog`:

- Consent granted/revoked
- DSR created/completed
- Data exported/deleted
- Retention policy applied

Example audit log:
```json
{
  "eventType": "data_exported",
  "userId": "user-123",
  "actorId": "admin-456",
  "actorType": "admin",
  "resourceType": "UserDataExport",
  "details": {
    "format": "json",
    "fileSize": 1024000,
    "recordCount": 1523
  },
  "ipAddress": "192.168.1.1",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

## Security Considerations

1. **Access Control**: All admin endpoints protected with `@Roles('ADMIN', 'OWNER')`
2. **Audit Trail**: Comprehensive logging of all GDPR operations
3. **Data Encryption**: Export files should be encrypted (implement in production)
4. **Secure Deletion**: Hard delete uses database transactions for atomicity
5. **IP Logging**: All consent actions log IP address for proof of consent

## Compliance Checklist

- [x] Consent management with granular purposes
- [x] Data subject rights (access, erasure, portability, etc.)
- [x] 30-day SLA tracking for DSRs
- [x] Retention policies with auto-deletion
- [x] Comprehensive audit logging
- [x] Data export in machine-readable formats
- [x] Anonymization and hard deletion
- [x] GDPR event types for accountability
- [x] Multi-organisation support
- [x] Role-based access control

## Future Enhancements

- [ ] Breach notification system (72-hour SLA)
- [ ] Data Protection Impact Assessments (DPIA)
- [ ] Cookie consent banner integration
- [ ] Email notifications for DSR status changes
- [ ] Dashboard UI for compliance monitoring
- [ ] Integration with third-party consent management platforms
- [ ] Automated GDPR compliance reports (monthly/quarterly)
- [ ] Data discovery and classification tools

## Testing

Run GDPR module tests:
```bash
npm run test -- gdpr
```

## License

Internal use only - Operate/CoachOS

## Support

For questions or issues, contact the compliance team or review GDPR documentation at https://gdpr.eu
