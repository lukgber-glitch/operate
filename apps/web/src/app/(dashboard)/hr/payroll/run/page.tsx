/**
 * Pay Run Page
 * Main page for creating and running payroll
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PayRunWizard } from '@/components/hr/payroll/PayRunWizard';
import { useCreatePayroll } from '@/hooks/use-payroll';
import { usePayRun } from '@/hooks/use-pay-run';
import { DollarSign, AlertCircle, Loader2 } from 'lucide-react';

export default function PayRunPage() {
  // TODO: Get actual companyUuid from user session/context
  const companyUuid = 'comp_demo_uuid';

  const [isStarted, setIsStarted] = useState(false);
  const { selectedPayPeriod, selectedEmployees, setCurrentPayroll } = usePayRun();
  const createPayrollMutation = useCreatePayroll(companyUuid);

  const handleStartPayRun = async () => {
    try {
      // Create a draft payroll
      const payroll = await createPayrollMutation.mutateAsync({
        companyUuid,
        // Let Gusto use the next scheduled pay period
      });

      setCurrentPayroll(payroll);
      setIsStarted(true);
    } catch (error) {
      // Error handled by mutation
      console.error('Failed to start pay run:', error);
    }
  };

  if (!isStarted) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl text-white font-semibold tracking-tight">Run Payroll</h1>
            <p className="text-muted-foreground">Process payroll for your employees with our step-by-step wizard</p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Before you begin:</strong> Make sure all employee hours, time off, and
              compensation information is up to date.
            </AlertDescription>
          </Alert>

          <Card className="rounded-[16px]">
            <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl text-white font-bold flex items-center gap-2 mb-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                  Start New Pay Run
                </h2>
                <p className="text-muted-foreground">
                  Follow the guided process to review employees, enter hours, and submit payroll
                  for processing.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">What you'll do:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Select pay period</li>
                    <li>• Review employees</li>
                    <li>• Enter hours worked</li>
                    <li>• Add bonuses/deductions</li>
                    <li>• Review tax calculations</li>
                    <li>• Submit for processing</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-2">Important:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Payroll cannot be edited after submission</li>
                    <li>• Processing typically takes 2-4 business days</li>
                    <li>• Direct deposits arrive on the scheduled pay date</li>
                  </ul>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleStartPayRun}
                disabled={createPayrollMutation.isPending}
              >
                {createPayrollMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting Pay Run...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Start Pay Run
                  </>
                )}
              </Button>

              {createPayrollMutation.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {createPayrollMutation.error instanceof Error
                      ? createPayrollMutation.error.message
                      : 'Failed to start pay run. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">Run Payroll</h1>
          <p className="text-muted-foreground">Complete each step to process payroll for your employees</p>
        </div>
      </div>

      <PayRunWizard companyUuid={companyUuid} />
    </div>
  );
}
