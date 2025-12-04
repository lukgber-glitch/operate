# Stripe Connect Integration

Complete Stripe Connect integration for Operate/CoachOS platform, supporting global payment processing with platform fees and multi-currency support.

## Features

### Stripe Connect
- **Express Accounts**: Simplified onboarding for merchants
- **Standard Accounts**: Full OAuth Connect flow support
- **Account Management**: Create, update, and delete Connect accounts
- **Onboarding Links**: Generate secure onboarding URLs
- **Status Tracking**: Monitor account verification status
- **Capabilities**: Track payment and payout capabilities
- **Balance Retrieval**: Check account balances

### Payment Processing
- **Payment Intents**: Create and manage payment intents
- **Platform Fees**: Automatic or custom platform fee calculation
- **Split Payments**: Route payments to connected accounts with fees
- **Multi-Currency**: Support for USD, EUR, GBP, CHF, and more
- **Idempotency**: Built-in idempotency keys for safe retries
- **Manual/Automatic Capture**: Flexible payment capture modes

### Transfers & Refunds
- **Direct Transfers**: Transfer funds to connected accounts
- **Refunds**: Full or partial refunds with optional transfer reversal
- **Application Fee Refunds**: Refund platform fees if needed

### Webhooks
- **Signature Verification**: Mandatory webhook signature validation
- **Event Processing**: Handle 15+ Stripe event types
- **Idempotent Handling**: Safe to retry webhook processing
- **Audit Logging**: Complete audit trail for all events

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Required
STRIPE_SECRET_KEY=sk_test_xxx  # or sk_live_xxx for production
STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # or pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Optional
STRIPE_SANDBOX=true  # Set to false for production
STRIPE_PLATFORM_FEE_PERCENT=2.5  # Default platform fee percentage
```

### 2. Database Schema

Run the migration to create required tables:

```bash
# Apply the schema from prisma-schema.sql
psql -d your_database -f apps/api/src/modules/integrations/stripe/prisma-schema.sql
```

Tables created:
- `stripe_connect_accounts` - Connected account information
- `stripe_payments` - Payment intent records
- `stripe_audit_logs` - Audit trail for operations
- `stripe_webhook_logs` - Webhook event logs

### 3. Register Module

Add to your main app module:

```typescript
import { StripeModule } from './modules/integrations/stripe';

@Module({
  imports: [
    // ... other modules
    StripeModule,
  ],
})
export class AppModule {}
```

### 4. Configure Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/integrations/stripe/webhooks`
3. Select events to listen for (or select "Select all events")
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

**Important**: Your API must accept raw body for webhook signature verification. Configure in `main.ts`:

```typescript
app.use(
  '/integrations/stripe/webhooks',
  express.raw({ type: 'application/json' })
);
```

## Usage

### Create a Connect Account

```typescript
POST /integrations/stripe/connect/accounts

{
  "type": "express",  // or "standard"
  "email": "merchant@example.com",
  "country": "US",
  "businessProfile": {
    "name": "Merchant Business",
    "productDescription": "Online services",
    "supportEmail": "support@example.com",
    "url": "https://merchant.example.com"
  }
}
```

### Create Onboarding Link

```typescript
POST /integrations/stripe/connect/accounts/:accountId/onboarding

{
  "refreshUrl": "https://yourapp.com/connect/refresh",
  "returnUrl": "https://yourapp.com/connect/return"
}
```

### Create Payment Intent

```typescript
POST /integrations/stripe/payments/intents

{
  "amount": 10000,  // $100.00 in cents
  "currency": "USD",
  "connectedAccountId": "acct_xxx",  // Optional, for Connect payments
  "platformFeePercent": 2.5,  // Optional, defaults to config value
  "description": "Payment for services",
  "metadata": {
    "orderId": "order_123"
  }
}
```

### Create Transfer

```typescript
POST /integrations/stripe/transfers

{
  "amount": 5000,  // $50.00 in cents
  "currency": "USD",
  "destinationAccountId": "acct_xxx",
  "description": "Transfer for services",
  "sourceTransaction": "ch_xxx"  // Optional
}
```

### Create Refund

```typescript
POST /integrations/stripe/refunds

{
  "paymentIntentId": "pi_xxx",
  "amount": 5000,  // Optional, full refund if not specified
  "reason": "requested_by_customer",
  "reverseTransfer": true,  // Reverse transfer to connected account
  "refundApplicationFee": true  // Refund platform fee
}
```

## API Endpoints

### Connect Accounts
- `POST /integrations/stripe/connect/accounts` - Create account
- `GET /integrations/stripe/connect/accounts/:accountId` - Get account
- `GET /integrations/stripe/connect/accounts` - Get current user's account
- `DELETE /integrations/stripe/connect/accounts/:accountId` - Delete account
- `POST /integrations/stripe/connect/accounts/:accountId/onboarding` - Create onboarding link
- `POST /integrations/stripe/connect/accounts/:accountId/update-link` - Create update link
- `POST /integrations/stripe/connect/accounts/:accountId/payouts/configure` - Configure payouts
- `GET /integrations/stripe/connect/accounts/:accountId/balance` - Get balance
- `GET /integrations/stripe/connect/accounts/:accountId/capabilities` - Check capabilities

