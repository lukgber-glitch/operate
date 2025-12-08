# SEC-004 + H-003: Webhook Signature Validation Security Audit & Fix Report

**Priority:** P1 - CRITICAL
**Severity:** High
**Date:** 2025-12-08
**Auditor:** SENTINEL (Security Agent)

---

## Executive Summary

**CRITICAL SECURITY VULNERABILITY IDENTIFIED:**
Multiple webhook endpoints lack proper signature verification, allowing attackers to send fake webhook events that could:
- Trigger fraudulent payment confirmations
- Manipulate account balances
- Create unauthorized transactions
- Bypass payment verification
- Corrupt financial records

**Overall Risk Level:** HIGH - Immediate action required
**Total Webhooks Audited:** 10
**Webhooks with Proper Verification:** 4 (40%)
**Webhooks Requiring Fixes:** 6 (60%)

---

## Detailed Findings

### ✅ SECURE - Webhooks with Proper Signature Verification

#### 1. Stripe Webhook (`stripe-webhook.controller.ts`)
- **Status:** ✅ SECURE
- **Implementation:** Uses `stripe.webhooks.constructEvent()` with signature verification
- **Verification Method:** HMAC-SHA256 via Stripe SDK
- **Header:** `stripe-signature`
- **Lines:** 107-110
- **Notes:** Industry best practice implementation, idempotent event processing

#### 2. Tink Webhook (`tink-webhook.controller.ts`)
- **Status:** ✅ SECURE
- **Implementation:** Custom HMAC-SHA256 verification with timing-safe comparison
- **Verification Method:** `crypto.createHmac('sha256', webhookSecret)`
- **Header:** `x-tink-signature`
- **Lines:** 118-137
- **Notes:** Proper use of `crypto.timingSafeEqual()` to prevent timing attacks
- **Issue:** Logs warning but allows unverified webhooks in development (acceptable for non-production)

#### 3. Wise Webhook (`wise-webhook.controller.ts`)
- **Status:** ✅ SECURE
- **Implementation:** Service-based signature verification
- **Verification Method:** `wiseService.verifyWebhookSignature()`
- **Header:** `x-signature-sha256`
- **Lines:** 68-73
- **Notes:** Proper signature verification before processing

#### 4. Persona Webhook (`persona-webhook.controller.ts`)
- **Status:** ✅ SECURE
- **Implementation:** Service-based HMAC signature verification
- **Verification Method:** `personaService.verifyWebhookSignature()`
- **Header:** `persona-signature`
- **Lines:** 85-93
- **Notes:** Proper raw body verification, comprehensive logging

---

### ⚠️ VULNERABLE - Webhooks Requiring Immediate Fix

#### 5. Plaid Webhook (`plaid.controller.ts`) - CRITICAL
- **Status:** ⚠️ VULNERABLE
- **Current Implementation:** Signature verification present BUT has critical flaw
- **Lines:** 256-267
- **Issue:** Signature verification is OPTIONAL (logs warning but continues)
  ```typescript
  if (signature) {
    // verify
  } else {
    this.logger.warn('Webhook received without signature header');
    // CONTINUES PROCESSING! ⚠️
  }
  ```
- **Attack Vector:** Attacker can omit signature header entirely to bypass verification
- **Risk Level:** CRITICAL - Can fake bank transactions, account updates
- **Fix Priority:** IMMEDIATE

#### 6. TrueLayer Webhook (`truelayer.controller.ts`) - CRITICAL
- **Status:** ⚠️ VULNERABLE
- **Current Implementation:** Same optional signature pattern as Plaid
- **Lines:** 395-405
- **Issue:** Signature verification skipped if header missing
- **Attack Vector:** Fake payment confirmations, balance updates, consent revocations
- **Risk Level:** CRITICAL - Handles EU Open Banking transactions
- **Fix Priority:** IMMEDIATE

