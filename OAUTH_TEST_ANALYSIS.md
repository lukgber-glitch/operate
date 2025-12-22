# Google OAuth Flow - Test Analysis Report

## Test Date
2025-12-22

## Test Environment
- **URL**: https://operate.guru
- **Browser**: Chrome via Puppeteer
- **Credentials**: luk.gber@gmail.com

## Summary
Testing Google OAuth login flow to identify the reported blank page issue during smartphone verification step.

## Code Analysis

### Frontend Flow (CallbackClient.tsx)

**Location**: `apps/web/src/app/(auth)/auth/callback/CallbackClient.tsx`

**Flow**:
1. Component mounts at `/auth/callback?code=XXX`
2. Extracts `code` from URL parameters
3. Calls `POST /api/v1/auth/exchange` with the code
4. Backend sets httpOnly cookie with tokens
5. Redirects to `/chat` after 1 second

**Console Logging** (lines 18-96):
- `[Auth Callback] Processing callback...`
- `[Auth Callback] URL: <full url>`
- `[Auth Callback] Params: {hasCode, hasError, codeLength}`
- `[Auth Callback] Exchanging code for tokens...`
- `[Auth Callback] Exchange successful: {userId}`
- `[Auth Callback] Redirecting to chat...`

**Error Handling**:
- Missing code → Shows error message
- OAuth error param → Shows decoded error
- Exchange API fails → Shows error message
- Unexpected errors → Generic error message

**Retry Logic** (lines 114-125):
- Fallback timeout after 3 seconds
- Retries if still in "processing" state

### Backend Flow (oauth.controller.ts)

**Location**: `apps/api/src/modules/auth/oauth.controller.ts`

**Exchange Endpoint** (lines 234-308):
```typescript
@Post('exchange')
async exchangeCode(@Body('code') code: string, @Res() res: Response)
```

**Flow**:
1. Validates code is present
2. Looks up code in `authCodeStore` (in-memory)
3. Checks if code exists → `BadRequestException` if not
4. Deletes code immediately (one-time use)
5. Checks expiration → `BadRequestException` if expired
6. Sets `op_auth` cookie with tokens
7. Sets onboarding cookie if needed
8. Returns `{success: true, userId: xxx}`

**Cookie Settings** (lines 288-294):
```javascript
{
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 604800 * 1000, // 7 days
  path: '/'
}
```

### Layout Rendering (AuthLayoutClient.tsx)

**Location**: `apps/web/src/app/(auth)/AuthLayoutClient.tsx`

**Callback Page Render**:
- Uses standard auth layout
- Navy gradient background
- Centered content area
- Not onboarding path → uses standard layout structure

## Potential Issues Identified

### 1. **Auth Code Expiration/Race Condition**

**Issue**: In-memory `authCodeStore` may not survive if API restarts
- Codes stored in Map, cleared after use
- If user is slow (smartphone verification), code may expire
- Default expiration time not visible in shown code

**Impact**: "Invalid or expired auth code" error on callback

**Detection**: Check backend logs for:
```
Invalid or expired auth code attempted
Expired auth code attempted
```

### 2. **Cookie SameSite=Strict + Redirect**

**Issue**: `sameSite: 'strict'` may prevent cookie from being set during OAuth redirect
- Google OAuth redirects from `accounts.google.com` → `operate.guru/auth/callback`
- Cross-site redirect
- Strict SameSite blocks cross-site cookie sending

**Impact**: Cookie not set, user appears logged out after redirect

**Solution**: Should use `sameSite: 'lax'` for OAuth callback

### 3. **HTTPS/Secure Cookie in Development**

**Issue**: `secure: true` requires HTTPS
- If testing on localhost without HTTPS, cookie won't set
- Production should be fine (https://operate.guru)

### 4. **Blank Page During Verification**

**Possible Causes**:
a) **JavaScript not loading**
   - CallbackClient.tsx fails to load
   - React hydration error
   - Build issue

b) **API call failing silently**
   - /api/v1/auth/exchange returns error
   - CORS issue
   - Network timeout

c) **Code already used/expired**
   - User refreshes page
   - Code used twice
   - Code expired during verification

d) **Google verification page itself**
   - Not an Operate issue
   - Google's smartphone verification UI
   - User may just need to wait

## Network Requests Observed

From test run:
```
REQUEST: GET /api/v1/auth/me (200 OK)
REQUEST: GET /_next/static/chunks/app/(auth)/login/page-*.js (200 OK)
REQUEST: GET /_next/static/chunks/app/(auth)/layout-*.js (200 OK)
```

All auth-related requests successful in initial test.

## Recommended Tests

### Test 1: Monitor Console During OAuth
```javascript
// Watch for CallbackClient console logs
page.on('console', msg => {
  if (msg.text().includes('[Auth Callback]')) {
    console.log('CALLBACK LOG:', msg.text());
  }
});
```

### Test 2: Check Network Errors
```javascript
page.on('response', async response => {
  if (response.url().includes('exchange')) {
    console.log('EXCHANGE API:', response.status());
    if (!response.ok()) {
      const body = await response.text();
      console.log('ERROR BODY:', body);
    }
  }
});
```

### Test 3: Detect Blank Page
```javascript
const bodyText = await page.evaluate(() => document.body.innerText);
if (bodyText.trim().length < 50) {
  console.log('BLANK PAGE DETECTED');
  const html = await page.content();
  console.log('HTML:', html.substring(0, 500));
}
```

### Test 4: Cookie Inspection
```javascript
const cookies = await page.cookies();
const authCookie = cookies.find(c => c.name === 'op_auth');
console.log('Auth cookie present:', !!authCookie);
```

## Action Items

1. **Run live browser test** with manual OAuth completion
2. **Capture screenshots** at each step
3. **Monitor console** for [Auth Callback] messages
4. **Check network tab** for /api/v1/auth/exchange response
5. **Verify cookie** is set after exchange
6. **Document exact point** where blank page appears

## Questions to Answer

1. Does blank page appear **before** or **after** clicking "Continue with Google"?
2. Is blank page on Google's domain or operate.guru?
3. Are there any console errors when blank page appears?
4. Does the URL contain `/auth/callback?code=` when blank?
5. Is the page truly blank (white screen) or just missing content?

## Expected Behavior

**Normal Flow**:
1. User clicks "Continue with Google"
2. Redirects to accounts.google.com
3. User enters credentials
4. Google may show smartphone verification
5. Google redirects to https://operate.guru/auth/callback?code=XXX
6. CallbackClient shows "Processing..." spinner
7. POST /api/v1/auth/exchange succeeds
8. Cookie set
9. Shows "Success!" briefly
10. Redirects to /chat

**Error Flow (Code Expired)**:
1. Steps 1-5 same
2. CallbackClient calls exchange
3. Backend: "Invalid or expired auth code"
4. Frontend shows error message with "Return to login" button

## Hypothesis

Most likely issue is **#2 - Cookie SameSite=Strict** preventing cookie from being set during cross-site redirect from Google OAuth.

**Evidence Needed**:
- Check if cookie is present after callback
- Check browser console for cookie warnings
- Test with SameSite=Lax

**Quick Fix**:
Change line 291 in oauth.controller.ts:
```typescript
sameSite: 'lax', // Instead of 'strict'
```
