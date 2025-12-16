# Tax & Reports Module Testing Guide

This directory contains automated and manual testing tools for the Operate Tax & Reports modules.

## Files

- `test-tax-reports.js` - Automated Puppeteer test script
- `../TAX_REPORTS_TESTING_RESULTS.md` - Manual testing checklist

---

## Automated Testing (Puppeteer)

### Setup

1. **Install Puppeteer**:
   ```bash
   npm install puppeteer --save-dev
   # or
   pnpm add -D puppeteer
   ```

2. **Verify Chrome/Chromium is installed**:
   Puppeteer will download Chromium automatically, or use your system Chrome.

### Running Tests

**Basic Usage** (visible browser):
```bash
HEADLESS=false node scripts/test-tax-reports.js
```

**Headless Mode** (CI/CD):
```bash
node scripts/test-tax-reports.js
```

**Custom Environment**:
```bash
BASE_URL=https://staging.operate.guru \
TEST_EMAIL=test@example.com \
TEST_PASSWORD=yourpassword \
node scripts/test-tax-reports.js
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://operate.guru` | Base URL to test |
| `TEST_EMAIL` | `luk.gber@gmail.com` | Login email |
| `TEST_PASSWORD` | `schlagzeug` | Login password |
| `HEADLESS` | `true` | Run in headless mode |

### Output

After running tests, you'll get:

