/**
 * Specific Payroll Page
 * View or edit a specific payroll by ID
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PayRunWizard } from '@/components/hr/payroll/PayRunWizard';
import { usePayroll } from '@/hooks/use-payroll';
import { usePayRun } from '@/hooks/use-pay-run';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import { PayrollStatus } from '@/types/payroll';

export default function SpecificPayrollPage() {
  const params = useParams();
  const router = useRouter();
  const payrollId = params?.payrollId as string;

  // TODO: Get actual companyUuid from user session/context
  const companyUuid = 'comp_demo_uuid';

  const { data: payroll, isLoading, error } = usePayroll(payrollId);
  const { setCurrentPayroll, reset } = usePayRun();

  useEffect(() => {
    if (payroll) {
      setCurrentPayroll(payroll);
    }
  }, [payroll, setCurrentPayroll]);

  useEffect(() => {
    return () => {
      // Cleanup when leaving page
      reset();
    };
  }, [reset]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !payroll) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : 'Failed to load payroll. Please try again.'}
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/hr/payroll')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Payroll
        </Button>
      </div>
    );
  }

  // Check if payroll can be edited
  const canEdit =
    payroll.status === PayrollStatus.DRAFT ||
    payroll.status === PayrollStatus.CALCULATED;

  if (!canEdit) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl text-white font-semibold tracking-tight">Payroll Details</h1>
            <p className="text-muted-foreground">This payroll has been {payroll.status} and cannot be edited</p>
          </div>

          <Card className="rounded-[16px]">
            <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-semibold capitalize">{payroll.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check Date:</span>
                <span className="font-medium">
                  {new Date(payroll.checkDate).toLocaleDateString()}
                </span>
              </div>
              {payroll.processedDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processed Date:</span>
                  <span className="font-medium">
                    {new Date(payroll.processedDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Net Pay:</span>
                <span className="font-bold text-lg">
                  ${parseFloat(payroll.payrollTotals?.netPayTotal || '0').toLocaleString()}
                </span>
              </div>
            </div>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => router.push('/hr/payroll')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payroll
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">Edit Payroll</h1>
          <p className="text-muted-foreground">Make changes to this payroll before submission</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/hr/payroll')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This payroll is in <strong>{payroll.status}</strong> status. You can make changes
          before final submission.
        </AlertDescription>
      </Alert>

      <PayRunWizard companyUuid={companyUuid} payrollId={payrollId} />
    </div>
  );
}
