# GoCardless Integration Guide

This guide explains how to integrate GoCardless Direct Debit payments into your application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Integration Flow](#integration-flow)
3. [Testing](#testing)
4. [Production Deployment](#production-deployment)
5. [Common Use Cases](#common-use-cases)
6. [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Install Dependencies

Already installed: `gocardless-nodejs@6.0.0`

### 2. Configure Environment

```bash
# Copy example environment file
cp apps/api/src/modules/integrations/gocardless/.env.example .env

# Generate encryption key
openssl rand -hex 32

# Update .env with your values
```

### 3. Add Database Models

Copy the models from `packages/database/prisma/gocardless-schema.prisma` to your main `schema.prisma` file.

### 4. Run Migration

```bash
cd packages/database
pnpm prisma migrate dev --name add_gocardless_integration
```

### 5. Import Module

Add to your `app.module.ts`:

```typescript
import { GoCardlessModule } from './modules/integrations/gocardless';

@Module({
  imports: [
    // ... other imports
    GoCardlessModule,
  ],
})
export class AppModule {}
```

## Integration Flow

### Complete Mandate Creation Flow

```typescript
// 1. Create redirect flow
const { redirectUrl, redirectFlowId } = await fetch('/integrations/gocardless/mandates/create-flow?orgId=org_123', {
  method: 'POST',
  body: JSON.stringify({
    customerId: 'cus_123',
    scheme: 'bacs', // or 'sepa_core' for EU
    successRedirectUrl: 'https://yourapp.com/gocardless/success',
    description: 'Monthly subscription'
  })
});

// 2. Redirect user to GoCardless
window.location.href = redirectUrl;

// 3. User authorizes mandate on GoCardless pages

// 4. User returns to your successRedirectUrl with query params:
// ?redirect_flow_id=RE123

// 5. Complete the flow on your backend
const mandate = await fetch('/integrations/gocardless/mandates/complete-flow/' + redirectFlowId, {
  method: 'POST'
});

// 6. Mandate is now active and ready for payments
console.log('Mandate created:', mandate.id);
```

### Creating Payments

Once you have an active mandate, you can create payments:

```typescript
// One-off payment
const payment = await fetch('/integrations/gocardless/payments?orgId=org_123&userId=user_123', {
  method: 'POST',
  body: JSON.stringify({
    mandateId: 'MD000123',
    amount: 100.00,
    currency: 'GBP',
    chargeDate: '2025-12-10', // Must be at least 3 days in future for BACS
    reference: 'INV-001',
    description: 'Invoice payment'
  })
});

// Recurring subscription
const subscription = await fetch('/integrations/gocardless/subscriptions?orgId=org_123&userId=user_123', {
  method: 'POST',
  body: JSON.stringify({
    mandateId: 'MD000123',
    amount: 50.00,
    currency: 'GBP',
    name: 'Monthly Premium',
    intervalUnit: 'monthly',
    interval: 1,
    dayOfMonth: 1
  })
});
```

### Handling Webhooks

Webhooks are automatically processed. Set up event listeners:

```typescript
// In your service
@OnEvent('gocardless.payments.paid_out')
handlePaymentPaidOut(event: GoCardlessWebhookEvent) {
  console.log('Payment paid out:', event.links.payment);
  // Update your internal records
}

@OnEvent('gocardless.payments.failed')
handlePaymentFailed(event: GoCardlessWebhookEvent) {
  console.log('Payment failed:', event.details.description);
  // Notify customer, retry payment, etc.
}
```

## Testing

### Sandbox Setup

1. Create sandbox account: https://manage-sandbox.gocardless.com/signup
2. Get sandbox access token from Developers > Access Tokens
3. Set environment:
   ```env
   GOCARDLESS_ENV=sandbox
   GOCARDLESS_ACCESS_TOKEN=sandbox_xxx
   ```

### Test Bank Accounts

**UK (BACS):**
- Sort Code: `20-00-00`
- Account Number: `55779911`
- Account Holder: `Test User`

**EU (SEPA):**
- IBAN: `GB33BUKB20201555779911`
- Account Holder: `Test User`

### Testing Payment Flows

```typescript
// Test successful payment
const payment = await createPayment({
  mandateId: 'MD000123',
  amount: 10.00, // Small amount for testing
  currency: 'GBP',
  chargeDate: addDays(new Date(), 3) // 3 days in future
});

// In sandbox, you can manually trigger events:
// Go to GoCardless Dashboard > Developers > Event Actions
// Select payment > Trigger "confirmed" or "paid_out"
```

### Webhook Testing

Use ngrok for local webhook testing:

```bash
# Install ngrok
npm install -g ngrok

# Start your API server
npm run start:dev

# Expose webhook endpoint
ngrok http 3000

# Update GoCardless webhook URL to:
# https://your-ngrok-url.ngrok.io/integrations/gocardless/webhooks
```

## Production Deployment

### Pre-Launch Checklist

- [ ] Switch to live environment (`GOCARDLESS_ENV=live`)
- [ ] Use live access token
- [ ] Update webhook URL to production domain
- [ ] Generate new encryption key for production
- [ ] Test mandate creation flow
- [ ] Test payment creation
- [ ] Verify webhook delivery
- [ ] Set up monitoring and alerts
- [ ] Document customer support processes

### GoCardless Approval

For production use, you may need GoCardless approval:

1. Complete application in GoCardless Dashboard
2. Provide business details and verification documents
3. Wait for approval (usually 1-2 business days)
4. Once approved, you can collect real payments

### Security Checklist

- [ ] All access tokens encrypted at rest
- [ ] Webhook signature verification enabled
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Regular security reviews scheduled
- [ ] Incident response plan documented

## Common Use Cases

### Use Case 1: Monthly Subscription

```typescript
// 1. Create mandate (one-time)
const { redirectUrl } = await createMandateFlow({
  customerId: 'cus_123',
  scheme: 'bacs',
  successRedirectUrl: 'https://app.com/subscription/success'
});

// 2. Create subscription (after mandate active)
const subscription = await createSubscription({
  mandateId: mandate.id,
  amount: 29.99,
  currency: 'GBP',
  name: 'Monthly Premium Plan',
  intervalUnit: 'monthly',
  dayOfMonth: 1 // Charge on 1st of each month
});

// Payments will be created automatically each month
```

### Use Case 2: Invoice Payment

```typescript
// Customer has active mandate
const payment = await createPayment({
  mandateId: customer.gocardlessMandateId,
  amount: invoice.total,
  currency: invoice.currency,
  reference: invoice.number,
  description: `Payment for invoice ${invoice.number}`,
  metadata: {
    invoiceId: invoice.id,
    customerId: customer.id
  }
});

// Link payment to invoice
await prisma.invoice.update({
  where: { id: invoice.id },
  data: {
    status: 'PENDING_PAYMENT',
    gocardlessPaymentId: payment.id
  }
});
```

### Use Case 3: Variable Amount Subscription

```typescript
// For subscriptions with variable amounts (usage-based):
// Don't use GoCardless subscriptions, use one-off payments instead

// At end of billing period:
const usage = await calculateUsage(customer.id, billingPeriod);

const payment = await createPayment({
  mandateId: customer.gocardlessMandateId,
  amount: usage.totalCost,
  currency: 'GBP',
  reference: `Usage for ${billingPeriod}`,
  chargeDate: addDays(new Date(), 3) // Minimum notice
});
```

### Use Case 4: Failed Payment Retry

```typescript
// Listen for payment failure
@OnEvent('gocardless.payments.failed')
async handlePaymentFailed(event: GoCardlessWebhookEvent) {
  const payment = await getPayment(event.links.payment);

  // Wait 7 days before retry
  const retryDate = addDays(new Date(), 7);

  // Create retry job
  await queue.add('retry-payment', {
    paymentId: payment.id,
    mandateId: payment.mandateId,
    amount: payment.amount,
    retryDate
  });

  // Notify customer
  await sendEmail(customer.email, 'payment-failed', {
    reason: event.details.description,
    retryDate
  });
}
```

## Troubleshooting

### Common Issues

**Issue: "Mandate is not active"**
```typescript
// Solution: Check mandate status
const mandate = await getMandate(mandateId);
console.log('Status:', mandate.status);

// Wait for mandate to become active (usually 3-5 days)
// Or check for mandate failure events
```

**Issue: "Currency mismatch"**
```typescript
// Solution: Ensure currency matches scheme
// BACS = GBP only
// SEPA = EUR only

const payment = await createPayment({
  mandateId: 'MD_BACS_123',
  currency: 'GBP', // ✅ Correct
  // currency: 'EUR', // ❌ Wrong for BACS
  // ...
});
```

**Issue: "Invalid webhook signature"**
```typescript
// Solution: Verify webhook secret matches
// Check GOCARDLESS_WEBHOOK_SECRET in environment
// Regenerate secret in GoCardless dashboard if needed
```

**Issue: "Charge date too soon"**
```typescript
// Solution: Respect minimum payment cycles
// BACS: 3 working days minimum
// SEPA Core: 2 working days minimum

const chargeDate = addWorkingDays(new Date(), 3); // For BACS

const payment = await createPayment({
  chargeDate: chargeDate.toISOString().split('T')[0],
  // ...
});
```

### Debug Mode

Enable detailed logging:

```env
# In .env
LOG_LEVEL=debug
```

### Support Resources

- **GoCardless Support**: support@gocardless.com
- **API Status**: https://status.gocardless.com
- **Documentation**: https://developer.gocardless.com
- **Community**: https://community.gocardless.com

### Monitoring

Set up alerts for:
- Failed payments > 5% of total
- Webhook delivery failures
- Mandate cancellation rate > 10%
- API error rate > 1%

```typescript
// Example monitoring
@Cron('0 9 * * *') // Daily at 9am
async dailyHealthCheck() {
  const stats = await prisma.goCardlessPayment.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: subDays(new Date(), 1)
      }
    },
    _count: true
  });

  const failureRate = stats.find(s => s.status === 'FAILED')?._count || 0;
  const total = stats.reduce((sum, s) => sum + s._count, 0);

  if (total > 0 && (failureRate / total) > 0.05) {
    await alertOps({
      severity: 'high',
      message: `GoCardless failure rate: ${(failureRate/total*100).toFixed(1)}%`
    });
  }
}
```

## Next Steps

1. Review the [README.md](./README.md) for detailed API reference
2. Check the [API documentation](https://developer.gocardless.com/api-reference/)
3. Test in sandbox before going live
4. Set up monitoring and alerts
5. Document your specific integration flows
6. Train support team on Direct Debit processes

## Need Help?

- Check the README.md for API details
- Review GoCardless API docs
- Contact GoCardless support
- Review webhook events in dashboard
