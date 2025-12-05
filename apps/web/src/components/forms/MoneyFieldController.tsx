'use client';

import * as React from 'react';
import { Controller, useFormContext, FieldValues, FieldPath, ControllerProps } from 'react-hook-form';
import { MoneyField } from './MoneyField';
import type { CurrencyCode } from '@/types/currency';
import { useDefaultCurrency } from '@/contexts/CurrencyContext';

interface MoneyFieldControllerProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>;
  currencyName?: FieldPath<TFieldValues>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  layout?: 'compact' | 'full';
  className?: string;
  placeholder?: string;
  helpText?: string;
  defaultCurrency?: CurrencyCode;
  rules?: ControllerProps<TFieldValues>['rules'];
}

/**
 * MoneyFieldController Component
 *
 * React Hook Form wrapper for MoneyField component.
 * Handles both amount and currency fields with proper validation.
 *
 * @example Basic usage
 * ```tsx
 * <MoneyFieldController
 *   name="amount"
 *   currencyName="currency"
 *   label="Invoice Amount"
 *   required
 * />
 * ```
 *
 * @example With validation rules
 * ```tsx
 * <MoneyFieldController
 *   name="amount"
 *   currencyName="currency"
 *   label="Expense Amount"
 *   required
 *   rules={{
 *     min: { value: 0, message: "Amount must be positive" },
 *     max: { value: 10000, message: "Amount cannot exceed 10,000" }
 *   }}
 * />
 * ```
 *
 * @example With default currency from context
 * ```tsx
 * <MoneyFieldController
 *   name="amount"
 *   currencyName="currency"
 *   label="Payment Amount"
 * />
 * ```
 */
export function MoneyFieldController<TFieldValues extends FieldValues = FieldValues>({
  name,
  currencyName,
  label,
  required = false,
  disabled = false,
  layout = 'full',
  className,
  placeholder,
  helpText,
  defaultCurrency,
  rules,
}: MoneyFieldControllerProps<TFieldValues>) {
  const { control, setValue, watch, formState: { errors } } = useFormContext<TFieldValues>();
  const contextDefaultCurrency = useDefaultCurrency();

  // Get the currency field name (if not provided, use the same field with "Currency" suffix)
  const actualCurrencyName = currencyName || (`${name}Currency` as FieldPath<TFieldValues>);

  // Watch currency value
  const currencyValue = watch(actualCurrencyName) as CurrencyCode | undefined;

  // Initialize currency if not set
  React.useEffect(() => {
    if (!currencyValue) {
      setValue(actualCurrencyName, (defaultCurrency || contextDefaultCurrency) as any);
    }
  }, [currencyValue, actualCurrencyName, defaultCurrency, contextDefaultCurrency, setValue]);

  // Get error message for the amount field
  const error = errors[name]?.message as string | undefined;

  // Combine validation rules
  const validationRules = React.useMemo(() => {
    const baseRules: ControllerProps<TFieldValues>['rules'] = {
      ...rules,
    };

    if (required) {
      baseRules.required = 'This field is required';
    }

    return baseRules;
  }, [required, rules]);

  return (
    <>
      <Controller
        name={name}
        control={control}
        rules={validationRules}
        render={({ field }) => (
          <Controller
            name={actualCurrencyName}
            control={control}
            render={({ field: currencyField }) => (
              <MoneyField
                value={field.value || 0}
                currency={currencyField.value || defaultCurrency || contextDefaultCurrency}
                onValueChange={field.onChange}
                onCurrencyChange={currencyField.onChange}
                label={label}
                error={error}
                disabled={disabled}
                required={required}
                layout={layout}
                className={className}
                placeholder={placeholder}
                helpText={helpText}
                id={name}
                name={name}
              />
            )}
          />
        )}
      />
    </>
  );
}
