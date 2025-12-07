/**
 * ELSTER Period Selector Component
 * Allows user to select monthly or quarterly VAT return period
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertTriangle } from 'lucide-react';
import { format, addMonths, isAfter, isBefore, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface PeriodSelectorProps {
  onSelect: (period: string, periodType: 'monthly' | 'quarterly') => void;
  isLoading?: boolean;
  selectedPeriod?: string;
  selectedPeriodType?: 'monthly' | 'quarterly';
}

const MONTHS = [
  { value: '01', label: 'Januar' },
  { value: '02', label: 'Februar' },
  { value: '03', label: 'März' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Dezember' },
];

const QUARTERS = [
  { value: 'Q1', label: '1. Quartal (Jan-März)' },
  { value: 'Q2', label: '2. Quartal (Apr-Jun)' },
  { value: 'Q3', label: '3. Quartal (Jul-Sep)' },
  { value: 'Q4', label: '4. Quartal (Okt-Dez)' },
];

export function PeriodSelector({
  onSelect,
  isLoading = false,
  selectedPeriod = '',
  selectedPeriodType = 'monthly',
}: PeriodSelectorProps) {
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly'>(selectedPeriodType);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>(selectedPeriod.split('-')[1] || '');
  const [quarter, setQuarter] = useState<string>(selectedPeriod.split('-')[1] || '');

  // Generate year options (current year + 2 previous years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // Calculate deadline for the selected period
  const getDeadline = () => {
    if (!year) return null;

    if (periodType === 'monthly' && month) {
      // Monthly deadline: 10th of the following month
      const periodDate = parseISO(`${year}-${month}-01`);
      const deadline = addMonths(periodDate, 1);
      deadline.setDate(10);
      return deadline;
    }

    if (periodType === 'quarterly' && quarter) {
      // Quarterly deadline: 10th of the month following the quarter end
      const quarterEndMonth = parseInt(quarter.substring(1)) * 3;
      const periodDate = parseISO(`${year}-${quarterEndMonth.toString().padStart(2, '0')}-01`);
      const deadline = addMonths(periodDate, 1);
      deadline.setDate(10);
      return deadline;
    }

    return null;
  };

  const deadline = getDeadline();
  const isApproachingDeadline = deadline ? isAfter(new Date(), addMonths(deadline, -1)) && isBefore(new Date(), deadline) : false;
  const isPastDeadline = deadline ? isAfter(new Date(), deadline) : false;

  const handleContinue = () => {
    const period = periodType === 'monthly'
      ? `${year}-${month}`
      : `${year}-${quarter}`;

    if (!year || (periodType === 'monthly' && !month) || (periodType === 'quarterly' && !quarter)) {
      return;
    }

    onSelect(period, periodType);
  };

  const canContinue = year && ((periodType === 'monthly' && month) || (periodType === 'quarterly' && quarter));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Zeitraum auswählen
        </CardTitle>
        <CardDescription>
          Wählen Sie den Zeitraum für Ihre Umsatzsteuervoranmeldung
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Period Type Selection */}
        <div className="space-y-3">
          <Label>Meldezeitraum</Label>
          <RadioGroup
            value={periodType}
            onValueChange={(value) => setPeriodType(value as 'monthly' | 'quarterly')}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="monthly" id="monthly" />
              <Label htmlFor="monthly" className="cursor-pointer font-normal">
                Monatlich
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="quarterly" id="quarterly" />
              <Label htmlFor="quarterly" className="cursor-pointer font-normal">
                Vierteljährlich
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Year Selection */}
        <div className="space-y-2">
          <Label htmlFor="year">Jahr</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger id="year">
              <SelectValue placeholder="Jahr auswählen" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month/Quarter Selection */}
        {periodType === 'monthly' ? (
          <div className="space-y-2">
            <Label htmlFor="month">Monat</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger id="month">
                <SelectValue placeholder="Monat auswählen" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="quarter">Quartal</Label>
            <Select value={quarter} onValueChange={setQuarter}>
              <SelectTrigger id="quarter">
                <SelectValue placeholder="Quartal auswählen" />
              </SelectTrigger>
              <SelectContent>
                {QUARTERS.map((q) => (
                  <SelectItem key={q.value} value={q.value}>
                    {q.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Deadline Warning */}
        {deadline && (
          <Alert variant={isPastDeadline ? 'destructive' : isApproachingDeadline ? 'default' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isPastDeadline ? (
                <>
                  <strong>Abgabefrist überschritten!</strong> Die Frist für diesen Zeitraum ist am{' '}
                  {format(deadline, 'dd. MMMM yyyy', { locale: de })} abgelaufen.
                  Verspätungszuschläge können anfallen.
                </>
              ) : isApproachingDeadline ? (
                <>
                  <strong>Frist läuft bald ab:</strong> Abgabefrist ist am{' '}
                  {format(deadline, 'dd. MMMM yyyy', { locale: de })}.
                </>
              ) : (
                <>
                  Abgabefrist: {format(deadline, 'dd. MMMM yyyy', { locale: de })}
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Continue Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleContinue}
            disabled={!canContinue || isLoading}
            size="lg"
          >
            {isLoading ? 'Wird geladen...' : 'Weiter'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
