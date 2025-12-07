# ELSTER VAT Return Wizard

Complete German ELSTER (Elektronische Steuererklärung) VAT filing wizard for Operate.

## Overview

The ELSTER wizard provides a complete, production-ready interface for submitting German VAT returns (Umsatzsteuer-Voranmeldung) through the ELSTER system. It features a multi-step wizard flow with data validation, draft saving, and receipt downloading.

## Components

### Main Components

#### `ELSTERWizard.tsx`
Main wizard component that orchestrates the entire filing flow.

**Props:**
- `organizationId?: string` - Organization ID (optional, will use current org from context)
- `onComplete?: () => void` - Callback when wizard is completed

**Features:**
- Multi-step wizard flow
- Automatic data loading and validation
- Receipt download functionality
- Success confetti animation

#### `PeriodSelector.tsx`
First step - period selection component.

**Features:**
- Monthly or quarterly filing periods
- Year selection (current + 2 previous years)
- Deadline calculation and warnings
- Approaching deadline alerts
- Past deadline warnings

#### `DataReview.tsx`
Second step - data review and validation.

**Features:**
- Summary of output VAT (from invoices)
- Summary of input VAT (from expenses)
- Net VAT calculation
- Expandable transaction lists
- Save as draft functionality
- Transaction drill-down

#### `ConfirmSubmission.tsx`
Third step - final confirmation before submission.

**Features:**
- Validation result display
- Legal confirmations (accuracy, legal implications, irrevocability)
- Summary of amounts
- Warning alerts
- Submission protection (all checkboxes required)

#### `SubmissionStatus.tsx`
Fourth step - submission status and receipt download.

**Features:**
- Real-time status tracking
- Success confetti animation
- Error and warning display
- Receipt download (PDF)
- Auto-refresh for pending/processing status
- Transfer ticket display

#### `StepsProgress.tsx`
Progress indicator for wizard steps.

**Features:**
- Visual step progression
- Completed step indicators
- Current step highlighting
- Responsive design

### Custom Hooks

#### `useELSTER()`
Main hook for wizard state management.

**Returns:**
```typescript
{
  // Step management
  currentStep: number;
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // Period selection
  period: string;
  setPeriod: (period: string) => void;
  periodType: 'monthly' | 'quarterly';
  setPeriodType: (type: 'monthly' | 'quarterly') => void;

  // Data preview
  preview: VatReturnPreview | null;
  isLoadingPreview: boolean;
  loadPreview: () => Promise<void>;

  // Validation
  validateReturn: () => Promise<boolean>;
  validationResult: ValidationResult | null;

  // Submission
  submitReturn: () => Promise<void>;
  submissionResult: ElsterSubmissionResult | null;

  // Status tracking
  submissionStatus: VatReturnStatus | null;
  refreshStatus: () => Promise<void>;

  // Draft handling
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<void>;
  hasDraft: boolean;

  // Reset
  resetWizard: () => void;
}
```

**Features:**
- React Query integration for data fetching
- Automatic draft saving/loading
- Status polling for pending submissions
- Comprehensive error handling
- Toast notifications

## Usage

### Basic Usage

```tsx
import { ELSTERWizard } from '@/components/tax/elster';

export default function GermanTaxPage() {
  return (
    <div>
      <h1>German VAT Filing</h1>
      <ELSTERWizard />
    </div>
  );
}
```

### With Custom Organization

```tsx
import { ELSTERWizard } from '@/components/tax/elster';

export default function GermanTaxPage() {
  const organizationId = 'org-123';

  const handleComplete = () => {
    console.log('Filing completed!');
    // Navigate to tax dashboard or show success message
  };

  return (
    <ELSTERWizard
      organizationId={organizationId}
      onComplete={handleComplete}
    />
  );
}
```

### Using Individual Components

```tsx
import { PeriodSelector, DataReview } from '@/components/tax/elster';
import { useState } from 'react';

export default function CustomTaxFlow() {
  const [period, setPeriod] = useState('');

  const handlePeriodSelect = (selectedPeriod: string, type: 'monthly' | 'quarterly') => {
    setPeriod(selectedPeriod);
    // Load data for the period
  };

  return (
    <PeriodSelector
      onSelect={handlePeriodSelect}
      selectedPeriod={period}
    />
  );
}
```

