'use client';

import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PlanFeature {
  name: string;
  current: string | number;
  upgrade: string | number;
  highlight?: boolean;
}

interface UpgradeCardProps {
  currentPlan: string;
  upgradePlan: string;
  currentPrice: string;
  upgradePrice: string;
  features: PlanFeature[];
  onUpgrade: () => void;
  className?: string;
  showTrialBadge?: boolean;
}

/**
 * Compact card comparing current plan to recommended upgrade
 * Used in modal and settings page
 */
export function UpgradeCard({
  currentPlan,
  upgradePlan,
  currentPrice,
  upgradePrice,
  features,
  onUpgrade,
  className,
  showTrialBadge = false,
}: UpgradeCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border)]">
        {/* Current Plan */}
        <div className="p-6 bg-[var(--color-background)]">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Current Plan
              </h3>
              <p className="text-2xl font-bold text-[var(--color-text-secondary)] mt-2">
                {currentPlan}
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {currentPrice}
              </p>
            </div>

            <div className="space-y-2">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[var(--color-text-secondary)]">
                    {feature.name}
                  </span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {feature.current}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upgrade Plan */}
        <div className="p-6 bg-[var(--color-surface)] relative">
          {showTrialBadge && (
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-primary)] text-white">
                14-day Free Trial
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-primary)]">
                Recommended
              </h3>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">
                {upgradePlan}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {upgradePrice}
              </p>
            </div>

            <div className="space-y-2">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center justify-between text-sm',
                    feature.highlight && 'bg-[var(--color-accent-light)] -mx-2 px-2 py-1 rounded'
                  )}
                >
                  <span className="text-[var(--color-text-secondary)] flex items-center gap-2">
                    {feature.highlight && (
                      <Check className="w-4 h-4 text-[var(--color-primary)]" />
                    )}
                    {feature.name}
                  </span>
                  <span className={cn(
                    'font-semibold',
                    feature.highlight
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text-primary)]'
                  )}>
                    {feature.upgrade}
                  </span>
                </div>
              ))}
            </div>

            <Button
              onClick={onUpgrade}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
            >
              Upgrade to {upgradePlan}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
