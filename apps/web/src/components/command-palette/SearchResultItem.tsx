/**
 * Search Result Item Component
 * Individual search result with highlighting
 */

'use client';

import * as React from 'react';
import { CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/hooks/useGlobalSearch';

interface SearchResultItemProps {
  result: SearchResult;
  query: string;
  onSelect: (result: SearchResult) => void;
}

export function SearchResultItem({
  result,
  query,
  onSelect,
}: SearchResultItemProps) {
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }

    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark
              key={index}
              className="bg-yellow-200 dark:bg-yellow-900 font-semibold"
            >
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <CommandItem
      value={result.id}
      onSelect={() => onSelect(result)}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
    >
      {result.icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background">
          {result.icon}
        </div>
      )}

      <div className="flex-1 space-y-1">
        <div className="font-medium leading-none">
          {highlightText(result.title, query)}
        </div>
        {result.description && (
          <div className="text-sm text-muted-foreground">
            {highlightText(result.description, query)}
          </div>
        )}
      </div>

      {result.metadata?.shortcut && (
        <div className="text-xs text-muted-foreground">
          {result.metadata.shortcut}
        </div>
      )}
    </CommandItem>
  );
}
