'use client';

import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PeriodSelectorProps {
  onSelect: (period: string, periodType: 'monthly' | 'quarterly') => void;
  isLoading?: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const MONTHS = [
  { value: '01', label: 'Jänner' },
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
  { value: 'Q1', label: 'Q1 (Jän-Mär)' },
  { value: 'Q2', label: 'Q2 (Apr-Jun)' },
  { value: 'Q3', label: 'Q3 (Jul-Sep)' },
  { value: 'Q4', label: 'Q4 (Okt-Dez)' },
];

export function PeriodSelector({ onSelect, isLoading }: PeriodSelectorProps) {
  const [year, setYear] = useState<string>(CURRENT_YEAR.toString());
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly'>('monthly');
  const [month, setMonth] = useState<string>('');
  const [quarter, setQuarter] = useState<string>('');

  const canContinue = periodType === 'monthly' ? !!month : !!quarter;

  const handleContinue = () => {
    const period = periodType === 'monthly'
      ? `${year}-${month}`
      : `${year}-${quarter}`;
    onSelect(period, periodType);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Zeitraum wählen
        </CardTitle>
        <CardDescription>
          Wählen Sie das Jahr und den Zeitraum für Ihre UVA-Meldung
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Year Selection */}
        <div className="space-y-2">
          <Label htmlFor="year">Steuerjahr</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger id="year">
              <SelectValue placeholder="Jahr auswählen" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Period Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="period-type">Meldezeitraum</Label>
          <Select
            value={periodType}
            onValueChange={(value) => {
              setPeriodType(value as 'monthly' | 'quarterly');
              setMonth('');
              setQuarter('');
            }}
          >
            <SelectTrigger id="period-type">
              <SelectValue placeholder="Zeitraum auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monatlich</SelectItem>
              <SelectItem value="quarterly">Quartalsweise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Month Selection (if monthly) */}
        {periodType === 'monthly' && (
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
        )}

        {/* Quarter Selection (if quarterly) */}
        {periodType === 'quarterly' && (
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

        <Button
          onClick={handleContinue}
          disabled={!canContinue || isLoading}
          className="w-full"
        >
          {isLoading ? 'Lädt...' : 'Weiter'}
        </Button>
      </CardContent>
    </Card>
  );
}
