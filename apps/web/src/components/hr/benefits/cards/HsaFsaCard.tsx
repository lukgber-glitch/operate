'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Wallet, Info, AlertCircle } from 'lucide-react';
import { BenefitType } from '@/types/benefits';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HsaFsaCardProps {
  onSelect: (type: 'hsa' | 'fsa', healthcareAmount: number, dependentCareAmount?: number) => void;
  selectedType?: 'hsa' | 'fsa';
  selectedHealthcareAmount?: number;
  selectedDependentCareAmount?: number;
  isSelected?: boolean;
  hasHdhp?: boolean; // High Deductible Health Plan - required for HSA
}

export function HsaFsaCard({
  onSelect,
  selectedType,
  selectedHealthcareAmount = 0,
  selectedDependentCareAmount = 0,
  isSelected = false,
  hasHdhp = true,
}: HsaFsaCardProps) {
  const [accountType, setAccountType] = useState<'hsa' | 'fsa'>(selectedType || 'hsa');
  const [hsaAmount, setHsaAmount] = useState(selectedHealthcareAmount);
  const [fsaHealthcare, setFsaHealthcare] = useState(selectedHealthcareAmount);
  const [fsaDependentCare, setFsaDependentCare] = useState(selectedDependentCareAmount);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const hsaLimits = {
    individual: 4150,
    family: 8300,
    catchUp: 1000, // Age 55+
  };

  const fsaLimits = {
    healthcare: 3200,
    dependentCare: 5000,
  };

  const employerHsaContribution = 500; // Mock employer contribution

  const calculateTaxSavings = (amount: number, taxRate: number = 0.25) => {
    return amount * taxRate;
  };

  const handleSelect = () => {
    if (accountType === 'hsa') {
      onSelect('hsa', hsaAmount, 0);
    } else {
      onSelect('fsa', fsaHealthcare, fsaDependentCare);
    }
  };

  const currentAmount = accountType === 'hsa' ? hsaAmount : fsaHealthcare;
  const contributionPerPaycheck = currentAmount / 26; // biweekly
  const estimatedTaxSavings = calculateTaxSavings(currentAmount);

  return (
    <Card className={isSelected ? 'border-primary border-2' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-500" />
              Health Savings Accounts
            </CardTitle>
            <CardDescription>Tax-advantaged healthcare savings</CardDescription>
          </div>
          {isSelected && (
            <Badge variant="default" className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Selected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasHdhp && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              HSA requires enrollment in a High Deductible Health Plan (HDHP). Consider enrolling in an FSA instead.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={accountType} onValueChange={(value) => setAccountType(value as 'hsa' | 'fsa')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hsa" disabled={!hasHdhp}>
              HSA {!hasHdhp && '(Not Available)'}
            </TabsTrigger>
            <TabsTrigger value="fsa">FSA</TabsTrigger>
          </TabsList>

          {/* HSA Tab */}
          <TabsContent value="hsa" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Health Savings Account (HSA)</h4>
                <Badge variant="outline" className="text-xs">Triple Tax Advantage</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Save pre-tax dollars for current and future healthcare expenses. Funds roll over year to year and are yours to keep.
              </p>
            </div>

            {/* Employer Contribution */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-900">Employer Contribution</span>
                <span className="text-lg font-bold text-green-700">
                  {formatCurrency(employerHsaContribution)}
                </span>
              </div>
              <p className="text-xs text-green-700 mt-1">Free money added to your HSA annually!</p>
            </div>

            {/* Contribution Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="hsa-amount">Your Annual Contribution</Label>
                <span className="text-sm font-semibold">{formatCurrency(hsaAmount)}</span>
              </div>
              <Input
                id="hsa-amount"
                type="range"
                min="0"
                max={hsaLimits.individual}
                step="50"
                value={hsaAmount}
                onChange={(e) => setHsaAmount(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$0</span>
                <span>Max: {formatCurrency(hsaLimits.individual)}</span>
              </div>

              <div className="mt-2">
                <Label htmlFor="hsa-amount-input" className="sr-only">
                  HSA Amount
                </Label>
                <Input
                  id="hsa-amount-input"
                  type="number"
                  min="0"
                  max={hsaLimits.individual}
                  step="50"
                  value={hsaAmount}
                  onChange={(e) => setHsaAmount(Math.min(parseFloat(e.target.value) || 0, hsaLimits.individual))}
                  placeholder="Enter amount"
                />
              </div>
            </div>

            <Separator />

            {/* Benefits Summary */}
            <div className="space-y-2 bg-muted p-4 rounded-lg">
              <h4 className="font-semibold text-sm">Your HSA Summary</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your contribution:</span>
                  <span className="font-semibold">{formatCurrency(hsaAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Employer contribution:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(employerHsaContribution)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="font-semibold">Total annual funding:</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(hsaAmount + employerHsaContribution)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t mt-2">
                  <span className="text-muted-foreground">Per paycheck:</span>
                  <span className="font-semibold">{formatCurrency(hsaAmount / 26)}</span>
                </div>
              </div>
            </div>

            {/* HSA Features */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">HSA Advantages</h4>
              <ul className="space-y-1">
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Contributions are tax-deductible</span>
                </li>
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Earnings grow tax-free</span>
                </li>
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Withdrawals for qualified expenses are tax-free</span>
                </li>
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Funds roll over year after year</span>
                </li>
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Account is yours - portable if you change jobs</span>
                </li>
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Can invest funds once balance reaches threshold</span>
                </li>
              </ul>
            </div>
          </TabsContent>

          {/* FSA Tab */}
          <TabsContent value="fsa" className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Flexible Spending Account (FSA)</h4>
              <p className="text-sm text-muted-foreground">
                Save pre-tax dollars for healthcare and dependent care expenses. Use it or lose it - funds don't roll over.
              </p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                FSA funds must be used within the plan year. Plan carefully to avoid forfeiting unused funds.
              </AlertDescription>
            </Alert>

            {/* Healthcare FSA */}
            <div className="space-y-2">
              <Label htmlFor="fsa-healthcare">Healthcare FSA</Label>
              <Input
                id="fsa-healthcare"
                type="range"
                min="0"
                max={fsaLimits.healthcare}
                step="50"
                value={fsaHealthcare}
                onChange={(e) => setFsaHealthcare(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$0</span>
                <span>Max: {formatCurrency(fsaLimits.healthcare)}</span>
              </div>
              <Input
                type="number"
                min="0"
                max={fsaLimits.healthcare}
                step="50"
                value={fsaHealthcare}
                onChange={(e) =>
                  setFsaHealthcare(Math.min(parseFloat(e.target.value) || 0, fsaLimits.healthcare))
                }
                placeholder="Enter healthcare FSA amount"
              />
            </div>

            {/* Dependent Care FSA */}
            <div className="space-y-2">
              <Label htmlFor="fsa-dependent">Dependent Care FSA</Label>
              <p className="text-xs text-muted-foreground">For childcare, daycare, or adult care expenses</p>
              <Input
                id="fsa-dependent"
                type="range"
                min="0"
                max={fsaLimits.dependentCare}
                step="50"
                value={fsaDependentCare}
                onChange={(e) => setFsaDependentCare(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$0</span>
                <span>Max: {formatCurrency(fsaLimits.dependentCare)}</span>
              </div>
              <Input
                type="number"
                min="0"
                max={fsaLimits.dependentCare}
                step="50"
                value={fsaDependentCare}
                onChange={(e) =>
                  setFsaDependentCare(Math.min(parseFloat(e.target.value) || 0, fsaLimits.dependentCare))
                }
                placeholder="Enter dependent care FSA amount"
              />
            </div>

            <Separator />

            {/* FSA Summary */}
            <div className="space-y-2 bg-muted p-4 rounded-lg">
              <h4 className="font-semibold text-sm">Your FSA Summary</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Healthcare FSA:</span>
                  <span className="font-semibold">{formatCurrency(fsaHealthcare)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dependent Care FSA:</span>
                  <span className="font-semibold">{formatCurrency(fsaDependentCare)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="font-semibold">Total annual contribution:</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(fsaHealthcare + fsaDependentCare)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t mt-2">
                  <span className="text-muted-foreground">Per paycheck:</span>
                  <span className="font-semibold">
                    {formatCurrency((fsaHealthcare + fsaDependentCare) / 26)}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Tax Savings Estimate */}
        <Alert className="bg-green-50 border-green-200">
          <Info className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>Estimated tax savings:</strong> {formatCurrency(estimatedTaxSavings)} per year
            <span className="block text-xs mt-1">(Based on 25% tax bracket)</span>
          </AlertDescription>
        </Alert>

        <Button onClick={handleSelect} className="w-full" variant={isSelected ? 'default' : 'outline'}>
          {isSelected ? 'Selected' : 'Select Account'}
        </Button>
      </CardContent>
    </Card>
  );
}
