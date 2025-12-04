# Subscription Module

High-level subscription management system with tier-based feature gating, usage tracking, and Stripe integration.

## Overview

The Subscription Module provides a complete subscription management system for the Operate platform, abstracting Stripe billing details while adding business logic for tier management, feature gating, and usage tracking.

## Features

- **Subscription Lifecycle Management**: Trial start, upgrade, downgrade, cancel
- **Tier-Based Feature Gating**: FREE, PRO, ENTERPRISE tiers with different feature sets
- **Usage Tracking**: Monitor invoice creation and user seat consumption
- **Limit Enforcement**: Soft and hard limits with automated warnings
- **Background Jobs**: Monthly usage resets and notification processing
- **Stripe Integration**: Seamless integration with Stripe billing

## Architecture

### Services

#### SubscriptionManagerService
High-level subscription orchestration:
- Start trials (14-day default)
- Upgrade/downgrade subscriptions
- Cancel subscriptions
- Get subscription status
- Generate customer portal URLs

#### SubscriptionFeaturesService
Feature gating and usage tracking:
- Check feature access by tier
- Enforce usage limits (invoices, users)
- Track resource creation
- Calculate usage metrics

### Guards & Decorators

#### @RequiresFeature() Decorator
```typescript
@UseGuards(JwtAuthGuard, SubscriptionFeatureGuard)
@RequiresFeature(PlatformFeature.OCR)
@Post('ocr/process')
async processOCR() {
  // Only accessible with OCR feature
}
```

#### SubscriptionFeatureGuard
- Enforces feature access based on organization tier
- Returns `402 Payment Required` if feature not available
- Provides upgrade path in error message

### Background Jobs

#### UsageTrackingProcessor
Processes background jobs for:
- Invoice creation tracking
- User addition tracking
- Monthly usage resets
- Usage limit warnings (80% and 100%)

## Subscription Tiers

### FREE Tier
- **Price**: $0/month
- **Invoices**: 5/month
- **Users**: 1
- **Features**: Basic invoicing, expenses, reports

### PRO Tier
- **Price**: $29/month
- **Invoices**: 100/month
- **Users**: 5
- **Features**: All FREE features + OCR, bank sync, recurring invoices, advanced reports, API access

### ENTERPRISE Tier
- **Price**: $99/month
- **Invoices**: Unlimited
- **Users**: Unlimited
- **Features**: All PRO features + custom integrations, dedicated support, SSO, audit logs, white-label

## API Endpoints

### Get Subscription
```http
GET /api/subscription/:orgId
```

### Start Trial
```http
POST /api/subscription/start-trial
{
  "orgId": "uuid",
  "tier": "PRO" // optional, defaults to PRO
}
```

### Upgrade Subscription
```http
POST /api/subscription/upgrade
{
  "orgId": "uuid",
  "targetTier": "ENTERPRISE",
  "paymentMethodId": "pm_xxx" // optional
}
```

### Downgrade Subscription
```http
POST /api/subscription/downgrade
{
  "orgId": "uuid",
  "targetTier": "PRO",
  "atPeriodEnd": true // optional, defaults to true
}
```

### Cancel Subscription
```http
POST /api/subscription/cancel
{
  "orgId": "uuid",
  "atPeriodEnd": true, // optional, defaults to true
  "reason": "Too expensive" // optional
}
```

### Get Usage Statistics
```http
GET /api/subscription/:orgId/usage
```

### Get Customer Portal URL
```http
POST /api/subscription/:orgId/portal?returnUrl=https://app.example.com/settings
```

## Usage Examples

### Feature Gating in Controllers

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionFeatureGuard, RequiresFeature, PlatformFeature } from '../subscription';

@Controller('invoices')
@UseGuards(JwtAuthGuard, SubscriptionFeatureGuard)
export class InvoicesController {
  // Available to all tiers (FREE, PRO, ENTERPRISE)
  @Post()
  async createInvoice() {
    // Check usage limit before creating
    const canCreate = await this.features.canCreateInvoice(orgId);
    if (!canCreate.hasAccess) {
      throw new PaymentRequiredException(canCreate.reason);
    }

    // Create invoice...
    await this.features.trackInvoiceCreated(orgId, invoice.id);
  }

  // Only PRO and ENTERPRISE tiers
  @Post('ocr')
  @RequiresFeature(PlatformFeature.OCR)
  async processOCR() {
    // OCR processing...
  }

