'use client';

import { VATSubmissionResponse } from '@/hooks/useHMRC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Download, FileText, Calendar, CreditCard, Info } from 'lucide-react';

interface VATSubmissionConfirmationProps {
  submission: VATSubmissionResponse;
  periodKey: string;
  netVatDue: number;
  onDownloadReceipt?: () => void;
  onNewReturn?: () => void;
  onViewReturns?: () => void;
}

export function VATSubmissionConfirmation({
  submission,
  periodKey,
  netVatDue,
  onDownloadReceipt,
  onNewReturn,
  onViewReturns,
}: VATSubmissionConfirmationProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
                VAT Return Submitted Successfully
              </h2>
              <p className="text-green-700 dark:text-green-300 mt-2">
                Your VAT return has been filed with HMRC
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Details */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Receipt</CardTitle>
          <CardDescription>Keep this for your records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Period Key</p>
              <p className="text-lg font-semibold font-mono">{periodKey}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Processing Date</p>
              <p className="text-lg font-semibold">{formatDate(submission.processingDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Form Bundle Number</p>
              <p className="text-lg font-semibold font-mono">{submission.formBundleNumber}</p>
            </div>
            {submission.chargeRefNumber && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Charge Reference</p>
                <p className="text-lg font-semibold font-mono">{submission.chargeRefNumber}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </h3>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Net VAT Amount</p>
                <p className={`text-2xl font-bold ${netVatDue >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(netVatDue))}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={netVatDue >= 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}
              >
                {netVatDue >= 0 ? 'To Pay' : 'Refund Due'}
              </Badge>
            </div>

            {submission.paymentIndicator && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Payment Method</AlertTitle>
                <AlertDescription>
                  {submission.paymentIndicator === 'DD' ? (
                    <>Payment will be collected via Direct Debit from your registered bank account.</>
                  ) : (
                    <>Please arrange payment via bank transfer to HMRC using the charge reference number above.</>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">1</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Confirmation Email</h4>
                <p className="text-sm text-muted-foreground">
                  HMRC will send a confirmation email to your registered email address
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">2</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Payment Due</h4>
                <p className="text-sm text-muted-foreground">
                  {netVatDue >= 0 ? (
                    <>Payment must be made within 1 calendar month and 7 days after the end of the VAT period</>
                  ) : (
                    <>Your refund will be processed by HMRC, typically within 30 days</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">3</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Keep Records</h4>
                <p className="text-sm text-muted-foreground">
                  Download and save your submission receipt for your records (keep for at least 6 years)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onDownloadReceipt && (
          <Button onClick={onDownloadReceipt} variant="default" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        )}
        {onViewReturns && (
          <Button onClick={onViewReturns} variant="outline" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            View All Returns
          </Button>
        )}
        {onNewReturn && (
          <Button onClick={onNewReturn} variant="outline" className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            File Another Return
          </Button>
        )}
      </div>

      {/* Important Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          This submission is now final and cannot be changed. If you discover an error, you may need to
          contact HMRC or file an adjustment in your next return depending on the nature of the error.
        </AlertDescription>
      </Alert>
    </div>
  );
}
