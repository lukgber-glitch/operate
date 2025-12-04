# GoCardless Banking Service

OAuth 2.0 integration with GoCardless Bank Account Data API for EU Open Banking.

## Overview

The GoCardless service provides secure access to bank account data across European financial institutions using the Open Banking standard (PSD2). It handles OAuth flows, requisition management, and data retrieval for bank accounts, transactions, and balances.

## Architecture

**Files:**
- `gocardless.service.ts` - Main service with OAuth and banking methods
- `gocardless.types.ts` - TypeScript interfaces for API responses

## Configuration

Required environment variables:

```env
GOCARDLESS_SECRET_ID=your_secret_id
GOCARDLESS_SECRET_KEY=your_secret_key
GOCARDLESS_BASE_URL=https://bankaccountdata.gocardless.com/api/v2
```

## OAuth Flow

GoCardless uses a **requisition-based flow** (not traditional OAuth code exchange):

### 1. Create End User Agreement
```typescript
const agreement = await goCardlessService.createAgreement(
  institutionId,
  90, // max historical days
  90  // access valid for days
);
```

### 2. Create Requisition
```typescript
const requisition = await goCardlessService.createRequisition(
  institutionId,
  'https://your-app.com/callback',
  'org-123',
  agreement.id
);

// Redirect user to: requisition.link
```

### 3. User Authorizes at Bank
User is redirected to their bank, grants consent, and returns to your redirect URI.

### 4. Retrieve Accounts
```typescript
const accounts = await goCardlessService.getAccounts(requisition.id);
```

### 5. Fetch Data
```typescript
// Get transactions
const transactions = await goCardlessService.getTransactions(
  accountId,
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

// Get balances
const balances = await goCardlessService.getBalances(accountId);
```

## Key Methods

### Institution Discovery
```typescript
// Get banks for a country
const institutions = await goCardlessService.getInstitutions('DE');
```

### Account Management
```typescript
// Get account details
const account = await goCardlessService.getAccountDetails(accountId);

// Get account balances
const balances = await goCardlessService.getBalances(accountId);
```

### Transaction Retrieval
```typescript
// Get transactions (defaults to last 90 days)
const transactions = await goCardlessService.getTransactions(accountId);

// Get transactions for date range
const transactions = await goCardlessService.getTransactions(
  accountId,
  new Date('2024-01-01'),
  new Date('2024-12-31')
);
```

### Token Management
```typescript
// Obtain token (done automatically)
const token = await goCardlessService.obtainToken();

// Refresh token
const newToken = await goCardlessService.refreshToken(refreshToken);
```

### Requisition Management
```typescript
// Get requisition status
const requisition = await goCardlessService.getRequisition(requisitionId);

// Delete requisition (revoke access)
await goCardlessService.deleteRequisition(requisitionId);
```

## Supported Countries

GoCardless supports 2000+ banks across Europe including:
- Germany (DE)
- Austria (AT)
- United Kingdom (GB)
- France (FR)
- Spain (ES)
- Italy (IT)
- Netherlands (NL)
- Belgium (BE)
- And more...

## Data Scopes

The default agreement requests access to:
- **balances** - Account balance information
- **details** - Account metadata (IBAN, owner name, etc.)
- **transactions** - Transaction history

## Error Handling

The service handles common errors:
- `400` - Bad request (invalid parameters)
- `401` - Unauthorized (invalid or expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `429` - Rate limit exceeded
- `500-504` - Service unavailable

All errors are logged and converted to NestJS exceptions.

## Requisition Statuses

```typescript
enum RequisitionStatus {
  CREATED = 'CR',              // Requisition created
  GIVING_CONSENT = 'GC',       // User at consent screen
  UNDERGOING_AUTHENTICATION = 'UA', // User authenticating
  REJECTED = 'RJ',             // User rejected
  SELECTING_ACCOUNTS = 'SA',   // User selecting accounts
  GRANTING_ACCESS = 'GA',      // Bank granting access
  LINKED = 'LN',               // Successfully linked
  SUSPENDED = 'SU',            // Access suspended
  EXPIRED = 'EX'               // Requisition expired
}
```

## Testing

### Manual Testing Flow

1. Get institutions:
```bash
curl -X GET "http://localhost:3000/api/connection-hub/gocardless/institutions?country=DE"
```

2. Create requisition:
```bash
curl -X POST "http://localhost:3000/api/connection-hub/gocardless/requisitions" \
  -H "Content-Type: application/json" \
  -d '{
    "institutionId": "SANDBOXFINANCE_SFIN0000",
    "redirectUri": "http://localhost:3000/callback",
    "reference": "test-org-123"
  }'
```

3. Visit the `link` URL from response
4. Complete authorization at sandbox bank
5. Get accounts from requisition
6. Fetch transactions and balances

### Sandbox Testing

GoCardless provides sandbox institutions for testing:
- `SANDBOXFINANCE_SFIN0000` - General sandbox bank

## Integration Points

The GoCardless service integrates with:
- **Connection Hub** - Main integration management
- **Banking Module** - Transaction imports
- **Finance Module** - Accounting workflows
- **Compliance Module** - Audit trails

## Security Notes

1. **Token Storage**: Access tokens are stored in memory (service instance)
2. **Credential Management**: Secret ID/Key must be in environment variables
3. **Token Refresh**: Automatic token refresh when expired
4. **HTTPS Only**: All API calls use HTTPS
5. **Data Encryption**: Bank data should be encrypted at rest

## API Rate Limits

GoCardless enforces rate limits:
- **Token requests**: 10 per minute
- **Institution requests**: 100 per minute
- **Account/Transaction requests**: 100 per minute per institution

The service handles rate limits with appropriate error responses.

## References

- [GoCardless Bank Account Data API Docs](https://developer.gocardless.com/bank-account-data/overview)
- [OAuth 2.0 Implementation](https://developer.gocardless.com/bank-account-data/authentication)
- [Requisition Flow](https://developer.gocardless.com/bank-account-data/quick-start)
- [Supported Institutions](https://developer.gocardless.com/bank-account-data/institutions)

## Next Steps

1. Add unit tests for service methods
2. Implement webhook handlers for requisition updates
3. Add retry logic for failed API calls
4. Implement caching for institution list
5. Add metrics and monitoring
