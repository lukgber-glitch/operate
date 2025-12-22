# ONBOARDING PAGE TEST - READY TO RUN

## Quick Start

### Option 1: Automated Test (Recommended)
```bash
# Windows
RUN_ONBOARDING_TEST.bat

# Or directly:
node test-onboarding-fix.js
```

**What happens:**
1. Browser opens (non-headless)
2. Goes to operate.guru/login
3. YOU manually click Google + login
4. Script waits 60 seconds for login
5. Automatically tests /onboarding page
6. Checks for C.map TypeError
7. Generates report + screenshots

**Output files:**
- `ONBOARDING_FIX_TEST_RESULTS.json` - Full test results
- `test-screenshots/onboarding-01-login.png`
- `test-screenshots/onboarding-02-after-login.png`
- `test-screenshots/onboarding-03-page.png`

---

### Option 2: Manual Test
Follow: `ONBOARDING_TEST_MANUAL_INSTRUCTIONS.md`

1. Open browser + DevTools (F12)
2. Go to https://operate.guru/login
3. Login with Google OAuth
4. Navigate to https://operate.guru/onboarding
5. Check console for errors
6. Take screenshots

---

## What We're Testing

### THE BUG (Fixed in 867a20b):
```
TypeError: C.map is not a function
```

This was caused by `Organisation.onboardingCompleted` not being set,
causing infinite redirects and breaking the onboarding page.

### THE FIX:
Added 8 lines to `onboarding.service.ts` to properly set the 
`onboardingCompleted` flag when users finish onboarding.

### VERIFICATION:
- NO "C.map is not a function" error
- NO error boundary on page
- Page loads successfully
- Onboarding wizard displays

---

## Test Credentials

**Google OAuth:**
- Email: luk.gber@gmail.com
- Password: schlagzeug

---

## Expected Results

### PASS Criteria:
✓ Page loads without errors
✓ No C.map TypeError in console
✓ No error boundary displayed
✓ Onboarding wizard visible
✓ Can interact with form

### FAIL Criteria:
✗ "C.map is not a function" in console
✗ Error boundary: "Something went wrong!"
✗ Page crash or blank screen
✗ Cannot load /onboarding page

---

## Files Created

| File | Purpose |
|------|---------|
| `test-onboarding-fix.js` | Automated Puppeteer test |
| `RUN_ONBOARDING_TEST.bat` | Easy Windows launcher |
| `ONBOARDING_FIX_VERIFICATION_PLAN.md` | Full test plan |
| `ONBOARDING_TEST_MANUAL_INSTRUCTIONS.md` | Manual test steps |
| This file | Quick reference |

---

## Troubleshooting

### Browser doesn't open:
```bash
npm install puppeteer
```

### Login timeout:
You have 60 seconds to complete Google OAuth.
If too slow, just run the script again.

### Test hangs:
Press Ctrl+C to stop.
Browser will stay open for inspection.

### Need to check results:
```bash
# View JSON results
cat ONBOARDING_FIX_TEST_RESULTS.json

# View screenshots
explorer test-screenshots
```

---

## After Testing

### If PASS:
1. Update issue/ticket as "Verified"
2. Proceed with deployment
3. Close related bugs

### If FAIL:
1. Copy console errors
2. Attach screenshots
3. Report to dev team with:
   - Error message
   - Screenshots
   - Steps to reproduce

---

**Ready to test!** Run: `RUN_ONBOARDING_TEST.bat`

Generated: 2025-12-16T11:21:05.428Z
