# Multi-Currency UI Components

Reusable multi-currency components for Operate.

## Components

### CurrencyPicker

Dropdown/combobox for selecting currencies with search and region grouping.

```tsx
import { CurrencyPicker } from '@/components/currency';

<CurrencyPicker
  value={currency}
  onChange={setCurrency}
  placeholder="Select currency..."
  disabled={false}
/>
```

**Props:**
- `value?: CurrencyCode` - Selected currency
- `onChange: (value: CurrencyCode) => void` - Change handler
- `disabled?: boolean` - Disable the picker
- `placeholder?: string` - Placeholder text
- `className?: string` - Additional CSS classes

**Features:**
- Search by code or name
- Grouped by region
- Popular currencies at top
- Keyboard navigation
- Flag emoji for each currency

---

### CurrencyDisplay

Format and display amounts with proper currency formatting.

```tsx
import { CurrencyDisplay } from '@/components/currency';

<CurrencyDisplay
  amount={1234.56}
  currency="USD"
  showSymbol={true}
  compact={false}
  colorNegative={true}
/>
```

**Props:**
- `amount: number` - Amount to display
- `currency: CurrencyCode` - Currency code
- `locale?: string` - Locale for formatting (defaults to currency's locale)
- `compact?: boolean` - Use compact notation (1.2M, 500K)
- `showCode?: boolean` - Show currency code
- `showSymbol?: boolean` - Show currency symbol (default: true)
- `className?: string` - Additional CSS classes
- `colorNegative?: boolean` - Color negative amounts red (default: true)

**Examples:**
- `$1,234.56` (USD, showSymbol)
- `1,234.56 USD` (USD, showCode)
- `$1.2M` (USD, compact)
- `-$500.00` (negative, colored red)

---

### CurrencyInput

Number input with currency formatting and validation.

```tsx
import { CurrencyInput } from '@/components/currency';

<CurrencyInput
  value={amount}
  onChange={setAmount}
  currency="EUR"
  placeholder="Enter amount"
  disabled={false}
/>
```

**Props:**
- `value: number` - Current value
- `onChange: (value: number) => void` - Change handler
- `currency: CurrencyCode` - Currency for formatting
- `disabled?: boolean` - Disable input
- `placeholder?: string` - Placeholder text
- `className?: string` - Additional CSS classes
- `name?: string` - Form field name
- `id?: string` - Input ID

**Features:**
- Auto-formats on blur
- Handles decimal separators per locale
- Currency symbol prefix/suffix based on currency
- Validates decimal places per currency (JPY = 0, EUR = 2)

---

### CurrencyConverter

Two-currency conversion widget with real-time exchange rates.

```tsx
import { CurrencyConverter } from '@/components/currency';

<CurrencyConverter
  defaultFrom="USD"
  defaultTo="EUR"
  onConvert={(from, to, amount, result) => {
    console.log(`${amount} ${from} = ${result} ${to}`);
  }}
/>
```

**Props:**
- `defaultFrom?: CurrencyCode` - Default source currency
- `defaultTo?: CurrencyCode` - Default target currency
- `onConvert?: (from, to, amount, result) => void` - Conversion callback
- `className?: string` - Additional CSS classes

**Features:**
- Real-time conversion
- Swap currencies button
- Shows exchange rate
- Loading states

---

### MultiCurrencyAmount

Display amount in two currencies simultaneously.

```tsx
import { MultiCurrencyAmount } from '@/components/currency';

<MultiCurrencyAmount
  primaryAmount={1000}
  primaryCurrency="USD"
  secondaryAmount={920}
  secondaryCurrency="EUR"
  rate={0.92}
  showTooltip={true}
/>
```

**Props:**
- `primaryAmount: number` - Primary amount
- `primaryCurrency: CurrencyCode` - Primary currency
- `secondaryAmount: number` - Secondary (converted) amount
- `secondaryCurrency: CurrencyCode` - Secondary currency
- `rate?: number` - Exchange rate used (for tooltip)
- `className?: string` - Additional CSS classes
- `showTooltip?: boolean` - Show tooltip with rate (default: true)

**Display:**
```
$1,000.00
€920.00
```

---

### ExchangeRateDisplay

Show exchange rate between two currencies.

```tsx
import { ExchangeRateDisplay } from '@/components/currency';

<ExchangeRateDisplay
  from="USD"
  to="EUR"
  rate={0.92}
  updatedAt={new Date()}
  allowToggleDirection={true}
/>
```

**Props:**
- `from: CurrencyCode` - Source currency
- `to: CurrencyCode` - Target currency
- `rate: number` - Exchange rate
- `updatedAt?: Date | string` - Last update time
- `showInverse?: boolean` - Show inverse rate by default
- `allowToggleDirection?: boolean` - Allow toggling direction
- `className?: string` - Additional CSS classes

**Display:**
```
1 $ = 0.920000 €
USD to EUR
Updated: 12/2/2025, 3:45 PM
```

---

### CurrencyList

Display and manage multiple currencies in a table.

```tsx
import { CurrencyList } from '@/components/currency';

<CurrencyList
  currencies={allCurrencies}
  rates={exchangeRates}
  baseCurrency="USD"
  showRates={true}
  onCurrencyClick={(currency) => console.log(currency)}
/>
```

**Props:**
- `currencies: Currency[]` - List of currencies
- `rates?: ExchangeRate[]` - Exchange rates
- `baseCurrency?: string` - Base currency for rates
- `onCurrencyClick?: (currency) => void` - Click handler
- `className?: string` - Additional CSS classes
- `showRates?: boolean` - Show rate column

**Features:**
- Search/filter currencies
- Sort by code, name, or rate
- Responsive table layout
- Clickable rows

---

## Hooks

### useCurrency

Get currency metadata and formatting utilities.

```tsx
import { useCurrency } from '@/hooks/use-currency';

const { currency, formatAmount, parseAmount, getCurrency, allCurrencies } = useCurrency('USD');

// Format amount
const formatted = formatAmount(1234.56, 'USD', { showSymbol: true });

// Parse formatted string
const amount = parseAmount('$1,234.56', 'USD');

// Get currency metadata
const usd = getCurrency('USD');
```

---

### useExchangeRates

Fetch and cache exchange rates.

```tsx
import { useExchangeRates } from '@/hooks/use-exchange-rates';

const { rates, loading, error, fetchRates, getRate, convertAmount, refresh } = useExchangeRates('USD');

// Get specific rate
const rate = await getRate('USD', 'EUR');

// Convert amount
const converted = await convertAmount(100, 'USD', 'EUR');

// Refresh rates
await refresh();
```

---

### useCurrencyFormat

Locale-aware formatting helpers.

```tsx
import { useCurrencyFormat } from '@/hooks/use-currency-format';

const { format, formatWithSymbol, formatWithCode, formatCompact, parse } = useCurrencyFormat('USD');

// Various formats
const withSymbol = formatWithSymbol(1234.56); // $1,234.56
const withCode = formatWithCode(1234.56); // 1,234.56 USD
const compact = formatCompact(1234567); // $1.2M
```

---

## Types

All types are available in `@/types/currency`:

```tsx
import type {
  Currency,
  CurrencyCode,
  ExchangeRate,
  CurrencyConversion,
  MultiCurrencyAmount,
  CurrencyFormatOptions
} from '@/types/currency';
```

---

## API Client

Currency API functions:

```tsx
import { currencyApi } from '@/lib/currency/currency-api';

// Get all currencies
const currencies = await currencyApi.getCurrencies();

// Get single currency
const usd = await currencyApi.getCurrency('USD');

// Get exchange rate
const rate = await currencyApi.getExchangeRate('USD', 'EUR');

// Get all rates for a base currency
const rates = await currencyApi.getExchangeRates('USD');

// Convert currency
const conversion = await currencyApi.convertCurrency(100, 'USD', 'EUR');

// Batch conversion
const conversions = await currencyApi.convertCurrencyBatch([
  { amount: 100, from: 'USD', to: 'EUR' },
  { amount: 50, from: 'GBP', to: 'USD' },
]);
```

---

## Example Usage

### Invoice with Multi-Currency

```tsx
'use client';

import { useState } from 'react';
import { CurrencyPicker, CurrencyInput, MultiCurrencyAmount } from '@/components/currency';
import { useExchangeRates } from '@/hooks/use-exchange-rates';

export function InvoiceForm() {
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState(0);
  const [baseCurrency] = useState('EUR'); // Company base currency

  const { convertAmount } = useExchangeRates();
  const [convertedAmount, setConvertedAmount] = useState(0);

  // Convert to base currency
  useEffect(() => {
    convertAmount(amount, currency, baseCurrency).then(setConvertedAmount);
  }, [amount, currency, baseCurrency, convertAmount]);

  return (
    <div className="space-y-4">
      <CurrencyPicker value={currency} onChange={setCurrency} />
      <CurrencyInput value={amount} onChange={setAmount} currency={currency} />

      {currency !== baseCurrency && (
        <MultiCurrencyAmount
          primaryAmount={amount}
          primaryCurrency={currency}
          secondaryAmount={convertedAmount}
          secondaryCurrency={baseCurrency}
        />
      )}
    </div>
  );
}
```

### Currency Settings Page

```tsx
'use client';

import { useState, useEffect } from 'react';
import { CurrencyList, CurrencyConverter } from '@/components/currency';
import { getAllCurrencies } from '@/lib/currency/currency-data';
import { useExchangeRates } from '@/hooks/use-exchange-rates';

export function CurrencySettingsPage() {
  const baseCurrency = 'USD';
  const { rates, fetchRates } = useExchangeRates(baseCurrency);
  const allCurrencies = getAllCurrencies();

  return (
    <div className="space-y-8">
      <CurrencyConverter defaultFrom="USD" defaultTo="EUR" />

      <CurrencyList
        currencies={allCurrencies}
        rates={rates}
        baseCurrency={baseCurrency}
        showRates={true}
      />
    </div>
  );
}
```

---

## Accessibility

All components include:
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support
- Semantic HTML

---

## Dark Mode

All components support dark mode via Tailwind CSS classes and shadcn/ui theming.

---

## Responsive Design

Components are mobile-responsive and adapt to different screen sizes.
