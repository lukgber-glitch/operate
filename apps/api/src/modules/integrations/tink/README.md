# Tink Open Banking Integration

PSD2-compliant Open Banking integration for EU bank connections using Tink API.

## Features

- OAuth2 with PKCE authorization flow
- AES-256-GCM encrypted token storage
- Support for 14+ EU markets (DE, AT, FR, GB, etc.)
- Account and transaction data retrieval
- Mock mode for development/testing
- Comprehensive audit logging
- Rate limit awareness
- TLS 1.3 enforced

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Tink API Configuration
TINK_CLIENT_ID=your_client_id_here
TINK_CLIENT_SECRET=your_client_secret_here
TINK_REDIRECT_URI=http://localhost:3000/integrations/tink/callback
TINK_ENVIRONMENT=sandbox # or production
TINK_MOCK_MODE=false # true for development without real API

# Encryption (uses JWT_SECRET if not set)
TINK_ENCRYPTION_KEY=your_32_character_encryption_key_here
```

### Mock Mode

For development without real Tink API credentials:

```bash
TINK_MOCK_MODE=true
```

This returns realistic mock data for all API calls.

## Database Schema

Required tables (add to Prisma schema):

```prisma
model TinkCredentials {
  id             String   @id @default(cuid())
  organizationId String   @map("organization_id")
  userId         String   @map("user_id")
  accessToken    String   @map("access_token") @db.Text // Encrypted
  refreshToken   String   @map("refresh_token") @db.Text // Encrypted
  expiresAt      DateTime @map("expires_at")
  scope          String
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@unique([organizationId, userId])
  @@map("tink_credentials")
}

model TinkAuthorizationFlow {
  id             String   @id @default(cuid())
  state          String   @unique
  codeVerifier   String   @map("code_verifier")
  codeChallenge  String   @map("code_challenge")
  organizationId String   @map("organization_id")
  userId         String   @map("user_id")
  redirectUri    String   @map("redirect_uri")
  scope          String
  createdAt      DateTime @default(now()) @map("created_at")
  expiresAt      DateTime @map("expires_at")

  @@map("tink_authorization_flows")
}

model TinkAuditLog {
  id             String   @id @default(cuid())
  organizationId String   @map("organization_id")
  userId         String   @map("user_id")
  action         String
  endpoint       String
  method         String
  statusCode     Int      @map("status_code")
  requestId      String?  @map("request_id")
  duration       Int      // milliseconds
  timestamp      DateTime @default(now())
  metadata       Json?

  @@index([organizationId, userId])
  @@index([timestamp])
  @@map("tink_audit_logs")
}
```

## Usage

### 1. Import Module

```typescript
import { TinkModule } from './modules/integrations/tink';

@Module({
  imports: [TinkModule],
})
export class AppModule {}
```

### 2. Start Authorization Flow

```typescript
const { authorizationUrl, state } = await tinkService.startAuthorization(
  organizationId,
  userId,
  'DE', // market
  'en_US' // locale
);

// Redirect user to authorizationUrl
```

### 3. Handle Callback

```typescript
const token = await tinkService.completeAuthorization(code, state);
```

### 4. Fetch Accounts

```typescript
const accounts = await tinkService.getAccounts(organizationId, userId);
```

### 5. Fetch Transactions

```typescript
const transactions = await tinkService.getTransactions(
  organizationId,
  userId,
  accountId,
  new Date('2024-01-01'), // optional start date
  new Date('2024-12-31')  // optional end date
);
```

### 6. Refresh Token (Automatic)

The service automatically refreshes tokens when needed. Tokens are checked before each API call and refreshed if expiring within 5 minutes.

### 7. Revoke Access

```typescript
await tinkService.deleteCredentials(organizationId, userId);
```

## Security Features

### 1. OAuth2 with PKCE
- Code verifier generated using crypto.randomBytes(32)
- SHA-256 code challenge
- State parameter for CSRF protection

### 2. Token Encryption
- AES-256-GCM encryption
- PBKDF2 key derivation (100,000 iterations)
- Unique IV per encryption
- Authentication tags for integrity

### 3. TLS 1.3
- Enforced minimum TLS version
- Certificate validation enabled

### 4. Audit Logging
- All API calls logged
- Duration tracking
- Error logging
- Metadata capture

## Supported Markets

- AT - Austria
- BE - Belgium
- DE - Germany
- DK - Denmark
- ES - Spain
- FI - Finland
- FR - France
- GB - United Kingdom
- IT - Italy
- NL - Netherlands
- NO - Norway
- PL - Poland
- PT - Portugal
- SE - Sweden

## Error Handling

The service throws standard NestJS exceptions:

- `BadRequestException` - Invalid request parameters
- `UnauthorizedException` - Missing or invalid credentials
- `ServiceUnavailableException` - Tink API unavailable
- `InternalServerErrorException` - Unexpected errors

## Rate Limits

Tink API rate limits are tracked automatically:

- Token endpoint: 60 req/min
- Accounts endpoint: 100 req/min
- Transactions endpoint: 100 req/min

Warnings are logged when limits are low.

## Testing

Mock mode provides realistic test data:

```typescript
// Set in .env
TINK_MOCK_MODE=true

// Returns mock data for:
// - 3 bank accounts (checking, savings, credit card)
// - 50 transactions per account
// - 2 bank providers (DE, AT)
```

## Tink API Documentation

- Base URL: https://api.tink.com
- Link URL: https://link.tink.com/1.0
- Docs: https://docs.tink.com

## Notes

- Refresh tokens are long-lived (typically 90 days)
- Access tokens expire after 1 hour
- Consent must be renewed every 90 days (PSD2 requirement)
- All tokens are stored encrypted
- PKCE is mandatory for security
