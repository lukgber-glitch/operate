# Scheduled Reports - Installation & Integration Guide

Complete guide to install and integrate the Scheduled Reports module into Operate/CoachOS.

## Prerequisites

### System Requirements
- ✅ Node.js 18+ (LTS recommended)
- ✅ NestJS 10+
- ✅ PostgreSQL 14+
- ✅ Redis 6+ (for BullMQ)
- ✅ SMTP server access (for email delivery)

### Existing Dependencies
- ✅ Prisma ORM configured
- ✅ Reports module installed
- ✅ Export service available

## Step 1: Install NPM Dependencies

```bash
cd apps/api

# BullMQ and job queue
npm install @nestjs/bull bull
npm install --save-dev @types/bull

# Scheduling and cron
npm install @nestjs/schedule node-cron
npm install --save-dev @types/node-cron @types/cron

# Date/time handling
npm install moment moment-timezone
npm install --save-dev @types/moment-timezone

# Email handling
npm install nodemailer
npm install --save-dev @types/nodemailer

# Template engine
npm install handlebars
npm install --save-dev @types/handlebars

# HTTP client (if not already installed)
npm install axios
```

## Step 2: Configure Redis

### Option A: Local Redis (Development)

```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping
# Should return: PONG
```

### Option B: Docker Redis

```bash
# Run Redis container
docker run -d \
  --name redis-scheduled-reports \
  -p 6379:6379 \
  redis:7-alpine

# Verify
docker exec redis-scheduled-reports redis-cli ping
```

### Option C: Cloud Redis

Use managed Redis service:
- AWS ElastiCache
- Azure Cache for Redis
- Google Cloud Memorystore
- Upstash (serverless)

## Step 3: Configure Environment Variables

Add to `apps/api/.env`:

```bash
# ============================================================================
# SCHEDULED REPORTS CONFIGURATION
# ============================================================================

# Redis Configuration (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false

# SMTP Configuration (for email delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="Operate Reports <noreply@yourcompany.com>"

# Application URLs
APP_URL=http://localhost:3000

# Optional: Advanced Configuration
SCHEDULED_REPORTS_CONCURRENCY=5
SCHEDULED_REPORTS_RATE_LIMIT=10
SCHEDULED_REPORTS_MAX_FILE_SIZE_MB=25
SCHEDULED_REPORTS_RETENTION_DAYS=30
```

### Gmail SMTP Setup

1. Enable 2-Factor Authentication
2. Generate App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the generated password

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

### Other SMTP Providers

**SendGrid:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
```

**Amazon SES:**
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

## Step 4: Database Migration

The module uses the existing `ReportSchedule` model in Prisma. Verify it exists:

```bash
# Check schema
cat packages/database/prisma/schema.prisma | grep -A 40 "model ReportSchedule"

# Run migration (if needed)
cd packages/database
npx prisma migrate dev --name add-report-schedule

# Generate Prisma client
npx prisma generate
```

## Step 5: Import Module

### Main Application Module

Edit `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduledReportModule } from './modules/reports/scheduled';

@Module({
  imports: [
    // Config module (should already exist)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // BullMQ global configuration
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
          tls: configService.get('REDIS_TLS') === 'true' ? {} : undefined,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
      inject: [ConfigService],
    }),

    // Schedule module (for cron jobs)
    ScheduleModule.forRoot(),

    // Scheduled Reports module
    ScheduledReportModule,

    // ... other modules
  ],
})
export class AppModule {}
```

### Reports Module Integration

Edit `apps/api/src/modules/reports/reports.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ScheduledReportModule } from './scheduled';
import { ExportModule } from './export';
// ... other imports

@Module({
  imports: [
    ExportModule,
    ScheduledReportModule,
    // ... other report modules
  ],
  // ... rest of configuration
})
export class ReportsModule {}
```

## Step 6: Verify Installation

### 1. Start Application

```bash
cd apps/api
npm run start:dev
```

### 2. Check Logs

Look for successful initialization:

```
[Nest] INFO [ScheduledReportService] Email transporter initialized successfully
[Nest] INFO [BullModule] Queue 'scheduled-reports' initialized
[Nest] INFO [ScheduleModule] Cron jobs registered
```

### 3. Test API Endpoints

```bash
# Health check
curl http://localhost:3000/health

# List schedules (should return empty array initially)
curl "http://localhost:3000/reports/scheduled?orgId=test_org"
```

### 4. Test Redis Connection

```bash
# Check Redis keys
redis-cli KEYS "bull:scheduled-reports:*"
```

## Step 7: Create Test Schedule

```bash
curl -X POST http://localhost:3000/reports/scheduled \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "test_org",
    "name": "Test Schedule",
    "schedule": {
      "frequency": "daily",
      "timeOfDay": "09:00",
      "timezone": "UTC"
    },
    "reportParams": {
      "reportType": "profit_loss",
      "dateRange": { "type": "last_month" },
      "format": "pdf"
    },
    "deliveryConfig": {
      "method": "save_only"
    },
    "startImmediately": false
  }'