## API Integration

The wizard integrates with the following backend API endpoints:

### Tax API (`/lib/api/tax.ts`)

```typescript
// Get VAT return preview
taxApi.getVatReturnPreview(organizationId, period)

// Submit VAT return
taxApi.submitVatReturn(submission)

// Get submission status
taxApi.getVatReturnStatus(organizationId, submissionId)

// Download receipt PDF
taxApi.downloadVatReceipt(submissionId)

// Validate return
taxApi.validateVatReturn(submission)

// Draft operations
taxApi.getDraftVatReturn(organizationId, period)
taxApi.saveDraftVatReturn(submission)
taxApi.deleteDraftVatReturn(organizationId, period)
```

## Data Flow

1. **Period Selection** → User selects monthly/quarterly period and year
2. **Load Preview** → System fetches VAT data from invoices and expenses
3. **Review Data** → User reviews output VAT, input VAT, and transactions
4. **Save Draft** (optional) → User can save work in progress
5. **Validate** → System validates submission data
6. **Confirm** → User confirms legal declarations
7. **Submit** → System submits to ELSTER
8. **Track Status** → System polls for submission status
9. **Download Receipt** → User downloads PDF receipt

## Validation Rules

### Pre-submission Validation

- Period must be valid format (YYYY-MM or YYYY-QN)
- Output VAT and Input VAT must be valid numbers
- All transactions must have valid VAT amounts
- Organization must have valid tax ID

### Legal Confirmations

All three checkboxes must be checked before submission:

1. **Accuracy** - Data is correct to the best of knowledge
2. **Legal Implications** - User understands legal consequences
3. **Irrevocability** - User acknowledges submission is final

## Error Handling

### Error Types

- **Network Errors** - Connection issues with ELSTER
- **Validation Errors** - Data doesn't meet ELSTER requirements
- **Authentication Errors** - Invalid or expired ELSTER credentials
- **Timeout Errors** - ELSTER server timeout

### Error Display

- Validation errors shown inline in ConfirmSubmission step
- Submission errors shown in SubmissionStatus step
- Network errors shown via toast notifications
- Retryable errors allow user to try again

## Internationalization

All text is in German (de-DE) for ELSTER compliance:

- Labels and descriptions in German
- Currency formatting: EUR
- Date formatting: dd.MM.yyyy
- Number formatting: German locale

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management through wizard steps
- Screen reader friendly
- High contrast support

## Styling

Uses shadcn/ui components with Tailwind CSS:

- Card-based layout
- Consistent spacing and typography
- Responsive design (mobile-first)
- Dark mode support
- Professional German business aesthetic

## Testing

### Manual Testing Checklist

- [ ] Period selection works for all months/quarters
- [ ] Data loads correctly from backend
- [ ] Validation catches errors
- [ ] Legal confirmations required before submit
- [ ] Submission succeeds and shows transfer ticket
- [ ] Status polling works
- [ ] Receipt download works
- [ ] Draft save/load works
- [ ] Back button navigation works
- [ ] Reset wizard works

### Test Data

See backend ELSTER service tests for mock data examples.

## Dependencies

### Required Packages

- `@tanstack/react-query` - Data fetching and caching
- `@radix-ui/react-*` - UI primitives
- `lucide-react` - Icons
- `date-fns` - Date manipulation
- `canvas-confetti` - Success animation
- `axios` - HTTP client

### UI Components

- Alert
- Badge
- Button
- Card
- Checkbox
- Collapsible
- Label
- Progress
- RadioGroup
- Select
- Separator
- Table
- Tabs
- Toast

## Future Enhancements

- [ ] Support for annual VAT returns
- [ ] Support for corrected returns (Berichtigte UStVA)
- [ ] Multi-language support (English, other EU languages)
- [ ] Bulk submission for multiple periods
- [ ] Export to Excel/CSV
- [ ] Integration with tax advisor portal
- [ ] Email notifications
- [ ] Mobile app version

## Support

For issues or questions:

1. Check backend API logs for errors
2. Verify ELSTER credentials are valid
3. Check network connectivity
4. Contact tax team for ELSTER-specific issues

## License

Proprietary - Operate Platform
