'use client';

import {
  AlertTriangle,
  Calendar,
  TrendingUp,
  DollarSign,
  Bell,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AIInsight, InsightCategory, InsightUrgency } from '@/types/ai-insights';

interface InsightItemProps {
  insight: AIInsight;
  onExpand?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onAction?: (id: string, actionData?: any) => void;
  compact?: boolean;
}

/**
 * InsightItem - Individual AI insight display component
 *
 * Features:
 * - Category-based icons and colors
 * - Urgency/priority indicators
 * - Expandable/collapsible details
 * - Action buttons (view details, take action, dismiss)
 * - Metric display with trends
 * - Responsive layout
 */
export function InsightItem({
  insight,
  onExpand,
  onDismiss,
  onAction,
  compact = false,
}: InsightItemProps) {
  const [isExpanded, setIsExpanded] = useState(insight.isExpanded || false);

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onExpand) {
      onExpand(insight.id);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(insight.id);
    }
  };

  const handleAction = () => {
    if (onAction) {
      onAction(insight.id, insight.actionData);
    } else if (insight.actionUrl) {
      window.location.href = insight.actionUrl;
    }
  };

  const categoryConfig = getCategoryConfig(insight.category);
  const urgencyConfig = getUrgencyConfig(insight.urgency);

  // Determine if insight is expired
  const isExpired = insight.expiresAt && new Date(insight.expiresAt) < new Date();
  const isSnoozed = insight.snoozeUntil && new Date(insight.snoozeUntil) > new Date();

  if (insight.isDismissed && !compact) {
    return null;
  }

  // Compact mode for smaller spaces
  if (compact) {
    return (
      <Card
        className={cn(
          'min-w-[260px] max-w-[260px] cursor-pointer transition-all hover:shadow-md',
          'border-l-4',
          categoryConfig.borderColor,
          isExpired && 'opacity-50',
          isSnoozed && 'opacity-70'
        )}
        onClick={handleAction}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded-md', categoryConfig.iconBg)}>
                <categoryConfig.icon className={cn('h-3.5 w-3.5', categoryConfig.iconColor)} />
              </div>
              <Badge variant={urgencyConfig.variant} className="text-xs">
                {insight.urgency}
              </Badge>
            </div>
            {insight.dismissable && onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 -mt-1 -me-1"
                onClick={handleDismiss}
                aria-label="Dismiss insight"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <CardTitle className="text-sm line-clamp-2 mt-2">{insight.title}</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <CardDescription className="text-xs line-clamp-2">
            {insight.summary || insight.description}
          </CardDescription>
          {insight.metric && (
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-sm font-semibold">{insight.metric.value}</span>
              <span className="text-xs text-gray-300">{insight.metric.label}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full card with expandable details
  return (
    <Card
      className={cn(
        'transition-all hover:shadow-sm border-l-4',
        categoryConfig.borderColor,
        isExpired && 'opacity-50',
        isSnoozed && 'opacity-70'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div className={cn('p-2 rounded-lg shrink-0', categoryConfig.iconBg)}>
              <categoryConfig.icon className={cn('h-5 w-5', categoryConfig.iconColor)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <CardTitle className="text-base">{insight.title}</CardTitle>
                <Badge variant={urgencyConfig.variant} className="text-xs">
                  {insight.urgency}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {categoryConfig.label}
                </Badge>
              </div>

              {/* Metric (if available) */}
              {insight.metric && (
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-lg font-semibold">{insight.metric.value}</span>
                  <span className="text-xs text-gray-300">{insight.metric.label}</span>
                  {insight.metric.change && (
                    <div className={cn('flex items-center gap-1', getTrendColor(insight.metric.change.direction))}>
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs font-medium">
                        {Math.abs(insight.metric.change.value)}%
                      </span>
                      <span className="text-xs text-gray-300">
                        {insight.metric.change.label}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Summary/Description */}
              <CardDescription
                className={cn(
                  'text-sm',
                  !isExpanded && 'line-clamp-2'
                )}
              >
                {isExpanded
                  ? insight.details || insight.description
                  : insight.summary || insight.description
                }
              </CardDescription>

              {/* Tags */}
              {insight.tags && insight.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {insight.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Expiry/Snooze info */}
              {(isExpired || isSnoozed) && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-300">
                  <Clock className="h-3 w-3" />
                  {isExpired && <span>Expired</span>}
                  {isSnoozed && (
                    <span>Snoozed until {new Date(insight.snoozeUntil!).toLocaleDateString()}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Expand/Collapse */}
            {(insight.details || insight.description.length > 100) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleExpanded}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Dismiss */}
            {insight.dismissable && onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleDismiss}
                aria-label="Dismiss insight"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Action Buttons */}
      {(insight.actionLabel || insight.actionUrl) && (
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              onClick={handleAction}
              size="sm"
              className={urgencyConfig.buttonClass}
            >
              {insight.actionLabel || 'View Details'}
              {insight.actionUrl && <ExternalLink className="ml-2 h-3 w-3" />}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function getCategoryConfig(category: InsightCategory) {
  switch (category) {
    case 'TAX_OPTIMIZATION':
      return {
        icon: DollarSign,
        label: 'Tax Optimization',
        iconColor: 'text-green-400',
        iconBg: 'bg-green-100 dark:bg-green-950',
        borderColor: 'border-l-green-500',
      };
    case 'EXPENSE_ANOMALY':
      return {
        icon: AlertTriangle,
        label: 'Expense Anomaly',
        iconColor: 'text-orange-400',
        iconBg: 'bg-orange-100 dark:bg-orange-950',
        borderColor: 'border-l-orange-500',
      };
    case 'CASH_FLOW':
      return {
        icon: TrendingUp,
        label: 'Cash Flow',
        iconColor: 'text-blue-600 dark:text-blue-400',
        iconBg: 'bg-blue-100 dark:bg-blue-950',
        borderColor: 'border-l-blue-500',
      };
    case 'PAYMENT_REMINDER':
      return {
        icon: Calendar,
        label: 'Payment Reminder',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        iconBg: 'bg-yellow-100 dark:bg-yellow-950',
        borderColor: 'border-l-yellow-500',
      };
    case 'GENERAL':
    default:
      return {
        icon: Lightbulb,
        label: 'General',
        iconColor: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-100 dark:bg-purple-950',
        borderColor: 'border-l-purple-500',
      };
  }
}

function getUrgencyConfig(urgency: InsightUrgency) {
  switch (urgency) {
    case 'URGENT':
      return {
        variant: 'destructive' as const,
        buttonClass: 'bg-red-600 hover:bg-red-700',
      };
    case 'HIGH':
      return {
        variant: 'default' as const,
        buttonClass: 'bg-orange-600 hover:bg-orange-700',
      };
    case 'MEDIUM':
      return {
        variant: 'secondary' as const,
        buttonClass: 'bg-blue-600 hover:bg-blue-700',
      };
    case 'LOW':
      return {
        variant: 'outline' as const,
        buttonClass: 'bg-gray-600 hover:bg-gray-700',
      };
  }
}

function getTrendColor(direction: 'up' | 'down' | 'stable') {
  switch (direction) {
    case 'up':
      return 'text-green-400';
    case 'down':
      return 'text-red-400';
    case 'stable':
      return 'text-gray-300';
  }
}