```

## Step 8: Production Configuration

### Redis Cluster (Production)

```typescript
BullModule.forRootAsync({
  useFactory: async (configService: ConfigService) => ({
    redis: {
      cluster: [
        { host: 'redis-node-1', port: 6379 },
        { host: 'redis-node-2', port: 6379 },
        { host: 'redis-node-3', port: 6379 },
      ],
      password: configService.get('REDIS_PASSWORD'),
      tls: {
        rejectUnauthorized: false,
      },
    },
  }),
  inject: [ConfigService],
}),
```

### Email Rate Limiting

```typescript
// In scheduled-report.service.ts
private readonly emailRateLimiter = {
  maxEmailsPerHour: 100,
  maxEmailsPerDay: 1000,
};
```

### Monitoring and Alerts

```typescript
// Example: Integrate with monitoring service
@Injectable()
export class ScheduledReportMonitoring {
  @Cron(CronExpression.EVERY_HOUR)
  async checkFailedJobs() {
    const failed = await this.queue.getFailed();
    if (failed.length > 10) {
      // Send alert
      await this.alertService.send({
        type: 'SCHEDULED_REPORTS_HIGH_FAILURES',
        count: failed.length,
      });
    }
  }
}
```

## Step 9: Security Hardening

### 1. API Authentication

Uncomment guards in controller:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'finance')
export class ScheduledReportController {
  // ... endpoints
}
```

### 2. Rate Limiting

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10, // 10 requests per minute
    }),
  ],
})
```

### 3. SMTP Security

```bash
# Use encrypted SMTP
SMTP_PORT=465
SMTP_SECURE=true

# Or TLS
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
```

### 4. Webhook Signature Verification

```typescript
// Add signature to webhook payload
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');

headers['X-Webhook-Signature'] = signature;
```

## Step 10: Testing

### Unit Tests

```bash
npm run test apps/api/src/modules/reports/scheduled
```

### Integration Tests

```bash
npm run test:e2e apps/api/src/modules/reports/scheduled
```

### Manual Testing Checklist

- [ ] Create schedule
- [ ] List schedules
- [ ] Update schedule
- [ ] Pause/resume schedule
- [ ] Manual execution
- [ ] Email delivery
- [ ] Webhook delivery
- [ ] View history
- [ ] Error handling
- [ ] Cron execution

## Troubleshooting

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping

# Check port
netstat -an | grep 6379

# Check Docker container
docker ps | grep redis
```

### Email Not Sending

```bash
# Test SMTP connection
telnet smtp.gmail.com 587

# Check credentials
echo $SMTP_USER
echo $SMTP_PASSWORD

# Review logs
tail -f logs/application.log | grep "ScheduledReportService"
```

### Queue Jobs Not Processing

```bash
# Check Bull queue
redis-cli KEYS "bull:scheduled-reports:*"

# Check for stalled jobs
redis-cli HGETALL "bull:scheduled-reports:stalled"

# Clear queue (development only)
redis-cli FLUSHDB
```

### Cron Not Running

```bash
# Verify ScheduleModule imported
# Check logs for cron registration
grep "processScheduledReports" logs/application.log

# Verify timezone
echo $TZ
```

## Performance Tuning

### BullMQ Optimization

```typescript
BullModule.registerQueue({
  name: SCHEDULED_REPORT_QUEUE,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
  limiter: {
    max: 20, // Increase for higher throughput
    duration: 1000,
  },
  settings: {
    lockDuration: 60000, // 1 minute
    stalledInterval: 30000, // Check every 30s
    maxStalledCount: 2,
  },
}),
```

### Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_report_schedule_next_run ON report_schedule(next_run_at) WHERE is_active = true;
CREATE INDEX idx_report_schedule_org_active ON report_schedule(org_id, is_active);
```

## Next Steps

1. ✅ Review [README.md](./README.md) for full documentation
2. ✅ Read [QUICKSTART.md](./QUICKSTART.md) for usage examples
3. ✅ Check [EXAMPLES.md](./EXAMPLES.md) for configuration patterns
4. ✅ Set up monitoring and alerts
5. ✅ Configure backup and disaster recovery
6. ✅ Plan capacity and scaling strategy

## Support

- 📖 Documentation: See README.md
- 🔧 API Reference: http://localhost:3000/api/docs
- 💬 Issues: Create issue in project repository
- 📧 Email: support@yourcompany.com

## License

Part of Operate/CoachOS - Enterprise SaaS Platform
