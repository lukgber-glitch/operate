# Plaid Production Deployment Guide

## Overview

This guide covers switching the Plaid integration from sandbox/development to production mode for the Operate application.

## Prerequisites

### 1. Plaid Production Approval

Before switching to production, you MUST complete Plaid's approval process:

- [ ] Complete Plaid dashboard onboarding
- [ ] Submit production access request
- [ ] Provide business information and use case
- [ ] Complete compliance documentation
- [ ] Receive production API credentials
- [ ] Request approval for specific products (Transactions, Auth)

**Timeline**: Plaid production approval typically takes 1-2 weeks.

### 2. Webhook Configuration

Production requires a secure webhook endpoint:

- [ ] HTTPS endpoint (not HTTP)
- [ ] Valid SSL certificate
- [ ] Publicly accessible (not localhost)
- [ ] Webhook signature verification enabled

**Webhook URL**: `https://operate.guru/api/v1/integrations/plaid/webhook`

### 3. Encryption Setup

- [ ] Generate a secure 32-character encryption key
- [ ] Store in `PLAID_ENCRYPTION_KEY` environment variable
- [ ] NEVER commit encryption keys to git

Generate key:
```bash
openssl rand -base64 32
```

## Environment Configuration

### Development/Sandbox Environment

```env
PLAID_ENV=sandbox
PLAID_CLIENT_ID=your-sandbox-client-id
PLAID_SECRET=your-sandbox-secret
PLAID_WEBHOOK_URL=https://operate.guru/api/v1/integrations/plaid/webhook
```

### Production Environment

```env
PLAID_ENV=production
PLAID_CLIENT_ID=your-production-client-id
PLAID_SECRET=your-production-secret
PLAID_WEBHOOK_URL=https://operate.guru/api/v1/integrations/plaid/webhook
PLAID_WEBHOOK_SECRET=your-webhook-verification-key
PLAID_REDIRECT_URI=https://operate.guru/integrations/plaid/callback
PLAID_ENCRYPTION_KEY=your-32-character-encryption-key
```

## Production Checklist

### 1. API Configuration

- [ ] Update `PLAID_ENV=production` in `.env`
- [ ] Set production `PLAID_CLIENT_ID`
- [ ] Set production `PLAID_SECRET`
- [ ] Configure `PLAID_WEBHOOK_URL` (must be HTTPS)
- [ ] Set `PLAID_WEBHOOK_SECRET` for signature verification
- [ ] Set `PLAID_ENCRYPTION_KEY` (32+ characters)
- [ ] Verify `PLAID_REDIRECT_URI` is correct

### 2. Webhook Setup

Register your webhook URL in Plaid Dashboard:

1. Go to Plaid Dashboard → Settings → Webhooks
2. Add webhook URL: `https://operate.guru/api/v1/integrations/plaid/webhook`
3. Select webhook events:
   - ✅ Transactions: SYNC_UPDATES_AVAILABLE
   - ✅ Item: ERROR, PENDING_EXPIRATION
   - ✅ Auth: AUTOMATICALLY_VERIFIED
4. Save webhook verification key to `PLAID_WEBHOOK_SECRET`

### 3. Product Configuration

Ensure you only request approved products:

```typescript
// Production products (must be approved)
products: [Products.Transactions, Products.Auth]

// NOT in production (unless specifically approved)
// Products.Balance, Products.Identity, Products.Investments
```

### 4. Error Handling

Production error handling features:

- ✅ User-friendly error messages
- ✅ ITEM_LOGIN_REQUIRED detection
- ✅ Automatic re-authentication prompts
- ✅ Rate limit handling
- ✅ Institution downtime handling
- ✅ Comprehensive logging

### 5. Rate Limiting

Plaid production limits:

| Endpoint | Limit |
|----------|-------|
| Most endpoints | 100 req/min |
| Burst | 200 req/min |
| Item removal | 10 req/min |

Rate limiter is automatically enabled - no configuration needed.

### 6. Security

- ✅ Access tokens encrypted with AES-256-GCM
- ✅ Webhook signature verification
- ✅ Audit logging for all API calls
- ✅ No tokens in logs
- ✅ HTTPS required

### 7. Monitoring

Implement monitoring for:

- [ ] Connection health checks (daily)
- [ ] Failed webhook deliveries
- [ ] Re-authentication requests
- [ ] API error rates
- [ ] Sync failures

### 8. User Notifications

Set up notifications for:

- [ ] Connection requires re-authentication
- [ ] Connection will expire soon
- [ ] Bank institution downtime
- [ ] Transaction sync failures

## Testing Production

### 1. Use Development Environment First

Before going to production, test with Plaid Development environment:

```env
PLAID_ENV=development
```

Development environment uses real bank credentials but against test servers.

### 2. Test Scenarios

- [ ] Create link token
- [ ] Connect bank account
- [ ] Exchange public token
- [ ] Fetch accounts
- [ ] Sync transactions
- [ ] Handle re-authentication
- [ ] Test webhook delivery
- [ ] Verify encryption/decryption
- [ ] Test error scenarios

