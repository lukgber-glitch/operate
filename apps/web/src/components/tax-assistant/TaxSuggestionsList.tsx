"use client";

import { TaxSuggestionCard } from "./TaxSuggestionCard";
import { Lightbulb } from "lucide-react";

interface TaxSuggestion {
  id: string;
  type: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  potentialSavings: number;
  expiresAt?: string;
  actionUrl?: string;
  actionLabel?: string;
  status: "ACTIVE" | "COMPLETED" | "DISMISSED";
}

interface TaxSuggestionsListProps {
  suggestions: TaxSuggestion[];
  isLoading?: boolean;
}

export function TaxSuggestionsList({ suggestions, isLoading }: TaxSuggestionsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Active Suggestions</h3>
        <p className="text-sm text-muted-foreground">
          You're all caught up! We'll notify you when new tax-saving opportunities are found.
        </p>
      </div>
    );
  }

  // Group suggestions by priority
  const highPriority = suggestions.filter((s) => s.priority === "HIGH");
  const mediumPriority = suggestions.filter((s) => s.priority === "MEDIUM");
  const lowPriority = suggestions.filter((s) => s.priority === "LOW");

  return (
    <div className="space-y-6">
      {/* High Priority */}
      {highPriority.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
            High Priority ({highPriority.length})
          </h3>
          <div className="space-y-3">
            {highPriority.map((suggestion) => (
              <TaxSuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority */}
      {mediumPriority.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
            Medium Priority ({mediumPriority.length})
          </h3>
          <div className="space-y-3">
            {mediumPriority.map((suggestion) => (
              <TaxSuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </div>
      )}

      {/* Low Priority */}
      {lowPriority.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            Low Priority ({lowPriority.length})
          </h3>
          <div className="space-y-3">
            {lowPriority.map((suggestion) => (
              <TaxSuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
