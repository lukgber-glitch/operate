'use client';

import { AlertTriangle, Calendar, Clock, X } from 'lucide-react';
import { useMemo } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Deadline } from '@/types/suggestions';

interface DeadlineReminderProps {
  deadline: Deadline;
  onAction?: () => void;
  onDismiss?: (remindLater?: Date) => void;
  className?: string;
}

/**
 * DeadlineReminder - Banner alert for upcoming deadlines
 *
 * Features:
 * - Days remaining with urgency styling
 * - Category-based icons
 * - Action button
 * - Dismissible with "remind me later"
 * - Urgency-based color scheme
 */
export function DeadlineReminder({
  deadline,
  onAction,
  onDismiss,
  className,
}: DeadlineReminderProps) {
  const daysRemaining = useMemo(() => {
    const now = new Date();
    const due = new Date(deadline.dueDate);
    const diff = due.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [deadline.dueDate]);

  const urgencyConfig = getUrgencyConfig(daysRemaining, deadline.status);

  const handleRemindLater = () => {
    // Remind in 1 day
    const remindAt = new Date();
    remindAt.setDate(remindAt.getDate() + 1);
    onDismiss?.(remindAt);
  };

  const CategoryIcon = getCategoryIcon(deadline.category);

  return (
    <Alert
      className={cn(
        'border-l-4 shadow-sm',
        urgencyConfig.borderColor,
        urgencyConfig.bgColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', urgencyConfig.iconBg)}>
          <CategoryIcon className={cn('h-5 w-5', urgencyConfig.iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AlertTitle className="mb-0 text-sm font-semibold">
              {deadline.title}
            </AlertTitle>
            <Badge variant={urgencyConfig.badgeVariant} className="text-xs">
              {urgencyConfig.label}
            </Badge>
          </div>

          <AlertDescription className="text-sm mb-3">
            {deadline.description}
          </AlertDescription>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Clock className="h-3 w-3" />
            <span>
              {daysRemaining > 0
                ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`
                : daysRemaining === 0
                  ? 'Due today'
                  : `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} overdue`}
            </span>
            <span className="mx-1">•</span>
            <Calendar className="h-3 w-3" />
            <span>{new Date(deadline.dueDate).toLocaleDateString()}</span>
          </div>

          <div className="flex gap-2">
            {deadline.actionLabel && (
              <Button
                size="sm"
                onClick={onAction}
                className={urgencyConfig.buttonClass}
              >
                {deadline.actionLabel}
              </Button>
            )}

            {onDismiss && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRemindLater}
                >
                  Remind later
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDismiss()}
                >
                  Dismiss
                </Button>
              </>
            )}
          </div>
        </div>

        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => onDismiss()}
            aria-label="Dismiss deadline reminder"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}

function getUrgencyConfig(daysRemaining: number, status: Deadline['status']) {
  if (daysRemaining < 0 || status === 'OVERDUE') {
    return {
      label: 'Overdue',
      borderColor: 'border-l-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      iconBg: 'bg-red-100 dark:bg-red-950',
      iconColor: 'text-red-600 dark:text-red-400',
      badgeVariant: 'destructive' as const,
      buttonClass: 'bg-red-600 hover:bg-red-700',
    };
  }

  if (daysRemaining <= 3) {
    return {
      label: 'Urgent',
      borderColor: 'border-l-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      iconBg: 'bg-orange-100 dark:bg-orange-950',
      iconColor: 'text-orange-600 dark:text-orange-400',
      badgeVariant: 'destructive' as const,
      buttonClass: 'bg-orange-600 hover:bg-orange-700',
    };
  }

  if (daysRemaining <= 7) {
    return {
      label: 'Due soon',
      borderColor: 'border-l-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      iconBg: 'bg-yellow-100 dark:bg-yellow-950',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      badgeVariant: 'default' as const,
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700',
    };
  }

  return {
    label: 'Upcoming',
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    iconBg: 'bg-blue-100 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badgeVariant: 'secondary' as const,
    buttonClass: 'bg-blue-600 hover:bg-blue-700',
  };
}

function getCategoryIcon(category: Deadline['category']) {
  switch (category) {
    case 'TAX':
      return AlertTriangle;
    case 'PAYROLL':
      return Calendar;
    case 'INVOICE':
      return Clock;
    case 'COMPLIANCE':
      return AlertTriangle;
    default:
      return Calendar;
  }
}
