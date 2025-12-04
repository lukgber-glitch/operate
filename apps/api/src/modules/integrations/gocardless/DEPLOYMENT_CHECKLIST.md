# GoCardless Integration - Deployment Checklist

## Pre-Deployment Steps

### 1. Database Migration ⬜

```bash
# Step 1: Add models to main schema
# Copy content from packages/database/prisma/gocardless-schema.prisma
# Paste into packages/database/prisma/schema.prisma

# Step 2: Run migration
cd packages/database
pnpm prisma migrate dev --name add_gocardless_integration

# Step 3: Generate Prisma client
pnpm prisma generate

# Step 4: Verify migration
pnpm prisma migrate status
```

### 2. Module Registration ⬜

```typescript
// File: apps/api/src/app.module.ts

import { GoCardlessModule } from './modules/integrations/gocardless';

@Module({
  imports: [
    // ... existing imports
    GoCardlessModule,  // Add this line
  ],
})
export class AppModule {}
```

### 3. Environment Configuration ⬜

```bash
# Step 1: Generate encryption key
openssl rand -hex 32

# Step 2: Add to .env file
cat >> .env << 'EOF'

# GoCardless Configuration
GOCARDLESS_ACCESS_TOKEN=sandbox_xxx  # Get from GoCardless dashboard
GOCARDLESS_ENV=sandbox
GOCARDLESS_WEBHOOK_SECRET=xxx  # Get from GoCardless webhook settings
GOCARDLESS_WEBHOOK_URL=https://your-api.com/integrations/gocardless/webhooks
GOCARDLESS_REDIRECT_URI=https://your-app.com/integrations/gocardless/callback
GOCARDLESS_ENCRYPTION_KEY=<paste_generated_key_here>
GOCARDLESS_MOCK_MODE=false
EOF

# Step 3: Verify environment variables
grep GOCARDLESS .env
```

### 4. GoCardless Account Setup ⬜

**Sandbox Setup:**
1. ⬜ Create sandbox account: https://manage-sandbox.gocardless.com/signup
2. ⬜ Complete organization profile
3. ⬜ Navigate to Developers > Access Tokens
4. ⬜ Create new access token
5. ⬜ Copy token to `GOCARDLESS_ACCESS_TOKEN` in .env
6. ⬜ Navigate to Developers > Webhooks
7. ⬜ Add webhook URL: `https://your-api.com/integrations/gocardless/webhooks`
8. ⬜ Copy webhook secret to `GOCARDLESS_WEBHOOK_SECRET` in .env

**Live Setup (Later):**
1. ⬜ Create live account: https://manage.gocardless.com/signup
2. ⬜ Complete verification process
3. ⬜ Get live access token
4. ⬜ Update environment to `GOCARDLESS_ENV=live`
5. ⬜ Update webhook URL for production

## Testing Checklist

### 1. Unit Tests ⬜

```bash
# Run tests
pnpm test gocardless

# Expected results:
# ✓ GoCardlessService should initialize
# ✓ GoCardlessAuthService should encrypt/decrypt tokens
# ✓ GoCardlessMandateService should create redirect flow
# ✓ GoCardlessPaymentService should create payment
# ✓ Webhook signature verification should work
```

### 2. Integration Tests ⬜

**Test Mandate Creation Flow:**

```bash
# Step 1: Start API server
pnpm start:dev

# Step 2: Create redirect flow
curl -X POST http://localhost:3000/integrations/gocardless/mandates/create-flow?orgId=test_org \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "test_customer",
    "scheme": "bacs",
    "successRedirectUrl": "http://localhost:3000/success",
    "description": "Test mandate"
  }'

# Expected: Redirect URL returned
# ✓ redirectUrl should be GoCardless URL
# ✓ redirectFlowId should be saved to database

# Step 3: Test complete flow (after manual authorization)
curl -X POST http://localhost:3000/integrations/gocardless/mandates/complete-flow/RE123

# Expected: Mandate object returned
# ✓ Mandate should be saved to database
# ✓ Status should be pending_submission
```

**Test Payment Creation:**

```bash
curl -X POST http://localhost:3000/integrations/gocardless/payments?orgId=test_org&userId=test_user \
  -H "Content-Type: application/json" \
  -d '{
    "mandateId": "MD000123",
    "amount": 10.00,
    "currency": "GBP",
    "reference": "TEST-001"
  }'

# Expected: Payment object returned
# ✓ Payment should be saved to database
# ✓ Status should be pending_submission
```

**Test Webhook:**

```bash
# Use GoCardless dashboard to trigger test webhook
# Or use this curl (with proper signature):

curl -X POST http://localhost:3000/integrations/gocardless/webhooks \
  -H "Content-Type: application/json" \
  -H "Webhook-Signature: <signature>" \
  -d '{
    "events": [{
      "id": "EV123",
      "created_at": "2025-12-02T12:00:00.000Z",
      "resource_type": "payments",
      "action": "confirmed",
      "links": {
        "payment": "PM123"
      },
      "details": {
        "origin": "bank",
        "cause": "payment_confirmed",
        "description": "Payment confirmed"
      }
    }]
  }'

# Expected: 204 No Content
# ✓ Event should be saved to database
# ✓ Payment status should be updated
```

