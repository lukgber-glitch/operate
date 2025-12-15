'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Calculator, ArrowLeft, Globe, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animation-variants';

import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Country, COUNTRY_CONFIGS } from '@/hooks/use-tax-calculators';

// Dynamic imports with ssr: false to avoid prerender errors with useTranslations
const CommuterCalculator = dynamic(
  () => import('@/components/tax/calculators').then((mod) => mod.CommuterCalculator),
  { ssr: false, loading: () => <CalculatorLoading /> }
);
const HomeOfficeCalculator = dynamic(
  () => import('@/components/tax/calculators').then((mod) => mod.HomeOfficeCalculator),
  { ssr: false, loading: () => <CalculatorLoading /> }
);
const PerDiemCalculator = dynamic(
  () => import('@/components/tax/calculators').then((mod) => mod.PerDiemCalculator),
  { ssr: false, loading: () => <CalculatorLoading /> }
);
const MileageCalculator = dynamic(
  () => import('@/components/tax/calculators').then((mod) => mod.MileageCalculator),
  { ssr: false, loading: () => <CalculatorLoading /> }
);
const TrainingCalculator = dynamic(
  () => import('@/components/tax/calculators').then((mod) => mod.TrainingCalculator),
  { ssr: false, loading: () => <CalculatorLoading /> }
);

function CalculatorLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-white/50" />
    </div>
  );
}

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    EUR: '€',
    GBP: '£',
    SEK: 'kr',
    JPY: '¥',
    SAR: 'SR',
    INR: '₹',
  };
  return symbols[currency] || currency;
};

