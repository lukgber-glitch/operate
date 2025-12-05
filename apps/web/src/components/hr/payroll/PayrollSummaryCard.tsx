/**
 * Payroll Summary Card Component
 * Displays totals and breakdown for payroll
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/hooks/use-payroll';
import { DollarSign, Users, TrendingUp, TrendingDown } from 'lucide-react';

interface PayrollSummaryCardProps {
  totalGross: number;
  totalNet: number;
  totalEmployeeTaxes: number;
  totalEmployerTaxes: number;
  totalAdditions?: number;
  totalDeductions?: number;
  employeeCount: number;
  variant?: 'default' | 'compact';
}

export function PayrollSummaryCard({
  totalGross,
  totalNet,
  totalEmployeeTaxes,
  totalEmployerTaxes,
  totalAdditions = 0,
  totalDeductions = 0,
  employeeCount,
  variant = 'default',
}: PayrollSummaryCardProps) {
  const totalCost = totalGross + totalEmployerTaxes;

  if (variant === 'compact') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Net Pay</p>
              <p className="text-2xl font-bold">{formatCurrency(totalNet)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Employees</p>
              <p className="text-2xl font-bold">{employeeCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Summary</CardTitle>
        <CardDescription>
          Total costs and breakdown for {employeeCount} {employeeCount === 1 ? 'employee' : 'employees'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employee Totals */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              Employees
            </div>
            <span className="font-semibold">{employeeCount}</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Gross Pay</span>
            <span className="font-medium">{formatCurrency(totalGross)}</span>
          </div>

          {totalAdditions > 0 && (
            <div className="flex items-center justify-between text-green-600 dark:text-green-400">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                Additions
              </div>
              <span className="font-medium">+{formatCurrency(totalAdditions)}</span>
            </div>
          )}

          {totalDeductions > 0 && (
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
              <div className="flex items-center gap-2 text-sm">
                <TrendingDown className="h-4 w-4" />
                Deductions
              </div>
              <span className="font-medium">-{formatCurrency(totalDeductions)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-red-600 dark:text-red-400">
            <span className="text-sm">Employee Taxes</span>
            <span className="font-medium">-{formatCurrency(totalEmployeeTaxes)}</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Net Pay
            </div>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalNet)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Employer Costs */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Employer Costs</h4>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Gross Pay</span>
            <span className="font-medium">{formatCurrency(totalGross)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Employer Taxes</span>
            <span className="font-medium">{formatCurrency(totalEmployerTaxes)}</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-medium">Total Cost</span>
            <span className="text-lg font-bold">{formatCurrency(totalCost)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
