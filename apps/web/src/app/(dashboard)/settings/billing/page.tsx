'use client';

import { useState } from 'react';
import { CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription, type BillingCycle, type PlanTier } from '@/hooks/use-subscription';
import { CurrentPlanCard } from '@/components/billing/CurrentPlanCard';
import { UsageOverview } from '@/components/billing/UsageOverview';
import { PlanComparison } from '@/components/billing/PlanComparison';
import { PaymentMethods } from '@/components/billing/PaymentMethods';
import { BillingHistory } from '@/components/billing/BillingHistory';
import { CancelSubscriptionModal } from '@/components/billing/CancelSubscriptionModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function BillingSettingsPage() {
  const {
    subscription,
    usage,
    paymentMethods,
    invoices,
    isLoading,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    cancelSubscription,
    resumeSubscription,
    changePlan,
    switchBillingCycle,
  } = useSubscription();

  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>(
    subscription?.billingCycle || 'MONTHLY'
  );

  const handleSelectPlan = async (tier: PlanTier, cycle: BillingCycle) => {
    if (tier === subscription?.planTier && cycle === subscription?.billingCycle) {
      return;
    }

    try {
      await changePlan(tier, cycle);
      setShowPlanDialog(false);
    } catch (error) {
      console.error('Failed to change plan:', error);
    }
  };

  const handleSwitchBillingCycle = async () => {
    if (!subscription) return;

    const newCycle = selectedBillingCycle === 'ANNUAL' ? 'MONTHLY' : 'ANNUAL';
    try {
      await switchBillingCycle(newCycle);
      setSelectedBillingCycle(newCycle);
    } catch (error) {
      console.error('Failed to switch billing cycle:', error);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription();
      setShowCancelModal(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      await resumeSubscription();
    } catch (error) {
      console.error('Failed to resume subscription:', error);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, payment methods, and billing history
        </p>
      </div>

      {/* Current Plan */}
      <CurrentPlanCard
        subscription={subscription}
        usage={usage}
        onChangePlan={() => setShowPlanDialog(true)}
      />

      {/* Usage Overview */}
      <UsageOverview subscription={subscription} usage={usage} />

      {/* Payment Methods */}
      <PaymentMethods
        paymentMethods={paymentMethods}
        onAdd={addPaymentMethod}
        onRemove={removePaymentMethod}
        onSetDefault={setDefaultPaymentMethod}
        isLoading={isLoading}
      />

      {/* Billing History */}
      <BillingHistory invoices={invoices} isLoading={isLoading} />

      {/* Subscription Actions */}
      <div className="space-y-4">
        {/* Switch Billing Cycle */}
        {subscription && subscription.planTier !== 'FREE' && (
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Switch Billing Cycle</h3>
                  <p className="text-sm text-muted-foreground">
                    {subscription.billingCycle === 'MONTHLY'
                      ? 'Save up to 17% by switching to annual billing'
                      : 'Switch to monthly billing for more flexibility'}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleSwitchBillingCycle} disabled={isLoading}>
                Switch to {subscription.billingCycle === 'MONTHLY' ? 'Annual' : 'Monthly'}
              </Button>
            </div>
          </div>
        )}

        {/* Resume Subscription */}
        {subscription?.cancelAtPeriodEnd && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100 mb-1">
                    Resume Subscription
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Your subscription is set to cancel. Resume to keep your current plan and features.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleResumeSubscription}
                disabled={isLoading}
                className="border-green-300 dark:border-green-700"
              >
                Resume
              </Button>
            </div>
          </div>
        )}

        {/* Cancel Subscription */}
        {subscription && subscription.planTier !== 'FREE' && !subscription.cancelAtPeriodEnd && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-medium text-red-900 dark:text-red-100 mb-1">
                    Cancel Subscription
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    You&apos;ll keep access until the end of your billing period, then be downgraded to the Free plan.
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowCancelModal(true)}
                disabled={isLoading}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Plan Comparison Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change Your Plan</DialogTitle>
            <DialogDescription>
              Choose a plan that fits your needs. Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>
          <PlanComparison
            currentPlan={subscription?.planTier}
            billingCycle={selectedBillingCycle}
            onBillingCycleChange={setSelectedBillingCycle}
            onSelectPlan={handleSelectPlan}
            isLoading={isLoading}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        subscription={subscription}
        onConfirm={handleCancelSubscription}
        isLoading={isLoading}
      />
    </div>
  );
}
