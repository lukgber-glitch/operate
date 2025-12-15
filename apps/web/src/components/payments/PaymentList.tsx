'use client';

import React, { useEffect } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { formatRelativeTime } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaymentStatus } from './PaymentStatus';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ExternalLink, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  usePayments,
  type Payment,
  type PaymentFilters,
  type PaymentStatus as PaymentStatusType,
} from '@/hooks/use-payments';

interface PaymentListProps {
  filters?: PaymentFilters;
  onPaymentClick?: (payment: Payment) => void;
  className?: string;
}

const STATUS_FILTER_OPTIONS: { value: PaymentStatusType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Payments' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'AUTHORIZATION_REQUIRED', label: 'Authorization Required' },
  { value: 'AUTHORIZED', label: 'Authorized' },
  { value: 'EXECUTED', label: 'Executed' },
  { value: 'SETTLED', label: 'Settled' },
  { value: 'FAILED', label: 'Failed' },
];

export function PaymentList({ filters, onPaymentClick, className }: PaymentListProps) {
  const { payments, isLoading, error, listPayments } = usePayments();
  const [activeFilter, setActiveFilter] = React.useState<PaymentStatusType | 'ALL'>('ALL');

  useEffect(() => {
    const filterParams = {
      ...filters,
      ...(activeFilter !== 'ALL' && { status: activeFilter }),
    };
    listPayments(filterParams);
  }, [filters, activeFilter, listPayments]);

  if (isLoading && payments.length === 0) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 bg-zinc-900/50 border-zinc-800">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32 bg-zinc-800" />
                <Skeleton className="h-6 w-24 bg-zinc-800" />
              </div>
              <Skeleton className="h-8 w-full bg-zinc-800" />
              <Skeleton className="h-4 w-48 bg-zinc-800" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-500/10 border-red-500/30">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  const filteredPayments = payments.filter(
    (payment) => activeFilter === 'ALL' || payment.status === activeFilter
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STATUS_FILTER_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={activeFilter === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(option.value)}
            className={cn(
              'whitespace-nowrap',
              activeFilter === option.value
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700'
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Payment List */}
      {filteredPayments.length === 0 ? (
        <Card className="p-8 bg-zinc-900/50 border-zinc-800 text-center">
          <p className="text-zinc-400">No payments found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <Card
              key={payment.id}
              className={cn(
                'p-4 bg-zinc-900/50 border-zinc-800 transition-colors',
                onPaymentClick && 'cursor-pointer hover:bg-zinc-800/50'
              )}
              onClick={() => onPaymentClick?.(payment)}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-400">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatRelativeTime(payment.createdAt)}
                    </span>
                  </div>
                  <PaymentStatus status={payment.status} size="sm" />
                </div>

                {/* Amount and Beneficiary */}
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="text-2xl font-semibold text-white">
                      {formatCurrency(payment.amount, payment.currency)}
                    </h3>
                    <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-700">
                      {payment.currency}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-300">{payment.beneficiary.name}</p>
                  {payment.beneficiary.iban && (
                    <p className="text-xs text-zinc-500 font-mono">{payment.beneficiary.iban}</p>
                  )}
                </div>

                {/* Reference and Metadata */}
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">
                    <span className="text-zinc-500">Ref:</span> {payment.reference}
                  </p>
                  {payment.metadata?.description && (
                    <p className="text-sm text-zinc-500">{payment.metadata.description}</p>
                  )}
                </div>

                {/* Related Documents */}
                {(payment.metadata?.billId || payment.metadata?.invoiceId) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                    <FileText className="h-4 w-4 text-zinc-500" />
                    <span className="text-xs text-zinc-500">
                      {payment.metadata.billId && `Bill #${payment.metadata.billId}`}
                      {payment.metadata.invoiceId && `Invoice #${payment.metadata.invoiceId}`}
                    </span>
                  </div>
                )}

                {/* Authorization Link */}
                {payment.status === 'AUTHORIZATION_REQUIRED' && payment.authorizationUrl && (
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = payment.authorizationUrl!;
                    }}
                  >
                    Complete Authorization
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
