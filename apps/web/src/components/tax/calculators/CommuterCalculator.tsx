'use client';

import { useTranslations } from 'next-intl';

import { useState, useEffect } from 'react';
import { Car } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculatorResult } from './CalculatorResult';
import { useTaxCalculators, Country } from '@/hooks/use-tax-calculators';

interface CommuterCalculatorProps {
  country: Country;
}

export function CommuterCalculator({ country }: CommuterCalculatorProps) {
  const t = useTranslations('taxCalculators');
  const { calculateCommuter, saveAsDeduction, isLoading } = useTaxCalculators(country);

  const [distance, setDistance] = useState(20);
  const [workingDays, setWorkingDays] = useState(220);
  const [usePublicTransport, setUsePublicTransport] = useState(false);
  const [publicTransportCost, setPublicTransportCost] = useState(0);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const calculation = calculateCommuter(
      distance,
      workingDays,
      usePublicTransport,
      publicTransportCost
    );
    setResult(calculation);
  }, [distance, workingDays, usePublicTransport, publicTransportCost, calculateCommuter]);

  const handleSave = async () => {
    if (result) {
      await saveAsDeduction(result, 'commuter');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[16px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Commuter Allowance Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Distance Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="distance">Distance to Work (km)</Label>
              <span className="text-sm font-medium text-white">{distance} km</span>
            </div>
            <Slider
              id="distance"
              min={1}
              max={100}
              step={1}
              value={[distance]}
              onValueChange={([value]) => setDistance(value ?? 1)}
              className="w-full"
            />
            <Input
              type="number"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              min={1}
              max={200}
              className="mt-2"
            />
          </div>

          {/* Working Days */}
          <div className="space-y-2">
            <Label htmlFor="workingDays">Working Days per Year</Label>
            <Input
              id="workingDays"
              type="number"
              value={workingDays}
              onChange={(e) => setWorkingDays(Number(e.target.value))}
              min={1}
              max={365}
            />
            <p className="text-xs text-white/70">
              Default is 220 days (52 weeks × 5 days - holidays)
            </p>
          </div>

          {/* Public Transport Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="publicTransport">Use Public Transport</Label>
              <p className="text-xs text-white/70">
                Calculate based on monthly ticket cost instead
              </p>
            </div>
            <Switch
              id="publicTransport"
              checked={usePublicTransport}
              onCheckedChange={setUsePublicTransport}
            />
          </div>

          {/* Public Transport Cost */}
          {usePublicTransport && (
            <div className="space-y-2">
              <Label htmlFor="ticketCost">Monthly Ticket Cost (€)</Label>
              <Input
                id="ticketCost"
                type="number"
                value={publicTransportCost}
                onChange={(e) => setPublicTransportCost(Number(e.target.value))}
                min={0}
                step={0.01}
                placeholder="0.00"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <CalculatorResult
          originalAmount={result.annualDeduction}
          deductibleAmount={result.annualDeduction}
          taxSavings={result.taxSavings}
          legalReference={{
            title: 'Commuter Allowance Regulations',
            description: 'Commuters can deduct travel expenses between home and work. The deduction is calculated based on the distance and number of working days, or actual public transport costs.',
          }}
          requiredDocuments={[
            'Employment contract or employer confirmation',
            'Address proof (residence registration)',
            usePublicTransport
              ? 'Public transport ticket receipts or annual pass'
              : 'Calculation of distance (e.g., via mapping service)',
          ]}
          onSave={handleSave}
          isSaving={isLoading}
        />
      )}
    </div>
  );
}
