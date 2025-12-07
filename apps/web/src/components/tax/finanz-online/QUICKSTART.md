# FinanzOnline Wizard - Quick Start Guide

## For Frontend Developers

### 1. Import and Use the Wizard

```tsx
// In your page component
import { FinanzOnlineWizard } from '@/components/tax/finanz-online';

export default function AustrianTaxPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        Austrian VAT Filing (UVA)
      </h1>
      <FinanzOnlineWizard />
    </div>
  );
}
```

### 2. Use Individual Hooks

```tsx
import { useUvaPreview, useSubmitUva, useVerifyUid } from '@/components/tax/finanz-online';

function MyCustomComponent() {
  const { data: preview, isLoading } = useUvaPreview(orgId, '2025-01');
  const submitMutation = useSubmitUva();
  const verifyMutation = useVerifyUid();

  const handleSubmit = async () => {
    const result = await submitMutation.mutateAsync({
      organizationId: 'org123',
      period: '2025-01',
      periodType: 'monthly',
      uva: {
        kz000: 100000,
        kz022: 100000,
        kz029: 0,
        kz006: 0,
        kz072: 20000,
        kz083: 80000,
      },
    });
    console.log('Submission result:', result);
  };

  return (
    <div>
      {preview && <pre>{JSON.stringify(preview, null, 2)}</pre>}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

### 3. Use the API Client Directly

```tsx
import { finanzOnlineApi } from '@/lib/api/austrian-tax';

