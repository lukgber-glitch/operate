'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  CreditCard,
  Users,
  Database,
  Activity,
  AlertTriangle,
  Ban,
  TrendingUp,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubscriptionDetail, SubscriptionStatus } from '@/types/subscription-analytics';

interface SubscriptionDetailCardProps {
  subscription: SubscriptionDetail;
  isLoading?: boolean;
  onCancel?: (immediate: boolean) => void;
  onUpdateTier?: (newTier: string) => void;
  onExtendTrial?: (days: number) => void;
}

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  trialing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  past_due: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  canceled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  incomplete: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  paused: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export function SubscriptionDetailCard({
  subscription,
  isLoading = false,
  onCancel,
  onUpdateTier,
  onExtendTrial,
}: SubscriptionDetailCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const formatTierName = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const formatStatusName = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return (used / limit) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 75) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-24 w-full animate-pulse rounded bg-muted" />
            <div className="h-24 w-full animate-pulse rounded bg-muted" />
            <div className="h-24 w-full animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Subscription Details</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">ID: {subscription.id}</p>
            </div>
            <Badge className={cn('font-normal', STATUS_COLORS[subscription.status])}>
              {formatStatusName(subscription.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Customer</div>
              <div>{subscription.customerName}</div>
              <div className="text-sm text-muted-foreground">{subscription.customerEmail}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Plan</div>
              <div className="text-lg font-semibold">{formatTierName(subscription.tier)}</div>
              <div className="text-sm text-muted-foreground">
                {subscription.billingInterval === 'monthly' ? 'Monthly' : 'Annual'} billing
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">MRR</div>
                <div className="font-semibold">{formatCurrency(subscription.mrr)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Current Period</div>
                <div className="text-sm font-medium">
                  {formatDate(subscription.currentPeriodStart)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Next Billing</div>
                <div className="text-sm font-medium">
                  {formatDate(subscription.currentPeriodEnd)}
                </div>
              </div>
            </div>
          </div>

          {subscription.trialEnd && (
            <>
              <Separator />
              <div className="flex items-center gap-2 rounded-md bg-blue-50 p-3 dark:bg-blue-950/20">
                <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="text-sm">
                  <span className="font-medium text-blue-800 dark:text-blue-400">
                    Trial ends on {formatDate(subscription.trialEnd)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Users */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Users</span>
              </div>
              <span className="text-muted-foreground">
                {subscription.usage.users} / {subscription.usage.userLimit}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full transition-all',
                  getUsageColor(
                    getUsagePercentage(subscription.usage.users, subscription.usage.userLimit)
                  )
                )}
                style={{
                  width: `${getUsagePercentage(
                    subscription.usage.users,
                    subscription.usage.userLimit
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Storage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Storage</span>
              </div>
              <span className="text-muted-foreground">
                {(subscription.usage.storage / 1024 / 1024 / 1024).toFixed(2)} GB /{' '}
                {(subscription.usage.storageLimit / 1024 / 1024 / 1024).toFixed(0)} GB
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full transition-all',
                  getUsageColor(
                    getUsagePercentage(subscription.usage.storage, subscription.usage.storageLimit)
                  )
                )}
                style={{
                  width: `${getUsagePercentage(
                    subscription.usage.storage,
                    subscription.usage.storageLimit
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* API Calls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">API Calls (this month)</span>
              </div>
              <span className="text-muted-foreground">
                {subscription.usage.apiCalls.toLocaleString()} /{' '}
                {subscription.usage.apiCallLimit.toLocaleString()}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full transition-all',
                  getUsageColor(
                    getUsagePercentage(subscription.usage.apiCalls, subscription.usage.apiCallLimit)
                  )
                )}
                style={{
                  width: `${getUsagePercentage(
                    subscription.usage.apiCalls,
                    subscription.usage.apiCallLimit
                  )}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dunning Status */}
      {subscription.dunningStatus?.isPastDue && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <CardTitle>Payment Issue</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Days Past Due:</span>
              <span className="font-medium">{subscription.dunningStatus.daysPastDue}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Retry Count:</span>
              <span className="font-medium">{subscription.dunningStatus.retryCount}</span>
            </div>
            {subscription.dunningStatus.nextRetryDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Next Retry:</span>
                <span className="font-medium">
                  {formatDate(subscription.dunningStatus.nextRetryDate)}
                </span>
              </div>
            )}
            {subscription.dunningStatus.lastFailureReason && (
              <div className="mt-2 rounded bg-yellow-50 p-2 dark:bg-yellow-950/20">
                <p className="text-xs text-yellow-800 dark:text-yellow-400">
                  {subscription.dunningStatus.lastFailureReason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subscription.paymentHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment history available</p>
            ) : (
              subscription.paymentHistory.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        payment.status === 'succeeded'
                          ? 'bg-green-600'
                          : payment.status === 'failed'
                            ? 'bg-red-600'
                            : 'bg-yellow-600'
                      )}
                    />
                    <div>
                      <div className="font-medium">
                        {formatCurrency(payment.amount / 100)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(payment.date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={payment.status === 'succeeded' ? 'default' : 'destructive'}
                      className="capitalize"
                    >
                      {payment.status}
                    </Badge>
                    {payment.invoiceUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subscription.status === 'trialing' && onExtendTrial && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onExtendTrial(7)}
            >
              <Clock className="mr-2 h-4 w-4" />
              Extend Trial by 7 Days
            </Button>
          )}

          {onUpdateTier && subscription.status === 'active' && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // This would open a modal in a real implementation
              }}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Change Subscription Tier
            </Button>
          )}

          {onCancel && subscription.status !== 'canceled' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Ban className="mr-2 h-4 w-4" />
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this subscription? The customer will lose
                    access at the end of the current billing period.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onCancel(false)}>
                    Cancel at Period End
                  </AlertDialogAction>
                  <AlertDialogAction
                    onClick={() => onCancel(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Cancel Immediately
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
