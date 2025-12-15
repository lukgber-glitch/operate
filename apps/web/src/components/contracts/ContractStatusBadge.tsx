'use client';

import { Badge } from '@/components/ui/badge';

export type ContractStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'SIGNED'
  | 'EXPIRED'
  | 'CANCELLED';

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

const statusConfig: Record<
  ContractStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  },
  SENT: {
    label: 'Sent',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  VIEWED: {
    label: 'Viewed',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  },
  SIGNED: {
    label: 'Signed',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
};

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
