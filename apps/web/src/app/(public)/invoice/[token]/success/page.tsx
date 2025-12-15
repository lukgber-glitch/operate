'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { usePublicInvoice } from '@/hooks/use-public-invoice';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import type { CurrencyCode } from '@/types/currency';

interface PaymentSuccessPageProps {
  params: {
    token: string;
  };
}

export default function PaymentSuccessPage({ params }: PaymentSuccessPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const { invoice, fetchInvoice } = usePublicInvoice(params.token);

  useEffect(() => {
    // Refresh invoice to get updated payment status
    if (fetchInvoice) {
      fetchInvoice();
    }
  }, [fetchInvoice]);

  const handleDownloadReceipt = async () => {
    try {
      const response = await fetch(`/api/public/invoices/${params.token}/receipt?paymentId=${paymentId}`);
      if (!response.ok) throw new Error('Failed to download receipt');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Payment Successful!
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Thank you for your payment. Your transaction has been completed successfully.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Transaction confirmation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentId && (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Payment ID</p>
              <p className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                {paymentId}
              </p>
            </div>
          )}

          <Separator />

          {invoice && (
            <>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Invoice Number</p>
                <p className="font-medium text-slate-900 dark:text-white">{invoice.number}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  <CurrencyDisplay
                    amount={invoice.amountPaid}
                    currency={invoice.currency as CurrencyCode}
                  />
                </p>
              </div>

              {invoice.amountDue > 0 && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Remaining Balance</p>
                  <p className="text-lg font-medium text-slate-900 dark:text-white">
                    <CurrencyDisplay
                      amount={invoice.amountDue}
                      currency={invoice.currency as CurrencyCode}
                    />
                  </p>
                </div>
              )}
            </>
          )}

          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Payment Date</p>
            <p className="font-medium text-slate-900 dark:text-white">{formatDate()}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            A confirmation email has been sent to your registered email address with the payment
            receipt and transaction details.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={handleDownloadReceipt}
          disabled={!paymentId}
          className="flex-1"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Receipt
        </Button>
        <Link href={`/invoice/${params.token}`} className="flex-1">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoice
          </Button>
        </Link>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Need help? Contact us at{' '}
          <a href="mailto:support@operate.guru" className="text-primary hover:underline">
            support@operate.guru
          </a>
        </p>
      </div>
    </div>
  );
}
