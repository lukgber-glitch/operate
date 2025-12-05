'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { CurrencyCode, CurrencyFormatOptions } from '@/types/currency';
import { useCurrency } from '@/hooks/use-currency';

interface CurrencyDisplayProps {
  amount: number;
  currency: CurrencyCode;
  locale?: string;
  compact?: boolean;
  showCode?: boolean;
  showSymbol?: boolean;
  className?: string;
  colorNegative?: boolean;
}

export function CurrencyDisplay({
  amount,
  currency,
  locale,
  compact = false,
  showCode = false,
  showSymbol = true,
  className,
  colorNegative = true,
}: CurrencyDisplayProps) {
  const { formatAmount } = useCurrency();

  const formatted = React.useMemo(() => {
    const options: CurrencyFormatOptions = {
      showSymbol,
      showCode,
      locale,
      compact,
    };
    return formatAmount(amount, currency, options);
  }, [amount, currency, locale, compact, showSymbol, showCode, formatAmount]);

  const isNegative = amount < 0;

  return (
    <span
      className={cn(
        'font-medium tabular-nums',
        colorNegative && isNegative && 'text-destructive',
        className
      )}
    >
      {formatted}
    </span>
  );
}
