'use client';

import { format, parseISO } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  ArrowRight,
  TrendingDown,
  Calendar,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBankAlerts, useDismissAlert } from './useBankIntelligence';
import type { BankAlert } from './types';

interface BankIntelligenceAlertsProps {
  maxAlerts?: number;
  className?: string;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-900',
    badgeVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-900',
    badgeVariant: 'default' as const,
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-900',
    badgeVariant: 'secondary' as const,
  },
};

const typeIcons = {
  low_balance: TrendingDown,
  payment_due: Calendar,
  tax_deadline: FileText,
  unmatched: LinkIcon,
  recurring_expense: Calendar,
};

export function BankIntelligenceAlerts({ maxAlerts, className }: BankIntelligenceAlertsProps) {
  const { data: alerts, isLoading, isError } = useBankAlerts();
  const dismissMutation = useDismissAlert();

  const handleDismiss = (alertId: string) => {
    dismissMutation.mutate(alertId);
  };

  const displayAlerts = maxAlerts && alerts ? alerts.slice(0, maxAlerts) : alerts;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Alerts & Action Items</CardTitle>
          <CardDescription className="text-destructive">
            Failed to load alerts
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            Alerts & Action Items
          </CardTitle>
          <CardDescription>No alerts at this time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-center">
            <Info className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-900 dark:text-green-100">
              All clear!
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              No action items require your attention
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by severity
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const infoAlerts = alerts.filter(a => a.severity === 'info');

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              Alerts & Action Items
            </CardTitle>
            <CardDescription>
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''} requiring attention
            </CardDescription>
          </div>
          {alerts.length > 0 && (
            <div className="flex items-center gap-2">
              {criticalAlerts.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalAlerts.length} Critical
                </Badge>
              )}
              {warningAlerts.length > 0 && (
                <Badge variant="default" className="text-xs">
                  {warningAlerts.length} Warning
                </Badge>
              )}
              {infoAlerts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {infoAlerts.length} Info
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {displayAlerts?.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            const TypeIcon = typeIcons[alert.type] || Info;

            return (
              <Alert
                key={alert.id}
                className={`${config.bgColor} ${config.borderColor} border`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm">{alert.title}</h4>
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <TypeIcon className="h-3 w-3" />
                            {alert.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <AlertDescription className="text-sm">
                          {alert.message}
                        </AlertDescription>
                        {alert.date && (
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(alert.date), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>

                      {alert.dismissible !== false && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => handleDismiss(alert.id)}
                          disabled={dismissMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {alert.action && (
                      <div className="pt-1">
                        <Button
                          asChild
                          size="sm"
                          variant="default"
                          className="h-8"
                        >
                          <Link href={alert.action.href}>
                            {alert.action.label}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            );
          })}

          {maxAlerts && alerts.length > maxAlerts && (
            <div className="text-center pt-2">
              <Link
                href="/alerts"
                className="text-sm text-primary hover:underline"
              >
                View all {alerts.length} alerts
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
