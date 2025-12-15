# TrueLayer Payment Initiation Service (PIS) - Usage Guide

## Overview

The TrueLayer PIS integration enables secure Open Banking payments directly from your application. Users can initiate payments from their bank accounts to pay bills, expenses, invoices, or taxes.

## Features

✅ **Single Immediate Payments** - Initiate one-time payments via Open Banking
✅ **Multi-Currency Support** - GBP, EUR, and other currencies
✅ **Sandbox Mode** - Full sandbox/mock implementation for testing
✅ **Payment Tracking** - Real-time status updates
✅ **Source Linking** - Link payments to bills, expenses, invoices, or tax obligations
✅ **Security** - OAuth2 authorization flow, audit logging, IP tracking

## API Endpoints

### 1. Create Payment

```http
POST /integrations/truelayer/payments
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "amount": 150.00,
  "currency": "GBP",
  "beneficiaryName": "ACME Corporation Ltd",
  "beneficiaryIban": "GB29NWBK60161331926819",
  "reference": "Invoice INV-2024-001",
  "description": "Payment for consulting services",
  "sourceType": "INVOICE",
  "invoiceId": "uuid-of-invoice"
}
```

**Response:**
```json
{
  "paymentId": "pay_abc123",
  "truelayerPaymentId": "tl_payment_xyz789",
  "authorizationUri": "https://payment.truelayer.com/...",
  "status": "AUTHORIZATION_REQUIRED",
  "expiresAt": "2024-12-14T12:30:00Z"
}
```

**Status Flow:**
1. `PENDING` - Payment created
2. `AUTHORIZATION_REQUIRED` - User must authorize via bank
3. `AUTHORIZING` - User is authorizing
4. `AUTHORIZED` - Authorization complete
5. `EXECUTED` - Payment executed by bank
6. `SETTLED` - Funds settled

### 2. Get Payment Status

```http
GET /integrations/truelayer/payments/:paymentId
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "paymentId": "pay_abc123",
  "truelayerPaymentId": "tl_payment_xyz789",
  "status": "EXECUTED",
  "amount": 150.00,
  "currency": "GBP",
  "beneficiaryName": "ACME Corporation Ltd",
  "reference": "Invoice INV-2024-001",
  "createdAt": "2024-12-14T12:00:00Z",
  "authorizedAt": "2024-12-14T12:05:00Z",
  "executedAt": "2024-12-14T12:10:00Z"
}
```

### 3. List Payments

```http
GET /integrations/truelayer/payments?status=EXECUTED&sourceType=INVOICE&limit=50
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `status` - Filter by status (optional)
- `sourceType` - Filter by source type: BILL, EXPENSE, INVOICE, TAX, MANUAL (optional)
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "payments": [
    {
      "paymentId": "pay_abc123",
      "status": "EXECUTED",
      "amount": 150.00,
      "currency": "GBP",
      "beneficiaryName": "ACME Corporation Ltd",
      "createdAt": "2024-12-14T12:00:00Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

### 4. Cancel Payment

```http
DELETE /integrations/truelayer/payments/:paymentId
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "reason": "User cancelled payment"
}
```

**Response:** `204 No Content`

**Note:** Can only cancel payments with status `PENDING` or `AUTHORIZATION_REQUIRED`.

## Account Details Formats

### UK Bank Account

```json
{
  "beneficiaryName": "John Smith",
  "beneficiarySortCode": "12-34-56",
  "beneficiaryAccountNumber": "12345678",
  "reference": "Payment reference"
}
```

### IBAN (Europe)

```json
{
  "beneficiaryName": "ACME GmbH",
  "beneficiaryIban": "DE89370400440532013000",
  "reference": "Invoice payment"
}
```

## Sandbox Mode

The implementation includes full sandbox support for testing:

### Enable Sandbox Mode

Set environment variable:
```bash
TRUELAYER_SANDBOX=true
# or
TRUELAYER_ENV=sandbox
```

### Sandbox Behavior

- No actual API calls to TrueLayer
- Mock payment IDs generated
- Mock authorization URLs returned
- All payment statuses can be manually updated in database
- No real bank authorization required

### Testing Payment Flow

1. **Create payment** → Returns mock authorization URL
2. **Manually update status** in database:
   ```sql
   UPDATE payment_initiations
   SET status = 'AUTHORIZED'
   WHERE id = 'payment-id';
   ```
3. **Get payment status** → Returns updated status

## Source Types

Link payments to source entities:

- `MANUAL` - Manual payment (default)
- `BILL` - Payment for a bill
- `EXPENSE` - Payment for an expense
- `INVOICE` - Payment for an invoice
- `TAX` - Tax payment

Example:
```json
{
  "sourceType": "INVOICE",
  "invoiceId": "uuid-of-invoice"
}
```

## Security Features

- **JWT Authentication** - All endpoints require valid JWT
- **Organization Scoping** - Users can only access their org's payments
- **IP Tracking** - Source IP recorded for audit trail
- **User-Agent Tracking** - Browser/device info recorded
- **Audit Logging** - All actions logged

## Amount Limits

- **Minimum:** 0.01 (in payment currency)
- **Maximum:** 1,000,000.00 (configurable per jurisdiction)

## Currency Support

Supported currencies:
- `GBP` - British Pound
- `EUR` - Euro
- `USD` - US Dollar (via supported banks)

## Error Handling

### Common Errors

**400 Bad Request**
```json
{
  "statusCode": 400,
  "message": "Amount too small. Minimum is 0.01 GBP"
}
```

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Payment not found"
}
```

