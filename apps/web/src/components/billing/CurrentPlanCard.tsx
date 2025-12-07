'use client';

import { format } from 'date-fns';
import { CreditCard, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Subscription, CurrentUsage, PlanTier } from '@/hooks/use-subscription';

interface CurrentPlanCardProps {
  subscription: Subscription | null;
  usage: CurrentUsage | null;
  onChangePlan: () => void;
}

const PLAN_COLORS: Record<PlanTier, string> = {
  FREE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  STARTER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PRO: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  BUSINESS: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

export function CurrentPlanCard({ subscription, usage, onChangePlan }: CurrentPlanCardProps) {
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Loading subscription details...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isTrialing = subscription.status === 'TRIALING';
  const isCancelled = subscription.cancelAtPeriodEnd;
  const isPastDue = subscription.status === 'PAST_DUE';

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getBillingCycleText = () => {
    return subscription.billingCycle === 'ANNUAL' ? 'Billed Annually' : 'Billed Monthly';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <span>Current Plan</span>
              <Badge className={PLAN_COLORS[subscription.planTier]}>
                {subscription.planTier}
              </Badge>
              {isTrialing && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                  Trial
                </Badge>
              )}
              {isCancelled && (
                <Badge variant="destructive">Cancelling</Badge>
              )}
              {isPastDue && (
                <Badge variant="destructive">Past Due</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-2">
              {getBillingCycleText()} • {formatCurrency(subscription.price.amount, subscription.price.currency)}
            </CardDescription>
          </div>
          <Button onClick={onChangePlan} variant="outline">
            Change Plan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Billing Information */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Next Billing Date</p>
              <p className="text-sm text-muted-foreground">
                {isCancelled
                  ? `Cancels on ${format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy')}`
                  : format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Amount Due</p>
              <p className="text-sm text-muted-foreground">
                {isCancelled
                  ? 'No charge (cancelling)'
                  : formatCurrency(subscription.price.amount, subscription.price.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Trial Notice */}
        {isTrialing && subscription.trialEndsAt && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Trial Period Active
                </p>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  Your trial ends on {format(new Date(subscription.trialEndsAt), 'MMM dd, yyyy')}.
                  You won&apos;t be charged until after your trial period.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Past Due Notice */}
        {isPastDue && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex gap-3">
              <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  Payment Failed
                </p>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  Your recent payment failed. Please update your payment method to continue using your plan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Usage Summary */}
        {usage && (
          <div className="space-y-3">
            <h3 className="font-medium">Current Usage</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">AI Messages</p>
                <p className="text-lg font-semibold mt-1">
                  {usage.aiMessages.toLocaleString()}
                  {subscription.limits.aiMessages > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {' '}/ {subscription.limits.aiMessages.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Bank Connections</p>
                <p className="text-lg font-semibold mt-1">
                  {usage.bankConnections}
                  {subscription.limits.bankConnections > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {' '}/ {subscription.limits.bankConnections}
                    </span>
                  )}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Invoices (Month)</p>
                <p className="text-lg font-semibold mt-1">
                  {usage.invoicesThisMonth}
                  {subscription.limits.invoicesPerMonth > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {' '}/ {subscription.limits.invoicesPerMonth}
                    </span>
                  )}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Storage</p>
                <p className="text-lg font-semibold mt-1">
                  {usage.storageUsed.toFixed(1)} GB
                  {subscription.limits.storage > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {' '}/ {subscription.limits.storage} GB
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
