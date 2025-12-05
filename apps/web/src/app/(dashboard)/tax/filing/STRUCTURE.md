# Tax Filing Module Structure

## File Tree

```
apps/web/src/app/(dashboard)/tax/filing/
├── page.tsx                          # Main page (entry point)
├── README.md                         # Documentation
├── STRUCTURE.md                      # This file
└── components/
    └── tax-filing/
        ├── index.ts                  # Component exports
        ├── TaxFilingWizard.tsx       # Main wizard orchestrator
        ├── PeriodSelector.tsx        # Step 1: Period selection
        ├── VATDataReview.tsx         # Step 2: Data review
        ├── AdditionalDataForm.tsx    # Step 3: Additional data
        ├── VATSummary.tsx            # Step 4: Summary & validation
        └── SubmissionConfirmation.tsx # Step 5: Submit to ELSTER

apps/web/src/hooks/
└── use-tax-filing.ts                 # Tax filing React hook
```

## Component Hierarchy

```
page.tsx
└── TaxFilingWizard
    ├── Progress Indicator (5 steps)
    └── Current Step Content
        ├── Step 1: PeriodSelector
        │   ├── Year selector
        │   ├── Period type (monthly/quarterly)
        │   ├── Month/Quarter selector
        │   └── Previous filings list
        │
        ├── Step 2: VATDataReview
        │   ├── Auto-calculated data display
        │   ├── Editable revenue fields
        │   ├── Input tax fields
        │   └── VAT payable summary
        │
        ├── Step 3: AdditionalDataForm
        │   ├── EU deliveries
        │   ├── EU acquisitions (19% & 7%)
        │   ├── Reverse charge revenue
        │   └── Import VAT
        │
        ├── Step 4: VATSummary
        │   ├── Complete data breakdown
        │   ├── Validation status
        │   ├── Errors/warnings display
        │   └── Final VAT amount
        │
        └── Step 5: SubmissionConfirmation
            ├── Certificate selector
            ├── Test mode toggle
            ├── Confirmation checkbox
            ├── Submit button
            └── Result display
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         TaxFilingWizard                         │
│  (Manages state, orchestrates steps, auto-saves drafts)        │
└─────────────────┬───────────────────────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │   useTaxFiling Hook       │
    │  - calculateVAT()         │
    │  - saveDraft()            │
    │  - validate()             │
    │  - submit()               │
    │  - getFilings()           │
    │  - getCertificates()      │
    └─────────────┬─────────────┘
                  │
    ┌─────────────┴─────────────────────────────────┐
    │         API Endpoints                         │
    │  GET  /api/tax/elster/calculate               │
    │  POST /api/tax/elster/draft                   │
    │  POST /api/tax/elster/validate                │
    │  POST /api/tax/elster/submit                  │
    │  GET  /api/tax/elster/filings                 │
    │  GET  /api/tax/elster/certificates            │
    └───────────────────────────────────────────────┘
```

## State Management

### Wizard State
- `currentStep` - Current wizard step (period | review | additional | summary | submit)
- `selectedPeriod` - Selected tax period
- `periodType` - Monthly or Quarterly
- `vatData` - Complete UStVA data object
- `hasAutoSaved` - Auto-save indicator

### Hook State (useTaxFiling)
- `isLoading` - Loading indicator
- `error` - Error message
- `filings` - Previous filing history
- `currentFiling` - Active filing
- `calculation` - Auto-calculated VAT data
- `validationResult` - Validation errors/warnings
- `certificates` - Available ELSTER certificates

## Props Flow

### TaxFilingWizard → PeriodSelector
```typescript
{
  onSelect: (period: TaxPeriod, periodType: VATFilingPeriod) => void,
  previousFilings?: ElsterFiling[],
  isLoading?: boolean
}
```

### TaxFilingWizard → VATDataReview
```typescript
{
  calculation: VATCalculation,
  onUpdate: (data: Partial<UStVAData>) => void,
  onContinue: () => void,
  onBack: () => void,
  isLoading?: boolean
}
```

### TaxFilingWizard → AdditionalDataForm
```typescript
{
  data: Partial<UStVAData>,
  onUpdate: (data: Partial<UStVAData>) => void,
  onContinue: () => void,
  onBack: () => void,
  isLoading?: boolean
}
```

### TaxFilingWizard → VATSummary
```typescript
{
  data: UStVAData,
  periodType: VATFilingPeriod,
  validationResult: ValidationResult | null,
  onValidate: () => void,
  onContinue: () => void,
  onBack: () => void,
  isLoading?: boolean
}
```

### TaxFilingWizard → SubmissionConfirmation
```typescript
{
  certificates: CertificateInfo[],
  onSubmit: (certificateId: string, testMode: boolean) => Promise<SubmissionResult>,
  onBack: () => void,
  onComplete: (result: SubmissionResult) => void,
  isLoading?: boolean
}
```

## Key Features

### Auto-Save
- Triggers 5 seconds after data changes
- Only saves if on steps 1-4 (not submission)
- Visual badge indicator when saved
- Silent failure (doesn't interrupt user)

### Validation
- Client-side: Required fields, data types
- Server-side: Business rules, ELSTER requirements
- Displayed in Summary step
- Blocks submission if errors exist

### Progress Tracking
- Visual step indicator
- Completed steps marked with checkmark
- Active step highlighted
- Connector lines show progress

### Error Handling
- API errors caught and displayed as toasts
- Validation errors shown inline
- Network failures allow retry
- User-friendly error messages

## Type Definitions

All TypeScript types are defined in:
- `apps/web/src/hooks/use-tax-filing.ts` (Frontend types)
- `apps/api/src/modules/tax/elster/types/elster-vat.types.ts` (Backend types)

Shared types:
- `TaxPeriod`
- `UStVAData`
- `VATCalculation`
- `ElsterFiling`
- `SubmissionResult`
- `ValidationResult`
- `CertificateInfo`

## Styling

Uses Tailwind CSS with shadcn/ui components:
- Card, CardHeader, CardContent for containers
- Button for actions
- Input, Select for form controls
- Alert for messages
- Badge for status indicators
- Progress for loading
- Separator for dividers

## Responsive Design

- Desktop: Full wizard with all details
- Tablet: Condensed step descriptions
- Mobile: Stacked layout, simplified navigation

## Accessibility

- Keyboard navigation supported
- ARIA labels on form controls
- Focus management between steps
- Screen reader friendly
- Color contrast compliant

## Performance

- Lazy loading of certificates (only on submit step)
- Debounced auto-save (5 second delay)
- Optimistic UI updates
- Minimal re-renders with useCallback

## Security

- Certificate-based ELSTER authentication
- HTTPS-only API calls
- No sensitive data in localStorage
- Test mode for safe testing
- User confirmation required for submission
