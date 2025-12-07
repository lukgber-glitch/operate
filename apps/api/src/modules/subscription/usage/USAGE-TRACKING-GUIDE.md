# Usage Tracking Quick Reference Guide

## 🚀 Quick Start

### 1. Check if User Can Use a Feature

```typescript
import { UsageLimitService } from './services/usage-limit.service';
import { UsageFeature } from '@prisma/client';

// Inject the service
constructor(private usageLimitService: UsageLimitService) {}

// Check limit
const check = await this.usageLimitService.checkLimit(
  organizationId,
  UsageFeature.AI_MESSAGES
);

if (!check.allowed) {
  throw new ForbiddenException(
    `Usage limit exceeded. You've used ${check.current} of ${check.limit} ${check.featureName}.`
  );
}
```

### 2. Track Usage After Action

```typescript
import { UsageMeteringService } from './services/usage-metering.service';

// Inject the service
constructor(private usageMeteringService: UsageMeteringService) {}

// Track usage
await this.usageMeteringService.trackUsage({
  organizationId: orgId,
  feature: UsageFeature.INVOICES,
  quantity: 1,
  userId: userId,
  metadata: {
    invoiceId: invoice.id,
    amount: invoice.total,
  },
});
```

### 3. Using the @TrackUsage Decorator

```typescript
import { TrackUsage } from './decorators/track-usage.decorator';
import { UseInterceptors } from '@nestjs/common';
import { UsageTrackingInterceptor } from './interceptors/usage-tracking.interceptor';

@Injectable()
export class InvoiceService {
  @UseInterceptors(UsageTrackingInterceptor)
  @TrackUsage(UsageFeature.INVOICES, {
    extractOrgId: (ctx) => ctx.switchToHttp().getRequest().user.orgId,
    extractUserId: (ctx) => ctx.switchToHttp().getRequest().user.id,
    quantity: 1,
  })
  async createInvoice(dto: CreateInvoiceDto) {
    // Your logic here
    return await this.prisma.invoice.create({ data: dto });
  }
}
```

## 📋 Available Usage Features

| Feature | Description | Type | Default Limit (Free) |
|---------|-------------|------|---------------------|
| `AI_MESSAGES` | AI chat messages | Monthly | 50 |
| `BANK_CONNECTIONS` | Connected bank accounts | Cumulative | 1 |
| `INVOICES` | Invoices created | Monthly | 5 |
| `EMAIL_SYNCS` | Email inbox syncs | Monthly | 10 |
| `TAX_FILINGS` | Tax filings submitted | Monthly | 1 |
| `OCR_SCAN` | Receipt/invoice scans | Monthly | 50 |
| `AI_CLASSIFICATION` | AI transaction categorization | Monthly | 100 |
| `EXPORT_PDF` | PDF exports | Monthly | 200 |

## 🎯 Subscription Tiers

### Free
- AI Messages: 50/month
- Bank Connections: 1
- Invoices: 5/month
- Email Syncs: 10/month
- Tax Filings: 1/month

### Starter ($29/month)
- AI Messages: 500/month
- Bank Connections: 3
- Invoices: 50/month
- Email Syncs: 100/month
- Tax Filings: 5/month

### Pro ($79/month)
- AI Messages: Unlimited
- Bank Connections: 10
- Invoices: Unlimited
- Email Syncs: Unlimited
- Tax Filings: Unlimited

### Business ($149/month)
- Everything Unlimited

## 🔌 API Endpoints

### Get All Limits
```http
GET /api/v1/usage/:orgId/limits
Authorization: Bearer {token}
```

**Response:**
```json
{
  "tier": "free",
  "limits": [
    {
      "feature": "AI_MESSAGES",
      "featureName": "AI Chat Messages",
      "current": 23,
      "limit": 50,
      "percentage": 46,
      "allowed": true
    }
  ]
}
```

### Check Specific Feature
```http
GET /api/v1/usage/:orgId/check/:feature
Authorization: Bearer {token}
```

**Response:**
```json
{
  "allowed": true,
  "current": 23,
  "limit": 50,
  "percentage": 46
}
```

### Track Usage Manually
```http
POST /api/v1/usage/track
Authorization: Bearer {token}
Content-Type: application/json

