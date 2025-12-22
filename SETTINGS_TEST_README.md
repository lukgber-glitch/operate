# BROWSER-UI Test: Settings & Other Pages

## Test Scope

This test validates the following pages on https://operate.guru:

1. **/settings** - Main Settings
2. **/settings/profile** - User Profile
3. **/settings/company** - Company Settings
4. **/settings/billing** - Billing Settings
5. **/settings/integrations** - Integrations
6. **/clients** - Client List
7. **/vendors** - Vendor List
8. **/documents** - Documents
9. **/tax** - Tax Overview

## How to Run

### Option 1: Using Batch File (Recommended)
```bash
RUN_SETTINGS_TEST.bat
```

### Option 2: Direct Node Command
```bash
node RUN_SETTINGS_TEST.js
```

## Manual Login Required

The test requires manual Google OAuth login:

1. Browser opens to https://operate.guru/login
2. Click "Sign in with Google"
3. Enter email: **luk.gber@gmail.com**
4. Enter password: **schlagzeug**
5. Wait for redirect to dashboard
6. Test automatically continues after login detected

## What the Test Does

For each page, the test:
- Navigates to the page URL
- Checks HTTP status code (should be 200)
- Verifies page content loads (body text > 100 chars)
- Captures page title and URL
- Detects JavaScript errors
- Reports PASS/FAIL status

## Output

### Console Output
- Real-time progress for each page
- PASS/FAIL status with details
- Summary report at the end

### JSON Report
File: `SETTINGS_UI_TEST_RESULTS.json`

Structure:
```json
{
  "timestamp": "2025-12-21T...",
  "loginSuccess": true,
  "pages": {
    "Settings": {
      "path": "/settings",
      "status": "PASS",
      "httpStatus": 200,
      "url": "https://operate.guru/settings",
      "title": "Settings",
      "bodyLen": 1234
    }
  }
}
```

## Interpreting Results

### PASS Criteria
- HTTP Status: 200
- Body content: > 100 characters
- No redirect to login
- No JavaScript errors

### FAIL Reasons
- Page redirects to /login (auth issue)
- HTTP error (404, 500, etc.)
- Timeout loading page
- JavaScript errors on page

## Troubleshooting

### Login Timeout
- Increase wait time from 90s to 120s in script
- Ensure you complete login within time limit

### Page Load Errors
- Check network connection
- Verify https://operate.guru is accessible
- Check for server downtime

### Permission Errors
- Ensure user has access to all tested pages
- Check role permissions on operate.guru

## Files

- `RUN_SETTINGS_TEST.js` - Main test script
- `RUN_SETTINGS_TEST.bat` - Windows batch launcher
- `SETTINGS_UI_TEST_RESULTS.json` - Test results output
- `SETTINGS_TEST_README.md` - This file

## Next Steps

After running the test:

1. Review `SETTINGS_UI_TEST_RESULTS.json`
2. Check any FAIL results
3. Fix issues found
4. Re-run test to verify fixes
5. Generate final report

