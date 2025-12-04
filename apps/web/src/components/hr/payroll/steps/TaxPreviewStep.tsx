/**
 * Tax Preview Step
 * Step 5 of pay run wizard - Preview calculated taxes before submission
 */

'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePayRun } from '@/hooks/use-pay-run';
import { useCalculatePayroll, formatCurrency } from '@/hooks/use-payroll';
import { Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PayrollSummaryCard } from '../PayrollSummaryCard';

export function TaxPreviewStep() {
  const {
    currentPayroll,
    selectedEmployeeList,
    taxBreakdowns,
    setTaxBreakdowns,
    setCurrentPayroll,
    setLoading,
    setError,
    getTotalGrossPay,
    getTotalNetPay,
    getTotalEmployeeTaxes,
    getTotalEmployerTaxes,
    getTotalAdditions,
    getTotalDeductions,
  } = usePayRun();

  const calculateMutation = useCalculatePayroll(currentPayroll?.uuid || '');

  useEffect(() => {
    // Auto-calculate if not already calculated
    if (currentPayroll && !currentPayroll.calculatedAt && !calculateMutation.isPending) {
      handleCalculate();
    }
  }, [currentPayroll?.uuid]);

  const handleCalculate = async () => {
    if (!currentPayroll) return;

    try {
      setLoading(true);
      setError(null);

      const result = await calculateMutation.mutateAsync({
        version: currentPayroll.version,
      });

      setCurrentPayroll(result);

      // Extract tax breakdowns from result
      if (result.employeeCompensations) {
        // In production, this would come from the actual tax calculation
        // For now, we'll create mock data based on gross pay
        const mockTaxBreakdowns = result.employeeCompensations.map((comp) => {
          const employee = selectedEmployeeList.find((e) => e.employeeUuid === comp.employeeUuid);
          if (!employee) return null;

          const grossPay = parseFloat(
            result.payrollTotals?.employeeCompensationsTotal || '0'
          ) / result.employeeCompensations.length;

          return {
            employeeUuid: comp.employeeUuid,
            federalIncomeTax: (grossPay * 0.12).toFixed(2),
            stateIncomeTax: (grossPay * 0.05).toFixed(2),
            socialSecurityEmployee: (grossPay * 0.062).toFixed(2),
            socialSecurityEmployer: (grossPay * 0.062).toFixed(2),
            medicareEmployee: (grossPay * 0.0145).toFixed(2),
            medicareEmployer: (grossPay * 0.0145).toFixed(2),
            totalEmployeeTaxes: (grossPay * (0.12 + 0.05 + 0.062 + 0.0145)).toFixed(2),
            totalEmployerTaxes: (grossPay * (0.062 + 0.0145 + 0.006)).toFixed(2),
          };
        }).filter(Boolean);

        setTaxBreakdowns(mockTaxBreakdowns);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate payroll');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (uuid: string) => {
    const employee = selectedEmployeeList.find((e) => e.employeeUuid === uuid);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  };

  if (calculateMutation.isPending) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <Calculator className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-medium mb-2">Calculating Taxes...</h3>
          <p className="text-muted-foreground">
            Please wait while we calculate taxes and deductions for all employees.
          </p>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!currentPayroll?.calculatedAt) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Calculation Required</h3>
          <p className="text-muted-foreground mb-4">
            Payroll needs to be calculated before viewing tax preview.
          </p>
          <Button onClick={handleCalculate}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Payroll
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Tax Preview</h3>
        <p className="text-muted-foreground">
          Review calculated taxes and deductions before submitting payroll.
        </p>
      </div>

      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Payroll Calculated
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Calculated at {new Date(currentPayroll.calculatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <PayrollSummaryCard
        totalGross={getTotalGrossPay()}
        totalNet={getTotalNetPay()}
        totalEmployeeTaxes={getTotalEmployeeTaxes()}
        totalEmployerTaxes={getTotalEmployerTaxes()}
        totalAdditions={getTotalAdditions()}
        totalDeductions={getTotalDeductions()}
        employeeCount={selectedEmployeeList.length}
      />

      {/* Employee Tax Breakdowns */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Tax Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {taxBreakdowns.map((breakdown) => (
              <div
                key={breakdown.employeeUuid}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">
                    {getEmployeeName(breakdown.employeeUuid)}
                  </h4>
                  <Badge variant="outline">
                    Total: {formatCurrency(breakdown.totalEmployeeTaxes)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Federal Income Tax:</span>
                    <span className="font-medium">{formatCurrency(breakdown.federalIncomeTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">State Income Tax:</span>
                    <span className="font-medium">{formatCurrency(breakdown.stateIncomeTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Social Security:</span>
                    <span className="font-medium">{formatCurrency(breakdown.socialSecurityEmployee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Medicare:</span>
                    <span className="font-medium">{formatCurrency(breakdown.medicareEmployee)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employer Taxes */}
      <Card>
        <CardHeader>
          <CardTitle>Employer Tax Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between p-3 bg-muted rounded-lg">
              <span className="text-muted-foreground">Social Security (Employer):</span>
              <span className="font-medium">
                {formatCurrency(
                  taxBreakdowns.reduce(
                    (sum, b) => sum + parseFloat(b.socialSecurityEmployer || '0'),
                    0
                  )
                )}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-muted rounded-lg">
              <span className="text-muted-foreground">Medicare (Employer):</span>
              <span className="font-medium">
                {formatCurrency(
                  taxBreakdowns.reduce(
                    (sum, b) => sum + parseFloat(b.medicareEmployer || '0'),
                    0
                  )
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
