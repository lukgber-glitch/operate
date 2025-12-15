'use client';

import { Badge } from '@/components/ui/badge';
import { InsuranceStatus } from '@/hooks/use-insurance';

interface InsuranceStatusBadgeProps {
  status: InsuranceStatus;
}

export function InsuranceStatusBadge({ status }: InsuranceStatusBadgeProps) {
  const statusConfig = {
    ACTIVE: {
      label: 'Active',
      variant: 'default' as const,
      className: 'bg-green-500/20 text-green-400 border-green-500/50',
    },
    EXPIRING: {
      label: 'Expiring Soon',
      variant: 'default' as const,
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    },
    EXPIRED: {
      label: 'Expired',
      variant: 'destructive' as const,
      className: 'bg-red-500/20 text-red-400 border-red-500/50',
    },
    CANCELLED: {
      label: 'Cancelled',
      variant: 'secondary' as const,
      className: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
