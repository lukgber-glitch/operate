# Operate.guru Dashboard Testing Suite

Automated browser testing for all main dashboard pages using Puppeteer.

## Quick Start

### Option 1: Windows Batch File (Easiest)
```bash
# Double-click or run:
run-test.bat
```

### Option 2: Manual Command
```bash
# Install Puppeteer (first time only)
npm install puppeteer --save-dev

# Run tests
node run-dashboard-test.js
```

## What Gets Tested

The suite tests **15 core pages** on https://operate.guru:

### Dashboard & Core Features
1. `/dashboard` - Main dashboard with widgets
2. `/chat` - AI chat interface
3. `/autopilot` - Autopilot settings
4. `/autopilot/actions` - Autopilot action history

### Productivity Features
5. `/calendar` - Calendar view
6. `/tasks` - Task management
7. `/notifications` - Notification center
8. `/notifications/inbox` - Notification inbox
9. `/search` - Global search

### User Settings
10. `/profile` - User profile
11. `/settings` - Main settings
12. `/settings/profile` - Profile settings
13. `/settings/security` - Security settings
14. `/settings/notifications` - Notification preferences
15. `/settings/billing` - Billing/subscription

## Test Process

### 1. Authentication
- Browser opens automatically (non-headless)
- Navigates to https://operate.guru/login
- **You must log in manually** using Google OAuth
- Credentials: luk.gber@gmail.com / schlagzeug
- Waits 90 seconds for login completion

### 2. Automated Testing
For each page, the script:
- Navigates to the page
- Checks HTTP status
- Verifies content loads
- Checks for error messages
- Validates interactive elements
- Takes a screenshot
- Records metrics

### 3. Results
- Console output shows real-time progress
- `test-results.json` contains detailed results
- `screenshots/` folder has visual evidence

## What's Checked

### Every Page:
- ✓ HTTP status (200 OK)
- ✓ Page renders without errors
- ✓ Content loads (not blank)
- ✓ No error alerts displayed
- ✓ Navigation elements present
- ✓ Interactive elements work
- ✓ Page title is set
- ✓ No perpetual loading states

### Page-Specific:
- **Dashboard**: Widget presence
- **Chat**: Input field exists
- **Calendar**: Calendar component renders
- **Tasks**: List items display
- **Forms**: Form elements present
- **Settings**: Navigation and tabs

## Output Format

### Console Output
```
==============================================
Operate.guru Dashboard Testing Suite
==============================================

[1/15] Testing: Main Dashboard
URL: https://operate.guru/dashboard
  Load time: 1234ms
  ✓ HTTP 200
  ✓ Content loaded (5678 chars)
  Title: "Dashboard | Operate"
  Navigation links: 12
  Enabled buttons: 8
  Widgets: 6
  Screenshot: dashboard.png
  ✓ PASSED

[2/15] Testing: AI Chat
...
```

### test-results.json
```json
{
  "timestamp": "2025-12-15T10:30:00.000Z",
  "summary": {
    "total": 15,
    "passed": 13,
    "failed": 2,
    "skipped": 0
  },
  "issues": [
    {
      "page": "/calendar",
      "component": "Page Load",
      "type": "frontend",
      "severity": "high",
      "description": "Calendar component not found",
      "console_errors": []
    }
  ],
  "pages": [
    {
      "path": "/dashboard",
      "name": "Main Dashboard",
      "status": "passed",
      "errors": [],
      "warnings": [],
      "timestamp": "2025-12-15T10:30:00.000Z",
      "metrics": {
        "loadTime": 1234,
        "httpStatus": 200,
        "title": "Dashboard | Operate",
        "contentLength": 5678,
        "navigationLinks": 12,
        "buttons": 8,
        "widgets": 6
      },
      "screenshot": "C:\\Users\\grube\\op\\operate-fresh\\screenshots\\dashboard.png"
    }
  ]
}
```

