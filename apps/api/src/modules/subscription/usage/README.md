# Usage-Based Billing Module

Comprehensive metered billing system for Operate/CoachOS. Tracks usage of pay-as-you-go features and integrates with Stripe for automatic invoicing.

## Features

- **Real-time Usage Tracking**: Track usage events as they happen
- **Stripe Metered Billing**: Automatic reporting to Stripe
- **Usage Quotas**: Configure free tier allowances per feature
- **Overage Calculation**: Automatic calculation of usage beyond quota
- **Historical Reporting**: Complete usage history by billing period
- **Cost Estimation**: Project costs based on current usage trends
- **Background Processing**: BullMQ jobs for aggregation and reporting
- **Decorator-based Tracking**: Easy integration with `@TrackUsage()`

## Supported Features

| Feature | Unit | Default Free Tier | Default Price |
|---------|------|-------------------|---------------|
| OCR Scans | scan | 50 | $0.05/scan |
| API Calls | call | 10,000 | $0.001/call |
| Storage | GB | 5 GB | $0.02/GB |
| AI Classifications | classification | 100 | $0.01/classification |
| Emails | email | 1,000 | $0.005/email |
| Bank Syncs | sync | 30 | $0.03/sync |
| SMS Messages | sms | 100 | $0.10/sms |
| PDF Exports | export | 200 | $0.02/export |
| Webhooks | webhook | 5,000 | $0.002/webhook |
| Custom Reports | report | 50 | $0.05/report |

## Quick Start

### 1. Configure Usage Quotas

```typescript
// Configure quota for an organization
await usageMeteringService.configureQuota({
  organizationId: 'org_123',
  feature: UsageFeature.OCR_SCAN,
  includedQuantity: 100, // Free tier: 100 scans
  pricePerUnit: 5, // $0.05 per scan (in cents)
  currency: 'EUR',
  resetPeriod: 'MONTHLY',
});
```

### 2. Track Usage with Decorator

```typescript
import { TrackUsage } from '@/modules/subscription/usage';
import { UsageFeature } from '@prisma/client';

@Injectable()
export class OcrService {
  @TrackUsage(UsageFeature.OCR_SCAN, {
    extractOrgId: (ctx) => ctx.switchToHttp().getRequest().user.orgId,
    extractMetadata: (ctx, result) => ({
      fileSize: result.fileSize,
      documentType: result.documentType,
    }),
  })
  async scanReceipt(dto: ScanReceiptDto) {
    // Your OCR logic here
    return await this.performOcr(dto);
  }
}
```

### 3. Manual Usage Tracking

```typescript
import { UsageMeteringService } from '@/modules/subscription/usage';

// Track a single event
await usageMeteringService.trackUsage({
  organizationId: 'org_123',
  feature: UsageFeature.API_CALL,
  quantity: 1,
  metadata: {
    endpoint: '/api/invoices',
    method: 'POST',
  },
  userId: 'user_456',
});

// Track multiple events in bulk
await usageMeteringService.trackBulkUsage('org_123', [
  { feature: UsageFeature.EMAIL_SENT, quantity: 5 },
  { feature: UsageFeature.PDF_EXPORT, quantity: 2 },
]);
```

### 4. Check Usage & Quotas

```typescript
// Get current usage summary
const usage = await usageMeteringService.getCurrentUsage({
  organizationId: 'org_123',
});

console.log('Current Period Usage:', {
  totalOverage: usage.totalOverageAmount,
  features: usage.features.map(f => ({
    feature: f.displayName,
    used: f.totalQuantity,
    included: f.includedQuantity,
    overage: f.overageQuantity,
    cost: f.overageAmount,
  })),
});

// Check quota for specific feature
const quota = await usageMeteringService.checkQuota(
  'org_123',
  UsageFeature.OCR_SCAN,
);

if (!quota.hasQuota) {
  throw new Error('OCR scan quota exceeded');
}
```

### 5. Usage History & Estimates

```typescript
// Get usage history
const history = await usageMeteringService.getUsageHistory({
  organizationId: 'org_123',
  limit: 12, // Last 12 periods
});

// Get cost estimate for current period
const estimate = await usageMeteringService.estimateUsageCosts('org_123');

console.log('Projected costs:', {
  current: usage.totalOverageAmount,
  projected: estimate.estimatedAmount,
  features: estimate.features.map(f => ({
    feature: f.feature,
    projectedUsage: f.projectedQuantity,
    estimatedCost: f.estimatedAmount,
  })),
});
```

## REST API Endpoints

### Track Usage

```bash
POST /api/usage/track
Content-Type: application/json

{
  "organizationId": "org_123",
  "feature": "OCR_SCAN",
  "quantity": 1,
  "metadata": {
    "fileSize": 1024000,
    "documentType": "receipt"
  }
}
```

### Get Current Usage

```bash
GET /api/usage/org_123
GET /api/usage/org_123?features=OCR_SCAN,API_CALL
```

### Usage History

```bash
GET /api/usage/org_123/history?limit=12
```

### Cost Estimate

```bash
GET /api/usage/org_123/estimate
```

### Configure Quota

```bash
POST /api/usage/org_123/quota
Content-Type: application/json

{
  "feature": "OCR_SCAN",
  "includedQuantity": 100,
  "pricePerUnit": 5,
  "currency": "EUR"
}
```

## Background Jobs

### Usage Aggregation (Hourly)

Aggregates raw usage events into summaries for faster querying.

```typescript
// Automatically scheduled, but can be triggered manually
await aggregationQueue.add('aggregate-all');
```

### Stripe Reporting (Daily)

