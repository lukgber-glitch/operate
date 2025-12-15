'use client';

import { useTranslations } from 'next-intl';

import { useState, useEffect } from 'react';
import { Navigation } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculatorResult } from './CalculatorResult';
import { useTaxCalculators, Country } from '@/hooks/use-tax-calculators';

interface MileageCalculatorProps {
  country: Country;
}

type VehicleType = 'car' | 'electricCar' | 'motorcycle' | 'bicycle';

const vehicleTypeLabels: Record<VehicleType, string> = {
  car: 'Car (Petrol/Diesel)',
  electricCar: 'Electric Car',
  motorcycle: 'Motorcycle',
  bicycle: 'Bicycle',
};

const vehicleTypeIcons: Record<VehicleType, string> = {
  car: '🚗',
  electricCar: '⚡',
  motorcycle: '🏍️',
  bicycle: '🚴',
};

export function MileageCalculator({ country }: MileageCalculatorProps) {
  const t = useTranslations('taxCalculators');
  const { config, calculateMileage, saveAsDeduction, isLoading } = useTaxCalculators(country);

  const [distance, setDistance] = useState(100);
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [tripPurpose, setTripPurpose] = useState('');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const calculation = calculateMileage(distance, vehicleType);
    setResult(calculation);
  }, [distance, vehicleType, calculateMileage]);

  const handleSave = async () => {
    if (result) {
      await saveAsDeduction({ ...result, tripPurpose }, 'mileage');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[16px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Business Mileage Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Distance Input */}
          <div className="space-y-2">
            <Label htmlFor="distance">Distance (km)</Label>
            <Input
              id="distance"
              type="number"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              min={0}
              step={0.1}
            />
          </div>

          {/* Vehicle Type */}
          <div className="space-y-2">
            <Label htmlFor="vehicleType">Vehicle Type</Label>
            <Select value={vehicleType} onValueChange={(val) => setVehicleType(val as VehicleType)}>
              <SelectTrigger id="vehicleType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(vehicleTypeLabels) as VehicleType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {vehicleTypeIcons[type]} {vehicleTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rates Display */}
          <div className="grid gap-3 sm:grid-cols-2 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
            <div>
              <p className="text-xs text-blue-900/70 dark:text-blue-200/70">Rate per km</p>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                €{config.mileageRates[vehicleType].toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-900/70 dark:text-blue-200/70">Total Distance</p>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                {distance.toLocaleString('de-DE', { minimumFractionDigits: 1 })} km
              </p>
            </div>
          </div>

          {/* Trip Purpose */}
          <div className="space-y-2">
            <Label htmlFor="tripPurpose">Trip Purpose / Description</Label>
            <Input
              id="tripPurpose"
              type="text"
              value={tripPurpose}
              onChange={(e) => setTripPurpose(e.target.value)}
              placeholder="e.g., Client meeting in Frankfurt"
            />
            <p className="text-xs text-white/70">
              Optional: Add a description to track this trip
            </p>
          </div>

          {/* All Vehicle Rates Comparison */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white">Rate Comparison</h4>
            <div className="space-y-2">
              {(Object.keys(config.mileageRates) as VehicleType[]).map((type) => (
                <div
                  key={type}
                  className={`flex items-center justify-between p-2 rounded ${
                    type === vehicleType
                      ? 'bg-blue-100 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-900/30'
                  }`}
                >
                  <span className="text-sm text-white">
                    {vehicleTypeIcons[type]} {vehicleTypeLabels[type]}
                  </span>
                  <span className="text-sm font-medium text-white">
                    €{config.mileageRates[type].toFixed(2)}/km
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <CalculatorResult
          originalAmount={result.deduction}
          deductibleAmount={result.deduction}
          taxSavings={result.taxSavings}
          legalReference={{
            title: 'Business Mileage Deduction',
            description: `Business-related vehicle use can be deducted at standard rates per kilometer. The rate for ${vehicleTypeLabels[vehicleType].toLowerCase()} is €${config.mileageRates[vehicleType]} per km. This covers fuel, maintenance, insurance, and depreciation.`,
          }}
          requiredDocuments={[
            'Driving log or mileage tracker',
            'Business trip justification (meeting invites, client details)',
            'Vehicle registration documents',
            'Starting and ending odometer readings (recommended)',
          ]}
          onSave={handleSave}
          isSaving={isLoading}
        />
      )}
    </div>
  );
}
