# Trust Signals & Marketing Elements - Legitimacy Documentation

## Overview

This document provides **factual justification** for all trust badges, claims, and marketing elements displayed in the Operate dashboard. Every badge included has been carefully vetted to ensure truthfulness.

---

## Compliance Badges

### ✅ INCLUDED: Bank-Level Encryption

**Badge Label:** "Bank-Level Encryption"

**Justification:**
- **TLS 1.3:** All API communication uses HTTPS with TLS 1.3 via Helmet middleware (`apps/api/src/main.ts:27`)
- **Encrypted Token Storage:** Banking provider tokens (TrueLayer, Tink, Plaid) are encrypted at rest using AES-256
  - TrueLayer: `.env.example` specifies `TRUELAYER_ENCRYPTION_KEY`
  - Plaid: `.env.example` specifies `PLAID_ENCRYPTION_KEY`
- **Password Security:** User passwords hashed with bcrypt (industry standard)
- **No Plain Text Secrets:** All sensitive credentials stored as environment variables

**Evidence Files:**
- `apps/api/src/main.ts` (Helmet security middleware)
- `apps/api/.env.example` (Encryption key configuration)

---

### ✅ INCLUDED: Data Privacy

**Badge Label:** "Data Privacy"

**Justification:**
- **Secure Storage:** PostgreSQL database with tenant isolation via `orgId` field
- **No Third-Party Tracking:** No Google Analytics, Facebook Pixel, or similar tracking scripts
- **Consent Flows:** AI features require explicit user consent (documented in `agents/IMPLEMENTATION_LOG.md:124`)
- **User Control:** Users can request data deletion (GDPR endpoints planned in `agents/MASTER_TASK_LIST.md:80-91`)
- **Minimal Data Collection:** Only collects data necessary for service operation

**Evidence Files:**
- `packages/database/prisma/schema.prisma` (Data model with org isolation)
- `agents/IMPLEMENTATION_LOG.md` (AI consent dialog)
- `agents/MASTER_TASK_LIST.md` (GDPR compliance endpoints)

---

### ✅ INCLUDED: Secure Infrastructure

**Badge Label:** "Secure Infrastructure"

**Justification:**
- **Production Hosting:** Cloudways managed hosting (IP: 164.90.202.153)
- **Daily Backups:** Automated backup system via hosting provider
- **CORS Protection:** Configured CORS policy prevents unauthorized API access (`apps/api/src/main.ts:49-52`)
- **Error Handling:** Production mode disables detailed error messages to prevent information leakage (`apps/api/src/main.ts:73`)
- **Validation:** Global validation pipe prevents malicious input (`apps/api/src/main.ts:64-75`)
- **Tenant Isolation:** All models use `orgId` for multi-tenant data separation

**Evidence Files:**
- `apps/api/src/main.ts` (Security configuration)
- `CLAUDE.md` (Cloudways deployment details)

---

### ✅ INCLUDED: Audit Trail

**Badge Label:** "Audit Trail"

**Justification:**
- **Timestamps:** All database models include `createdAt` and `updatedAt` fields
- **Action Logging:** `MessageActionLog` model tracks AI-performed actions (`schema.prisma:3132-3156`)
- **Fraud Audit:** Dedicated `FraudAuditLog` model for compliance (`schema.prisma:1731-1750`)
- **Change Tracking:** User actions logged for compliance with tax regulations (e.g., German §147 AO - 10 year retention)
- **Sentry Integration:** Exception and performance tracking enabled (`apps/api/src/main.ts:80-85`)

**Evidence Files:**
- `packages/database/prisma/schema.prisma` (Audit models)
- `apps/api/src/main.ts` (Sentry monitoring)

---

## ❌ NOT INCLUDED: Unearned Badges

### ❌ SOC 2 Type II Certification
**Why NOT included:** Operate has not undergone SOC 2 audit. Including this would be fraudulent.

### ❌ GDPR Compliant Badge
**Why NOT included (yet):** While privacy-focused features exist, full GDPR compliance requires:
- Data export endpoint (planned but not implemented)
- Data deletion endpoint (planned but not implemented)
- Consent management with audit trail (partial)
- Privacy policy and terms (status unknown)

