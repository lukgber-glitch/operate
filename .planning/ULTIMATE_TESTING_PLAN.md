# ULTIMATE TESTING PLAN - Operate.guru
## Final Comprehensive Test System (Version 2.0)

**Created:** 2025-12-17
**Goal:** Test ALL 170 pages with REAL functionality testing - forms, buttons, APIs
**Previous Attempts:** 5 failed attempts due to onboarding blocker and false positives

---

## CRITICAL LESSONS FROM FAILURES

### What Went Wrong (5 Previous Attempts)

| Failure | Root Cause | Solution |
|---------|------------|----------|
| All pages redirected to /onboarding | Test user never completed onboarding | Run fix-test-user.ts FIRST |
| Tests marked PASS but tested nothing | Only checked if page loaded | Require element verification |
| 401 errors on all API calls | Google OAuth user with email/password login | Use seeded user OR fix OAuth |
| Empty orgId causing 404s | window.__orgId not set | Wait for auth hook to initialize |
| False positives | No actual interaction testing | Test forms, buttons, APIs |

### Database Scripts Available

```bash
# Fix test user (mark onboarding complete)
cd packages/database
npx ts-node prisma/scripts/fix-test-user.ts

# Verify test user status
npx ts-node prisma/scripts/verify-test-user.ts
```

---

## PREREQUISITE CHECKLIST (MUST DO FIRST)

### Step 1: Fix Test User Onboarding

```bash
# SSH to production server
ssh cloudways

# Navigate to project
cd ~/applications/eagqdkxvzv/public_html

# Run fix script (REQUIRED)
npx ts-node packages/database/prisma/scripts/fix-test-user.ts
```

**Expected Output:**
```
✅ Onboarding marked as complete
✅ Test user account fixed successfully!
```

### Step 2: Verify Session Works

After fixing onboarding, verify the session is valid:

```bash
# Test API endpoint
curl -b "cookies.txt" https://operate.guru/api/v1/auth/me
```

**Expected:** 200 OK with user data
**If 401:** Re-login via browser and export cookies

### Step 3: Launch Chrome with Debug Port

```powershell
# Windows
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Users\grube\op\operate-fresh\test-browser-profile"

# Then login manually at https://operate.guru/login
# Use: luk.gber@gmail.com (Google OAuth)
# OR: admin@acme.de / Admin123! (if seeded)
```

### Step 4: Verify NOT Redirecting to Onboarding

After login, navigate to ANY protected page and verify:
- URL does NOT end with /onboarding
- URL does NOT end with /login
- Page shows actual content, not "Welcome to Operate" wizard

---

## TEST CREDENTIALS

### Primary Test User
```javascript
const PRIMARY_USER = {
  email: 'luk.gber@gmail.com',
  authMethod: 'GOOGLE_OAUTH', // CRITICAL: Must use Google login, not email/password
  onboardingStatus: 'MUST_FIX_FIRST', // Run fix-test-user.ts
};
```

### Fallback Test User (Seeded)
```javascript
const SEEDED_USER = {
  email: 'admin@acme.de',
  password: 'Admin123!',
  authMethod: 'EMAIL_PASSWORD',
  organisation: 'Acme GmbH',
};
```

---

## BROWSER CONFIGURATION

```javascript
const BROWSER_CONFIG = {
  // Chrome debug port
  debugPort: 9222,

  // Viewport (consistent screenshots)
  viewport: { width: 1920, height: 1080 },

  // CRITICAL: Extended timeouts to prevent false negatives
  timeouts: {
    navigation: 90000,      // 90s for slow pages
    elementWait: 45000,     // 45s for elements to appear
    networkIdle: 60000,     // 60s for API responses
    betweenActions: 1000,   // 1s between clicks/inputs
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    backoffMs: 2000,        // 2s, then 4s, then 8s
  },

  // User data directory (preserves session)
  userDataDir: './test-browser-profile',
};
```

---

## PASS/FAIL CRITERIA (STRICT)

### Page PASSES if ALL conditions met:

