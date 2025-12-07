'use client';

import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Settings, HelpCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CashFlowChart } from './CashFlowChart';
import { RecurringExpensesList } from './RecurringExpensesList';
import { TaxLiabilityCard } from './TaxLiabilityCard';
import { TransactionClassificationTable } from './TransactionClassificationTable';
import { InvoiceMatchingWidget } from './InvoiceMatchingWidget';
import { BillMatchingWidget } from './BillMatchingWidget';
import { BankIntelligenceAlerts } from './BankIntelligenceAlerts';
import {
  useBankIntelligenceSummary,
  useCashFlowForecast,
  useBankAlerts,
} from './useBankIntelligence';
import { useQueryClient } from '@tanstack/react-query';

interface BankIntelligenceDashboardProps {
  className?: string;
}

export function BankIntelligenceDashboard({ className }: BankIntelligenceDashboardProps) {
  const queryClient = useQueryClient();
  const [forecastDays, setForecastDays] = useState(30);

  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useBankIntelligenceSummary();
  const { data: cashFlow, isLoading: cashFlowLoading } = useCashFlowForecast(forecastDays);
  const { data: alerts } = useBankAlerts();

  const formatCurrency = (value: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['bank-intelligence'] });
  };

  const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;
  const warningAlerts = alerts?.filter(a => a.severity === 'warning').length || 0;
  const totalAlerts = criticalAlerts + warningAlerts;

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Bank Intelligence</h1>
            <p className="text-muted-foreground">
              AI-powered insights for your business finances
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              asChild
            >
              <Link href="/bank-intelligence/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              asChild
            >
              <Link href="/help/bank-intelligence">
                <HelpCircle className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Top Row: Balance Overview & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Current Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              Current Balance
            </CardTitle>
            <CardDescription>Combined account balance</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : summaryError || !summary ? (
              <div className="text-sm text-destructive">Failed to load balance</div>
            ) : (
              <div className="space-y-2">
                <div className="text-3xl font-bold">
                  {formatCurrency(summary.currentBalance, summary.currency)}
                </div>
                <div className="flex items-center gap-2">
                  {summary.balanceChange >= 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        +{formatCurrency(summary.balanceChange, summary.currency)}
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600 font-medium">
                        {formatCurrency(summary.balanceChange, summary.currency)}
                      </span>
                    </>
                  )}
                  <span className="text-sm text-muted-foreground">this week</span>
                </div>
                {summary.balanceChangePercent !== undefined && (
                  <Badge
                    variant={summary.balanceChangePercent >= 0 ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {summary.balanceChangePercent >= 0 ? '+' : ''}
                    {summary.balanceChangePercent.toFixed(1)}%
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Alerts & Action Items</CardTitle>
                <CardDescription>
                  {totalAlerts > 0 ? `${totalAlerts} item${totalAlerts !== 1 ? 's' : ''} need attention` : 'All clear'}
                </CardDescription>
              </div>
              {totalAlerts > 0 && (
                <div className="flex items-center gap-2">
                  {criticalAlerts > 0 && (
                    <Badge variant="destructive">{criticalAlerts}</Badge>
                  )}
                  {warningAlerts > 0 && (
                    <Badge variant="default">{warningAlerts}</Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <BankIntelligenceAlerts maxAlerts={3} />
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Forecast */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Cash Flow Forecast</CardTitle>
                <CardDescription>
                  Projected balance for the next {forecastDays} days
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {[7, 30, 60, 90].map((days) => (
                  <Button
                    key={days}
                    variant={forecastDays === days ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setForecastDays(days)}
                  >
                    {days}d
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {cashFlowLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : cashFlow ? (
              <CashFlowChart data={cashFlow} currency={summary?.currency} />
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                No cash flow data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Recurring Expenses & Tax Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RecurringExpensesList />
        <TaxLiabilityCard />
      </div>

      {/* Matching Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <InvoiceMatchingWidget />
        <BillMatchingWidget />
      </div>

      {/* Recent Transactions */}
      <div className="mb-6">
        <TransactionClassificationTable limit={10} />
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Recurring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalRecurringMonthly, summary.currency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Automatic subscriptions & bills
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unmatched Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.unmatchedCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Payments awaiting reconciliation
              </p>
            </CardContent>
          </Card>

          {summary.lowCashDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Low Cash Warning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.lowCashAmount || 0, summary.currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Expected on {new Date(summary.lowCashDate).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
