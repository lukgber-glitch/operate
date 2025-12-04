# Tax Deadline Reminders Module

Comprehensive tax deadline tracking and reminder system for Operate/CoachOS.

## Overview

The Tax Deadline Reminders module provides automated tracking and notification for tax filing deadlines across multiple countries and jurisdictions. It supports various tax types (VAT, corporate tax, payroll tax, etc.) and automatically schedules reminders to ensure timely compliance.

## Features

### Multi-Country Support
- **Germany (DE)**: VAT/USt, ELSTER, Payroll Tax
- **Austria (AT)**: VAT/USt, Corporate Tax, FinanzOnline
- **Switzerland (CH)**: VAT (MWST), Corporate Tax
- **United States (US)**: IRS filings, Quarterly estimates, Sales Tax
- **United Kingdom (UK)**: VAT, Making Tax Digital (MTD), PAYE
- Extensible to additional countries

### Tax Types
- Monthly/Quarterly/Annual VAT returns
- Corporate income tax
- Payroll tax filings
- Withholding tax
- Country-specific systems (ELSTER, HMRC MTD, IRS)

### Automated Features
- **Auto-generation**: Automatically creates deadlines based on country rules
- **Smart Calculation**: Adjusts for weekends and public holidays
- **Reminder Scheduling**: 7-day, 3-day, and 1-day advance notices
- **Status Tracking**: PENDING, FILED, OVERDUE, EXTENDED, CANCELLED
- **Multi-channel Notifications**: Email and in-app notifications

### Calendar Integration
- Export to iCal format
- Import into any calendar application
- Automatic reminder alarms

## Architecture

### Database Models

#### TaxDeadlineReminder
Main model for tracking tax deadlines:
- Organization and country associations
- Tax type and period information
- Due date with filing status
- Auto-creation and recurrence flags

#### TaxDeadlineReminderLog
Audit log for sent reminders:
- Reminder type and timing
- Delivery channels (email, notification, SMS)
- Recipient tracking
- Delivery status

#### Enums
- `TaxDeadlineStatus`: PENDING, FILED, OVERDUE, EXTENDED, CANCELLED
- `ReminderType`: SEVEN_DAYS, THREE_DAYS, ONE_DAY, SAME_DAY, OVERDUE
- `DeliveryStatus`: SENT, DELIVERED, FAILED, BOUNCED

### Services

#### TaxDeadlineService
Core business logic:
- CRUD operations for deadlines
- Deadline calculation based on country rules
- Auto-generation for organizations
- iCal export functionality
- Upcoming and overdue deadline queries

### Controllers

#### TaxDeadlineController
REST API endpoints:
- `GET /api/tax/deadlines` - List all deadlines with filtering
- `POST /api/tax/deadlines` - Create manual deadline
- `GET /api/tax/deadlines/:id` - Get specific deadline
- `PUT /api/tax/deadlines/:id` - Update deadline
- `DELETE /api/tax/deadlines/:id` - Delete deadline
- `PUT /api/tax/deadlines/:id/filed` - Mark as filed
- `GET /api/tax/deadlines/upcoming` - Get upcoming (default 30 days)
- `GET /api/tax/deadlines/overdue` - Get overdue deadlines
- `POST /api/tax/deadlines/auto-generate` - Generate for year
- `GET /api/tax/deadlines/export/ical` - Export calendar

### Background Jobs

#### DailyDeadlineCheckProcessor
Runs daily at 8:00 AM UTC:
1. Checks all active organizations
2. Identifies deadlines needing reminders
3. Schedules reminder jobs
4. Updates overdue status

#### DeadlineReminderProcessor
Sends notifications:
1. Loads deadline information
2. Creates personalized messages
3. Sends in-app notifications
4. Sends email reminders
5. Logs delivery status

#### DeadlineCheckScheduler
Cron job scheduler:
- Daily automatic execution at 8:00 AM
- Manual trigger capability
- Job queuing with Bull

## Configuration

### Country-Specific Rules

Tax deadline rules are defined in `constants/deadlines.constants.ts`:

```typescript
{
  taxType: TaxTypeEnum.VAT_MONTHLY,
  country: 'DE',
  periodType: 'MONTHLY',
  daysAfterPeriodEnd: 10,
  specificDayOfMonth: 10,
  allowsExtension: false,
  adjustForWeekends: true,
  adjustForHolidays: true,
  reminderDays: [7, 3, 1],
  description: 'Monthly VAT return',
  filingMethod: ['elster', 'online'],
}
```

### Reminder Schedule

