'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { usePayments, type Payment } from '@/hooks/use-payments';
import { formatCurrency } from '@/lib/formatters';
import { PaymentStatus } from '@/components/payments/PaymentStatus';

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getPayment } = usePayments();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  useEffect(() => {
    async function loadPayment() {
      if (!paymentId) {
        setError('Payment ID not found');
        setIsLoading(false);
        return;
      }

      try {
        const data = await getPayment(paymentId);
        setPayment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment');
      } finally {
        setIsLoading(false);
      }
    }

    loadPayment();
  }, [paymentId, getPayment]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-zinc-900 border-zinc-800">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 mx-auto bg-zinc-800" />
              <Skeleton className="h-4 w-64 mx-auto bg-zinc-800" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-zinc-900 border-red-500/30">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Payment Error</h1>
              <p className="text-zinc-400">{error || 'Failed to load payment information'}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/finance/payments')}
                className="flex-1"
              >
                View Payments
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const isSuccess = ['AUTHORIZED', 'EXECUTED', 'SETTLED'].includes(payment.status);
  const isFailed = payment.status === 'FAILED';
  const isPending = ['PENDING', 'AUTHORIZING'].includes(payment.status);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-zinc-900 border-zinc-800">
        <div className="text-center space-y-6">
          {/* Status Icon */}
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
              isSuccess
                ? 'bg-emerald-500/10'
                : isFailed
                ? 'bg-red-500/10'
                : 'bg-blue-500/10'
            }`}
          >
            {isSuccess && <CheckCircle2 className="h-8 w-8 text-emerald-500" />}
            {isFailed && <XCircle className="h-8 w-8 text-red-500" />}
            {isPending && <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">
              {isSuccess && 'Payment Authorized'}
              {isFailed && 'Payment Failed'}
              {isPending && 'Payment Processing'}
            </h1>
            <p className="text-zinc-400">
              {isSuccess && 'Your payment has been successfully authorized'}
              {isFailed && 'The payment authorization was not successful'}
              {isPending && 'Your payment is being processed'}
            </p>
          </div>

          {/* Payment Details */}
          <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold text-white">
                {formatCurrency(payment.amount, payment.currency)}
              </span>
              <PaymentStatus status={payment.status} size="sm" />
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Recipient</span>
                <span className="text-white">{payment.beneficiary.name}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Reference</span>
                <span className="text-white">{payment.reference}</span>
              </div>
              {payment.beneficiary.iban && (
                <div className="flex justify-between text-zinc-400">
                  <span>IBAN</span>
                  <span className="font-mono text-xs text-white">
                    {payment.beneficiary.iban}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Message */}
          {isSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-sm text-emerald-400">
                The payment has been authorized and will be processed by your bank. You'll receive
                confirmation once it's completed.
              </p>
            </div>
          )}

          {isFailed && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">
                The authorization was declined. Please check with your bank or try again with a
                different account.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/finance/payments')}
              className="flex-1"
            >
              View All Payments
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
