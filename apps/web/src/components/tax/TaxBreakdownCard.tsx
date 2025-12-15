'use client';

import React from 'react';
import { Calculator, Info } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { TaxJurisdiction } from '@/hooks/useUSTax';

interface TaxBreakdownCardProps {
  jurisdictions: TaxJurisdiction[];
  totalRate: number;
  sampleAmount?: number;
}

export const TaxBreakdownCard = React.memo(function TaxBreakdownCard({
  jurisdictions,
  totalRate,
  sampleAmount = 100,
}: TaxBreakdownCardProps) {
  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(3)}%`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateTax = (rate: number) => {
    return sampleAmount * rate;
  };

  // Group by jurisdiction type
  const groupedJurisdictions = jurisdictions.reduce((acc, jurisdiction) => {
    if (!acc[jurisdiction.type]) {
      acc[jurisdiction.type] = [];
    }
    acc[jurisdiction.type]!.push(jurisdiction);
    return acc;
  }, {} as Record<string, TaxJurisdiction[]>);

  const typeOrder = ['State', 'County', 'City', 'District'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Tax Breakdown by Jurisdiction
        </CardTitle>
        <CardDescription>
          Detailed breakdown for {formatCurrency(sampleAmount)} sale
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Jurisdiction Groups */}
        <div className="space-y-4">
          {typeOrder.map((type) => {
            const items = groupedJurisdictions[type];
            if (!items || items.length === 0) return null;

            return (
              <div key={type} className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {type} Tax
                </div>
                {items.map((jurisdiction, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{jurisdiction.name}</div>
                      {jurisdiction.jurisdictionCode && (
                        <div className="text-xs text-muted-foreground">
                          Code: {jurisdiction.jurisdictionCode}
                        </div>
                      )}
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className="font-semibold text-sm">
                        {formatPercentage(jurisdiction.rate)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(calculateTax(jurisdiction.rate))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between rounded-lg bg-primary/5 p-4 border border-primary/10">
          <div>
            <div className="font-semibold">Combined Tax Rate</div>
            <div className="text-xs text-muted-foreground">
              Total for all jurisdictions
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {formatPercentage(totalRate)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(calculateTax(totalRate))}
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="flex gap-2 rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-xs text-blue-900 dark:text-blue-100">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            Tax rates are provided by Avalara AvaTax and reflect current jurisdiction
            rates. Rates may vary based on product type, exemptions, and special tax
            districts.
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
