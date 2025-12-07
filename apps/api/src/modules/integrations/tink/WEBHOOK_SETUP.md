# Tink Webhook Setup Guide

## Overview

The Tink webhook controller enables real-time synchronization of bank transactions and account balances. When Tink detects new transactions or balance changes, it sends webhooks to your application for immediate processing.

## Features

- **Real-time Transaction Sync**: New transactions are synced immediately via webhooks
- **Balance Updates**: Account balances are updated in real-time
- **Automatic Classification**: New transactions trigger the classification pipeline automatically
- **Idempotency**: Duplicate webhook events are safely ignored
- **Security**: HMAC-SHA256 signature verification ensures webhook authenticity
- **Rate Limiting**: Protection against webhook flooding (200 req/min)

## Configuration

### 1. Environment Variables

Add to your `.env` file:

```bash
# Tink Webhook Secret (provided by Tink dashboard)
TINK_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Database Migration

Run the migration to create the webhook events table:

```bash
# From apps/api/src/modules/integrations/tink/migrations/
psql $DATABASE_URL -f 001_create_tink_webhook_events_table.sql
```

Or use Prisma if you add it to your schema:

```prisma
model TinkWebhookEvent {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  eventId   String   @unique @map("event_id") @db.VarChar(500)
  eventType String   @map("event_type") @db.VarChar(100)
  userId    String   @map("user_id") @db.VarChar(255)
  payload   Json     @db.JsonB
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  @@index([eventId], map: "idx_tink_webhook_events_event_id")
  @@index([eventType], map: "idx_tink_webhook_events_type")
  @@index([userId], map: "idx_tink_webhook_events_user")
  @@index([createdAt], map: "idx_tink_webhook_events_created_at")
  @@map("tink_webhook_events")
}
```

### 3. Configure Tink Webhook URL

In your Tink dashboard:

1. Go to **Webhooks** section
2. Add webhook endpoint:
   - **URL**: `https://yourdomain.com/webhooks/tink`
   - **Events**: Select the events you want to receive:
     - `transaction:created`
     - `transaction:updated`
     - `account:balance_updated`
     - `credentials:updated`
     - `credentials:refresh_failed`
3. Copy the **Webhook Secret** and add it to your `.env` as `TINK_WEBHOOK_SECRET`

## Webhook Events

### Transaction Events

#### `transaction:created`
Triggered when a new transaction is detected in a user's bank account.

**Payload Example:**
```json
{
  "eventType": "transaction:created",
  "userId": "tink-user-123",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "transaction": {
      "id": "trans-456",
      "accountId": "acc-789",
      "amount": {
        "value": { "unscaledValue": -2500, "scale": 2 },
        "currencyCode": "EUR"
      },
      "dates": {
        "booked": "2024-01-15"
      },
      "descriptions": {
        "original": "AMZN MKTP DE",
        "display": "Amazon Marketplace"
      },
      "merchantInformation": {
        "merchantName": "Amazon",
        "merchantCategoryCode": "5942"
      },
      "status": "BOOKED",
      "types": {
        "type": "PAYMENT"
      }
    }
  }
}
```

**Actions:**
- Transaction is synced to `bank_transactions_new` table
- Triggers automatic classification pipeline
- Emits `tink.transaction.synced` event
- Emits `transaction.needs.classification` event (high priority)

#### `transaction:updated`
Triggered when an existing transaction is modified.

**Actions:**
- Transaction data is updated in database
- Metadata is preserved and merged
- Emits `tink.transaction.synced` event

### Account Events

#### `account:balance_updated`
Triggered when an account balance changes.

**Payload Example:**
```json
{
  "eventType": "account:balance_updated",
  "userId": "tink-user-123",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "account": {
      "id": "acc-789",
      "name": "Checking Account",
      "type": "CHECKING",
      "balances": {
        "booked": {
          "amount": {
            "value": { "unscaledValue": 125000, "scale": 2 },
            "currencyCode": "EUR"
          }
        },
        "available": {
          "amount": {
            "value": { "unscaledValue": 120000, "scale": 2 },
            "currencyCode": "EUR"
          }
        }
      },
      "dates": {
        "lastRefreshed": "2024-01-15T10:30:00Z"
      }
    }
  }
}
```

**Actions:**
- Updates `bank_accounts.balance` and `available_balance`
- Updates `last_synced_at` timestamp
- Emits `tink.account.balance.updated` event for real-time UI updates

### Credentials Events

#### `credentials:refresh_failed`
Triggered when Tink fails to refresh a user's bank connection.

**Actions:**
- Logs audit entry
- Emits `tink.credentials.refresh.failed` event
- Application should notify user to re-authenticate

## Event Flow

### New Transaction Flow

```
1. Bank posts new transaction
   ↓
2. Tink detects transaction
   ↓
3. Tink sends webhook to /webhooks/tink
   ↓
4. Webhook controller verifies signature
   ↓
5. Check for duplicate event (idempotency)
   ↓
6. Store event in tink_webhook_events
   ↓
7. Upsert transaction in bank_transactions_new
   ↓
8. Emit tink.transaction.synced event
   ↓
9. Emit transaction.needs.classification event
   ↓
10. TransactionPipelineService picks up event
    ↓
11. Auto-categorizes transaction
    ↓
12. Applies tax deduction suggestions
    ↓
13. Emits transaction.classified event
    ↓
14. Real-time UI update via WebSocket
```

