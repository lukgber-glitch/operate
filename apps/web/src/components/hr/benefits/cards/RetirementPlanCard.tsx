'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Check, TrendingUp, Info } from 'lucide-react';
import { BenefitPlan, RetirementContribution } from '@/types/benefits';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RetirementPlanCardProps {
  plan: BenefitPlan;
  annualSalary: number;
  selectedContribution?: RetirementContribution;
  onSelect: (planId: string, contribution: RetirementContribution) => void;
  isSelected?: boolean;
}

export function RetirementPlanCard({
  plan,
  annualSalary,
  selectedContribution,
  onSelect,
  isSelected = false,
}: RetirementPlanCardProps) {
  const [contributionType, setContributionType] = useState<'percentage' | 'fixed'>(
    selectedContribution?.contributionType || 'percentage'
  );
  const [percentage, setPercentage] = useState(selectedContribution?.contributionPercentage || 6);
  const [fixedAmount, setFixedAmount] = useState(selectedContribution?.contributionAmount || 0);
  const [isRoth, setIsRoth] = useState(selectedContribution?.rothContribution || false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate contribution amounts
  const annualContribution =
    contributionType === 'percentage' ? (annualSalary * percentage) / 100 : fixedAmount * 26; // biweekly

  const contributionPerPaycheck =
    contributionType === 'percentage' ? (annualSalary * percentage) / 100 / 26 : fixedAmount;

  // Calculate employer match (assuming 6% max match at 50% rate from mock data)
  const matchPercentage = 6; // Company matches up to 6%
  const matchRate = 0.5; // 50 cents on the dollar
  const employeeContributionPercent = contributionType === 'percentage'
    ? percentage
    : (fixedAmount * 26 / annualSalary) * 100;

  const matchedPercent = Math.min(employeeContributionPercent, matchPercentage);
  const employerMatch = (annualSalary * matchedPercent * matchRate) / 100;
  const employerMatchPerPaycheck = employerMatch / 26;

  const totalAnnualContribution = annualContribution + employerMatch;

  const handleSelect = () => {
    const contribution: RetirementContribution = {
      contributionType,
      contributionPercentage: contributionType === 'percentage' ? percentage : undefined,
      contributionAmount: contributionType === 'fixed' ? fixedAmount : undefined,
      rothContribution: isRoth,
      investmentAllocations: [], // Will be set in a separate step
    };
    onSelect(plan.id, contribution);
  };

  return (
    <Card className={isSelected ? 'border-primary border-2' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              {plan.name}
            </CardTitle>
            <CardDescription>{plan.provider}</CardDescription>
          </div>
          {isSelected && (
            <Badge variant="default" className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Selected
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contribution Type */}
        <div className="space-y-3">
          <Label>Contribution Method</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={contributionType === 'percentage' ? 'default' : 'outline'}
              onClick={() => setContributionType('percentage')}
              className="w-full"
            >
              Percentage of Salary
            </Button>
            <Button
              variant={contributionType === 'fixed' ? 'default' : 'outline'}
              onClick={() => setContributionType('fixed')}
              className="w-full"
            >
              Fixed Amount
            </Button>
          </div>
        </div>

        {/* Contribution Amount */}
        {contributionType === 'percentage' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="percentage">Contribution Percentage</Label>
              <span className="text-sm font-semibold">{percentage}%</span>
            </div>
            <Input
              id="percentage"
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={percentage}
              onChange={(e) => setPercentage(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>15%</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="fixed-amount">Amount Per Paycheck</Label>
            <Input
              id="fixed-amount"
              type="number"
              min="0"
              step="10"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter amount"
            />
          </div>
        )}

        {/* Roth Option */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="roth" className="cursor-pointer">
              Roth 401(k) Contribution
            </Label>
            <p className="text-xs text-muted-foreground">After-tax contributions with tax-free growth</p>
          </div>
          <Switch id="roth" checked={isRoth} onCheckedChange={setIsRoth} />
        </div>

        <Separator />

        {/* Contribution Summary */}
        <div className="space-y-3 bg-muted p-4 rounded-lg">
          <h4 className="font-semibold text-sm">Your Contribution Summary</h4>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your contribution per paycheck:</span>
              <span className="font-semibold">{formatCurrency(contributionPerPaycheck)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your annual contribution:</span>
              <span className="font-semibold">{formatCurrency(annualContribution)}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Employer match per paycheck:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(employerMatchPerPaycheck)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Annual employer match:</span>
              <span className="font-semibold text-green-600">{formatCurrency(employerMatch)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="font-semibold">Total annual savings:</span>
            <span className="font-bold text-lg">{formatCurrency(totalAnnualContribution)}</span>
          </div>
        </div>

        {/* Employer Match Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Company Match:</strong> We match 50% of your contributions up to 6% of your salary.
            {employeeContributionPercent < matchPercentage && (
              <span className="block mt-1 text-amber-600">
                Consider contributing {matchPercentage}% to maximize your employer match!
              </span>
            )}
          </AlertDescription>
        </Alert>

        <Separator />

        {/* Plan Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Plan Features</h4>
          <ul className="space-y-1">
            {plan.features.map((feature, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={handleSelect} className="w-full" variant={isSelected ? 'default' : 'outline'}>
          {isSelected ? 'Selected' : 'Select Plan'}
        </Button>
      </CardContent>
    </Card>
  );
}
