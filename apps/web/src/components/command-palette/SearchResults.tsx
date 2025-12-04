/**
 * Search Results Component
 * Displays grouped search results
 */

'use client';

import * as React from 'react';
import { CommandEmpty, CommandList } from '@/components/ui/command';
import { SearchCategory } from './SearchCategory';
import { SearchResultItem } from './SearchResultItem';
import { RecentSearches } from './RecentSearches';
import type {
  SearchResult,
  SearchCategory as SearchCategoryType,
} from '@/hooks/useGlobalSearch';
import { Loader2Icon } from 'lucide-react';

interface SearchResultsProps {
  query: string;
  groupedResults: Record<SearchCategoryType, SearchResult[]>;
  recentSearches: string[];
  isLoading: boolean;
  onSelectResult: (result: SearchResult) => void;
  onSelectRecentSearch: (search: string) => void;
  onClearRecentSearches: () => void;
}

const categoryOrder: SearchCategoryType[] = [
  'actions',
  'navigation',
  'invoices',
  'expenses',
  'clients',
  'reports',
];

export function SearchResults({
  query,
  groupedResults,
  recentSearches,
  isLoading,
  onSelectResult,
  onSelectRecentSearch,
  onClearRecentSearches,
}: SearchResultsProps) {
  const hasResults = Object.keys(groupedResults).length > 0;
  const showRecentSearches = !query && recentSearches.length > 0;

  return (
    <CommandList className="max-h-[400px] overflow-y-auto">
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !hasResults && !showRecentSearches && query && (
        <CommandEmpty>No results found for "{query}"</CommandEmpty>
      )}

      {!isLoading && !hasResults && !showRecentSearches && !query && (
        <CommandEmpty>
          Start typing to search for invoices, expenses, clients, and more...
        </CommandEmpty>
      )}

      {!isLoading && showRecentSearches && (
        <RecentSearches
          searches={recentSearches}
          onSelect={onSelectRecentSearch}
          onClear={onClearRecentSearches}
        />
      )}

      {!isLoading &&
        hasResults &&
        categoryOrder.map((category) => {
          const results = groupedResults[category];
          if (!results || results.length === 0) return null;

          return (
            <SearchCategory key={category} category={category}>
              {results.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  query={query}
                  onSelect={onSelectResult}
                />
              ))}
            </SearchCategory>
          );
        })}
    </CommandList>
  );
}
