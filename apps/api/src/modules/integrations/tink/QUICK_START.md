# Tink Integration Quick Start Guide

## 1. Setup (5 minutes)

### Install Dependencies

No additional dependencies needed - uses existing NestJS packages.

### Environment Variables

Add to `.env`:

```bash
# For Development/Testing (Mock Mode)
TINK_MOCK_MODE=true

# For Production
TINK_CLIENT_ID=your_tink_client_id
TINK_CLIENT_SECRET=your_tink_client_secret
TINK_REDIRECT_URI=https://yourdomain.com/integrations/tink/callback
TINK_ENVIRONMENT=production
TINK_ENCRYPTION_KEY=your_32_character_encryption_key_minimum
```

### Database Setup

Run the migration:

```bash
psql -d your_database -f apps/api/src/modules/integrations/tink/MIGRATION.sql
```

Or add to your Prisma schema and run `prisma migrate dev`.

## 2. Import Module

In `app.module.ts`:

```typescript
import { TinkModule } from './modules/integrations/tink';

@Module({
  imports: [
    // ... other imports
    TinkModule,
  ],
})
export class AppModule {}
```

## 3. Test with Mock Mode

### Start Service

```bash
npm run dev
```

### Test Authorization Flow

```typescript
// In your service or controller
import { TinkService } from './modules/integrations/tink';

constructor(private readonly tinkService: TinkService) {}

// Start authorization
const { authorizationUrl, state } = await this.tinkService.startAuthorization(
  'org-123',
  'user-456',
  'DE'
);

console.log('Authorization URL:', authorizationUrl);
// In mock mode, this returns a Tink Link URL
```

### Fetch Mock Accounts

```typescript
const accounts = await this.tinkService.getAccounts('org-123', 'user-456');
console.log('Accounts:', accounts);
// Returns 3 mock accounts: checking, savings, credit card
```

### Fetch Mock Transactions

```typescript
const transactions = await this.tinkService.getTransactions(
  'org-123',
  'user-456',
  'mock_account_checking_1'
);
console.log('Transactions:', transactions);
// Returns 50 mock transactions
```

## 4. Production Setup

### Get Tink Credentials

1. Sign up at https://tink.com
2. Create an app in Tink Console
3. Get Client ID and Client Secret
4. Configure redirect URI

### Update Environment

```bash
TINK_MOCK_MODE=false
TINK_CLIENT_ID=your_real_client_id
TINK_CLIENT_SECRET=your_real_client_secret
TINK_ENCRYPTION_KEY=generate_a_secure_32_char_key
```

### Production Flow

```typescript
// 1. Start authorization
const { authorizationUrl } = await tinkService.startAuthorization(
  organizationId,
  userId,
  'DE'
);

// 2. Redirect user to authorizationUrl
// User completes bank login at Tink

// 3. Handle callback
const token = await tinkService.completeAuthorization(code, state);

// 4. Fetch real bank accounts
const accounts = await tinkService.getAccounts(organizationId, userId);

// 5. Fetch real transactions
const transactions = await tinkService.getTransactions(
  organizationId,
  userId,
  accounts[0].id,
  new Date('2024-01-01'),
  new Date()
);
```

## 5. Example API Endpoints

Add the example controller to your module:

```typescript
import { TinkController } from './modules/integrations/tink/tink.controller.example';

@Module({
  controllers: [TinkController],
  // ...
})
```

Available endpoints:

- `GET /integrations/tink/authorize` - Start authorization
- `GET /integrations/tink/callback` - Handle OAuth callback
- `GET /integrations/tink/accounts` - Get bank accounts
- `GET /integrations/tink/transactions` - Get transactions
- `POST /integrations/tink/refresh` - Refresh token
- `DELETE /integrations/tink/credentials` - Disconnect bank
- `GET /integrations/tink/providers` - Get available banks

## 6. Security Checklist

- [ ] Set strong TINK_ENCRYPTION_KEY (32+ characters)
- [ ] Use HTTPS for redirect URI in production
- [ ] Enable TLS 1.3 on your server
- [ ] Add authentication guards to endpoints
- [ ] Monitor audit logs regularly
- [ ] Set up rate limit alerts
- [ ] Rotate encryption keys periodically
- [ ] Use environment-specific credentials

## 7. Testing

Run unit tests:

```bash
npm test tink.service.spec.ts
```

Mock mode is perfect for:
- Development without real bank connections
- CI/CD testing
- Demo environments
- Integration testing

## 8. Common Issues

### Issue: "Invalid or missing TINK_ENCRYPTION_KEY"
**Solution:** Ensure key is at least 32 characters long

### Issue: "No Tink credentials found"
**Solution:** User needs to complete authorization flow first

### Issue: "Failed to refresh access token"
**Solution:** Refresh token may be expired (90 days). User must re-authorize.

### Issue: Rate limit warnings
**Solution:** Implement caching for account/transaction data

## 9. Next Steps

- Add webhook handling for real-time updates
- Implement transaction categorization
- Add bank account reconciliation
- Build user-facing bank connection UI
- Set up monitoring and alerts
- Configure data retention policies

## 10. Support

- Tink Docs: https://docs.tink.com
- Tink Console: https://console.tink.com
- PSD2 Compliance: https://www.tink.com/psd2

## Quick Reference

```typescript
// Import
import { TinkService } from './modules/integrations/tink';

// Start auth
const { authorizationUrl } = await tinkService.startAuthorization(orgId, userId, 'DE');

// Complete auth
const token = await tinkService.completeAuthorization(code, state);

// Get accounts
const accounts = await tinkService.getAccounts(orgId, userId);

// Get transactions
const txns = await tinkService.getTransactions(orgId, userId, accountId);

// Disconnect
await tinkService.deleteCredentials(orgId, userId);
```
