# Plaid Integration - Production Ready

## Overview

This module provides secure bank account connection capabilities for the US market via Plaid Link. It implements OAuth2-compliant authorization flow with comprehensive security features including encrypted token storage, webhook signature verification, and audit logging.

**Production Status**: ✅ Ready for production deployment with full error handling, rate limiting, and health monitoring.

## Features

### Core Functionality
- **Plaid Link Integration**: Complete implementation of Plaid Link SDK for secure bank connections
- **OAuth2 Flow**: Standard OAuth2 authorization flow for bank account access
- **Transaction Sync**: Incremental sync with cursor-based pagination
- **Balance Refresh**: Real-time account balance updates
- **Account Management**: Multi-account support per user

### Production Features (NEW)
- **Environment Support**: Sandbox, Development, and Production modes
- **Error Handling**: Comprehensive error mapping with user-friendly messages
- **Rate Limiting**: Client-side rate limiting to prevent API quota issues
- **Connection Health**: Proactive monitoring and health checks
- **Re-authentication**: Automatic detection and user prompts for expired connections
- **Webhook Processing**: Full webhook support for all event types (TRANSACTIONS, ITEM, AUTH)

### Security
- **AES-256-GCM Encryption**: Access tokens encrypted before database storage
- **Webhook Verification**: Signature verification for all webhooks
- **Audit Logging**: Comprehensive audit trail for all API calls
- **Secure Storage**: No plaintext credentials in logs or database
- **Mock Mode**: Development mode for testing without actual Plaid credentials

## Architecture

```
plaid/
├── dto/                                      # Data Transfer Objects
│   ├── create-link-token.dto.ts
│   ├── exchange-token.dto.ts
│   └── plaid-webhook.dto.ts
├── services/                                 # Additional services
│   ├── plaid-bank.service.ts                # Bank account operations
│   ├── plaid-transaction-matcher.service.ts # Transaction matching
│   └── plaid-rate-limiter.service.ts        # Rate limiting (NEW)
├── utils/                                    # Utility functions
│   ├── plaid-encryption.util.ts             # AES-256-GCM encryption
│   └── plaid-health-monitor.util.ts         # Connection health (NEW)
├── jobs/                                     # Background jobs
│   └── plaid-sync.job.ts                    # Sync processors
├── plaid.config.ts                          # Configuration loader
├── plaid.types.ts                           # TypeScript interfaces
├── plaid.service.ts                         # Core business logic
├── plaid.controller.ts                      # REST API endpoints
├── plaid.module.ts                          # NestJS module definition
└── README.md                                # This file
```

## API Endpoints

### Authentication & Connection
```
POST /plaid/create-link-token              # Create link token
POST /plaid/exchange-token                 # Exchange public token
POST /plaid/connections/:itemId/reauth     # Create re-auth token (NEW)
```

### Data Retrieval
```
GET  /plaid/accounts/:itemId               # Get accounts
GET  /plaid/transactions/:itemId/sync      # Sync transactions
GET  /plaid/connections/:itemId/health     # Check health (NEW)
```

### Webhooks
```
POST /plaid/webhook                        # Webhook handler
```

### POST /api/plaid/create-link-token
Creates a link token for initializing Plaid Link.

**Request:**
```json
{
  "userId": "user-uuid",
  "clientName": "Operate",
  "language": "en",
  "countryCodes": ["US"],
  "products": ["auth", "transactions"],
  "webhookUrl": "https://api.operate.com/plaid/webhook"
}
```

**Response:**
```json
{
  "linkToken": "link-sandbox-abc123",
  "expiration": "2024-12-02T18:00:00Z"
}
```

### POST /api/plaid/exchange-token
Exchanges a public token from Plaid Link for an access token.

**Request:**
```json
{
  "publicToken": "public-sandbox-abc123",
  "userId": "user-uuid",
  "institutionId": "ins_109508",
  "institutionName": "Chase"
}
```

**Response:**
```json
{
  "accessToken": "encrypted-access-token",
  "itemId": "eVBnVMp7zdTJLkRNr33Rs6zr7KNJqBFL9DrE6",
  "requestId": "xyz123"
}
```

### GET /api/plaid/accounts/:itemId
Retrieves all accounts for a connected Plaid item.

**Response:**
```json
[
  {
    "account_id": "vzeNDwK7KQIm4yEog683uElbp9GRLEFXGK98D",
    "name": "Plaid Checking",
    "official_name": "Plaid Gold Standard 0% Interest Checking",
    "type": "depository",
    "subtype": "checking",
    "balances": {
      "current": 100.00,
      "available": 100.00,
      "limit": null
    }
  }
]
```

### GET /api/plaid/transactions/:itemId/sync?cursor=xxx
Syncs transactions for a connected Plaid item.

