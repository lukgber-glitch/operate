'use client';

import {
  AlertTriangle,
  Calendar,
  Lightbulb,
  TrendingUp,
  Zap,
  X,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard, AnimatedIcon, AnimatedButton } from '@/components/ui/animated';
import { cn } from '@/lib/utils';
import { Suggestion, SuggestionType, SuggestionPriority } from '@/types/suggestions';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onApply?: (id: string) => void;
  onDismiss?: (id: string) => void;
  compact?: boolean;
  staggerIndex?: number; // For stagger animation in grids
}

/**
 * SuggestionCard - Display AI suggestion with micro-interactions
 *
 * Enhanced with:
 * - Card hover lift effect
 * - Icon bounce on hover
 * - Button press feedback
 * - Stagger animations for grids
 * - Click feedback
 */
export function SuggestionCard({
  suggestion,
  onApply,
  onDismiss,
  compact = false,
  staggerIndex,
}: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApply = () => {
    if (onApply) {
      onApply(suggestion.id);
    } else if (suggestion.actionUrl) {
      window.location.href = suggestion.actionUrl;
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.(suggestion.id);
  };

  // Type-based styling
  const typeConfig = getTypeConfig(suggestion.type);
  const priorityConfig = getPriorityConfig(suggestion.priority);

  // Compact card for horizontal scroll
  if (compact) {
    return (
      <AnimatedCard
        hoverEffect="interactive"
        onClick={handleApply}
        staggerIndex={staggerIndex}
        className={cn(
          'min-w-[280px] max-w-[280px] border-l-4',
          typeConfig.borderColor
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <AnimatedIcon animation="bounce">
                <div className={cn('p-1.5 rounded-md', typeConfig.iconBg)}>
                  <typeConfig.icon className={cn('h-4 w-4', typeConfig.iconColor)} />
                </div>
              </AnimatedIcon>
              <Badge variant={priorityConfig.variant} className="text-xs">
                {suggestion.priority}
              </Badge>
            </div>
            {onDismiss && (
              <AnimatedButton
                variant="ghost"
                size="icon"
                pressEffect="soft"
                className="h-6 w-6 -mt-1 -me-1"
                onClick={handleDismiss}
                aria-label="Dismiss suggestion"
              >
                <X className="h-3 w-3" />
              </AnimatedButton>
            )}
          </div>
          <CardTitle className="text-sm line-clamp-2">{suggestion.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-xs line-clamp-2 mb-3">
            {suggestion.description}
          </CardDescription>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{typeConfig.label}</span>
            <AnimatedIcon animation="scale">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </AnimatedIcon>
          </div>
        </CardContent>
      </AnimatedCard>
    );
  }

  // Full card with expandable details
  return (
    <AnimatedCard
      hoverEffect="lift"
      staggerIndex={staggerIndex}
      className={cn('border-l-4', typeConfig.borderColor)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1">
            <AnimatedIcon animation="bounce">
              <div className={cn('p-2 rounded-lg', typeConfig.iconBg)}>
                <typeConfig.icon className={cn('h-5 w-5', typeConfig.iconColor)} />
              </div>
            </AnimatedIcon>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{suggestion.title}</CardTitle>
                <Badge variant={priorityConfig.variant} className="text-xs">
                  {suggestion.priority}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">{typeConfig.label}</span>
            </div>
          </div>
          {onDismiss && (
            <AnimatedButton
              variant="ghost"
              size="icon"
              pressEffect="soft"
              className="h-8 w-8 shrink-0"
              onClick={handleDismiss}
              aria-label="Dismiss suggestion"
            >
              <X className="h-4 w-4" />
            </AnimatedButton>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <CardDescription
          className={cn(
            'mb-4 whitespace-pre-wrap',
            !isExpanded && 'line-clamp-2'
          )}
        >
          {suggestion.description}
        </CardDescription>

        {suggestion.description.length > 100 && (
          <AnimatedButton
            variant="ghost"
            size="sm"
            pressEffect="soft"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mb-3 -ms-2"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </AnimatedButton>
        )}

        <div className="flex gap-2">
          {suggestion.actionLabel && (
            <AnimatedButton
              onClick={handleApply}
              size="sm"
              pressEffect="soft"
              className={typeConfig.buttonClass}
            >
              {suggestion.actionLabel}
            </AnimatedButton>
          )}
        </div>
      </CardContent>
    </AnimatedCard>
  );
}

function getTypeConfig(type: SuggestionType) {
  switch (type) {
    case 'WARNING':
      return {
        icon: AlertTriangle,
        label: 'Warning',
        iconColor: 'text-orange-600 dark:text-orange-400',
        iconBg: 'bg-orange-100 dark:bg-orange-950',
        borderColor: 'border-l-orange-500',
        buttonClass: 'bg-orange-600 hover:bg-orange-700',
      };
    case 'DEADLINE':
      return {
        icon: Calendar,
        label: 'Deadline',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        iconBg: 'bg-yellow-100 dark:bg-yellow-950',
        borderColor: 'border-l-yellow-500',
        buttonClass: 'bg-yellow-600 hover:bg-yellow-700',
      };
    case 'INSIGHT':
      return {
        icon: TrendingUp,
        label: 'Insight',
        iconColor: 'text-blue-600 dark:text-blue-400',
        iconBg: 'bg-blue-100 dark:bg-blue-950',
        borderColor: 'border-l-blue-500',
        buttonClass: 'bg-blue-600 hover:bg-blue-700',
      };
    case 'QUICK_ACTION':
      return {
        icon: Zap,
        label: 'Quick Action',
        iconColor: 'text-green-600 dark:text-green-400',
        iconBg: 'bg-green-100 dark:bg-green-950',
        borderColor: 'border-l-green-500',
        buttonClass: 'bg-green-600 hover:bg-green-700',
      };
    case 'TIP':
      return {
        icon: Lightbulb,
        label: 'Tip',
        iconColor: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-100 dark:bg-purple-950',
        borderColor: 'border-l-purple-500',
        buttonClass: 'bg-purple-600 hover:bg-purple-700',
      };
  }
}

function getPriorityConfig(priority: SuggestionPriority) {
  switch (priority) {
    case 'URGENT':
      return { variant: 'destructive' as const };
    case 'HIGH':
      return { variant: 'default' as const };
    case 'MEDIUM':
      return { variant: 'secondary' as const };
    case 'LOW':
      return { variant: 'outline' as const };
  }
}