async function submitTaxReturn() {
  // Get preview
  const preview = await finanzOnlineApi.getUvaPreview('org123', '2025-01');

  // Verify UID
  const uidResult = await finanzOnlineApi.verifyUid('ATU12345678');

  if (uidResult.valid) {
    // Submit UVA
    const result = await finanzOnlineApi.submitUva({
      organizationId: 'org123',
      period: '2025-01',
      periodType: 'monthly',
      uva: {
        kz000: preview.kennzahlen.kz000,
        kz022: preview.kennzahlen.kz022,
        kz029: preview.kennzahlen.kz029,
        kz006: preview.kennzahlen.kz006,
        kz072: preview.kennzahlen.kz072,
        kz083: preview.kennzahlen.kz083,
      },
    });

    console.log('Reference:', result.referenceNumber);
  }
}
```

## For Backend Developers

### 1. Implement Preview Endpoint

```typescript
// GET /tax/finanz-online/preview
router.get('/preview', async (req, res) => {
  const { organizationId, period } = req.query;

  // Fetch invoices for period
  const invoices = await getInvoices(organizationId, period);

  // Fetch expenses for period
  const expenses = await getExpenses(organizationId, period);

  // Calculate VAT by rate
  const kz022 = invoices
    .filter(i => i.vatRate === 20)
    .reduce((sum, i) => sum + i.netAmount, 0);

  const kz006 = invoices
    .filter(i => i.vatRate === 13)
    .reduce((sum, i) => sum + i.netAmount, 0);

  const kz029 = invoices
    .filter(i => i.vatRate === 10)
    .reduce((sum, i) => sum + i.netAmount, 0);

  const kz000 = kz022 + kz006 + kz029;

  const kz072 = expenses
    .reduce((sum, e) => sum + e.vatAmount, 0);

  const kz083 = (kz022 * 0.20) + (kz006 * 0.13) + (kz029 * 0.10) - kz072;

  // Calculate due date (15th of month + 2 months)
  const dueDate = calculateDueDate(period);

  res.json({
    period,
    periodLabel: formatPeriodLabel(period),
    kennzahlen: { kz000, kz022, kz029, kz006, kz072, kz083 },
    details: {
      outputVat20: {
        invoices: invoices.filter(i => i.vatRate === 20),
        total: kz022 * 0.20
      },
      outputVat13: {
        invoices: invoices.filter(i => i.vatRate === 13),
        total: kz006 * 0.13
      },
      outputVat10: {
        invoices: invoices.filter(i => i.vatRate === 10),
        total: kz029 * 0.10
      },
      inputVat: {
        expenses,
        total: kz072
      },
    },
    netVat: kz083,
    dueDate: dueDate.toISOString(),
  });
});
```

### 2. Implement UID Verification

```typescript
// GET /tax/finanz-online/verify-uid
router.get('/verify-uid', async (req, res) => {
  const { uid } = req.query;

  // Validate format
  if (!/^ATU\d{8}$/.test(uid)) {
    return res.json({
      valid: false,
      uid,
      verifiedAt: new Date().toISOString(),
    });
  }

  // Call Austrian UID registry API
  const result = await austrianUidRegistry.verify(uid);

  res.json({
    valid: result.valid,
    uid,
    name: result.companyName,
    address: result.address,
    verifiedAt: new Date().toISOString(),
  });
});
```

### 3. Implement Submission Endpoint

```typescript
// POST /tax/finanz-online/submit
router.post('/submit', async (req, res) => {
  const { organizationId, period, periodType, uva } = req.body;

  // Get organization credentials
  const org = await getOrganization(organizationId);

  // Build FinanzOnline XML
  const xml = buildUvaXml({
    uid: org.uid,
    period,
    kennzahlen: uva,
  });

  try {
    // Submit to FinanzOnline
    const result = await finanzOnlineClient.submit(xml, {
      certificate: org.certificate,
      privateKey: org.privateKey,
    });

    // Save submission record
    await saveSubmission({
      organizationId,
      period,
      periodType,
      status: 'submitted',
      referenceNumber: result.referenceNumber,
      submittedAt: new Date(),
    });

    res.json({
      success: true,
      referenceNumber: result.referenceNumber,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    res.json({
      success: false,
      timestamp: new Date().toISOString(),
      errors: [{
        code: error.code || 'UNKNOWN',
        message: translateErrorMessage(error.message),
      }],
    });
  }
});
```

### 4. Error Code Mapping

```typescript
function translateErrorMessage(errorCode: string): string {
  const messages = {
    'AUTH-001': 'Ungültige Zugangsdaten',
    'AUTH-002': 'Zertifikat abgelaufen',
    'VAL-001': 'Ungültige UID-Nummer',
    'VAL-002': 'Zeitraum bereits übermittelt',
    'VAL-003': 'Kennzahlen ungültig',
    'SERV-001': 'FinanzOnline derzeit nicht erreichbar',
    'SERV-002': 'Wartungsarbeiten',
  };

  return messages[errorCode] || 'Ein unbekannter Fehler ist aufgetreten';
}
```

## Testing

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PeriodSelector } from './PeriodSelector';

describe('PeriodSelector', () => {
  it('should select monthly period', () => {
    const onSelect = jest.fn();
    render(<PeriodSelector onSelect={onSelect} />);

    // Select year
    fireEvent.click(screen.getByLabelText('Steuerjahr'));
    fireEvent.click(screen.getByText('2025'));

    // Select period type
    fireEvent.click(screen.getByLabelText('Meldezeitraum'));
    fireEvent.click(screen.getByText('Monatlich'));

    // Select month
    fireEvent.click(screen.getByLabelText('Monat'));
    fireEvent.click(screen.getByText('Jänner'));

    // Continue
    fireEvent.click(screen.getByText('Weiter'));

    expect(onSelect).toHaveBeenCalledWith('2025-01', 'monthly');
  });
});
```

### Integration Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUvaPreview } from './hooks/useFinanzOnline';

describe('useUvaPreview', () => {
  it('should fetch preview data', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () => useUvaPreview('org123', '2025-01'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data?.kennzahlen).toHaveProperty('kz000');
  });
});
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=https://api.operate.guru/api/v1
```

## Common Issues

### Issue: "UID verification fails"
**Solution:** Check UID format is exactly ATU + 8 digits

### Issue: "Preview shows zero values"
**Solution:** Ensure invoices have correct VAT rates set (20%, 13%, or 10%)

### Issue: "Submission returns AUTH error"
**Solution:** Check organization has valid FinanzOnline credentials

### Issue: "Toast notifications not showing"
**Solution:** Ensure Toaster component is added to root layout

## Performance Tips

1. **Use React Query caching** - Preview data is cached for 5 minutes
2. **Memoize calculations** - Use useMemo for complex calculations
3. **Lazy load wizard** - Use dynamic imports for wizard component
4. **Debounce UID input** - Add 500ms debounce on UID verification

## Deployment Checklist

- [ ] Backend API endpoints implemented
- [ ] FinanzOnline credentials configured
- [ ] Error messages translated to German
- [ ] SSL certificate for API
- [ ] Rate limiting on API
- [ ] Logging and monitoring
- [ ] Backup submission records
- [ ] Test with real UID numbers
- [ ] Verify VAT calculations
- [ ] Test error scenarios
