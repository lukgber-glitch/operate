# Quick Test Guide - Finance Pages Verification

## Quick Start (5 minutes)

### 1. Open Browser
Open Chrome/Edge and press F12 to open Developer Tools

### 2. Login
```
URL: http://localhost:3000/login
Email: test@operate.guru
Password: TestPassword123!
Click: Sign In
```

### 3. Test Each Page

#### Invoices
```
URL: http://localhost:3000/finance/invoices
Look for: "Something went wrong" text
Check: Browser console (F12) for red errors
Screenshot: Press F12 > Right-click page > Screenshot > Full page
```

#### Expenses
```
URL: http://localhost:3000/finance/expenses
Look for: "Something went wrong" text
Check: Browser console (F12) for red errors
Screenshot: Press F12 > Right-click page > Screenshot > Full page
```

#### Time
```
URL: http://localhost:3000/time
Look for: "Something went wrong" text
Check: Browser console (F12) for red errors
Screenshot: Press F12 > Right-click page > Screenshot > Full page
```

---

## Quick Report Format

Copy and fill:

```
FINANCE PAGES TEST RESULTS

Invoices Page: [PASS/FAIL]
- Error visible: [YES/NO]
- Screenshot: [filename]
- Notes: [any observations]

Expenses Page: [PASS/FAIL]
- Error visible: [YES/NO]
- Screenshot: [filename]
- Notes: [any observations]

Time Page: [PASS/FAIL]
- Error visible: [YES/NO]
- Screenshot: [filename]
- Notes: [any observations]

Console Errors:
[Copy any red errors from browser console]
```

---

## How to Take Screenshots

### Method 1: Full Page Screenshot (Chrome/Edge)
1. Press F12 (open DevTools)
2. Press Ctrl+Shift+P (Command Palette)
3. Type "screenshot"
4. Select "Capture full size screenshot"
5. Image saves to Downloads

### Method 2: Windows Snipping Tool
1. Press Windows + Shift + S
2. Drag to select area
3. Paste into Paint and save

### Method 3: Chrome Extension
- Use extension like "Full Page Screen Capture"

---

## What to Look For

### PASS Criteria
- Page loads without "Something went wrong"
- Table/list visible (can be empty)
- No red errors in console
- Navigation works

### FAIL Criteria
- "Something went wrong" error shows
- Page blank or broken
- Red errors in console
- Can't navigate to page

---

## Expected Results (Based on Fix)

After the recent fix, all three pages should:
- Load successfully
- Show empty state or data
- No "Something went wrong" error
- No console errors related to response format

---

## Common Issues to Check

1. **If login fails**: Check if API is running
2. **If page redirects to login**: Session may have expired
3. **If console shows CORS errors**: Ignore (local dev issue)
4. **If page loads slow**: Normal for dev server

---

## Quick Checklist

- [ ] Dev server running (localhost:3000)
- [ ] Can access login page
- [ ] Can login successfully
- [ ] Invoices page loads
- [ ] Expenses page loads
- [ ] Time page loads
- [ ] Screenshots captured
- [ ] Console errors noted

---

## Time Estimate

- Login: 30 seconds
- Test 3 pages: 2-3 minutes
- Screenshots: 1-2 minutes
- Report: 1 minute

**Total**: 5-7 minutes

