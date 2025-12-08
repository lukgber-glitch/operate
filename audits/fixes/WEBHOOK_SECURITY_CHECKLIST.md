# Webhook Security Implementation Checklist

**Date:** 2025-12-08
**Related:** SEC-004 + H-003

---

## Quick Action Items (Priority Order)

### ⚠️ CRITICAL - Deploy Within 24 Hours

- [ ] **Plaid Webhook** - Make signature verification MANDATORY
  - File: `apps/api/src/modules/integrations/plaid/plaid.controller.ts`
  - Lines: 248-267
  - Change: Remove `if (signature)` optional check, throw error if missing

- [ ] **TrueLayer Webhook** - Make signature verification MANDATORY
  - File: `apps/api/src/modules/integrations/truelayer/truelayer.controller.ts`
  - Lines: 386-405
  - Change: Remove `if (signature)` optional check, throw error if missing

- [ ] **Configure Production Secrets**
  - Set `PLAID_WEBHOOK_SECRET` in production environment
  - Set `TRUELAYER_WEBHOOK_SECRET` in production environment
  - Set `TINK_WEBHOOK_SECRET` in production environment

### 🔴 HIGH - Deploy Within 48 Hours

- [ ] **GoCardless Webhook** - Fix body encoding issue
  - File: `apps/api/src/modules/integrations/gocardless/gocardless-webhook.controller.ts`
  - Lines: 59-74
  - Change: Use `req.rawBody` instead of `JSON.stringify(rawBody)`

- [ ] **Gusto Webhook** - Remove fallback to JSON.stringify
  - File: `apps/api/src/modules/integrations/gusto/gusto-webhook.controller.ts`
  - Lines: 48-66
  - Change: Require rawBody, fail if missing

- [ ] **Configure Additional Secrets**
  - Set `GOCARDLESS_WEBHOOK_SECRET`
  - Set `GUSTO_WEBHOOK_SECRET`
  - Set `WISE_WEBHOOK_SECRET`
  - Set `PERSONA_WEBHOOK_SECRET`

### 🟡 MEDIUM - Deploy Within 1 Week

- [ ] **ComplyAdvantage Webhook** - Require secret at startup
  - File: `apps/api/src/modules/integrations/comply-advantage/comply-advantage-webhook.controller.ts`
  - Lines: 30-32, 54-56
  - Change: Throw error if `COMPLY_ADVANTAGE_WEBHOOK_SECRET` not set

- [ ] **Update .env.example**
  - Add all missing webhook secret entries
  - Add comments explaining security importance

- [ ] **Create Reusable Guard** (Optional but recommended)
  - Create `apps/api/src/common/guards/webhook-signature.guard.ts`
  - Migrate existing webhooks to use guard

---

## Code Snippets for Quick Copy-Paste

### 1. Mandatory Signature Check Pattern

```typescript
// ✅ USE THIS PATTERN for all webhooks
async handleWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Body() payload: WebhookPayloadDto,
  @Headers('x-signature-header') signature: string,  // NOT optional
) {
  // STEP 1: Validate signature header exists
  if (!signature) {
    this.logger.error('Webhook rejected: Missing signature header');
    throw new UnauthorizedException('Missing signature header');
  }

  // STEP 2: Validate raw body exists
  const rawBody = req.rawBody;
  if (!rawBody) {
    this.logger.error('Webhook rejected: Missing raw body');
    throw new BadRequestException('Missing raw body for signature verification');
  }

  // STEP 3: Verify signature
  const isValid = this.verifySignature(rawBody.toString('utf8'), signature);
  if (!isValid) {
    this.logger.error('Webhook rejected: Invalid signature');
    throw new UnauthorizedException('Invalid webhook signature');
  }

  // STEP 4: Process webhook
  this.logger.log('Webhook signature verified successfully');
  await this.processWebhook(payload);
}
```

### 2. Generic Signature Verification Function

```typescript
verifySignature(rawBody: string, signature: string): boolean {
  const secret = this.configService.get<string>('WEBHOOK_SECRET');

  if (!secret) {
    throw new Error('WEBHOOK_SECRET not configured');
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    this.logger.error('Signature verification failed', error);
    return false;
  }
}
```

---

## Testing Commands

