# TrueLayer Production Mode Setup Guide

## Overview

This guide covers switching TrueLayer integration from sandbox to production mode for real EU/UK bank connections via Open Banking.

## Features

### Production Capabilities
- **UK Open Banking**: All UK banks via Open Banking standard
- **German XS2A**: N26, Deutsche Bank, Commerzbank, and more
- **Austrian XS2A**: Major Austrian banks
- **PSD2 Compliance**: Strong Customer Authentication (SCA)
- **Real-time Updates**: Webhooks for transactions, balances, and consent changes
- **Auto Token Refresh**: Scheduled refresh every 6 hours

### Security Features
- OAuth2 PKCE flow for authorization
- AES-256-GCM encrypted token storage
- Webhook signature verification
- Comprehensive audit logging
- Rate limiting on all endpoints
- HTTPS-only in production

## Environment Configuration

### Required Environment Variables

```bash
# TrueLayer Production Configuration
TRUELAYER_ENV=production                    # 'production' or 'sandbox'
TRUELAYER_CLIENT_ID=your_production_client_id
TRUELAYER_CLIENT_SECRET=your_production_secret
TRUELAYER_REDIRECT_URI=https://operate.guru/api/v1/integrations/truelayer/callback
TRUELAYER_WEBHOOK_URL=https://operate.guru/api/v1/integrations/truelayer/webhook
TRUELAYER_WEBHOOK_SECRET=your_webhook_secret
TRUELAYER_ENCRYPTION_KEY=your_32_character_encryption_key

# Legacy support (deprecated)
# TRUELAYER_SANDBOX=false
```

### Obtaining Production Credentials

1. **Sign up for TrueLayer Production**
   - Visit: https://console.truelayer.com/
   - Create a production application
   - Complete regulatory requirements (varies by jurisdiction)

2. **Configure Application**
   - **Redirect URI**: `https://operate.guru/api/v1/integrations/truelayer/callback`
   - **Webhook URL**: `https://operate.guru/api/v1/integrations/truelayer/webhook`
   - **Scopes**: `info accounts balance transactions offline_access`
   - **Providers**: UK Open Banking, DE XS2A, AT XS2A

3. **Generate Webhook Secret**
   ```bash
   openssl rand -hex 32
   ```

4. **Generate Encryption Key**
   ```bash
   openssl rand -base64 32
   ```

## Production Checklist

### Before Going Live

- [ ] **Production Credentials**
  - [ ] TRUELAYER_ENV=production
  - [ ] Production client ID configured
  - [ ] Production client secret configured
  - [ ] HTTPS redirect URI configured

- [ ] **Security**
  - [ ] Token encryption key set (32+ characters)
  - [ ] Webhook secret configured
  - [ ] Webhook signature verification enabled
  - [ ] HTTPS enforced on all endpoints
  - [ ] Rate limiting enabled

- [ ] **Infrastructure**
  - [ ] Redis running for BullMQ job queues
  - [ ] PostgreSQL database with required tables
  - [ ] Scheduled tasks enabled (NestJS @Schedule)
  - [ ] Background workers running

- [ ] **Monitoring**
  - [ ] Error logging configured
  - [ ] Audit logs enabled
  - [ ] Token refresh monitoring
  - [ ] Webhook delivery monitoring

- [ ] **Testing**
  - [ ] Test OAuth flow with sandbox first
  - [ ] Verify token refresh works
  - [ ] Test webhook signature validation
  - [ ] Verify connection status updates

### Required Database Tables

```sql
-- TrueLayer OAuth states (temporary storage for PKCE flow)
CREATE TABLE IF NOT EXISTS truelayer_oauth_states (
  user_id UUID NOT NULL,
  state VARCHAR(255) NOT NULL PRIMARY KEY,
  code_verifier VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_truelayer_oauth_user_id ON truelayer_oauth_states(user_id);
CREATE INDEX idx_truelayer_oauth_expires ON truelayer_oauth_states(expires_at);

-- TrueLayer bank connections
CREATE TABLE IF NOT EXISTS truelayer_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,           -- Encrypted
  refresh_token TEXT NOT NULL,          -- Encrypted
  expires_at TIMESTAMP NOT NULL,
  provider_id VARCHAR(255),
  provider_name VARCHAR(255),
  scopes JSONB NOT NULL,
  status VARCHAR(50) NOT NULL,          -- ACTIVE, EXPIRED, REVOKED, ERROR
  last_synced TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_truelayer_conn_user_id ON truelayer_connections(user_id);
CREATE INDEX idx_truelayer_conn_status ON truelayer_connections(status);
CREATE INDEX idx_truelayer_conn_expires ON truelayer_connections(expires_at);

-- TrueLayer audit logs
CREATE TABLE IF NOT EXISTS truelayer_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_truelayer_audit_user_id ON truelayer_audit_logs(user_id);
CREATE INDEX idx_truelayer_audit_action ON truelayer_audit_logs(action);
CREATE INDEX idx_truelayer_audit_created ON truelayer_audit_logs(created_at);
```