## Screenshots

All screenshots saved to `screenshots/` folder:
- `dashboard.png`
- `chat.png`
- `autopilot.png`
- `autopilot-actions.png`
- `calendar.png`
- `tasks.png`
- `notifications.png`
- `notifications-inbox.png`
- `search.png`
- `profile.png`
- `settings.png`
- `settings-profile.png`
- `settings-security.png`
- `settings-notifications.png`
- `settings-billing.png`

## Issue Severity Levels

### Critical
- Page completely fails to load
- HTTP 500 errors
- JavaScript crashes
- **Action**: Fix immediately

### High
- Missing core functionality
- HTTP 404 errors
- Components don't render
- **Action**: Fix before deployment

### Medium
- UI inconsistencies
- Missing data
- Slow performance
- **Action**: Fix in next iteration

### Low
- Minor styling issues
- Missing nice-to-have features
- **Action**: Backlog

## Troubleshooting

### "Cannot find module 'puppeteer'"
```bash
npm install puppeteer --save-dev
```

### Login Timeout
- Increase `LOGIN_WAIT_TIME` in `run-dashboard-test.js`
- Or manually navigate to dashboard after login

### Browser Doesn't Launch
- Check Chrome/Chromium is installed
- Try running with `headless: true` in script
- Check firewall settings

### Screenshots Not Saving
- Ensure write permissions on directory
- Check disk space
- Verify path in script is correct

### Tests Fail on Specific Pages
- Check if page requires specific permissions
- Verify API is running
- Check for backend errors in server logs

## Manual Testing

If automated testing fails, use the manual checklist:
```bash
# Open the manual checklist
MANUAL_TEST_CHECKLIST.md
```

## Continuous Integration

To run in CI/CD:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm install

- name: Run dashboard tests
  run: |
    npm install puppeteer
    node run-dashboard-test.js
  env:
    HEADLESS: true
```

Update script for headless mode:
```javascript
const browser = await puppeteer.launch({
  headless: process.env.HEADLESS === 'true',
  // ...
});
```

## Extending Tests

### Add New Page
Edit `run-dashboard-test.js`:

```javascript
const PAGES = [
  // ... existing pages
  {
    path: '/new-feature',
    name: 'New Feature',
    checks: ['form', 'list', 'widgets']
  }
];
```

### Add Custom Checks
```javascript
// In testPage() function
if (pageConfig.checks.includes('custom-check')) {
  const customElement = await page.evaluate(() => {
    return !!document.querySelector('.custom-element');
  });

  if (!customElement) {
    pageResult.errors.push('Custom element not found');
  }
}
```

## Files in Test Suite

| File | Purpose |
|------|---------|
| `run-dashboard-test.js` | Main test script |
| `run-test.bat` | Windows batch launcher |
| `test-dashboard.js` | Alternative test script |
| `simple-test.js` | Minimal test example |
| `TESTING_README.md` | This file |
| `DASHBOARD_TEST_INSTRUCTIONS.md` | Detailed instructions |
| `MANUAL_TEST_CHECKLIST.md` | Manual testing guide |
| `test-results.json` | Test results (generated) |
| `screenshots/` | Screenshots (generated) |

## Next Steps

After running tests:

1. **Review Results**
   - Check `test-results.json` for summary
   - Review screenshots for visual issues
   - Prioritize failures by severity

2. **File Issues**
   - Critical → PRISM (frontend)
   - API errors → FORGE (backend)
   - Data issues → VAULT (database)
   - Performance → FLUX (DevOps)

3. **Retest**
   - After fixes, run tests again
   - Verify all issues resolved
   - Update documentation

## Support

For questions or issues with the test suite:
- Check troubleshooting section above
- Review Puppeteer docs: https://pptr.dev
- Check console output for specific errors

---

**Last Updated**: 2025-12-15
**Version**: 1.0.0
**Author**: PRISM Agent (Frontend Testing)