### Test Webhook with Valid Signature

```bash
# Generate signature
WEBHOOK_SECRET="your-secret-here"
PAYLOAD='{"event":"test","data":"value"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | cut -d' ' -f2)

# Send webhook
curl -X POST https://operate.guru/api/v1/integrations/plaid/webhook \
  -H "Content-Type: application/json" \
  -H "plaid-verification: $SIGNATURE" \
  -d "$PAYLOAD"
```

### Test Webhook with Invalid Signature (Should Fail)

```bash
curl -X POST https://operate.guru/api/v1/integrations/plaid/webhook \
  -H "Content-Type: application/json" \
  -H "plaid-verification: invalid-signature-12345" \
  -d '{"event":"test","data":"value"}'

# Expected: 401 Unauthorized
```

### Test Webhook without Signature (Should Fail)

```bash
curl -X POST https://operate.guru/api/v1/integrations/plaid/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":"value"}'

# Expected: 401 Unauthorized
```

---

## Environment Variables to Add

Add to `.env` and deployment environments:

```bash
# ==========================================
# WEBHOOK SIGNATURE SECRETS (ALL REQUIRED)
# ==========================================

# Banking Webhooks
PLAID_WEBHOOK_SECRET=
TRUELAYER_WEBHOOK_SECRET=
TINK_WEBHOOK_SECRET=
WISE_WEBHOOK_SECRET=

# Payment Webhooks
STRIPE_WEBHOOK_SECRET=
GOCARDLESS_WEBHOOK_SECRET=

# HR/Payroll Webhooks
GUSTO_WEBHOOK_SECRET=

# Compliance Webhooks
PERSONA_WEBHOOK_SECRET=
COMPLY_ADVANTAGE_WEBHOOK_SECRET=
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code review completed
- [ ] Unit tests added/updated
- [ ] Integration tests passing
- [ ] Secrets added to all environments (dev/staging/prod)
- [ ] Documentation updated

### Deployment
- [ ] Deploy to staging
- [ ] Test each webhook provider in staging
- [ ] Monitor error logs for 2 hours
- [ ] Deploy to production
- [ ] Test production webhooks
- [ ] Monitor for 24 hours

### Post-Deployment
- [ ] All webhooks processing successfully
- [ ] No spike in 401 errors (beyond expected)
- [ ] Alert team of new security requirements
- [ ] Update incident response runbook

---

## Metrics to Monitor

After deployment, watch these metrics:

| Metric | Expected Behavior | Alert If |
|--------|-------------------|----------|
| Webhook success rate | Same as before | Drops >5% |
| 401 errors | May increase (bots blocked) | Increase >10x |
| Webhook processing time | Same as before | Increases >2x |
| Missing signature errors | New metric, should be low | >10/hour |
| Invalid signature errors | New metric, should be low | >10/hour |

---

## Rollback Plan

If deployment causes issues:

1. **Immediate Rollback:**
   ```bash
   # Revert to previous deployment
   git revert <commit-hash>
   # Redeploy
   ```

2. **Temporary Workaround** (ONLY if critical business impact):
   ```typescript
   // In webhook controller (TEMPORARY ONLY)
   const DEV_MODE = process.env.NODE_ENV !== 'production';
   if (!signature && DEV_MODE) {
     this.logger.warn('DEV MODE: Skipping signature verification');
   } else {
     // Normal verification
   }
   ```

3. **Contact Providers:**
   - Verify webhook secrets haven't changed
   - Request test webhook delivery
   - Check provider status page

---

## Success Criteria

✅ Deployment considered successful when:
- All 10 webhook endpoints require signatures
- Zero legitimate webhooks rejected
- All webhook secrets configured in production
- Documentation updated
- Team trained on new requirements
- Monitoring alerts configured

---

## Questions & Support

**Technical Questions:**
- Review full report: `audits/fixes/p1-sec004-webhook-signatures.md`
- Contact: Backend team lead

**Security Questions:**
- Contact: SENTINEL (Security Agent)
- Escalate to: ATLAS (Project Manager)

**Deployment Support:**
- Contact: DevOps team
- Escalate to: On-call engineer

---

**Last Updated:** 2025-12-08
**Next Review:** After deployment completion