## Events Emitted

The webhook controller emits the following events for other parts of the system:

### `tink.transaction.synced`
```typescript
{
  transactionId: string;      // Internal transaction ID
  orgId: string;              // Organization ID
  accountId: string;          // Bank account ID
  isNew: boolean;             // true if transaction:created
  timestamp: Date;
}
```

### `transaction.needs.classification`
```typescript
{
  transactionId: string;      // Internal transaction ID
  orgId: string;              // Organization ID
  priority: 'high' | 'normal'; // Webhook events = high priority
}
```

### `tink.account.balance.updated`
```typescript
{
  accountId: string;          // Internal account ID
  orgId: string;              // Organization ID
  bookedBalance: number;      // Current booked balance
  availableBalance: number;   // Available balance
  timestamp: Date;
}
```

### `tink.credentials.refresh.failed`
```typescript
{
  orgId: string;              // Organization ID
  userId: string;             // User ID
  credentialsId: string;      // Tink credentials ID
  reason: any;                // Failure details
  timestamp: Date;
}
```

## Security

### Signature Verification

All webhook events are verified using HMAC-SHA256:

```typescript
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('hex');

// Constant-time comparison to prevent timing attacks
crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(expectedSignature)
);
```

### Rate Limiting

Webhooks are rate-limited to 200 requests per minute per IP to prevent abuse.

### Idempotency

Each webhook event has a unique `event_id` composed of:
```
{eventType}_{userId}_{timestamp}
```

Duplicate events are safely ignored to prevent double-processing.

## Testing

### Local Testing with ngrok

1. Start your API server:
   ```bash
   npm run dev
   ```

2. Expose local server with ngrok:
   ```bash
   ngrok http 3000
   ```

3. Configure Tink webhook URL:
   ```
   https://your-subdomain.ngrok.io/webhooks/tink
   ```

4. Trigger test events from Tink dashboard

### Manual Webhook Testing

You can manually test webhooks using curl:

```bash
# Calculate HMAC signature
SECRET="your_webhook_secret"
PAYLOAD='{"eventType":"transaction:created","userId":"test-user","timestamp":"2024-01-15T10:30:00Z","data":{"transaction":{...}}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

# Send webhook
curl -X POST https://localhost:3000/webhooks/tink \
  -H "Content-Type: application/json" \
  -H "x-tink-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

## Monitoring

### Webhook Event Logs

Query recent webhook events:

```sql
SELECT
  event_id,
  event_type,
  user_id,
  created_at,
  payload->>'timestamp' as webhook_timestamp
FROM tink_webhook_events
ORDER BY created_at DESC
LIMIT 100;
```

### Failed Webhook Processing

Check application logs for errors:

```bash
# From logs
grep "Failed to process Tink webhook" logs/api.log
```

### Audit Logs

Tink webhook processing is logged in the audit table:

```sql
SELECT *
FROM tink_audit_logs
WHERE action IN ('webhook:received', 'credentials:refresh_failed')
ORDER BY timestamp DESC
LIMIT 50;
```

## Troubleshooting

### Webhooks Not Received

1. **Check webhook URL** in Tink dashboard matches your deployed URL
2. **Verify firewall** allows incoming connections from Tink IPs
3. **Check TINK_WEBHOOK_SECRET** is correctly configured
4. **Review Tink webhook logs** in their dashboard for delivery failures

### Signature Verification Failing

1. **Ensure TINK_WEBHOOK_SECRET** matches the secret in Tink dashboard
2. **Check raw body** is being passed to signature verification (not parsed JSON)
3. **Verify no middleware** is modifying the request body before webhook controller

### Duplicate Events

This is expected and handled automatically by the idempotency check. Tink may send the same event multiple times to ensure delivery.

### Missing Transactions

1. **Check webhook events** are being received (query `tink_webhook_events`)
2. **Verify bank account** exists with matching `externalId`
3. **Check Tink credentials** exist for the `userId` in webhook
4. **Review error logs** for transaction processing failures

## Performance

- **Webhook processing time**: ~50-200ms average
- **Signature verification**: ~1-5ms
- **Database operations**: ~20-50ms
- **Event emission**: ~5-10ms

## Best Practices

1. **Always verify signatures** - Never process unverified webhooks
2. **Handle idempotency** - Tink may send duplicate events
3. **Return 200 quickly** - Process events asynchronously if needed
4. **Log everything** - Webhook events should be stored for debugging
5. **Monitor failures** - Alert on credentials refresh failures
6. **Test thoroughly** - Use ngrok for local testing before production

## References

- [Tink Webhooks Documentation](https://docs.tink.com/api/webhooks)
- [Tink Event Types](https://docs.tink.com/api/webhooks#event-types)
- [HMAC Signature Verification](https://docs.tink.com/api/webhooks#signature-verification)
