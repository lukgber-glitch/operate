# Finance Expenses Page - Manual Test Guide

## Objective
Verify that the /finance/expenses page loads correctly after recent field name mismatch fixes.

## Test Account
- **Email:** luk.gber@gmail.com  
- **Password:** schlagzeug
- **Note:** Requires 2FA completion

## Test Steps

### 1. Login
1. Navigate to https://operate.guru/login
2. Click "Sign in with Google"
3. Enter email: luk.gber@gmail.com
4. Enter password: schlagzeug
5. Complete 2FA verification (phone prompt or SMS code)
6. Verify redirect to dashboard or onboarding

### 2. Navigate to Expenses Page
1. Navigate to: https://operate.guru/finance/expenses
2. Wait for page to fully load (2-3 seconds)

### 3. Verify Page Load
Check the following:
- [ ] Page loads without errors
- [ ] No red error messages or alerts visible
- [ ] Page title shows "Expenses" or similar
- [ ] Expense table or data grid is visible
- [ ] If no data: "No expenses" message shows

### 4. Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Check for errors (red messages)
4. Note: Some warnings are OK, look for actual errors

#### Expected Console Output
- Should NOT see: "Cannot read property X of undefined"
- Should NOT see: "Failed to fetch" or 400/500 errors
- May see: Deprecation warnings (OK)

### 5. Test Data Display
If expenses exist:
- [ ] Expense amount displays correctly
- [ ] Date displays correctly
- [ ] Category/description shows
- [ ] Vendor/merchant name visible

If no expenses:
- [ ] "No expenses found" or similar message
- [ ] Create expense button visible

### 6. Take Screenshots
Capture:
1. Full expenses page view
2. Browser console (if any errors)
3. Network tab (if API errors)

## Previous Issue Fixed

**Problem:** Frontend expected `totalAmount` but API returned `amount`, causing undefined values.

**Fix Applied:** Added response transformation in `apps/web/src/lib/api/finance.ts`:
```typescript
expenses: expenses.map(expense => ({
  ...expense,
  totalAmount: expense.amount,
  amount: expense.amount
}))
```

## Expected Results

### PASS Criteria
- Page loads within 3 seconds
- No console errors related to expenses
- Expense data displays correctly OR "no expenses" message
- No undefined/null values in expense fields

### FAIL Criteria
- Page shows error message
- Console shows errors fetching expenses
- Expense amounts show as "undefined" or "null"
- Page fails to load or times out

## Report Format

```
### Test Results

**Test Date:** [Date/Time]
**Tester:** [Your Name]
**Browser:** [Chrome/Firefox/Safari version]

| Check | Status | Notes |
|-------|--------|-------|
| Page loads | PASS/FAIL | |
| No console errors | PASS/FAIL | |
| Data displays correctly | PASS/FAIL | |
| No undefined values | PASS/FAIL | |

**Console Errors Found:**
[List any errors]

**Screenshots:**
[Attach or reference]

**Conclusion:** 
[PASS/FAIL with summary]
```

## Quick API Test

To verify API directly:
```bash
# After logging in, get your auth cookie and test:
curl -H "Cookie: op_auth=[your-cookie]" \
  https://operate.guru/api/v1/finance/expenses
```

Should return JSON with expenses array containing `amount` field.

---

**Note:** Automated testing is blocked by 2FA requirement on the Google OAuth account. Manual testing is the most reliable approach for now.
