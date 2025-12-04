# Tax Filing Wizard - German VAT (UStVA)

A comprehensive multi-step wizard for filing German VAT returns (Umsatzsteuervoranmeldung) to ELSTER.

## Overview

This wizard guides users through the complete VAT filing process:

1. **Period Selection** - Choose tax year and period (monthly/quarterly)
2. **Data Review** - Review auto-calculated VAT from invoices
3. **Additional Data** - Enter EU transactions and special cases
4. **Summary & Validation** - Validate complete return
5. **Submission** - Submit to ELSTER with certificate

## Components

### TaxFilingWizard (Main Component)
- **Location**: `components/tax-filing/TaxFilingWizard.tsx`
- **Purpose**: Orchestrates the entire filing flow
- **Features**:
  - Progress tracking with visual steps
  - Auto-save drafts every 5 seconds
  - State management across all steps
  - Automatic data calculation on period selection

### PeriodSelector
- **Purpose**: Select filing period
- **Features**:
  - Year selection (last 5 years)
  - Monthly or quarterly filing
  - Shows previous filing status
  - Validates period before continuing

### VATDataReview
- **Purpose**: Review and edit calculated VAT data
- **Features**:
  - Auto-calculated from invoices
  - Inline editing capability
  - Real-time VAT calculations
  - Shows output VAT and input tax breakdown
  - Displays VAT payable/refundable

### AdditionalDataForm
- **Purpose**: Collect EU and special transaction data
- **Features**:
  - EU deliveries (Kennzahl 41)
  - EU acquisitions at 19% and 7% (Kennzahl 89, 93)
  - Reverse charge revenue (§13b UStG)
  - Import VAT
  - ZM filing reminder for EU transactions

### VATSummary
- **Purpose**: Final review before submission
- **Features**:
  - Complete UStVA breakdown
  - All Kennzahl (field numbers)
  - Automatic validation
  - Error and warning display
  - Final VAT payable/refundable amount

### SubmissionConfirmation
- **Purpose**: Submit to ELSTER
- **Features**:
  - Certificate selection
  - Test mode option
  - Confirmation checkbox
  - Progress indicator during submission
  - Success/failure result display
  - Transfer ticket display

## Data Flow

```
User selects period
    ↓
Calculate VAT from invoices (API: /api/tax/elster/calculate)
    ↓
Review & edit data
    ↓
Add EU/special transactions
    ↓
Validate (API: /api/tax/elster/validate)
    ↓
Save draft (API: /api/tax/elster/draft)
    ↓
Submit (API: /api/tax/elster/submit)
    ↓
Display result & transfer ticket
```

## API Integration

### Endpoints Used

- `GET /api/tax/elster/calculate` - Calculate VAT from invoices
- `GET /api/tax/elster/filings` - Get filing history
- `GET /api/tax/elster/filings/:id` - Get specific filing
- `POST /api/tax/elster/draft` - Save draft
- `POST /api/tax/elster/validate` - Validate UStVA data
- `POST /api/tax/elster/submit` - Submit to ELSTER
- `GET /api/tax/elster/certificates` - Get available certificates
- `GET /api/tax/elster/filings/:id/status` - Check submission status

### Data Structure

See `use-tax-filing.ts` for complete type definitions:

- `UStVAData` - Complete VAT return data
- `VATCalculation` - Auto-calculated amounts
- `ElsterFiling` - Filing record
- `SubmissionResult` - Submission response

## Usage

### Basic Usage

```tsx
import { TaxFilingWizard } from '@/app/(dashboard)/tax/filing/components/tax-filing';

export default function TaxFilingPage() {
  return <TaxFilingWizard />;
}
```

### With Custom Hook

```tsx
import { useTaxFiling } from '@/hooks/use-tax-filing';

function MyComponent() {
  const { calculateVAT, submit, filings } = useTaxFiling();

  // Use methods as needed
}
```

## Features

### Auto-Save
- Drafts are auto-saved every 5 seconds
- Visual indicator shows when draft is saved
- Prevents data loss during long sessions

### Validation
- Client-side validation before submission
- Server-side validation via API
- Displays errors and warnings
- Blocks submission if validation fails

### Security
- Certificate-based authentication
- Encrypted transmission to ELSTER
- Test mode for safe testing
- Confirmation required before submission

### User Experience
- Progress indicator shows current step
- Back/Next navigation
- Responsive design
- Loading states
- Clear error messages
- Success confirmation with transfer ticket

## German Tax Codes (Kennzahl)

Common field numbers (Kennzahl) used:

- **Kennzahl 41** - EU Deliveries (tax-free)
- **Kennzahl 48** - Tax-free revenue with input tax deduction
- **Kennzahl 60** - Reverse charge revenue (§13b)
- **Kennzahl 61** - Input tax from EU acquisitions
- **Kennzahl 62** - Import VAT
- **Kennzahl 66** - Deductible input tax
- **Kennzahl 81** - Domestic revenue @ 19%
- **Kennzahl 86** - Domestic revenue @ 7%
- **Kennzahl 89** - EU acquisitions @ 19%
- **Kennzahl 93** - EU acquisitions @ 7%

## Testing

### Test Mode
Enable test mode to submit to ELSTER test environment:
- Safe for testing without real submission
- No legal implications
- Same validation as production

### Manual Testing Steps
1. Select a period
2. Verify calculated amounts match invoices
3. Add test EU transactions
4. Check validation messages
5. Submit in test mode
6. Verify transfer ticket received

## Error Handling

All errors are handled gracefully:
- Network errors show retry option
- Validation errors show specific fields
- Submission errors display ELSTER response
- Auto-save failures are silent

## Future Enhancements

Potential improvements:
- [ ] PDF export of UStVA
- [ ] Historical filing comparison
- [ ] Auto-fill from previous filings
- [ ] Email confirmation
- [ ] Bulk filing for multiple periods
- [ ] Integration with ZM filing
- [ ] ELSTER response parser improvements

## Dependencies

- React 18
- Next.js 14
- TailwindCSS
- shadcn/ui components
- Custom `useTaxFiling` hook

## Styling

Uses Tailwind utility classes with shadcn/ui component library:
- Consistent spacing and colors
- Responsive design
- Dark mode compatible
- Accessible components

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Related Files

- `/apps/api/src/modules/tax/elster/` - Backend services
- `/apps/web/src/hooks/use-tax-filing.ts` - React hook
- `/apps/web/src/components/ui/` - UI components

## License

Part of Operate/CoachOS - Proprietary
