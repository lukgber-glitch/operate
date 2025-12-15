'use client';

import { useState, FormEvent } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Loader2, Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import type { CurrencyCode } from '@/types/currency';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentFormProps {
  invoiceNumber: string;
  totalAmount: number;
  amountDue: number;
  currency: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

function PaymentFormContent({
  invoiceNumber,
  totalAmount,
  amountDue,
  currency,
  onSuccess,
  onError,
  onCancel,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
  const [amount, setAmount] = useState(amountDue);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (paymentMethod === 'card') {
      setIsProcessing(true);
      setError(null);

      try {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        // Create payment method
        const { error: pmError, paymentMethod: pm } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });

        if (pmError) {
          throw new Error(pmError.message);
        }

        // Here you would call your API to create a payment intent and confirm it
        // For now, we'll simulate success
        onSuccess(pm.id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Payment failed';
        setError(errorMessage);
        onError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Invoice Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
          <CardDescription>Invoice {invoiceNumber}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Total Amount</span>
            <span className="font-medium">
              <CurrencyDisplay amount={totalAmount} currency={currency as CurrencyCode} />
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Amount to Pay</span>
            <span className="text-primary">
              <CurrencyDisplay amount={amount} currency={currency as CurrencyCode} />
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <div className="space-y-4">
        <Label>Payment Method</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`p-4 border-2 rounded-lg transition-all ${
              paymentMethod === 'card'
                ? 'border-primary bg-primary/5'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <CreditCard className="h-6 w-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Credit/Debit Card</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('bank')}
            className={`p-4 border-2 rounded-lg transition-all ${
              paymentMethod === 'bank'
                ? 'border-primary bg-primary/5'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <Building2 className="h-6 w-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Bank Transfer</span>
          </button>
        </div>
      </div>

      {/* Card Payment Form */}
      {paymentMethod === 'card' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Payment Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              max={amountDue}
              min={0}
              step="0.01"
              className="mt-1"
            />
            {amount !== amountDue && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Partial payment: {((amount / amountDue) * 100).toFixed(0)}% of amount due
              </p>
            )}
          </div>

          <div>
            <Label>Card Details</Label>
            <div className="mt-1 p-3 border rounded-lg">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p>🔒 Your payment information is securely processed by Stripe.</p>
            <p>We never store your card details on our servers.</p>
          </div>
        </div>
      )}

      {/* Bank Transfer Instructions */}
      {paymentMethod === 'bank' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bank Transfer Details</CardTitle>
            <CardDescription>
              Please use the following information for your bank transfer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-slate-600 dark:text-slate-400">Account Name</p>
              <p className="font-medium">Operate Business Solutions</p>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400">Account Number</p>
              <p className="font-medium font-mono">1234567890</p>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400">Routing Number</p>
              <p className="font-medium font-mono">987654321</p>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400">SWIFT/BIC</p>
              <p className="font-medium font-mono">OPERBIC123</p>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400">Reference</p>
              <p className="font-medium">Invoice {invoiceNumber}</p>
            </div>
            <Alert>
              <AlertDescription className="text-xs">
                Please include the invoice number in your transfer reference to ensure proper
                allocation of your payment.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        {paymentMethod === 'card' && (
          <Button
            type="submit"
            disabled={!stripe || isProcessing || amount <= 0 || amount > amountDue}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay <CurrencyDisplay amount={amount} currency={currency as CurrencyCode} />
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}

export function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
}
