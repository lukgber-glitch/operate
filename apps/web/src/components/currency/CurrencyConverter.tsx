'use client';

import * as React from 'react';
import { ArrowRightLeft, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencyPicker } from './CurrencyPicker';
import { CurrencyInput } from './CurrencyInput';
import { CurrencyDisplay } from './CurrencyDisplay';
import type { CurrencyCode } from '@/types/currency';
import { useExchangeRates } from '@/hooks/use-exchange-rates';

interface CurrencyConverterProps {
  defaultFrom?: CurrencyCode;
  defaultTo?: CurrencyCode;
  onConvert?: (from: CurrencyCode, to: CurrencyCode, amount: number, result: number) => void;
  className?: string;
}

export function CurrencyConverter({
  defaultFrom = 'USD',
  defaultTo = 'EUR',
  onConvert,
  className,
}: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = React.useState<CurrencyCode>(defaultFrom);
  const [toCurrency, setToCurrency] = React.useState<CurrencyCode>(defaultTo);
  const [amount, setAmount] = React.useState<number>(100);
  const [convertedAmount, setConvertedAmount] = React.useState<number | null>(null);

  const { getRate, loading } = useExchangeRates();

  const exchangeRate = React.useRef<number | null>(null);

  // Perform conversion
  const performConversion = React.useCallback(async () => {
    if (fromCurrency === toCurrency) {
      setConvertedAmount(amount);
      exchangeRate.current = 1;
      return;
    }

    const rate = await getRate(fromCurrency, toCurrency);
    if (rate) {
      const result = amount * rate.rate;
      setConvertedAmount(result);
      exchangeRate.current = rate.rate;

      if (onConvert) {
        onConvert(fromCurrency, toCurrency, amount, result);
      }
    }
  }, [fromCurrency, toCurrency, amount, getRate, onConvert]);

  // Auto-convert when currencies or amount change
  React.useEffect(() => {
    performConversion();
  }, [performConversion]);

  // Swap currencies
  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Currency Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">From</label>
          <CurrencyPicker value={fromCurrency} onChange={setFromCurrency} />
          <CurrencyInput
            value={amount}
            onChange={setAmount}
            currency={fromCurrency}
            placeholder="Enter amount"
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwap}
            className="rounded-full"
            aria-label="Swap currencies"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* To Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">To</label>
          <CurrencyPicker value={toCurrency} onChange={setToCurrency} />
          <div className="rounded-md border bg-muted/50 px-3 py-2">
            {loading ? (
              <div className="text-sm text-muted-foreground">Converting...</div>
            ) : convertedAmount !== null ? (
              <CurrencyDisplay
                amount={convertedAmount}
                currency={toCurrency}
                className="text-lg"
              />
            ) : (
              <div className="text-sm text-muted-foreground">-</div>
            )}
          </div>
        </div>

        {/* Exchange Rate Info */}
        {exchangeRate.current && (
          <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Exchange Rate:</span>
              <span className="font-medium">
                1 {fromCurrency} = {exchangeRate.current.toFixed(6)} {toCurrency}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
