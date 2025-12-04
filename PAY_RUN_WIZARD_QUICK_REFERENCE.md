# Pay Run Wizard - Quick Reference Guide

## Overview
The Pay Run Wizard is a 6-step process for processing payroll through the Gusto integration.

## Routes

### Main Routes
- `/hr/payroll/run` - Start a new pay run
- `/hr/payroll/run/[payrollId]` - Edit an existing payroll

## Wizard Steps

### Step 1: Pay Period Selection
**Component:** `PayPeriodStep.tsx`
**Purpose:** Select which pay period to process
**User Actions:**
- Review available pay periods
- Click to select a period
- View check date and deadline

### Step 2: Employee Selection
**Component:** `EmployeeListStep.tsx`
**Purpose:** Choose employees to include in payroll
**User Actions:**
- Search/filter employees
- Check/uncheck individual employees
- Select all or deselect all
- Review selection count

### Step 3: Hours Entry
**Component:** `HoursEntryStep.tsx`
**Purpose:** Enter hours for hourly employees
**User Actions:**
- Enter hours worked (0-168)
- Use quick fill buttons (40, 80 hrs)
- View real-time gross pay calculations
- Review salaried employees (no input needed)

### Step 4: Additions & Deductions
**Component:** `AdditionsDeductionsStep.tsx`
**Purpose:** Add one-time bonuses, commissions, deductions
**User Actions:**
- Add bonuses/commissions/reimbursements
- Add deductions (loans, advances)
- Specify amounts and descriptions
- Toggle taxable/pre-tax status
- Delete unwanted entries

### Step 5: Tax Preview
**Component:** `TaxPreviewStep.tsx`
**Purpose:** Review calculated taxes before submission
**User Actions:**
- Auto-calculate (or manually trigger)
- Review employee tax breakdown
- Review employer tax contributions
- Verify totals

### Step 6: Review & Approve
**Component:** `ReviewApproveStep.tsx`
**Purpose:** Final review and submission
**User Actions:**
- Review all details
- Confirm check date
- Submit for processing
- View success confirmation

## Key Components

### PayRunWizard.tsx
Main wizard container with:
- Progress bar
- Step indicators
- Navigation controls
- Step validation

### PayrollSummaryCard.tsx
Displays payroll totals:
- Gross pay
- Net pay
- Employee taxes
- Employer taxes
- Additions/deductions

### PayrollEmployeeRow.tsx
Employee line item showing:
- Name and photo
- Job title
- Compensation type
- Hours input (if hourly)
- Gross/net pay

## State Management

### usePayRun() Hook
Main wizard state:
```typescript
const {
  currentStep,
  nextStep,
  prevStep,
  selectedPayPeriod,
  selectedEmployees,
  hoursData,
  additions,
  deductions,
  getTotalGrossPay,
  getTotalNetPay,
} = usePayRun();
```

### usePayroll() Hook
API operations:
```typescript
const { data: payPeriods } = usePayPeriods(companyUuid);
const { data: employees } = usePayrollEmployees(companyUuid);
const createMutation = useCreatePayroll(companyUuid);
const calculateMutation = useCalculatePayroll(payrollUuid);
const submitMutation = useSubmitPayroll(payrollUuid);
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/company/:uuid/pay-periods` | GET | List pay periods |
| `/company/:uuid/pay-periods/current` | GET | Get current period |
| `/company/:uuid/employees` | GET | List employees |
| `/company/:uuid/payrolls` | POST | Create payroll |
| `/payroll/:uuid` | GET | Get payroll details |
| `/payroll/:uuid` | PUT | Update payroll |
| `/payroll/:uuid/calculate` | PUT | Calculate taxes |
| `/payroll/:uuid/submit` | PUT | Submit for processing |

## Data Flow

```
User starts pay run
  ↓
Create draft payroll (API)
  ↓
Select pay period
  ↓
Select employees
  ↓
Enter hours
  ↓
Add adjustments
  ↓
Calculate taxes (API)
  ↓
Review summary
  ↓
Submit payroll (API)
  ↓
Success confirmation
```

## Validation Rules

### Pay Period Step
- Must select a pay period to proceed

### Employee Step
- Must select at least one employee

### Hours Step
- Hourly employees must have hours > 0
- Hours must be between 0-168
- Salaried employees skip this validation

