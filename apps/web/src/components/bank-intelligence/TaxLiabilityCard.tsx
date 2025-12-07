'use client';

import { format, parseISO } from 'date-fns';
import { FileText, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaxLiability } from './useBankIntelligence';

interface TaxLiabilityCardProps {
  year?: number;
  className?: string;
}

export function TaxLiabilityCard({ year, className }: TaxLiabilityCardProps) {
  const { data: taxSummary, isLoading, isError } = useTaxLiability(year);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPaymentProgress = () => {
    if (!taxSummary) return 0;
    const total = taxSummary.totalOwed;
    if (total === 0) return 100;
    return Math.min(100, (taxSummary.totalPaid / total) * 100);
  };

  const getDaysUntilPayment = () => {
    if (!taxSummary?.nextPaymentDue) return null;
    const now = new Date();
    const dueDate = parseISO(taxSummary.nextPaymentDue);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Tax Status {year || new Date().getFullYear()}
          </CardTitle>
          <CardDescription className="text-destructive">
            Failed to load tax data
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!taxSummary) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Tax Status {year || new Date().getFullYear()}
          </CardTitle>
          <CardDescription>No tax data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const daysUntilPayment = getDaysUntilPayment();
  const progress = getPaymentProgress();
  const remaining = taxSummary.totalOwed - taxSummary.totalPaid;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Tax Status {taxSummary.year}
            </CardTitle>
            <CardDescription>Current year tax estimate</CardDescription>
          </div>
          <Link
            href="/tax"
            className="text-sm text-primary hover:underline"
          >
            Details
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tax Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Income Tax</span>
            <span className="font-semibold">{formatCurrency(taxSummary.incomeTax)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">VAT</span>
            <span className="font-semibold">{formatCurrency(taxSummary.vat)}</span>
          </div>
          {taxSummary.solidaritySurcharge && taxSummary.solidaritySurcharge > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Solidarity Surcharge</span>
              <span className="font-semibold">{formatCurrency(taxSummary.solidaritySurcharge)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payment Progress</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Paid: {formatCurrency(taxSummary.totalPaid)}</span>
            <span>Owed: {formatCurrency(taxSummary.totalOwed)}</span>
          </div>
        </div>

        {/* Remaining Amount */}
        {remaining > 0 && (
          <div className="p-3 rounded-lg bg-muted">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Still to Pay</span>
              <span className="text-xl font-bold">{formatCurrency(remaining)}</span>
            </div>
          </div>
        )}

        {/* Next Payment */}
        {taxSummary.nextPaymentDue && taxSummary.nextPaymentAmount > 0 && (
          <div
            className={`p-3 rounded-lg border ${
              daysUntilPayment && daysUntilPayment <= 7
                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
            }`}
          >
            <div className="flex items-start gap-2">
              {daysUntilPayment && daysUntilPayment <= 7 ? (
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Next Payment Due</span>
                  {daysUntilPayment !== null && (
                    <Badge
                      variant={daysUntilPayment <= 7 ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {daysUntilPayment > 0 ? `${daysUntilPayment} days` : 'Today'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {format(parseISO(taxSummary.nextPaymentDue), 'MMMM dd, yyyy')}
                  </span>
                  <span className="font-bold text-sm">
                    {formatCurrency(taxSummary.nextPaymentAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Badge */}
        {progress >= 100 && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                All tax obligations paid for {taxSummary.year}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
