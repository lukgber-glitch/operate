'use client';

import {
  AlertTriangle,
  Calendar,
  TrendingUp,
  DollarSign,
  Lightbulb,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { InsightCategory } from '@/types/ai-insights';

interface InsightsCategoryBadgeProps {
  category: InsightCategory;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * InsightsCategoryBadge - Category badge with icon
 *
 * Features:
 * - Category-specific colors and icons
 * - Multiple size variants
 * - Optional icon display
 */
export function InsightsCategoryBadge({
  category,
  size = 'md',
  showIcon = true,
  className,
}: InsightsCategoryBadgeProps) {
  const config = getCategoryConfig(category);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5',
        sizeClasses[size],
        config.colorClass,
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}

function getCategoryConfig(category: InsightCategory) {
  switch (category) {
    case 'TAX_OPTIMIZATION':
      return {
        icon: DollarSign,
        label: 'Tax Optimization',
        colorClass: 'text-green-600 dark:text-green-400 border-green-500',
      };
    case 'EXPENSE_ANOMALY':
      return {
        icon: AlertTriangle,
        label: 'Expense Anomaly',
        colorClass: 'text-orange-600 dark:text-orange-400 border-orange-500',
      };
    case 'CASH_FLOW':
      return {
        icon: TrendingUp,
        label: 'Cash Flow',
        colorClass: 'text-blue-600 dark:text-blue-400 border-blue-500',
      };
    case 'PAYMENT_REMINDER':
      return {
        icon: Calendar,
        label: 'Payment Reminder',
        colorClass: 'text-yellow-600 dark:text-yellow-400 border-yellow-500',
      };
    case 'GENERAL':
    default:
      return {
        icon: Lightbulb,
        label: 'General',
        colorClass: 'text-purple-600 dark:text-purple-400 border-purple-500',
      };
  }
}
