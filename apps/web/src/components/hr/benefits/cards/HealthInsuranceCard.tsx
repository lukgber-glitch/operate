'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, Heart, Info } from 'lucide-react';
import { BenefitPlan, CoverageLevel } from '@/types/benefits';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface HealthInsuranceCardProps {
  plan: BenefitPlan;
  selectedCoverage?: CoverageLevel;
  onSelect: (planId: string, coverage: CoverageLevel) => void;
  isSelected?: boolean;
  showDetails?: boolean;
}

export function HealthInsuranceCard({
  plan,
  selectedCoverage,
  onSelect,
  isSelected = false,
  showDetails = true,
}: HealthInsuranceCardProps) {
  const [coverage, setCoverage] = useState<CoverageLevel>(
    selectedCoverage || CoverageLevel.EMPLOYEE_ONLY
  );

  const handleSelect = () => {
    onSelect(plan.id, coverage);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getEmployeeCost = (level: CoverageLevel) => {
    return plan.employeeMonthlyPremium[level] || 0;
  };

  const getEmployerContribution = (level: CoverageLevel) => {
    return plan.employerMonthlyContribution[level] || 0;
  };

  const getTotalCost = (level: CoverageLevel) => {
    return getEmployeeCost(level) + getEmployerContribution(level);
  };

  return (
    <Card className={isSelected ? 'border-primary border-2' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
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
        {/* Coverage Level Selection */}
        <div className="space-y-3">
          <Label>Coverage Level</Label>
          <RadioGroup value={coverage} onValueChange={(value) => setCoverage(value as CoverageLevel)}>
            {plan.coverageLevels.map((level) => (
              <div key={level} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={level} id={`${plan.id}-${level}`} />
                  <Label htmlFor={`${plan.id}-${level}`} className="cursor-pointer">
                    {level.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Label>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(getEmployeeCost(level))}/mo</div>
                  <div className="text-xs text-muted-foreground">
                    Employer pays: {formatCurrency(getEmployerContribution(level))}/mo
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Cost Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Your cost per month:</span>
            <span className="font-semibold">{formatCurrency(getEmployeeCost(coverage))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Employer contribution:</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(getEmployerContribution(coverage))}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total plan cost:</span>
            <span className="font-semibold">{formatCurrency(getTotalCost(coverage))}</span>
          </div>
        </div>

        {showDetails && (
          <>
            <Separator />

            {/* Plan Details */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Annual Deductible:</span>
                <span>{formatCurrency(plan.deductible?.[coverage] || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Out-of-Pocket Max:</span>
                <span>{formatCurrency(plan.outOfPocketMax?.[coverage] || 0)}</span>
              </div>
              {plan.networkType && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network Type:</span>
                  <Badge variant="outline">{plan.networkType}</Badge>
                </div>
              )}
              {plan.coInsurance && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coinsurance:</span>
                  <span>{plan.coInsurance}% covered</span>
                </div>
              )}
            </div>

            {plan.copay && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Copays</h4>
                  {plan.copay.primaryCare && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Primary Care:</span>
                      <span>{formatCurrency(plan.copay.primaryCare)}</span>
                    </div>
                  )}
                  {plan.copay.specialist && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Specialist:</span>
                      <span>{formatCurrency(plan.copay.specialist)}</span>
                    </div>
                  )}
                  {plan.copay.urgentCare && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Urgent Care:</span>
                      <span>{formatCurrency(plan.copay.urgentCare)}</span>
                    </div>
                  )}
                  {plan.copay.emergencyRoom && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Emergency Room:</span>
                      <span>{formatCurrency(plan.copay.emergencyRoom)}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Features */}
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
          </>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSelect} className="flex-1" variant={isSelected ? 'default' : 'outline'}>
            {isSelected ? 'Selected' : 'Select Plan'}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{plan.name} - Full Details</DialogTitle>
                <DialogDescription>{plan.provider}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Coverage Options</h3>
                  <div className="space-y-2">
                    {plan.coverageLevels.map((level) => (
                      <div key={level} className="flex justify-between text-sm p-2 bg-muted rounded">
                        <span>{level.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                        <span className="font-semibold">{formatCurrency(getEmployeeCost(level))}/mo</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">All Features</h3>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
