/**
 * Pay Period Selection Step
 * Step 1 of pay run wizard - Select the pay period to process
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePayPeriods, useCurrentPayPeriod, formatPayPeriod } from '@/hooks/use-payroll';
import { usePayRun } from '@/hooks/use-pay-run';
import { PayPeriod } from '@/types/payroll';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useEffect } from 'react';

interface PayPeriodStepProps {
  companyUuid: string;
}

export function PayPeriodStep({ companyUuid }: PayPeriodStepProps) {
  const { data: payPeriods, isLoading } = usePayPeriods(companyUuid);
  const { data: currentPayPeriod } = useCurrentPayPeriod(companyUuid);
  const { selectedPayPeriod, selectPayPeriod, setPayPeriods } = usePayRun();

  useEffect(() => {
    if (payPeriods) {
      setPayPeriods(payPeriods);
    }
  }, [payPeriods, setPayPeriods]);

  useEffect(() => {
    // Auto-select current pay period if nothing is selected
    if (currentPayPeriod && !selectedPayPeriod) {
      selectPayPeriod(currentPayPeriod);
    }
  }, [currentPayPeriod, selectedPayPeriod, selectPayPeriod]);

  const isCurrentPeriod = (period: PayPeriod) => {
    if (!currentPayPeriod) return false;
    return (
      period.startDate === currentPayPeriod.startDate &&
      period.endDate === currentPayPeriod.endDate
    );
  };

  const isPastDeadline = (period: PayPeriod) => {
    if (!period.payrollDeadline) return false;
    return new Date(period.payrollDeadline) < new Date();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!payPeriods || payPeriods.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Pay Periods Available</h3>
        <p className="text-muted-foreground">
          No pay periods found. Please check your company settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Pay Period</h3>
        <p className="text-muted-foreground">
          Choose the pay period you want to process. The current pay period is pre-selected.
        </p>
      </div>

      <div className="space-y-3">
        {payPeriods.map((period, index) => {
          const isCurrent = isCurrentPeriod(period);
          const isSelected = selectedPayPeriod?.startDate === period.startDate &&
                            selectedPayPeriod?.endDate === period.endDate;
          const pastDeadline = isPastDeadline(period);

          return (
            <Card
              key={`${period.startDate}-${period.endDate}`}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary ring-2 ring-primary ring-opacity-50'
                  : 'hover:border-primary/50'
              } ${pastDeadline ? 'opacity-60' : ''}`}
              onClick={() => selectPayPeriod(period)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{formatPayPeriod(period)}</p>
                        {isCurrent && (
                          <Badge variant="default">Current Period</Badge>
                        )}
                        {pastDeadline && (
                          <Badge variant="destructive">Past Deadline</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {period.checkDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Pay Date: {new Date(period.checkDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {period.payrollDeadline && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Deadline: {new Date(period.payrollDeadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedPayPeriod && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 shrink-0">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Pay Period Selected</p>
                <p className="text-sm text-muted-foreground">
                  Processing payroll for {formatPayPeriod(selectedPayPeriod)}
                </p>
                {selectedPayPeriod.checkDate && (
                  <p className="text-sm text-muted-foreground">
                    Employees will be paid on {new Date(selectedPayPeriod.checkDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
