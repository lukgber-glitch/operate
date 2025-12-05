'use client';

import { DollarSign, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TaxRateResponse } from '@/hooks/useUSTax';

interface TaxRateDisplayProps {
  taxRate?: TaxRateResponse;
  isLoading?: boolean;
  showBreakdown?: boolean;
}

export function TaxRateDisplay({
  taxRate,
  isLoading = false,
  showBreakdown = true,
}: TaxRateDisplayProps) {
  if (isLoading) {
    return <TaxRateDisplaySkeleton />;
  }

  if (!taxRate) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Select a jurisdiction to view tax rates
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Tax Rate Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Rate */}
        <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Combined Tax Rate
            </span>
            <span className="text-2xl font-bold text-primary">
              {formatPercentage(taxRate.totalRate)}
            </span>
          </div>
        </div>

        {/* Tax Calculation Preview */}
        <div className="grid gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxable Amount</span>
            <span className="font-medium">{formatCurrency(taxRate.taxableAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Tax</span>
            <span className="font-semibold text-primary">
              {formatCurrency(taxRate.totalTax)}
            </span>
          </div>
        </div>

        {/* Jurisdiction Breakdown */}
        {showBreakdown && taxRate.jurisdictions && taxRate.jurisdictions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Jurisdiction Breakdown</h4>
            <div className="space-y-2">
              {taxRate.jurisdictions.map((jurisdiction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{jurisdiction.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {jurisdiction.type}
                      {jurisdiction.jurisdictionCode &&
                        ` • Code: ${jurisdiction.jurisdictionCode}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatPercentage(jurisdiction.rate)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Address Info */}
        {taxRate.address && (
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <div className="font-medium mb-1">Tax Jurisdiction Address:</div>
            <div>
              {taxRate.address.line1}
              {taxRate.address.line2 && `, ${taxRate.address.line2}`}
            </div>
            <div>
              {taxRate.address.city}, {taxRate.address.state}{' '}
              {taxRate.address.postalCode}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TaxRateDisplaySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