1. **Navigation Success**
   - Page loads without timeout (90s max)
   - Final URL is NOT /login
   - Final URL is NOT /onboarding
   - HTTP status is 200

2. **Content Verification**
   - Page has >100 characters of body text
   - No error alerts visible (`[role="alert"].destructive`)
   - Required elements present (per page spec)

3. **API Health**
   - No 4xx errors in network log (except expected 404 for empty lists)
   - No 5xx errors in network log
   - `/api/v1/auth/me` returns 200

4. **Console Clean**
   - No uncaught exceptions
   - No "Cannot read property" errors
   - No "is not a function" errors

### Page FAILS if ANY condition:

- Redirected to /login → Session expired
- Redirected to /onboarding → Onboarding not complete
- Timeout exceeded → Page too slow or broken
- Required element missing → UI broken
- API 4xx/5xx → Backend error
- JavaScript exception → Frontend error

---

## MICRO-BATCH ARCHITECTURE

### Why 20 Batches?

| Batch Size | Context Usage | Risk |
|------------|---------------|------|
| 50 pages | ~500k tokens | HIGH - context overflow |
| 20 pages | ~200k tokens | MEDIUM - borderline |
| 8-10 pages | ~80k tokens | LOW - safe |

### Batch Distribution (170 pages)

| Batch | Category | Pages | Priority |
|-------|----------|-------|----------|
| 00 | Prerequisites | 1 | FIRST - Must run before all |
| 01 | Auth Pages | 10 | HIGH - Verify login works |
| 02 | Public Pages | 15 | HIGH - No auth needed |
| 03 | Dashboard Core | 10 | HIGH |
| 04 | Finance Overview | 8 | MEDIUM |
| 05 | Finance Invoices | 10 | MEDIUM |
| 06 | Finance Expenses | 8 | MEDIUM |
| 07 | Finance Banking | 8 | MEDIUM |
| 08 | HR Employees | 10 | MEDIUM |
| 09 | HR Payroll/Benefits | 6 | MEDIUM |
| 10 | Tax Module | 10 | MEDIUM |
| 11 | Time/Mileage | 8 | MEDIUM |
| 12 | CRM/Clients | 8 | MEDIUM |
| 13 | Contracts/Quotes | 10 | MEDIUM |
| 14 | Documents | 6 | MEDIUM |
| 15 | Settings | 15 | MEDIUM |
| 16 | Admin/Developer | 10 | MEDIUM |
| 17 | Insurance | 4 | LOW |
| 18 | Reports/Intelligence | 8 | LOW |
| 19 | Automation | 6 | LOW |
| 20 | Dynamic Routes [id] | 18 | LAST - Needs real IDs |

---

## BATCH 00: PREREQUISITES (RUN FIRST)

**Purpose:** Verify test environment is ready before any page testing

```javascript
const BATCH_00_PREREQUISITES = {
  name: 'Prerequisites Check',
  tasks: [
    {
      name: 'Fix Test User Onboarding',
      type: 'SSH_COMMAND',
      command: 'cd ~/applications/eagqdkxvzv/public_html && npx ts-node packages/database/prisma/scripts/fix-test-user.ts',
      expectedOutput: 'Onboarding marked as complete',
    },
    {
      name: 'Verify Auth API',
      type: 'API_CHECK',
      endpoint: '/api/v1/auth/me',
      expectedStatus: 200,
      failureAction: 'STOP_ALL_TESTS',
    },
    {
      name: 'Verify Not Onboarding',
      type: 'NAVIGATION',
      url: '/dashboard',
      mustNotRedirectTo: ['/login', '/onboarding'],
      failureAction: 'STOP_ALL_TESTS',
    },
    {
      name: 'Fetch Test Data IDs',
      type: 'API_FETCH',
      endpoints: [
        { path: '/api/v1/invoices?limit=1', storeAs: 'testInvoiceId' },
        { path: '/api/v1/expenses?limit=1', storeAs: 'testExpenseId' },
        { path: '/api/v1/clients?limit=1', storeAs: 'testClientId' },
        { path: '/api/v1/employees?limit=1', storeAs: 'testEmployeeId' },
      ],
    },
  ],
};
```

