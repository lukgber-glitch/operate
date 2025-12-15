'use client';

import { Badge } from '@/components/ui/badge';

interface PortalStatusBadgeProps {
  status: string;
  type?: 'invoice' | 'quote';
}

const invoiceStatusColors = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const quoteStatusColors = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  VIEWED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ACCEPTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export function PortalStatusBadge({ status, type = 'invoice' }: PortalStatusBadgeProps) {
  const colors = type === 'invoice' ? invoiceStatusColors : quoteStatusColors;
  const colorClass = colors[status as keyof typeof colors] || colors.DRAFT;

  return (
    <Badge variant="secondary" className={colorClass}>
      {status.replace(/_/g, ' ').toLowerCase()}
    </Badge>
  );
}
