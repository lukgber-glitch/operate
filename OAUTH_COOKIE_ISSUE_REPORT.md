# OAuth Cookie Issue - Root Cause Analysis

## Problem Summary
Users login with Google OAuth but are redirected back to `/login` instead of `/dashboard`. The authentication cookie is not being properly set or sent.

## Root Cause

### Location
`apps/api/src/modules/auth/oauth.controller.ts` - Lines 110-121

### Issue
The OAuth callback sets the `op_auth` cookie with an explicit `domain` attribute:

```typescript
// Extract domain from FRONTEND_URL for cookie
const frontendUrl = new URL(process.env.FRONTEND_URL || 'https://operate.guru');
const cookieDomain = frontendUrl.hostname; // = 'operate.guru'

res.cookie('op_auth', authData, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 604800 * 1000,
  path: '/',
  domain: cookieDomain, // PROBLEM: Explicitly sets domain to 'operate.guru'
});
```

### Why This Fails

1. **API Response Origin**: The cookie is set in a response from `https://operate.guru/api/v1/auth/google/callback`
2. **Explicit Domain Mismatch**: Setting `domain: 'operate.guru'` in the cookie can cause issues in certain scenarios:
   - Cross-origin OAuth redirects (from Google back to API)
   - Browser security policies may reject cookies with explicit domains in redirect chains
   - The cookie may not be properly associated with the subsequent `/auth/callback` navigation

3. **Cookie Not Sent**: When the browser navigates to `https://operate.guru/auth/callback`, the `op_auth` cookie is not included in the request, causing middleware to treat the user as unauthenticated.

## The Fix

### Option 1: Remove Explicit Domain (Recommended)
Let the browser automatically set the cookie domain based on the response origin:

```typescript
res.cookie('op_auth', authData, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 604800 * 1000,
  path: '/',
  // domain: cookieDomain, // REMOVE THIS LINE
});
```

### Option 2: Use Leading Dot for Subdomains
If you need subdomain support, use a leading dot:

```typescript
res.cookie('op_auth', authData, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 604800 * 1000,
  path: '/',
  domain: `.${cookieDomain}`, // Leading dot = works for all subdomains
});
```

### Option 3: Conditional Domain Setting
Only set domain for specific cases:

```typescript
const cookieOptions: any = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 604800 * 1000,
  path: '/',
};

// Only set domain if we need cross-subdomain support
if (process.env.COOKIE_DOMAIN) {
  cookieOptions.domain = process.env.COOKIE_DOMAIN;
}

res.cookie('op_auth', authData, cookieOptions);
```

## Additional Findings

### Microsoft OAuth Has Same Issue
Lines 214-225 in the same file have the identical problem:

```typescript
res.cookie('op_auth', authData, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 604800 * 1000,
  path: '/',
  domain: cookieDomain, // Same issue here
});
```

### Working Cookie Examples
The regular auth endpoints (`auth.controller.ts`) use `setAuthCookies()` which likely doesn't set an explicit domain - this is why regular email/password login works.

## Testing Requirements

After fixing, test:

1. ✓ Google OAuth login → should redirect to dashboard or onboarding
2. ✓ Microsoft OAuth login → should redirect to dashboard or onboarding
3. ✓ Cookie is present in browser after OAuth
4. ✓ Cookie is sent with subsequent requests to `/auth/callback`
5. ✓ Middleware correctly validates the cookie
6. ✓ User reaches dashboard/onboarding instead of /login

## Files to Modify

1. `apps/api/src/modules/auth/oauth.controller.ts`
   - Line 120: Remove or modify `domain: cookieDomain`
   - Line 224: Remove or modify `domain: cookieDomain`

## Recommended Implementation

```typescript
// At the top of oauth.controller.ts, add a helper method:
private getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 604800 * 1000, // 7 days
    path: '/',
    // No explicit domain - let browser handle it
  };
}

// Then in googleCallback and microsoftCallback:
res.cookie('op_auth', authData, this.getCookieOptions());
```

This ensures consistency and makes future changes easier.