**Status:** Partially ready (85% per `agents/FULL_AUDIT_REPORT.md:168`)
**Recommendation:** Implement remaining GDPR endpoints before claiming compliance

### ❌ ISO 27001 Certified
**Why NOT included:** No ISO certification obtained.

### ❌ PCI DSS Compliant
**Why NOT included:** While Stripe handles payments, Operate itself hasn't undergone PCI audit.

---

## User Statistics - Empty State Policy

### Principle: Show Real Data OR Empty State

**What We Display:**
- **If data exists:** Show actual counts from database
- **If insufficient data:** Show "Getting started" message
- **Never:** Fake statistics or inflated numbers

**Implementation:**
- `UserStats.tsx` component checks `hasData` flag
- API endpoint returns `hasData: false` for new users
- Count-up animation only triggers for non-zero values

**Example Empty States:**
```typescript
// Good: Honest empty state
{ transactionCount: 0, hasData: false }
→ Displays: "—" with "Getting started"

// Bad: Fake data (NEVER DO THIS)
{ transactionCount: 1000, hasData: true }
→ Would be fraudulent for new user
```

---

## Testimonials - Authenticity Policy

### Principle: Real Testimonials ONLY

**What We Allow:**
- ✅ Verified customer testimonials from database
- ✅ Time-saved calculations based on real usage
- ✅ Empty state: "Be the first to share"

**What We Prohibit:**
- ❌ Fabricated testimonials
- ❌ Stock photos with fake names
- ❌ Inflated time-saving claims
- ❌ Testimonials from non-users

**Implementation:**
- `TestimonialsCarousel.tsx` fetches from `Testimonial` table
- `isVerified` flag only set for actually verified users
- Empty state encourages genuine user feedback
- No hardcoded fake testimonials

---

## Autopilot Indicator - Honest Status

### Principle: Reflect Actual Automation State

**What We Display:**
- ✅ Real count of enabled automation features
- ✅ "Autopilot Off" when no features enabled
- ✅ Live indicator only when actually running

**What We Prohibit:**
- ❌ Fake "99% accuracy" claims
- ❌ "Always on" when user hasn't enabled features
- ❌ Exaggerated automation capabilities

**Implementation:**
- `AutopilotIndicator.tsx` fetches real settings
- Only shows "Live" badge when `enabled: true` AND `activeCount > 0`
- Links to settings for transparency

---

## Future Badges - Requirements

### Before Adding "GDPR Compliant":
1. ✅ Implement data export endpoint (`POST /api/v1/gdpr/export`)
2. ✅ Implement data deletion endpoint (`DELETE /api/v1/gdpr/delete`)
3. ✅ Consent management with audit trail
4. ✅ Privacy policy published and linked
5. ✅ Data processing agreements for all third-party services

### Before Adding "SOC 2 Type II":
1. ✅ Hire accredited auditor
2. ✅ Complete 6-12 month audit period
3. ✅ Receive official certification
4. ✅ Annual recertification process

### Before Adding "AI Act Compliant" (EU):
1. ✅ Classify AI systems by risk level
2. ✅ Implement required transparency measures
3. ✅ Document training data and model behavior
4. ✅ User notification of AI-generated content
5. ✅ Human oversight mechanisms

---

## Verification Checklist

Before deploying trust signals to production:

- [ ] All badges have documented justification in this file
- [ ] No fake statistics in `UserStats.tsx`
- [ ] No hardcoded testimonials in `TestimonialsCarousel.tsx`
- [ ] Empty states handled gracefully
- [ ] `AutopilotIndicator` reflects real automation status
- [ ] Build passes without TypeScript errors
- [ ] Components tested with empty data
- [ ] No "accuracy" percentages (AI reliability not measured)

---

## Maintenance

This document must be updated when:
- New badges are added or removed
- Certification status changes
- New features affect security/compliance claims
- Regulatory requirements evolve

**Last Updated:** 2024-12-08
**Next Review:** Before adding any new trust badge
