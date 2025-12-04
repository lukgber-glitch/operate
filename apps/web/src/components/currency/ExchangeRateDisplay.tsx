'use client';

import * as React from 'react';
import { ArrowRightLeft, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CurrencyCode } from '@/types/currency';
import { getCurrency } from '@/lib/currency/currency-data';

interface ExchangeRateDisplayProps {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  updatedAt?: Date | string;
  showInverse?: boolean;
  allowToggleDirection?: boolean;
  className?: string;
}

export function ExchangeRateDisplay({
  from,
  to,
  rate,
  updatedAt,
  showInverse = false,
  allowToggleDirection = false,
  className,
}: ExchangeRateDisplayProps) {
  const [inverse, setInverse] = React.useState(showInverse);

  const fromCurrency = getCurrency(from);
  const toCurrency = getCurrency(to);

  const displayRate = inverse ? 1 / rate : rate;
  const displayFrom = inverse ? to : from;
  const displayTo = inverse ? from : to;
  const displayFromSymbol = inverse ? toCurrency?.symbol : fromCurrency?.symbol;
  const displayToSymbol = inverse ? fromCurrency?.symbol : toCurrency?.symbol;

  const formattedRate = displayRate.toFixed(6);
  const formattedTime = updatedAt
    ? new Date(updatedAt).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            1 {displayFromSymbol} = {formattedRate} {displayToSymbol}
          </span>
          {allowToggleDirection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInverse(!inverse)}
              className="h-6 w-6 p-0"
              aria-label="Toggle rate direction"
            >
              <ArrowRightLeft className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {displayFrom} to {displayTo}
        </div>
      </div>

      {formattedTime && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formattedTime}</span>
        </div>
      )}
    </div>
  );
}