**503 Service Unavailable**
```json
{
  "statusCode": 503,
  "message": "Failed to create payment"
}
```

## Database Schema

```prisma
enum PaymentInitiationStatus {
  PENDING
  AUTHORIZATION_REQUIRED
  AUTHORIZING
  AUTHORIZED
  EXECUTED
  SETTLED
  FAILED
  CANCELLED
}

enum PaymentSourceType {
  BILL
  EXPENSE
  INVOICE
  TAX
  MANUAL
}

model PaymentInitiation {
  id                    String                    @id @default(uuid())
  orgId                 String
  userId                String

  amount                Decimal                   @db.Decimal(12, 2)
  currency              String                    @default("EUR")

  beneficiaryName       String
  beneficiaryIban       String?
  beneficiarySortCode   String?
  beneficiaryAccountNumber String?

  reference             String?
  description           String?

  status                PaymentInitiationStatus   @default(PENDING)
  truelayerPaymentId    String?                   @unique

  redirectUri           String?
  authorizationUri      String?

  sourceType            PaymentSourceType         @default(MANUAL)
  billId                String?
  expenseId             String?
  invoiceId             String?

  ipAddress             String?
  userAgent             String?

  createdAt             DateTime                  @default(now())
  updatedAt             DateTime                  @updatedAt
  authorizedAt          DateTime?
  executedAt            DateTime?
  settledAt             DateTime?

  organisation          Organisation              @relation(...)
  user                  User                      @relation(...)
}
```

## Implementation Checklist

- [x] Prisma schema with enums and model
- [x] TypeScript types and interfaces
- [x] PIS Service with all methods
- [x] PIS Controller with REST endpoints
- [x] Module integration
- [x] Sandbox/mock mode support
- [x] Amount validation
- [x] Beneficiary validation
- [x] Audit logging
- [x] Security tracking (IP, User-Agent)
- [ ] Migration applied (pending - needs server restart for Prisma client generation)
- [ ] Integration tests
- [ ] Frontend UI for payment initiation

## Next Steps

1. **Apply Migration:**
   ```bash
   cd packages/database
   npx prisma generate  # Restart API server first
   ```

2. **Test Endpoints:**
   - Use Postman/Insomnia to test API
   - Start with sandbox mode
   - Test all CRUD operations

3. **Frontend Integration:**
   - Create payment initiation form
   - Handle authorization redirect
   - Display payment status

4. **Production Setup:**
   - Set `TRUELAYER_ENV=production`
   - Configure production credentials
   - Test with real bank connection

## Environment Variables

```bash
# TrueLayer Configuration
TRUELAYER_CLIENT_ID=your-client-id
TRUELAYER_CLIENT_SECRET=your-client-secret
TRUELAYER_ENV=sandbox  # or 'production'
TRUELAYER_REDIRECT_URI=http://localhost:3000/integrations/truelayer/callback
TRUELAYER_WEBHOOK_URL=https://yourdomain.com/webhooks/truelayer

# Optional: Separate encryption key for TrueLayer
TRUELAYER_ENCRYPTION_KEY=your-32-char-key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
```

## Support

- TrueLayer Docs: https://docs.truelayer.com/docs/single-immediate-payments
- TrueLayer Sandbox: https://console.truelayer-sandbox.com/
- TrueLayer Support: support@truelayer.com
