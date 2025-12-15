"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, CheckCircle, Lightbulb } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

interface TaxSavingsCardProps {
  totalSavings: number;
  activeSuggestions: number;
  completedSuggestions: number;
  isLoading?: boolean;
}

export function TaxSavingsCard({
  totalSavings,
  activeSuggestions,
  completedSuggestions,
  isLoading,
}: TaxSavingsCardProps) {
  const totalSuggestions = activeSuggestions + completedSuggestions;
  const completionRate = totalSuggestions > 0
    ? Math.round((completedSuggestions / totalSuggestions) * 100)
    : 0;

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-16 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              Potential Tax Savings
            </div>
            <div className="text-5xl font-bold text-green-700 dark:text-green-400">
              €{totalSavings.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on {activeSuggestions} active suggestion{activeSuggestions !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Link href="/tax-assistant/suggestions">
              <Button>
                <Lightbulb className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-green-200 dark:border-green-800">
          <div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {activeSuggestions}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {completedSuggestions}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {completionRate}%
            </div>
            <div className="text-xs text-muted-foreground">Completion</div>
          </div>
        </div>

        {/* Progress Bar */}
        {totalSuggestions > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{completedSuggestions} of {totalSuggestions} suggestions completed</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        )}

        {/* Breakdown Link */}
        <div>
          <Link href="/tax-assistant/suggestions">
            <Button variant="link" className="p-0 h-auto text-green-700 dark:text-green-400">
              View detailed breakdown →
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
