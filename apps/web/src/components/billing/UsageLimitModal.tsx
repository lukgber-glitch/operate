'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { UsageIndicator } from './UsageIndicator';
import { UpgradeCard } from './UpgradeCard';
import { useRouter } from 'next/navigation';
import type { UsageLimits } from '@/hooks/use-usage-check';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  usage: UsageLimits;
}

/**
 * Blocking modal at 100% usage
 * Shows current plan, usage stats, and upgrade options
 * "You've reached your limit" messaging
 * Can be dismissed once per day
 */
export function UsageLimitModal({
  isOpen,
  onClose,
  usage,
}: UsageLimitModalProps) {
  const router = useRouter();
  const [canDismiss, setCanDismiss] = useState(true);

  useEffect(() => {
    // Check if modal was dismissed today
    const dismissalKey = 'usage-limit-modal-dismissed';
    const lastDismissed = localStorage.getItem(dismissalKey);
    const today = new Date().toDateString();

    if (lastDismissed === today) {
      setCanDismiss(false);
    } else {
      setCanDismiss(true);
    }
  }, []);

  const handleDismiss = () => {
    if (canDismiss) {
      const dismissalKey = 'usage-limit-modal-dismissed';
      const today = new Date().toDateString();
      localStorage.setItem(dismissalKey, today);
      onClose();
    }
  };

  const handleUpgrade = () => {
    router.push('/settings/billing');
    onClose();
  };

  // Determine which limit was reached
  const limitReached = usage.aiMessages.percentage >= 100
    ? 'AI messages'
    : usage.bankConnections.percentage >= 100
    ? 'bank connections'
    : usage.invoices.percentage >= 100
    ? 'invoices'
    : '';

  // Get upgrade plan based on current tier
  const getUpgradePlan = () => {
    switch (usage.plan.tier) {
      case 'free':
        return {
          name: 'Starter',
          price: '$29/month',
          features: [
            { name: 'AI Messages', current: usage.aiMessages.limit, upgrade: '1,000/mo', highlight: true },
            { name: 'Bank Connections', current: usage.bankConnections.limit, upgrade: '5', highlight: true },
            { name: 'Invoices', current: usage.invoices.limit, upgrade: 'Unlimited', highlight: true },
            { name: 'Support', current: 'Email', upgrade: 'Priority Email' },
          ],
        };
      case 'starter':
        return {
          name: 'Pro',
          price: '$99/month',
          features: [
            { name: 'AI Messages', current: usage.aiMessages.limit, upgrade: 'Unlimited', highlight: true },
            { name: 'Bank Connections', current: usage.bankConnections.limit, upgrade: 'Unlimited', highlight: true },
            { name: 'Invoices', current: 'Unlimited', upgrade: 'Unlimited' },
            { name: 'Support', current: 'Priority Email', upgrade: 'Chat & Phone', highlight: true },
          ],
        };
      case 'pro':
        return {
          name: 'Enterprise',
          price: 'Custom',
          features: [
            { name: 'AI Messages', current: 'Unlimited', upgrade: 'Unlimited' },
            { name: 'Bank Connections', current: 'Unlimited', upgrade: 'Unlimited' },
            { name: 'Custom Integrations', current: 'No', upgrade: 'Yes', highlight: true },
            { name: 'Support', current: 'Chat & Phone', upgrade: 'Dedicated Manager', highlight: true },
          ],
        };
      default:
        return null;
    }
  };

  const upgradePlan = getUpgradePlan();

  return (
    <Dialog open={isOpen} onOpenChange={canDismiss ? handleDismiss : undefined}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  You've Reached Your {limitReached} Limit
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Upgrade your plan to continue using {limitReached} and unlock more features.
                </DialogDescription>
              </div>
            </div>
            {canDismiss && (
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Current Usage Stats */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
              Current Usage
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UsageIndicator
                label="AI Messages"
                used={usage.aiMessages.used}
                limit={usage.aiMessages.limit}
                percentage={usage.aiMessages.percentage}
              />
              <UsageIndicator
                label="Bank Connections"
                used={usage.bankConnections.used}
                limit={usage.bankConnections.limit}
                percentage={usage.bankConnections.percentage}
              />
              <UsageIndicator
                label="Invoices"
                used={usage.invoices.used}
                limit={usage.invoices.limit}
                percentage={usage.invoices.percentage}
              />
            </div>
          </div>

          {/* Upgrade Card */}
          {upgradePlan && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
                Recommended Upgrade
              </h3>
              <UpgradeCard
                currentPlan={usage.plan.name}
                upgradePlan={upgradePlan.name}
                currentPrice={usage.plan.tier === 'free' ? 'Free' : `Your current plan`}
                upgradePrice={upgradePlan.price}
                features={upgradePlan.features}
                onUpgrade={handleUpgrade}
                showTrialBadge={usage.plan.tier === 'free'}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              {canDismiss
                ? 'You can dismiss this once per day'
                : 'Dismissed for today. Upgrade to continue.'}
            </p>
            <div className="flex gap-3">
              {canDismiss && (
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                >
                  Remind Me Later
                </Button>
              )}
              <Button
                onClick={handleUpgrade}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
