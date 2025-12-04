# Plaid Integration - Quick Reference

## Quick Start

### 1. Environment Setup
```bash
# Add to .env file
PLAID_CLIENT_ID=your-client-id
PLAID_SECRET=your-secret
PLAID_ENV=sandbox
PLAID_ENCRYPTION_KEY=your-32-char-encryption-key
```

### 2. Database Setup
```sql
-- Run these migrations
CREATE TABLE plaid_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  item_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL, -- Encrypted
  status TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE plaid_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 3. Import Module
```typescript
// apps/api/src/app.module.ts
import { PlaidModule } from './modules/integrations/plaid';

@Module({
  imports: [
    // ... other modules
    PlaidModule,
  ],
})
export class AppModule {}
```

## API Endpoints

### Create Link Token
```bash
POST /api/plaid/create-link-token
Authorization: Bearer <jwt-token>

{
  "userId": "user-uuid",
  "clientName": "Operate"
}

Response: { "linkToken": "link-sandbox-...", "expiration": "..." }
```

### Exchange Public Token
```bash
POST /api/plaid/exchange-token
Authorization: Bearer <jwt-token>

{
  "publicToken": "public-sandbox-...",
  "userId": "user-uuid"
}

Response: { "accessToken": "encrypted-...", "itemId": "..." }
```

### Get Accounts
```bash
GET /api/plaid/accounts/:itemId
Authorization: Bearer <jwt-token>

Response: [{ "account_id": "...", "name": "Checking", ... }]
```

### Sync Transactions
```bash
GET /api/plaid/transactions/:itemId/sync
Authorization: Bearer <jwt-token>

Response: { "transactions": [...], "nextCursor": "...", "hasMore": true }
```

## Frontend Integration (React)

```bash
# Install in apps/web
pnpm add react-plaid-link
```

```typescript
import { usePlaidLink } from 'react-plaid-link';

function ConnectBankButton() {
  const [linkToken, setLinkToken] = useState(null);

  useEffect(() => {
    fetch('/api/plaid/create-link-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, clientName: 'Operate' })
    })
      .then(res => res.json())
      .then(data => setLinkToken(data.linkToken));
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => {
      fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicToken, userId: user.id })
      });
    },
  });

  return <button onClick={() => open()} disabled={!ready}>Connect Bank</button>;
}
```

## Backend Usage

```typescript
import { PlaidService } from '@/modules/integrations/plaid';

@Injectable()
export class MyService {
  constructor(private plaidService: PlaidService) {}

  async syncTransactions(userId: string, itemId: string) {
    const result = await this.plaidService.syncTransactions(userId, itemId);
    // Process result.transactions
  }
}
```

## Security Notes

- ✅ Access tokens are **always encrypted** before storage
- ✅ Webhooks **must be verified** with signature
- ✅ Never log access tokens or secrets
- ✅ Use PLAID_ENCRYPTION_KEY different from JWT_SECRET
- ✅ Minimum 32 characters for encryption key

## File Locations

```
apps/api/src/modules/integrations/plaid/
├── plaid.module.ts      # Import this in app.module.ts
├── plaid.service.ts     # Inject this where needed
├── plaid.controller.ts  # Automatic via module
├── plaid.config.ts      # Auto-loaded
├── plaid.types.ts       # Import types from here
└── dto/                 # For request validation
```

## Common Issues

### "Invalid or missing PLAID_ENCRYPTION_KEY"
→ Set PLAID_ENCRYPTION_KEY to 32+ character string

### "Failed to create link token"
→ Check PLAID_CLIENT_ID and PLAID_SECRET are correct

### "Webhook signature verification failed"
→ Ensure PLAID_WEBHOOK_SECRET matches Plaid Dashboard

## Testing

```bash
# Mock mode for development
PLAID_MOCK_MODE=true

# Run tests
npm test -- plaid.service.spec.ts
```

## Resources

- [Plaid Quickstart](https://plaid.com/docs/quickstart/)
- [Plaid Link Guide](https://plaid.com/docs/link/)
- [API Reference](https://plaid.com/docs/api/)
- Module README: `apps/api/src/modules/integrations/plaid/README.md`
