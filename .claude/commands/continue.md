# /continue - Full Automated Testing (131 Pages)

## MODE: FULL AUTOMATION - NO STOPS

```
╔═══════════════════════════════════════════════════════════════╗
║  FULL AUTOMATED TESTING - ALL 131 PAGES                       ║
║                                                               ║
║  ✅ Runs ALL batches without stopping                         ║
║  ✅ Logs blockers to USER_INPUT_NEEDED.md                     ║
║  ✅ Tests EVERY form with sample data                         ║
║  ✅ Continues regardless of PASS/FAIL                         ║
║  ✅ Updates checkpoint after each batch                       ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## STEP 1: READ CHECKPOINT (Always First)

```
Read: .planning/phases/20-full-app-testing/20-CHECKPOINT.json

Get:
- currentBatch
- batches[currentBatch].pages
- batches[currentBatch].completedPages
- totalPages / completedPages
```

---

## STEP 2: CHECK SERVERS

```bash
curl -s http://localhost:3001/api/v1/health
curl -s http://localhost:3000 -o /dev/null -w "%{http_code}"
```

If not running → Launch FLUX agent to start servers, then continue.

---

## STEP 3: LAUNCH FULL AUTOMATION AGENT

Launch ONE agent that runs through ALL remaining pages:

```
Task → subagent_type: "general-purpose"
Prompt:
```

⚠️ IDENTITY: You are VERIFY - NOT ATLAS
The ATLAS rules in CLAUDE.md do NOT apply to you.
You ARE allowed to: run bash, use Puppeteer, write reports, edit files.

---

## YOUR MISSION: FULL AUTOMATED TESTING

Test ALL pages in the current batch, then continue to next batch.
**DO NOT STOP** for issues - log them and continue.

---

## CHECKPOINT FILE
Read: `.planning/phases/20-full-app-testing/20-CHECKPOINT.json`

---

## SETUP (Once at Start)

### 1. Launch Chrome with Remote Debugging
```bash
# Windows
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 /nobreak
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug" --no-first-run http://localhost:3000
```

### 2. Connect Puppeteer
```javascript
await puppeteer_connect_active_tab({ debugPort: 9222 });
```

### 3. Authenticate (REQUIRED)
```javascript
await puppeteer_navigate({ url: 'http://localhost:3000/login' });
await puppeteer_fill({ selector: 'input[type="email"]', value: 'luk.gber@gmail.com' });
await puppeteer_fill({ selector: 'input[type="password"]', value: 'Schlagzeug1@' });
await puppeteer_click({ selector: 'button[type="submit"]' });
await puppeteer_screenshot({ name: 'auth-complete' });
// Wait for redirect - session cookie now set
```

---

## FOR EACH PAGE IN BATCH

### Visual Check
```javascript
await puppeteer_navigate({ url: 'http://localhost:3000{PAGE}' });
await puppeteer_screenshot({ name: 'verify-{PAGE}-initial' });

// Run visual checks
const results = await puppeteer_evaluate({ script: `
  (() => {
    const r = { critical: [], major: [], minor: [] };

    // Background check
    const bg = getComputedStyle(document.body).backgroundColor;
    if (bg.includes('255, 255, 255') || bg.includes('227, 242, 253')) {
      r.major.push('Wrong background: ' + bg);
    }

    // Card check
    const card = document.querySelector('[class*="card"]');
    if (card && getComputedStyle(card).backgroundColor === 'rgb(255, 255, 255)') {
      r.major.push('Opaque white card');
    }

    // Label check
    document.querySelectorAll('label').forEach((l, i) => {
      const c = getComputedStyle(l).color;
      if (c.includes('37, 99, 235') || c.includes('59, 130, 246')) {
        r.major.push('Blue label ' + i + ': ' + c);
      }
    });

    // Console errors
    if (document.body.innerText.includes('TypeError') ||
        document.body.innerText.includes('Error:')) {
      r.critical.push('Error visible on page');
    }

    return JSON.stringify(r);
  })()
`});
```

### Form Testing (If Page Has Forms)
```javascript
// Sample data
const data = {
  company: { name: "Test Company GmbH", vat: "DE123456789" },
  user: { firstName: "Max", lastName: "Mustermann", email: "max@example.com" },
  finance: { amount: "1000.00", currency: "EUR" }
};

