/**
 * Recent Searches Component
 * Displays recent search history
 */

'use client';

import * as React from 'react';
import { ClockIcon, Cross2Icon } from '@radix-ui/react-icons';
import { CommandGroup, CommandItem } from '@/components/ui/command';
import { Button } from '@/components/ui/button';

interface RecentSearchesProps {
  searches: string[];
  onSelect: (search: string) => void;
  onClear: () => void;
}

export function RecentSearches({
  searches,
  onSelect,
  onClear,
}: RecentSearchesProps) {
  if (searches.length === 0) {
    return null;
  }

  return (
    <CommandGroup
      heading={
        <div className="flex items-center justify-between">
          <span>Recent Searches</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-auto p-1 text-xs hover:bg-transparent"
          >
            Clear
          </Button>
        </div>
      }
      className="px-2 py-2"
    >
      {searches.map((search, index) => (
        <CommandItem
          key={`${search}-${index}`}
          value={`recent-${index}`}
          onSelect={() => onSelect(search)}
          className="flex items-center gap-2 px-4 py-2 cursor-pointer"
        >
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1">{search}</span>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
