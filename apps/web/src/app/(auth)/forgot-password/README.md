# Forgot Password Page - Technical Documentation

## Purpose
This page allows users to **request** a password reset link via email.

## URL
`/forgot-password`

## Expected Behavior

### Initial State (Default)
When user navigates to `/forgot-password`:
- ✅ Shows email input form
- ✅ Shows "Reset password" title
- ✅ Shows "Enter your email address..." description
- ✅ Shows "Send Reset Link" button
- ❌ Should NEVER show "Invalid Reset Link" error

### After Email Submission
- ✅ Shows success message "Reset link sent!"
- ✅ Shows "Check your email inbox"
- ✅ Shows "Return to login" link

## Common Issues & Solutions

### Issue: "Invalid Reset Link" appears on /forgot-password
**Root Cause:** This indicates the wrong page is being rendered. The "Invalid Reset Link" message belongs ONLY to `/reset-password` page, not `/forgot-password`.

**Solutions:**
1. Clear Next.js cache: `rm -rf apps/web/.next`
2. Clear browser cache: Hard refresh (Ctrl+Shift+R)
3. Verify you're actually at `/forgot-password` in the URL bar (not `/reset-password`)
4. Check for redirects in middleware or elsewhere

### Issue: Page shows blank or skeleton
**Root Cause:** Component not hydrating properly

**Solutions:**
1. Check browser console for errors
2. Verify `PasswordResetRequestForm` component is rendering
3. Check translations are loading

## Flow Diagram

```
User Flow:
┌──────────────────────┐
│  /forgot-password    │
│  (Email input form)  │
└──────────┬───────────┘
           │ User enters email
           │ and clicks "Send"
           ▼
┌──────────────────────┐
│  Success message     │
│  "Check your email"  │
└──────────┬───────────┘
           │ User checks email
           │ and clicks link
           ▼
┌──────────────────────┐
│  /reset-password?    │
│  token=xxx           │
│  (Password form)     │
└──────────────────────┘
```

## Technical Details

### Component Structure
```tsx
ForgotPasswordPage (page.tsx)
└── Suspense
    └── ForgotPasswordContent
        └── PasswordResetRequestForm (from password-reset-form.tsx)
            └── Email input + Submit button
```

### Key Files
- `apps/web/src/app/(auth)/forgot-password/page.tsx` - This page
- `apps/web/src/components/auth/password-reset-form.tsx` - Form component (PasswordResetRequestForm)
- `apps/web/src/lib/auth.ts` - API call (authApi.forgotPassword)

### API Endpoint
- POST `/api/auth/forgot-password`
- Body: `{ email: string }`
- Response: Success/error message

## Defensive Features

1. **Token Detection Warning**: If someone accidentally lands on `/forgot-password?token=xxx`, the page logs a warning and ignores the token
2. **Force Dynamic**: Page uses `export const dynamic = 'force-dynamic'` to prevent static build issues
3. **Suspense Boundary**: Provides loading skeleton during initial render
4. **Error Handling**: Form handles API errors gracefully

## Testing Checklist

- [ ] Navigate to `/forgot-password` shows email form (NOT error)
- [ ] Email validation works (invalid email shows error)
- [ ] Submit button shows loading state during submission
- [ ] Success message appears after email submission
- [ ] "Return to login" link works
- [ ] Page never shows "Invalid Reset Link" text

## Related Pages

- `/reset-password` - Where users go AFTER clicking email link (requires token)
- `/login` - Return destination after successful reset

## Notes for Developers

- This page is **Step 1** of password reset (request link)
- `/reset-password` is **Step 2** (set new password with token)
- Never confuse the two - they serve different purposes
- The "Invalid Reset Link" message belongs ONLY to `/reset-password`, never here
