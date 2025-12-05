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
  TaxPeriod,
  VATFilingPeriod,
  ElsterFiling,
  ElsterFilingStatus,
} from '@/hooks/use-tax-filing';

interface PeriodSelectorProps {
  onSelect: (period: TaxPeriod, periodType: VATFilingPeriod) => void;
  previousFilings?: ElsterFiling[];
  isLoading?: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];
const QUARTERS = [
  { value: 1, label: 'Q1 (Jan-Mar)', months: '1-3' },
  { value: 2, label: 'Q2 (Apr-Jun)', months: '4-6' },
  { value: 3, label: 'Q3 (Jul-Sep)', months: '7-9' },
  { value: 4, label: 'Q4 (Oct-Dec)', months: '10-12' },
];

export function PeriodSelector({ onSelect, previousFilings = [], isLoading }: PeriodSelectorProps) {
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [periodType, setPeriodType] = useState<VATFilingPeriod>(VATFilingPeriod.MONTHLY);
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [quarter, setQuarter] = useState<number | undefined>(undefined);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    // Validate selection
    if (periodType === VATFilingPeriod.MONTHLY) {
      setCanContinue(!!month);
    } else {
      setCanContinue(!!quarter);
    }
  }, [periodType, month, quarter]);

  const handleContinue = () => {
    const period: TaxPeriod = {
      year,
      ...(periodType === VATFilingPeriod.MONTHLY ? { month } : { quarter }),
    };
    onSelect(period, periodType);
  };

  const getPeriodStatus = (year: number, period: number, type: VATFilingPeriod) => {
    const filing = previousFilings.find(
      f => f.year === year && f.period === period && f.periodType === type
    );
    return filing?.status;
  };

  const getStatusBadge = (status?: ElsterFilingStatus) => {
    if (!status) return null;

    const variants: Record<ElsterFilingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      [ElsterFilingStatus.DRAFT]: { label: 'Draft', variant: 'secondary' },
      [ElsterFilingStatus.SUBMITTED]: { label: 'Submitted', variant: 'default' },
      [ElsterFilingStatus.ACCEPTED]: { label: 'Accepted', variant: 'default' },
      [ElsterFilingStatus.REJECTED]: { label: 'Rejected', variant: 'destructive' },
      [ElsterFilingStatus.ERROR]: { label: 'Error', variant: 'destructive' },
      [ElsterFilingStatus.PENDING]: { label: 'Pending', variant: 'outline' },
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
            Select Filing Period
          </CardTitle>
          <CardDescription>
            Choose the year and period for your VAT return (Umsatzsteuervoranmeldung)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Year Selection */}
          <div className="space-y-2">
            <Label htmlFor="year">Tax Year</Label>
            <Select
              value={year.toString()}
              onValueChange={(value) => setYear(parseInt(value))}
            >
              <SelectTrigger id="year">
                <SelectValue placeholder="Select year" />
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
            <Label htmlFor="period-type">Filing Period</Label>
            <Select
              value={periodType}
              onValueChange={(value) => {
                setPeriodType(value as VATFilingPeriod);
                setMonth(undefined);
                setQuarter(undefined);
              }}
            >
              <SelectTrigger id="period-type">
                <SelectValue placeholder="Select period type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VATFilingPeriod.MONTHLY}>Monthly</SelectItem>
                <SelectItem value={VATFilingPeriod.QUARTERLY}>Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Month Selection (if monthly) */}
          {periodType === VATFilingPeriod.MONTHLY && (
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select
                value={month?.toString()}
                onValueChange={(value) => setMonth(parseInt(value))}
              >
                <SelectTrigger id="month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => {
                    const status = getPeriodStatus(year, m.value, VATFilingPeriod.MONTHLY);
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
          {periodType === VATFilingPeriod.QUARTERLY && (
            <div className="space-y-2">
              <Label htmlFor="quarter">Quarter</Label>
              <Select
                value={quarter?.toString()}
                onValueChange={(value) => setQuarter(parseInt(value))}
              >
                <SelectTrigger id="quarter">
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  {QUARTERS.map((q) => {
                    const status = getPeriodStatus(year, q.value, VATFilingPeriod.QUARTERLY);
                    return (
                      <SelectItem key={q.value} value={q.value.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div>{q.label}</div>
                            <div className="text-xs text-muted-foreground">Months {q.months}</div>
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
            {isLoading ? 'Loading...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>

      {/* Previous Filings */}
      {previousFilings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Filings</CardTitle>
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
                      {filing.year} - {filing.periodType === VATFilingPeriod.MONTHLY ? 'Month' : 'Quarter'} {filing.period}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Submitted: {filing.submittedAt ? new Date(filing.submittedAt).toLocaleDateString() : 'Not submitted'}
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
