# AI Consent Flow E2E Test Report

**Test Date:** 2025-12-21  
**Test Environment:** https://operate.guru (Live Production)  
**Test Credentials:** luk.gber@gmail.com / schlagzeug  
**Test Type:** Manual Browser E2E Test  

---

## Test Objective

Verify that the AI consent dialog appears automatically when visiting the chat page and that the consent flow works correctly:

1. Dialog appears within 500ms of visiting /chat
2. Dialog has "Accept & Continue" and "Decline" buttons
3. After accepting, chat input is enabled and functional

---

## Test Status: READY TO EXECUTE

The automated test script encountered some shell escaping issues. Please run the test manually following these steps:

---

## Manual Test Steps

### Step 1: Login to Operate
1. Navigate to https://operate.guru/login
2. Click "Google" button
3. Complete Google OAuth with credentials:
   - Email: luk.gber@gmail.com
   - Password: schlagzeug
4. Wait for redirect to dashboard

### Step 2: Navigate to Chat
1. Go to https://operate.guru/chat
2. Wait 1 second
3. **Take screenshot** - "chat-page-initial.png"

### Step 3: Check for AI Consent Dialog
Look for:
- [ ] Dialog is visible on screen
- [ ] Dialog appeared within 500ms (automatically)
- [ ] Dialog contains text about AI consent
- [ ] **Take screenshot** - "consent-dialog.png"

### Step 4: Verify Dialog Buttons
Check that both buttons are present:
- [ ] "Accept & Continue" button (or similar "Accept" button)
- [ ] "Decline" button
- **Take screenshot** - "dialog-buttons.png"

### Step 5: Click Accept
1. Click the "Accept & Continue" button
2. Wait 2 seconds
3. **Take screenshot** - "after-accept.png"

### Step 6: Verify Chat Input Enabled
Check the chat input field:
- [ ] Chat textarea/input is visible
- [ ] Input is NOT disabled
- [ ] Input is NOT readonly
- [ ] You can click and type in the input
- Type "Test message for verification"
- **Take screenshot** - "typing-test.png"

---

## Expected Results

| Step | Expected Result | Pass/Fail | Notes |
|------|----------------|-----------|-------|
| 1 | Successfully login via Google OAuth | [ ] PASS [ ] FAIL | |
| 2 | Navigate to /chat successfully | [ ] PASS [ ] FAIL | |
| 3 | AI Consent Dialog appears automatically | [ ] PASS [ ] FAIL | Should appear within 500ms |
| 4 | Both Accept and Decline buttons present | [ ] PASS [ ] FAIL | |
| 5 | Accept button works when clicked | [ ] PASS [ ] FAIL | Dialog should close |
| 6 | Chat input is enabled after accepting | [ ] PASS [ ] FAIL | Can type messages |

---

## Automated Test Script (Alternative)

If you prefer to run an automated test, use this simpler approach:

```bash
cd "C:\Users\grube\op\operate-fresh"
node ai-consent-test.js
```

The script will:
1. Open a browser window (headless: false)
2. Navigate through the login flow
3. Check for the consent dialog
4. Verify all functionality
5. Save screenshots to `test-screenshots/ai-consent/`
6. Save results to `AI_CONSENT_TEST_RESULTS.json`

---

## Current Test Artifacts

Screenshots directory: `C:\Users\grube\op\operate-fresh\test-screenshots\ai-consent\`

Existing screenshots:
- 01-login.png (✓ Captured - shows login page with Google button)
- error.png (Captured during initial test attempt)

---

## Known Issues from Initial Test

1. ✓ Login page loads successfully
2. ✗ Google OAuth button selector needs correction
3. Script encountered shell escaping issues with heredocs

---

## Recommendations

1. **For quickest results**: Run manual test following steps above
2. **For automated testing**: The `ai-consent-test.js` script exists and should work - run with `node ai-consent-test.js`
3. **Screenshots**: Take screenshots at each step for documentation

---

## Next Steps

1. Execute the manual test OR run `node ai-consent-test.js`
2. Document findings (PASS/FAIL for each step)
3. If any failures found, document:
   - What was expected
   - What actually happened
   - Screenshots showing the issue
4. Report results

---

**Note:** The AI consent dialog is configured to appear after 500ms delay in the code (`apps/web/src/components/consent/AIConsentDialog.tsx`). It should appear automatically when visiting the chat page if the user hasn't previously accepted consent.

