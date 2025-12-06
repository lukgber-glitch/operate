'use client';

import { useState } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PeriodSelectorProps {
  onPeriodSelected: (year: number, month: number) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function PeriodSelector({ onPeriodSelected }: PeriodSelectorProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth > 1 ? currentMonth - 1 : 12);

  // Generate last 3 years
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const handleSubmit = () => {
    onPeriodSelected(year, month);
  };

  // Quick select buttons for recent periods
  const recentPeriods = [
    { label: 'Last Month', year: currentMonth === 1 ? currentYear - 1 : currentYear, month: currentMonth === 1 ? 12 : currentMonth - 1 },
    { label: '2 Months Ago', year: currentMonth <= 2 ? currentYear - 1 : currentYear, month: currentMonth <= 2 ? 12 + currentMonth - 2 : currentMonth - 2 },
    { label: '3 Months Ago', year: currentMonth <= 3 ? currentYear - 1 : currentYear, month: currentMonth <= 3 ? 12 + currentMonth - 3 : currentMonth - 3 },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Select */}
      <div>
        <Label className="text-base">Quick Select</Label>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {recentPeriods.map((period) => (
            <Card
              key={`${period.year}-${period.month}`}
              className={`cursor-pointer transition-colors hover:border-primary ${
                year === period.year && month === period.month ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => {
                setYear(period.year);
                setMonth(period.month);
              }}
            >
              <CardContent className="p-4 text-center">
                <Calendar className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">{period.label}</p>
                <p className="text-sm text-muted-foreground">
                  {MONTHS[period.month - 1]} {period.year}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Manual Selection */}
      <div className="space-y-4">
        <Label className="text-base">Or Select Manually</Label>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger id="year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="month">Month</Label>
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger id="month">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Selected Period Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Selected Period</p>
              <p className="text-lg font-semibold">
                {MONTHS[month - 1]} {year}
              </p>
            </div>
            <Button onClick={handleSubmit}>
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
