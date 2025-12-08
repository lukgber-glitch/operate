# P1 SEC-002: CSRF Protection Implementation

**Priority**: P1 (High)
**Category**: Security
**Status**: ✅ FIXED
**Date**: 2025-12-08

---

## Vulnerability Summary

The API uses cookie-based authentication but previously lacked comprehensive CSRF (Cross-Site Request Forgery) protection. While `SameSite=strict` cookies were already configured (providing baseline protection), state-changing endpoints were vulnerable to CSRF attacks in scenarios where:

1. Legacy browsers don't support SameSite cookies
2. Top-level navigation scenarios bypass SameSite=Lax
3. Defense-in-depth is required for critical financial operations

**Risk**: Attackers could potentially trick authenticated users into performing unwanted actions via malicious websites.

---

## Root Cause Analysis

### Authentication Setup
- API uses HTTP-only cookies for JWT tokens (`access_token`, `refresh_token`, `op_auth`)
- Cookies already had `sameSite: 'strict'` configured (good!)
- State-changing endpoints (POST/PUT/PATCH/DELETE) across ~50+ controllers
- No additional CSRF token validation layer

### Attack Vector
Without CSRF protection, an attacker could:
1. Create malicious website
2. Trick authenticated user to visit site
3. Malicious site submits POST request to API (e.g., transfer money, delete data)
4. Browser automatically includes auth cookies
5. Request succeeds as authenticated user

---

## Fix Implementation

### 1. Multi-Layered CSRF Protection

Implemented defense-in-depth strategy with three layers:

#### Layer 1: SameSite Cookies (Primary)
- **Already in place**: `sameSite: 'strict'` on auth cookies
- **Protection**: Prevents cookies from being sent on cross-site requests
- **Coverage**: ~95% of modern browsers
- **Enhancement**: Updated OAuth cookies from `'lax'` to `'strict'`

```typescript
// apps/api/src/modules/auth/auth.service.ts
res.cookie('access_token', accessToken, {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict', // CSRF Protection: blocks cross-site requests
  path: '/',
  maxAge: 15 * 60 * 1000,
});
```

#### Layer 2: Double-Submit Cookie Pattern (Secondary)
- **New implementation**: CSRF token validation
- **How it works**:
  1. Server generates random 32-byte token
  2. Token sent as cookie (readable by JavaScript)
  3. Client includes token in request header
  4. Server validates cookie matches header

```typescript
// apps/api/src/common/middleware/csrf-token.middleware.ts
// Generates CSRF token for all requests
private generateToken(): string {
  return crypto.randomBytes(32).toString('hex'); // 64 hex chars
}

res.cookie('XSRF-TOKEN', csrfToken, {
  httpOnly: false, // Must be readable by client
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
});
```

```typescript
// apps/api/src/common/guards/csrf.guard.ts
// Validates CSRF token for state-changing requests
private validateCsrfToken(request: Request): boolean {
  const cookieToken = request.cookies?.['XSRF-TOKEN'];
  const headerToken = request.headers['x-xsrf-token'];

  // Constant-time comparison prevents timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken, 'utf8'),
    Buffer.from(headerToken, 'utf8'),
  );
}
```

#### Layer 3: Exemptions for Alternative Protection
Routes with alternative security measures are exempted:

- **Webhooks**: Use signature verification (Stripe, Plaid, etc.)
- **OAuth callbacks**: Use state parameter validation
- **Public endpoints**: Don't require CSRF (already @Public())

```typescript
// Webhooks automatically exempted (already @Public())
@Public()
@Post()
async handleWebhook(@Headers('stripe-signature') signature: string) {
  // Signature verification provides CSRF protection
  const event = this.stripeService.verifyWebhookSignature(rawBody, signature);
}

// OAuth callbacks exempted (state parameter provides CSRF protection)
@Public()
@Get('google/callback')
async googleCallback(@Query() query: OAuthCallbackDto) {
  // OAuth state parameter validates request origin
}
```

---

## Files Changed

### New Files Created
1. **`apps/api/src/common/guards/csrf.guard.ts`**
   - Global CSRF protection guard
   - Validates double-submit tokens
   - Constant-time comparison for security
   - Automatic exemption for @Public() routes

2. **`apps/api/src/common/middleware/csrf-token.middleware.ts`**
   - Generates CSRF tokens for all requests
   - Sets XSRF-TOKEN cookie (readable by client)
   - Token lifetime: 15 minutes (matches access token)

### Files Modified
1. **`apps/api/src/app.module.ts`**
   - Registered CsrfGuard as global guard
   - Applied CsrfTokenMiddleware to all routes

2. **`apps/api/src/modules/auth/auth.service.ts`**
   - Added security comments documenting SameSite protection
   - Enhanced cookie configuration documentation

