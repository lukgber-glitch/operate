# Quick Test Reference Card

**Login**: https://operate.guru/login
**Email**: luk.gber@gmail.com
**Password**: schlagzeug

---

## Quick Test Commands

```bash
# Manual Testing
code TAX_REPORTS_TESTING_RESULTS.md

# Automated Testing (install first: pnpm add -D puppeteer)
HEADLESS=false node scripts/test-tax-reports.js

# View Results
cat test-results.json
open test-screenshots/
```

---

## Critical Pages to Test First (Priority 1)

### 1. Tax Dashboard
**URL**: https://operate.guru/tax
**Check**: 4 stat cards, deductions table, quick actions

### 2. Reports Dashboard
**URL**: https://operate.guru/reports
**Check**: Export buttons (PDF/CSV/Excel), tabs switch correctly

### 3. Tax Assistant
**URL**: https://operate.guru/tax-assistant
**Check**: Savings card, deadlines, suggestions, "Run Analysis" button

### 4. VAT Management
**URL**: https://operate.guru/tax/vat
**Check**: VAT periods, calculations, UK VAT link

---

## All Test URLs (Copy-Paste Ready)

### Tax Module (15 pages)
```
https://operate.guru/tax
https://operate.guru/tax/deductions
https://operate.guru/tax/deductions/new
https://operate.guru/tax/deductions/calculators
https://operate.guru/tax/filing
https://operate.guru/tax/vat
https://operate.guru/tax/vat/uk
https://operate.guru/tax/germany
https://operate.guru/tax/austria
https://operate.guru/tax/reports
https://operate.guru/tax-assistant
https://operate.guru/tax-assistant/suggestions
https://operate.guru/tax-assistant/deadlines
```

### Reports Module (3 pages)
```
https://operate.guru/reports
https://operate.guru/reports/financial
https://operate.guru/reports/sales
```

### Business Module (8 pages)
```
https://operate.guru/clients
https://operate.guru/vendors
https://operate.guru/vendors/new
https://operate.guru/quotes
https://operate.guru/quotes/new
https://operate.guru/crm
```

---

## Quick Checklist (For Each Page)

- [ ] Page loads (no 404/500 errors)
- [ ] No console errors (F12 → Console)
- [ ] Data displays correctly
- [ ] Currency formatted as €X,XXX.XX
- [ ] Buttons/links work
- [ ] Forms submit successfully
- [ ] Loading states visible
- [ ] Responsive on mobile (F12 → Toggle device)

---

## Common Issues to Look For

| Issue | Check |
|-------|-------|
| HTTP Errors | Network tab shows 200 OK |
| Console Errors | Console tab is clean |
| Missing Data | "No data" vs actual data |
| Currency Format | €1,234.56 not $1,234.56 |
| Broken Links | All navigation works |
| Slow Loading | Page loads < 3 seconds |
| Mobile Layout | No horizontal scroll |

---

## Test Results Format

```json
{
  "summary": {
    "total": 26,
    "passed": X,
    "failed": Y
  },
  "issues": [
    {
      "page": "Tax Dashboard",
      "severity": "high/medium/low",
      "issue": "Description"
    }
  ]
}
```

---

## Testing Tools

**Browser DevTools** (F12):
- Console: Check for errors
- Network: Check API calls (200 OK)
- Performance: Check load times
- Mobile: Toggle device toolbar

**Lighthouse** (Chrome):
- Performance score
- Accessibility score
- SEO score

**Manual Testing**:
1. Open page
2. Interact with all elements
3. Check data accuracy
4. Test responsive design
5. Document any issues

---

## File Locations

| File | Purpose |
|------|---------|
| `TAX_REPORTS_TESTING_RESULTS.md` | Full manual checklist |
| `scripts/test-tax-reports.js` | Automated script |
| `scripts/README-TESTING.md` | Detailed guide |
| `TESTING_SUMMARY.md` | Overview & analysis |
| `QUICK_TEST_REFERENCE.md` | This card |

---

## Expected Component Behavior

### Tax Dashboard (`/tax`)
- **Stat Cards**: Show €amounts with 2 decimals
- **Deadlines**: Show next 3 deadlines
- **Deductions**: Table with last 4 deductions
- **Quick Actions**: 4 clickable cards

### Reports (`/reports`)
- **Tabs**: Financial, Tax, Clients, Documents
- **Date Picker**: Q1-Q4 2024, YTD, 2023
- **Export**: PDF, CSV, Excel, Print buttons
- **Charts**: Render without errors

### Tax Assistant (`/tax-assistant`)
- **Savings Card**: Shows total potential savings
- **Deadlines**: Shows urgent (≤7 days) alerts
- **Suggestions**: Lists HIGH/MEDIUM priority
- **Run Analysis**: Button triggers AI analysis

---

## Browser Compatibility

Test on:
- Chrome (latest) ← Primary
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Screen sizes:
- Mobile: 375px
- Tablet: 768px
- Desktop: 1920px

---

## Success = All Green

```
✅ All pages load
✅ No console errors
✅ Data displays correctly
✅ Navigation works
✅ Forms submit
✅ Exports work
✅ Mobile responsive
✅ Accessibility OK
```

---

**Quick Start**:
1. Open https://operate.guru/login
2. Login with Google (luk.gber@gmail.com)
3. Visit each URL above
4. Mark checkboxes in `TAX_REPORTS_TESTING_RESULTS.md`
5. Report issues

**Estimated Time**: 30-45 minutes for full manual testing

---

Last Updated: 2025-12-15
