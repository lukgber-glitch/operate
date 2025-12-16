# Quick Start - Dashboard Testing

## One Command to Run Everything

```bash
cd C:\Users\grube\op\operate-fresh
run-test.bat
```

**That's it!** The script will:
1. Install Puppeteer (if needed)
2. Open browser
3. Wait for you to log in
4. Test all 15 pages automatically
5. Save results and screenshots

---

## What to Check After Running

### 1. Console Output
Look for:
- ✓ PASSED (good)
- ✗ FAILED (needs fixing)

### 2. test-results.json
Check:
```json
{
  "summary": {
    "passed": X,
    "failed": Y
  }
}
```

### 3. screenshots/ folder
Visual verification of each page

---

## Common Issues

**"Cannot find module 'puppeteer'"**
```bash
npm install puppeteer --save-dev
```

**Login timeout**
- Log in faster within 90 seconds
- Or increase timeout in script

**Tests fail on specific pages**
- Check screenshots to see what's wrong
- Review console errors
- Check if API is running

---

## Pages Tested (15 total)

1. Dashboard
2. Chat
3. Autopilot
4. Autopilot Actions
5. Calendar
6. Tasks
7. Notifications
8. Notification Inbox
9. Search
10. Profile
11. Settings
12. Profile Settings
13. Security Settings
14. Notification Preferences
15. Billing

---

## Files You Need

- `run-test.bat` - Just double-click this
- `run-dashboard-test.js` - Main test script
- `TESTING_README.md` - Full documentation
- `MANUAL_TEST_CHECKLIST.md` - Manual alternative

---

## Results Format

```json
{
  "summary": { "total": 15, "passed": 13, "failed": 2 },
  "issues": [
    {
      "page": "/calendar",
      "severity": "high",
      "description": "Calendar component not found"
    }
  ]
}
```

---

## Need More Detail?

- **Full guide**: `TESTING_README.md`
- **Manual testing**: `MANUAL_TEST_CHECKLIST.md`
- **Instructions**: `DASHBOARD_TEST_INSTRUCTIONS.md`
- **This delivery**: `TEST_SUITE_SUMMARY.md`

---

**Ready to test? Run:** `run-test.bat`
