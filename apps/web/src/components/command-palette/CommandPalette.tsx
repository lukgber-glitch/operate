/**
 * Command Palette Component
 * Main command palette with search functionality
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CommandPaletteModal } from './CommandPaletteModal';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useGlobalSearch, type SearchResult } from '@/hooks/useGlobalSearch';

export function CommandPalette() {
  const router = useRouter();
  const { close } = useCommandPalette();
  const {
    query,
    setQuery,
    groupedResults,
    recentSearches,
    clearRecentSearches,
    isLoading,
  } = useGlobalSearch();

  const handleSelectResult = React.useCallback(
    (result: SearchResult) => {
      // Close the command palette
      close();

      // Navigate to URL or execute action
      if (result.url) {
        router.push(result.url);
      } else if (result.action) {
        result.action();
      }

      // Reset query
      setQuery('');
    },
    [close, router, setQuery]
  );

  const handleSelectRecentSearch = React.useCallback(
    (search: string) => {
      setQuery(search);
    },
    [setQuery]
  );

  return (
    <CommandPaletteModal>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search for invoices, expenses, clients, or navigate..."
      />
      <SearchResults
        query={query}
        groupedResults={groupedResults}
        recentSearches={recentSearches}
        isLoading={isLoading}
        onSelectResult={handleSelectResult}
        onSelectRecentSearch={handleSelectRecentSearch}
        onClearRecentSearches={clearRecentSearches}
      />
    </CommandPaletteModal>
  );
}