---

## BATCH 01: AUTH PAGES (10 pages)

```javascript
const BATCH_01_AUTH = {
  name: 'Authentication Pages',
  requiresAuth: false, // Most are public
  pages: [
    {
      route: '/login',
      elements: ['input[type="email"]', 'input[type="password"]', 'button[type="submit"]'],
      forms: [{
        name: 'LoginForm',
        fields: [
          { selector: 'input[type="email"]', testValue: 'test@example.com' },
          { selector: 'input[type="password"]', testValue: 'TestPassword123!' },
        ],
        submitButton: 'button[type="submit"]',
        submitAction: 'DO_NOT_SUBMIT', // Don't actually login in test
      }],
      buttons: [
        { selector: 'button:has-text("Google")', action: 'VERIFY_EXISTS' },
        { selector: 'button:has-text("Microsoft")', action: 'VERIFY_EXISTS' },
      ],
    },
    {
      route: '/register',
      elements: ['input[name="firstName"]', 'input[name="email"]', 'input[type="password"]'],
      forms: [{
        name: 'RegisterForm',
        fields: [
          { selector: 'input[name="firstName"]', testValue: 'Test' },
          { selector: 'input[name="lastName"]', testValue: 'User' },
          { selector: 'input[name="email"]', testValue: 'newuser@example.com' },
          { selector: 'input[type="password"]', testValue: 'SecurePass123!' },
        ],
        submitAction: 'DO_NOT_SUBMIT',
      }],
    },
    {
      route: '/forgot-password',
      elements: ['input[type="email"]', 'button[type="submit"]'],
    },
    {
      route: '/reset-password',
      elements: ['input[type="password"]'],
      note: 'Requires valid token - may show error without token',
    },
    {
      route: '/verify-email',
      note: 'Requires valid token - may redirect',
    },
    {
      route: '/mfa-setup',
      requiresAuth: true,
      elements: ['[data-testid="mfa-setup"]'],
    },
    {
      route: '/mfa-verify',
      requiresAuth: true,
    },
    {
      route: '/auth/callback',
      note: 'OAuth callback - will redirect',
    },
    {
      route: '/auth/error',
      testWith: '?error=test_error',
      elements: ['[role="alert"]'],
    },
    {
      route: '/onboarding',
      requiresAuth: true,
      note: 'If test user fixed, should redirect to /dashboard',
    },
  ],
};
```

---

## BATCH 02: PUBLIC PAGES (15 pages)

```javascript
const BATCH_02_PUBLIC = {
  name: 'Public Pages',
  requiresAuth: false,
  pages: [
    { route: '/', elements: ['h1', 'nav', '[data-testid="hero"]'] },
    { route: '/pricing', elements: ['[data-testid="pricing-card"]'] },
    { route: '/faq', elements: ['[data-testid="faq-item"]'] },
    { route: '/privacy', elements: ['h1:has-text("Privacy")'] },
    { route: '/terms', elements: ['h1:has-text("Terms")'] },
    { route: '/cookies', elements: ['h1:has-text("Cookie")'] },
    { route: '/acceptable-use', elements: ['h1'] },
    { route: '/ai-disclaimer', elements: ['h1'] },
    { route: '/dpa', elements: ['h1'] },
    { route: '/impressum', elements: ['h1'] },
    { route: '/payment-terms', elements: ['h1'] },
    { route: '/security', elements: ['h1'] },
    { route: '/compliance', elements: ['h1'] },
    { route: '/about', elements: ['h1'] },
    { route: '/offline', elements: ['[data-testid="offline-message"]'] },
  ],
};
```

---

## BATCH 03: DASHBOARD CORE (10 pages)

