# Currency Selector - Quick Reference Guide

## Components

### MoneyField
Unified money input with currency selector.

```tsx
import { MoneyField } from '@/components/forms';

// Full layout (forms)
<MoneyField
  label="Amount"
  value={amount}
  currency={currency}
  onValueChange={setAmount}
  onCurrencyChange={setCurrency}
  required
  error={errors.amount}
/>

// Compact layout (tables)
<MoneyField
  value={price}
  currency={currency}
  onValueChange={setPrice}
  onCurrencyChange={setCurrency}
  layout="compact"
/>
```

### MoneyFieldController
React Hook Form integration.

```tsx
import { FormProvider, useForm } from 'react-hook-form';
import { MoneyFieldController } from '@/components/forms';

const form = useForm();

<FormProvider {...form}>
  <MoneyFieldController
    name="amount"
    currencyName="currency"
    label="Payment Amount"
    required
    rules={{
      min: { value: 0, message: "Must be positive" }
    }}
  />
</FormProvider>
```

### CurrencyDisplay
Read-only currency display.

```tsx
import { CurrencyDisplay } from '@/components/currency';

<CurrencyDisplay
  amount={1234.56}
  currency="EUR"
  showCode={true}
  compact={false}
/>
```

### CurrencyPicker
Standalone currency selector.

```tsx
import { CurrencyPicker } from '@/components/currency';

<CurrencyPicker
  value={currency}
  onChange={setCurrency}
  placeholder="Select currency..."
/>
```

## Context Usage

### Provider Setup
```tsx
import { CurrencyProvider } from '@/contexts/CurrencyContext';

<CurrencyProvider
  initialDefaultCurrency="EUR"
  initialAvailableCurrencies={['EUR', 'USD', 'GBP']}
>
  <App />
</CurrencyProvider>
```

### Using Context
```tsx
import { useCurrencyContext, useDefaultCurrency } from '@/contexts/CurrencyContext';

// Full context
const {
  defaultCurrency,
  displayCurrency,
  updateDefaultCurrency
} = useCurrencyContext();

// Just default currency (with fallback)
const defaultCurrency = useDefaultCurrency();
```

## Common Patterns

### Form with Money Fields
```tsx
const [amount, setAmount] = useState(0);
const [currency, setCurrency] = useState<CurrencyCode>('EUR');

<MoneyField
  label="Invoice Total"
  value={amount}
  currency={currency}
  onValueChange={setAmount}
  onCurrencyChange={setCurrency}
  required
/>
```

### Table with Currency
```tsx
<TableCell>
  <MoneyField
    value={item.price}
    currency={item.currency}
    onValueChange={(val) => updateItem(item.id, 'price', val)}
    onCurrencyChange={(cur) => updateItem(item.id, 'currency', cur)}
    layout="compact"
  />
</TableCell>
```

### Display Only
```tsx
<div>
  Total: <CurrencyDisplay amount={total} currency={currency} />
</div>
```

## Validation Examples

### Basic Required
```tsx
<MoneyFieldController
  name="amount"
  label="Amount"
  required
/>
```

### Min/Max Value
```tsx
<MoneyFieldController
  name="amount"
  label="Amount"
  rules={{
    min: { value: 0, message: "Must be positive" },
    max: { value: 10000, message: "Cannot exceed 10,000" }
  }}
/>
```

### Custom Validation
```tsx
<MoneyFieldController
  name="amount"
  label="Amount"
  rules={{
    validate: {
      positive: (v) => v > 0 || "Must be positive",
      maxTwoDecimals: (v) =>
        Number.isInteger(v * 100) || "Max 2 decimal places"
    }
  }}
/>
```

## TypeScript Types

```typescript
import type { CurrencyCode } from '@/types/currency';

interface FormData {
  amount: number;
  currency: CurrencyCode;
}

const [formData, setFormData] = useState<FormData>({
  amount: 0,
  currency: 'EUR'
});
```

## Troubleshooting

### Currency not showing
- Ensure CurrencyProvider wraps your app
- Check defaultCurrency is valid CurrencyCode
- Verify imports are correct

### Form validation not working
- Use MoneyFieldController with React Hook Form
- Ensure FormProvider wraps form
- Check rules prop syntax

### Display issues
- Verify amount is a number, not string
- Check currency code is valid (3-letter ISO)
- Ensure CurrencyDisplay has both props

## File Locations

- **Components:** `apps/web/src/components/forms/`
- **Context:** `apps/web/src/contexts/CurrencyContext.tsx`
- **Currency UI:** `apps/web/src/components/currency/`
- **Types:** `apps/web/src/types/currency.ts`
