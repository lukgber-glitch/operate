# GoCardless Direct Debit Integration

Complete integration for UK and EU Direct Debit payment collection via GoCardless.

## Overview

This module provides a comprehensive GoCardless integration for Operate/CoachOS, enabling businesses to collect recurring and one-off payments via Direct Debit.

### Supported Payment Schemes

| Scheme | Region | Currency | Payment Cycle | Best For |
|--------|--------|----------|---------------|----------|
| **BACS** | UK | GBP | 3 working days | UK businesses |
| **SEPA Core** | EU | EUR | 2 working days | EU businesses |
| **SEPA COR1** | EU | EUR | 1 working day | Faster EU payments |
| **Autogiro** | Sweden | SEK | 2 working days | Swedish businesses |
| **Betalingsservice** | Denmark | DKK | 1 working day | Danish businesses |
| **PAD** | Canada | CAD | 2 working days | Canadian businesses |

## Features

### ✅ Mandate Management
- Create Direct Debit mandates via redirect flow
- Support for BACS (UK) and SEPA (EU) schemes
- Automatic scheme selection based on country
- Mandate status tracking and updates
- Cancel and reinstate mandates

### ✅ Payment Collection
- One-off payments against mandates
- Recurring subscriptions (weekly, monthly, yearly)
- Automatic payment retry for failures
- Payment status tracking
- Idempotency key support

### ✅ Customer Management
- Link Operate customers to GoCardless customers
- Bank account management
- Customer details synchronization

### ✅ Webhook Processing
- Real-time event notifications
- HMAC-SHA256 signature verification
- Automatic status updates
- Duplicate event prevention
- Comprehensive event logging

### ✅ Security
- AES-256-GCM encrypted access token storage
- Webhook signature verification mandatory
- Idempotency keys for payment creation
- Rate limiting on all endpoints
- Comprehensive audit logging

## Architecture

```
gocardless/
├── gocardless.module.ts           # NestJS module
├── gocardless.config.ts           # Configuration
├── gocardless.service.ts          # Core service
├── gocardless.controller.ts       # REST API endpoints
├── gocardless-webhook.controller.ts # Webhook handler
├── gocardless.types.ts            # TypeScript types
├── services/
│   ├── gocardless-auth.service.ts     # Authentication & token management
│   ├── gocardless-mandate.service.ts  # Mandate operations
│   ├── gocardless-payment.service.ts  # Payment operations
│   └── gocardless-customer.service.ts # Customer operations
└── dto/
    ├── create-mandate-flow.dto.ts
    ├── create-payment.dto.ts
    └── create-subscription.dto.ts
```

## Setup

### 1. Environment Variables

```env
# GoCardless Configuration
GOCARDLESS_ACCESS_TOKEN=your_access_token_here
GOCARDLESS_ENV=sandbox  # or 'live'
GOCARDLESS_WEBHOOK_SECRET=your_webhook_secret
GOCARDLESS_WEBHOOK_URL=https://your-domain.com/integrations/gocardless/webhooks
GOCARDLESS_REDIRECT_URI=https://your-domain.com/integrations/gocardless/callback

# Encryption (generate with: openssl rand -hex 32)
GOCARDLESS_ENCRYPTION_KEY=64_character_hex_string_here

# Optional: Mock mode for testing
GOCARDLESS_MOCK_MODE=false
```

### 2. Database Setup

Add the models from `packages/database/prisma/gocardless-schema.prisma` to your main `schema.prisma` file, then run:

```bash
pnpm prisma migrate dev --name add_gocardless_integration
```

### 3. Webhook Configuration

1. Go to GoCardless Dashboard > Developers > Webhooks
2. Add webhook URL: `https://your-domain.com/integrations/gocardless/webhooks`
3. Copy the webhook secret to `GOCARDLESS_WEBHOOK_SECRET`

## Usage

### Creating a Mandate

**Step 1: Initiate Redirect Flow**

```typescript
POST /integrations/gocardless/mandates/create-flow?orgId={orgId}

{
  "customerId": "cus_123",
  "scheme": "bacs",
  "successRedirectUrl": "https://your-app.com/success",
  "description": "Monthly subscription payment"
}

Response:
{
  "redirectUrl": "https://pay.gocardless.com/flow/RE123",
  "redirectFlowId": "RE123"
}
```

**Step 2: Redirect customer to `redirectUrl`**

The customer will authorize the Direct Debit mandate on GoCardless's secure pages.

**Step 3: Complete the flow**

After customer returns to your `successRedirectUrl`, complete the flow:

```typescript
POST /integrations/gocardless/mandates/complete-flow/{redirectFlowId}

Response: GoCardlessMandate object
```

### Creating a One-Off Payment

```typescript
POST /integrations/gocardless/payments?orgId={orgId}&userId={userId}

{
  "mandateId": "MD000123",
  "amount": 100.00,
  "currency": "GBP",
  "chargeDate": "2025-12-10",
  "reference": "INV-2025-001",
  "description": "Invoice payment for December 2025"
}
```