```javascript
const BATCH_03_DASHBOARD = {
  name: 'Dashboard Core',
  requiresAuth: true,
  mustNotRedirectTo: ['/login', '/onboarding'],
  pages: [
    {
      route: '/dashboard',
      elements: ['[data-testid="dashboard"]', '[data-testid="widget"]'],
      apis: ['/api/v1/dashboard/stats', '/api/v1/notifications'],
    },
    {
      route: '/profile',
      elements: ['[data-testid="user-avatar"]', 'input[name="firstName"]'],
      forms: [{
        name: 'ProfileForm',
        fields: [
          { selector: 'input[name="firstName"]', action: 'VERIFY_HAS_VALUE' },
          { selector: 'input[name="lastName"]', action: 'VERIFY_HAS_VALUE' },
        ],
      }],
    },
    {
      route: '/chat',
      elements: ['[data-testid="chat-input"]', '[data-testid="chat-messages"]'],
      interactions: [{
        type: 'INPUT',
        selector: '[data-testid="chat-input"]',
        value: 'Hello',
        verifyAfter: 'INPUT_HAS_VALUE',
      }],
    },
    {
      route: '/inbox',
      elements: ['[data-testid="inbox-list"]'],
    },
    {
      route: '/calendar',
      elements: ['[data-testid="calendar"]'],
    },
    {
      route: '/search',
      elements: ['input[type="search"]'],
      interactions: [{
        type: 'INPUT',
        selector: 'input[type="search"]',
        value: 'invoice',
        verifyAfter: 'RESULTS_APPEAR',
      }],
    },
    {
      route: '/notifications',
      elements: ['[data-testid="notifications-list"]'],
    },
    {
      route: '/notifications/inbox',
      elements: ['[data-testid="notification-item"]'],
    },
    {
      route: '/tasks',
      elements: ['[data-testid="task-list"]'],
    },
    {
      route: '/health-score',
      elements: ['[data-testid="health-score"]'],
    },
  ],
};
```

---

## BATCH 04-07: FINANCE PAGES (34 pages)

### Batch 04: Finance Overview (8 pages)
```javascript
const BATCH_04_FINANCE = {
  name: 'Finance Overview',
  requiresAuth: true,
  pages: [
    { route: '/finance', elements: ['[data-testid="finance-dashboard"]'] },
    { route: '/finance/accounts', elements: ['[data-testid="accounts-list"]'] },
    { route: '/finance/transactions', elements: ['[data-testid="transactions-table"]'] },
    { route: '/finance/reconciliation', elements: ['[data-testid="reconciliation"]'] },
    { route: '/finance/payments', elements: ['[data-testid="payments-list"]'] },
    { route: '/finance/payments/callback', note: 'Callback page - may redirect' },
    { route: '/billing', elements: ['[data-testid="billing"]'] },
  ],
};
```

### Batch 05: Finance Invoices (10 pages)
```javascript
const BATCH_05_INVOICES = {
  name: 'Finance Invoices',
  requiresAuth: true,
  pages: [
    {
      route: '/finance/invoices',
      elements: ['[data-testid="invoices-table"]', 'button:has-text("New Invoice")'],
      buttons: [
        { selector: 'button:has-text("New Invoice")', action: 'VERIFY_EXISTS' },
        { selector: 'button:has-text("Filter")', action: 'VERIFY_EXISTS' },
      ],
    },
    {
      route: '/finance/invoices/new',
      elements: ['form', 'input[name="clientId"]', 'button[type="submit"]'],
      forms: [{
        name: 'NewInvoiceForm',
        fields: [
          { selector: '[data-testid="client-select"]', action: 'VERIFY_EXISTS' },
          { selector: '[data-testid="line-items"]', action: 'VERIFY_EXISTS' },
        ],
      }],
    },
    { route: '/finance/invoices/extracted', elements: ['[data-testid="extracted-invoices"]'] },
    { route: '/finance/invoices/recurring', elements: ['[data-testid="recurring-invoices"]'] },
    { route: '/finance/invoices/recurring/new', elements: ['form'] },
  ],
};
```