Reports aggregated usage to Stripe for metered billing.

```typescript
// Automatically scheduled at midnight
await stripeReportQueue.add('report-all');
```

### Retry Failed Reports (Every 6 hours)

Retries failed Stripe API calls.

```typescript
await stripeReportQueue.add('retry-failed');
```

### Generate Invoice Items (End of month)

Converts usage summaries into Stripe invoice items.

```typescript
await stripeReportQueue.add('generate-invoice-items');
```

## Stripe Integration

### Create Metered Prices

```typescript
const price = await usageStripeService.createMeteredPrice(
  'prod_stripe_product_id',
  UsageFeature.OCR_SCAN,
  '5', // $0.05 in cents
  'EUR',
);
```

### Add to Subscription

```typescript
const item = await usageStripeService.addMeteredSubscriptionItem(
  'sub_stripe_subscription_id',
  price.id,
);
```

### Report Usage

```typescript
await usageStripeService.reportUsageToStripe(
  'org_123',
  UsageFeature.OCR_SCAN,
  25, // quantity
  new Date(),
);
```

## Database Schema

### UsageEvent
Raw usage events tracked in real-time.

```prisma
model UsageEvent {
  id             String       @id @default(cuid())
  organisationId String
  feature        UsageFeature
  quantity       Int          @default(1)
  metadata       Json?
  timestamp      DateTime     @default(now())
  reportedToStripe     Boolean @default(false)
  stripeUsageRecordId  String?
  userId String?
}
```

### UsageQuota
Per-organization feature quotas and pricing.

```prisma
model UsageQuota {
  id             String       @id @default(cuid())
  organisationId String
  feature        UsageFeature
  includedQuantity Int        @default(0)
  pricePerUnit   Decimal      @db.Decimal(8, 4)
  currency       String       @default("EUR")
  resetPeriod    String       @default("MONTHLY")
}
```

### UsageSummary
Aggregated usage by billing period.

```prisma
model UsageSummary {
  id             String       @id @default(cuid())
  organisationId String
  feature        UsageFeature
  periodStart    DateTime
  periodEnd      DateTime
  totalQuantity  Int
  includedQuantity Int
  overageQuantity  Int
  overageAmount    Decimal
  reportedToStripe Boolean    @default(false)
}
```

## Example Use Cases

### 1. OCR Receipt Scanning

```typescript
@TrackUsage(UsageFeature.OCR_SCAN)
async scanReceipt(file: Express.Multer.File, orgId: string) {
  const result = await this.ocrEngine.process(file);
  return result;
}
```

### 2. API Rate Limiting with Usage Tracking

```typescript
@UseInterceptors(UsageTrackingInterceptor)
@TrackUsage(UsageFeature.API_CALL)
async handleApiRequest(req: Request) {
  // Check quota before processing
  const quota = await this.usageService.checkQuota(
    req.user.orgId,
    UsageFeature.API_CALL,
  );

  if (!quota.hasQuota) {
    throw new ForbiddenException('API quota exceeded');
  }

  return this.processRequest(req);
}
```

### 3. Storage-based Billing

```typescript
async uploadFile(file: Express.Multer.File, orgId: string) {
  await this.storageService.upload(file);

  // Track storage usage in GB
  const totalSizeGB = await this.storageService.getTotalSize(orgId) / (1024 ** 3);

  await this.usageService.trackUsage({
    organizationId: orgId,
    feature: UsageFeature.STORAGE_GB,
    quantity: Math.ceil(totalSizeGB),
  });
}
```

## Testing

```typescript
describe('UsageMeteringService', () => {
  it('should track usage event', async () => {
    await service.trackUsage({
      organizationId: 'org_test',
      feature: UsageFeature.OCR_SCAN,
      quantity: 1,
    });

    const usage = await service.getCurrentUsage({
      organizationId: 'org_test',
    });

    expect(usage.features[0].totalQuantity).toBe(1);
  });

  it('should calculate overage correctly', async () => {
    // Configure quota: 50 free scans, $0.05 per scan
    await configureQuota({
      organizationId: 'org_test',
      feature: UsageFeature.OCR_SCAN,
      includedQuantity: 50,
      pricePerUnit: 5,
    });

    // Track 75 scans
    await trackUsage({
      organizationId: 'org_test',
      feature: UsageFeature.OCR_SCAN,
      quantity: 75,
    });

    const usage = await getCurrentUsage({ organizationId: 'org_test' });

    expect(usage.features[0].overageQuantity).toBe(25);
    expect(usage.features[0].overageAmount).toBe(1.25); // 25 * $0.05
  });
});
```

## Configuration

Configure job schedules in your NestJS app module:

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
  ],
})
export class AppModule {}
```

## Best Practices

1. **Always configure quotas**: Set up quotas before tracking usage
2. **Use the decorator**: Prefer `@TrackUsage()` for automatic tracking
3. **Track in background**: Don't block user requests for usage tracking
4. **Monitor Stripe reporting**: Check failed reports regularly
5. **Set appropriate free tiers**: Balance user experience with costs
6. **Use bulk tracking**: For batch operations, use `trackBulkUsage()`
7. **Cache quota checks**: Cache quota status to reduce DB queries

## Troubleshooting

### Usage not appearing in Stripe

1. Check if quota is configured
2. Verify Stripe subscription has metered price attached
3. Check job processor logs for errors
4. Manually trigger `report-all` job

### Incorrect overage calculations

1. Verify quota configuration
2. Check if events are being aggregated
3. Review usage summary records in DB
4. Ensure period dates are correct

## License

Proprietary - Operate/CoachOS
