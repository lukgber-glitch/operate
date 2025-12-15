/**
 * Global Search Hook
 * Handles search functionality across different categories
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';

export type SearchCategory =
  | 'invoices'
  | 'expenses'
  | 'clients'
  | 'reports'
  | 'navigation'
  | 'actions';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: SearchCategory;
  url?: string;
  action?: () => void;
  icon?: React.ReactNode;
  metadata?: Record<string, any>;
}

interface UseGlobalSearchOptions {
  debounceMs?: number;
}

interface SearchAPI {
  invoices: (query: string) => Promise<SearchResult[]>;
  expenses: (query: string) => Promise<SearchResult[]>;
  clients: (query: string) => Promise<SearchResult[]>;
  reports: (query: string) => Promise<SearchResult[]>;
  navigation: (query: string) => Promise<SearchResult[]>;
  actions: (query: string) => Promise<SearchResult[]>;
}

// Mock search functions - replace with actual API calls
const mockSearchAPI: SearchAPI = {
  invoices: async (query: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!query) return [];

    return [
      {
        id: 'inv-1',
        title: `Invoice #INV-2024-001`,
        description: `Client: Acme Corp - Amount: $5,000`,
        category: 'invoices' as const,
        url: '/invoices/inv-1',
      },
      {
        id: 'inv-2',
        title: `Invoice #INV-2024-002`,
        description: `Client: Tech Solutions - Amount: $8,500`,
        category: 'invoices' as const,
        url: '/invoices/inv-2',
      },
    ].filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase())
    );
  },

  expenses: async (query: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!query) return [];

    return [
      {
        id: 'exp-1',
        title: 'Office Supplies',
        description: 'Vendor: Staples - Amount: $250',
        category: 'expenses' as const,
        url: '/expenses/exp-1',
      },
    ].filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
  },

  clients: async (query: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!query) return [];

    return [
      {
        id: 'client-1',
        title: 'Acme Corporation',
        description: 'contact@acme.com',
        category: 'clients' as const,
        url: '/clients/client-1',
      },
      {
        id: 'client-2',
        title: 'Tech Solutions Ltd',
        description: 'info@techsolutions.com',
        category: 'clients' as const,
        url: '/clients/client-2',
      },
    ].filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase())
    );
  },

  reports: async (query: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!query) return [];

    return [
      {
        id: 'report-1',
        title: 'VAT Report Q4 2024',
        description: 'Tax report for Q4',
        category: 'reports' as const,
        url: '/reports/vat-q4-2024',
      },
    ].filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
  },

  navigation: async (query: string) => {
    const pages = [
      { id: 'nav-dashboard', title: 'Dashboard', url: '/dashboard' },
      { id: 'nav-invoices', title: 'Invoices', url: '/invoices' },
      { id: 'nav-expenses', title: 'Expenses', url: '/expenses' },
      { id: 'nav-clients', title: 'Clients', url: '/clients' },
      { id: 'nav-reports', title: 'Reports', url: '/reports' },
      { id: 'nav-settings', title: 'Settings', url: '/settings' },
      { id: 'nav-tax', title: 'Tax', url: '/tax' },
      { id: 'nav-hr', title: 'HR', url: '/hr' },
      { id: 'nav-payroll', title: 'Payroll', url: '/hr/payroll' },
    ];

    return pages
      .filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase())
      )
      .map(item => ({
        ...item,
        category: 'navigation' as SearchCategory,
      }));
  },

  actions: async (query: string) => {
    const actions = [
      {
        id: 'action-new-invoice',
        title: 'Create New Invoice',
        action: () => console.log('Create invoice'),
      },
      {
        id: 'action-new-expense',
        title: 'Add New Expense',
        action: () => console.log('Add expense'),
      },
      {
        id: 'action-new-client',
        title: 'Add New Client',
        action: () => console.log('Add client'),
      },
      {
        id: 'action-scan-receipt',
        title: 'Scan Receipt',
        action: () => console.log('Scan receipt'),
      },
    ];

    return actions
      .filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase())
      )
      .map(item => ({
        ...item,
        category: 'actions' as SearchCategory,
      }));
  },
};

const RECENT_SEARCHES_KEY = 'operate-recent-searches';
const MAX_RECENT_SEARCHES = 10;

export function useGlobalSearch(options: UseGlobalSearchOptions = {}) {
  const { debounceMs = 300 } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, debounceMs);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load recent searches:', err);
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(q => q !== searchQuery);
      const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save recent search:', err);
      }

      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (err) {
      console.error('Failed to clear recent searches:', err);
    }
  }, []);

  // Perform search
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Search all categories in parallel
      const [
        invoiceResults,
        expenseResults,
        clientResults,
        reportResults,
        navigationResults,
        actionResults,
      ] = await Promise.all([
        mockSearchAPI.invoices(searchQuery),
        mockSearchAPI.expenses(searchQuery),
        mockSearchAPI.clients(searchQuery),
        mockSearchAPI.reports(searchQuery),
        mockSearchAPI.navigation(searchQuery),
        mockSearchAPI.actions(searchQuery),
      ]);

      const allResults = [
        ...invoiceResults,
        ...expenseResults,
        ...clientResults,
        ...reportResults,
        ...navigationResults,
        ...actionResults,
      ];

      setResults(allResults);

      // Save to recent searches
      if (allResults.length > 0) {
        saveRecentSearch(searchQuery);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to perform search. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [saveRecentSearch]);

  // Trigger search when debounced query changes
  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  // Memoize grouped results by category
  const groupedResults = useMemo(() => {
    return results.reduce((acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = [];
      }
      acc[result.category].push(result);
      return acc;
    }, {} as Record<SearchCategory, SearchResult[]>);
  }, [results]);

  return {
    query,
    setQuery,
    results,
    groupedResults,
    recentSearches,
    clearRecentSearches,
    isLoading,
    error,
  };
}
