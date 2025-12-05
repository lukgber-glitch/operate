'use client';

import { CreditCard, Building2, Wallet, Smartphone, Banknote } from 'lucide-react';

import { cn } from '@/lib/utils';

export type PaymentMethod =
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANK_TRANSFER'
  | 'PAYPAL'
  | 'CASH'
  | 'OTHER';

interface PaymentMethodIconProps {
  method: PaymentMethod;
  lastFourDigits?: string;
  className?: string;
  showLabel?: boolean;
}

const methodConfig = {
  CREDIT_CARD: {
    label: 'Credit Card',
    icon: CreditCard,
    color: 'text-blue-600 dark:text-blue-400',
  },
  DEBIT_CARD: {
    label: 'Debit Card',
    icon: CreditCard,
    color: 'text-purple-600 dark:text-purple-400',
  },
  BANK_TRANSFER: {
    label: 'Bank Transfer',
    icon: Building2,
    color: 'text-green-600 dark:text-green-400',
  },
  PAYPAL: {
    label: 'PayPal',
    icon: Wallet,
    color: 'text-indigo-600 dark:text-indigo-400',
  },
  CASH: {
    label: 'Cash',
    icon: Banknote,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  OTHER: {
    label: 'Other',
    icon: Smartphone,
    color: 'text-gray-600 dark:text-gray-400',
  },
};

export function PaymentMethodIcon({
  method,
  lastFourDigits,
  className,
  showLabel = true,
}: PaymentMethodIconProps) {
  const config = methodConfig[method] || methodConfig.OTHER;
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icon className={cn('h-4 w-4', config.color)} />
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{config.label}</span>
          {lastFourDigits && (method === 'CREDIT_CARD' || method === 'DEBIT_CARD') && (
            <span className="text-xs text-muted-foreground">
              •••• {lastFourDigits}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
