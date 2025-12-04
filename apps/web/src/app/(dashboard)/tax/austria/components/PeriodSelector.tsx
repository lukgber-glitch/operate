'use client';

import { Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  UVAPeriod,
  UVAFilingPeriod,
  UVAFiling,
  UVAFilingStatus,
} from '../hooks/useUVA';

interface PeriodSelectorProps {
  onSelect: (period: UVAPeriod, periodType: UVAFilingPeriod) => void;
  previousFilings?: UVAFiling[];
  isLoading?: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
  { value: 1, label: 'Jänner' },
  { value: 2, label: 'Februar' },
  { value: 3, label: 'März' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Dezember' },
];
const QUARTERS = [
  { value: 1, label: 'Q1 (Jän-Mär)', months: '1-3' },
  { value: 2, label: 'Q2 (Apr-Jun)', months: '4-6' },
  { value: 3, label: 'Q3 (Jul-Sep)', months: '7-9' },
  { value: 4, label: 'Q4 (Okt-Dez)', months: '10-12' },
];

export function PeriodSelector({ onSelect, previousFilings = [], isLoading }: PeriodSelectorProps) {
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [periodType, setPeriodType] = useState<UVAFilingPeriod>(UVAFilingPeriod.MONTHLY);
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [quarter, setQuarter] = useState<number | undefined>(undefined);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    // Validate selection
    if (periodType === UVAFilingPeriod.MONTHLY) {
      setCanContinue(!!month);
    } else {
      setCanContinue(!!quarter);
    }
  }, [periodType, month, quarter]);

  const handleContinue = () => {
    const period: UVAPeriod = {
      year,
      ...(periodType === UVAFilingPeriod.MONTHLY ? { month } : { quarter }),
    };
    onSelect(period, periodType);
  };

  const getPeriodStatus = (year: number, period: number, type: UVAFilingPeriod) => {
    const filing = previousFilings.find(
      f => f.year === year && f.period === period && f.periodType === type
    );
    return filing?.status;
  };

  const getStatusBadge = (status?: UVAFilingStatus) => {
    if (!status) return null;

    const variants: Record<UVAFilingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      [UVAFilingStatus.DRAFT]: { label: 'Entwurf', variant: 'secondary' },
      [UVAFilingStatus.SUBMITTED]: { label: 'Übermittelt', variant: 'default' },
      [UVAFilingStatus.ACCEPTED]: { label: 'Akzeptiert', variant: 'default' },
      [UVAFilingStatus.REJECTED]: { label: 'Abgelehnt', variant: 'destructive' },
      [UVAFilingStatus.ERROR]: { label: 'Fehler', variant: 'destructive' },
      [UVAFilingStatus.PENDING]: { label: 'Ausstehend', variant: 'outline' },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
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
            <Select
              value={year.toString()}
              onValueChange={(value) => setYear(parseInt(value))}
            >
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
                setPeriodType(value as UVAFilingPeriod);
                setMonth(undefined);
                setQuarter(undefined);
              }}
            >
              <SelectTrigger id="period-type">
                <SelectValue placeholder="Zeitraum auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UVAFilingPeriod.MONTHLY}>Monatlich</SelectItem>
                <SelectItem value={UVAFilingPeriod.QUARTERLY}>Quartalsweise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Month Selection (if monthly) */}
          {periodType === UVAFilingPeriod.MONTHLY && (
            <div className="space-y-2">
              <Label htmlFor="month">Monat</Label>
              <Select
                value={month?.toString()}
                onValueChange={(value) => setMonth(parseInt(value))}
              >
                <SelectTrigger id="month">
                  <SelectValue placeholder="Monat auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => {
                    const status = getPeriodStatus(year, m.value, UVAFilingPeriod.MONTHLY);
                    return (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{m.label}</span>
                          {status && <span className="ml-2">{getStatusBadge(status)}</span>}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quarter Selection (if quarterly) */}
          {periodType === UVAFilingPeriod.QUARTERLY && (
            <div className="space-y-2">
              <Label htmlFor="quarter">Quartal</Label>
              <Select
                value={quarter?.toString()}
                onValueChange={(value) => setQuarter(parseInt(value))}
              >
                <SelectTrigger id="quarter">
                  <SelectValue placeholder="Quartal auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {QUARTERS.map((q) => {
                    const status = getPeriodStatus(year, q.value, UVAFilingPeriod.QUARTERLY);
                    return (
                      <SelectItem key={q.value} value={q.value.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div>{q.label}</div>
                            <div className="text-xs text-muted-foreground">Monate {q.months}</div>
                          </div>
                          {status && <span className="ml-2">{getStatusBadge(status)}</span>}
                        </div>
                      </SelectItem>
                    );
                  })}
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

      {/* Previous Filings */}
      {previousFilings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Letzte Meldungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {previousFilings.slice(0, 5).map((filing) => (
                <div
                  key={filing.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {filing.year} - {filing.periodType === UVAFilingPeriod.MONTHLY ? 'Monat' : 'Quartal'} {filing.period}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Übermittelt: {filing.submittedAt ? new Date(filing.submittedAt).toLocaleDateString('de-AT') : 'Nicht übermittelt'}
                    </div>
                  </div>
                  {getStatusBadge(filing.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
