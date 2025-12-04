'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CurrencyDisplay } from './CurrencyDisplay';
import type { CurrencyCode } from '@/types/currency';

interface MultiCurrencyAmountProps {
  primaryAmount: number;
  primaryCurrency: CurrencyCode;
  secondaryAmount: number;
  secondaryCurrency: CurrencyCode;
  rate?: number;
  className?: string;
  showTooltip?: boolean;
}

export function MultiCurrencyAmount({
  primaryAmount,
  primaryCurrency,
  secondaryAmount,
  secondaryCurrency,
  rate,
  className,
  showTooltip = true,
}: MultiCurrencyAmountProps) {
  const content = (
    <div className={cn('space-y-0.5', className)}>
      <CurrencyDisplay
        amount={primaryAmount}
        currency={primaryCurrency}
        className="text-base font-semibold"
      />
      <CurrencyDisplay
        amount={secondaryAmount}
        currency={secondaryCurrency}
        className="text-sm text-muted-foreground"
      />
    </div>
  );

  if (!showTooltip || !rate) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{content}</div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <div className="text-xs font-medium">Exchange Rate</div>
            <div className="text-xs text-muted-foreground">
              1 {primaryCurrency} = {rate.toFixed(6)} {secondaryCurrency}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
