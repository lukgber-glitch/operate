# Scheduled Reports - Quick Start Guide

Get started with automated report generation in 5 minutes.

## Prerequisites

- ✅ NestJS application running
- ✅ Redis instance available
- ✅ SMTP server configured (for email delivery)
- ✅ Database migrated

## Step 1: Configuration

Add to `.env`:

```bash
# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourcompany.com

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Step 2: Import Module

```typescript
// app.module.ts
import { ScheduledReportModule } from './modules/reports/scheduled';

@Module({
  imports: [
    ScheduledReportModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## Step 3: Create Your First Schedule

### Example 1: Monthly P&L via Email

```bash
curl -X POST http://localhost:3000/reports/scheduled \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org_123",
    "name": "Monthly P&L Report",
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
      "format": "pdf"
    },
    "deliveryConfig": {
      "method": "email",
      "email": {
        "recipients": ["finance@company.com"],
        "subject": "Monthly P&L Report - {{period}}",
        "body": "Please find attached your monthly P&L report."
      }
    }
  }'
```

### Example 2: Weekly Cash Flow via Webhook

```bash
curl -X POST http://localhost:3000/reports/scheduled \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org_123",
    "name": "Weekly Cash Flow",
    "schedule": {
      "frequency": "weekly",
      "timeOfDay": "08:00",
      "timezone": "America/New_York",
      "dayOfWeek": 1
    },
    "reportParams": {
      "reportType": "cash_flow",
      "dateRange": {
        "type": "last_week"
      },
      "format": "excel"
    },
    "deliveryConfig": {
      "method": "webhook",
      "webhook": {
        "url": "https://api.yourapp.com/webhooks/reports",
        "headers": {
          "X-API-Key": "your-api-key"
        }
      }
    }
  }'
```

### Example 3: Daily Revenue (Both Email & Webhook)

```bash
curl -X POST http://localhost:3000/reports/scheduled \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org_123",
    "name": "Daily Revenue Report",
    "schedule": {
      "frequency": "daily",
      "timeOfDay": "18:00",
      "timezone": "UTC"
    },
    "reportParams": {
      "reportType": "revenue",
      "dateRange": {
        "type": "yesterday"
      },
      "format": "both"
    },
    "deliveryConfig": {
      "method": "both",
      "email": {
        "recipients": ["sales@company.com"],
        "subject": "Daily Revenue - {{period}}"
      },
      "webhook": {
        "url": "https://api.yourapp.com/webhooks/revenue"
      }
    }
  }'
```

## Step 4: Test Your Schedule

### Manual Execution

```bash
curl -X POST http://localhost:3000/reports/scheduled/{scheduleId}/execute
```

### Check Status

```bash
curl http://localhost:3000/reports/scheduled/{scheduleId}
```

## Step 5: Monitor

### List All Schedules

```bash
curl "http://localhost:3000/reports/scheduled?orgId=org_123"
```

### View Execution History

```bash
curl "http://localhost:3000/reports/scheduled/{scheduleId}/history"
```

## Common Patterns

### Pattern 1: End of Month Reports

```json
{
  "schedule": {
    "frequency": "monthly",
    "timeOfDay": "09:00",
    "timezone": "Europe/Berlin",
    "dayOfMonth": 31  // Automatically adjusts for months with fewer days
  },
  "reportParams": {
    "dateRange": {
      "type": "last_month"
    }
  }
}
```

### Pattern 2: Quarterly Tax Reports

```json
{
  "schedule": {
    "frequency": "quarterly",
    "timeOfDay": "10:00",
    "timezone": "Europe/Berlin",
    "dayOfMonth": 15  // 15 days after quarter end
  },
  "reportParams": {
    "reportType": "tax_summary",
    "dateRange": {
      "type": "last_quarter"
    }
  }
}
```

### Pattern 3: Business Hours Only

```json
{
  "schedule": {
    "frequency": "custom",
    "timezone": "America/New_York",
    "cronExpression": "0 9 * * 1-5"  // 9 AM, Monday-Friday
  }
}
```

### Pattern 4: Multiple Recipients with Template

```json
{
  "deliveryConfig": {
    "method": "email",
    "email": {
      "recipients": [
        "finance@company.com",
        "cfo@company.com"
      ],
      "cc": ["accounting@company.com"],
      "subject": "{{reportType}} Report - {{period}}",
      "body": "Hi team,\n\nYour {{reportType}} report for {{period}} is attached.\n\nGenerated: {{generatedAt}}\n\nBest regards,\nAutomated Reports"
    }
  }
}
```

## Management Operations

### Pause Schedule

```bash
curl -X POST http://localhost:3000/reports/scheduled/{scheduleId}/pause
```

### Resume Schedule

```bash
curl -X POST http://localhost:3000/reports/scheduled/{scheduleId}/resume
```

### Update Schedule Time

```bash
curl -X PUT http://localhost:3000/reports/scheduled/{scheduleId} \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": {
      "timeOfDay": "10:00"
    }
  }'
```

### Delete Schedule

```bash
curl -X DELETE http://localhost:3000/reports/scheduled/{scheduleId}
```

## Troubleshooting

### Schedule Not Running?

1. **Check if active:**
   ```bash
   curl http://localhost:3000/reports/scheduled/{scheduleId}
   # Look for: "status": "active"
   ```

2. **Check next run time:**
   ```bash
   # nextRunAt should be in the future
   ```

3. **Check logs:**
   ```bash
   tail -f logs/application.log | grep "ScheduledReportService"
   ```

### Email Not Sending?

1. **Test SMTP connection:**
   ```bash
   curl -X POST http://localhost:3000/reports/scheduled/{scheduleId}/execute
   # Check logs for SMTP errors
   ```

2. **Verify SMTP credentials:**
   ```bash
   # Check .env file
   echo $SMTP_USER
   echo $SMTP_HOST
   ```

3. **Check spam folder**

### Webhook Failing?

1. **Test webhook URL manually:**
   ```bash
   curl -X POST https://your-webhook-url \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

2. **Check webhook logs:**
   ```bash
   # Review execution history
   curl http://localhost:3000/reports/scheduled/{scheduleId}/history
   ```

## Next Steps

1. ✅ Read full [README.md](./README.md) for advanced features
2. ✅ Set up monitoring for failed schedules
3. ✅ Configure alerts for dead letter queue
4. ✅ Review security best practices
5. ✅ Test disaster recovery procedures

## Support

- 📖 Full documentation: [README.md](./README.md)
- 🔧 API reference: `/api/docs`
- 💬 Support: support@yourcompany.com

## Examples Repository

More examples available in the test suite:
```
apps/api/src/modules/reports/scheduled/test/examples/
```