const formatAmount = (amount: number, currency: string): string => {
  const symbol = getCurrencySymbol(currency);
  // For SEK, JPY, SAR, INR - no decimals as they typically use whole numbers
  if (['SEK', 'JPY', 'SAR', 'INR'].includes(currency)) {
    return `${symbol}${amount.toFixed(0)}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
};

// Static text labels
const labels = {
  title: 'Tax Calculators',
  subtitle: 'Calculate tax deductions and allowances',
  tabs: {
    commuter: 'Commuter',
    homeOffice: 'Home Office',
    perDiem: 'Per Diem',
    mileage: 'Mileage',
    training: 'Training',
    info: 'Info',
  },
};

export default function TaxCalculatorsPage() {
  const t = labels;
  const currentYear = new Date().getFullYear();
  const [country, setCountry] = useState<Country>('AT');
  const [taxYear, setTaxYear] = useState(currentYear.toString());

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tax/deductions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl text-white font-semibold tracking-tight flex items-center gap-2">
              <Calculator className="h-6 w-6" />
              {t.title}
            </h1>
            <p className="text-white/70">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Country and Year Selectors */}
        <div className="flex gap-2">
          <Select value={country} onValueChange={(val) => setCountry(val as Country)}>
            <SelectTrigger className="w-[160px]">
              <Globe className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(COUNTRY_CONFIGS) as Country[]).map((code) => (
                <SelectItem key={code} value={code}>
                  {COUNTRY_CONFIGS[code].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={taxYear} onValueChange={setTaxYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Calculator Tabs */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <GlassCard padding="lg">
            <Tabs defaultValue="commuter" className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
                <TabsTrigger value="commuter" className="text-xs sm:text-sm">
                  {t.tabs.commuter}
                </TabsTrigger>
                <TabsTrigger value="homeoffice" className="text-xs sm:text-sm">
                  {t.tabs.homeOffice}
                </TabsTrigger>
                <TabsTrigger value="perdiem" className="text-xs sm:text-sm">
                  {t.tabs.perDiem}
                </TabsTrigger>
                <TabsTrigger value="mileage" className="text-xs sm:text-sm">
                  {t.tabs.mileage}
                </TabsTrigger>
                <TabsTrigger value="training" className="text-xs sm:text-sm">
                  {t.tabs.training}
                </TabsTrigger>
                <TabsTrigger value="info" className="text-xs sm:text-sm">
                  {t.tabs.info}
                </TabsTrigger>
              </TabsList>

              {/* Commuter Allowance */}
              <TabsContent value="commuter">
                <CommuterCalculator country={country} />
              </TabsContent>

              {/* Home Office */}
              <TabsContent value="homeoffice">
                <HomeOfficeCalculator country={country} />
              </TabsContent>

              {/* Per Diem */}
              <TabsContent value="perdiem">
                <PerDiemCalculator country={country} />
              </TabsContent>

              {/* Business Mileage */}
              <TabsContent value="mileage">
                <MileageCalculator country={country} />
              </TabsContent>

              {/* Training */}
              <TabsContent value="training">
                <TrainingCalculator country={country} />
              </TabsContent>

              {/* Info Tab */}
              <TabsContent value="info">
                <div className="space-y-6">
                  {/* Special message for Saudi Arabia */}
                  {(COUNTRY_CONFIGS[country] as any).noPersonalIncomeTax && (
                    <GlassCard className="rounded-[16px] border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                          ℹ️ No Personal Income Tax
                        </h3>
                        <p className="text-sm text-blue-900/80 dark:text-blue-200/80">
                          {(COUNTRY_CONFIGS[country] as any).message}
                        </p>
                      </CardContent>
                    </GlassCard>
                  )}

                  <GlassCard className="rounded-[16px]">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white">
                        About Tax Deduction Calculators
                      </h3>
                      <p className="text-white/70">
                        These calculators help you estimate tax deductions based on
                        current tax laws in {COUNTRY_CONFIGS[country].name}. Use them to:
                      </p>
                      <ul className="space-y-2 text-white/70">
                        <li className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40" />
                          Calculate potential tax savings before filing
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40" />
                          Compare different deduction methods (e.g., flat rate vs. actual expenses)
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40" />
                          Generate deduction entries directly in your account
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40" />
                          Understand required documentation for each deduction type
                        </li>
                      </ul>
                    </CardContent>
                  </GlassCard>

                  <GlassCard className="rounded-[16px]">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white">
                        Tax Rates for {COUNTRY_CONFIGS[country].name} ({taxYear})
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Commuter */}
                        {COUNTRY_CONFIGS[country].commuterRate > 0 && (
                          <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                            <p className="text-sm font-medium text-white mb-2">
                              🚗 Commuter Allowance
                            </p>
                            <p className="text-lg font-bold text-white">
                              {formatAmount(COUNTRY_CONFIGS[country].commuterRate, COUNTRY_CONFIGS[country].currency)}/km
                            </p>
                          </div>
                        )}

                        {/* Home Office */}
                        {COUNTRY_CONFIGS[country].homeOfficeDailyRate > 0 && (
                          <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                            <p className="text-sm font-medium text-white mb-2">
                              🏠 Home Office (Flat Rate)
                            </p>
                            <p className="text-lg font-bold text-white">
                              {formatAmount(COUNTRY_CONFIGS[country].homeOfficeDailyRate, COUNTRY_CONFIGS[country].currency)}/day
                            </p>
                            <p className="text-xs text-white/70 mt-1">
                              Max {COUNTRY_CONFIGS[country].homeOfficeMaxDays} days/year
                            </p>
                          </div>
                        )}

                        {/* Per Diem Domestic */}
                        {COUNTRY_CONFIGS[country].perDiemDomestic.fullDay > 0 && (
                          <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                            <p className="text-sm font-medium text-white mb-2">
                              🍽️ Per Diem (Domestic)
                            </p>
                            <p className="text-lg font-bold text-white">
                              {formatAmount(COUNTRY_CONFIGS[country].perDiemDomestic.fullDay, COUNTRY_CONFIGS[country].currency)}/day
                            </p>
                            <p className="text-xs text-white/70 mt-1">
                              Partial: {formatAmount(COUNTRY_CONFIGS[country].perDiemDomestic.partialDay, COUNTRY_CONFIGS[country].currency)}
                            </p>
                          </div>
                        )}

                        {/* Per Diem International */}
                        {COUNTRY_CONFIGS[country].perDiemInternational.fullDay > 0 && (
                          <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                            <p className="text-sm font-medium text-white mb-2">
                              ✈️ Per Diem (International)
                            </p>
                            <p className="text-lg font-bold text-white">
                              {formatAmount(COUNTRY_CONFIGS[country].perDiemInternational.fullDay, COUNTRY_CONFIGS[country].currency)}/day
                            </p>
                            <p className="text-xs text-white/70 mt-1">
                              Partial: {formatAmount(COUNTRY_CONFIGS[country].perDiemInternational.partialDay, COUNTRY_CONFIGS[country].currency)}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </GlassCard>

                  <GlassCard className="rounded-[16px]">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white">
                        Business Mileage Rates
                      </h3>
                      <div className="space-y-2">
                        {COUNTRY_CONFIGS[country].mileageRates.car > 0 && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded">
                            <span className="text-white">🚗 Car (Petrol/Diesel)</span>
                            <span className="font-semibold text-white">
                              {formatAmount(COUNTRY_CONFIGS[country].mileageRates.car, COUNTRY_CONFIGS[country].currency)}/km
                            </span>
                          </div>
                        )}
                        {COUNTRY_CONFIGS[country].mileageRates.electricCar > 0 && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded">
                            <span className="text-white">⚡ Electric Car</span>
                            <span className="font-semibold text-white">
                              {formatAmount(COUNTRY_CONFIGS[country].mileageRates.electricCar, COUNTRY_CONFIGS[country].currency)}/km
                            </span>
                          </div>
                        )}
                        {COUNTRY_CONFIGS[country].mileageRates.motorcycle > 0 && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded">
                            <span className="text-white">🏍️ Motorcycle</span>
                            <span className="font-semibold text-white">
                              {formatAmount(COUNTRY_CONFIGS[country].mileageRates.motorcycle, COUNTRY_CONFIGS[country].currency)}/km
                            </span>
                          </div>
                        )}
                        {COUNTRY_CONFIGS[country].mileageRates.bicycle > 0 && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded">
                            <span className="text-white">🚴 Bicycle</span>
                            <span className="font-semibold text-white">
                              {formatAmount(COUNTRY_CONFIGS[country].mileageRates.bicycle, COUNTRY_CONFIGS[country].currency)}/km
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </GlassCard>

                  <GlassCard className="rounded-[16px] border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/30">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                        ⚠️ Important Disclaimer
                      </h3>
                      <p className="text-sm text-yellow-900/80 dark:text-yellow-200/80">
                        These calculators provide estimates based on standard tax rates and
                        regulations. Actual deductions may vary based on your specific tax
                        situation, income level, and local regulations. Always consult with
                        a tax professional or accountant before filing your taxes. Tax laws
                        change frequently - ensure you're using current year rates.
                      </p>
                    </CardContent>
                  </GlassCard>
                </div>
              </TabsContent>
            </Tabs>
        </GlassCard>
      </motion.div>
    </div>
  );
}
