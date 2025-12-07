# TrueLayer Sandbox to Production Migration Guide

## Quick Reference

### Environment Variable Changes

**Before (Sandbox):**
```bash
TRUELAYER_SANDBOX=true
TRUELAYER_CLIENT_ID=sandbox_client_id
TRUELAYER_CLIENT_SECRET=sandbox_secret
TRUELAYER_REDIRECT_URI=http://localhost:3000/integrations/truelayer/callback
```

**After (Production):**
```bash
TRUELAYER_ENV=production
TRUELAYER_CLIENT_ID=prod_client_id
TRUELAYER_CLIENT_SECRET=prod_secret
TRUELAYER_REDIRECT_URI=https://operate.guru/api/v1/integrations/truelayer/callback
TRUELAYER_WEBHOOK_URL=https://operate.guru/api/v1/integrations/truelayer/webhook
TRUELAYER_WEBHOOK_SECRET=your_webhook_secret
TRUELAYER_ENCRYPTION_KEY=your_encryption_key
```

## Pre-Migration Checklist

- [ ] Production TrueLayer account created
- [ ] Production credentials obtained
- [ ] HTTPS domain configured (operate.guru)
- [ ] SSL certificates valid
- [ ] Database tables created
- [ ] Redis running for job queues
- [ ] Backup of current sandbox data
- [ ] Scheduled tasks enabled

## Step 1: Obtain Production Credentials

### Register for Production Access

1. Visit [TrueLayer Console](https://console.truelayer.com/)
2. Create new application or promote sandbox app
3. Complete regulatory requirements:
   - Business verification
   - Terms of service agreement
   - Data protection compliance
   - PSD2 regulatory alignment

### Configure Production Application

**Application Settings:**
- **Name**: Operate Business Automation
- **Environment**: Production
- **Redirect URIs**:
  - `https://operate.guru/api/v1/integrations/truelayer/callback`
- **Webhook URL**:
  - `https://operate.guru/api/v1/integrations/truelayer/webhook`
- **Scopes**:
  - `info` - Provider information
  - `accounts` - Account details
  - `balance` - Account balances
  - `transactions` - Transaction history
  - `offline_access` - Refresh tokens
- **Providers**:
  - UK Open Banking (`uk-ob-all`)
  - German XS2A (`de-xs2a-all`)
  - Austrian XS2A (`at-xs2a-all`)

### Save Credentials

Copy and save securely:
- Client ID
- Client Secret
- Webhook Signing Secret

## Step 2: Update Application Configuration

### 2.1 Update .env File

```bash
# Production Configuration
TRUELAYER_ENV=production
TRUELAYER_CLIENT_ID=your_production_client_id
TRUELAYER_CLIENT_SECRET=your_production_secret
TRUELAYER_REDIRECT_URI=https://operate.guru/api/v1/integrations/truelayer/callback
TRUELAYER_WEBHOOK_URL=https://operate.guru/api/v1/integrations/truelayer/webhook
TRUELAYER_WEBHOOK_SECRET=your_webhook_secret
TRUELAYER_ENCRYPTION_KEY=your_32_char_key

# Remove or comment out sandbox config
# TRUELAYER_SANDBOX=true
```

### 2.2 Generate Encryption Key

```bash
# Generate a secure 32-character encryption key
openssl rand -base64 32
```

### 2.3 Verify Configuration

```bash
# Check environment variables are loaded
node -e "console.log(process.env.TRUELAYER_ENV)"  # Should output: production
```

## Step 3: Database Preparation

### 3.1 Verify Tables Exist

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'truelayer_oauth_states',
    'truelayer_connections',
    'truelayer_audit_logs'
  );
