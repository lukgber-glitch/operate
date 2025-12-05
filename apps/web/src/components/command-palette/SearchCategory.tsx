/**
 * Search Category Component
 * Groups search results by category
 */

'use client';

import * as React from 'react';
import { CommandGroup } from '@/components/ui/command';
import type { SearchCategory as SearchCategoryType } from '@/hooks/useGlobalSearch';

interface SearchCategoryProps {
  category: SearchCategoryType;
  children: React.ReactNode;
}

const categoryLabels: Record<SearchCategoryType, string> = {
  invoices: 'Invoices',
  expenses: 'Expenses',
  clients: 'Clients',
  reports: 'Reports',
  navigation: 'Navigation',
  actions: 'Quick Actions',
};

export function SearchCategory({ category, children }: SearchCategoryProps) {
  return (
    <CommandGroup heading={categoryLabels[category]} className="px-2 py-2">
      {children}
    </CommandGroup>
  );
}
