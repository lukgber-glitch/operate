# Subscription Module - Quick Start Guide

## 5-Minute Setup

### 1. Database Migration
```bash
# Run the subscription tables migration
psql -d operate_db -f packages/database/prisma/migrations/add_subscription_tables.sql
```

### 2. Environment Variables
```env
# Add to your .env file
STRIPE_API_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
REDIS_URL=redis://localhost:6379
SUBSCRIPTION_TRIAL_DAYS=14
```

### 3. Import Module
```typescript
// app.module.ts
import { SubscriptionModule } from './modules/subscription';

@Module({
  imports: [
    // ... other modules
    SubscriptionModule,
  ],
})
export class AppModule {}
```

### 4. Stripe Product Setup
```typescript
import { StripeProductsService } from './modules/integrations/stripe/services/stripe-products.service';

// Create PRO tier product
const proProduct = await stripeProducts.createProduct({
  name: 'Operate Pro',
  description: 'Advanced features for growing businesses',
  tier: SubscriptionTier.PRO,
});

// Create monthly price
const proPrice = await stripeProducts.createPrice({
  productId: proProduct.id,
  unitAmount: 2900, // $29.00
  currency: 'usd',
  interval: 'month',
  metadata: { tier: 'PRO' },
});

// Repeat for ENTERPRISE tier
```

## Common Use Cases

### Feature Gating in Controllers

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  SubscriptionFeatureGuard,
  RequiresFeature,
  PlatformFeature
} from '../subscription';

@Controller('invoices')
@UseGuards(JwtAuthGuard, SubscriptionFeatureGuard)
export class InvoicesController {

  // Basic feature - available to all tiers
  @Post()
  async createInvoice() {
    // Anyone can create invoices (subject to limit)
  }

  // PRO+ feature
  @Post('ocr')
  @RequiresFeature(PlatformFeature.OCR)
  async processOCR() {
    // Only PRO and ENTERPRISE can use OCR
  }

  // ENTERPRISE only feature
  @Post('custom-integration')
  @RequiresFeature(PlatformFeature.CUSTOM_INTEGRATIONS)
  async customIntegration() {
    // Only ENTERPRISE can use custom integrations
  }
}
```

### Usage Limit Checking

```typescript
import { Injectable, PaymentRequiredException } from '@nestjs/common';
import { SubscriptionFeaturesService } from '../subscription';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly features: SubscriptionFeaturesService,
  ) {}

  async createInvoice(orgId: string, data: any) {
    // Check if organization can create another invoice
    const canCreate = await this.features.canCreateInvoice(orgId);

    if (!canCreate.hasAccess) {
      throw new PaymentRequiredException(
        `${canCreate.reason}. Please upgrade to ${canCreate.upgradeRequired} tier.`
      );
    }

    // Create the invoice
    const invoice = await this.prisma.invoice.create({ data });

    // Track usage (important!)
    await this.features.trackInvoiceCreated(orgId, invoice.id);

    return invoice;
  }
}
```

### Manual Feature Checking

```typescript
import { SubscriptionFeaturesService, PlatformFeature } from '../subscription';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly features: SubscriptionFeaturesService,
  ) {}

  async processInvoice(orgId: string, file: File) {
    // Check if organization has OCR feature
    const hasOCR = await this.features.hasFeature(
      orgId,
      PlatformFeature.OCR
    );

    if (hasOCR.hasAccess) {
      // Use OCR for automatic data extraction
      return this.processWithOCR(file);
    } else {
      // Fall back to manual entry
      return this.manualEntryFlow(file);
    }
  }
}
```

### Get Subscription Status

```typescript
import { SubscriptionManagerService } from '../subscription';

@Injectable()
export class SettingsService {
  constructor(
    private readonly subscriptionManager: SubscriptionManagerService,
  ) {}

  async getSettings(orgId: string) {
    // Get current subscription info
    const subscription = await this.subscriptionManager.getSubscription(orgId);

    return {
      tier: subscription.tier,
      features: subscription.features,
      usage: subscription.usage,
      trialEndsAt: subscription.trialEnd,
      willCancelAt: subscription.cancelAtPeriodEnd
        ? subscription.currentPeriodEnd
        : null,
    };
  }
}
```

### Start Trial

```typescript
import { SubscriptionManagerService, SubscriptionTier } from '../subscription';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly subscriptionManager: SubscriptionManagerService,
  ) {}

  async completeOnboarding(orgId: string) {
    // Start 14-day PRO trial
    await this.subscriptionManager.startTrial({
      orgId,
      tier: SubscriptionTier.PRO, // optional, defaults to PRO
    });

    return { message: 'Trial started! You now have access to all PRO features.' };
  }
}
```

## Frontend Integration Examples

### Get Subscription Info
```typescript
// GET /api/subscription/:orgId
const response = await fetch(`/api/subscription/${orgId}`);
const subscription = await response.json();

