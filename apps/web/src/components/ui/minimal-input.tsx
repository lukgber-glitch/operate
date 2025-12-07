'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface MinimalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  placeholder?: string
  type?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  icon?: React.ReactNode
}

/**
 * MinimalInput - Clean input field for the minimal design system
 *
 * Features:
 * - Minimal border (1px solid)
 * - Rounded corners (12px)
 * - Floating label
 * - Primary color focus ring
 * - Error state support
 * - Optional icon
 *
 * @example
 * <MinimalInput
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={setEmail}
 *   error={emailError}
 * />
 */
export const MinimalInput = React.forwardRef<HTMLInputElement, MinimalInputProps>(
  ({
    label,
    placeholder,
    type = 'text',
    value,
    onChange,
    error,
    icon,
    className,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const hasValue = Boolean(value)
    const shouldFloat = isFocused || hasValue

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value)
    }

    return (
      <div className={cn('relative', className)}>
        {/* Floating Label */}
        {label && (
          <label
            className={cn(
              'absolute start-3 transition-all duration-200 pointer-events-none',
              'text-[var(--color-text-secondary)]',
              shouldFloat
                ? 'top-[-8px] text-xs bg-[var(--color-surface)] px-1'
                : 'top-3 text-base',
              error && 'text-[var(--color-error)]'
            )}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Icon */}
          {icon && (
            <div className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              {icon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            type={type}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFocused ? placeholder : ''}
            className={cn(
              // Base styles
              'w-full rounded-[12px] border bg-[var(--color-surface)]',
              'text-[var(--color-text-primary)] transition-all duration-200',

              // Padding
              label ? 'pt-5 pb-2 px-3' : 'py-3 px-3',
              icon && 'ps-10',

              // Border states
              error
                ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]'
                : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]',

              // Focus state
              'focus:outline-none focus:ring-2 focus:ring-offset-0',

              // Placeholder
              'placeholder:text-[var(--color-text-muted)]',

              // Disabled state
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-background)]'
            )}
            {...props}
          />
        </div>

        {/* Error Message */}
        {error && (
          <p className="mt-1 text-xs text-[var(--color-error)] ps-3">
            {error}
          </p>
        )}
      </div>
    )
  }
)

MinimalInput.displayName = 'MinimalInput'
