# Export Scheduler Module

Manages scheduled recurring exports (DATEV, SAF-T, BMD) with cron-based scheduling.

## Features

- **Scheduled Exports**: Create recurring exports using cron expressions
- **Multiple Export Types**: Support for DATEV, SAF-T, and BMD exports
- **Timezone Support**: Configure schedules with specific timezones
- **Email Notifications**: Optional email notifications on completion/failure
- **Run History**: Track execution history for each scheduled export
- **Manual Execution**: Trigger exports immediately on demand
- **Background Processing**: Uses BullMQ for reliable job processing
- **Automatic Retry**: Failed jobs are automatically retried with exponential backoff

## Installation

Before using this module, install the required dependency:

```bash
cd apps/api
pnpm add cron-parser
```

## API Endpoints

### Create Scheduled Export
```
POST /export-scheduler
```

**Body:**
```json
{
  "orgId": "org-uuid",
  "name": "Monthly DATEV Export",
  "exportType": "DATEV",
  "config": {
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    },
    "companyConfig": {
      "consultantNumber": "12345",
      "clientNumber": "67890",
      "fiscalYearStart": "0101",
      "skrType": "SKR03"
    }
  },
  "schedule": "0 0 1 * *",
  "timezone": "Europe/Berlin",
  "notifyEmail": "exports@company.com"
}
```

### Get All Scheduled Exports
```
GET /export-scheduler?orgId=org-uuid
```

### Get Scheduled Export
```
GET /export-scheduler/:id?orgId=org-uuid
```

### Update Scheduled Export
```
PUT /export-scheduler/:id?orgId=org-uuid
```

### Delete Scheduled Export
```
DELETE /export-scheduler/:id?orgId=org-uuid
```

### Get Run History
```
GET /export-scheduler/:id/runs?orgId=org-uuid&limit=20
```

### Execute Immediately
```
POST /export-scheduler/:id/execute?orgId=org-uuid
```

## Cron Expression Examples

- `0 0 1 * *` - Every 1st of the month at midnight
- `0 0 * * MON` - Every Monday at midnight
- `0 9 * * 1-5` - Weekdays at 9:00 AM
- `0 0 1 1,7 *` - 1st of January and July at midnight
- `0 */4 * * *` - Every 4 hours

## Configuration

The module uses BullMQ with the following default configuration:

- **Attempts**: 3 retries on failure
- **Backoff**: Exponential (1 minute initial delay)
- **Job Retention**: Completed jobs kept for 24 hours
- **Failed Jobs**: Kept indefinitely for debugging

## Usage Example

```typescript
import { ExportSchedulerService, ExportType } from './export-scheduler';

// Create a scheduled export
const scheduledExport = await exportSchedulerService.create({
  orgId: 'org-123',
  name: 'Quarterly SAF-T Export',
  exportType: ExportType.SAFT,
  config: {
    variant: 'DE',
    scope: 'FULL',
    dateRange: {
      startDate: '2024-01-01',
      endDate: '2024-03-31'
    }
  },
  schedule: '0 0 1 1,4,7,10 *', // Quarterly on 1st at midnight
  timezone: 'Europe/Berlin',
  notifyEmail: 'accounting@company.com'
});

// Execute immediately
await exportSchedulerService.executeNow(scheduledExport.id, 'org-123');

// Get run history
const runs = await exportSchedulerService.getRunHistory(scheduledExport.id, 'org-123', 10);
```

## Database Schema

### ScheduledExport
- `id`: UUID primary key
- `orgId`: Organization ID
- `name`: User-friendly name
- `exportType`: DATEV, SAFT, or BMD
- `config`: JSON export configuration
- `schedule`: Cron expression
- `timezone`: Timezone for scheduling
- `isActive`: Enable/disable schedule
- `lastRunAt`: Last execution timestamp
- `nextRunAt`: Next scheduled execution
- `lastStatus`: completed, failed, or null
- `notifyEmail`: Optional notification email

### ScheduledExportRun
- `id`: UUID primary key
- `scheduledExportId`: Foreign key to ScheduledExport
- `status`: pending, processing, completed, or failed
- `exportId`: Reference to actual export (GobdExport, SaftExport, etc.)
- `error`: Error message if failed
- `startedAt`: Execution start time
- `completedAt`: Execution completion time

## Email Notifications

Email notifications are configured in the service but require email service integration. Update the `sendNotification` method in `export-scheduler.service.ts` to integrate with your email provider.

Example notification structure:
```typescript
{
  to: 'user@company.com',
  subject: 'Export completed: Monthly DATEV Export',
  template: 'scheduled-export-notification',
  context: {
    name: 'Monthly DATEV Export',
    status: 'completed',
    exportId: 'export-uuid',
    downloadUrl: 'https://app.example.com/exports/export-uuid/download'
  }
}
```

## Error Handling

The module implements comprehensive error handling:

1. **Validation Errors**: Invalid cron expressions, missing config
2. **Execution Errors**: Export service failures
3. **Job Failures**: Automatic retry with exponential backoff
4. **Notification Failures**: Logged but don't block export

All errors are logged and stored in the `ScheduledExportRun` records.

## Testing

```bash
# Unit tests
pnpm test export-scheduler

# Integration tests
pnpm test:e2e export-scheduler
```

## Security Considerations

- **Authentication**: Endpoints should be protected with JWT guards
- **Authorization**: Use RBAC to restrict access (ADMIN, MANAGER roles)
- **Multi-tenancy**: All queries filtered by orgId
- **Rate Limiting**: Consider rate limits for manual execution

## Integration with Compliance Module

This module integrates with existing export services:

- **DATEV**: `DatevExportService`
- **SAF-T**: `SaftService`
- **BMD**: `BmdExportService`

Each export service is called with the stored configuration when a scheduled export runs.

## Monitoring

Monitor scheduled exports through:

1. **Run History**: Check execution status and errors
2. **Bull Dashboard**: Monitor job queue health
3. **Application Logs**: Detailed execution logs
4. **Email Notifications**: Real-time alerts on failures

## Future Enhancements

- [ ] Support for export delivery to cloud storage (S3, Azure Blob)
- [ ] Support for webhook notifications
- [ ] Advanced scheduling options (skip holidays, business days only)
- [ ] Export aggregation (combine multiple periods)
- [ ] Custom email templates per organization
- [ ] Audit trail for schedule modifications
