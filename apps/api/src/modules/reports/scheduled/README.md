# Scheduled Reports Module

Comprehensive scheduled report generation and delivery system with automated execution, multiple delivery methods, and full audit trail.

## Features

### Core Functionality
- ✅ Flexible scheduling (daily, weekly, monthly, quarterly, yearly, custom cron)
- ✅ Timezone-aware execution
- ✅ Multiple report types (P&L, Cash Flow, Tax Summary, VAT, etc.)
- ✅ Multiple export formats (PDF, Excel, both)
- ✅ Template variable substitution
- ✅ Execution history and audit trail
- ✅ Rate limiting and concurrency control

### Delivery Methods
- ✅ Email delivery with attachments
- ✅ Webhook delivery with JSON payload
- ✅ Dual delivery (email + webhook)
- ✅ Save-only (no delivery)
- ✅ Retry logic with exponential backoff
- ✅ Delivery status tracking

### Management
- ✅ CRUD operations for schedules
- ✅ Pause/resume schedules
- ✅ Manual execution triggers
- ✅ Schedule validation
- ✅ Next run time calculation
- ✅ Missed schedule catch-up

### Background Processing
- ✅ BullMQ job queue
- ✅ Concurrent job processing
- ✅ Automatic retries
- ✅ Dead letter queue
- ✅ Job progress tracking
- ✅ Comprehensive error handling

## Installation

### 1. Install Dependencies

```bash
npm install @nestjs/bull bull
npm install @nestjs/schedule
npm install node-cron
npm install moment-timezone
npm install nodemailer
npm install handlebars
npm install axios
```

### 2. Configure Environment Variables

```bash
# SMTP Configuration (for email delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourcompany.com

# Redis Configuration (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Application Configuration
APP_URL=https://yourapp.com
```

### 3. Import Module

```typescript
import { ScheduledReportModule } from './modules/reports/scheduled';

@Module({
  imports: [
    ScheduledReportModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 4. Database Migration

The module uses the existing `ReportSchedule` model in Prisma. Ensure it's migrated:

```bash
npx prisma migrate dev
```

## Usage

### Create a Scheduled Report

```typescript
POST /reports/scheduled

{
  "orgId": "org_123",
  "name": "Monthly P&L Report",
  "description": "Automated monthly profit & loss statement",
  "schedule": {
    "frequency": "monthly",
    "timeOfDay": "09:00",
    "timezone": "Europe/Berlin",
    "dayOfMonth": 1
  },
  "reportParams": {
    "reportType": "profit_loss",
    "dateRange": {
      "type": "last_month"
    },
    "format": "pdf",
    "includeCharts": true,
    "includeDetails": true,
    "filters": {
      "accountIds": ["acc_1", "acc_2"],
      "categoryIds": ["cat_1"]
    }
  },
  "deliveryConfig": {
    "method": "email",
    "email": {
      "recipients": ["finance@company.com", "cfo@company.com"],
      "cc": ["accounting@company.com"],
      "subject": "Monthly P&L Report - {{period}}",
      "body": "Please find attached your monthly profit & loss report for {{period}}.",
      "replyTo": "accounting@company.com"
    }
  }
}
```

### List Schedules

```typescript
GET /reports/scheduled?orgId=org_123&page=1&pageSize=20
```

### Get Schedule Details

```typescript
GET /reports/scheduled/:id
```

### Update Schedule

```typescript
PUT /reports/scheduled/:id