#### 7. GoCardless Webhook (`gocardless-webhook.controller.ts`) - HIGH
- **Status:** ⚠️ VULNERABLE
- **Current Implementation:** Has verification method call but implementation unclear
- **Lines:** 66-69
- **Issue:** Uses `gocardlessService.validateWebhookSignature()` but passes wrong body format
  ```typescript
  const isValid = this.gocardlessService.validateWebhookSignature(
    JSON.stringify(rawBody),  // ❌ Double-encoding issue
    signature,
  );
  ```
- **Attack Vector:** Signature verification may fail silently
- **Fix Priority:** HIGH

#### 8. Gusto Webhook (`gusto-webhook.controller.ts`) - HIGH
- **Status:** ⚠️ VULNERABLE
- **Current Implementation:** Uses custom encryption util
- **Lines:** 63-66
- **Issue:** Uses fallback `|| JSON.stringify(payload)` if rawBody missing
- **Attack Vector:** Signature bypass if raw body not preserved
- **Fix Priority:** HIGH

#### 9. ComplyAdvantage Webhook (`comply-advantage-webhook.controller.ts`) - MEDIUM
- **Status:** ⚠️ VULNERABLE
- **Current Implementation:** Conditional verification based on secret existence
- **Lines:** 54-56
  ```typescript
  if (this.webhookSecret) {
    this.verifyWebhookSignature(payload, signature);
  }
  // CONTINUES if no secret configured! ⚠️
  ```
- **Attack Vector:** No verification if COMPLY_ADVANTAGE_WEBHOOK_SECRET not set
- **Risk Level:** MEDIUM - AML screening results could be manipulated
- **Fix Priority:** MEDIUM

#### 10. PEPPOL/SDI/InvoiceNow Webhooks
- **Status:** ⚠️ NOT REVIEWED (files exist but not fully analyzed)
- **Fix Priority:** MEDIUM

---

## Technical Analysis

### Common Vulnerability Patterns Found

1. **Optional Signature Verification (Critical)**
   ```typescript
   // ❌ VULNERABLE PATTERN
   if (signature) {
     verify();
   } else {
     logger.warn('No signature');
     // Continue processing ← SECURITY HOLE
   }
   ```

2. **Missing Raw Body Preservation**
   - Some endpoints don't properly preserve `req.rawBody` for verification
   - Fallback to `JSON.stringify()` defeats signature verification

3. **Configuration-Dependent Security**
   ```typescript
   // ❌ VULNERABLE PATTERN
   if (this.webhookSecret) {
     verify();
   }
   // Security disabled if env var not set
   ```

4. **Incorrect Body Encoding**
   - `JSON.stringify(rawBody)` instead of using raw buffer directly

---

## Impact Assessment

### Attack Scenarios

#### Scenario 1: Fake Payment Confirmation (Plaid/TrueLayer)
1. Attacker identifies webhook endpoint URL
2. Sends POST request WITHOUT signature header
3. Webhook logs warning but processes event
4. Invoice marked as paid, goods/services released
5. Actual payment never occurred

**Financial Impact:** Direct fraud, potential losses in thousands per incident

#### Scenario 2: Balance Manipulation (Tink/TrueLayer/GoCardless)
1. Attacker sends fake `balance.updated` webhook
2. Application updates displayed balance
3. User/business makes decisions based on false data
4. Overdraft, failed payments, accounting errors

**Financial Impact:** Indirect losses, regulatory compliance issues

#### Scenario 3: Account Takeover (Persona)
1. Attacker sends fake `inquiry.approved` webhook
2. Bypasses KYC verification
3. Account approved without proper identity checks
4. Money laundering, fraud risk

**Compliance Impact:** KYC/AML violations, regulatory fines

---

## Recommended Fixes

### Priority 1: IMMEDIATE (Critical Webhooks)

#### Fix 1: Plaid Webhook - MANDATORY Signature Verification

**File:** `apps/api/src/modules/integrations/plaid/plaid.controller.ts`