### Payments
- `POST /integrations/stripe/payments/intents` - Create payment intent
- `GET /integrations/stripe/payments/intents/:paymentIntentId` - Get payment intent
- `POST /integrations/stripe/payments/intents/:paymentIntentId/confirm` - Confirm payment
- `POST /integrations/stripe/payments/intents/:paymentIntentId/cancel` - Cancel payment

### Transfers & Refunds
- `POST /integrations/stripe/transfers` - Create transfer
- `POST /integrations/stripe/refunds` - Create refund

### Webhooks
- `POST /integrations/stripe/webhooks` - Handle webhook events

## Webhook Events

The integration handles these Stripe events:

**Connect Account Events:**
- `account.updated` - Account status/capabilities changed
- `account.application.authorized` - OAuth authorization
- `account.application.deauthorized` - OAuth deauthorization

**Payment Events:**
- `payment_intent.succeeded` - Payment successful
- `payment_intent.payment_failed` - Payment failed
- `payment_intent.canceled` - Payment canceled
- `charge.succeeded` - Charge successful
- `charge.failed` - Charge failed
- `charge.refunded` - Charge refunded

**Transfer Events:**
- `transfer.created` - Transfer initiated
- `transfer.failed` - Transfer failed
- `transfer.reversed` - Transfer reversed

**Payout Events:**
- `payout.created` - Payout initiated
- `payout.paid` - Payout completed
- `payout.failed` - Payout failed
- `payout.canceled` - Payout canceled

## Multi-Currency Support

Supported currencies:
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- CHF (Swiss Franc)
- AUD (Australian Dollar)
- CAD (Canadian Dollar)
- JPY (Japanese Yen)
- CNY (Chinese Yuan)
- INR (Indian Rupee)
- SGD (Singapore Dollar)
- HKD (Hong Kong Dollar)

## Security

### API Key Management
- Secret keys stored in environment variables
- Never expose secret keys in client-side code
- Use publishable keys for client-side Stripe.js

### Webhook Security
- Mandatory signature verification for all webhooks
- Raw body required for signature validation
- Events are idempotent (safe to retry)

### Payment Security
- Idempotency keys for all payment operations
- Full audit logging for compliance
- Support for 3D Secure authentication
- PCI DSS compliant (handled by Stripe)

### Data Protection
- No credit card data stored locally
- Stripe handles all sensitive data
- Metadata encrypted at rest by Stripe

## Platform Fee Calculation

Default platform fee: 2.5% (configurable)

```typescript
// Automatic calculation
const platformFee = calculatePlatformFee(10000, 2.5);
// Returns: 250 (2.5% of $100.00)

// Custom fee per transaction
{
  "amount": 10000,
  "platformFeePercent": 5.0  // 5% for this transaction
}

// Fixed fee amount
{
  "amount": 10000,
  "platformFeeAmount": 500  // $5.00 fixed fee
}
```

## Error Handling

The integration handles these Stripe error types:
- `StripeCardError` - Card declined or invalid
- `StripeRateLimitError` - Too many requests
- `StripeInvalidRequestError` - Invalid parameters
- `StripeAPIError` - Stripe API error
- `StripeConnectionError` - Network error
- `StripeAuthenticationError` - Invalid API key

All errors are logged and converted to appropriate HTTP exceptions.

## Testing

### Test Mode
Set `STRIPE_SANDBOX=true` to use Stripe test mode.

### Test Cards
Use Stripe test cards: https://stripe.com/docs/testing

```
4242 4242 4242 4242 - Visa (success)
4000 0025 0000 3155 - Visa (requires authentication)
4000 0000 0000 9995 - Visa (declined)
```

### Webhook Testing
Use Stripe CLI to forward webhooks to localhost:

```bash
stripe listen --forward-to localhost:3000/integrations/stripe/webhooks
```

## Monitoring

### Audit Logs
All operations are logged to `stripe_audit_logs` table with:
- User ID
- Action type
- Metadata (amounts, IDs, etc.)
- Timestamp
- Duration

### Webhook Logs
All webhook events are logged to `stripe_webhook_logs` with:
- Event ID and type
- Processing status
- Error messages (if failed)
- Timestamp

## Production Checklist

- [ ] Set `STRIPE_SANDBOX=false`
- [ ] Use production API keys (sk_live_xxx, pk_live_xxx)
- [ ] Configure production webhook endpoint
- [ ] Test webhook signature verification
- [ ] Enable webhook event filtering
- [ ] Set up monitoring and alerts
- [ ] Review platform fee percentage
- [ ] Test multi-currency support
- [ ] Verify audit logging
- [ ] Test refund flows
- [ ] Configure payout schedules
- [ ] Test account onboarding flow

## Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Platform Fee Best Practices](https://stripe.com/docs/connect/charges#application-fee)

## Support

For issues or questions:
1. Check Stripe Dashboard for detailed error logs
2. Review audit logs in database
3. Check webhook logs for processing errors
4. Consult Stripe documentation
5. Contact Stripe support for platform-specific issues