### Creating a Subscription

```typescript
POST /integrations/gocardless/subscriptions?orgId={orgId}&userId={userId}

{
  "mandateId": "MD000123",
  "amount": 50.00,
  "currency": "GBP",
  "name": "Monthly Premium Subscription",
  "intervalUnit": "monthly",
  "interval": 1,
  "dayOfMonth": 1,
  "startDate": "2025-12-01"
}
```

### Webhook Events

The integration automatically handles these webhook events:

**Mandate Events:**
- `created`, `submitted`, `active` - Mandate lifecycle
- `failed`, `cancelled`, `expired` - Mandate failures
- `reinstated` - Mandate reactivation

**Payment Events:**
- `created`, `submitted`, `confirmed` - Payment lifecycle
- `paid_out` - Funds transferred to merchant
- `failed`, `cancelled`, `charged_back` - Payment failures

**Subscription Events:**
- `payment_created` - Recurring payment created
- `cancelled`, `finished` - Subscription lifecycle

**Payout Events:**
- `paid` - Funds paid out to merchant bank

## Payment Cycle Timeline

### BACS (UK)
```
Day 0: Payment created
Day 1: Payment submitted to bank
Day 2: Processing
Day 3: Funds collected
Day 5: Payout to merchant
```

### SEPA Core (EU)
```
Day 0: Payment created
Day 1: Payment submitted
Day 2: Funds collected
Day 4: Payout to merchant
```

### SEPA COR1 (EU - Faster)
```
Day 0: Payment created
Day 1: Funds collected
Day 3: Payout to merchant
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Mandate is not active` | Mandate not yet active or cancelled | Check mandate status |
| `Currency mismatch` | Currency doesn't match scheme | Use GBP for BACS, EUR for SEPA |
| `Invalid webhook signature` | Incorrect webhook secret | Verify GOCARDLESS_WEBHOOK_SECRET |
| `Payment failed` | Insufficient funds, account closed | Retry payment or notify customer |

## Testing

### Sandbox Mode

GoCardless provides a sandbox environment for testing:

1. Create sandbox account at https://manage-sandbox.gocardless.com
2. Set `GOCARDLESS_ENV=sandbox`
3. Use test bank accounts from GoCardless documentation

### Test Bank Details

For BACS testing:
- Sort Code: `20-00-00`
- Account Number: `55779911`
- Account Holder: `Test User`

For SEPA testing:
- IBAN: `GB33BUKB20201555779911`

## Security Considerations

1. **Access Token Storage**: All access tokens are encrypted using AES-256-GCM before storage
2. **Webhook Verification**: All webhooks must have valid HMAC-SHA256 signatures
3. **Idempotency**: Payment creation uses idempotency keys to prevent duplicates
4. **Rate Limiting**: All endpoints are rate-limited to prevent abuse
5. **Audit Logging**: All operations are logged for compliance

## API Reference

### Mandate Endpoints
- `POST /mandates/create-flow` - Initiate mandate creation
- `POST /mandates/complete-flow/:id` - Complete mandate creation
- `GET /mandates/:id` - Get mandate details
- `GET /customers/:id/mandates` - List customer mandates
- `DELETE /mandates/:id` - Cancel mandate
- `POST /mandates/:id/reinstate` - Reinstate cancelled mandate

### Payment Endpoints
- `POST /payments` - Create one-off payment
- `GET /payments/:id` - Get payment details
- `GET /mandates/:id/payments` - List mandate payments
- `GET /organizations/:id/payments` - List organization payments
- `DELETE /payments/:id` - Cancel payment
- `POST /payments/:id/retry` - Retry failed payment

### Subscription Endpoints
- `POST /subscriptions` - Create subscription
- `DELETE /subscriptions/:id` - Cancel subscription

### Customer Endpoints
- `POST /customers/:id/create` - Create GoCardless customer
- `GET /customers/:id/details` - Get customer details
- `GET /customers/:id/bank-accounts` - List bank accounts

## Best Practices

1. **Always use redirect flow** for mandate creation - it handles customer authentication securely
2. **Store mandate IDs** - you'll need them for creating payments
3. **Handle webhooks** - don't poll for status, use webhooks for real-time updates
4. **Validate currencies** - ensure currency matches the scheme (GBP for BACS, EUR for SEPA)
5. **Set appropriate charge dates** - respect minimum payment cycles (3 days for BACS, 2 for SEPA)
6. **Implement retry logic** - failed payments can often be retried successfully

## Support

- **GoCardless API Docs**: https://developer.gocardless.com/api-reference/
- **GoCardless Dashboard**: https://manage.gocardless.com (live) or https://manage-sandbox.gocardless.com (sandbox)
- **Status Page**: https://status.gocardless.com/

## License

Part of Operate/CoachOS - All rights reserved
