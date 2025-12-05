'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CurrencyInput } from '@/components/currency/CurrencyInput';
import { CurrencyPicker } from '@/components/currency/CurrencyPicker';
import { Label } from '@/components/ui/label';
import type { CurrencyCode } from '@/types/currency';

interface MoneyFieldProps {
  value: number;
  currency: CurrencyCode;
  onValueChange: (value: number) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  layout?: 'compact' | 'full';
  className?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  helpText?: string;
}

/**
 * MoneyField Component
 *
 * Combines CurrencyInput and CurrencyPicker in a single field.
 * Supports both compact layout (for tables) and full layout (for forms).
 *
 * @example Compact layout (for tables)
 * ```tsx
 * <MoneyField
 *   value={100}
 *   currency="EUR"
 *   onValueChange={setValue}
 *   onCurrencyChange={setCurrency}
 *   layout="compact"
 * />
 * ```
 *
 * @example Full layout (for forms)
 * ```tsx
 * <MoneyField
 *   label="Amount"
 *   value={100}
 *   currency="EUR"
 *   onValueChange={setValue}
 *   onCurrencyChange={setCurrency}
 *   layout="full"
 *   error={errors.amount}
 *   required
 * />
 * ```
 */
export function MoneyField({
  value,
  currency,
  onValueChange,
  onCurrencyChange,
  label,
  error,
  disabled = false,
  required = false,
  layout = 'full',
  className,
  id,
  name,
  placeholder,
  helpText,
}: MoneyFieldProps) {
  const fieldId = id || name || 'money-field';

  if (layout === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex-1 min-w-0">
          <CurrencyInput
            value={value}
            onChange={onValueChange}
            currency={currency}
            disabled={disabled}
            placeholder={placeholder}
            id={fieldId}
            name={name}
          />
        </div>
        <div className="w-[120px] shrink-0">
          <CurrencyPicker
            value={currency}
            onChange={onCurrencyChange}
            disabled={disabled}
            className="h-10"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={fieldId} className={cn(error && 'text-destructive')}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr,200px]">
        <div className="flex-1">
          <CurrencyInput
            value={value}
            onChange={onValueChange}
            currency={currency}
            disabled={disabled}
            placeholder={placeholder}
            id={fieldId}
            name={name}
            className={cn(error && 'border-destructive')}
          />
        </div>
        <div>
          <CurrencyPicker
            value={currency}
            onChange={onCurrencyChange}
            disabled={disabled}
          />
        </div>
      </div>

      {helpText && !error && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