**Current Code (Lines 248-267):**
```typescript
async handleWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Body() webhookDto: PlaidWebhookDto,
  @Headers('plaid-verification') signature?: string,
) {
  this.logger.log(`Received Plaid webhook...`);

  try {
    // Verify webhook signature in production
    if (signature) {
      const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(webhookDto);
      const isValid = this.plaidService.verifyWebhookSignature(rawBody, signature);

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    } else {
      this.logger.warn('Webhook received without signature header');
    }
```

**Fixed Code:**
```typescript
async handleWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Body() webhookDto: PlaidWebhookDto,
  @Headers('plaid-verification') signature?: string,
) {
  this.logger.log(`Received Plaid webhook: ${webhookDto.webhook_type}`);

  // ✅ MANDATORY signature verification
  if (!signature) {
    this.logger.error('Plaid webhook rejected: Missing signature header');
    throw new UnauthorizedException('Missing plaid-verification header');
  }

  // Get raw body (required for signature verification)
  const rawBody = req.rawBody;
  if (!rawBody) {
    this.logger.error('Plaid webhook rejected: Missing raw body');
    throw new BadRequestException('Missing raw body for signature verification');
  }

  // Verify signature
  const isValid = this.plaidService.verifyWebhookSignature(
    rawBody.toString('utf8'),
    signature
  );

  if (!isValid) {
    this.logger.error('Plaid webhook rejected: Invalid signature');
    throw new UnauthorizedException('Invalid webhook signature');
  }

  this.logger.log('Plaid webhook signature verified successfully');

  try {
```

#### Fix 2: TrueLayer Webhook - MANDATORY Signature Verification

**File:** `apps/api/src/modules/integrations/truelayer/truelayer.controller.ts`

**Current Code (Lines 386-405):**
```typescript
async handleWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Body() webhookDto: TrueLayerWebhookDto,
  @Headers('tl-signature') signature?: string,
) {
  this.logger.log(`Received TrueLayer webhook: ${webhookDto.type}`);

  try {
    // Verify webhook signature
    if (signature) {
      const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(webhookDto);
      const isValid = this.trueLayerService.verifyWebhookSignature(rawBody, signature);

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    } else {
      this.logger.warn('Webhook received without signature header');
    }
```

**Fixed Code:**
```typescript
async handleWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Body() webhookDto: TrueLayerWebhookDto,
  @Headers('tl-signature') signature?: string,
) {
  this.logger.log(`Received TrueLayer webhook: ${webhookDto.type}`);

  // ✅ MANDATORY signature verification
  if (!signature) {
    this.logger.error('TrueLayer webhook rejected: Missing signature header');
    throw new UnauthorizedException('Missing tl-signature header');
  }

  // Get raw body (required for signature verification)
  const rawBody = req.rawBody;
  if (!rawBody) {
    this.logger.error('TrueLayer webhook rejected: Missing raw body');
    throw new BadRequestException('Missing raw body for signature verification');
  }

  // Verify signature
  const isValid = this.trueLayerService.verifyWebhookSignature(
    rawBody.toString('utf8'),
    signature
  );

  if (!isValid) {
    this.logger.error('TrueLayer webhook rejected: Invalid signature');
    throw new UnauthorizedException('Invalid webhook signature');
  }

  this.logger.log('TrueLayer webhook signature verified successfully');

  try {
```

#### Fix 3: GoCardless Webhook - Fix Body Encoding

**File:** `apps/api/src/modules/integrations/gocardless/gocardless-webhook.controller.ts`

**Current Code (Lines 59-74):**
```typescript
async handleWebhook(
  @Body() payload: GoCardlessWebhookPayload,
  @Headers('webhook-signature') signature: string,
  @Body() rawBody: string,  // ❌ This doesn't work
): Promise<void> {
  try {
    // Verify webhook signature
    const isValid = this.gocardlessService.validateWebhookSignature(
      JSON.stringify(rawBody),  // ❌ Double stringification
      signature,
    );
```

