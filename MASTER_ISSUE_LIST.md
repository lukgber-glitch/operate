# Operate App - Master Issue List

**Generated:** 2025-12-06
**Test Coverage:** Authentication, Onboarding, Dashboard, Finance, Chat, Settings, HR, Tax

---

## Summary

| Priority | Count | Fixed | Remaining |
|----------|-------|-------|-----------|
| P0 (Blocker) | 1 | 1 | 0 |
| P1 (Critical) | 3 | 1 | 2 |
| P2 (High) | 2 | 0 | 2 |
| P3 (Medium) | 2 | 1 | 1 |
| P4 (Low) | 1 | 0 | 1 |
| **Total** | **9** | **3** | **6** |

---

## Fixed Issues ✅

### ISS-001 [P0] Email Validation Rejects Valid Emails
- **Area:** Onboarding
- **File:** `apps/web/src/components/onboarding/OnboardingWizard.tsx:39`
- **Fix:** Added `.min(1)` before `.email()` in Zod schema
- **Status:** ✅ Fixed, not deployed

### ISS-002 [P1] Password Login Fails for OAuth Users
- **Area:** Authentication
- **Root Cause:** OAuth users have NULL passwordHash
- **Fix:** Added complete password management system:
  - `POST /auth/password/set` - Set password for OAuth accounts
  - `POST /auth/password/change` - Change existing password
  - `GET /auth/password/status` - Check if password is set
- **Status:** ✅ Fixed, committed (04f2879), not deployed

### ISS-003 [P3] Duplicate "Welcome to Operate" Header
- **Area:** Onboarding
- **File:** `apps/web/src/app/(auth)/onboarding/page.tsx`
- **Fix:** Removed duplicate header from page component
- **Status:** ✅ Fixed, not deployed

---

## Remaining Issues

### ISS-004 [P3] Hardcoded Organization ID Fallback
- **Area:** Finance API
- **File:** `apps/web/src/lib/api/finance.ts:238`
- **Issue:** Falls back to `'default-org-id'` when orgId unavailable
- **Impact:** Could cause data isolation issues in multi-tenant environment
- **Status:** 🔴 Open

### ISS-005 [P4] Statistics Endpoints Graceful Fallback
- **Area:** Finance API
- **File:** `apps/web/src/lib/api/finance.ts:494`
- **Issue:** Returns zeros with console warning if stats endpoints don't exist
- **Impact:** Minor - just shows zeros instead of real data
- **Status:** 🔴 Open

### ISS-006 [P2] No Dedicated /chat Route Page
- **Area:** Chat
- **File:** Missing `apps/web/src/app/(dashboard)/chat/page.tsx`
- **Issue:** Only layout.example.tsx exists, no actual page
- **Impact:** Cannot use full-screen chat view (floating button works)
- **Status:** 🔴 Open

### ISS-007 [P2] Missing Germany ELSTER Page
- **Area:** Tax
- **File:** Missing `apps/web/src/app/(dashboard)/tax/germany/page.tsx`
- **Issue:** Austria has page, Germany doesn't
- **Impact:** German tax integration UI not accessible
- **Status:** 🔴 Open

### ISS-008 [P1] HR Module Blocked by Onboarding
- **Area:** Navigation/Middleware
- **File:** `apps/web/src/middleware.ts:231-233`
- **Issue:** All /hr routes redirect to /onboarding until complete
- **Impact:** Cannot access HR features without completing 8-step wizard
- **Recommendation:** Add "Skip for now" option or preview mode
- **Status:** 🔴 Open (by design, but UX issue)

### ISS-009 [P1] Tax Module Blocked by Onboarding
- **Area:** Navigation/Middleware
- **File:** `apps/web/src/middleware.ts:231-233`
- **Issue:** All /tax routes redirect to /onboarding until complete
- **Impact:** Cannot access Tax features without completing 8-step wizard
- **Status:** 🔴 Open (by design, but UX issue)

---

## Test Coverage Results

### Dashboard & Finance (TEST-BETA)
- **Score:** 98% pass
- **Features:** 20+ routes verified
- **Code Quality:** Excellent (9/10)
- **Issues Found:** 2 (P3, P4)

### Chat & Settings (TEST-GAMMA)
- **Score:** 98.5% pass (51/52 features)
- **Chat Components:** 26 components verified
- **Settings Fields:** 58+ interactive elements
- **Issues Found:** 1 (P2)

### HR & Tax (TEST-DELTA)
- **Score:** Blocked by onboarding
- **Verified:** Authentication, form validation
- **Issues Found:** 3 (P1x2, P2)

---

## Deployment Status

### Code Ready, Not Deployed
All fixes are committed to git but NOT deployed to production because:
1. Cloudways server has RAM constraints during TypeScript build
2. Need to build locally and upload compiled dist

### Deployment Steps
```bash
# Option 1: Build locally and deploy
cd apps/api
npm run build
scp -r dist/* cloudways:~/applications/eagqdkxvzv/public_html/apps/api/dist/
ssh cloudways "cd ~/applications/eagqdkxvzv/public_html/apps/api && npx pm2 restart operate-api"

# Option 2: Deploy frontend fixes
cd apps/web
npm run build
# Upload .next folder to server
```

---

## Recommendations

1. **Deploy fixes ASAP** - ISS-001 blocks onboarding completion
2. **Create /chat page** - Quick win, enables full-screen chat
3. **Create Germany ELSTER page** - Important for German users
4. **Add onboarding skip** - Improve UX for exploration
5. **Fix orgId fallback** - Security/data isolation concern
