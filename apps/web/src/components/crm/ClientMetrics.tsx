'use client';

import {
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ClientMetrics as ClientMetricsType, RiskLevel } from '@/lib/api/crm';
import { cn } from '@/lib/utils';

interface ClientMetricsProps {
  metrics: ClientMetricsType;
}

const riskConfig: Record<
  RiskLevel,
  { color: string; icon: React.ElementType; label: string }
> = {
  LOW: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: CheckCircle,
    label: 'Low Risk',
  },
  MEDIUM: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    icon: AlertTriangle,
    label: 'Medium Risk',
  },
  HIGH: {
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    icon: AlertTriangle,
    label: 'High Risk',
  },
  CRITICAL: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    icon: AlertTriangle,
    label: 'Critical Risk',
  },
};

export function ClientMetrics({ metrics }: ClientMetricsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const riskInfo = riskConfig[metrics.risk.level];
  const RiskIcon = riskInfo.icon;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Revenue Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.revenue.total)}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-xs text-muted-foreground">
              This month: {formatCurrency(metrics.revenue.thisMonth)}
            </div>
          </div>
          {metrics.revenue.growth !== 0 && (
            <div className="flex items-center gap-1 mt-1">
              {metrics.revenue.growth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  metrics.revenue.growth > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {formatPercentage(metrics.revenue.growth)} vs last month
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invoices</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.invoices.total}</div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div>
              <p className="text-muted-foreground">Paid</p>
              <p className="font-semibold text-green-600">{metrics.invoices.paid}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pending</p>
              <p className="font-semibold text-yellow-600">{metrics.invoices.pending}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Overdue</p>
              <p className="font-semibold text-red-600">{metrics.invoices.overdue}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Behavior Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Behavior</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.payment.avgDays} days</div>
          <p className="text-xs text-muted-foreground mt-1">Average payment time</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">On-time rate</span>
              <span className="font-medium">{metrics.payment.onTimeRate}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  metrics.payment.onTimeRate >= 80
                    ? 'bg-green-600'
                    : metrics.payment.onTimeRate >= 60
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                )}
                style={{ width: `${metrics.payment.onTimeRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
          <RiskIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className={cn('mb-3', riskInfo.color)}>
            {riskInfo.label}
          </Badge>
          {metrics.risk.factors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Risk Factors:</p>
              <ul className="text-xs space-y-1">
                {metrics.risk.factors.map((factor, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {metrics.risk.factors.length === 0 && (
            <p className="text-xs text-muted-foreground">No significant risk factors detected</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