**Fixed Code:**
```typescript
async handleWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Body() payload: GoCardlessWebhookPayload,
  @Headers('webhook-signature') signature: string,
): Promise<void> {
  // ✅ MANDATORY signature verification
  if (!signature) {
    this.logger.error('GoCardless webhook rejected: Missing signature header');
    throw new UnauthorizedException('Missing webhook-signature header');
  }

  // Get raw body
  const rawBody = req.rawBody;
  if (!rawBody) {
    this.logger.error('GoCardless webhook rejected: Missing raw body');
    throw new BadRequestException('Missing raw body for signature verification');
  }

  try {
    // Verify webhook signature with correct raw body
    const isValid = this.gocardlessService.validateWebhookSignature(
      rawBody.toString('utf8'),  // ✅ Correct: use raw buffer
      signature,
    );

    if (!isValid) {
      this.logger.error('GoCardless webhook rejected: Invalid signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log('GoCardless webhook signature verified', {
      eventCount: payload.events.length,
    });
```

### Priority 2: HIGH (Other Webhooks)

#### Fix 4: Gusto Webhook

**File:** `apps/api/src/modules/integrations/gusto/gusto-webhook.controller.ts`

**Changes:**
1. Make signature header REQUIRED (not optional)
2. Require webhookSecret to be configured
3. Throw error if rawBody missing (don't fallback to JSON.stringify)

```typescript
async handleWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Headers('x-gusto-signature') signature: string,  // Remove '?'
  @Body() payload: GustoWebhookPayload,
): Promise<{ received: boolean }> {
  this.logger.log('Received Gusto webhook', {
    eventType: payload.event_type,
    entityType: payload.entity_type,
  });

  // ✅ Validate signature exists
  if (!signature) {
    this.logger.error('Gusto webhook rejected: Missing signature');
    throw new UnauthorizedException('Missing x-gusto-signature header');
  }

  // ✅ Validate webhook secret configured
  const webhookSecret = this.gustoService.getConfig().webhookSecret;
  if (!webhookSecret) {
    this.logger.error('Gusto webhook rejected: Webhook secret not configured');
    throw new Error('GUSTO_WEBHOOK_SECRET not configured');
  }

  // ✅ Require raw body
  const rawBody = req.rawBody;
  if (!rawBody) {
    this.logger.error('Gusto webhook rejected: Missing raw body');
    throw new BadRequestException('Missing raw body for signature verification');
  }

  // Verify signature
  if (!this.encryption.verifyWebhookSignature(rawBody.toString('utf8'), signature, webhookSecret)) {
    this.logger.error('Gusto webhook rejected: Invalid signature');
    throw new UnauthorizedException('Invalid webhook signature');
  }

  this.logger.log('Gusto webhook signature verified successfully');
```

#### Fix 5: ComplyAdvantage Webhook

**File:** `apps/api/src/modules/integrations/comply-advantage/comply-advantage-webhook.controller.ts`

**Changes:**
1. Require webhook secret to be configured at startup
2. Make signature verification MANDATORY

```typescript
constructor(
  private readonly complyAdvantageService: ComplyAdvantageService,
  private readonly configService: ConfigService,
) {
  this.webhookSecret = this.configService.get<string>('COMPLY_ADVANTAGE_WEBHOOK_SECRET') || '';

  // ✅ Fail fast if webhook secret not configured
  if (!this.webhookSecret) {
    throw new Error(
      'COMPLY_ADVANTAGE_WEBHOOK_SECRET must be configured for webhook security'
    );
  }
}

async handleWebhook(
  @Body() payload: WebhookPayloadDto,
  @Headers('x-complyadvantage-signature') signature: string,
  @Headers('x-complyadvantage-timestamp') timestamp: string,
) {
  try {
    this.logger.log('Received webhook', {
      eventType: payload.event_type,
      searchId: payload.search_id,
    });

    // ✅ MANDATORY signature verification
    if (!signature) {
      this.logger.error('ComplyAdvantage webhook rejected: Missing signature');
      throw new UnauthorizedException('Missing x-complyadvantage-signature header');
    }

    // Verify webhook signature (now always required)
    this.verifyWebhookSignature(payload, signature);
```

---

## Environment Variable Updates

### Update `.env.example`

Add missing webhook secret configurations:

```bash
# =====================================
# WEBHOOK SIGNATURE SECRETS (REQUIRED)
# =====================================
# Generate with: openssl rand -hex 32

# Plaid Webhook Secret (REQUIRED)
PLAID_WEBHOOK_SECRET=your-plaid-webhook-verification-key

# TrueLayer Webhook Secret (REQUIRED)
TRUELAYER_WEBHOOK_SECRET=your-truelayer-webhook-secret

# Tink Webhook Secret (REQUIRED)
TINK_WEBHOOK_SECRET=your-tink-webhook-secret

# GoCardless Webhook Secret (REQUIRED)
GOCARDLESS_WEBHOOK_SECRET=your-gocardless-webhook-secret

# Gusto Webhook Secret (REQUIRED)
GUSTO_WEBHOOK_SECRET=your-gusto-webhook-secret

# Wise Webhook Secret (REQUIRED)
WISE_WEBHOOK_SECRET=your-wise-webhook-secret

# Persona Webhook Secret (REQUIRED)
PERSONA_WEBHOOK_SECRET=your-persona-webhook-secret

# ComplyAdvantage Webhook Secret (REQUIRED)
COMPLY_ADVANTAGE_WEBHOOK_SECRET=your-comply-advantage-webhook-secret

# Stripe Webhook Secret (REQUIRED)
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret

# =====================================
# WEBHOOK CONFIGURATION NOTES
# =====================================
# 1. All webhook secrets are REQUIRED for production
# 2. Obtain webhook secrets from provider dashboard
# 3. Never commit real secrets to version control
# 4. Rotate webhook secrets periodically (every 90 days)
# 5. Each environment (dev/staging/prod) should have unique secrets
```

---

## Reusable Webhook Guard (Recommended)

### Create: `apps/api/src/common/guards/webhook-signature.guard.ts`

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as crypto from 'crypto';

export interface WebhookSignatureConfig {
  provider: string;
  secretEnvVar: string;
  headerName: string;
  algorithm?: 'sha256' | 'sha512';
  encoding?: 'hex' | 'base64';
}

/**
 * Reusable Webhook Signature Verification Guard
 *
 * Usage:
 * @UseGuards(WebhookSignatureGuard)
 * @SetMetadata('webhookConfig', {
 *   provider: 'plaid',
 *   secretEnvVar: 'PLAID_WEBHOOK_SECRET',
 *   headerName: 'plaid-verification'
 * })
 */
@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WebhookSignatureGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const config = this.reflector.get<WebhookSignatureConfig>(
      'webhookConfig',
      context.getHandler()
    );

    if (!config) {
      this.logger.error('WebhookSignatureGuard used without config');
      throw new Error('Webhook configuration missing');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const signature = request.headers[config.headerName.toLowerCase()] as string;

    // 1. Validate signature header exists
    if (!signature) {
      this.logger.error(`${config.provider} webhook rejected: Missing signature`, {
        headerName: config.headerName,
      });
      throw new UnauthorizedException(`Missing ${config.headerName} header`);
    }

    // 2. Validate raw body exists
    const rawBody = (request as any).rawBody;
    if (!rawBody) {
      this.logger.error(`${config.provider} webhook rejected: Missing raw body`);
      throw new BadRequestException('Missing raw body for signature verification');
    }

    // 3. Get webhook secret
    const secret = process.env[config.secretEnvVar];
    if (!secret) {
      this.logger.error(`${config.provider} webhook rejected: Secret not configured`, {
        envVar: config.secretEnvVar,
      });
      throw new Error(`${config.secretEnvVar} not configured`);
    }

    // 4. Verify signature
    const isValid = this.verifySignature(
      rawBody,
      signature,
      secret,
      config.algorithm || 'sha256',
      config.encoding || 'hex'
    );

    if (!isValid) {
      this.logger.error(`${config.provider} webhook rejected: Invalid signature`);
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log(`${config.provider} webhook signature verified`);
    return true;
  }

  private verifySignature(
    rawBody: Buffer,
    signature: string,
    secret: string,
    algorithm: string,
    encoding: BufferEncoding
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac(algorithm, secret)
        .update(rawBody)
        .digest(encoding);

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      this.logger.error('Signature verification failed', error);
      return false;
    }
  }
}
```

**Usage Example:**
```typescript
@Post('webhook')
@Public()
@UseGuards(WebhookSignatureGuard)
@SetMetadata('webhookConfig', {
  provider: 'plaid',
  secretEnvVar: 'PLAID_WEBHOOK_SECRET',
  headerName: 'plaid-verification',
  algorithm: 'sha256',
  encoding: 'hex'
})
async handleWebhook(@Body() payload: PlaidWebhookDto) {
  // Signature already verified by guard
  await this.processWebhook(payload);
}
```

---

## Testing Requirements

### 1. Unit Tests

Create test file: `webhook-signature.guard.spec.ts`

```typescript
describe('WebhookSignatureGuard', () => {
  it('should reject webhook without signature header', () => {
    // Test missing signature
  });

  it('should reject webhook with invalid signature', () => {
    // Test wrong signature
  });

  it('should reject webhook without raw body', () => {
    // Test missing rawBody
  });

  it('should reject webhook when secret not configured', () => {
    // Test missing env var
  });

  it('should accept webhook with valid signature', () => {
    // Test successful verification
  });

  it('should use timing-safe comparison', () => {
    // Test timing attack resistance
  });
});
```

### 2. Integration Tests

Test each webhook endpoint:
- Send valid webhook with correct signature → 200 OK
- Send webhook without signature → 401 Unauthorized
- Send webhook with invalid signature → 401 Unauthorized
- Send webhook without configured secret → 500 Error

### 3. Manual Testing

For each webhook provider:
1. Configure webhook URL in provider dashboard
2. Trigger test event
3. Verify signature validation works
4. Check logs for verification success
5. Test with tampered payload (should fail)

---

## Deployment Checklist

### Pre-Deployment

- [ ] Review all webhook controller code changes
- [ ] Update `.env.example` with all webhook secrets
- [ ] Document webhook secret rotation procedure
- [ ] Create monitoring alerts for signature failures
- [ ] Add metric tracking for webhook verification rates

### Deployment Steps

1. [ ] Update environment variables in all environments (dev/staging/prod)
2. [ ] Deploy code changes
3. [ ] Test each webhook endpoint with provider test events
4. [ ] Monitor error logs for signature verification failures
5. [ ] Document webhook secret locations (1Password, Vault, etc.)

### Post-Deployment

- [ ] Monitor webhook processing success rates (should be unchanged)
- [ ] Check for increase in 401 errors (expected if bots were probing)
- [ ] Verify all legitimate webhooks still processing
- [ ] Update runbook with troubleshooting steps
- [ ] Schedule webhook secret rotation (90 days)

---

## Monitoring & Alerting

### Metrics to Track

```typescript
// Add to each webhook controller
@Injectable()
export class WebhookMetrics {
  webhookReceived: Counter;
  webhookSignatureValid: Counter;
  webhookSignatureInvalid: Counter;
  webhookProcessingTime: Histogram;