### Batch 06: Finance Expenses (8 pages)
```javascript
const BATCH_06_EXPENSES = {
  name: 'Finance Expenses',
  requiresAuth: true,
  pages: [
    { route: '/finance/expenses', elements: ['[data-testid="expenses-table"]'] },
    {
      route: '/finance/expenses/new',
      forms: [{
        name: 'NewExpenseForm',
        fields: [
          { selector: 'input[name="amount"]', testValue: '100.00' },
          { selector: 'input[name="description"]', testValue: 'Test expense' },
          { selector: '[data-testid="category-select"]', action: 'VERIFY_EXISTS' },
        ],
      }],
    },
    { route: '/finance/expenses/scan', elements: ['[data-testid="receipt-scanner"]'] },
  ],
};
```

### Batch 07: Finance Banking (8 pages)
```javascript
const BATCH_07_BANKING = {
  name: 'Finance Banking',
  requiresAuth: true,
  pages: [
    { route: '/finance/banking', elements: ['[data-testid="bank-accounts"]'] },
    { route: '/finance/bank-accounts', elements: ['[data-testid="connections-list"]'] },
    { route: '/finance/bank-accounts/callback', note: 'OAuth callback' },
  ],
};
```

---

## BATCH 08-09: HR PAGES (16 pages)

### Batch 08: HR Employees (10 pages)
```javascript
const BATCH_08_HR_EMPLOYEES = {
  name: 'HR Employees',
  requiresAuth: true,
  pages: [
    { route: '/hr', elements: ['[data-testid="hr-dashboard"]'] },
    { route: '/hr/employees', elements: ['[data-testid="employees-table"]'] },
    {
      route: '/hr/employees/new',
      forms: [{
        name: 'NewEmployeeForm',
        fields: [
          { selector: 'input[name="firstName"]', testValue: 'John' },
          { selector: 'input[name="lastName"]', testValue: 'Doe' },
          { selector: 'input[name="email"]', testValue: 'john.doe@example.com' },
        ],
      }],
    },
    { route: '/hr/employees/onboarding', elements: ['[data-testid="onboarding-wizard"]'] },
  ],
};
```

### Batch 09: HR Payroll/Benefits (6 pages)
```javascript
const BATCH_09_HR_PAYROLL = {
  name: 'HR Payroll & Benefits',
  requiresAuth: true,
  pages: [
    { route: '/hr/payroll/run', elements: ['[data-testid="payroll-run"]'] },
    { route: '/hr/benefits', elements: ['[data-testid="benefits-list"]'] },
    { route: '/hr/benefits/enroll', elements: ['[data-testid="enrollment-form"]'] },
    { route: '/hr/leave', elements: ['[data-testid="leave-overview"]'] },
    { route: '/hr/leave/approvals', elements: ['[data-testid="approvals-list"]'] },
    { route: '/hr/leave/requests', elements: ['[data-testid="requests-list"]'] },
  ],
};
```

---

## BATCH 10: TAX MODULE (10 pages)

```javascript
const BATCH_10_TAX = {
  name: 'Tax Module',
  requiresAuth: true,
  pages: [
    { route: '/tax', elements: ['[data-testid="tax-dashboard"]'] },
    { route: '/tax/austria', elements: ['[data-testid="austria-tax"]'] },
    { route: '/tax/germany', elements: ['[data-testid="germany-tax"]'] },
    { route: '/tax/deductions', elements: ['[data-testid="deductions-list"]'] },
    { route: '/tax/deductions/new', forms: [{ name: 'NewDeductionForm' }] },
    { route: '/tax/deductions/calculators', elements: ['[data-testid="calculators"]'] },
    { route: '/tax/filing', elements: ['[data-testid="tax-filing"]'] },
    { route: '/tax/reports', elements: ['[data-testid="tax-reports"]'] },
    { route: '/tax/vat', elements: ['[data-testid="vat-overview"]'] },
    { route: '/tax/vat/uk', elements: ['[data-testid="uk-vat"]'] },
  ],
};
```

---

## BATCH 11-14: TIME, CRM, CONTRACTS, DOCUMENTS (32 pages)

