# Secret Rotation Guide

**Generated:** 2025-12-21
**Priority:** CRITICAL (BLOCK-005)
**Issue:** Secrets may be exposed in git history

---

## Overview

This guide covers rotating all secrets for the Operate application. All secrets should be regenerated before production deployment.

---

## 1. Critical Secrets (MUST Rotate)

### JWT Secrets
**Location:** API `.env`
**Impact:** Controls all authentication tokens

```bash
# Generate new secrets (run twice for each secret)
openssl rand -base64 32

# Update in .env
JWT_ACCESS_SECRET=<new-secret-1>
JWT_REFRESH_SECRET=<new-secret-2>
```

**After rotation:**
- All existing user sessions will be invalidated
- Users must re-login

---

### Database Credentials
**Location:** API `.env`
**Provider:** Neon PostgreSQL

```bash
# Steps:
# 1. Go to https://console.neon.tech
# 2. Select your project
# 3. Go to Settings > Connection > Reset Password
# 4. Update DATABASE_URL with new password
```

**Format:**
```
DATABASE_URL=postgresql://user:NEW_PASSWORD@host.neon.tech/neondb?sslmode=require
```

---

### Google OAuth Credentials
**Location:** API `.env`
**Console:** https://console.cloud.google.com/apis/credentials

```bash
# Steps:
# 1. Go to Google Cloud Console > APIs & Services > Credentials
# 2. Click on your OAuth 2.0 Client ID
# 3. Click "Reset Secret"
# 4. Update GOOGLE_CLIENT_SECRET in .env
# 5. Verify callback URL matches: GOOGLE_CALLBACK_URL
```

---

## 2. Third-Party API Keys

### Anthropic (AI)
**Console:** https://console.anthropic.com/settings/keys

```bash
# Steps:
# 1. Create a new API key
# 2. Delete the old key
# 3. Update ANTHROPIC_API_KEY in .env
```

---

### Stripe (Payments)
**Console:** https://dashboard.stripe.com/apikeys

```bash
# Steps:
# 1. Roll API keys in Stripe Dashboard
# 2. Update in .env:
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# 3. Update webhook secret:
# Dashboard > Developers > Webhooks > Select endpoint > Reveal signing secret
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### TrueLayer (UK/EU Banking)
**Console:** https://console.truelayer.com

```bash
# Steps:
# 1. Create new client secret in TrueLayer Console
# 2. Update in .env:
TRUELAYER_CLIENT_SECRET=<new-secret>
TRUELAYER_WEBHOOK_SECRET=<new-webhook-secret>
```

---

### Tink (EU Banking)
**Console:** https://console.tink.com

```bash
# Steps:
# 1. Rotate client secret in Tink Console
# 2. Update TINK_CLIENT_SECRET in .env
```

---

### Plaid (US Banking)
**Console:** https://dashboard.plaid.com/team/keys

```bash
# Steps:
# 1. Rotate secret in Plaid Dashboard
# 2. Update in .env:
PLAID_SECRET=<new-secret>
```

---

### SendGrid (Email)
**Console:** https://app.sendgrid.com/settings/api_keys

```bash
# Steps:
# 1. Create new API key with same permissions
# 2. Delete old API key
# 3. Update SENDGRID_API_KEY in .env
```

---

### Sentry (Error Tracking)
**Console:** https://sentry.io/settings/auth-tokens/

```bash
# Steps:
# 1. Create new auth token
# 2. Revoke old token
# 3. Update SENTRY_AUTH_TOKEN in .env
```

---

### Mindee (Receipt OCR)
**Console:** https://platform.mindee.com/account/api-keys

```bash
# Steps:
# 1. Create new API key
# 2. Delete old key
# 3. Update MINDEE_API_KEY in .env
```

---

## 3. Encryption Keys

### Generate New Encryption Keys
```bash
# For 32-character keys (AES-256)
openssl rand -hex 16