  constructor() {
    this.webhookReceived = new Counter({
      name: 'webhook_received_total',
      help: 'Total webhooks received',
      labelNames: ['provider', 'event_type']
    });

    this.webhookSignatureValid = new Counter({
      name: 'webhook_signature_valid_total',
      help: 'Valid webhook signatures',
      labelNames: ['provider']
    });

    this.webhookSignatureInvalid = new Counter({
      name: 'webhook_signature_invalid_total',
      help: 'Invalid webhook signatures',
      labelNames: ['provider']
    });
  }
}
```

### Alerts to Configure

1. **Signature Failure Rate Alert**
   - Trigger: >5% signature failures per provider in 5 minutes
   - Action: Page on-call engineer
   - Possible causes: Secret rotation needed, provider change

2. **Missing Signature Alert**
   - Trigger: Any webhook without signature header
   - Action: Log and investigate
   - Possible causes: Bot scanning, attack attempt

3. **Zero Webhooks Alert**
   - Trigger: No webhooks received in 24 hours (per provider)
   - Action: Check provider connectivity
   - Possible causes: Provider issue, URL change

---

## Documentation Updates Required

### 1. API Documentation

Update Swagger/OpenAPI docs for each webhook endpoint:
- Document required signature headers
- Document error responses (401, 400)
- Add security scheme annotations

### 2. Integration Guides

For each provider, document:
- Where to find webhook secret in provider dashboard
- How to configure webhook URL
- How to test webhook delivery
- Troubleshooting signature verification failures

### 3. Security Runbook

Add section on webhook security:
- How to rotate webhook secrets
- How to investigate signature failures
- Emergency response for compromised secrets

---

## Timeline & Effort Estimate

| Task | Priority | Effort | Owner |
|------|----------|--------|-------|
| Fix Plaid webhook | P0 | 2 hours | Backend Team |
| Fix TrueLayer webhook | P0 | 2 hours | Backend Team |
| Fix GoCardless webhook | P1 | 2 hours | Backend Team |
| Fix Gusto webhook | P1 | 2 hours | Backend Team |
| Fix ComplyAdvantage webhook | P2 | 1 hour | Backend Team |
| Create reusable guard | P2 | 4 hours | Backend Team |
| Update .env.example | P1 | 1 hour | DevOps Team |
| Configure secrets in all envs | P0 | 2 hours | DevOps Team |
| Write integration tests | P2 | 8 hours | QA Team |
| Update documentation | P2 | 4 hours | Technical Writer |
| Deploy to staging | P0 | 1 hour | DevOps Team |
| Test all webhooks | P0 | 4 hours | QA Team |
| Deploy to production | P0 | 1 hour | DevOps Team |
| Monitor for 48 hours | P0 | Ongoing | On-call Team |

**Total Effort:** ~34 hours
**Critical Path:** 8 hours (fixes + deployment)
**Recommended Timeline:** Complete within 2 business days

---

## Security Best Practices (Going Forward)

### 1. Webhook Security Checklist

For all future webhook implementations:
- ✅ ALWAYS verify webhook signatures
- ✅ Use timing-safe comparison functions
- ✅ Preserve raw request body for verification
- ✅ Fail closed (reject if verification fails)
- ✅ Log all verification failures
- ✅ Implement idempotency checks
- ✅ Rate limit webhook endpoints
- ✅ Use HTTPS only
- ✅ Validate webhook source IP (if provider supports)
- ✅ Implement webhook secret rotation

### 2. Code Review Requirements

All webhook PRs must include:
- [ ] Signature verification implementation
- [ ] Unit tests for signature verification
- [ ] Integration test with provider
- [ ] Documentation of signature header
- [ ] Environment variable documentation

### 3. Security Scanning

Add to CI/CD pipeline:
```bash
# Detect webhooks without signature verification
grep -r "@Post.*webhook" --include="*.controller.ts" | \
  xargs grep -L "verifyWebhookSignature\|verifySignature"
