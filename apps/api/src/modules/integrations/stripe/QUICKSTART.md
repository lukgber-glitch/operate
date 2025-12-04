# Stripe Connect - Quick Start Guide

Get up and running with Stripe Connect in 5 minutes.

## 1. Install Dependencies ✅

Already completed - `stripe` package installed (v20.0.0)

## 2. Database Setup

Run the migration to create required tables:

```bash
# From project root
psql -U your_user -d your_database -f apps/api/src/modules/integrations/stripe/prisma-schema.sql
```

This creates 4 tables:
- `stripe_connect_accounts`
- `stripe_payments`
- `stripe_audit_logs`
- `stripe_webhook_logs`

## 3. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click "Developers" → "API keys"
3. Copy your **Publishable key** (pk_test_xxx)
4. Reveal and copy your **Secret key** (sk_test_xxx)

## 4. Configure Environment Variables

Add to your `.env` file:

```bash
# Stripe Keys (required)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Optional settings
STRIPE_SANDBOX=true  # Set to false for production
STRIPE_PLATFORM_FEE_PERCENT=2.5  # Default platform fee
```

**Note**: You'll get the webhook secret in step 6.

## 5. Register the Module

In your main app module (`apps/api/src/app.module.ts`):

```typescript
import { StripeModule } from './modules/integrations/stripe';

@Module({
  imports: [
    // ... your other modules
    StripeModule,
  ],
})
export class AppModule {}
```

## 6. Configure Webhooks

### Setup Webhook Endpoint in Stripe

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter endpoint URL: `https://yourdomain.com/integrations/stripe/webhooks`
   - For local testing: Use ngrok or Stripe CLI
4. Select events to listen for (or "Select all events")
5. Click "Add endpoint"
6. Copy the **Signing secret** (whsec_xxx)
7. Add to `.env` as `STRIPE_WEBHOOK_SECRET`

### Configure Raw Body Parsing

In your `main.ts`, add this BEFORE `app.use(express.json())`:

```typescript
import * as express from 'express';

// ... other code

// IMPORTANT: Add this BEFORE express.json()
app.use(
  '/integrations/stripe/webhooks',
  express.raw({ type: 'application/json' })
);

// Then add your normal middleware
app.use(express.json());
```

## 7. Test the Integration

### Start Your Server

```bash
npm run dev
# or
pnpm dev
```

### Test Webhook Locally with Stripe CLI

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/integrations/stripe/webhooks
```

### Create a Test Connect Account

```bash
curl -X POST http://localhost:3000/integrations/stripe/connect/accounts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "express",
    "email": "merchant@test.com",
    "country": "US"
  }'
```

### Create a Test Payment

```bash
curl -X POST http://localhost:3000/integrations/stripe/payments/intents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency": "USD",
    "description": "Test payment"
  }'
```

## 8. Test Cards

Use these test cards in Stripe test mode:

| Card Number | Description |
|------------|-------------|
| 4242 4242 4242 4242 | Visa - Success |
| 4000 0025 0000 3155 | Visa - Requires authentication |
| 4000 0000 0000 9995 | Visa - Declined |

Any future expiration date and any 3-digit CVC will work.

## 9. Check It Works

### Verify Tables Created

```sql
SELECT COUNT(*) FROM stripe_connect_accounts;
SELECT COUNT(*) FROM stripe_payments;
SELECT COUNT(*) FROM stripe_audit_logs;
```

### Check Audit Logs

```sql
SELECT action, metadata, created_at
FROM stripe_audit_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Check Webhook Logs

```sql
SELECT event_type, status, created_at
FROM stripe_webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

## 10. View API Documentation

Once your server is running, visit:

```
http://localhost:3000/api
```

You'll see all Stripe endpoints with interactive Swagger UI.

## Common Issues

### Issue: "Webhook signature verification failed"

**Solution**:
1. Make sure raw body is configured correctly in `main.ts`
2. Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
3. Verify endpoint URL is correct in Stripe Dashboard

### Issue: "Invalid or missing STRIPE_SECRET_KEY"

**Solution**:
1. Check `.env` file has correct keys
2. Verify keys start with `sk_test_` or `sk_live_`
3. Restart your server after adding keys

### Issue: Tables not created

**Solution**:
```bash
# Manually run the migration
psql -U your_user -d your_database -f apps/api/src/modules/integrations/stripe/prisma-schema.sql
```

## Next Steps

1. **Production Setup**:
   - Get production API keys from Stripe
   - Set `STRIPE_SANDBOX=false`
   - Update webhook endpoint to production URL

2. **Connect Account Onboarding**:
   - Create onboarding links for merchants
   - Test the full Connect flow
   - Configure payout schedules

3. **Payment Flow**:
   - Implement client-side Stripe.js
   - Create payment forms
   - Handle 3D Secure authentication

4. **Platform Fees**:
   - Adjust `STRIPE_PLATFORM_FEE_PERCENT`
   - Test split payments
   - Verify fee calculations

5. **Monitoring**:
   - Set up alerts for failed webhooks
   - Monitor audit logs regularly
   - Check payment success rates

## Resources

- [Full Documentation](./README.md)
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)

## Support

If you encounter issues:
1. Check the [README.md](./README.md) for detailed documentation
2. Review Stripe Dashboard logs
3. Check database audit logs
4. Consult Stripe documentation

---

**You're all set! 🚀**

Start building your platform with Stripe Connect.
