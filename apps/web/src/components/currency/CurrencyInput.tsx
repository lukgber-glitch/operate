'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { CurrencyCode } from '@/types/currency';
import { useCurrency } from '@/hooks/use-currency';
import { getCurrency } from '@/lib/currency/currency-data';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency: CurrencyCode;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  name?: string;
  id?: string;
}

export function CurrencyInput({
  value,
  onChange,
  currency,
  disabled = false,
  placeholder,
  className,
  name,
  id,
}: CurrencyInputProps) {
  const { formatAmount, parseAmount } = useCurrency();
  const [displayValue, setDisplayValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);

  const currencyData = getCurrency(currency);
  const decimals = currencyData?.decimals ?? 2;
  const symbol = currencyData?.symbol ?? '';
  const symbolPosition = currencyData?.format ?? 'before';

  // Update display value when value changes externally (while not focused)
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value.toFixed(decimals));
    }
  }, [value, decimals, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Allow only numbers, decimal point, and minus sign
    const sanitized = rawValue.replace(/[^\d.,-]/g, '').replace(',', '.');

    setDisplayValue(sanitized);

    // Parse and update parent
    const parsed = parseFloat(sanitized);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else if (sanitized === '' || sanitized === '-') {
      onChange(0);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);

    // Format the value on blur
    const parsed = parseFloat(displayValue);
    if (!isNaN(parsed)) {
      const formatted = parsed.toFixed(decimals);
      setDisplayValue(formatted);
      onChange(parseFloat(formatted));
    } else {
      setDisplayValue('0.00');
      onChange(0);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {symbolPosition === 'before' && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {symbol}
        </span>
      )}
      <Input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder ?? `0.${'0'.repeat(decimals)}`}
        className={cn(
          'tabular-nums',
          symbolPosition === 'before' && 'pl-8',
          symbolPosition === 'after' && 'pr-12'
        )}
        name={name}
        id={id}
        aria-label={`Amount in ${currency}`}
      />
      {symbolPosition === 'after' && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {symbol}
        </span>
      )}
    </div>
  );
}
