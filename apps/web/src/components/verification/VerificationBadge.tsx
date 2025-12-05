'use client';

import { Badge } from '@/components/ui/badge';
import { VerificationStatus } from '@/types/verification';
import { CheckCircle2, Clock, XCircle, AlertCircle, FileQuestion, CalendarX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  status: VerificationStatus;
  className?: string;
}

const statusConfig = {
  [VerificationStatus.NOT_STARTED]: {
    label: 'Not Started',
    icon: FileQuestion,
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  [VerificationStatus.PENDING]: {
    label: 'Pending',
    icon: Clock,
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  [VerificationStatus.UNDER_REVIEW]: {
    label: 'Under Review',
    icon: AlertCircle,
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
  [VerificationStatus.VERIFIED]: {
    label: 'Verified',
    icon: CheckCircle2,
    variant: 'default' as const,
    className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  },
  [VerificationStatus.REJECTED]: {
    label: 'Rejected',
    icon: XCircle,
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  },
  [VerificationStatus.EXPIRED]: {
    label: 'Expired',
    icon: CalendarX,
    variant: 'secondary' as const,
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  },
};

export function VerificationBadge({ status, className }: VerificationBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}