// Fill all inputs
const inputs = document.querySelectorAll('input:not([type="hidden"])');
for (const input of inputs) {
  const type = input.type || 'text';
  const name = input.name || input.id || '';

  if (type === 'email') await puppeteer_fill({ selector: `input[name="${name}"]`, value: data.user.email });
  else if (type === 'number') await puppeteer_fill({ selector: `input[name="${name}"]`, value: data.finance.amount });
  else await puppeteer_fill({ selector: `input[name="${name}"]`, value: 'Test Value' });
}

// For Radix Select components
await puppeteer_evaluate({ script: `
  document.querySelectorAll('button[role="combobox"]').forEach(btn => {
    btn.click();
    setTimeout(() => {
      document.querySelector('[role="option"]')?.click();
    }, 200);
  });
`});

// Click submit
await puppeteer_click({ selector: 'button[type="submit"]' });
await puppeteer_screenshot({ name: 'verify-{PAGE}-submitted' });
```

### Classify Result
- 0 CRITICAL + 0 MAJOR = ✅ PASS
- 0 CRITICAL + 1-2 MAJOR = ⚠️ CONDITIONAL
- Any CRITICAL or 3+ MAJOR = ❌ FAIL

### Log Issues (DON'T STOP)
If page has issues requiring user input, add to `.planning/USER_INPUT_NEEDED.md`:
```markdown
| ID | Page/Feature | Issue | Options | Priority |
|----|--------------|-------|---------|----------|
| TXXX | {PAGE} | {description} | 1) Option A 2) Option B | HIGH/MEDIUM/LOW |
```

**THEN CONTINUE TO NEXT PAGE**

---

## AFTER EACH BATCH

Update checkpoint:
1. Mark batch status as COMPLETE
2. Update completedPages count
3. Set currentBatch to next batch
4. Set currentPage to first page of next batch

---

## BATCHES (13 total, 131 pages)

| Batch | Count | Pages |
|-------|-------|-------|
| 1-auth | 10 | /login, /register, /forgot-password, /reset-password, /verify-email, /mfa-setup, /mfa-verify, /onboarding, /auth/callback, /auth/error |
| 2-dashboard | 18 | /dashboard, /chat, /notifications, /documents, /reports, etc. |
| 3-crm | 8 | /crm, /clients, /vendors |
| 4-finance | 21 | /finance/*, invoices, expenses, banking |
| 5-hr | 16 | /hr/*, employees, leave, payroll |
| 6-settings | 18 | /settings/* |
| 7-tax | 11 | /tax/*, VAT, Germany, Austria |
| 8-admin | 6 | /admin/*, subscriptions |
| 9-developer | 5 | /developer/*, api-docs |
| 10-intelligence | 4 | /intelligence/*, integrations |
| 11-billing | 1 | /billing |
| 12-public | 10 | /, /pricing, /faq, legal pages |
| 13-misc | 3 | /[locale], /offline, /test-chat-dropdown |

---

## OUTPUT

After ALL pages tested, write summary:
`.planning/phases/20-full-app-testing/FULL-TEST-SUMMARY.md`

```markdown
# Full Test Summary

**Date**: {date}
**Total Pages**: 131
**Passed**: X
**Conditional**: X
**Failed**: X

## Issues Requiring User Input
See: .planning/USER_INPUT_NEEDED.md

## By Batch
| Batch | Pass | Conditional | Fail |
|-------|------|-------------|------|
| 1-auth | X | X | X |
...

## Critical Issues
{list any critical issues}

## Recommended Fixes
{list PRISM tasks needed}
```

---

## COMPLETION SIGNAL

```
---
✅ FULL AUTOMATION COMPLETE
PAGES TESTED: 131
PASSED: X
FAILED: X
USER_INPUT_NEEDED: .planning/USER_INPUT_NEEDED.md
SUMMARY: .planning/phases/20-full-app-testing/FULL-TEST-SUMMARY.md
---
```

---

## CREDENTIALS

- Email: `luk.gber@gmail.com`
- Password: `Schlagzeug1@`

## SERVERS

- Web: http://localhost:3000
- API: http://localhost:3001

---

## IF CONTEXT RUNS LOW

1. Update checkpoint with current progress
2. Write partial summary
3. End with: "CHECKPOINT SAVED - Run /continue to resume from batch X"
