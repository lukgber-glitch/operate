'use client';

import { useTranslations } from 'next-intl';

import { useState, useEffect } from 'react';
import { Plane } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculatorResult } from './CalculatorResult';
import { useTaxCalculators, Country } from '@/hooks/use-tax-calculators';

interface PerDiemCalculatorProps {
  country: Country;
}

export function PerDiemCalculator({ country }: PerDiemCalculatorProps) {
  const t = useTranslations('taxCalculators');
  const { config, calculatePerDiem, saveAsDeduction, isLoading } = useTaxCalculators(country);

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [international, setInternational] = useState(false);
  const [destination, setDestination] = useState('');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (startDate && endDate) {
      const calculation = calculatePerDiem(startDate, endDate, international);
      setResult(calculation);
    }
  }, [startDate, endDate, international, calculatePerDiem]);

  const handleSave = async () => {
    if (result) {
      await saveAsDeduction({ ...result, destination }, 'per_diem');
    }
  };

  const rates = international ? config.perDiemInternational : config.perDiemDomestic;

  return (
    <div className="space-y-6">
      <Card className="rounded-[16px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Per Diem / Meals Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trip Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Trip Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Trip End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <Label htmlFor="destination">{t('perDiem.destination')}</Label>
            <Input
              id="destination"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g., Munich, Germany or London, UK"
            />
          </div>

          {/* International Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="international">International Trip</Label>
              <p className="text-xs text-white/70">
                Different rates apply for international business travel
              </p>
            </div>
            <Switch
              id="international"
              checked={international}
              onCheckedChange={setInternational}
            />
          </div>

          {/* Rates Info */}
          <div className="grid gap-3 sm:grid-cols-2 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
            <div>
              <p className="text-xs text-blue-900/70 dark:text-blue-200/70">Full Day Rate</p>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                €{rates.fullDay.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-900/70 dark:text-blue-200/70">Partial Day Rate</p>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                €{rates.partialDay.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Calculation Breakdown */}
          {result && (
            <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
              <h4 className="text-sm font-medium text-white">Breakdown</h4>
              <div className="space-y-1 text-sm text-white/70">
                <div className="flex justify-between">
                  <span>Full Days ({result.fullDays}):</span>
                  <span>€{(result.fullDays * rates.fullDay).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Partial Days ({result.partialDays}):</span>
                  <span>€{(result.partialDays * rates.partialDay).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <CalculatorResult
          originalAmount={result.totalDeduction}
          deductibleAmount={result.totalDeduction}
          taxSavings={result.taxSavings}
          legalReference={{
            title: 'Per Diem and Meal Allowances',
            description: `Business travelers can claim per diem allowances for meals. ${international ? 'International' : 'Domestic'} rates apply. First and last days are considered partial days (€${rates.partialDay}), while intermediate days are full days (€${rates.fullDay}).`,
          }}
          requiredDocuments={[
            'Business trip itinerary or travel booking confirmation',
            'Employer authorization for business travel',
            'Receipt or proof of accommodation',
            international ? 'Flight tickets or border crossing documentation' : 'Travel expense report',
          ]}
          onSave={handleSave}
          isSaving={isLoading}
        />
      )}
    </div>
  );
}
