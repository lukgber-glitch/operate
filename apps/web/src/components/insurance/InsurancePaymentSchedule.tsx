'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

import { InsurancePayment, PaymentStatus } from '@/hooks/use-insurance';
import { useMarkPaymentPaid } from '@/hooks/use-insurance';

interface InsurancePaymentScheduleProps {
  payments: InsurancePayment[];
  onPaymentUpdated?: () => void;
}

export function InsurancePaymentSchedule({ payments, onPaymentUpdated }: InsurancePaymentScheduleProps) {
  const { markPaymentPaid, isLoading } = useMarkPaymentPaid();

  const handleMarkPaid = async (paymentId: string) => {
    try {
      await markPaymentPaid(paymentId);
      onPaymentUpdated?.();
    } catch (error) {
      console.error('Failed to mark payment as paid:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return <Check className="h-4 w-4 text-green-400" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'OVERDUE':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const config = {
      PAID: { label: 'Paid', className: 'bg-green-500/20 text-green-400 border-green-500/50' },
      PENDING: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
      OVERDUE: { label: 'Overdue', className: 'bg-red-500/20 text-red-400 border-red-500/50' },
    };

    return (
      <Badge variant="default" className={config[status].className}>
        {config[status].label}
      </Badge>
    );
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No payment history</p>
        ) : (
          <div className="space-y-3">
            {payments.map(payment => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(payment.status)}
                  <div>
                    <p className="text-white font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-gray-400">
                      Due: {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                      {payment.paidDate && (
                        <span className="ml-2">
                          • Paid: {format(new Date(payment.paidDate), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(payment.status)}
                  {payment.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkPaid(payment.id)}
                      disabled={isLoading}
                      className="text-white border-white/20 hover:bg-white/10"
                    >
                      Mark Paid
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
