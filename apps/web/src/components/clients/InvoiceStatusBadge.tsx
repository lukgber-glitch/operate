'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Send,
  XCircle,
} from 'lucide-react';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const statusConfig: Record<
  InvoiceStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  }
> = {
  DRAFT: {
    label: 'Draft',
    icon: FileText,
    variant: 'outline',
    className: 'border-gray-300 text-gray-700 bg-gray-50',
  },
  SENT: {
    label: 'Sent',
    icon: Send,
    variant: 'outline',
    className: 'border-blue-300 text-blue-700 bg-blue-50',
  },
  PAID: {
    label: 'Paid',
    icon: CheckCircle2,
    variant: 'outline',
    className: 'border-green-300 text-green-700 bg-green-50',
  },
  OVERDUE: {
    label: 'Overdue',
    icon: AlertCircle,
    variant: 'destructive',
    className: 'border-red-300 text-red-700 bg-red-50',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    variant: 'outline',
    className: 'border-gray-400 text-gray-600 bg-gray-100',
  },
};

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
