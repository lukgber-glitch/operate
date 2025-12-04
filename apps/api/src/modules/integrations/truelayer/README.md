# TrueLayer Integration Module

UK Open Banking integration via TrueLayer API (PSD2 compliant).

## Overview

This module provides secure bank account connection for UK market using TrueLayer's Open Banking platform. It implements OAuth2 PKCE flow for authorization, encrypted token storage, and comprehensive audit logging.

## Features

- **OAuth2 PKCE Flow**: Secure authorization with Proof Key for Code Exchange
- **AES-256-GCM Encryption**: Access and refresh tokens encrypted before storage
- **Account Data**: Fetch accounts, balances, and transactions
- **Auto Token Refresh**: Automatic access token refresh using refresh tokens
- **Webhook Support**: Real-time updates via TrueLayer webhooks
- **Audit Logging**: Comprehensive audit trail for compliance
- **Rate Limiting**: Built-in rate limiting on all endpoints

## Architecture

```
truelayer/
├── dto/                      # Data Transfer Objects
│   ├── create-auth-link.dto.ts
│   ├── exchange-token.dto.ts
│   └── truelayer-webhook.dto.ts
├── interfaces/               # Service interfaces
│   └── truelayer.interface.ts
├── utils/                    # Utilities
│   └── truelayer-encryption.util.ts
├── truelayer.config.ts       # Configuration
├── truelayer.controller.ts   # API endpoints
├── truelayer.module.ts       # NestJS module
├── truelayer.service.ts      # Core service
└── truelayer.types.ts        # TypeScript types
```

## Environment Variables

```bash
# Required
TRUELAYER_CLIENT_ID=your_client_id
TRUELAYER_CLIENT_SECRET=your_client_secret
TRUELAYER_REDIRECT_URI=http://localhost:3000/integrations/truelayer/callback

# Optional
TRUELAYER_WEBHOOK_URL=https://api.yourdomain.com/truelayer/webhook
TRUELAYER_WEBHOOK_SECRET=your_webhook_secret
TRUELAYER_ENCRYPTION_KEY=minimum-32-character-encryption-key
TRUELAYER_SANDBOX=true  # Use sandbox environment
```

## API Endpoints

### Authorization

#### POST /truelayer/auth
Create OAuth2 authorization link.

**Request:**
```json
{
  "userId": "user-123",
  "scopes": ["info", "accounts", "balance", "transactions", "offline_access"],
  "redirectUri": "https://app.operate.com/integrations/truelayer/callback",
  "providerId": "ob-lloyds"  // Optional: specific bank
}
```

**Response:**
```json
{
  "authUrl": "https://auth.truelayer.com?...",
  "state": "csrf-state-token",
  "expiresAt": "2024-12-02T18:00:00Z"
}
```

#### POST /truelayer/callback
Exchange authorization code for access token.

**Request:**
```json
{
  "code": "auth-code-from-callback",
  "userId": "user-123",
  "state": "csrf-state-token",
  "redirectUri": "https://app.operate.com/integrations/truelayer/callback"
}
```

**Response:**
```json
{
  "accessToken": "encrypted-token",
  "refreshToken": "encrypted-token",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "scope": "info accounts balance transactions offline_access"
}
```

### Data Retrieval

#### GET /truelayer/connections
Get all TrueLayer connections for user.

#### GET /truelayer/connections/:connectionId/accounts
Get all bank accounts for a connection.

#### GET /truelayer/connections/:connectionId/accounts/:accountId/balance
Get account balance.

#### GET /truelayer/connections/:connectionId/accounts/:accountId/transactions
Get account transactions.

**Query Parameters:**
- `from` (optional): Start date (YYYY-MM-DD)
- `to` (optional): End date (YYYY-MM-DD)

### Webhooks

#### POST /truelayer/webhook
Receive webhook notifications from TrueLayer.

**Headers:**
- `tl-signature`: Webhook signature for verification

**Event Types:**
- `transaction.created`: New transaction detected
- `account.updated`: Account information changed
- `balance.updated`: Account balance changed
- `consent.revoked`: User revoked consent

## Usage Example

