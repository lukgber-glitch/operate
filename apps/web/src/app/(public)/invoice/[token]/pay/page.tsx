'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PaymentForm } from '@/components/portal/PaymentForm';
import { usePublicInvoice } from '@/hooks/use-public-invoice';

interface PaymentPageProps {
  params: {
    token: string;
  };
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const router = useRouter();
  const { invoice, isLoading, error } = usePublicInvoice(params.token);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handlePaymentSuccess = (paymentId: string) => {
    router.push(`/invoice/${params.token}/success?paymentId=${paymentId}`);
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  const handleCancel = () => {
    router.push(`/invoice/${params.token}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading payment page...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Invoice not found or the link has expired.'}
          </AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (invoice.status === 'PAID') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert>
          <AlertDescription>This invoice has already been paid in full.</AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Link href={`/invoice/${params.token}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoice
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (invoice.amountDue <= 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert>
          <AlertDescription>There is no outstanding balance on this invoice.</AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Link href={`/invoice/${params.token}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoice
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-6">
        <Link href={`/invoice/${params.token}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoice
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>Complete your payment securely</CardDescription>
        </CardHeader>
      </Card>

      {paymentError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}

      <PaymentForm
        invoiceNumber={invoice.number}
        totalAmount={invoice.totalAmount}
        amountDue={invoice.amountDue}
        currency={invoice.currency}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        onCancel={handleCancel}
      />
    </div>
  );
}