# Update these in .env:
TRUELAYER_ENCRYPTION_KEY=<32-char-hex>
TINK_ENCRYPTION_KEY=<32-char-hex>
PLAID_ENCRYPTION_KEY=<32-char-hex>
```

**Warning:** Rotating encryption keys will invalidate stored tokens. Users must reconnect their bank accounts.

---

## 4. Admin/Internal Keys

### Queue Admin Key
```bash
openssl rand -base64 24
# Update QUEUE_ADMIN_KEY in .env
```

### Test Auth Secret (Development Only)
```bash
openssl rand -base64 32
# Update TEST_AUTH_SECRET in .env
# ONLY used when NODE_ENV != 'production'
```

---

## 5. Post-Rotation Checklist

### Immediate Actions
- [ ] Verify API starts successfully
- [ ] Test OAuth login flow (Google)
- [ ] Verify JWT tokens are issued correctly
- [ ] Check Stripe webhook receives events
- [ ] Test one bank connection (if applicable)

### Within 24 Hours
- [ ] Monitor Sentry for authentication errors
- [ ] Check all scheduled jobs complete successfully
- [ ] Verify email sending works (SendGrid)
- [ ] Test AI features (Claude/Anthropic)

### Clean Git History (Optional but Recommended)
```bash
# WARNING: This rewrites history - coordinate with team
# Use BFG Repo-Cleaner to remove secrets from history

# 1. Install BFG
brew install bfg  # macOS

# 2. Create secrets.txt with patterns to remove
echo "old-jwt-secret-here" >> secrets.txt
echo "old-stripe-key-here" >> secrets.txt

# 3. Run BFG
bfg --replace-text secrets.txt

# 4. Force push (DANGEROUS - coordinate with team!)
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

---

## 6. Production Deployment

### Environment Variables on Cloudways

```bash
# SSH into server
ssh cloudways

# Navigate to app
cd ~/applications/eagqdkxvzv/public_html/apps/api

# Edit .env
nano .env

# Paste all rotated secrets

# Restart API
npx pm2 restart operate-api --update-env
```

### Verify Deployment
```bash
# Check health endpoint
curl https://operate.guru/api/v1/health

# Check PM2 logs for errors
npx pm2 logs operate-api --lines 50
```

---

## 7. Secret Management Best Practices

1. **Never commit secrets** - Use .env files (gitignored)
2. **Use different secrets per environment** - Dev/Staging/Production
3. **Rotate quarterly** - Set calendar reminders
4. **Limit access** - Only give secrets to who needs them
5. **Monitor for leaks** - Use GitHub secret scanning
6. **Document rotations** - Keep a log of when secrets were last rotated

---

## Quick Reference: All Secrets to Rotate

| Secret | Provider | Console URL |
|--------|----------|-------------|
| JWT_ACCESS_SECRET | Self-generated | N/A |
| JWT_REFRESH_SECRET | Self-generated | N/A |
| DATABASE_URL | Neon | console.neon.tech |
| GOOGLE_CLIENT_SECRET | Google | console.cloud.google.com |
| ANTHROPIC_API_KEY | Anthropic | console.anthropic.com |
| STRIPE_SECRET_KEY | Stripe | dashboard.stripe.com |
| STRIPE_WEBHOOK_SECRET | Stripe | dashboard.stripe.com |
| TRUELAYER_CLIENT_SECRET | TrueLayer | console.truelayer.com |
| TINK_CLIENT_SECRET | Tink | console.tink.com |
| PLAID_SECRET | Plaid | dashboard.plaid.com |
| SENDGRID_API_KEY | SendGrid | app.sendgrid.com |
| SENTRY_AUTH_TOKEN | Sentry | sentry.io |
| MINDEE_API_KEY | Mindee | platform.mindee.com |
| *_ENCRYPTION_KEY | Self-generated | N/A |
| QUEUE_ADMIN_KEY | Self-generated | N/A |