```

### 3.2 Create Missing Tables

If tables don't exist, run:

```sql
-- OAuth states (PKCE flow)
CREATE TABLE IF NOT EXISTS truelayer_oauth_states (
  user_id UUID NOT NULL,
  state VARCHAR(255) NOT NULL PRIMARY KEY,
  code_verifier VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_truelayer_oauth_user_id ON truelayer_oauth_states(user_id);
CREATE INDEX idx_truelayer_oauth_expires ON truelayer_oauth_states(expires_at);

-- Bank connections
CREATE TABLE IF NOT EXISTS truelayer_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  provider_id VARCHAR(255),
  provider_name VARCHAR(255),
  scopes JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  last_synced TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_truelayer_conn_user_id ON truelayer_connections(user_id);
CREATE INDEX idx_truelayer_conn_status ON truelayer_connections(status);
CREATE INDEX idx_truelayer_conn_expires ON truelayer_connections(expires_at);

-- Audit logs
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

### 3.3 Clean Sandbox Data (Optional)

If you have sandbox test data to remove:

```sql
-- Remove sandbox connections (CAREFUL - this deletes data!)
DELETE FROM truelayer_connections WHERE provider_id LIKE 'mock-%';

-- Or mark as inactive
UPDATE truelayer_connections
SET status = 'INACTIVE'
WHERE provider_id LIKE 'mock-%';
```

## Step 4: Deploy Application Updates

### 4.1 Build Application

```bash
cd operate-fresh
npm run build
```

### 4.2 Deploy to Server

```bash
# Copy built files to server
rsync -avz --exclude node_modules \
  ./apps/api/dist/ \
  cloudways:~/applications/eagqdkxvzv/public_html/apps/api/dist/

# Copy package files
scp apps/api/package.json cloudways:~/applications/eagqdkxvzv/public_html/apps/api/
```

### 4.3 Install Dependencies

```bash
ssh cloudways
cd ~/applications/eagqdkxvzv/public_html/apps/api
npm install --production
```

### 4.4 Update Environment Variables

```bash
# On server, edit .env file
nano .env

# Add production TrueLayer config
TRUELAYER_ENV=production
TRUELAYER_CLIENT_ID=prod_xxx
TRUELAYER_CLIENT_SECRET=prod_xxx
# ... etc
```

### 4.5 Restart Application

```bash
# Restart with updated environment
pm2 restart operate-api --update-env

# Verify it started correctly
pm2 logs operate-api --lines 50
```

## Step 5: Verification & Testing

### 5.1 Verify Service Initialization

Check logs for successful initialization:

```bash
ssh cloudways "pm2 logs operate-api --lines 100" | grep "TrueLayer"
```

Expected output:
```
TrueLayer Service initialized (Production mode)
```

### 5.2 Test OAuth Flow

```bash
# Create authorization link
curl -X POST https://operate.guru/api/v1/integrations/truelayer/auth \
  -H "Authorization: Bearer $YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id"
  }'
```

Expected response:
```json
{
  "authUrl": "https://auth.truelayer.com?response_type=code&client_id=...",
  "state": "xyz789...",
  "expiresAt": "2025-12-07T12:10:00Z"
}
```

### 5.3 Test Real Bank Connection

1. Open the `authUrl` in a browser
2. Select a real bank (e.g., HSBC, Barclays for UK)
3. Complete authentication with bank
4. Grant consent
5. Verify redirect to callback URL
6. Check connection created in database:

```sql
SELECT id, provider_id, provider_name, status, created_at
FROM truelayer_connections
ORDER BY created_at DESC
LIMIT 1;
```

### 5.4 Test Token Refresh

```bash
# Check token refresh stats
curl https://operate.guru/api/v1/integrations/truelayer/token-stats \
  -H "Authorization: Bearer $TOKEN"
```

### 5.5 Test Webhook Delivery

In TrueLayer Console:
1. Go to Webhooks section
2. Send test webhook
3. Verify it's received and processed
4. Check application logs:

```bash
ssh cloudways "pm2 logs operate-api | grep 'webhook'"
```

## Step 6: Enable Scheduled Jobs

### 6.1 Verify Cron Jobs Running

The token refresh job should run automatically every 6 hours.

Check if scheduled tasks are enabled:

```bash
# Check PM2 is running with cron module
pm2 list
```

### 6.2 Test Token Refresh Job

```bash
# Trigger manual refresh for testing
curl -X POST https://operate.guru/api/v1/integrations/truelayer/connections/{id}/refresh-tokens \
  -H "Authorization: Bearer $TOKEN"
```

### 6.3 Monitor Token Refresh

```sql
-- Check recent token refresh activity
SELECT action, COUNT(*) as count, MAX(created_at) as last_occurred
FROM truelayer_audit_logs
WHERE action LIKE 'TOKEN_%'
GROUP BY action
ORDER BY last_occurred DESC;
```

## Step 7: Configure Webhooks

### 7.1 Verify Webhook URL

In TrueLayer Console:
- Webhook URL: `https://operate.guru/api/v1/integrations/truelayer/webhook`
- Signing Secret: (copy from console)
- Events: All enabled

### 7.2 Update Webhook Secret

```bash
# On server
nano .env

# Add webhook secret from console
TRUELAYER_WEBHOOK_SECRET=whsec_your_secret_here
```

### 7.3 Restart Application

```bash
pm2 restart operate-api --update-env
```

### 7.4 Test Webhook Signature Verification

Send a test webhook from console and verify:
- 200 OK response
- No signature errors in logs
- Event processed correctly

## Step 8: Monitoring Setup

### 8.1 Set Up Alerts

Monitor these metrics:

1. **Token Refresh Failures**
   ```sql
   SELECT COUNT(*)
   FROM truelayer_audit_logs
   WHERE action = 'TOKEN_REFRESH_FAILED'
     AND created_at > NOW() - INTERVAL '1 hour';
   ```

2. **Expired Connections**
   ```sql
   SELECT COUNT(*)
   FROM truelayer_connections
   WHERE status = 'EXPIRED';
   ```

3. **Webhook Errors**
   ```bash
   pm2 logs operate-api | grep "webhook" | grep "ERROR"
   ```

### 8.2 Create Monitoring Dashboard

Track:
- Active connections count
- Token refresh success rate
- Webhook delivery success rate
- API error rates
- Average response times

## Rollback Plan

If issues occur, you can quickly rollback:

### Quick Rollback to Sandbox

```bash
# On server
nano .env

# Change back to sandbox
TRUELAYER_ENV=sandbox
TRUELAYER_CLIENT_ID=sandbox_client_id
TRUELAYER_CLIENT_SECRET=sandbox_secret

# Restart
pm2 restart operate-api --update-env
```

### Full Rollback

```bash
# Restore previous version
pm2 stop operate-api

# Restore backup
cp -r backup/apps/api/* ~/applications/eagqdkxvzv/public_html/apps/api/

# Restart
pm2 start operate-api
```

## Post-Migration Checklist

- [ ] OAuth flow working with real banks
- [ ] Token refresh job running every 6 hours
- [ ] Webhooks receiving and processing events
- [ ] No signature verification errors
- [ ] Connections marked as ACTIVE
- [ ] Audit logs recording all operations
- [ ] Error monitoring active
- [ ] Users can connect real bank accounts
- [ ] Transactions syncing correctly
- [ ] Balances updating correctly

## Common Issues & Solutions

### Issue: "Invalid client_id"

**Cause**: Wrong production credentials

**Solution**:
1. Double-check client ID in .env
2. Verify it matches TrueLayer console
3. Ensure no extra spaces or quotes

### Issue: "Redirect URI mismatch"

**Cause**: Callback URL doesn't match console configuration

**Solution**:
1. Check TRUELAYER_REDIRECT_URI in .env
2. Update TrueLayer console to match
3. Must be HTTPS in production
4. Must match exactly (including trailing slash)

### Issue: Webhook signature failures

**Cause**: Wrong webhook secret

**Solution**:
1. Copy exact secret from TrueLayer console
2. Update TRUELAYER_WEBHOOK_SECRET
3. Restart application
4. No extra spaces or encoding issues

### Issue: Token refresh not running

**Cause**: Scheduled tasks not enabled

**Solution**:
1. Verify `ScheduleModule.forRoot()` in module
2. Check `@Cron()` decorator on refresh method
3. Ensure PM2 running with proper settings
4. Check application logs for cron errors

## Support & Resources

### TrueLayer Documentation
- API Docs: https://docs.truelayer.com/
- Console: https://console.truelayer.com/
- Status Page: https://status.truelayer.com/

### Internal Resources
- Production Setup: `/apps/api/src/modules/integrations/truelayer/PRODUCTION.md`
- Service Implementation: `/apps/api/src/modules/integrations/truelayer/truelayer.service.ts`
- Token Refresh: `/apps/api/src/modules/integrations/truelayer/services/truelayer-token-refresh.service.ts`

### Getting Help
- Check audit logs for detailed error information
- Review TrueLayer API status page
- Contact TrueLayer support: support@truelayer.com
- Check application error logs: `pm2 logs operate-api`
