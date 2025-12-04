'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, Shield, AlertCircle } from 'lucide-react';
import { BenefitPlan, CoverageLevel } from '@/types/benefits';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LifeInsuranceCardProps {
  plan: BenefitPlan;
  annualSalary: number;
  selectedCoverage?: number;
  onSelect: (planId: string, coverageAmount: number) => void;
  isSelected?: boolean;
}

export function LifeInsuranceCard({
  plan,
  annualSalary,
  selectedCoverage,
  onSelect,
  isSelected = false,
}: LifeInsuranceCardProps) {
  // Assuming basic coverage is 1x salary (can be configured from plan)
  const basicCoverage = annualSalary;

  // Supplemental options from plan or defaults
  const supplementalOptions = [0, 50000, 100000, 250000, 500000];

  const [supplementalCoverage, setSupplementalCoverage] = useState(selectedCoverage || 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate premium (simplified - typically age and health-based)
  const calculatePremium = (amount: number) => {
    // Basic coverage is typically free
    if (amount === 0) return 0;
    // Rough estimate: $0.50 per $1000 of coverage per month
    return (amount / 1000) * 0.5;
  };

  const totalCoverage = basicCoverage + supplementalCoverage;
  const monthlyPremium = calculatePremium(supplementalCoverage);

  const handleSelect = () => {
    onSelect(plan.id, supplementalCoverage);
  };

  return (
    <Card className={isSelected ? 'border-primary border-2' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
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
        {/* Basic Coverage Info */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Basic Coverage</h4>
            <Badge variant="secondary">Employer Paid</Badge>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">1x Annual Salary</span>
            <span className="text-2xl font-bold">{formatCurrency(basicCoverage)}</span>
          </div>
          <p className="text-xs text-muted-foreground">No cost to you - fully covered by employer</p>
        </div>

        <Separator />

        {/* Supplemental Coverage Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Additional Coverage (Optional)</Label>
            <span className="text-xs text-muted-foreground">Enhance your protection</span>
          </div>

          <RadioGroup
            value={supplementalCoverage.toString()}
            onValueChange={(value) => setSupplementalCoverage(parseInt(value))}
          >
            {supplementalOptions.map((amount) => (
              <div
                key={amount}
                className="flex items-center justify-between space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={amount.toString()} id={`${plan.id}-${amount}`} />
                  <Label htmlFor={`${plan.id}-${amount}`} className="cursor-pointer">
                    {amount === 0 ? 'No additional coverage' : formatCurrency(amount)}
                  </Label>
                </div>
                {amount > 0 && (
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(calculatePremium(amount))}/mo</div>
                  </div>
                )}
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Coverage Summary */}
        <div className="space-y-2 bg-primary/5 p-4 rounded-lg">
          <h4 className="font-semibold text-sm">Total Life Insurance Coverage</h4>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Basic coverage:</span>
              <span className="font-semibold">{formatCurrency(basicCoverage)}</span>
            </div>
            {supplementalCoverage > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Supplemental coverage:</span>
                <span className="font-semibold">{formatCurrency(supplementalCoverage)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="font-semibold">Total coverage:</span>
              <span className="text-2xl font-bold">{formatCurrency(totalCoverage)}</span>
            </div>
          </div>

          <div className="pt-2 mt-2 border-t">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Your cost per month:</span>
              <span className="text-lg font-bold">
                {monthlyPremium === 0 ? 'FREE' : formatCurrency(monthlyPremium)}
              </span>
            </div>
          </div>
        </div>

        {/* Important Information */}
        {supplementalCoverage > 100000 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Coverage over $100,000 may require a medical questionnaire or exam.
            </AlertDescription>
          </Alert>
        )}

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

        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Important:</strong> You will need to designate beneficiaries after selecting this plan.
          </AlertDescription>
        </Alert>

        <Button onClick={handleSelect} className="w-full" variant={isSelected ? 'default' : 'outline'}>
          {isSelected ? 'Selected' : 'Select Plan'}
        </Button>
      </CardContent>
    </Card>
  );
}
