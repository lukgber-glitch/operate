# ELSTER Wizard - Quick Start Guide

## Installation

Already installed! Just import and use.

## Basic Usage

```tsx
import { ELSTERWizard } from '@/components/tax/elster';

export default function TaxPage() {
  return <ELSTERWizard />;
}
```

## With Callbacks

```tsx
import { ELSTERWizard } from '@/components/tax/elster';

export default function TaxPage() {
  return (
    <ELSTERWizard
      organizationId="org-123"
      onComplete={() => {
        console.log('Filing complete!');
        router.push('/tax/dashboard');
      }}
    />
  );
}
```

## Using the Hook Directly

```tsx
import { useELSTER } from '@/components/tax/elster';

export default function CustomTaxFlow() {
  const {
    currentStep,
    period,
    setPeriod,
    preview,
    loadPreview,
    submitReturn,
    submissionResult,
  } = useELSTER({
    organizationId: 'org-123',
    onSubmissionComplete: (result) => {
      console.log('Submitted!', result);
    },
  });

  return (
    <div>
      <button onClick={() => setPeriod('2025-01')}>
        Select January 2025
      </button>
      <button onClick={loadPreview}>Load Preview</button>
      <button onClick={submitReturn}>Submit</button>

      {preview && (
        <div>Net VAT: €{preview.netVat}</div>
      )}
    </div>
  );
}
```

## API Client Usage

```tsx
import { taxApi } from '@/lib/api/tax';

// Get preview
const preview = await taxApi.getVatReturnPreview('org-123', '2025-01');

// Submit
const result = await taxApi.submitVatReturn({
  organizationId: 'org-123',
  period: '2025-01',
  periodType: 'monthly',
  outputVat: 1900.00,
  inputVat: 380.00,
  netVat: 1520.00,
  transactions: [...],
});

// Check status
const status = await taxApi.getVatReturnStatus('org-123', 'submission-id');

// Download receipt
const blob = await taxApi.downloadVatReceipt('submission-id');
```

## Styling

All components use shadcn/ui and Tailwind CSS. To customize:

```tsx
// Wrap in your own container
<div className="custom-container">
  <ELSTERWizard />
</div>
```

## Error Handling

Errors are automatically handled via toast notifications. To add custom error handling:

```tsx
import { useELSTER } from '@/components/tax/elster';
import { useToast } from '@/components/ui/use-toast';

export default function CustomFlow() {
  const { toast } = useToast();

  const elster = useELSTER({
    onSubmissionComplete: (result) => {
      if (!result.success) {
        toast({
          title: 'Custom Error',
          description: 'Something went wrong!',
          variant: 'destructive',
        });
      }
    },
  });

  return <div>...</div>;
}
```

## Types

```typescript
import type {
  VatReturnPreview,
  VatReturnSubmission,
  ElsterSubmissionResult,
  VatReturnStatus,
} from '@/types/tax';
```

## Common Patterns

### Show Loading State

```tsx
const { isLoadingPreview } = useELSTER();

return (
  <div>
    {isLoadingPreview ? (
      <Spinner />
    ) : (
      <ELSTERWizard />
    )}
  </div>
);
```

### Conditional Rendering

```tsx
const { currentStep, preview } = useELSTER();

return (
  <div>
    {currentStep === 1 && preview && (
      <div>Net VAT: €{preview.netVat}</div>
    )}
  </div>
);
```

### Draft Handling

```tsx
const { saveDraft, loadDraft, hasDraft } = useELSTER();

return (
  <div>
    {hasDraft && (
      <button onClick={loadDraft}>Load Draft</button>
    )}
    <button onClick={saveDraft}>Save Draft</button>
  </div>
);
```

## Debugging

### Check API Responses

```tsx
const { preview, submissionResult } = useELSTER();

console.log('Preview:', preview);
console.log('Submission:', submissionResult);
```

### Monitor React Query

```tsx
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
console.log(queryClient.getQueryData(['vat-preview', orgId, period]));
```

### Enable React Query Devtools

Already enabled in development mode. Open browser devtools and look for React Query panel.

## Testing

### Test with Mock Data

```tsx
import { render } from '@testing-library/react';
import { ELSTERWizard } from '@/components/tax/elster';

test('renders wizard', () => {
  const { getByText } = render(<ELSTERWizard />);
  expect(getByText('Zeitraum auswählen')).toBeInTheDocument();
});
```

## Troubleshooting

### "Cannot find module '@/components/tax/elster'"

Check your tsconfig.json paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### "useToast is not a function"

Make sure you're importing from the correct path:

```tsx
import { useToast } from '@/components/ui/use-toast';
```

### Confetti not showing

Check that canvas-confetti is installed:

```bash
pnpm list canvas-confetti
```

## Performance Tips

1. **Use React Query caching** - Preview data is cached for 5 minutes
2. **Debounce period selection** - Avoid loading preview on every keystroke
3. **Lazy load components** - Use React.lazy for large wizards
4. **Memoize callbacks** - Use useCallback for event handlers

## Accessibility

- All form fields have labels
- Keyboard navigation works
- Focus management on step changes
- Screen reader announcements
- ARIA attributes on interactive elements

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile Safari: iOS 14+
- Chrome Mobile: Latest

## Resources

- [Full README](./README.md)
- [TypeScript Types](../../../types/tax.ts)
- [Tax API Client](../../../lib/api/tax.ts)
- [Backend ELSTER Service](../../../../api/src/modules/tax/elster/)

## Questions?

Contact the frontend team or check the main README.md for detailed documentation.