### Frontend Flow

```typescript
// 1. Create authorization link
const authResponse = await fetch('/api/truelayer/auth', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + userToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: currentUser.id,
    scopes: ['info', 'accounts', 'balance', 'transactions', 'offline_access'],
  }),
});

const { authUrl, state } = await authResponse.json();

// 2. Redirect user to TrueLayer authorization
window.location.href = authUrl;

// 3. Handle callback (user returns with code and state)
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const returnedState = params.get('state');

// 4. Exchange code for tokens
const tokenResponse = await fetch('/api/truelayer/callback', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + userToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code,
    state: returnedState,
    userId: currentUser.id,
  }),
});

// 5. Fetch accounts
const accountsResponse = await fetch(
  `/api/truelayer/connections/${connectionId}/accounts`,
  {
    headers: { 'Authorization': 'Bearer ' + userToken },
  }
);

const accounts = await accountsResponse.json();
```

## Security

### OAuth2 PKCE Flow

1. Generate code verifier (random 32 bytes)
2. Create code challenge (SHA-256 hash of verifier)
3. Include challenge in authorization request
4. Store verifier securely for token exchange
5. Exchange code with verifier

### Token Encryption

All access and refresh tokens are encrypted using AES-256-GCM before storage:

- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 (100,000 iterations, SHA-512)
- **Salt**: Random 64 bytes per encryption
- **IV**: Random 16 bytes per encryption
- **Auth Tag**: 16 bytes for authenticity verification

### Webhook Verification

Webhooks are verified using HMAC-SHA256:

```typescript
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');
```

## Database Schema

### truelayer_oauth_states
Temporary storage for OAuth2 state and PKCE verifiers.

```sql
CREATE TABLE truelayer_oauth_states (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL UNIQUE,
  code_verifier VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL
);
```

### truelayer_connections
Encrypted token storage and connection metadata.

```sql
CREATE TABLE truelayer_connections (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,      -- Encrypted
  refresh_token TEXT NOT NULL,     -- Encrypted
  expires_at TIMESTAMP NOT NULL,
  provider_id VARCHAR(255),
  provider_name VARCHAR(255),
  scopes TEXT[],
  status VARCHAR(50),
  last_synced TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

### truelayer_audit_logs
Audit trail for compliance and debugging.

```sql
CREATE TABLE truelayer_audit_logs (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL
);
```

## Testing

### Sandbox Mode

Set `TRUELAYER_SANDBOX=true` to use TrueLayer's sandbox environment.

### Mock Providers

Enable mock providers in sandbox:

```json
{
  "enableMockProviders": true
}
```

Mock provider credentials:
- Username: `john`
- Password: `doe`

## Rate Limits

- **Authorization**: 10 requests/minute
- **Token Exchange**: 10 requests/minute
- **Accounts**: 60 requests/minute
- **Balance**: 60 requests/minute
- **Transactions**: 60 requests/minute
- **Webhooks**: 100 requests/minute

## PSD2 Compliance

- **Consent Duration**: 90 days (UK regulation)
- **SCA**: Strong Customer Authentication via OAuth2
- **Data Access**: Read-only access to account information
- **Revocation**: Users can revoke access anytime

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid state` | CSRF token mismatch | Ensure state matches between auth and callback |
| `Invalid code verifier` | PKCE verification failed | Check code verifier storage |
| `Token expired` | Access token expired | Service auto-refreshes, check refresh token |
| `Consent revoked` | User revoked consent | Prompt user to re-authorize |

## References

- [TrueLayer Documentation](https://docs.truelayer.com/)
- [OAuth2 PKCE RFC](https://tools.ietf.org/html/rfc7636)
- [PSD2 Regulation](https://ec.europa.eu/info/law/payment-services-psd-2-directive-eu-2015-2366_en)
- [UK Open Banking](https://www.openbanking.org.uk/)

## TODO

- [ ] Implement background sync jobs (BullMQ)
- [ ] Add transaction matching to invoices/expenses
- [ ] Implement connection management endpoints
- [ ] Add retry logic for failed API calls
- [ ] Create admin dashboard for connection monitoring
