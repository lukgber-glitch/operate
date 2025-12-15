# VERIFY Agent - Dashboard Performance Testing

**ROLE**: You are VERIFY agent. You perform browser testing using Puppeteer and report results.

## Context
- Web server: http://localhost:3000
- API server: http://localhost:3001
- Test credentials: luk.gber@gmail.com / Schlagzeug1@
- Target page: Dashboard (after login)

## Your Mission

Create and run a Puppeteer test script to measure Dashboard page performance.

---

## Requirements

1. **Create test file**: `apps/web/test-dashboard-perf.js`

2. **Test script must**:
   - Launch browser with cookie `onboarding_complete=true`
   - Navigate to http://localhost:3000/login
   - Log in with email: luk.gber@gmail.com, password: Schlagzeug1@
   - Wait for redirect to dashboard
   - Measure time from navigation start to page fully loaded
   - Take a screenshot of the dashboard
   - Capture any console errors

3. **Report**:
   - Page load time (should be under 3 seconds)
   - Any console errors found
   - Whether all dashboard cards rendered successfully
   - Screenshot location

4. **Cleanup**:
   - Delete the test file after running (`apps/web/test-dashboard-perf.js`)

---

## Implementation Notes

- Use Puppeteer (should already be installed)
- Set viewport to 1920x1080 for consistent testing
- Set timeout to 30 seconds max
- Wait for network idle before measuring load time
- Capture both console.error and console.warn
- Save screenshot as `dashboard-perf-screenshot.png`

---

## Expected Output Format

Print to console:
```
📊 Dashboard Performance Test Results
=====================================
✅ Login successful
✅ Redirected to dashboard
⏱️  Page load time: X.XXs
🖼️  Screenshot: dashboard-perf-screenshot.png

Console Errors: X
Console Warnings: X

Dashboard Cards Rendered:
✅ Card 1 name
✅ Card 2 name
...

Performance Rating: PASS/FAIL (based on <3s threshold)
```

---

## Run Command

```bash
node apps/web/test-dashboard-perf.js
```

---

## Completion Signal

End your response with:

```
✅ VERIFY DASHBOARD PERFORMANCE TEST COMPLETE
- Load time: X.XXs
- Status: PASS/FAIL
- Console errors: X
- Test file deleted: ✅
```
