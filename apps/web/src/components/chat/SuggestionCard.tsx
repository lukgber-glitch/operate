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
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Suggestion, SuggestionType, SuggestionPriority } from '@/types/suggestions';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onApply?: (id: string) => void;
  onDismiss?: (id: string) => void;
  compact?: boolean;
}

/**
 * Entity type and ID extracted from suggestion
 */
interface EntityReference {
  type: 'invoice' | 'customer' | 'expense' | 'bill' | 'employee' | null;
  id: string | null;
  url: string | null;
}

/**
 * Entity detection patterns for parsing suggestion text
 */
const entityPatterns = {
  invoice: /Invoice #?(\w+)/i,
  customer: /Customer:?\s+([^,\n]+)/i,
  expense: /Expense #?(\w+)/i,
  bill: /Bill #?(\w+)/i,
  employee: /Employee:?\s+([^,\n]+)/i,
};

/**
 * Extract entity reference from suggestion text and metadata
 */
function extractEntityReference(suggestion: Suggestion): EntityReference {
  // First, check if there's an explicit actionUrl that points to an entity
  if (suggestion.actionUrl) {
    // Parse actionUrl to extract entity type and ID
    const urlMatch = suggestion.actionUrl.match(/\/(invoices|customers|expenses|bills|hr\/employees)\/([^/?]+)/);
    if (urlMatch && urlMatch[1] && urlMatch[2]) {
      const type = urlMatch[1] === 'hr/employees' ? 'employee' : urlMatch[1].slice(0, -1) as EntityReference['type'];
      return {
        type,
        id: urlMatch[2],
        url: suggestion.actionUrl,
      };
    }
    // External URL
    return { type: null, id: null, url: suggestion.actionUrl };
  }

  // Try to detect entity from suggestion text
  const combinedText = `${suggestion.title} ${suggestion.description}`;

  for (const [type, pattern] of Object.entries(entityPatterns)) {
    const match = combinedText.match(pattern);
    if (match && match[1]) {
      const id: string = match[1];
      let url: string;

      switch (type) {
        case 'invoice':
          url = `/invoices/${id}`;
          break;
        case 'customer':
          // For customer names, we'd need to look up the ID - for now use a placeholder
          // In production, this would query the API or use suggestion.entityId
          url = suggestion.entityId ? `/customers/${suggestion.entityId}` : `/customers`;
          break;
        case 'expense':
          url = `/expenses/${id}`;
          break;
        case 'bill':
          url = `/bills/${id}`;
          break;
        case 'employee':
          // For employee names, we'd need to look up the ID
          url = suggestion.entityId ? `/hr/employees/${suggestion.entityId}` : `/hr/employees`;
          break;
        default:
          url = '/';
      }

      return {
        type: type as EntityReference['type'],
        id,
        url,
      };
    }
  }

  // No entity detected
  return { type: null, id: null, url: null };
}

/**
 * SuggestionCard - Display AI suggestion with appropriate styling
 *
 * Features:
 * - Type-based icons and colors
 * - Priority indicators
 * - Expandable description
 * - Action buttons (apply/dismiss)
 * - Compact mode for horizontal lists
 * - Entity navigation (clickable cards)
 * - Hover effects for interactive cards
 */
export function SuggestionCard({
  suggestion,
  onApply,
  onDismiss,
  compact = false,
}: SuggestionCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const entityRef = extractEntityReference(suggestion);

  const handleApply = (e?: React.MouseEvent) => {
    // Prevent card click when clicking action button
    e?.stopPropagation();

    if (onApply) {
      onApply(suggestion.id);
    } else if (entityRef.url) {
      // Check if external URL
      if (entityRef.url.startsWith('http://') || entityRef.url.startsWith('https://')) {
        window.open(entityRef.url, '_blank', 'noopener,noreferrer');
      } else {
        router.push(entityRef.url);
      }
    }
  };

  const handleCardClick = () => {
    // Navigate to entity when card is clicked
    if (entityRef.url) {
      // Check if external URL
      if (entityRef.url.startsWith('http://') || entityRef.url.startsWith('https://')) {
        window.open(entityRef.url, '_blank', 'noopener,noreferrer');
      } else {
        router.push(entityRef.url);
      }
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.(suggestion.id);
  };

  const isClickable = !!entityRef.url;

  // Type-based styling
  const typeConfig = getTypeConfig(suggestion.type);
  const priorityConfig = getPriorityConfig(suggestion.priority);

  // Compact card for horizontal scroll
  if (compact) {
    return (
      <Card
        className={cn(
          'min-w-[280px] max-w-[280px] transition-all border-l-4',
          typeConfig.borderColor,
          isClickable && 'cursor-pointer hover:shadow-md hover:border-l-[6px]'
        )}
        onClick={isClickable ? handleCardClick : undefined}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded-md', typeConfig.iconBg)}>
                <typeConfig.icon className={cn('h-4 w-4', typeConfig.iconColor)} />
              </div>
              <Badge variant={priorityConfig.variant} className="text-xs">
                {suggestion.priority}
              </Badge>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1 -me-1"
                onClick={handleDismiss}
                aria-label="Dismiss suggestion"
              >
                <X className="h-3 w-3" />
              </Button>
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
            {isClickable && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full card with expandable details
  return (
    <Card
      className={cn(
        'transition-all border-l-4',
        typeConfig.borderColor,
        isClickable && 'cursor-pointer hover:shadow-md hover:border-l-[6px]'
      )}
      onClick={isClickable ? handleCardClick : undefined}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1">
            <div className={cn('p-2 rounded-lg', typeConfig.iconBg)}>
              <typeConfig.icon className={cn('h-5 w-5', typeConfig.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{suggestion.title}</CardTitle>
                <Badge variant={priorityConfig.variant} className="text-xs">
                  {suggestion.priority}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{typeConfig.label}</span>
                {entityRef.type && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground capitalize">{entityRef.type}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleDismiss}
              aria-label="Dismiss suggestion"
            >
              <X className="h-4 w-4" />
            </Button>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mb-3 -ms-2"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>
        )}

        <div className="flex gap-2">
          {suggestion.actionLabel && (
            <Button onClick={handleApply} size="sm" className={typeConfig.buttonClass}>
              {suggestion.actionLabel}
              {isClickable && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
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
