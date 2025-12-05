/**
 * Review & Approve Step
 * Step 6 of pay run wizard - Final review and submission
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePayRun } from '@/hooks/use-pay-run';
import { useSubmitPayroll, formatCurrency, formatPayPeriod } from '@/hooks/use-payroll';
import { PayrollSummaryCard } from '../PayrollSummaryCard';
import {
  CheckCircle2,
  AlertCircle,
  Send,
  FileText,
  Calendar,
  Users,
  DollarSign,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ReviewApproveStep() {
  const router = useRouter();
  const {
    currentPayroll,
    selectedPayPeriod,
    selectedEmployeeList,
    additions,
    deductions,
    getTotalGrossPay,
    getTotalNetPay,
    getTotalEmployeeTaxes,
    getTotalEmployerTaxes,
    getTotalAdditions,
    getTotalDeductions,
    reset,
  } = usePayRun();

  const submitMutation = useSubmitPayroll(currentPayroll?.uuid || '');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async () => {
    if (!currentPayroll) return;

    try {
      const result = await submitMutation.mutateAsync({
        version: currentPayroll.version,
      });

      setShowConfirmation(true);

      // Reset wizard after 3 seconds and redirect
      setTimeout(() => {
        reset();
        router.push('/hr/payroll');
      }, 3000);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  if (showConfirmation) {
    return (
      <div className="text-center py-12">
        <div className="flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Payroll Submitted Successfully!</h3>
        <p className="text-muted-foreground mb-4">
          Your payroll has been submitted for processing.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to payroll dashboard...
        </p>
      </div>
    );
  }

  if (!currentPayroll?.calculatedAt) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Payroll must be calculated before submission. Please go back to the Tax Preview step.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review & Approve</h3>
        <p className="text-muted-foreground">
          Review all details carefully before submitting. Payroll cannot be edited after submission.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Once submitted, this payroll cannot be modified. Please review
          all information carefully.
        </AlertDescription>
      </Alert>

      {/* Pay Period Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Pay Period</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Period:</span>
            <span className="font-medium">
              {selectedPayPeriod && formatPayPeriod(selectedPayPeriod)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Check Date:</span>
            <span className="font-medium">
              {currentPayroll.checkDate &&
                new Date(currentPayroll.checkDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
            </span>
          </div>
          {currentPayroll.offCycle && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="secondary">Off-Cycle Payroll</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Employees</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-lg">
              <span className="font-medium">Total Employees:</span>
              <Badge variant="default" className="text-base px-3 py-1">
                {selectedEmployeeList.length}
              </Badge>
            </div>
            <Separator />
            <div className="max-h-32 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedEmployeeList.map((emp) => (
                  <div key={emp.employeeUuid} className="text-muted-foreground">
                    • {emp.firstName} {emp.lastName}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additions & Deductions Summary */}
      {(additions.length > 0 || deductions.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Adjustments</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {additions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Additions ({additions.length})</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {additions.map((add) => (
                    <div key={add.id} className="flex justify-between">
                      <span>{add.description}</span>
                      <span className="text-green-600">+{formatCurrency(add.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {deductions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Deductions ({deductions.length})</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {deductions.map((ded) => (
                    <div key={ded.id} className="flex justify-between">
                      <span>{ded.description}</span>
                      <span className="text-amber-600">-{formatCurrency(ded.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      <PayrollSummaryCard
        totalGross={getTotalGrossPay()}
        totalNet={getTotalNetPay()}
        totalEmployeeTaxes={getTotalEmployeeTaxes()}
        totalEmployerTaxes={getTotalEmployerTaxes()}
        totalAdditions={getTotalAdditions()}
        totalDeductions={getTotalDeductions()}
        employeeCount={selectedEmployeeList.length}
      />

      {/* Submit Button */}
      <Card className="border-primary">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 shrink-0">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Ready to Submit</h4>
                <p className="text-sm text-muted-foreground">
                  Total net pay of <strong>{formatCurrency(getTotalNetPay())}</strong> will be
                  processed for <strong>{selectedEmployeeList.length} employees</strong>.
                </p>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>Processing...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Payroll for Processing
                </>
              )}
            </Button>

            {submitMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {submitMutation.error instanceof Error
                    ? submitMutation.error.message
                    : 'Failed to submit payroll. Please try again.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
