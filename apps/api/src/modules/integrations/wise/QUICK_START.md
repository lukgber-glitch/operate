# Wise Integration - Quick Start Guide

## 5-Minute Setup

### 1. Get API Token

**Sandbox** (for testing):
```bash
1. Go to https://sandbox.transferwise.tech/
2. Sign up for free
3. Navigate to Settings > API tokens
4. Click "Add" and select "Full access"
5. Copy the token
```

**Production**:
```bash
1. Sign up at https://wise.com/business
2. Complete KYC verification (2-3 days)
3. Go to Settings > API tokens
4. Create "Full access" token
5. Copy the token
```

### 2. Configure Environment

Add to your `.env` file:

```bash
# Wise Configuration
WISE_API_TOKEN=your_api_token_here
WISE_SANDBOX=true
WISE_ENCRYPTION_KEY=your_32_character_encryption_key_here

# Generate encryption key:
# openssl rand -base64 32
```

### 3. Import Module

In your `app.module.ts`:

```typescript
import { WiseModule } from './modules/integrations/wise';

@Module({
  imports: [
    // ... other modules
    WiseModule,
  ],
})
export class AppModule {}
```

### 4. Start Server

```bash
npm run start:dev
```

### 5. Test Integration

```bash
# Check health
curl http://localhost:3000/integrations/wise/health

# Get your profile
curl http://localhost:3000/integrations/wise/profiles/business
```

---

## First Transfer in 3 Steps

### Step 1: Create a Quote

```bash
curl -X POST http://localhost:3000/integrations/wise/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCurrency": "EUR",
    "targetCurrency": "USD",
    "sourceAmount": 100
  }'
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "rate": 1.0955,
  "fee": 0.45,
  "targetAmount": 109.10
}
```

### Step 2: Create a Recipient

```bash
curl -X POST http://localhost:3000/integrations/wise/recipients \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "USD",
    "type": "aba",
    "details": {
      "accountHolderName": "John Doe",
      "legalType": "PRIVATE",
      "abartn": "111000025",
      "accountNumber": "12345678",
      "accountType": "CHECKING"
    }
  }'
```

**Response**:
```json
{
  "id": 12345678,
  "accountHolderName": "John Doe",
  "currency": "USD"
}
```

### Step 3: Execute Transfer

```bash
curl -X POST http://localhost:3000/integrations/wise/transfers/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCurrency": "EUR",
    "targetCurrency": "USD",
    "sourceAmount": 100,
    "targetAccount": 12345678,
    "details": {
      "reference": "Test payment"
    }
  }'
```

**Response**:
```json
{
  "quote": { "id": "...", "rate": 1.0955 },
  "transfer": {
    "id": 87654321,
    "status": "processing",
    "sourceValue": 100,
    "targetValue": 109.10
  }
}
```

---

## Common Use Cases

### Check Balance

```bash
curl http://localhost:3000/integrations/wise/balances/EUR/available
```

### Convert Currency

```bash
curl -X POST http://localhost:3000/integrations/wise/balances/convert \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCurrency": "USD",
    "targetCurrency": "EUR",
    "sourceAmount": 100
  }'
```

### List All Transfers

```bash
curl http://localhost:3000/integrations/wise/transfers
```

### Get Transfer Status

```bash
curl http://localhost:3000/integrations/wise/transfers/87654321
```

---

## Supported Transfer Methods by Country

### Europe (SEPA)
```json
{
  "currency": "EUR",
  "type": "iban",
  "details": {
    "accountHolderName": "John Doe",
    "legalType": "PRIVATE",
    "iban": "DE89370400440532013000"
  }
}
```

### United Kingdom
```json
{
  "currency": "GBP",
  "type": "sort_code",
  "details": {
    "accountHolderName": "John Doe",
    "legalType": "PRIVATE",
    "sortCode": "231470",
    "accountNumber": "28821822"
  }
}
```

### United States
```json
{
  "currency": "USD",
  "type": "aba",
  "details": {
    "accountHolderName": "John Doe",
    "legalType": "PRIVATE",
    "abartn": "111000025",
    "accountNumber": "12345678",
    "accountType": "CHECKING"
  }
}
```

### Australia
```json
{
  "currency": "AUD",
  "type": "bsb_code",
  "details": {
    "accountHolderName": "John Doe",
    "legalType": "PRIVATE",
    "bsbCode": "032000",
    "accountNumber": "12345678"
  }
}
```

---

## Webhook Setup

### 1. Set Webhook URL in Wise

1. Go to Wise Settings > Webhooks
2. Add URL: `https://your-domain.com/integrations/wise/webhooks`
3. Select events:
   - `transfers#state-change`
   - `balances#credit`
   - `balances#update`
4. Copy webhook secret

### 2. Add to Environment

```bash
WISE_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Test Webhook (Sandbox)

```bash
curl -X POST http://localhost:3000/integrations/wise/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "transfers#state-change",
    "subscriptionId": "test-123",
    "createdAt": "2024-12-02T10:00:00Z",
    "data": {
      "resource": { "id": 12345678 },
      "current_state": "outgoing_payment_sent",
      "previous_state": "processing"
    }
  }'
```

---

## Troubleshooting

### "Invalid API token"
- Check `WISE_API_TOKEN` in `.env`
- Verify token in Wise Settings > API tokens
- Ensure sandbox mode matches token type

### "No business profile found"
- Set `WISE_PROFILE_ID` in `.env`
- Get profile ID: `GET /integrations/wise/profiles/business`

### "Insufficient balance"
- Check balance: `GET /integrations/wise/balances/EUR/available`
- Top up in Wise dashboard
- In sandbox, balances are unlimited

### "Invalid IBAN"
- Verify IBAN format (DE89370400440532013000)
- Use online IBAN validator
- Check country-specific requirements

---

## Next Steps

1. ✅ Set up API token
2. ✅ Test in sandbox
3. ✅ Create first recipient
4. ✅ Execute test transfer
5. [ ] Set up webhooks
6. [ ] Switch to production
7. [ ] Add to your application workflow

---

## Support

- **Documentation**: See `README.md`
- **API Docs**: https://api-docs.wise.com/
- **Wise Support**: https://wise.com/help/

---

## Security Checklist

- [ ] API token stored in environment variables (not code)
- [ ] Encryption key is 32+ characters
- [ ] Webhook secret configured
- [ ] Using HTTPS in production
- [ ] Rate limiting enabled
- [ ] Audit logging configured
