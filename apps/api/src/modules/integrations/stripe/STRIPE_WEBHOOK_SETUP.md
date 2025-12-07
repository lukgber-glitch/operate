# Stripe Webhook Setup Guide

Complete guide for setting up and configuring Stripe webhooks for subscription lifecycle management.

## Table of Contents

- [Overview](#overview)
- [Webhook Events Handled](#webhook-events-handled)
- [Setup Instructions](#setup-instructions)
- [Configuration](#configuration)
- [Testing Webhooks](#testing-webhooks)
- [Price ID Configuration](#price-id-configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The Stripe webhook integration handles the complete subscription lifecycle:

- **Subscription Management**: Create, update, cancel subscriptions
- **Organization Tier Updates**: Automatically update org tier based on subscription
- **Invoice Tracking**: Record successful payments and handle failures
- **Trial Management**: Track trial periods and send notifications
- **Idempotency**: Prevent duplicate event processing
- **Comprehensive Logging**: Full audit trail of all webhook events

## Webhook Events Handled

### Subscription Events

| Event | Handler | Action |
|-------|---------|--------|
| `customer.subscription.created` | `handleSubscriptionCreated` | Create subscription record, update org tier, start trial |
| `customer.subscription.updated` | `handleSubscriptionUpdated` | Update subscription status, handle plan changes, update org tier |
| `customer.subscription.deleted` | `handleSubscriptionDeleted` | Cancel subscription, downgrade org to FREE tier |
| `customer.subscription.trial_will_end` | `handleSubscriptionTrialWillEnd` | Send trial ending notification (3 days before) |

### Invoice Events

| Event | Handler | Action |
|-------|---------|--------|
| `invoice.paid` | `handleInvoicePaid` | Record successful payment, update billing history |
| `invoice.payment_failed` | `handleInvoicePaymentFailed` | Update subscription to PAST_DUE, send payment failed email |
| `invoice.upcoming` | `handleInvoiceUpcoming` | Send upcoming invoice notification |

### Connect Events (Legacy)

- `account.updated` - Connect account status changes
- `payment_intent.succeeded/failed` - Payment status updates
- `charge.succeeded/failed/refunded` - Charge updates
- `transfer.created/failed/reversed` - Transfer updates
- `payout.created/paid/failed/canceled` - Payout updates

## Setup Instructions

### 1. Configure Webhook Endpoint in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter webhook URL:
   - **Production**: `https://operate.guru/api/v1/integrations/stripe/webhooks`
   - **Development**: `https://your-ngrok-url.ngrok.io/api/v1/integrations/stripe/webhooks`

4. Select events to listen to:
   ```
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   customer.subscription.trial_will_end
   invoice.paid
   invoice.payment_failed
   invoice.upcoming
   ```

5. Click "Add endpoint"

### 2. Copy Webhook Signing Secret

1. Click on the newly created endpoint
2. Click "Reveal" under "Signing secret"
3. Copy the secret (starts with `whsec_`)

### 3. Add to Environment Variables

Add to your `.env` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
```

### 4. Database Tables

Ensure these tables exist (should be created by migrations):

```sql
-- Webhook logging (for idempotency)
stripe_webhook_logs

-- Subscription tracking
stripe_subscriptions
stripe_subscription_items

-- Customer management
stripe_customers

-- Billing history
stripe_billing_history
```

If tables don't exist, run the SQL files:
- `apps/api/src/modules/integrations/stripe/prisma-schema.sql`
- `apps/api/src/modules/integrations/stripe/prisma-schema-billing.sql`

## Configuration

### Price ID to Tier Mapping

Edit the `PRICE_TO_TIER` mapping in `stripe-webhook-billing-handlers.ts`:

```typescript
const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  // Monthly prices
  'price_1234567890abcdef': SubscriptionTier.PRO,        // Replace with your actual price ID
  'price_abcdef1234567890': SubscriptionTier.ENTERPRISE, // Replace with your actual price ID

  // Annual prices
  'price_annual_pro_xyz': SubscriptionTier.PRO,
  'price_annual_enterprise_xyz': SubscriptionTier.ENTERPRISE,
};
```

**How to get your Price IDs:**

1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Click on a product
3. Under "Pricing", click on a price
4. Copy the Price ID (starts with `price_`)

### Environment Variables

Required environment variables:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Webhook Secret (CRITICAL for security)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
```

**Security Note**: The webhook secret is CRITICAL. It ensures webhooks are from Stripe and prevents spoofing.

## Testing Webhooks

### Local Testing with Stripe CLI

1. **Install Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows
   scoop install stripe

   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/v1/integrations/stripe/webhooks
   ```

4. **Get webhook signing secret**:
   The CLI will output a signing secret. Add it to your `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxx_from_cli_output
   ```

5. **Trigger test events**:
   ```bash
   # Test subscription created
   stripe trigger customer.subscription.created

   # Test subscription updated
   stripe trigger customer.subscription.updated

   # Test invoice paid
   stripe trigger invoice.paid

   # Test payment failed
   stripe trigger invoice.payment_failed
   ```

### Testing with ngrok (Alternative)

1. **Start ngrok**:
   ```bash
   ngrok http 3000
   ```

2. **Copy ngrok URL** (e.g., `https://abc123.ngrok.io`)

3. **Update Stripe webhook endpoint** to use ngrok URL:
   ```
   https://abc123.ngrok.io/api/v1/integrations/stripe/webhooks
   ```

4. **Test in Stripe Dashboard**:
   - Go to your endpoint in Stripe Dashboard
   - Click "Send test webhook"
   - Select event type and send

### Verifying Webhooks Work

Check your application logs for:

```
[StripeWebhookController] Received webhook event: customer.subscription.created (ID: evt_xxx)
[StripeBillingWebhookHandlers] Processing customer.subscription.created for sub_xxx
[StripeBillingWebhookHandlers] Updated organization org_xxx to tier PRO
```

Check database:

```sql
-- Check webhook logs
SELECT * FROM stripe_webhook_logs ORDER BY created_at DESC LIMIT 10;

-- Check subscriptions
SELECT * FROM stripe_subscriptions ORDER BY created_at DESC LIMIT 5;

-- Check organization settings
SELECT id, name, settings FROM organisations WHERE id = 'your-org-id';
```

## Price ID Configuration

### Creating Products and Prices in Stripe

1. **Go to Products**: [Stripe Dashboard > Products](https://dashboard.stripe.com/products)

2. **Create Product**:
   - Click "Add product"
   - Name: "Pro Plan"
   - Description: "Professional features for growing teams"

3. **Add Pricing**:
   - **Monthly**: $29/month
   - **Annual**: $290/year (save 17%)

4. **Set Metadata**:
   - Add metadata: `tier` = `PRO`

5. **Copy Price IDs** and update `PRICE_TO_TIER` mapping

### Example Product Setup

```
Product: Starter
├── Monthly: $19/mo (price_starter_monthly_xxx)
└── Annual: $190/yr (price_starter_annual_xxx)

Product: Pro
├── Monthly: $49/mo (price_pro_monthly_xxx)
└── Annual: $490/yr (price_pro_annual_xxx)

Product: Business
├── Monthly: $99/mo (price_business_monthly_xxx)
└── Annual: $990/yr (price_business_annual_xxx)
```

## Troubleshooting

### Webhooks Not Being Received

**Check 1**: Verify webhook endpoint in Stripe Dashboard
- Go to Webhooks tab
- Check endpoint URL is correct
- Check endpoint is "Enabled"

**Check 2**: Verify webhook secret in environment
```bash
echo $STRIPE_WEBHOOK_SECRET
# Should output: whsec_xxxxxxxxxxxxx
```

**Check 3**: Check application logs
```bash
# API logs
ssh cloudways "cd ~/applications/eagqdkxvzv/public_html/apps/api && npx pm2 logs operate-api --lines 50"
```

### Signature Verification Failed

**Error**: `Webhook signature verification failed`

**Solution**:
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Check raw body is being passed to webhook handler
3. Ensure body parser is configured correctly in NestJS

### Events Being Processed Multiple Times

**Cause**: Idempotency not working

**Solution**:
1. Check `stripe_webhook_logs` table exists
2. Verify `event_id` column has UNIQUE constraint
3. Check logs for duplicate event IDs

### Organization Tier Not Updating

**Check 1**: Verify Price ID mapping
```typescript
// In stripe-webhook-billing-handlers.ts
console.log('Price ID:', subscription.items.data[0]?.price.id);
console.log('Mapped Tier:', PRICE_TO_TIER[priceId]);
```

**Check 2**: Verify orgId in subscription metadata
```typescript
console.log('Subscription metadata:', subscription.metadata);
```

**Check 3**: Check organization settings in database
```sql
SELECT id, name, settings FROM organisations WHERE id = 'org_xxx';
```

### Invoice Payment Failed Not Triggering

**Check**: Verify event is selected in Stripe webhook endpoint
1. Go to Stripe Dashboard > Webhooks
2. Click on your endpoint
3. Scroll to "Events to send"
4. Ensure `invoice.payment_failed` is checked

### Trial Not Being Tracked

**Verify**:
1. `trial_end` is set in subscription
2. Organization settings has `trialEndsAt`
3. Check subscription metadata has `tier`

```sql
SELECT
  s.stripe_subscription_id,
  s.trial_end,
  s.metadata->>'tier' as tier,
  o.settings->>'subscriptionTier' as org_tier,
  o.settings->>'trialEndsAt' as org_trial_end
FROM stripe_subscriptions s
JOIN stripe_customers c ON c.stripe_customer_id = s.stripe_customer_id
JOIN user_organizations uo ON uo.user_id = c.user_id
JOIN organisations o ON o.id = uo.org_id
WHERE s.stripe_subscription_id = 'sub_xxx';
```

## Security Best Practices

1. **Always verify webhook signatures** - Already implemented in controller
2. **Never trust webhook data without verification** - Stripe signature ensures authenticity
3. **Implement idempotency** - Already implemented via `stripe_webhook_logs`
4. **Log all webhook events** - Already implemented
5. **Use HTTPS only** - Ensure your webhook endpoint uses HTTPS
6. **Rotate webhook secrets periodically** - Update in both Stripe Dashboard and `.env`

## Monitoring

### Key Metrics to Monitor

1. **Webhook Success Rate**:
   ```sql
   SELECT
     event_type,
     COUNT(*) as total,
     SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful,
     ROUND(100.0 * SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
   FROM stripe_webhook_logs
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY event_type
   ORDER BY total DESC;
   ```

2. **Failed Webhooks**:
   ```sql
   SELECT * FROM stripe_webhook_logs
   WHERE status = 'FAILED'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Subscription Status Distribution**:
   ```sql
   SELECT status, COUNT(*) as count
   FROM stripe_subscriptions
   WHERE deleted_at IS NULL
   GROUP BY status;
   ```

## Support

- **Stripe Documentation**: https://stripe.com/docs/webhooks
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Test Events**: https://stripe.com/docs/cli/trigger

## Next Steps

1. Set up email notifications for:
   - Trial ending (3 days before)
   - Payment failed
   - Subscription canceled

2. Configure Stripe Customer Portal for self-service:
   - Already implemented in `StripePortalService`
   - Allows customers to manage subscriptions

3. Set up monitoring alerts for:
   - High webhook failure rate
   - Payment failures
   - Subscription cancellations
