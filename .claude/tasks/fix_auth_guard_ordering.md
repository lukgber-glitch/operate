# FORGE Task: Fix Auth Guard Ordering Issue

## Problem
TenantGuard runs before JwtAuthGuard because global guards execute before controller guards. TenantGuard expects `request.user` to be populated by JwtAuthGuard, but JwtAuthGuard hasn't run yet since it's only at controller level.

## Solution
Add JwtAuthGuard as a global guard BEFORE TenantGuard in `apps/api/src/app.module.ts`.

## Files to Modify
- `apps/api/src/app.module.ts`

## Detailed Changes

### Step 1: Add Import
At the top of the file (around line 1-20), add:
```typescript
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
```

### Step 2: Modify Providers Array
Locate the providers array (around line 277-290) and modify the guard registration:

**BEFORE:**
```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: CsrfGuard,
  },
  {
    provide: APP_GUARD,
    useClass: TenantGuard,
  },
],
```

**AFTER:**
```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: CsrfGuard,
  },
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,  // NEW - must run before TenantGuard
  },
  {
    provide: APP_GUARD,
    useClass: TenantGuard,
  },
],
```

## Expected Guard Execution Order
1. **CsrfGuard** - validates CSRF tokens for state-changing requests
2. **JwtAuthGuard** - validates JWT and populates `request.user`
3. **TenantGuard** - uses `request.user` for tenant isolation

## Verification
After making changes:
1. Verify TypeScript compilation succeeds
2. Ensure the import path is correct
3. Confirm the guard ordering is correct in the providers array

## Acceptance Criteria
- [x] JwtAuthGuard import added
- [x] JwtAuthGuard registered as global guard before TenantGuard
- [x] File compiles without errors
- [x] Guard execution order is: CsrfGuard → JwtAuthGuard → TenantGuard