### Batch 11: Time/Mileage (8 pages)
- /time, /time/entries, /time/projects, /time/projects/new
- /mileage, /mileage/entries, /mileage/new, /mileage/tax-report

### Batch 12: CRM/Clients (8 pages)
- /crm, /clients, /vendors, /vendors/new

### Batch 13: Contracts/Quotes (10 pages)
- /contracts, /contracts/new, /contracts/templates
- /quotes, /quotes/new

### Batch 14: Documents (6 pages)
- /documents, /documents/upload, /documents/templates

---

## BATCH 15: SETTINGS (15 pages)

```javascript
const BATCH_15_SETTINGS = {
  name: 'Settings',
  requiresAuth: true,
  pages: [
    { route: '/settings', elements: ['[data-testid="settings-nav"]'] },
    { route: '/settings/profile', forms: [{ name: 'ProfileSettingsForm' }] },
    { route: '/settings/ai', elements: ['[data-testid="ai-settings"]'] },
    { route: '/settings/automation', elements: ['[data-testid="automation-settings"]'] },
    { route: '/settings/billing', elements: ['[data-testid="billing-settings"]'] },
    { route: '/settings/connections', elements: ['[data-testid="connections-list"]'] },
    { route: '/settings/email', elements: ['[data-testid="email-settings"]'] },
    { route: '/settings/exports', elements: ['[data-testid="exports"]'] },
    { route: '/settings/notifications', elements: ['[data-testid="notification-prefs"]'] },
    { route: '/settings/security', elements: ['[data-testid="security-settings"]'] },
    { route: '/settings/tax', elements: ['[data-testid="tax-settings"]'] },
    { route: '/settings/tax/exemptions', elements: ['[data-testid="exemptions"]'] },
    { route: '/settings/tax/nexus', elements: ['[data-testid="nexus"]'] },
    { route: '/settings/verification', elements: ['[data-testid="verification"]'] },
    { route: '/settings/verification/start', elements: ['form'] },
  ],
};
```

---

## BATCH 16-19: ADMIN, INSURANCE, REPORTS, AUTOMATION (28 pages)

### Batch 16: Admin/Developer (10 pages)
- /admin, /admin/users, /admin/roles, /admin/subscriptions
- /developer, /developer/api-keys, /developer/webhooks, /developer/logs
- /api-docs, /help

### Batch 17: Insurance (4 pages)
- /insurance, /insurance/policies, /insurance/policies/new

### Batch 18: Reports/Intelligence (8 pages)
- /reports, /reports/financial, /reports/sales
- /intelligence, /intelligence/email, /intelligence/reviews

### Batch 19: Automation (6 pages)
- /autopilot, /autopilot/actions, /autopilot/settings
- /integrations, /feedback

---

## BATCH 20: DYNAMIC ROUTES [id] (18 pages)

**REQUIRES:** Real IDs fetched in BATCH 00

```javascript
const BATCH_20_DYNAMIC = {
  name: 'Dynamic Routes',
  requiresAuth: true,
  prerequisite: 'BATCH_00_MUST_COMPLETE',
  pages: [
    { route: '/finance/invoices/{testInvoiceId}' },
    { route: '/finance/invoices/recurring/{testRecurringId}' },
    { route: '/finance/invoices/recurring/{testRecurringId}/edit' },
    { route: '/finance/expenses/{testExpenseId}' },
    { route: '/finance/expenses/scan/{testScanId}' },
    { route: '/finance/banking/{testAccountId}' },
    { route: '/hr/employees/{testEmployeeId}' },
    { route: '/hr/employees/{testEmployeeId}/edit' },
    { route: '/hr/employees/{testEmployeeId}/contracts' },
    { route: '/hr/employees/{testEmployeeId}/documents' },
    { route: '/hr/employees/{testEmployeeId}/leave' },
    { route: '/hr/payroll/run/{testPayrollId}' },
    { route: '/clients/{testClientId}' },
    { route: '/crm/{testContactId}' },
    { route: '/contracts/{testContractId}' },
    { route: '/contracts/templates/{testTemplateId}' },
    { route: '/quotes/{testQuoteId}' },
    { route: '/documents/{testFolderId}' },
  ],
};
```

