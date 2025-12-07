'use client';

import { format, addMonths } from 'date-fns';
import { MessageSquare, Building2, Receipt, Users, HardDrive, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Subscription, CurrentUsage } from '@/hooks/use-subscription';

interface UsageOverviewProps {
  subscription: Subscription | null;
  usage: CurrentUsage | null;
}

interface UsageMetric {
  icon: React.ReactNode;
  label: string;
  current: number;
  limit: number;
  unit: string;
  color: string;
  isUnlimited?: boolean;
}

export function UsageOverview({ subscription, usage }: UsageOverviewProps) {
  if (!subscription || !usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
          <CardDescription>Loading usage data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getPercentage = (current: number, limit: number): number => {
    if (limit <= 0) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-primary';
  };

  const metrics: UsageMetric[] = [
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: 'AI Messages',
      current: usage.aiMessages,
      limit: subscription.limits.aiMessages,
      unit: 'messages',
      color: 'text-blue-600 dark:text-blue-400',
      isUnlimited: subscription.limits.aiMessages === -1,
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      label: 'Bank Connections',
      current: usage.bankConnections,
      limit: subscription.limits.bankConnections,
      unit: 'connections',
      color: 'text-green-600 dark:text-green-400',
      isUnlimited: subscription.limits.bankConnections === -1,
    },
    {
      icon: <Receipt className="h-5 w-5" />,
      label: 'Invoices This Month',
      current: usage.invoicesThisMonth,
      limit: subscription.limits.invoicesPerMonth,
      unit: 'invoices',
      color: 'text-purple-600 dark:text-purple-400',
      isUnlimited: subscription.limits.invoicesPerMonth === -1,
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Team Members',
      current: usage.teamMembers,
      limit: subscription.limits.teamMembers,
      unit: 'members',
      color: 'text-amber-600 dark:text-amber-400',
      isUnlimited: subscription.limits.teamMembers === -1,
    },
    {
      icon: <HardDrive className="h-5 w-5" />,
      label: 'Storage',
      current: usage.storageUsed,
      limit: subscription.limits.storage,
      unit: 'GB',
      color: 'text-pink-600 dark:text-pink-400',
      isUnlimited: false,
    },
  ];

  const resetDate = format(addMonths(new Date(subscription.currentPeriodStart), 1), 'MMM dd, yyyy');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Overview</CardTitle>
        <CardDescription>
          Your current usage across all plan features. Resets on {resetDate}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric) => {
          const percentage = getPercentage(metric.current, metric.limit);
          const isNearLimit = percentage >= 75 && !metric.isUnlimited;
          const isAtLimit = percentage >= 100 && !metric.isUnlimited;

          return (
            <div key={metric.label} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg bg-muted p-2 ${metric.color}`}>
                    {metric.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{metric.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {metric.isUnlimited ? (
                        <span>
                          {metric.current.toLocaleString()} {metric.unit} (Unlimited)
                        </span>
                      ) : (
                        <span>
                          {metric.current.toLocaleString()} / {metric.limit.toLocaleString()} {metric.unit}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {isNearLimit && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`h-4 w-4 ${isAtLimit ? 'text-red-500' : 'text-amber-500'}`} />
                    <span className={`text-sm font-medium ${isAtLimit ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {isAtLimit ? 'Limit reached' : `${percentage.toFixed(0)}% used`}
                    </span>
                  </div>
                )}
              </div>

              {!metric.isUnlimited && (
                <div className="space-y-2">
                  <Progress
                    value={percentage}
                    className="h-2"
                    indicatorClassName={getProgressColor(percentage)}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Upgrade Notice */}
        {metrics.some((m) => getPercentage(m.current, m.limit) >= 75 && !m.isUnlimited) && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Approaching Plan Limits
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  You&apos;re nearing your plan limits. Consider upgrading to avoid service interruptions.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
