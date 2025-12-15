'use client';

import {
  Tags,
  FileText,
  Bell,
  GitMerge,
  Camera,
  CreditCard,
  Receipt,
  LucideIcon,
} from 'lucide-react';
import { AutopilotActionType } from '@/hooks/use-autopilot';

interface AutopilotActionIconProps {
  type: AutopilotActionType;
  className?: string;
}

const iconMap: Record<AutopilotActionType, LucideIcon> = {
  CATEGORIZE_TRANSACTION: Tags,
  CREATE_INVOICE: FileText,
  SEND_REMINDER: Bell,
  RECONCILE_TRANSACTION: GitMerge,
  EXTRACT_RECEIPT: Camera,
  PAY_BILL: CreditCard,
  FILE_EXPENSE: Receipt,
};

export function AutopilotActionIcon({ type, className }: AutopilotActionIconProps) {
  const Icon = iconMap[type];
  return <Icon className={className} />;
}

export function getActionTypeLabel(type: AutopilotActionType): string {
  const labels: Record<AutopilotActionType, string> = {
    CATEGORIZE_TRANSACTION: 'Categorize Transaction',
    CREATE_INVOICE: 'Create Invoice',
    SEND_REMINDER: 'Send Reminder',
    RECONCILE_TRANSACTION: 'Reconcile Transaction',
    EXTRACT_RECEIPT: 'Extract Receipt',
    PAY_BILL: 'Pay Bill',
    FILE_EXPENSE: 'File Expense',
  };
  return labels[type];
}

export function getActionTypeColor(type: AutopilotActionType): string {
  const colors: Record<AutopilotActionType, string> = {
    CATEGORIZE_TRANSACTION: 'text-blue-400 bg-blue-500/10',
    CREATE_INVOICE: 'text-green-400 bg-green-500/10',
    SEND_REMINDER: 'text-yellow-400 bg-yellow-500/10',
    RECONCILE_TRANSACTION: 'text-purple-400 bg-purple-500/10',
    EXTRACT_RECEIPT: 'text-pink-400 bg-pink-500/10',
    PAY_BILL: 'text-orange-400 bg-orange-500/10',
    FILE_EXPENSE: 'text-cyan-400 bg-cyan-500/10',
  };
  return colors[type];
}