### Additions/Deductions Step
- All fields are optional
- Amounts must be valid numbers > 0

### Tax Preview Step
- Payroll must be calculated

### Review Step
- All previous steps must be complete
- Payroll must be in calculated state

## Error Handling

### API Errors
- Displayed in Alert components
- User can retry operations
- Navigation not blocked

### Validation Errors
- Inline field validation
- Step cannot proceed until valid
- Clear error messages

### Network Errors
- Graceful fallbacks
- Retry mechanisms
- User-friendly messages

## Keyboard Navigation

- Tab through form fields
- Enter to submit forms
- Escape to close dialogs
- Arrow keys in selects

## Mobile Considerations

- Touch-friendly buttons (min 44px)
- Scrollable tables
- Stacked layouts on small screens
- Bottom sheet for forms

## Currency Formatting

All amounts are formatted as USD:
```typescript
formatCurrency(amount) // "$1,234.56"
```

## Date Formatting

Pay periods and dates:
```typescript
formatPayPeriod(period) // "Jan 1 - Jan 15, 2025"
```

## Loading States

- Skeleton loaders for data fetching
- Button spinners during mutations
- Progress indicators for calculations
- Disabled states during processing

## Success/Error States

### Success
- Green checkmark icon
- Success message
- Auto-redirect after 3 seconds

### Error
- Red alert with error message
- Retry button (where applicable)
- No data loss on error

## Accessibility

- ARIA labels on all interactive elements
- Focus management in wizard
- Screen reader announcements
- Keyboard navigation support
- Color contrast compliance

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- No IE11 support

## Performance Tips

- Use React Query caching
- Debounce search inputs
- Virtualize long lists (if needed)
- Lazy load step components
- Optimize re-renders with memo

## Development Tips

### Testing Locally
```bash
# Start dev server
cd apps/web
npm run dev

# Navigate to
http://localhost:3000/hr/payroll/run
```

### Mock API Responses
Use React Query Devtools to inspect cached data

### Debug State
Use Zustand DevTools to inspect wizard state

### Common Issues
1. **Company UUID not set**: Update hardcoded value in pages
2. **API 404**: Check backend is running and endpoints match
3. **State not persisting**: Check Zustand store initialization
4. **Validation not working**: Check `isStepComplete()` logic

## Quick Fixes

### Reset Wizard State
```typescript
const { reset } = usePayRun();
reset(); // Clears all wizard state
```

### Force Recalculation
```typescript
const calculateMutation = useCalculatePayroll(payrollUuid);
calculateMutation.mutate({ version: payroll.version });
```

### Navigate to Step
```typescript
const { goToStep } = usePayRun();
goToStep(3); // Go to step 3
```

## Production Checklist

- [ ] Replace hardcoded company UUID with session data
- [ ] Add unit tests for hooks
- [ ] Add integration tests for wizard flow
- [ ] Set up error tracking (Sentry)
- [ ] Configure API base URL for production
- [ ] Test with real Gusto sandbox account
- [ ] Verify HTTPS for all API calls
- [ ] Add rate limiting on API
- [ ] Test with large employee lists
- [ ] Verify mobile responsive design
- [ ] Test keyboard navigation
- [ ] Verify accessibility with screen reader
- [ ] Load test with concurrent users
- [ ] Set up monitoring/alerts
- [ ] Document for end users
- [ ] Train administrators

## Support & Troubleshooting

### Common User Questions

**Q: Can I edit a payroll after submission?**
A: No, payrolls are locked after submission. Create an off-cycle payroll for corrections.

**Q: What if I made a mistake in hours?**
A: Cancel the payroll (if not submitted) and start over, or contact support.

**Q: When will employees be paid?**
A: On the check date shown in the pay period selection.

**Q: What if an employee is missing?**
A: Sync employees from Gusto first in the employee management section.

### Technical Support

For technical issues:
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check React Query DevTools for failed requests
4. Review Zustand state for corrupted data
5. Contact backend team if Gusto API issues

## Related Documentation

- [Gusto API Documentation](https://docs.gusto.com/embedded-payroll/docs/payrolls)
- [W21-T2 Backend Implementation](./GUSTO_INTEGRATION_DOCS.md)
- [Payroll Types Reference](./apps/web/src/types/payroll.ts)
- [Task Completion Report](./TASK_W21-T4_PAY_RUN_WIZARD_COMPLETION.md)
