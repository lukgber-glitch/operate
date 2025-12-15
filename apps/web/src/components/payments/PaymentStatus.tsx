'use client';

import React from 'react';
import {
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Ban,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PaymentStatus as PaymentStatusType } from '@/hooks/use-payments';

interface PaymentStatusProps {
  status: PaymentStatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  PaymentStatusType,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    textColor: 'text-zinc-400',
    borderColor: 'border-zinc-500/30',
  },
  AUTHORIZATION_REQUIRED: {
    label: 'Authorization Required',
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
  },
  AUTHORIZING: {
    label: 'Authorizing',
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  AUTHORIZED: {
    label: 'Authorized',
    icon: CheckCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  EXECUTED: {
    label: 'Executed',
    icon: CheckCircle,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  SETTLED: {
    label: 'Settled',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  FAILED: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: Ban,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    textColor: 'text-zinc-400',
    borderColor: 'border-zinc-500/30',
  },
};

const SIZE_CONFIG = {
  sm: {
    badge: 'text-xs px-2 py-0.5',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'text-sm px-2.5 py-1',
    icon: 'h-4 w-4',
  },
  lg: {
    badge: 'text-base px-3 py-1.5',
    icon: 'h-5 w-5',
  },
};

export function PaymentStatus({
  status,
  size = 'md',
  showIcon = true,
  className,
}: PaymentStatusProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;
  const isAnimated = status === 'AUTHORIZING';

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeConfig.badge,
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            sizeConfig.icon,
            config.color,
            isAnimated && 'animate-spin'
          )}
        />
      )}
      {config.label}
    </Badge>
  );
}