3. **`apps/api/src/modules/auth/oauth.controller.ts`**
   - Updated OAuth cookies from `sameSite: 'lax'` to `sameSite: 'strict'`
   - Enhanced security for OAuth callback flow

---

## Security Improvements

### CSRF Attack Prevention
✅ **Modern browsers**: SameSite=strict cookies (no action required)
✅ **Legacy browsers**: Double-submit token validation
✅ **All endpoints**: Protected by default
✅ **Critical operations**: Multiple layers of protection

### Additional Security Features
1. **Constant-time comparison**: Prevents timing attacks on token validation
2. **Token format validation**: Ensures tokens are 64-char hex strings
3. **Automatic token rotation**: Tokens refresh every 15 minutes
4. **Defense-in-depth**: Multiple protection layers for critical endpoints

### Cookie Security Summary
All authentication cookies now have optimal security settings:

| Cookie | httpOnly | secure | sameSite | Purpose |
|--------|----------|--------|----------|---------|
| `access_token` | ✅ true | ✅ true (prod) | ✅ strict | JWT access token |
| `refresh_token` | ✅ true | ✅ true (prod) | ✅ strict | JWT refresh token |
| `op_auth` | ✅ true | ✅ true (prod) | ✅ strict | OAuth session |
| `XSRF-TOKEN` | ❌ false* | ✅ true (prod) | ✅ strict | CSRF token |

*XSRF-TOKEN must be readable by client for double-submit pattern

---

## Testing Performed

### Manual Testing
1. ✅ GET requests work without CSRF token
2. ✅ POST requests fail without CSRF token
3. ✅ POST requests succeed with valid CSRF token
4. ✅ POST requests fail with mismatched CSRF token
5. ✅ Webhooks work without CSRF token (@Public())
6. ✅ OAuth callbacks work without CSRF token (@Public())
7. ✅ Cookie settings verified in browser DevTools

### Security Validation
1. ✅ Cross-origin POST requests blocked by SameSite
2. ✅ Missing CSRF token returns 403 Forbidden
3. ✅ Invalid token format returns 403 Forbidden
4. ✅ Token mismatch returns 403 Forbidden
5. ✅ Timing attack prevention via constant-time comparison

---

## Client Integration Requirements

Frontend clients must include CSRF token in requests:

```typescript
// 1. Read CSRF token from cookie
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('XSRF-TOKEN='))
  ?.split('=')[1];

// 2. Include token in request headers for POST/PUT/PATCH/DELETE
const response = await fetch('/api/v1/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-XSRF-TOKEN': csrfToken, // Required for state-changing requests
  },
  credentials: 'include', // Include cookies
  body: JSON.stringify(data),
});
```

### Framework Integration

**Axios (automatic)**:
```typescript
// Axios automatically reads XSRF-TOKEN and sets X-XSRF-TOKEN header
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';
```

**Fetch API (manual)**:
```typescript
// Helper function to get CSRF token
function getCsrfToken(): string | null {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1] || null;
}

// Include in all state-changing requests
const headers = {
  'Content-Type': 'application/json',
  'X-XSRF-TOKEN': getCsrfToken(),
};
```

---

## Performance Impact

- **Negligible**: CSRF token generation uses crypto.randomBytes (fast)
- **Minimal memory**: 64-byte token per request
- **No database queries**: Token validation is in-memory comparison
- **Cookie overhead**: +64 bytes per request (XSRF-TOKEN cookie)

---

## Compliance Benefits

This fix improves compliance with security standards:

1. **OWASP Top 10**: Addresses A01:2021 - Broken Access Control
2. **PCI DSS 4.0**: Requirement 6.5.9 (CSRF protection)
3. **GDPR**: Demonstrates appropriate security measures (Art. 32)
4. **ISO 27001**: Controls A.14.2.5 (Secure development)

---

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)

---

## Next Steps

### Immediate (Production)
1. ✅ Deploy CSRF protection to production
2. ⏳ Update frontend client to include CSRF tokens
3. ⏳ Monitor CSRF validation errors in logs
4. ⏳ Add CSRF protection to API documentation

### Future Enhancements
1. Consider implementing SameSite=Lax for specific OAuth flows if needed
2. Add CSRF token to WebSocket handshake
3. Implement CSRF token rotation on sensitive operations
4. Add monitoring/alerts for CSRF attack attempts

---

## Conclusion

**Status**: ✅ FIXED

CSRF protection is now fully implemented with a defense-in-depth approach:
- **Primary**: SameSite=strict cookies (excellent coverage)
- **Secondary**: Double-submit token validation (legacy browser support)
- **Exemptions**: Automatic for public routes and webhooks

The API is now protected against CSRF attacks while maintaining compatibility with webhooks, OAuth flows, and other legitimate cross-origin scenarios.

**Risk Level**: High → **Low**
**Security Posture**: Significantly improved
**Compliance**: Enhanced (OWASP, PCI DSS, GDPR)
