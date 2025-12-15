'use client';

import { useTranslations } from 'next-intl';

import { useState, useEffect } from 'react';
import { Home } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CalculatorResult } from './CalculatorResult';
import { useTaxCalculators, Country } from '@/hooks/use-tax-calculators';

interface HomeOfficeCalculatorProps {
  country: Country;
}

export function HomeOfficeCalculator({ country }: HomeOfficeCalculatorProps) {
  const t = useTranslations('taxCalculators');
  const {
    config,
    calculateHomeOfficeFlat,
    calculateHomeOfficeRoom,
    saveAsDeduction,
    isLoading,
  } = useTaxCalculators(country);

  // Flat rate states
  const [daysWorked, setDaysWorked] = useState(100);
  const [flatResult, setFlatResult] = useState<any>(null);

  // Dedicated room states
  const [roomSize, setRoomSize] = useState(15);
  const [totalHomeSize, setTotalHomeSize] = useState(80);
  const [monthlyRent, setMonthlyRent] = useState(1200);
  const [monthsUsed, setMonthsUsed] = useState(12);
  const [exclusiveUse, setExclusiveUse] = useState(true);
  const [roomResult, setRoomResult] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'flat' | 'room'>('flat');

  // Calculate flat rate
  useEffect(() => {
    const calculation = calculateHomeOfficeFlat(daysWorked);
    setFlatResult(calculation);
  }, [daysWorked, calculateHomeOfficeFlat]);

  // Calculate room deduction
  useEffect(() => {
    const calculation = calculateHomeOfficeRoom(
      roomSize,
      totalHomeSize,
      monthlyRent,
      monthsUsed,
      exclusiveUse
    );
    setRoomResult(calculation);
  }, [roomSize, totalHomeSize, monthlyRent, monthsUsed, exclusiveUse, calculateHomeOfficeRoom]);

  const handleSaveFlatRate = async () => {
    if (flatResult) {
      await saveAsDeduction(flatResult, 'home_office_flat');
    }
  };

  const handleSaveRoom = async () => {
    if (roomResult) {
      await saveAsDeduction(roomResult, 'home_office_room');
    }
  };

  const usagePercentage = Math.min((daysWorked / config.homeOfficeMaxDays) * 100, 100);
  const roomPercentage = (roomSize / totalHomeSize) * 100;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'flat' | 'room')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="flat">{t('homeOffice.flatRate')}</TabsTrigger>
          <TabsTrigger value="room">{t('homeOffice.dedicatedRoom')}</TabsTrigger>
        </TabsList>

        {/* {t('homeOffice.flatRate')} Tab */}
        <TabsContent value="flat" className="space-y-6">
          <Card className="rounded-[16px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Home Office {t('homeOffice.flatRate')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="daysWorked">Days Worked from Home This Year</Label>
                <Input
                  id="daysWorked"
                  type="number"
                  value={daysWorked}
                  onChange={(e) => setDaysWorked(Number(e.target.value))}
                  min={0}
                  max={365}
                />
                <p className="text-xs text-white/70">
                  {t('homeOffice.dailyRate')}: €{config.homeOfficeDailyRate.toFixed(2)} | Maximum: {config.homeOfficeMaxDays} days
                </p>
              </div>

              {/* Usage Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Annual Maximum Usage</span>
                  <span className="font-medium text-white">
                    {daysWorked} / {config.homeOfficeMaxDays} days ({usagePercentage.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                {daysWorked > config.homeOfficeMaxDays && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Warning: You've exceeded the maximum deductible days. Deduction will be capped at {config.homeOfficeMaxDays} days.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {flatResult && (
            <CalculatorResult
              originalAmount={daysWorked * config.homeOfficeDailyRate}
              deductibleAmount={flatResult.annualDeduction}
              taxSavings={flatResult.taxSavings}
              legalReference={{
                title: `Home Office ${t('homeOffice.flatRate')} Deduction`,
                description: `You can claim €${config.homeOfficeDailyRate} per day worked from home, up to ${config.homeOfficeMaxDays} days per year. This simplified method doesn't require detailed expense tracking.`,
              }}
              requiredDocuments={[
                'Calendar or logbook showing home office days',
                'Employer confirmation of remote work arrangement',
              ]}
              onSave={handleSaveFlatRate}
              isSaving={isLoading}
            />
          )}
        </TabsContent>

        {/* {t('homeOffice.dedicatedRoom')} Tab */}
        <TabsContent value="room" className="space-y-6">
          <Card className="rounded-[16px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Dedicated Office Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Room Sizes */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="roomSize">Office Room Size (sqm)</Label>
                  <Input
                    id="roomSize"
                    type="number"
                    value={roomSize}
                    onChange={(e) => setRoomSize(Number(e.target.value))}
                    min={1}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalHomeSize">Total Home Size (sqm)</Label>
                  <Input
                    id="totalHomeSize"
                    type="number"
                    value={totalHomeSize}
                    onChange={(e) => setTotalHomeSize(Number(e.target.value))}
                    min={1}
                    step={0.1}
                  />
                </div>
              </div>

              {/* Room Percentage Display */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  Office represents <strong>{roomPercentage.toFixed(1)}%</strong> of your home
                </p>
              </div>

              {/* Rent/Mortgage */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent/Mortgage (€)</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(Number(e.target.value))}
                    min={0}
                    step={0.01}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthsUsed">Months Used</Label>
                  <Input
                    id="monthsUsed"
                    type="number"
                    value={monthsUsed}
                    onChange={(e) => setMonthsUsed(Number(e.target.value))}
                    min={1}
                    max={12}
                  />
                </div>
              </div>

              {/* Exclusive Use Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="exclusiveUse">Exclusive Business Use</Label>
                  <p className="text-xs text-white/70">
                    Room is used only for work (100% deduction vs 50%)
                  </p>
                </div>
                <Switch
                  id="exclusiveUse"
                  checked={exclusiveUse}
                  onCheckedChange={setExclusiveUse}
                />
              </div>
            </CardContent>
          </Card>

          {roomResult && (
            <CalculatorResult
              originalAmount={monthlyRent * monthsUsed}
              deductibleAmount={roomResult.annualDeduction}
              taxSavings={roomResult.taxSavings}
              legalReference={{
                title: 'Dedicated Home Office Room Deduction',
                description: `You can deduct a portion of your rent/mortgage based on the room size. The deduction is ${exclusiveUse ? '100%' : '50%'} of the proportional costs because the room is ${exclusiveUse ? '' : 'not '}exclusively used for business.`,
              }}
              requiredDocuments={[
                'Rental or mortgage agreement',
                'Floor plan showing room measurements',
                'Utility bills (electricity, heating, internet)',
                exclusiveUse ? 'Photos or description proving exclusive business use' : 'Declaration of mixed-use space',
              ]}
              onSave={handleSaveRoom}
              isSaving={isLoading}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
