# HR and Documents Module Testing Guide

## Quick Start

### Option 1: Double-click the batch file (Easiest)

```
Double-click: run-hr-docs-test.bat
```

This will:
1. Open Chrome browser
2. Navigate to https://operate.guru/login
3. Pause for 90 seconds for manual login
4. Run through all 17 test pages
5. Generate screenshots and reports

### Option 2: Command Line

```bash
cd C:\Users\grube\op\operate-fresh\apps\web
npx playwright test e2e/hr-documents.spec.ts --headed --project=chromium
```

### Option 3: Run Standalone Script

```bash
cd C:\Users\grube\op\operate-fresh\apps\web
npx ts-node test-hr-docs-manual.ts
```

## Login Credentials

**IMPORTANT**: You must manually log in when the browser opens

- **URL**: https://operate.guru/login
- **Email**: luk.gber@gmail.com
- **Password**: schlagzeug
- **Time Allowed**: 90 seconds

## Test Coverage (17 Pages Total)

### HR Module (11 pages)

| # | Page | URL | Status |
|---|------|-----|--------|
| 1 | HR Dashboard | /hr | |
| 2 | Employee List | /hr/employees | |
| 3 | Add Employee | /hr/employees/new | |
| 4 | Onboarding | /hr/employees/onboarding | |
| 5 | Leave Management | /hr/leave | |
| 6 | Leave Requests | /hr/leave/requests | |
| 7 | Leave Approvals | /hr/leave/approvals | |
| 8 | Benefits | /hr/benefits | |
| 9 | Benefits Enroll | /hr/benefits/enroll | |
| 10 | Payroll | /hr/payroll | |
| 11 | Run Payroll | /hr/payroll/run | |

### Documents Module (3 pages)

| # | Page | URL | Status |
|---|------|-----|--------|
| 12 | Documents List | /documents | |
| 13 | Upload Documents | /documents/upload | |
| 14 | Templates | /documents/templates | |

### Contracts Module (3 pages)

| # | Page | URL | Status |
|---|------|-----|--------|
| 15 | Contracts List | /contracts | |
| 16 | Create Contract | /contracts/new | |
| 17 | Templates | /contracts/templates | |

## What Each Test Checks

For every page, the test verifies:

1. **Page Loads** - HTTP 200 or 304 response
2. **No Errors** - No error messages in page content
3. **Screenshot** - Visual proof page rendered
4. **Correct URL** - Navigation succeeded

## Test Results Location

After running tests, check:

```
apps/web/test-results/
├── hr-dashboard.png
├── hr-employees.png
├── hr-employees-new.png
├── ...
└── results.json

apps/web/playwright-report/
└── index.html
```

## Viewing Test Reports

### View HTML Report

```bash
cd C:\Users\grube\op\operate-fresh\apps\web
npx playwright show-report
```

### View JSON Results

```bash
cat test-results/results.json
```

### View Screenshots

Navigate to `C:\Users\grube\op\operate-fresh\apps\web\test-results\` and open PNG files

## Expected Output

```
==========================================
TEST RESULTS SUMMARY
==========================================
Total Tests: 17
✅ Passed: 15
❌ Failed: 2
Success Rate: 88%

ISSUES FOUND:
==========================================
1. Employee Onboarding
   URL: https://operate.guru/hr/employees/onboarding
   Error: HTTP 404

2. Benefits Enrollment
   URL: https://operate.guru/hr/benefits/enroll
   Error: Error message detected on page

📋 JSON OUTPUT:
{
  "summary": {
    "total": 17,
    "passed": 15,
    "failed": 2
  },
  "issues": [
    {
      "page": "Employee Onboarding",
      "url": "https://operate.guru/hr/employees/onboarding",
      "error": "HTTP 404"
    },
    {
      "page": "Benefits Enrollment",
      "url": "https://operate.guru/hr/benefits/enroll",
      "error": "Error message detected on page"
    }
  ]
}
```

## Troubleshooting

### "Login failed - still on login page"

- You took longer than 90 seconds to log in
- Solution: Run test again and log in faster
- Or: Edit test file and increase timeout

### "Timeout waiting for page to load"

- Internet connection slow
- Page is broken or doesn't exist
- Solution: Check the page manually in browser

### "Error message detected on page"

- Page exists but shows an error
- Solution: Check screenshot to see what error
- Check browser console for details

### Browser doesn't open

- Playwright not installed properly
- Solution: Run `npx playwright install chromium`

## Manual Testing Alternative

If automated testing fails, test manually:

1. Open browser
2. Go to https://operate.guru/login
3. Log in with luk.gber@gmail.com / schlagzeug
4. Visit each URL from the table above
5. Note which pages load successfully
6. Note which pages show errors

## Modifying Tests

### Change timeout for manual login

Edit `e2e/hr-documents.spec.ts` line ~17:

```typescript
await page.waitForTimeout(90000); // Change to 120000 for 2 minutes
```

### Add more pages to test

Edit `e2e/hr-documents.spec.ts` and add new test:

```typescript
test('New Page loads', async ({ page }) => {
  results.summary.total++;
  const url = `${TEST_URL}/new-page`;

  try {
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/new-page.png' });

    results.summary.passed++;
    expect(page.url()).toContain('/new-page');
  } catch (error) {
    results.summary.failed++;
    results.issues.push({
      page: 'New Page',
      url,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
});
```

### Run specific test only

```bash
npx playwright test e2e/hr-documents.spec.ts -g "HR Dashboard"
```

## CI/CD Integration

For automated testing in CI (requires non-interactive auth):

```bash
TEST_BASE_URL=https://operate.guru CI=true npx playwright test e2e/hr-documents.spec.ts
```

Note: This won't work with Google OAuth - you'll need to implement token-based auth for CI.

## Support

If tests fail:

1. Check screenshots in `test-results/` folder
2. Run with `--debug` flag to step through
3. Check Playwright HTML report
4. Test pages manually in browser
5. Check browser console for JavaScript errors

## Next Steps

After running tests:

1. Review failed tests
2. Fix broken pages
3. Update routes if pages moved
4. Add new pages to test suite
5. Set up CI/CD integration