  // Only ENTERPRISE tier
  @Post('export/custom')
  @RequiresFeature(PlatformFeature.CUSTOM_INTEGRATIONS)
  async customExport() {
    // Custom export logic...
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
    const hasOCR = await this.features.hasFeature(orgId, PlatformFeature.OCR);

    if (hasOCR.hasAccess) {
      // Process with OCR
      return this.processWithOCR(file);
    } else {
      // Manual entry required
      return this.manualEntry(file);
    }
  }
}
```

### Usage Tracking

```typescript
import { SubscriptionFeaturesService } from '../subscription';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly features: SubscriptionFeaturesService,
  ) {}

  async createInvoice(orgId: string, data: CreateInvoiceDto) {
    // Check if can create invoice (usage limit)
    const canCreate = await this.features.canCreateInvoice(orgId);
    if (!canCreate.hasAccess) {
      throw new PaymentRequiredException(canCreate.reason);
    }

    // Create invoice
    const invoice = await this.prisma.invoice.create({ data });

    // Track usage
    await this.features.trackInvoiceCreated(orgId, invoice.id);

    return invoice;
  }
}
```

## Database Schema

### subscription_usage_tracking
Tracks resource usage for current billing period.

### subscription_change_log
Audit log of subscription tier changes.

### subscription_notifications
Stores limit warnings and notifications.

### subscription_audit_log
General audit log for subscription events.

See `migrations/add_subscription_tables.sql` for full schema.

## Configuration

### Environment Variables

```env
# Stripe Configuration (required)
STRIPE_API_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Trial Period (optional, defaults to 14 days)
SUBSCRIPTION_TRIAL_DAYS=14

# Redis (required for Bull queues)
REDIS_URL=redis://localhost:6379
```

### Stripe Product Setup

Before using the subscription system, you need to create products and prices in Stripe:

1. Create products for each tier (FREE, PRO, ENTERPRISE)
2. Add metadata `tier: FREE|PRO|ENTERPRISE` to each product
3. Create monthly prices for each product
4. Add metadata `tier: FREE|PRO|ENTERPRISE` to each price

Or use the Stripe Products Service:

```typescript
// Create PRO tier product and price
const product = await stripeProducts.createProduct({
  name: 'Operate Pro',
  description: 'Advanced features for growing businesses',
  tier: SubscriptionTier.PRO,
});

const price = await stripeProducts.createPrice({
  productId: product.id,
  unitAmount: 2900, // $29.00
  currency: 'usd',
  interval: BillingInterval.MONTH,
  metadata: { tier: SubscriptionTier.PRO },
});
```

## Background Jobs

### Monthly Usage Reset
Runs on the 1st of each month at midnight:
- Archives previous month's usage data
- Resets usage counters
- Logs reset event in audit log

### Usage Tracking
Triggered by events:
- Invoice creation
- User addition
- Manual usage checks

## Testing

### Unit Tests
```bash
npm test subscription
```

### Integration Tests
```bash
npm test:e2e subscription
```

## Error Handling

### 402 Payment Required
Returned when:
- Feature not available in current tier
- Usage limit exceeded
- No active subscription

Error response includes:
- Reason for restriction
- Recommended upgrade tier
- Current usage stats

### 404 Not Found
Returned when:
- Organization not found
- Subscription not found

### 400 Bad Request
Returned when:
- Invalid tier transition
- Missing payment method for paid tier
- Trial already started

## Monitoring

### Metrics to Track
- Subscription conversion rate (trial -> paid)
- Churn rate by tier
- Usage patterns (% of limit used)
- Feature adoption by tier
- Revenue by tier

### Logs
All subscription changes are logged to:
- `subscription_change_log` (database)
- Application logs (NestJS Logger)
- Stripe audit logs

## Future Enhancements

- [ ] Annual billing with discount
- [ ] Add-on features (extra seats, storage)
- [ ] Seat-based pricing
- [ ] Usage-based pricing
- [ ] Enterprise custom pricing
- [ ] Self-service upgrade/downgrade UI
- [ ] Billing analytics dashboard
- [ ] Dunning management (failed payments)
- [ ] Multi-currency support
- [ ] Tax calculation integration

## Support

For issues or questions:
- Check the [Stripe Integration docs](../integrations/stripe/README.md)
- Review [subscription.types.ts](./types/subscription.types.ts) for tier definitions
- See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details