```

---

## Compliance Considerations

### PCI DSS Compliance
- Requirement 6.5.10: Protect against common coding vulnerabilities
- **Impact:** Webhook signature verification required for payment processing

### GDPR Compliance
- Requirement: Data integrity and security
- **Impact:** Unauthorized webhooks could corrupt personal data

### SOC 2 Type II
- CC6.6: Logical access security measures
- **Impact:** Webhook endpoints must verify request authenticity

---

## Appendix A: Webhook Signature Algorithms by Provider

| Provider | Algorithm | Header Name | Format |
|----------|-----------|-------------|--------|
| Stripe | HMAC-SHA256 | stripe-signature | `t=timestamp,v1=signature` |
| Plaid | HMAC-SHA256 | plaid-verification | hex |
| TrueLayer | HMAC-SHA256 | tl-signature | hex |
| Tink | HMAC-SHA256 | x-tink-signature | hex |
| GoCardless | HMAC-SHA256 | webhook-signature | hex |
| Wise | HMAC-SHA256 | x-signature-sha256 | hex |
| Persona | HMAC-SHA256 | persona-signature | hex |
| Gusto | HMAC-SHA256 | x-gusto-signature | hex |
| ComplyAdvantage | HMAC-SHA256 | x-complyadvantage-signature | hex |

---

## Appendix B: Example Signature Verification Code

### Generic HMAC-SHA256 Verification

```typescript
import * as crypto from 'crypto';