{
  "name": "Updated Report Name",
  "schedule": {
    "timeOfDay": "10:00"
  }
}
```

### Pause Schedule

```typescript
POST /reports/scheduled/:id/pause
```

### Resume Schedule

```typescript
POST /reports/scheduled/:id/resume
```

### Execute Manually

```typescript
POST /reports/scheduled/:id/execute
```

### Get Execution History

```typescript
GET /reports/scheduled/:id/history?status=completed&page=1&pageSize=20
```

### Delete Schedule

```typescript
DELETE /reports/scheduled/:id
```

## Schedule Configuration

### Frequencies

#### Daily
```json
{
  "frequency": "daily",
  "timeOfDay": "09:00",
  "timezone": "Europe/Berlin"
}
```

#### Weekly
```json
{
  "frequency": "weekly",
  "timeOfDay": "09:00",
  "timezone": "Europe/Berlin",
  "dayOfWeek": 1  // 0=Sunday, 1=Monday, ..., 6=Saturday
}
```

#### Monthly
```json
{
  "frequency": "monthly",
  "timeOfDay": "09:00",
  "timezone": "Europe/Berlin",
  "dayOfMonth": 1  // 1-31 (handles month-end automatically)
}
```

#### Quarterly
```json
{
  "frequency": "quarterly",
  "timeOfDay": "09:00",
  "timezone": "Europe/Berlin",
  "dayOfMonth": 1
}
```

#### Yearly
```json
{
  "frequency": "yearly",
  "timeOfDay": "09:00",
  "timezone": "Europe/Berlin",
  "dayOfMonth": 1
}
```

#### Custom Cron
```json
{
  "frequency": "custom",
  "timezone": "Europe/Berlin",
  "cronExpression": "0 9 1 * *"  // 9 AM on 1st of every month
}
```

## Report Types

- `profit_loss` - Profit & Loss Statement
- `cash_flow` - Cash Flow Report
- `tax_summary` - Tax Summary Report
- `vat_report` - VAT Report
- `revenue` - Revenue Report
- `expenses` - Expenses Report
- `balance_sheet` - Balance Sheet
- `payroll` - Payroll Report
- `custom` - Custom Report

## Date Range Types

- `last_month` - Previous calendar month
- `last_quarter` - Previous calendar quarter
- `last_year` - Previous calendar year
- `month_to_date` - Current month to today
- `quarter_to_date` - Current quarter to today
- `year_to_date` - Current year to today
- `custom` - Custom date range (requires startDate and endDate)

## Export Formats

- `pdf` - PDF document
- `excel` - Excel spreadsheet
- `both` - Both PDF and Excel

## Delivery Methods

### Email

```json
{
  "method": "email",
  "email": {
    "recipients": ["user1@company.com", "user2@company.com"],
    "cc": ["manager@company.com"],
    "bcc": ["archive@company.com"],
    "subject": "{{reportType}} Report - {{period}}",
    "body": "Please find attached your {{reportType}} report.",
    "replyTo": "noreply@company.com"
  }
}
```

#### Template Variables

Available in subject and body:
- `{{reportType}}` - Type of report
- `{{period}}` - Report period
- `{{generatedAt}}` - Generation timestamp
- `{{organizationName}}` - Organization name
- `{{scheduleName}}` - Schedule name

### Webhook

```json
{
  "method": "webhook",
  "webhook": {
    "url": "https://api.company.com/webhooks/reports",
    "method": "POST",
    "headers": {
      "X-API-Key": "secret-key",
      "X-Custom-Header": "value"
    },
    "includeFile": false  // If true, includes base64-encoded file
  }
}
```

#### Webhook Payload

```json
{
  "reportId": "report_123",
  "fileName": "profit_loss_2024-01-01_2024-01-31",
  "fileSizeBytes": 245678,
  "format": "pdf",
  "metadata": {
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "reportType": "profit_loss"
  },
  "timestamp": "2024-02-01T09:00:00Z",
  "downloadUrl": "https://yourapp.com/reports/download/report_123"
}
```

### Both (Email + Webhook)

```json
{
  "method": "both",
  "email": { ... },
  "webhook": { ... }
}
```

### Save Only

```json
{
  "method": "save_only"
}
```

## Retry Configuration

```json
{
  "deliveryConfig": {
    "method": "email",
    "email": { ... },
    "retryConfig": {
      "maxAttempts": 3,
      "backoffMs": 5000  // Initial delay, doubles on each retry
    }
  }
}
```

## Error Handling

### Schedule Validation Errors

- Missing required fields (dayOfWeek for weekly, dayOfMonth for monthly)
- Invalid cron expression
- Invalid timezone
- Invalid email addresses
- Missing delivery configuration

### Execution Errors

- Report generation failure
- Email delivery failure
- Webhook delivery failure
- File size exceeds limit

All errors are logged and stored in:
- `lastError` field on schedule
- Execution history records
- Application logs
- Dead letter queue (for exhausted retries)

## Monitoring

### Queue Metrics

Monitor the `scheduled-reports` queue:

```typescript
GET /admin/queues/scheduled-reports/stats
```

### Execution History

```typescript
GET /reports/scheduled/:id/history
```

Returns:
- Total executions
- Successful executions
- Failed executions
- Success rate
- Last success/failure timestamps
- Detailed execution records

### Health Checks

```typescript
GET /health/scheduled-reports
```

## Performance

### Concurrency

- 5 reports processed in parallel
- Rate limit: 10 jobs per second
- Configurable in module settings

### Job Retention

- Completed jobs: 24 hours (last 100)
- Failed jobs: 7 days (last 50)
- Configurable in module settings

### File Size Limits

- Default: 25 MB per attachment
- Configurable per schedule
- Automatically splits if exceeded (future enhancement)

## Best Practices

### 1. Timezone Awareness

Always specify the correct timezone:

```json
{
  "timezone": "America/New_York"  // Use IANA timezone names
}
```

### 2. Email Recipients

Use distribution lists instead of individual emails:

```json
{
  "recipients": ["finance-team@company.com"]
}
```

### 3. Template Variables

Keep subjects concise but informative:

```json
{
  "subject": "{{reportType}} - {{period}}"
}
```

### 4. Error Monitoring

Set up alerts for:
- Failed schedules (consecutive failures)
- Dead letter queue items
- Email delivery failures

### 5. Testing

Test schedules before activation:

```typescript
// Create schedule as paused
POST /reports/scheduled
{
  ...,
  "startImmediately": false
}

// Test manually
POST /reports/scheduled/:id/execute

// Resume if successful
POST /reports/scheduled/:id/resume
```

## Security

### Email Security

- Use app-specific passwords
- Enable TLS/SSL
- Validate recipient addresses
- Rate limit per organization

### Webhook Security

- Use HTTPS only
- Include authentication headers
- Verify webhook endpoints
- Implement signature verification (future)

### Access Control

- Require authentication for all endpoints
- Implement role-based access control
- Audit schedule modifications
- Log all executions

## Troubleshooting

### Reports Not Generating

1. Check schedule status (active/paused)
2. Verify nextRunAt is in the future
3. Check cron service is running
4. Review queue status
5. Check application logs

### Email Not Sending

1. Verify SMTP configuration
2. Check email credentials
3. Review delivery logs
4. Test SMTP connection
5. Check spam folders

### Webhook Failures

1. Verify webhook URL is accessible
2. Check authentication headers
3. Review webhook endpoint logs
4. Test with manual execution
5. Check network/firewall rules

## Future Enhancements

- [ ] Schedule execution table for complete history
- [ ] Report templates (custom layouts)
- [ ] Dynamic recipient lists (from database)
- [ ] Conditional delivery (only if data exists)
- [ ] File compression for large reports
- [ ] Multi-language support
- [ ] Advanced scheduling (business days only)
- [ ] Schedule dependencies
- [ ] Dashboard for monitoring
- [ ] Webhook signature verification

## API Reference

See Swagger documentation at `/api/docs` for complete API reference.

## Support

For issues or questions:
1. Check application logs
2. Review execution history
3. Contact support team
4. Create issue in project repository
