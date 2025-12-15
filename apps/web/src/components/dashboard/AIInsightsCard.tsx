'use client';

import { RefreshCw, Filter, TrendingUp, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAIInsights } from '@/hooks/useAIInsights';
import { InsightCategory, InsightUrgency } from '@/types/ai-insights';
import { InsightItem } from './insights/InsightItem';

export interface AIInsightsCardProps {
  className?: string;
  maxHeight?: string;
  limit?: number;
  showFilters?: boolean;
  showRefresh?: boolean;
  autoRefresh?: boolean;
  onInsightAction?: (id: string, actionData?: any) => void;
}

/**
 * AIInsightsCard - Dashboard card displaying AI-generated insights
 *
 * Features:
 * - Real-time insights from proactive suggestions service
 * - Category-based filtering
 * - Urgency-based prioritization
 * - Expandable insight details
 * - Dismissable insights
 * - Loading states and skeletons
 * - Empty state
 * - Auto-refresh capability
 * - Responsive layout
 */
export function AIInsightsCard({
  className,
  maxHeight = '600px',
  limit = 10,
  showFilters = true,
  showRefresh = true,
  autoRefresh = false,
  onInsightAction,
}: AIInsightsCardProps) {
  const [categoryFilters, setCategoryFilters] = useState<InsightCategory[]>([]);
  const [urgencyFilters, setUrgencyFilters] = useState<InsightUrgency[]>([]);
  const [showDismissed, setShowDismissed] = useState(false);

  const {
    insights,
    isLoading,
    error,
    refresh,
    dismissInsight,
    clearDismissed,
  } = useAIInsights({
    filters: {
      categories: categoryFilters.length > 0 ? categoryFilters : undefined,
      urgency: urgencyFilters.length > 0 ? urgencyFilters : undefined,
      dismissed: showDismissed,
      limit,
    },
    autoRefresh,
    refreshInterval: 300000, // 5 minutes
  });

  const handleCategoryToggle = (category: InsightCategory) => {
    setCategoryFilters((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleUrgencyToggle = (urgency: InsightUrgency) => {
    setUrgencyFilters((prev) =>
      prev.includes(urgency)
        ? prev.filter((u) => u !== urgency)
        : [...prev, urgency]
    );
  };

  const handleRefresh = async () => {
    await refresh();
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismissInsight(id);
    } catch (error) {
      console.error('Failed to dismiss insight:', error);
    }
  };

  const handleInsightAction = (id: string, actionData?: any) => {
    if (onInsightAction) {
      onInsightAction(id, actionData);
    }
  };

  // Count insights by urgency
  const urgentCount = insights.filter((i) => i.urgency === 'URGENT').length;
  const highCount = insights.filter((i) => i.urgency === 'HIGH').length;

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI Insights</CardTitle>
              {(urgentCount > 0 || highCount > 0) && (
                <div className="flex gap-1">
                  {urgentCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {urgentCount} Urgent
                    </Badge>
                  )}
                  {highCount > 0 && (
                    <Badge variant="default" className="text-xs">
                      {highCount} High
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <CardDescription className="text-sm">
              Proactive suggestions and insights from AI analysis
            </CardDescription>
          </div>

          <div className="flex items-center gap-1">
            {/* Filters */}
            {showFilters && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {CATEGORIES.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category.value}
                      checked={categoryFilters.includes(category.value)}
                      onCheckedChange={() => handleCategoryToggle(category.value)}
                    >
                      {category.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Urgency</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {URGENCIES.map((urgency) => (
                    <DropdownMenuCheckboxItem
                      key={urgency.value}
                      checked={urgencyFilters.includes(urgency.value)}
                      onCheckedChange={() => handleUrgencyToggle(urgency.value)}
                    >
                      {urgency.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={showDismissed}
                    onCheckedChange={setShowDismissed}
                  >
                    Show Dismissed
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Refresh */}
            {showRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {(categoryFilters.length > 0 || urgencyFilters.length > 0) && (
          <div className="flex gap-1 flex-wrap mt-2">
            {categoryFilters.map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {CATEGORIES.find((c) => c.value === category)?.label}
                <button
                  onClick={() => handleCategoryToggle(category)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
            {urgencyFilters.map((urgency) => (
              <Badge key={urgency} variant="secondary" className="text-xs">
                {URGENCIES.find((u) => u.value === urgency)?.label}
                <button
                  onClick={() => handleUrgencyToggle(urgency)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center p-8 text-center">
            <div>
              <p className="text-sm text-destructive mb-2">Failed to load insights</p>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <InsightSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && insights.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <TrendingUp className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-sm font-medium mb-1">No insights available</h3>
            <p className="text-xs text-gray-300 mb-4">
              {categoryFilters.length > 0 || urgencyFilters.length > 0
                ? 'Try adjusting your filters'
                : 'Check back later for AI-generated insights'}
            </p>
            {(categoryFilters.length > 0 || urgencyFilters.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCategoryFilters([]);
                  setUrgencyFilters([]);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Insights List */}
        {!isLoading && !error && insights.length > 0 && (
          <ScrollArea className="pr-4" style={{ maxHeight }}>
            <div className="space-y-3">
              {insights.map((insight) => (
                <InsightItem
                  key={insight.id}
                  insight={insight}
                  onDismiss={handleDismiss}
                  onAction={handleInsightAction}
                />
              ))}
            </div>

            {/* Show dismissed count */}
            {showDismissed && insights.some((i) => i.isDismissed) && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDismissed}
                  className="w-full"
                >
                  Clear Dismissed Insights
                </Button>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for insight item
 */
function InsightSkeleton() {
  return (
    <Card className="border-l-4 border-l-muted">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <Skeleton className="h-7 w-7 rounded shrink-0" />
        </div>
      </CardHeader>
    </Card>
  );
}

// Filter options
const CATEGORIES: { label: string; value: InsightCategory }[] = [
  { label: 'Tax Optimization', value: 'TAX_OPTIMIZATION' },
  { label: 'Expense Anomaly', value: 'EXPENSE_ANOMALY' },
  { label: 'Cash Flow', value: 'CASH_FLOW' },
  { label: 'Payment Reminder', value: 'PAYMENT_REMINDER' },
  { label: 'General', value: 'GENERAL' },
];

const URGENCIES: { label: string; value: InsightUrgency }[] = [
  { label: 'Urgent', value: 'URGENT' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
];