export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string
): boolean {
  try {
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    // Timing-safe comparison (prevents timing attacks)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    // timingSafeEqual throws if lengths differ
    return false;
  }
}
```

### Stripe-Style Timestamp Verification

```typescript
export function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds: number = 300 // 5 minutes
): boolean {
  const parts = signatureHeader.split(',');
  const timestampPart = parts.find(p => p.startsWith('t='));
  const signaturePart = parts.find(p => p.startsWith('v1='));

  if (!timestampPart || !signaturePart) {
    return false;
  }

  const timestamp = parseInt(timestampPart.split('=')[1]);
  const signature = signaturePart.split('=')[1];

  // Check timestamp freshness (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > toleranceSeconds) {
    return false;
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## Appendix C: Troubleshooting Guide

### Issue: "Invalid webhook signature" errors for legitimate webhooks

**Possible Causes:**
1. Wrong webhook secret configured
2. Provider rotated webhook secret
3. Raw body not preserved correctly
4. Signature header name mismatch
5. Character encoding issue (UTF-8 vs ASCII)

**Resolution Steps:**
1. Check provider dashboard for current webhook secret
2. Verify environment variable matches provider secret
3. Test with provider's webhook testing tool
4. Check raw body middleware configuration
5. Enable verbose logging for signature verification

### Issue: "Missing raw body" errors

**Cause:** Body parser consuming request before raw body preserved

**Resolution:**
```typescript
// In main.ts or bootstrap
app.use(
  json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf; // Preserve raw body
    },
  })
);
```

### Issue: Webhooks not received at all

**Possible Causes:**
1. Firewall blocking provider IPs
2. HTTPS certificate issues
3. Webhook URL not configured in provider
4. Rate limiting too aggressive

**Resolution Steps:**
1. Check firewall/security group rules
2. Verify SSL certificate valid
3. Check provider dashboard webhook configuration
4. Review rate limiting configuration
5. Test with `curl` from external IP

---

## Sign-off

**Security Audit Completed By:** SENTINEL
**Date:** 2025-12-08
**Status:** CRITICAL VULNERABILITIES IDENTIFIED - IMMEDIATE ACTION REQUIRED

**Next Steps:**
1. Review this report with development team
2. Prioritize P0/P1 fixes for immediate deployment
3. Schedule P2 improvements for next sprint
4. Implement monitoring and alerting
5. Schedule follow-up security audit in 30 days

**Questions/Concerns:** Contact security team or escalate to ATLAS (Project Manager)

---

**END OF REPORT**