---

## EXECUTION ORDER

```
1. BATCH 00: Prerequisites (MUST PASS BEFORE CONTINUING)
   ├── Fix test user onboarding
   ├── Verify auth works
   ├── Verify no redirect to onboarding
   └── Fetch test data IDs

2. BATCH 01-02: Auth & Public (CAN RUN IN PARALLEL)
   ├── BATCH 01: Auth pages
   └── BATCH 02: Public pages

3. BATCH 03-19: Protected Pages (SEQUENTIAL OR GROUPED)
   ├── Group A: Dashboard, Finance (03-07)
   ├── Group B: HR, Tax, Time (08-11)
   ├── Group C: CRM, Contracts, Docs (12-14)
   └── Group D: Settings, Admin, Reports (15-19)

4. BATCH 20: Dynamic Routes (LAST - needs IDs)
```

---

## AGENT LAUNCH COMMANDS

### Launch Prerequisites (FIRST)
```
Task: browser-auth
Prompt: "Execute BATCH 00 Prerequisites from ULTIMATE_TESTING_PLAN.md"
```

### Launch Auth + Public (PARALLEL)
```
Task: browser-auth  → BATCH 01
Task: browser-ui    → BATCH 02
```

### Launch Protected Pages (GROUPED)
```
Task: browser-e2e     → BATCH 03, 08, 12, 16
Task: browser-finance → BATCH 04, 05, 06, 07, 10
```

---

## EXPECTED OUTPUT

### Per-Batch Report
```json
{
  "batch": "03",
  "name": "Dashboard Core",
  "timestamp": "2025-12-17T12:00:00Z",
  "prerequisites": {
    "authValid": true,
    "notOnboarding": true,
    "orgIdSet": true
  },
  "results": {
    "total": 10,
    "passed": 9,
    "failed": 1,
    "skipped": 0
  },
  "pages": [
    {
      "route": "/dashboard",
      "status": "PASS",
      "checks": {
        "navigation": "PASS",
        "elements": "PASS",
        "apis": "PASS",
        "forms": "N/A",
        "buttons": "PASS"
      },
      "screenshot": "batch-03/dashboard.png"
    }
  ],
  "failedApis": [],
  "consoleErrors": []
}
```

### Final Summary
```markdown
# Operate.guru Full Test Report

**Date:** 2025-12-17
**Total Pages:** 170
**Tested:** 165 (5 skipped - callback pages)
**Passed:** 160 (97%)
**Failed:** 5 (3%)

## Failed Pages
1. /finance/reconciliation - Timeout (needs optimization)
2. /reports/financial - Missing element [data-testid="chart"]
...

## API Errors Found
- /api/v1/time-tracking/timer - 404 Not Found (endpoint missing)
- /api/v1/api/notifications/preferences - 404 (double /api/ prefix bug)

## Recommendations
1. Add /api/v1/time-tracking/timer endpoint
2. Fix double /api/ prefix in notifications
```

---

## SUCCESS CRITERIA

- [ ] BATCH 00 passes (prerequisites verified)
- [ ] 100% of pages tested (no skipped due to context overflow)
- [ ] No false positives (redirects to /onboarding marked as PASS)
- [ ] All forms tested (fields filled, validation checked)
- [ ] All buttons verified (exist and are clickable)
- [ ] All APIs logged (4xx/5xx recorded)
- [ ] Final report generated with actionable items

---

## CLEANUP AFTER TESTING

Delete old test files after new system proves successful:

```bash
# Old test reports (31 files)
rm -f *TEST*.json *REPORT*.md *SUMMARY*.txt

# Old test scripts (50+ files)
rm -f test-*.js run-*.js batch*.js

# Old screenshots
rm -rf test-screenshots/batch-*
```

---

**This plan addresses ALL failures from previous 5 attempts. Follow it exactly.**