### 3. Webhook Testing

Test webhook locally with ngrok:

```bash
ngrok http 3000
# Use ngrok URL as temporary webhook URL
```

Test webhook events:
1. Go to Plaid Dashboard → Webhooks
2. Send test webhooks
3. Verify proper handling in logs

## Migration Strategy

### Option 1: Gradual Migration (Recommended)

1. **Week 1**: Enable development environment
   ```env
   PLAID_ENV=development
   ```
2. **Week 2-3**: Test with internal users
3. **Week 4**: Submit production approval
4. **Week 5-6**: Plaid review process
5. **Week 7**: Switch to production
   ```env
   PLAID_ENV=production
   ```

### Option 2: Environment-Based

Use different environments for different user segments:

```typescript
const env = user.isBetaTester ? 'development' : 'production';
```

## Troubleshooting

### Common Production Errors

#### ITEM_LOGIN_REQUIRED

**Cause**: User needs to re-authenticate with bank

**Solution**:
1. System detects via webhook
2. Connection marked as ERROR
3. User shown re-authentication prompt
4. Call `/plaid/connections/:itemId/reauth` to get update token

```typescript
// Frontend handling
if (connection.needsReauth) {
  const { linkToken } = await api.post(`/plaid/connections/${itemId}/reauth`);
  // Open Plaid Link with update token
}
```

#### INSTITUTION_NOT_RESPONDING

**Cause**: Bank's API is temporarily down

**Solution**: Retry with exponential backoff

#### RATE_LIMIT_EXCEEDED

**Cause**: Too many API requests

**Solution**: Rate limiter automatically handles this

### Monitoring Dashboard

Check connection health:

```bash
GET /plaid/connections/:itemId/health
```

Response:
```json
{
  "healthy": false,
  "lastSync": "2024-12-01T10:00:00Z",
  "error": "Bank connection needs re-authentication",
  "errorCode": "ITEM_LOGIN_REQUIRED",
  "needsReauth": true
}
```

## Compliance & Data Privacy

### Data Retention

- Access tokens: Encrypted, stored indefinitely while connection active
- Transaction data: Per user's data retention policy
- Audit logs: 90 days minimum

### User Permissions

Users must explicitly consent to:
1. Connecting their bank account
2. Data collection types
3. Data usage purposes

### Data Access

- Only request products you need
- Use minimum required scopes
- Delete data when user disconnects

### Plaid Compliance

Plaid handles:
- ✅ PCI DSS compliance
- ✅ SOC 2 Type II certification
- ✅ Bank-level security
- ✅ TLS encryption

Your responsibilities:
- ⚠️ Secure storage of access tokens
- ⚠️ User consent management
- ⚠️ Data access logging
- ⚠️ Proper data deletion

## Support & Resources

### Plaid Resources

- Dashboard: https://dashboard.plaid.com
- Documentation: https://plaid.com/docs
- Status Page: https://status.plaid.com
- Support: support@plaid.com

### Internal Resources

- Plaid Service: `apps/api/src/modules/integrations/plaid/plaid.service.ts`
- Webhook Handler: `apps/api/src/modules/integrations/plaid/plaid.controller.ts`
- Rate Limiter: `apps/api/src/modules/integrations/plaid/services/plaid-rate-limiter.service.ts`

## Rollback Plan

If issues occur in production:

1. **Immediate**: Switch back to sandbox
   ```env
   PLAID_ENV=sandbox
   ```

2. **Restart API**:
   ```bash
   ssh cloudways "cd ~/applications/eagqdkxvzv/public_html/apps/api && pm2 restart operate-api"
   ```

3. **Notify Users**: Send email about temporary bank connection issues

4. **Debug**: Review logs
   ```bash
   ssh cloudways "cd ~/applications/eagqdkxvzv/public_html/apps/api && pm2 logs operate-api --lines 100"
   ```

## Post-Production

### Week 1 After Launch

- [ ] Monitor error rates daily
- [ ] Check webhook delivery rates
- [ ] Review user feedback
- [ ] Monitor re-authentication rates
- [ ] Check sync success rates

### Ongoing Maintenance

- [ ] Weekly: Review connection health
- [ ] Monthly: Audit access logs
- [ ] Quarterly: Review Plaid product usage
- [ ] Annually: Security audit

## Success Metrics

Track these metrics:

- **Connection Success Rate**: >95%
- **Webhook Delivery Rate**: >99%
- **Sync Success Rate**: >98%
- **Re-auth Rate**: <5% per month
- **API Error Rate**: <1%

## European Banks (Future)

For German/Austrian banks, Plaid requires additional compliance:

- [ ] PSD2 compliance documentation
- [ ] GDPR data processing agreements
- [ ] Strong Customer Authentication (SCA) support
- [ ] Country-specific product approval

Use TrueLayer or Tink for EU/UK markets instead of Plaid.

---

**Last Updated**: 2024-12-07
**Maintainer**: BRIDGE Agent
**Review Cycle**: Quarterly