Default reminder schedule (days before due date):
- 7 days: Low priority
- 3 days: Medium priority
- 1 day: High priority
- Same day: High priority
- Overdue: Urgent priority

### Holiday Calendars

Public holidays are defined per country for business day adjustment. Can be extended with comprehensive holiday API integration.

## Usage Examples

### Auto-Generate Deadlines

```bash
POST /api/tax/deadlines/auto-generate?countryCode=DE&year=2024
```

Automatically generates all tax deadlines for Germany in 2024 based on configured rules.

### Mark Deadline as Filed

```bash
PUT /api/tax/deadlines/:id/filed
{
  "filedAt": "2024-02-09T14:30:00Z",
  "confirmationId": "ELSTER-2024-001234",
  "notes": "Filed via ELSTER portal"
}
```

### Get Upcoming Deadlines

```bash
GET /api/tax/deadlines/upcoming?days=30
```

Returns all deadlines due within the next 30 days for the user's organization.

### Export to Calendar

```bash
GET /api/tax/deadlines/export/ical
```

Downloads an iCal file that can be imported into Google Calendar, Outlook, Apple Calendar, etc.

## Integration Points

### Notifications Module
- Creates in-app notifications via `NotificationsService`
- Supports priority levels: low, medium, high, urgent
- Includes action URLs for direct navigation

### Email Service
- Sends email reminders to tax administrators
- Personalized message content
- Tracks delivery status

### RBAC Authorization
Required roles:
- `admin`: Full access
- `tax_admin`: Full access
- `accountant`: Create, read, update, mark filed
- `user`: Read-only access to own organization

## Performance Considerations

### Database Indexes
- `organizationId` for organization queries
- `countryId` for country-specific lookups
- `dueDate` for date range queries
- `status` for status filtering
- `taxType` for type-specific queries

### Job Queue Configuration
- Deadline check: Daily at 8 AM with 3 retry attempts
- Reminder delivery: Exponential backoff (5min, 10min, 20min)
- Job history: Last 100 completed, 50 failed retained

### Caching
- Holiday calendars cached in memory
- Tax rules cached as constants
- Organization queries batched

## Testing

### Unit Tests
Test coverage for:
- Deadline calculation logic
- Business day adjustment
- Reminder scheduling
- Status transitions

### Integration Tests
- End-to-end deadline creation
- Reminder job processing
- Notification delivery
- Calendar export

### Manual Testing
```bash
# Trigger manual deadline check
POST /api/admin/tax/deadlines/check

# View job queue status
GET /api/admin/jobs/deadline-check
GET /api/admin/jobs/deadline-reminder
```

## Monitoring

### Logs
- Daily check execution results
- Reminder delivery tracking
- Error conditions and retries
- Performance metrics

### Metrics
- Organizations checked per day
- Deadlines created/updated
- Reminders sent (by type)
- Overdue count trends

## Future Enhancements

### Planned Features
1. SMS notification support
2. Webhook notifications
3. Integration with external tax systems
4. AI-powered deadline prediction
5. Multi-language support
6. Custom reminder schedules
7. Deadline templates
8. Bulk operations API

### Additional Countries
- France (FR)
- Netherlands (NL)
- Italy (IT)
- Spain (ES)
- Canada (CA)
- Australia (AU)

## Code Statistics

- **Total Lines**: 2,327 (TypeScript + Prisma)
- **Files Created**: 13
- **Prisma Models**: 2 (TaxDeadlineReminder, TaxDeadlineReminderLog)
- **Enums**: 3 (TaxDeadlineStatus, ReminderType, DeliveryStatus)
- **Services**: 1
- **Controllers**: 1
- **Job Processors**: 2
- **DTOs**: 5
- **Constants**: 1

### File Breakdown
```
constants/deadlines.constants.ts    470 lines
service/tax-deadline.service.ts     512 lines
controller/tax-deadline.controller  184 lines
jobs/daily-check.processor.ts       277 lines
jobs/reminder.processor.ts          400 lines
jobs/scheduler.ts                    87 lines
dto/*.dto.ts                        234 lines
module.ts                            68 lines
prisma/schema additions              95 lines
```

## Dependencies

### Required Modules
- `@nestjs/bull` - Job queue management
- `@nestjs/schedule` - Cron job scheduling
- `DatabaseModule` - Prisma database access
- `NotificationsModule` - In-app notifications
- `RbacModule` - Role-based authorization

### External Services
- Redis (via Bull for job queues)
- PostgreSQL (via Prisma for data storage)
- Email service (for email reminders)

## License

Part of Operate/CoachOS platform. Proprietary software.

## Support

For questions or issues, contact the FORGE team (Backend Development).