console.log(subscription.tier); // "PRO"
console.log(subscription.usage.invoicesCreated); // 23
console.log(subscription.usage.invoicesLimit); // 100
console.log(subscription.usage.percentUsed.invoices); // 23
```

### Start Trial
```typescript
// POST /api/subscription/start-trial
const response = await fetch('/api/subscription/start-trial', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orgId }),
});

const subscription = await response.json();
console.log(subscription.trialEnd); // Date 14 days from now
```

### Upgrade to ENTERPRISE
```typescript
// POST /api/subscription/upgrade
const response = await fetch('/api/subscription/upgrade', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orgId,
    targetTier: 'ENTERPRISE',
    paymentMethodId: 'pm_xxx', // from Stripe Elements
  }),
});

const subscription = await response.json();
console.log(subscription.tier); // "ENTERPRISE"
```

### Cancel Subscription
```typescript
// POST /api/subscription/cancel
const response = await fetch('/api/subscription/cancel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orgId,
    atPeriodEnd: true, // default
    reason: 'Too expensive',
  }),
});

const subscription = await response.json();
console.log(subscription.cancelAtPeriodEnd); // true
```

### Open Customer Portal
```typescript
// POST /api/subscription/:orgId/portal
const returnUrl = `${window.location.origin}/settings`;
const response = await fetch(
  `/api/subscription/${orgId}/portal?returnUrl=${encodeURIComponent(returnUrl)}`,
  { method: 'POST' }
);

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe portal
```

## Error Handling

### 402 Payment Required
```typescript
try {
  await invoiceService.createInvoice(orgId, data);
} catch (error) {
  if (error.status === 402) {
    // Show upgrade prompt
    showUpgradeModal({
      reason: error.message,
      currentTier: 'FREE',
      recommendedTier: 'PRO',
    });
  }
}
```

### Feature Access Denied
```typescript
// Automatic via guard
@Post('ocr')
@RequiresFeature(PlatformFeature.OCR)
async processOCR() {
  // If user doesn't have OCR feature, guard throws 402
  // Error message includes upgrade path
}
```

## Testing

### Mock Feature Service
```typescript
const mockFeaturesService = {
  hasFeature: jest.fn().mockResolvedValue({ hasAccess: true }),
  canCreateInvoice: jest.fn().mockResolvedValue({ hasAccess: true }),
  trackInvoiceCreated: jest.fn(),
};

const module = await Test.createTestingModule({
  providers: [
    { provide: SubscriptionFeaturesService, useValue: mockFeaturesService },
  ],
}).compile();
```

### Test Feature Guard
```typescript
it('should block access without required feature', async () => {
  mockFeaturesService.hasFeature.mockResolvedValue({
    hasAccess: false,
    reason: 'OCR requires PRO tier',
    upgradeRequired: SubscriptionTier.PRO,
  });

  const result = await controller.processOCR();

  expect(result).toThrow(PaymentRequiredException);
});
```

## Monitoring

### Usage Metrics
```typescript
// Get current usage
const usage = await subscriptionManager.getUsageStats(orgId);

console.log({
  invoicesCreated: usage.invoicesCreated,
  invoicesLimit: usage.invoicesLimit,
  activeUsers: usage.activeUsers,
  usersLimit: usage.usersLimit,
  warnings: usage.warnings, // ["Invoice usage at 85%"]
});
```

### Subscription Events
All subscription changes are logged to:
- `subscription_change_log` table
- Application logs (NestJS Logger)
- Stripe webhook events

Query recent changes:
```sql
SELECT * FROM subscription_change_log
WHERE org_id = 'xxx'
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Issue: Feature guard not working
**Solution**: Ensure guards are applied in correct order:
```typescript
@UseGuards(JwtAuthGuard, SubscriptionFeatureGuard) // Auth FIRST
```

### Issue: Usage limit not enforced
**Solution**: Make sure to call `trackInvoiceCreated()` after creating invoice:
```typescript
await this.features.trackInvoiceCreated(orgId, invoice.id);
```

### Issue: Stripe customer not found
**Solution**: Create Stripe customer before starting subscription:
```typescript
// Use StripeService to create customer first
const customer = await stripeService.createCustomer({ email, name });
```

### Issue: Monthly reset not running
**Solution**: Configure cron job or manual trigger:
```typescript
// Add to cron service
@Cron('0 0 1 * *') // 1st of month at midnight
async handleMonthlyReset() {
  await queue.add('monthly_reset', {
    type: 'monthly_reset',
    triggeredBy: 'scheduler',
  });
}
```

## Next Steps

1. **Add to existing controllers**: Apply feature guards where needed
2. **Create Stripe products**: Set up pricing tiers in Stripe dashboard
3. **Configure webhooks**: Handle subscription events from Stripe
4. **Build upgrade UI**: Create self-service subscription management
5. **Set up monitoring**: Track conversion, churn, and usage metrics

## Support

- See [README.md](./README.md) for detailed documentation
- Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details
- Review [types/subscription.types.ts](./types/subscription.types.ts) for tier definitions
- Stripe integration docs: [../integrations/stripe/README.md](../integrations/stripe/README.md)

---

**Happy coding!** 🚀