{
  "organizationId": "org_123",
  "feature": "INVOICES",
  "quantity": 1,
  "userId": "user_456",
  "metadata": {
    "invoiceId": "inv_789"
  }
}
```

## 💡 Common Patterns

### Pattern 1: Check Before Action
```typescript
async createInvoice(orgId: string, dto: CreateInvoiceDto) {
  // Check limit first
  await this.usageLimitService.enforceLimit(orgId, UsageFeature.INVOICES);

  // Create invoice
  const invoice = await this.prisma.invoice.create({ data: dto });

  // Track usage (background)
  this.usageMeteringService.trackUsage({
    organizationId: orgId,
    feature: UsageFeature.INVOICES,
    quantity: 1,
  }).catch(err => this.logger.error('Failed to track usage', err));

  return invoice;
}
```

### Pattern 2: Soft Check with Warning
```typescript
async sendAiMessage(orgId: string, message: string) {
  const check = await this.usageLimitService.checkLimit(
    orgId,
    UsageFeature.AI_MESSAGES
  );

  let warning = null;
  if (check.percentage >= 90) {
    warning = `You've used ${check.percentage}% of your AI message quota.`;
  }

  if (!check.allowed) {
    throw new ForbiddenException('AI message limit exceeded. Please upgrade.');
  }

  const response = await this.claudeService.chat(message);

  return {
    response,
    warning,
    usage: {
      current: check.current,
      limit: check.limit,
      percentage: check.percentage,
    },
  };
}
```

### Pattern 3: Bulk Operations
```typescript
async importInvoices(orgId: string, invoices: CreateInvoiceDto[]) {
  // Check if we have enough quota
  const check = await this.usageLimitService.checkLimit(
    orgId,
    UsageFeature.INVOICES
  );

  const remaining = check.limit - check.current;
  if (invoices.length > remaining) {
    throw new ForbiddenException(
      `Not enough quota. You can import ${remaining} more invoices this month.`
    );
  }

  // Create invoices
  const created = await this.prisma.invoice.createMany({ data: invoices });

  // Track bulk usage
  await this.usageMeteringService.trackUsage({
    organizationId: orgId,
    feature: UsageFeature.INVOICES,
    quantity: created.count,
  });

  return created;
}
```

## 🛠️ Troubleshooting

### Usage Not Tracking
1. Check if UsageModule is imported in your feature module
2. Verify organization exists and has a valid subscription tier
3. Check logs for tracking errors
4. Ensure feature name matches `UsageFeature` enum

### Limits Not Enforcing
1. Verify SubscriptionTier records exist in database
2. Check organization's `subscriptionTier` field
3. Run `npx prisma db seed` to seed tiers if missing

### Wrong Limit Values
1. Check `limits` JSON in SubscriptionTier table
2. Verify billing period (current month)
3. For BANK_CONNECTIONS, check active connections count

## 🧪 Testing

```typescript
describe('Usage Tracking', () => {
  it('should track AI message usage', async () => {
    await chatService.sendMessage(conversationId, userId, orgId, { content: 'Hello' });

    const usage = await usageMeteringService.getCurrentUsage({ organizationId: orgId });
    const aiMessages = usage.features.find(f => f.feature === UsageFeature.AI_MESSAGES);

    expect(aiMessages.totalQuantity).toBeGreaterThan(0);
  });

  it('should enforce limits', async () => {
    // Set limit to 1
    await prisma.subscriptionTier.update({
      where: { name: 'free' },
      data: { limits: { AI_MESSAGES: 1 } },
    });

    // First message should work
    await chatService.sendMessage(conversationId, userId, orgId, { content: 'Hello' });

    // Second should fail
    await expect(
      chatService.sendMessage(conversationId, userId, orgId, { content: 'World' })
    ).rejects.toThrow(ForbiddenException);
  });
});
```

## 📚 Related Documentation

- [Full Implementation Guide](../../../../../USAGE-TRACKING-IMPLEMENTATION.md)
- [Usage Module README](./README.md)
- [Subscription Billing Module](../README.md)

---

**Need Help?** Check the full implementation documentation or contact the backend team.
