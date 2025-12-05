'use client';

import { TrendingUp, DollarSign, Calendar, CreditCard } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PaymentSummaryCardProps {
  totalPaidThisYear: number;
  averagePaymentAmount: number;
  preferredPaymentMethod: string;
  averageDaysToPay: number;
  currency?: string;
  isLoading?: boolean;
  className?: string;
}

export function PaymentSummaryCard({
  totalPaidThisYear,
  averagePaymentAmount,
  preferredPaymentMethod,
  averageDaysToPay,
  currency = 'EUR',
  isLoading = false,
  className,
}: PaymentSummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const stats = [
    {
      label: 'Total Paid This Year',
      value: formatCurrency(totalPaidThisYear),
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      label: 'Average Payment',
      value: formatCurrency(averagePaymentAmount),
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Preferred Method',
      value: preferredPaymentMethod.replace(/_/g, ' '),
      icon: CreditCard,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      label: 'Avg. Days to Pay',
      value: `${averageDaysToPay} days`,
      icon: Calendar,
      color: averageDaysToPay <= 30 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400',
      bgColor: averageDaysToPay <= 30 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-orange-100 dark:bg-orange-900/20',
    },
  ];

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <Icon className={cn('h-4 w-4', stat.color)} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