## Production URLs

### API Endpoints (automatically configured based on TRUELAYER_ENV)

**Sandbox:**
- Auth: `https://auth.truelayer-sandbox.com`
- API: `https://api.truelayer-sandbox.com`

**Production:**
- Auth: `https://auth.truelayer.com`
- API: `https://api.truelayer.com`

## Bank Coverage

### Production Mode

**United Kingdom:**
- All Open Banking banks (HSBC, Barclays, Lloyds, NatWest, etc.)
- Provider filter: `uk-ob-all`

**Germany:**
- N26, Deutsche Bank, Commerzbank, DKB, ING, and more
- Provider filter: `de-xs2a-all`

**Austria:**
- Major Austrian banks via XS2A
- Provider filter: `at-xs2a-all`

### Sandbox Mode
- Mock providers only
- Provider filter: `mock`

## Token Management

### Automatic Token Refresh

The system automatically refreshes tokens:

- **Schedule**: Every 6 hours (via `@Cron` decorator)
- **Threshold**: Refreshes tokens expiring within 12 hours
- **Service**: `TrueLayerTokenRefreshService`
- **Error Handling**: Marks connections as EXPIRED if refresh fails with 401

### Manual Token Refresh

```typescript
// Via API endpoint
POST /api/v1/integrations/truelayer/connections/:connectionId/refresh-tokens

// Via service
await trueLayerTokenRefreshService.refreshConnection(connectionId, userId);
```

### Connection States

- **ACTIVE**: Connection working, tokens valid
- **EXPIRED**: Token refresh failed, user needs to re-authenticate
- **REVOKED**: User revoked consent via bank
- **ERROR**: Unexpected error occurred

## Webhook Configuration

### Webhook Events

TrueLayer sends webhooks for:

1. **transaction.created**: New transaction detected
2. **account.updated**: Account details changed
3. **balance.updated**: Balance changed
4. **consent.revoked**: User revoked consent

### Webhook Handler

```typescript
@Post('webhook')
async handleWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Body() webhookDto: TrueLayerWebhookDto,
  @Headers('tl-signature') signature: string,
) {
  // 1. Verify signature
  const rawBody = req.rawBody.toString('utf8');
  const isValid = this.trueLayerService.verifyWebhookSignature(rawBody, signature);

  if (!isValid) {
    throw new UnauthorizedException('Invalid signature');
  }

  // 2. Process event
  switch (webhookDto.type) {
    case 'transaction.created':
      await this.syncQueue.add('webhook-transaction-sync', {...});
      break;
    case 'consent.revoked':
      await this.handleConsentRevoked(webhookDto.resource_id);
      break;
  }
}
```

### Webhook Signature Verification

Webhooks are signed with HMAC-SHA256:

```typescript
verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Rate Limits

### TrueLayer API Limits (per minute)

- Auth: 10 requests
- Token Exchange: 10 requests
- Accounts: 60 requests
- Balance: 60 requests
- Transactions: 60 requests
- Refresh Token: 10 requests

### Application Rate Limits

Configured via `@Throttle()` decorator on controller endpoints.

## PSD2 Strong Customer Authentication (SCA)

### How It Works

1. **User Consent**: User is redirected to their bank
2. **Bank Authentication**: User authenticates with bank (app, SMS, etc.)
3. **Consent Grant**: User approves data access
4. **Token Exchange**: Application receives access token
5. **90-Day Validity**: Consent valid for 90 days (EU regulation)
6. **Re-consent**: User must re-authenticate after 90 days

### Handling SCA in Code

```typescript
// OAuth flow automatically handles SCA
const authUrl = await trueLayerService.createAuthLink({
  userId: user.id,
  scopes: ['accounts', 'balance', 'transactions'],
});

