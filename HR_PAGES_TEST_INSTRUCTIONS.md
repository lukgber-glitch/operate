# HR Pages Live Testing Instructions

## Overview

Test all HR pages on https://operate.guru to ensure they load correctly, display data, and have no console/API errors.

## Login Credentials

- **Email:** luk.gber@gmail.com
- **Password:** Schlagzeug1@

## Pages to Test

### 1. Employees Page
**URL:** https://operate.guru/hr/employees

**Checks:**
- [ ] Page loads without redirect to /login or /onboarding
- [ ] HTTP 200 response
- [ ] Main content area visible
- [ ] Employee list or empty state displayed
- [ ] "Add Employee" or "New Employee" button present
- [ ] No console errors
- [ ] No API failures

**Expected Elements:**
- Employee table/list/cards
- Search/filter functionality
- Action buttons (Add, Edit, View)
- Employee details (name, email, position, status)

### 2. Payroll Page
**URL:** https://operate.guru/hr/payroll

**Checks:**
- [ ] Page loads successfully
- [ ] HTTP 200 response
- [ ] Payroll dashboard/overview visible
- [ ] "Run Payroll" or "Process Payroll" button visible
- [ ] Payroll history or summary displayed
- [ ] No console errors
- [ ] No API failures

**Expected Elements:**
- Payroll summary cards
- Recent/upcoming payroll runs
- Employee payroll list
- Process payroll controls

### 3. Time Tracking Page
**URL:** https://operate.guru/hr/time

**Checks:**
- [ ] Page loads without errors
- [ ] HTTP 200 response
- [ ] Time tracking interface visible
- [ ] Time entries list displayed
- [ ] "Add Entry" or "Start Timer" button present
- [ ] Timer controls (if applicable)
- [ ] No console errors
- [ ] No API failures

**Expected Elements:**
- Time tracking widget/timer
- Time entries table
- Total hours summary
- Add/edit time entry forms
- Date range selector

### 4. Leave Management Page
**URL:** https://operate.guru/hr/leave

**Checks:**
- [ ] Page loads successfully
- [ ] HTTP 200 response
- [ ] Leave management interface visible
- [ ] "Request Leave" button present
- [ ] Leave requests list or calendar displayed
- [ ] Leave balance cards (if applicable)
- [ ] No console errors
- [ ] No API failures

**Expected Elements:**
- Leave request form/button
- Upcoming/pending leaves list
- Leave balance summary
- Calendar view or timeline
- Approval workflow (if manager)

## Manual Testing Steps

1. Open Chrome browser
2. Navigate to https://operate.guru
3. Login with credentials above
4. For each HR page:
   - Navigate to the URL
   - Open DevTools Console (F12)
   - Check for errors in Console tab
   - Check for failed requests in Network tab
   - Verify all expected elements are visible
   - Take screenshot
   - Note any issues
5. Document findings

## Automated Testing

Run the automated test script:

```bash
# Option 1: Using Chrome debug mode
RUN_HR_TEST.bat

# Option 2: Direct execution
node test-hr-pages-live.js
```

## Common Issues to Watch For

- Authentication redirects
- Empty states (no data vs. loading errors)
- Console errors (React hydration, API failures)
- Missing navigation items
- Broken buttons/forms
- Slow loading times
- CORS errors
- Authorization errors (403/401)

## Reporting

For each page, document:
- **Status:** PASS/FAIL
- **HTTP Status Code**
- **Load Time**
- **Console Errors:** Count and samples
- **API Errors:** Failed requests
- **Missing Elements:** Expected but not found
- **UI Issues:** Visual problems, broken layouts
- **Screenshot:** Filename

## Success Criteria

A page PASSES if:
- HTTP 200 response
- No redirect to login/onboarding
- Main content area renders
- No JavaScript console errors
- No API request failures
- All critical elements present

A page FAILS if:
- HTTP error status (4xx, 5xx)
- Redirected to auth pages
- Console errors present
- API errors present
- Critical elements missing
- Page doesn't load
