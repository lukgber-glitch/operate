'use client';

import { Check, TrendingUp, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PLAN_OPTIONS, type PlanTier, type BillingCycle } from '@/hooks/use-subscription';

interface PlanComparisonProps {
  currentPlan?: PlanTier;
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  onSelectPlan: (tier: PlanTier, cycle: BillingCycle) => void;
  isLoading: boolean;
}

export function PlanComparison({
  currentPlan,
  billingCycle,
  onBillingCycleChange,
  onSelectPlan,
  isLoading,
}: PlanComparisonProps) {
  const isAnnual = billingCycle === 'ANNUAL';

  const getPrice = (plan: typeof PLAN_OPTIONS[0]) => {
    return isAnnual ? plan.annualPrice : plan.monthlyPrice;
  };

  const getSavingsPercentage = (plan: typeof PLAN_OPTIONS[0]) => {
    if (plan.monthlyPrice === 0) return 0;
    const annualMonthly = plan.annualPrice / 12;
    const savings = ((plan.monthlyPrice - annualMonthly) / plan.monthlyPrice) * 100;
    return Math.round(savings);
  };

  const getButtonText = (tier: PlanTier) => {
    if (currentPlan === tier) return 'Current Plan';
    if (!currentPlan || tier === 'FREE') return 'Select Plan';

    const currentIndex = PLAN_OPTIONS.findIndex((p) => p.tier === currentPlan);
    const tierIndex = PLAN_OPTIONS.findIndex((p) => p.tier === tier);

    return tierIndex > currentIndex ? 'Upgrade' : 'Downgrade';
  };

  const isCurrentPlan = (tier: PlanTier) => currentPlan === tier;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Plans & Pricing</CardTitle>
            <CardDescription>
              Choose the plan that fits your business needs
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="billing-cycle" className="text-sm">
              Monthly
            </Label>
            <Switch
              id="billing-cycle"
              checked={isAnnual}
              onCheckedChange={(checked) =>
                onBillingCycleChange(checked ? 'ANNUAL' : 'MONTHLY')
              }
            />
            <Label htmlFor="billing-cycle" className="text-sm">
              Annual
            </Label>
            {isAnnual && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Save up to 17%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-4">
          {PLAN_OPTIONS.map((plan) => {
            const price = getPrice(plan);
            const savingsPercent = getSavingsPercentage(plan);
            const isCurrent = isCurrentPlan(plan.tier);

            return (
              <div
                key={plan.tier}
                className={`relative rounded-lg border-2 p-6 ${
                  plan.popular
                    ? 'border-primary shadow-lg'
                    : isCurrent
                    ? 'border-primary/50'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary">
                      <Check className="mr-1 h-3 w-3" />
                      Current Plan
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold">
                      ${price}
                    </span>
                    <span className="text-muted-foreground">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>

                  {isAnnual && savingsPercent > 0 && (
                    <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <TrendingUp className="h-3 w-3" />
                      Save {savingsPercent}% vs monthly
                    </div>
                  )}

                  {isAnnual && price > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ${(price / 12).toFixed(2)}/month billed annually
                    </p>
                  )}
                </div>

                <Button
                  className="w-full mb-6"
                  variant={plan.popular ? 'default' : isCurrent ? 'secondary' : 'outline'}
                  onClick={() => onSelectPlan(plan.tier, billingCycle)}
                  disabled={isCurrent || isLoading}
                >
                  {getButtonText(plan.tier)}
                </Button>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.tier !== 'FREE' && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                      Limits
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AI Messages</span>
                        <span className="font-medium">
                          {plan.limits.aiMessages === -1
                            ? 'Unlimited'
                            : plan.limits.aiMessages.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank Accounts</span>
                        <span className="font-medium">
                          {plan.limits.bankConnections === -1
                            ? 'Unlimited'
                            : plan.limits.bankConnections}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Invoices/Month</span>
                        <span className="font-medium">
                          {plan.limits.invoicesPerMonth === -1
                            ? 'Unlimited'
                            : plan.limits.invoicesPerMonth}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Team Members</span>
                        <span className="font-medium">
                          {plan.limits.teamMembers === -1
                            ? 'Unlimited'
                            : plan.limits.teamMembers}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
