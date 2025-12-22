# ONBOARDING PAGE FIX - MANUAL TEST INSTRUCTIONS

## Test Goal
Verify that the "TypeError: C.map is not a function" error is GONE from /onboarding page

## Test Date
2025-12-16T11:19:07.492Z

## Steps to Perform

### 1. Open Browser and Navigate to Login
- Open Chrome or Edge browser
- Navigate to: https://operate.guru/login
- Open Developer Tools (F12)
- Go to Console tab

### 2. Login with Google OAuth
- Click "Sign in with Google" button
- Use credentials:
  - Email: luk.gber@gmail.com
  - Password: schlagzeug
- Complete OAuth flow

### 3. Navigate to Onboarding Page
- After successful login, manually navigate to: https://operate.guru/onboarding
- OR use browser address bar to go there directly

### 4. Check for Errors
Look for the following:

**In the Browser Console (DevTools > Console tab):**
- [ ] NO "TypeError: C.map is not a function" error
- [ ] NO ".map is not a function" error of any kind
- [ ] List any other console errors (if any)

**On the Page itself:**
- [ ] NO "Something went wrong!" error message
- [ ] NO error boundary displayed
- [ ] Page loads correctly
- [ ] Onboarding content is visible

### 5. Take Screenshots
Take screenshots of:
1. The /onboarding page loaded successfully
2. The browser console (DevTools Console tab)
3. Any errors if they appear

### 6. Record Results

**Test Status:** PASS / FAIL

**Findings:**
- C.map TypeError present: YES / NO
- Error boundary displayed: YES / NO
- Page loaded successfully: YES / NO
- Other console errors: (list any)

**Console Output:**
(Paste any console errors or warnings)

**Screenshot Files:**
- onboarding-page-loaded.png
- console-tab.png
- (any error screenshots)

---

## Expected Result (PASS)
- NO C.map TypeError
- NO error boundary
- Page loads with onboarding wizard/content
- Minimal or no console errors

## Current Status
The fix was implemented in commit 867a20b:
"fix: Onboarding redirect bug + CoachOS branding cleanup"

This test verifies that fix is working correctly.
