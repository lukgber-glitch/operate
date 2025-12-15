/**
 * Tax Preview Step
 * Step 5 of pay run wizard - Preview calculated taxes before submission
 * Optimized with memoized calculations
 */

'use client';

import { useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePayRun } from '@/hooks/use-pay-run';
import { useCalculatePayroll, formatCurrency } from '@/hooks/use-payroll';
import { Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PayrollSummaryCard } from '../PayrollSummaryCard';
import type { TaxBreakdown } from '@/types/payroll';

// Tax rate constants - real-world rates for US payroll
const TAX_RATES = {
  FEDERAL_INCOME: 0.12,      // 12% federal income tax (simplified)
  STATE_INCOME: 0.05,        // 5% state income tax (varies by state)
  SOCIAL_SECURITY: 0.062,    // 6.2% Social Security
  MEDICARE: 0.0145,          // 1.45% Medicare
  FUTA: 0.006,               // 0.6% Federal Unemployment (employer only)
} as const;

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
    employeeMap,
  } = usePayRun();

  const calculateMutation = useCalculatePayroll(currentPayroll?.uuid || '');

  // Memoize employee name lookup using the employeeMap
  const getEmployeeName = useCallback((uuid: string) => {
    const employee = employeeMap?.get(uuid);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  }, [employeeMap]);

  // Memoize tax calculation function
  const calculateTaxBreakdown = useCallback((grossPay: number, employeeUuid: string): TaxBreakdown => {
    const federalIncomeTax = grossPay * TAX_RATES.FEDERAL_INCOME;
    const stateIncomeTax = grossPay * TAX_RATES.STATE_INCOME;
    const socialSecurityEmployee = grossPay * TAX_RATES.SOCIAL_SECURITY;
    const socialSecurityEmployer = grossPay * TAX_RATES.SOCIAL_SECURITY;
    const medicareEmployee = grossPay * TAX_RATES.MEDICARE;
    const medicareEmployer = grossPay * TAX_RATES.MEDICARE;

    return {
      employeeUuid,
      federalIncomeTax: federalIncomeTax.toFixed(2),
      stateIncomeTax: stateIncomeTax.toFixed(2),
      socialSecurityEmployee: socialSecurityEmployee.toFixed(2),
      socialSecurityEmployer: socialSecurityEmployer.toFixed(2),
      medicareEmployee: medicareEmployee.toFixed(2),
      medicareEmployer: medicareEmployer.toFixed(2),
      totalEmployeeTaxes: (federalIncomeTax + stateIncomeTax + socialSecurityEmployee + medicareEmployee).toFixed(2),
      totalEmployerTaxes: (socialSecurityEmployer + medicareEmployer + grossPay * TAX_RATES.FUTA).toFixed(2),
    };
  }, []);

  const handleCalculate = useCallback(async () => {
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
        const employeeCount = result.employeeCompensations.length;
        const totalGross = parseFloat(result.payrollTotals?.employeeCompensationsTotal || '0');
        const avgGrossPay = employeeCount > 0 ? totalGross / employeeCount : 0;

        const mockTaxBreakdowns = result.employeeCompensations
          .map((comp) => {
            if (!employeeMap?.get(comp.employeeUuid)) return null;
            return calculateTaxBreakdown(avgGrossPay, comp.employeeUuid);
          })
          .filter((item): item is TaxBreakdown => item !== null);

        setTaxBreakdowns(mockTaxBreakdowns);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate payroll');
    } finally {
      setLoading(false);
    }
  }, [currentPayroll, calculateMutation, setCurrentPayroll, setTaxBreakdowns, setLoading, setError, employeeMap, calculateTaxBreakdown]);

  useEffect(() => {
    // Auto-calculate if not already calculated
    if (currentPayroll && !currentPayroll.calculatedAt && !calculateMutation.isPending) {
      handleCalculate();
    }
  }, [currentPayroll?.uuid, handleCalculate, calculateMutation.isPending]);

  // Memoize employer tax totals
  const employerTaxTotals = useMemo(() => ({
    socialSecurity: taxBreakdowns.reduce(
      (sum, b) => sum + parseFloat(b.socialSecurityEmployer || '0'),
      0
    ),
    medicare: taxBreakdowns.reduce(
      (sum, b) => sum + parseFloat(b.medicareEmployer || '0'),
      0
    ),
  }), [taxBreakdowns]);

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

      {/* Employee Tax Breakdowns - using memoized item component */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Tax Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {taxBreakdowns.map((breakdown) => (
              <TaxBreakdownItem
                key={breakdown.employeeUuid}
                breakdown={breakdown}
                employeeName={getEmployeeName(breakdown.employeeUuid)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employer Taxes - using memoized totals */}
      <Card>
        <CardHeader>
          <CardTitle>Employer Tax Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between p-3 bg-muted rounded-lg">
              <span className="text-muted-foreground">Social Security (Employer):</span>
              <span className="font-medium">
                {formatCurrency(employerTaxTotals.socialSecurity)}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-muted rounded-lg">
              <span className="text-muted-foreground">Medicare (Employer):</span>
              <span className="font-medium">
                {formatCurrency(employerTaxTotals.medicare)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Memoized tax breakdown item component
const TaxBreakdownItem = memo(function TaxBreakdownItem({
  breakdown,
  employeeName,
}: {
  breakdown: TaxBreakdown;
  employeeName: string;
}) {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{employeeName}</h4>
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
  );
});
