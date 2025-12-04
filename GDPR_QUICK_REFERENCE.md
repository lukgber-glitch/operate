# GDPR Module - Quick Reference Guide

## Quick Start

### 1. Run Migration
```bash
cd packages/database
npx prisma migrate dev --name add_gdpr_models
npx prisma generate
```

### 2. Add Module to App
```typescript
// apps/api/src/app.module.ts
import { GdprModule } from './modules/gdpr';

@Module({
  imports: [
    // ... existing modules
    GdprModule,
  ],
})
export class AppModule {}
```

### 3. Initialize Organization Compliance
```bash
POST /gdpr/initialize/:organisationId
Authorization: Bearer <admin-token>
```

## Common Use Cases

### Record User Consent
```typescript
POST /gdpr/consent
{
  "userId": "user-123",
  "purpose": "marketing",
  "granted": true,
  "source": "web_form",
  "version": "1.0"
}
```

### User Requests Data Export
```typescript
POST /gdpr/requests
{
  "userId": "user-123",
  "requestType": "access",
  "organisationId": "org-456"
}
```

### Export User Data
```typescript
POST /gdpr/export
{
  "userId": "user-123",
  "format": "json",
  "includeAuditLogs": true,
  "includeConsents": true
}
```

### Delete User Account
```typescript
DELETE /gdpr/account?type=anonymize
Authorization: Bearer <user-token>
```

### Check Overdue Requests
```typescript
GET /gdpr/requests/overdue?organisationId=org-123
Authorization: Bearer <admin-token>
```

### Get Compliance Dashboard
```typescript
GET /gdpr/dashboard?organisationId=org-123
Authorization: Bearer <admin-token>
```

## Data Subject Rights

| Right | Endpoint | Method |
|-------|----------|--------|
| Access | `/gdpr/export` | POST |
| Rectification | `/gdpr/requests` | POST (manual) |
| Erasure | `/gdpr/anonymize/:userId` | POST |
| Portability | `/gdpr/export` | POST |
| Restriction | `/gdpr/requests` | POST (manual) |
| Object | `/gdpr/consent/:userId/:purpose` | DELETE |

## SLA Tracking

- **Default Deadline**: 30 days from request
- **Extension**: Up to 60 additional days
- **Monitoring**: `/gdpr/requests/overdue`
- **Alerts**: Dashboard shows overdue count

## Retention Periods

| Category | Period | Auto-Delete |
|----------|--------|-------------|
| Financial | 10 years | No |
| Employee | 7 years | No |
| Customer | 3 years | No |
| Logs | 90 days | Yes |
| Marketing | Until revoked | N/A |

## Cron Jobs

- **Retention Cleanup**: Daily at 2 AM
- **Export Cleanup**: 7-day expiration

## Important Files

- **Module**: `apps/api/src/modules/gdpr/gdpr.module.ts`
- **Controller**: `apps/api/src/modules/gdpr/gdpr.controller.ts`
- **Services**: `apps/api/src/modules/gdpr/services/`
- **Schema**: `packages/database/prisma/schema.prisma`
- **Docs**: `apps/api/src/modules/gdpr/README.md`

## Security

- All endpoints require JWT authentication
- Admin endpoints require ADMIN or OWNER role
- Hard delete requires OWNER role only
- All operations logged to audit trail

## Troubleshooting

### "Policy not found"
```bash
# Initialize default policies
POST /gdpr/initialize/:organisationId
```

### "DSR overdue"
```bash
# Extend deadline
PUT /gdpr/requests/:id/extend
{
  "extensionReason": "Complex request requiring additional time"
}
```

### "Export file not found"
- Files expire after 7 days
- Re-run export request

## Development

```bash
# Install dependencies
npm install

# Run tests
npm run test -- gdpr

# Start dev server
npm run start:dev
```

## Support

- Review: `GDPR_QUICK_REFERENCE.md` (this file)
- Full docs: `apps/api/src/modules/gdpr/README.md`
- Completion report: `TASK_W23-T5_GDPR_COMPLETION_REPORT.md`