**Response:**
```json
{
  "transactions": [...],
  "nextCursor": "next-page-cursor",
  "hasMore": true
}
```

### POST /api/plaid/webhook
Receives webhook notifications from Plaid.

**Request:**
```json
{
  "webhook_type": "TRANSACTIONS",
  "webhook_code": "INITIAL_UPDATE",
  "item_id": "eVBnVMp7zdTJLkRNr33Rs6zr7KNJqBFL9DrE6",
  "new_transactions": 10
}
```

## Environment Variables

### Sandbox (Development/Testing)
```bash
PLAID_ENV=sandbox
PLAID_CLIENT_ID=your-sandbox-client-id
PLAID_SECRET=your-sandbox-secret
PLAID_WEBHOOK_URL=https://operate.guru/api/v1/integrations/plaid/webhook
PLAID_ENCRYPTION_KEY=your-32-character-key
PLAID_MOCK_MODE=false
```

### Development (Real Bank Testing)
```bash
PLAID_ENV=development
PLAID_CLIENT_ID=your-dev-client-id
PLAID_SECRET=your-dev-secret
PLAID_WEBHOOK_URL=https://operate.guru/api/v1/integrations/plaid/webhook
PLAID_ENCRYPTION_KEY=your-32-character-key
```

### Production (NEW)
```bash
PLAID_ENV=production
PLAID_CLIENT_ID=your-production-client-id
PLAID_SECRET=your-production-secret
PLAID_WEBHOOK_URL=https://operate.guru/api/v1/integrations/plaid/webhook
PLAID_WEBHOOK_SECRET=your-webhook-verification-key
PLAID_REDIRECT_URI=https://operate.guru/integrations/plaid/callback
PLAID_ENCRYPTION_KEY=your-production-32-character-key
```

**Generate encryption key:**
```bash
openssl rand -base64 32
```

## Security Features

### 1. Access Token Encryption
All access tokens are encrypted using AES-256-GCM before storage:

```typescript
const encryptedToken = PlaidEncryptionUtil.encrypt(accessToken, masterKey);
```

### 2. Webhook Signature Verification
All webhook requests are verified using HMAC-SHA256:

```typescript
const isValid = PlaidEncryptionUtil.verifyWebhookSignature(
  payload,
  signature,
  webhookSecret
);
```

### 3. Rate Limiting
All endpoints are rate-limited:
- Link token creation: 10 req/min
- Token exchange: 10 req/min
- Account retrieval: 20 req/min
- Transaction sync: 10 req/min
- Webhook: 100 req/min

### 4. Audit Logging
All operations are logged to `plaid_audit_logs` table with:
- User ID
- Action type
- Metadata (duration, counts, etc.)
- Timestamp

### 5. No Sensitive Data in Logs
Access tokens, secrets, and other sensitive data are never logged.

## Database Schema

### plaid_connections
```sql
CREATE TABLE plaid_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  item_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL, -- Encrypted
  institution_id TEXT,
  institution_name TEXT,
  status TEXT NOT NULL, -- ACTIVE, INACTIVE, ERROR, PENDING
  last_synced TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### plaid_audit_logs
```sql
CREATE TABLE plaid_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Usage Example

### Frontend (React with Plaid Link)

```typescript
import { usePlaidLink } from 'react-plaid-link';

function PlaidLinkButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    // Create link token
    fetch('/api/plaid/create-link-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        clientName: 'Operate',
      }),
    })
      .then(res => res.json())
      .then(data => setLinkToken(data.linkToken));
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => {
      // Exchange public token for access token
      fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicToken,
          userId: currentUser.id,
          institutionId: metadata.institution?.institution_id,
          institutionName: metadata.institution?.name,
        }),
      });
    },
  });

  return (
    <button onClick={() => open()} disabled={!ready}>
      Connect Bank Account
    </button>
  );
}
```

### Backend (NestJS Service)

```typescript
import { PlaidService } from './integrations/plaid';

@Injectable()
export class FinanceService {
  constructor(private plaidService: PlaidService) {}

  async syncBankTransactions(userId: string, itemId: string) {
    const result = await this.plaidService.syncTransactions(userId, itemId);

    // Process transactions
    for (const transaction of result.transactions) {
      await this.processTransaction(transaction);
    }

    // Continue syncing if more pages available
    if (result.hasMore) {
      await this.syncBankTransactions(userId, itemId, result.nextCursor);
    }
  }
}
```

## Error Handling

The module throws standard NestJS HTTP exceptions:

- `BadRequestException`: Invalid request parameters
- `UnauthorizedException`: Invalid credentials or expired tokens
- `ServiceUnavailableException`: Plaid API unavailable
- `InternalServerErrorException`: Unexpected errors

## Testing

### Mock Mode
Enable mock mode for development:

```bash
PLAID_MOCK_MODE=true
```

This allows testing the integration flow without actual Plaid credentials.

### Unit Tests
```bash
npm test -- plaid.service.spec.ts
```

### Integration Tests
```bash
npm test -- plaid.e2e-spec.ts
```

## Compliance & Best Practices

### OAuth2 Best Practices
- ✅ No sensitive data in logs
- ✅ Encrypted token storage
- ✅ Secure token exchange
- ✅ Webhook signature verification
- ✅ Rate limiting
- ✅ Comprehensive audit logging

### PCI DSS Compliance
- ✅ No storage of card numbers or CVVs
- ✅ Encrypted storage of access tokens
- ✅ Access control via RBAC
- ✅ Audit trail for all operations

## Troubleshooting

### "Invalid or missing PLAID_ENCRYPTION_KEY"
Ensure `PLAID_ENCRYPTION_KEY` is set and is at least 32 characters long.

### "Failed to create link token"
Check that `PLAID_CLIENT_ID` and `PLAID_SECRET` are correct and environment is properly set.

### "Webhook signature verification failed"
Ensure `PLAID_WEBHOOK_SECRET` matches the secret configured in Plaid Dashboard.

### "Plaid connection not found or inactive"
The user needs to reconnect their bank account via Plaid Link.

## Production Features (NEW)

### Error Handling
User-friendly error messages for all Plaid error codes:
```typescript
// Automatically mapped errors:
ITEM_LOGIN_REQUIRED → "Bank connection needs to be re-authenticated"
INSTITUTION_NOT_RESPONDING → "Bank temporarily unavailable. Try again later"
RATE_LIMIT_EXCEEDED → "Too many requests. Try again in a few minutes"
```

See `plaidService.handlePlaidError()` for full error mapping.

### Rate Limiting
Client-side rate limiting prevents exceeding Plaid API quotas:
- Most endpoints: 100 req/min
- Burst capacity: 200 req/min
- Automatic throttling and retry

See `PlaidRateLimiterService` for implementation.

### Connection Health Monitoring
```typescript
const health = await plaidService.checkConnectionHealth(userId, itemId);
// Returns: { healthy, lastSync, error, errorCode, needsReauth }
```

Health monitor features:
- Proactive issue detection
- Actionable recommendations
- User notification triggers
- Status levels: HEALTHY, WARNING, CRITICAL

See `PlaidHealthMonitor` utility for analysis.

### Re-authentication Flow
Automatic detection and handling of expired connections:
```typescript
// Check health
if (connection.needsReauth) {
  // Get update token
  const { linkToken } = await plaidService.createUpdateLinkToken(userId, itemId);
  // Show Plaid Link in update mode
}
```

### Enhanced Webhook Processing
Full webhook support with automatic handling:
- **TRANSACTIONS**: SYNC_UPDATES_AVAILABLE, INITIAL_UPDATE, HISTORICAL_UPDATE
- **ITEM**: ERROR, PENDING_EXPIRATION, USER_PERMISSION_REVOKED
- **AUTH**: AUTOMATICALLY_VERIFIED, VERIFICATION_EXPIRED

See controller webhook handlers for implementation.

## Production Deployment

### Quick Start
1. Complete Plaid production approval (1-2 weeks)
2. Update environment: `PLAID_ENV=production`
3. Configure production credentials
4. Set up webhook URL (HTTPS required)
5. Test in development environment first
6. Deploy and monitor

### Detailed Guides
- **[Production Guide](../../docs/PLAID_PRODUCTION_GUIDE.md)** - Complete deployment guide
- **[Production Checklist](../../docs/PLAID_PRODUCTION_CHECKLIST.md)** - Step-by-step checklist

### Production Requirements
- ✅ Plaid production approval received
- ✅ HTTPS webhook endpoint
- ✅ Valid SSL certificate
- ✅ Webhook signature verification
- ✅ 32+ character encryption key
- ✅ Monitoring and alerting setup

## Resources

- [Plaid Documentation](https://plaid.com/docs/)
- [Plaid API Reference](https://plaid.com/docs/api/)
- [Plaid Link Guide](https://plaid.com/docs/link/)
- [Plaid Webhooks](https://plaid.com/docs/api/webhooks/)
- [Plaid Dashboard](https://dashboard.plaid.com)
- [Plaid Status](https://status.plaid.com)

## Support

For issues or questions, contact the development team or refer to the main project documentation.

**Internal Documentation:**
- Production Guide: `apps/api/docs/PLAID_PRODUCTION_GUIDE.md`
- Production Checklist: `apps/api/docs/PLAID_PRODUCTION_CHECKLIST.md`
- Bank Service Guide: `apps/api/src/modules/integrations/plaid/PLAID_BANK_SERVICE.md`
