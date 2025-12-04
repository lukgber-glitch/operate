'use client';

import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Insight } from '@/types/suggestions';

interface InsightsWidgetProps {
  insights: Insight[];
  className?: string;
}

/**
 * InsightsWidget - Display AI insights with trend indicators
 *
 * Features:
 * - Trend indicators (up/down/stable)
 * - Value and comparison display
 * - Expandable/collapsible cards
 * - Minimal and expanded views
 * - Type-based badges
 */
export function InsightsWidget({ insights, className }: InsightsWidgetProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {insights.map((insight) => {
        const isExpanded = expandedIds.has(insight.id);
        const TrendIcon = getTrendIcon(insight.change?.direction);
        const trendColor = getTrendColor(insight.change?.direction);

        return (
          <Card key={insight.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-sm font-medium">
                      {insight.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {insight.type}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {insight.metric}
                  </CardDescription>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => toggleExpanded(insight.id)}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Value and Trend */}
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-2xl font-bold">{insight.value}</span>
                {insight.change && (
                  <div className={cn('flex items-center gap-1', trendColor)}>
                    <TrendIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {Math.abs(insight.change.value)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {insight.change.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Comparison */}
              {insight.comparison && (
                <div className="text-xs text-muted-foreground mb-2">
                  {insight.comparison.label}: {insight.comparison.value}
                </div>
              )}

              {/* Expanded Description */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {insight.description}
                  </p>

                  {insight.chartData && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-md">
                      <span className="text-xs text-muted-foreground">
                        Chart visualization would go here
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function getTrendIcon(direction?: 'up' | 'down' | 'stable') {
  switch (direction) {
    case 'up':
      return TrendingUp;
    case 'down':
      return TrendingDown;
    case 'stable':
      return Minus;
    default:
      return Minus;
  }
}

function getTrendColor(direction?: 'up' | 'down' | 'stable') {
  switch (direction) {
    case 'up':
      return 'text-green-600 dark:text-green-400';
    case 'down':
      return 'text-red-600 dark:text-red-400';
    case 'stable':
      return 'text-muted-foreground';
    default:
      return 'text-muted-foreground';
  }
}