// User is redirected to bank for SCA
// Bank handles authentication and consent
// User returns to callback URL after approval
```

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Token Refresh Success Rate**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE action = 'TOKEN_REFRESHED') as refreshed,
     COUNT(*) FILTER (WHERE action = 'TOKEN_REFRESH_FAILED') as failed
   FROM truelayer_audit_logs
   WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

2. **Expired Connections**
   ```sql
   SELECT COUNT(*)
   FROM truelayer_connections
   WHERE status = 'EXPIRED';
   ```

3. **Connections Expiring Soon**
   ```sql
   SELECT COUNT(*)
   FROM truelayer_connections
   WHERE status = 'ACTIVE'
     AND expires_at < NOW() + INTERVAL '24 hours';
   ```

4. **Webhook Processing**
   - Monitor BullMQ job queues
   - Track failed webhook deliveries
   - Alert on webhook signature failures

### Logging

All TrueLayer operations are logged with context:

```typescript
this.logger.log(`Refreshed tokens for connection ${connectionId}`);
this.logger.error(`Failed to refresh tokens: ${error.message}`, error.stack);
this.logger.warn(`Connection ${connectionId} requires re-authentication`);
```

### Audit Trail

Every operation is logged to `truelayer_audit_logs`:

- AUTH_LINK_CREATED
- TOKEN_EXCHANGED
- ACCOUNTS_FETCHED
- TRANSACTIONS_FETCHED
- BALANCE_FETCHED
- TOKEN_REFRESHED
- TOKEN_REFRESH_FAILED

## Testing Production Mode

### 1. Test OAuth Flow

```bash
# Create auth link
curl -X POST https://operate.guru/api/v1/integrations/truelayer/auth \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "scopes": ["info", "accounts", "balance", "transactions", "offline_access"]
  }'

# Returns authUrl - open in browser
# Complete bank authentication
# Exchange code for tokens at callback endpoint
```

### 2. Test Token Refresh

```bash
# Check token refresh stats
curl https://operate.guru/api/v1/integrations/truelayer/token-stats \
  -H "Authorization: Bearer $TOKEN"

# Manually trigger refresh
curl -X POST https://operate.guru/api/v1/integrations/truelayer/connections/{id}/refresh-tokens \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test Webhooks

```bash
# Send test webhook (with valid signature)
curl -X POST https://operate.guru/api/v1/integrations/truelayer/webhook \
  -H "tl-signature: $SIGNATURE" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "transaction.created",
    "event_id": "evt_123",
    "event_timestamp": "2025-12-07T12:00:00Z",
    "resource_id": "acc_123",
    "resource_type": "account"
  }'
```

## Troubleshooting

### Token Refresh Failures

**Symptom**: Connections marked as EXPIRED

**Causes**:
- Refresh token expired (90 days)
- User revoked consent at bank
- Bank connection issue

**Solution**:
1. Check audit logs for error details
2. Notify user to re-authenticate
3. Provide re-connection flow in UI

### Webhook Signature Failures

**Symptom**: 401 errors on webhook endpoint

**Causes**:
- Incorrect TRUELAYER_WEBHOOK_SECRET
- Webhook secret mismatch with TrueLayer console
- Raw body not available for signature verification

**Solution**:
1. Verify webhook secret in .env matches console
2. Ensure raw body is available: `@Req() req: RawBodyRequest<Request>`
3. Check NestJS raw body configuration

### Connection Status Issues

**Symptom**: Connections stuck in ERROR state

**Causes**:
- Unexpected API errors
- Network issues
- Database connection failures

**Solution**:
1. Check error logs
2. Retry token refresh
3. Update connection status manually if needed

## Migration from Sandbox to Production

### Step-by-Step Migration

1. **Get Production Credentials**
   - Apply for production access at TrueLayer console
   - Complete regulatory requirements
   - Obtain production client ID/secret

2. **Update Environment**
   ```bash
   TRUELAYER_ENV=production
   TRUELAYER_CLIENT_ID=prod_client_id
   TRUELAYER_CLIENT_SECRET=prod_secret
   ```

3. **Update Redirect URIs**
   - Ensure HTTPS URLs
   - Update in TrueLayer console
   - Update in application config

4. **Deploy Changes**
   ```bash
   npm run build
   pm2 restart operate-api --update-env
   ```

5. **Test OAuth Flow**
   - Test with real bank account
   - Verify SCA flow works
   - Check token refresh works

6. **Enable Webhooks**
   - Configure webhook URL in console
   - Verify signature validation works
   - Monitor webhook deliveries

7. **Monitor & Iterate**
   - Watch token refresh job
   - Monitor connection states
   - Track webhook processing

## Support

### TrueLayer Support
- Documentation: https://docs.truelayer.com/
- Console: https://console.truelayer.com/
- Support: support@truelayer.com

### Internal Support
- Service: `TrueLayerService`
- Token Refresh: `TrueLayerTokenRefreshService`
- Banking: `TrueLayerBankingService`
- Logs: Check `truelayer_audit_logs` table