### 3. Mock Mode Testing ⬜

```bash
# Step 1: Enable mock mode
export GOCARDLESS_MOCK_MODE=true

# Step 2: Test without credentials
pnpm start:dev

# Step 3: Create test mandate
# Should work without real GoCardless credentials
# ✓ Mock data should be returned
# ✓ Database should be updated
# ✓ No API calls should be made
```

## Production Deployment Checklist

### 1. Pre-Production ⬜

- ⬜ All tests passing
- ⬜ Code review completed
- ⬜ Security review completed
- ⬜ Documentation reviewed
- ⬜ GoCardless live account approved
- ⬜ SSL certificate installed
- ⬜ Webhook URL accessible
- ⬜ Backup strategy in place

### 2. Environment Setup ⬜

```bash
# Production environment variables
GOCARDLESS_ACCESS_TOKEN=live_xxx  # LIVE TOKEN
GOCARDLESS_ENV=live              # CHANGE TO LIVE
GOCARDLESS_WEBHOOK_SECRET=xxx    # PRODUCTION SECRET
GOCARDLESS_WEBHOOK_URL=https://api.production.com/integrations/gocardless/webhooks
GOCARDLESS_REDIRECT_URI=https://app.production.com/integrations/gocardless/callback
GOCARDLESS_ENCRYPTION_KEY=xxx    # NEW KEY FOR PRODUCTION
GOCARDLESS_MOCK_MODE=false
```

### 3. Database ⬜

- ⬜ Production migration completed
- ⬜ Database backup created
- ⬜ Indexes verified
- ⬜ Constraints verified

### 4. Monitoring Setup ⬜

- ⬜ Error tracking configured (Sentry, etc.)
- ⬜ Performance monitoring active
- ⬜ Webhook delivery monitoring
- ⬜ Payment failure alerts configured
- ⬜ Daily health check scheduled

### 5. Security ⬜

- ⬜ Access tokens stored encrypted
- ⬜ Webhook signature verification enabled
- ⬜ Rate limiting configured
- ⬜ HTTPS enforced
- ⬜ Audit logging enabled
- ⬜ Error messages sanitized (no sensitive data)

### 6. Compliance ⬜

- ⬜ Data protection policy updated
- ⬜ Privacy policy includes Direct Debit info
- ⬜ Terms of service updated
- ⬜ Customer communication templates ready
- ⬜ Refund policy documented

## Post-Deployment Verification

### 1. Smoke Tests ⬜

```bash
# Test 1: Health check
curl https://api.production.com/health

# Test 2: Connection status
curl https://api.production.com/integrations/gocardless/status?orgId=xxx \
  -H "Authorization: Bearer <token>"

# Test 3: Create test mandate (with real customer)
# Follow complete flow end-to-end

# Test 4: Create test payment (small amount)
# Verify payment appears in GoCardless dashboard
```

### 2. Monitoring ⬜

- ⬜ Check error logs (should be minimal)
- ⬜ Verify webhook delivery (check dashboard)
- ⬜ Monitor API response times
- ⬜ Check database performance
- ⬜ Review audit logs

### 3. Customer Testing ⬜

- ⬜ Test mandate creation flow (UI)
- ⬜ Test payment success flow
- ⬜ Test payment failure flow
- ⬜ Test cancellation flow
- ⬜ Verify email notifications
- ⬜ Verify customer dashboard

## Rollback Plan

If issues occur:

### Quick Rollback ⬜

```bash
# Step 1: Disable module
# Comment out GoCardlessModule in app.module.ts

# Step 2: Redeploy
git revert <commit>
pnpm build
pm2 restart all

# Step 3: Verify
curl https://api.production.com/health
```

### Database Rollback ⬜

```bash
# Revert migration
pnpm prisma migrate reset

# Restore from backup
# (Use your backup restoration procedure)
```

## Support Documentation

### 1. Customer Support ⬜

- ⬜ Support team trained on Direct Debit
- ⬜ FAQ document created
- ⬜ Troubleshooting guide ready
- ⬜ Escalation process documented

### 2. Developer Documentation ⬜

- ⬜ API documentation published
- ⬜ Integration guide accessible
- ⬜ Webhook event reference available
- ⬜ Error code documentation

## Success Criteria

✅ All checklist items completed
✅ Tests passing (unit + integration)
✅ Production deployment successful
✅ First mandate created successfully
✅ First payment processed successfully
✅ Webhooks delivering correctly
✅ No critical errors in logs
✅ Monitoring active and alerting
✅ Support team ready

## Timeline

- **Day 1**: Database migration, environment setup
- **Day 2**: Testing (unit, integration, mock)
- **Day 3**: Production deployment preparation
- **Day 4**: Production deployment
- **Day 5**: Post-deployment verification
- **Week 2**: Monitor and optimize

## Contact

- **GoCardless Support**: support@gocardless.com
- **API Status**: https://status.gocardless.com
- **Dashboard**: https://manage.gocardless.com

## Notes

Add deployment notes here:

```
Date: ___________
Deployed by: ___________
Issues encountered: ___________
Resolution: ___________
```

---

**Status**: ⬜ Not Started | ⏳ In Progress | ✅ Complete
**Last Updated**: 2025-12-02
