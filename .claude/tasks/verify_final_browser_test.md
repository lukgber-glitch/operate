# VERIFY Agent - Final Browser Testing After PRISM Fixes

**ROLE**: You are VERIFY agent. You perform browser testing and report results.

## Context
- Web server: http://localhost:3005
- API server: http://localhost:3001
- PRISM has completed fixes for multiple pages
- Need comprehensive testing of all fixes

## Your Mission

Test 11 pages across 3 categories and create a detailed JSON report.

---

## Test Categories

### 1. Previously Broken Pages (MUST WORK NOW)

**/hr/employees/new**
- ISSUE: Was routing to FAQ page
- EXPECTED: Should show employee creation form
- CHECK: Page loads, correct form displays, dark theme

**/terms**
- ISSUE: Was showing light theme
- EXPECTED: Should show dark theme (navy background)
- CHECK: Navy background, white text, proper contrast

**/login**
- ISSUE: Had TypeScript build error
- EXPECTED: Should load without errors
- CHECK: Page loads, login form works, dark theme

### 2. Accessibility Fixed Pages (Spot Check)

**/login** - Check sr-only labels + ARIA attributes
**/register** - Check sr-only labels + ARIA attributes
**/dashboard** - Check sr-only navigation labels
**/settings** - Check sr-only section labels

### 3. Backend Error Pages (Check Status)

**/chat** - Was timing out, check current status
**/finance/invoices** - Was showing error, check status
**/finance/expenses** - Was showing error, check status

---

## Testing Methodology

For each page:
1. Navigate to URL
2. Wait for page load (max 10s timeout)
3. Check for visible error messages
4. Check dark theme (navy background #0f172a or similar)
5. Check for white/light backgrounds (indicates theme issue)
6. For accessibility pages: inspect HTML for sr-only class
7. Take screenshot if issues found

**Use one of:**
- Puppeteer with Chrome remote debugging (port 9222)
- Direct fetch + HTML parsing
- Playwright
- Any tool that works

---

## Severity Classification

**CRITICAL:**
- Page completely broken/404
- TypeScript build error
- Server timeout
- Wrong page loads (routing issue)

**MAJOR:**
- Wrong theme (light instead of dark)
- Missing accessibility labels
- Visible error messages
- API errors on page

**MINOR:**
- Styling inconsistencies
- Minor contrast issues
- Non-critical warnings

---

## Required Output Format

Save as `VERIFY_FINAL_TEST_REPORT.json`:

```json
{
  "testDate": "ISO timestamp",
  "serverStatus": {
    "web": "http://localhost:3005 - status",
    "api": "http://localhost:3001 - status"
  },
  "testResults": [
    {
      "category": "Previously Broken Pages",
      "pages": [
        {
          "url": "/hr/employees/new",
          "status": "PASS | CONDITIONAL | FAIL",
          "issues": [
            {
              "severity": "CRITICAL | MAJOR | MINOR",
              "description": "issue description",
              "expected": "what should happen",
              "actual": "what actually happened"
            }
          ],
          "screenshot": "path or null",
          "notes": "any additional context"
        }
      ]
    }
  ],
  "summary": {
    "totalPages": 11,
    "passed": 0,
    "conditional": 0,
    "failed": 0,
    "criticalIssues": 0,
    "majorIssues": 0,
    "minorIssues": 0
  },
  "recommendations": [
    "Next steps based on findings"
  ]
}
```

---

## Pass Criteria

- **PASS**: 0 CRITICAL + 0 MAJOR
- **CONDITIONAL**: 0 CRITICAL + 1-2 MAJOR
- **FAIL**: Any CRITICAL OR 3+ MAJOR

---

## Completion Signal

End your response with:

```
✅ VERIFY TESTING COMPLETE
- Tested: X pages
- Status: PASS/CONDITIONAL/FAIL
- Critical issues: X
- Report: VERIFY_FINAL_TEST_REPORT.json
```

---

## Important Notes

- Test EVERY page in the list
- Be thorough but efficient
- Report accurate severity levels
- Save JSON report to project root
- For backend errors, note if they're API issues vs frontend issues