1. **Console Output**: Real-time test results
2. **test-results.json**: Detailed results in JSON format
3. **test-screenshots/**: Screenshots of each page tested
   - Success: `page-name.png`
   - Failures: `error-page-name.png`

### Example Output

```
=== TAX & REPORTS MODULE TESTING ===

Base URL: https://operate.guru
Headless: false
Timeout: 30000ms

=== AUTHENTICATION ===

Navigating to login page...
Looking for Google OAuth button...
✅ Login successful

=== TAX MODULE TESTS ===

Testing: Tax Dashboard
URL: https://operate.guru/tax
  ✅ PASSED (2341ms)

Testing: Tax Deductions List
URL: https://operate.guru/tax/deductions
  ✅ PASSED (1823ms)

...

=== TEST RESULTS ===

Total: 24
Passed: 22 ✅
Failed: 2 ❌
Skipped: 0 ⏭️
Duration: 124.56s

⚠️  2 issues found

1. Tax Filing Wizard
   Severity: error
   Issue: Expected table element not found

📄 Results saved to: test-results.json
📸 Screenshots saved to: test-screenshots/
```

---

## Manual Testing

### Using the Checklist

1. Open `TAX_REPORTS_TESTING_RESULTS.md`
2. Login to https://operate.guru with `luk.gber@gmail.com`
3. Follow each test case in the checklist
4. Mark checkboxes as you complete tests
5. Record any issues in the "Issues" section

### Manual Testing Process

For each page:

1. **Navigate** to the URL
2. **Verify** all expected elements load
3. **Test** all interactive features
4. **Check** data accuracy and formatting
5. **Inspect** browser console for errors
6. **Test** responsive behavior (mobile/tablet/desktop)
7. **Validate** accessibility (keyboard nav, screen readers)
8. **Mark** test status: ⬜ NOT TESTED | ✅ PASSED | ❌ FAILED

### Common Issues to Look For

- HTTP errors (404, 500)
- JavaScript errors in console
- Missing data or "No data" states
- Incorrect currency formatting (should be €X,XXX.XX)
- Broken links or navigation
- Missing icons or images
- Slow loading (>3 seconds)
- Layout issues on different screen sizes
- Missing accessibility features

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Run Puppeteer tests
        run: node scripts/test-tax-reports.js
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: test-screenshots/

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results.json
```

---

## Test Coverage

### Tax Module (13 pages)
- [x] Tax Dashboard (`/tax`)
- [x] Tax Deductions List (`/tax/deductions`)
- [x] Add Tax Deduction (`/tax/deductions/new`)
- [x] Tax Deduction Detail (`/tax/deductions/[id]`) - Dynamic ID
- [x] Tax Calculators (`/tax/deductions/calculators`)
- [x] Tax Filing Wizard (`/tax/filing`)
- [x] VAT Management (`/tax/vat`)
- [x] UK VAT (`/tax/vat/uk`)
- [x] UK VAT Period Detail (`/tax/vat/uk/[periodKey]`) - Dynamic ID
- [x] German Tax (`/tax/germany`)
- [x] Austrian Tax (`/tax/austria`)
- [x] Tax Reports (`/tax/reports`)
- [x] AI Tax Assistant (`/tax-assistant`)
- [x] Tax Suggestions (`/tax-assistant/suggestions`)
- [x] Tax Deadlines (`/tax-assistant/deadlines`)

### Reports Module (3 pages)
- [x] Reports Dashboard (`/reports`)
- [x] Financial Reports (`/reports/financial`)
- [x] Sales Reports (`/reports/sales`)

### Business Module (8 pages)
- [x] Clients List (`/clients`)
- [x] Client Detail (`/clients/[id]`) - Dynamic ID
- [x] Vendors List (`/vendors`)
- [x] Vendor Detail (`/vendors/[id]`) - Dynamic ID
- [x] Add Vendor (`/vendors/new`)
- [x] Quotes List (`/quotes`)
- [x] Create Quote (`/quotes/new`)
- [x] Quote Detail (`/quotes/[id]`) - Dynamic ID
- [x] CRM Dashboard (`/crm`)
- [x] CRM Contact Detail (`/crm/[id]`) - Dynamic ID

**Total**: 24 pages tested

---

## Custom Checks Available

The automated script includes these built-in checks:

### `checks.hasCurrencyFormat`
Verifies Euro currency formatting (€X,XXX.XX)

### `checks.hasTable`
Checks for table elements on the page

### `checks.hasCards`
Verifies card-based UI components exist

### `checks.hasCharts`
Looks for chart elements (canvas/svg)

### `checks.hasExportButtons`
Verifies export functionality (PDF, CSV, Excel)

### Adding Custom Checks

```javascript
const customCheck = async (page, result) => {
  const hasElement = await page.evaluate(() => {
    return document.querySelector('.my-element') !== null;
  });

  if (!hasElement) {
    throw new Error('My element not found');
  }

  // Add metadata to result
  result.metadata = { customData: 'value' };
};

await testPage(page, {
  name: 'My Page',
  url: `${CONFIG.baseUrl}/my-page`,
  checks: [customCheck]
});
```

---

## Troubleshooting

### Puppeteer Installation Issues

**Error**: `Could not find Chrome`
```bash
# Install Chromium manually
npx puppeteer browsers install chrome
```

**Error**: `Permission denied`
```bash
# On Linux, may need additional dependencies
sudo apt-get install -y chromium-browser
```

### Google OAuth Issues

The automated script requires manual login for Google OAuth. In a CI environment:

1. **Option 1**: Use session cookies
   - Login manually once
   - Save cookies to file
   - Load cookies in test script

2. **Option 2**: Mock authentication
   - Create test user with email/password
   - Skip OAuth flow

3. **Option 3**: Use test account
   - Create dedicated test Google account
   - Automate with credentials

### Test Failures

**Timeout errors**:
- Increase timeout: Set `timeout: 60000` in config
- Check network speed
- Verify site is accessible

**Element not found**:
- Check if page structure changed
- Verify selectors are correct
- Wait for dynamic content to load

**Console errors**:
- Review browser console in headed mode
- Check for API errors
- Verify all dependencies loaded

---

## Best Practices

1. **Run tests before deployments**
2. **Test on multiple browsers** (Chrome, Firefox, Safari)
3. **Test on mobile viewports**
4. **Monitor test execution time**
5. **Keep screenshots for failed tests**
6. **Update tests when UI changes**
7. **Document known issues**
8. **Set up CI/CD integration**

---

## Next Steps

1. [ ] Install Puppeteer: `pnpm add -D puppeteer`
2. [ ] Run automated tests: `HEADLESS=false node scripts/test-tax-reports.js`
3. [ ] Review test results and screenshots
4. [ ] Complete manual testing checklist for detailed UX verification
5. [ ] Fix any issues found
6. [ ] Set up CI/CD integration
7. [ ] Schedule regular test runs

---

## Support

For issues or questions:
- Check console output for error details
- Review screenshots in `test-screenshots/`
- Examine `test-results.json` for detailed info
- Consult `TAX_REPORTS_TESTING_RESULTS.md` for manual testing

---

**Last Updated**: 2025-12-15
**Maintained By**: BROWSER-TAX-REPORTS Agent
