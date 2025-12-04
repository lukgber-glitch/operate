# Recurring Invoice Module

This module handles automatic recurring invoice generation using BullMQ for job processing.

## Features

- **CRUD Operations**: Create, read, update, and delete recurring invoice templates
- **Multiple Frequencies**: Daily, Weekly, Monthly, Quarterly, Yearly
- **Flexible Scheduling**: Custom intervals and specific days
- **Automatic Generation**: Background jobs generate invoices automatically
- **Job Retry**: Failed jobs are retried with exponential backoff
- **Safety Checks**: Hourly cron job catches any missed invoices

## Architecture

### Components

1. **RecurringInvoiceService** - Business logic and data access
2. **RecurringInvoiceController** - REST API endpoints
3. **RecurringInvoiceProcessor** - BullMQ job processor
4. **RecurringInvoiceScheduler** - Cron jobs and queue management

### Queue: `recurring-invoices`

**Jobs:**
- `generate` - Generate a single invoice from template
- `check-due` - Hourly check for due invoices (safety net)

**Configuration:**
- Redis connection from app config
- 3 retry attempts with exponential backoff
- Completed jobs auto-removed
- Failed jobs preserved for debugging

## API Endpoints

### Base Path: `/organisations/:orgId/invoices/recurring`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List recurring invoices | `invoices:read` |
| POST | `/` | Create recurring invoice | `invoices:create` |
| GET | `/:id` | Get recurring invoice | `invoices:read` |
| PATCH | `/:id` | Update recurring invoice | `invoices:update` |
| DELETE | `/:id` | Delete recurring invoice | `invoices:delete` |
| POST | `/:id/activate` | Activate template | `invoices:update` |
| POST | `/:id/deactivate` | Deactivate template | `invoices:update` |
| POST | `/:id/generate-now` | Manual generation | `invoices:create` |

## Usage Examples

### Create a Monthly Recurring Invoice

```typescript
POST /organisations/{orgId}/invoices/recurring

{
  "customerId": "customer-uuid",
  "frequency": "MONTHLY",
  "interval": 1,
  "dayOfMonth": 1,
  "startDate": "2024-01-01",
  "endDate": null,
  "lineItems": [
    {
      "description": "Monthly subscription",
      "quantity": 1,
      "unitPrice": 99.99,
      "unit": "month"
    }
  ],
  "currency": "EUR",
  "taxRate": 19,
  "paymentTermsDays": 14,
  "notes": "Thank you for your business!"
}
```

### Create a Bi-Weekly Recurring Invoice

```typescript
POST /organisations/{orgId}/invoices/recurring

{
  "customerId": "customer-uuid",
  "frequency": "WEEKLY",
  "interval": 2,
  "dayOfWeek": 1,
  "startDate": "2024-01-01",
  "lineItems": [...],
  "taxRate": 19
}
```

### List with Filters

```typescript
GET /organisations/{orgId}/invoices/recurring?isActive=true&frequency=MONTHLY&page=1&pageSize=20
```

## Scheduling Logic

### Next Run Date Calculation

The service calculates the next run date based on:
- **Frequency**: DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
- **Interval**: How often (e.g., every 2 weeks)
- **Day Constraints**:
  - `dayOfMonth` for monthly/quarterly/yearly (1-28)
  - `dayOfWeek` for weekly (0=Sunday, 6=Saturday)

### Automatic Scheduling

1. When a recurring invoice is created/activated, the scheduler queues a job
2. Job executes at `nextRunDate`
3. Invoice is generated and `nextRunDate` is updated
4. New job is automatically scheduled for the next occurrence

### Safety Mechanisms

- **Hourly Cron**: Checks for any missed invoices every hour
- **Daily Cleanup**: Removes old completed jobs at 2 AM
- **End Date Check**: Automatically deactivates expired templates
- **Retry Logic**: Failed jobs retry 3 times with backoff

## Development

### Testing Locally

1. Ensure Redis is running:
   ```bash
   docker run -d -p 6379:6379 redis
   ```

2. Create a recurring invoice via API

3. Monitor queue:
   ```bash
   # Using Bull Board (if configured)
   http://localhost:3001/admin/queues
   ```

### Manual Job Triggering

```typescript
// Trigger immediate generation
POST /organisations/{orgId}/invoices/recurring/{id}/generate-now
```

### Debugging

- Check logs for `RecurringInvoiceProcessor` and `RecurringInvoiceScheduler`
- Inspect failed jobs in Redis
- Review `nextRunDate` and `lastRunDate` fields

## Database Schema

```prisma
model RecurringInvoice {
  id             String @id @default(cuid())
  organisationId String
  customerId     String

  frequency      RecurringFrequency
  interval       Int @default(1)
  dayOfMonth     Int?
  dayOfWeek      Int?

  startDate      DateTime
  endDate        DateTime?
  nextRunDate    DateTime
  lastRunDate    DateTime?

  lineItems      Json
  currency       String @default("EUR")
  taxRate        Decimal
  notes          String?
  paymentTermsDays Int @default(14)

  isActive       Boolean @default(true)
  totalGenerated Int @default(0)

  generatedInvoices Invoice[]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdById    String
}
```

## Configuration

Required environment variables:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional
REDIS_DB=0
```

## Monitoring

Key metrics to monitor:
- Queue depth
- Failed job count
- Average processing time
- Invoices generated per day
- Active vs inactive templates

## Future Enhancements

- [ ] Email notifications when invoice is generated
- [ ] Webhook support for invoice generation events
- [ ] Custom invoice numbering schemes
- [ ] Support for dynamic pricing (price changes over time)
- [ ] Invoice preview before generation
- [ ] Bulk operations (pause all, resume all)
- [ ] Advanced scheduling rules (business days only, skip holidays)
