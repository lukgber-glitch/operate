# Quick Start Guide - Export Scheduler

Get the export scheduler up and running in 5 minutes.

## 1. Install Dependencies

```bash
cd apps/api
pnpm add cron-parser
```

## 2. Run Database Migration

```bash
cd ../../packages/database
npx prisma migrate dev --name add_scheduled_exports
npx prisma generate
```

## 3. Enable Module

Edit `apps/api/src/app.module.ts`:

```typescript
import { ExportSchedulerModule } from './modules/export-scheduler';

@Module({
  imports: [
    // ... existing modules
    ExportSchedulerModule,
  ],
})
export class AppModule {}
```

## 4. Initialize on Startup

Edit `apps/api/src/main.ts` (add before `await app.listen()`):

```typescript
// Initialize scheduled exports
const exportSchedulerService = app.get(ExportSchedulerService);
await exportSchedulerService.scheduleAllActive();
logger.log('Scheduled exports initialized');
```

## 5. Test the API

Start the API:
```bash
cd apps/api
pnpm dev
```

Create a test scheduled export:
```bash
curl -X POST http://localhost:3000/export-scheduler \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "test-org-123",
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
    "notifyEmail": "test@example.com"
  }'
```

List scheduled exports:
```bash
curl http://localhost:3000/export-scheduler?orgId=test-org-123
```

Execute immediately:
```bash
curl -X POST http://localhost:3000/export-scheduler/{id}/execute?orgId=test-org-123
```

## 6. (Optional) Enable Authentication

Uncomment guards in `export-scheduler.controller.ts`:

```typescript
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
@Roles('ADMIN', 'MANAGER')
```

## 7. Configure Email Notifications

Edit `export-scheduler.service.ts` and implement the `sendNotification` method:

```typescript
private async sendNotification(
  scheduledExport: any,
  status: 'completed' | 'failed',
  exportId?: string,
  error?: string,
): Promise<void> {
  await this.emailService.send({
    to: scheduledExport.notifyEmail,
    subject: `Export ${status}: ${scheduledExport.name}`,
    template: 'scheduled-export-notification',
    context: {
      name: scheduledExport.name,
      status,
      exportId,
      error,
    },
  });
}
```

## Common Cron Expressions

| Expression | Meaning |
|-----------|---------|
| `0 0 * * *` | Daily at midnight |
| `0 0 1 * *` | Monthly on 1st at midnight |
| `0 9 * * 1-5` | Weekdays at 9 AM |
| `0 */6 * * *` | Every 6 hours |
| `0 0 1 1,4,7,10 *` | Quarterly |

Use https://crontab.guru/ to test expressions.

## Troubleshooting

### Jobs not executing
- Check Redis is running: `redis-cli ping`
- Check logs: `tail -f logs/api.log`
- Verify `nextRunAt` is in the future

### "cron-parser" not found
```bash
cd apps/api && pnpm add cron-parser
```

### Database errors
```bash
cd packages/database
npx prisma migrate reset
npx prisma migrate dev
```

### Bull queue issues
- Clear Redis: `redis-cli FLUSHDB`
- Restart API server

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details
- Configure email service integration
- Enable authentication guards
- Write tests for your use cases

## Support

For issues or questions:
1. Check the logs
2. Review the README.md
3. Check Bull queue status
4. Verify database schema is up to date
