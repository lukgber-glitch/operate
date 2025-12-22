# Manual Browser Test Instructions

## Objective
Test the finance pages (invoices, expenses) and time page to verify they load without errors.

## Prerequisites
- Localhost:3000 should be running (Next.js dev server)
- Test account: test@operate.guru / TestPassword123!

## Test Steps

### 1. Login
1. Open browser to http://localhost:3000/login
2. Enter credentials:
   - Email: test@operate.guru
   - Password: TestPassword123!
3. Click "Sign In"
4. Verify successful login (redirects to dashboard)

### 2. Test Invoices Page
1. Navigate to: http://localhost:3000/finance/invoices
2. **Expected**: Page loads successfully
3. **Check for**:
   - No "Something went wrong" error
   - No "Error" messages
   - Table/list displays (even if empty)
4. **Take screenshot** of the page

### 3. Test Expenses Page
1. Navigate to: http://localhost:3000/finance/expenses
2. **Expected**: Page loads successfully
3. **Check for**:
   - No "Something went wrong" error
   - No "Error" messages
   - Table/list displays (even if empty)
4. **Take screenshot** of the page

### 4. Test Time Page
1. Navigate to: http://localhost:3000/time
2. **Expected**: Page loads successfully
3. **Check for**:
   - No "Something went wrong" error
   - No "Error" messages
   - Time tracking interface displays
4. **Take screenshot** of the page

## Report Results

For each page, document:
- ✅ PASS or ❌ FAIL
- Screenshot filename
- Any error messages seen
- Browser console errors (F12 → Console tab)

## Example Report Format

```
### Finance Invoices Page
Status: ✅ PASS
URL: http://localhost:3000/finance/invoices
Screenshot: invoices-page.png
Notes: Page loads correctly, shows empty state

### Finance Expenses Page  
Status: ✅ PASS
URL: http://localhost:3000/finance/expenses
Screenshot: expenses-page.png
Notes: Page loads correctly, shows empty state

### Time Page
Status: ✅ PASS
URL: http://localhost:3000/time
Screenshot: time-page.png
Notes: Page loads correctly, shows time tracking interface
```
