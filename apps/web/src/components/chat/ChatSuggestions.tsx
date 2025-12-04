'use client';

import { Loader2 } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Suggestion } from '@/types/suggestions';

import { SuggestionCard } from './SuggestionCard';

interface ChatSuggestionsProps {
  suggestions: Suggestion[];
  isLoading?: boolean;
  onApply?: (id: string) => void;
  onDismiss?: (id: string) => void;
  maxVisible?: number;
  className?: string;
}

/**
 * ChatSuggestions - Horizontal scrollable list of suggestion cards
 *
 * Features:
 * - Horizontal scroll with snap behavior
 * - Loading skeleton
 * - Empty state
 * - Max visible limit with scroll indicator
 * - Compact card layout
 */
export function ChatSuggestions({
  suggestions,
  isLoading = false,
  onApply,
  onDismiss,
  maxVisible = 5,
  className,
}: ChatSuggestionsProps) {
  if (isLoading) {
    return (
      <div className={cn('py-3 px-4 border-t bg-muted/30', className)}>
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Loading suggestions...
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="min-w-[280px] h-[160px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null; // Hide when no suggestions
  }

  const visibleSuggestions = suggestions.slice(0, maxVisible);
  const hasMore = suggestions.length > maxVisible;

  return (
    <div className={cn('py-3 px-4 border-t bg-muted/30', className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-foreground">
          Suggestions for you
        </h3>
        {hasMore && (
          <span className="text-xs text-muted-foreground">
            +{suggestions.length - maxVisible} more
          </span>
        )}
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {visibleSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApply={onApply}
              onDismiss={onDismiss}
              compact
            />
          ))}
        </div>
      </ScrollArea>

      <p className="text-xs text-muted-foreground mt-2">
        Click a suggestion to apply it or ask me about it
      </p>
    </div>
  );
}
