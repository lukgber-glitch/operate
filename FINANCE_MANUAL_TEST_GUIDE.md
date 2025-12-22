# BROWSER-FINANCE Manual Test Guide

## Test Date: 2025-12-21
## Tester: Follow this guide to test finance pages

---

## Pre-Test Setup

1. Open browser (Chrome/Edge recommended)
2. Navigate to: https://operate.guru/login
3. Login using Google OAuth with: luk.gber@gmail.com
4. Ensure you reach the dashboard successfully

---

## Finance Pages Test Checklist

### 1. Invoices List Page
- **URL**: https://operate.guru/finance/invoices
- **Expected**: List of invoices (or empty state if no invoices)

**Check:**
- [ ] Page loads without errors
- [ ] No 404 or "Page Not Found" message
- [ ] Header/navigation visible
- [ ] Main content area present
- [ ] Open browser console (F12) - check for errors

**Notes:**
```
Status: ___________
Load Time: ________ ms
Console Errors: Yes / No
Screenshot: [ ]
```

---

### 2. New Invoice Form
- **URL**: https://operate.guru/finance/invoices/new
- **Expected**: Form to create new invoice

**Check:**
- [ ] Page loads without errors
- [ ] Form fields visible (customer, items, amounts, etc.)
- [ ] No 404 message
- [ ] Console errors check

**Notes:**
```
Status: ___________
Form Fields Present: Yes / No
Console Errors: Yes / No
Screenshot: [ ]
```

---

### 3. Expenses List Page
- **URL**: https://operate.guru/finance/expenses
- **Expected**: List of expenses (or empty state)

**Check:**
- [ ] Page loads without errors
- [ ] No 404 message
- [ ] List or empty state visible
- [ ] Console errors check

**Notes:**
```
Status: ___________
Content Visible: Yes / No
Console Errors: Yes / No
Screenshot: [ ]
```

---

### 4. New Expense Form
- **URL**: https://operate.guru/finance/expenses/new
- **Expected**: Form to create new expense

**Check:**
- [ ] Page loads without errors
- [ ] Form fields visible
- [ ] No 404 message
- [ ] Console errors check

**Notes:**
```
Status: ___________
Form Fields Present: Yes / No
Console Errors: Yes / No
Screenshot: [ ]
```

---

### 5. Banking Overview
- **URL**: https://operate.guru/finance/banking
- **Expected**: Bank accounts overview

**Check:**
- [ ] Page loads without errors
- [ ] Bank accounts listed (or setup prompt)
- [ ] No 404 message
- [ ] Console errors check

**Notes:**
```
Status: ___________
Content Visible: Yes / No
Console Errors: Yes / No
Screenshot: [ ]
```

---

### 6. Transactions List
- **URL**: https://operate.guru/finance/transactions
- **Expected**: List of financial transactions

**Check:**
- [ ] Page loads without errors
- [ ] Transactions list visible (or empty state)
- [ ] No 404 message
- [ ] Console errors check

**Notes:**
```
Status: ___________
Content Visible: Yes / No
Console Errors: Yes / No
Screenshot: [ ]
```

---

### 7. Financial Reports
- **URL**: https://operate.guru/finance/reports
- **Expected**: Financial reports page

**Check:**
- [ ] Page loads without errors
- [ ] Reports interface visible
- [ ] No 404 message
- [ ] Console errors check

**Notes:**
```
Status: ___________
Content Visible: Yes / No
Console Errors: Yes / No
Screenshot: [ ]
```

---

## Summary Report

**Total Pages Tested**: 7

**Results:**
- Passed: _____
- Failed: _____
- Warnings: _____

**Common Issues Found:**
```
1. 
2. 
3. 
```

**Console Errors Summary:**
```
Pages with errors:
- 
- 
```

**Recommendations:**
```
1. 
2. 
3. 
```

---

## How to Check for Console Errors

1. Press F12 to open Developer Tools
2. Click on "Console" tab
3. Look for red text (errors)
4. Note any errors related to the page
5. Ignore minor warnings (yellow) unless they affect functionality

---

## What Counts as PASS vs FAIL

**PASS:**
- Page loads successfully
- Main content visible
- No 404 or critical error messages
- Minor console warnings acceptable

**FAIL:**
- 404 Not Found
- "Error Occurred" or similar message
- Page doesn't load
- Critical JavaScript errors preventing functionality

**WARN:**
- Page loads but has console errors
- Some functionality may be affected
- Partial content load
