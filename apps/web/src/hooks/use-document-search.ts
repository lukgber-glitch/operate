'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from './useDebounce';
import type {
  Document,
  DocumentType,
  DocumentStatus,
  DocumentQueryParams,
  PaginatedDocuments,
  DocumentFolder,
} from '@/types/documents';
import { apiClient } from '@/lib/api/client';

// Cache keys
const DOCUMENTS_KEY = 'documents';
const FOLDERS_KEY = 'document-folders';

interface UseDocumentSearchOptions {
  orgId: string;
  initialParams?: Partial<DocumentQueryParams>;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseDocumentSearchResult {
  // Data
  documents: Document[];
  folders: DocumentFolder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;

  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedSearchQuery: string;

  // Filters
  typeFilter: DocumentType | 'ALL';
  setTypeFilter: (type: DocumentType | 'ALL') => void;
  statusFilter: DocumentStatus | 'ALL';
  setStatusFilter: (status: DocumentStatus | 'ALL') => void;
  selectedFolder: string | null;
  setSelectedFolder: (folderId: string | null) => void;
  tags: string[];
  setTags: (tags: string[]) => void;

  // Sorting
  sortBy: DocumentQueryParams['sortBy'];
  setSortBy: (sortBy: DocumentQueryParams['sortBy']) => void;
  sortOrder: DocumentQueryParams['sortOrder'];
  setSortOrder: (order: DocumentQueryParams['sortOrder']) => void;

  // Pagination
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;

  // Actions
  refresh: () => void;
  clearFilters: () => void;
}

/**
 * Fetch documents from API
 */
async function fetchDocuments(
  orgId: string,
  params: DocumentQueryParams,
): Promise<PaginatedDocuments> {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.set('search', params.search);
  if (params.type && params.type !== 'ALL') queryParams.set('type', params.type);
  if (params.status && params.status !== 'ALL') queryParams.set('status', params.status);
  if (params.folderId) queryParams.set('folderId', params.folderId);
  if (params.tags?.length) queryParams.set('tags', params.tags.join(','));
  if (params.page) queryParams.set('page', String(params.page));
  if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  const response = await apiClient.get<PaginatedDocuments>(
    `/api/organisations/${orgId}/documents?${queryParams.toString()}`,
  );
  return response.data;
}

/**
 * Fetch folders from API
 */
async function fetchFolders(orgId: string): Promise<DocumentFolder[]> {
  const response = await apiClient.get<DocumentFolder[]>(
    `/api/organisations/${orgId}/folders`,
  );
  return response.data;
}

/**
 * Hook for document search with debouncing, caching, and optimistic updates
 */
export function useDocumentSearch(
  options: UseDocumentSearchOptions,
): UseDocumentSearchResult {
  const { orgId, initialParams = {}, debounceMs = 300, enabled = true } = options;
  const queryClient = useQueryClient();

  // Search state
  const [searchQuery, setSearchQuery] = useState(initialParams.search || '');
  const debouncedSearchQuery = useDebounce(searchQuery, debounceMs);

  // Filter states
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'ALL'>(
    initialParams.type || 'ALL',
  );
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'ALL'>(
    (initialParams.status as DocumentStatus | 'ALL') || 'ALL',
  );
  const [selectedFolder, setSelectedFolder] = useState<string | null>(
    initialParams.folderId || null,
  );
  const [tags, setTags] = useState<string[]>(initialParams.tags || []);

  // Sort state
  const [sortBy, setSortBy] = useState<DocumentQueryParams['sortBy']>(
    initialParams.sortBy || 'createdAt',
  );
  const [sortOrder, setSortOrder] = useState<DocumentQueryParams['sortOrder']>(
    initialParams.sortOrder || 'desc',
  );

  // Pagination state
  const [page, setPage] = useState(initialParams.page || 1);
  const [pageSize, setPageSize] = useState(initialParams.pageSize || 20);

  // Build query params
  const queryParams = useMemo<DocumentQueryParams>(
    () => ({
      search: debouncedSearchQuery || undefined,
      type: typeFilter !== 'ALL' ? typeFilter : undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      folderId: selectedFolder || undefined,
      tags: tags.length > 0 ? tags : undefined,
      page,
      pageSize,
      sortBy,
      sortOrder,
    }),
    [
      debouncedSearchQuery,
      typeFilter,
      statusFilter,
      selectedFolder,
      tags,
      page,
      pageSize,
      sortBy,
      sortOrder,
    ],
  );

  // Reset page when filters change
  const prevFiltersRef = useRef({
    search: debouncedSearchQuery,
    type: typeFilter,
    status: statusFilter,
    folder: selectedFolder,
    tags: tags.join(','),
  });

  useEffect(() => {
    const currentFilters = {
      search: debouncedSearchQuery,
      type: typeFilter,
      status: statusFilter,
      folder: selectedFolder,
      tags: tags.join(','),
    };

    const filtersChanged =
      JSON.stringify(currentFilters) !== JSON.stringify(prevFiltersRef.current);

    if (filtersChanged && page !== 1) {
      setPage(1);
    }

    prevFiltersRef.current = currentFilters;
  }, [debouncedSearchQuery, typeFilter, statusFilter, selectedFolder, tags, page]);

  // Fetch documents
  const documentsQuery = useQuery({
    queryKey: [DOCUMENTS_KEY, orgId, queryParams],
    queryFn: () => fetchDocuments(orgId, queryParams),
    enabled: enabled && !!orgId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

  // Fetch folders (cached separately, less frequent updates)
  const foldersQuery = useQuery({
    queryKey: [FOLDERS_KEY, orgId],
    queryFn: () => fetchFolders(orgId),
    enabled: enabled && !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Prefetch next page
  useEffect(() => {
    if (
      documentsQuery.data &&
      page < documentsQuery.data.meta.totalPages &&
      !documentsQuery.isFetching
    ) {
      const nextPageParams = { ...queryParams, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: [DOCUMENTS_KEY, orgId, nextPageParams],
        queryFn: () => fetchDocuments(orgId, nextPageParams),
        staleTime: 30 * 1000,
      });
    }
  }, [documentsQuery.data, page, queryParams, orgId, queryClient, documentsQuery.isFetching]);

  // Pagination helpers
  const hasNextPage =
    documentsQuery.data ? page < documentsQuery.data.meta.totalPages : false;
  const hasPrevPage = page > 1;

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage((p) => p + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPage((p) => p - 1);
    }
  }, [hasPrevPage]);

  // Refresh data
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [DOCUMENTS_KEY, orgId] });
  }, [queryClient, orgId]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setSelectedFolder(null);
    setTags([]);
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  }, []);

  return {
    // Data
    documents: documentsQuery.data?.data || [],
    folders: foldersQuery.data || [],
    total: documentsQuery.data?.meta.total || 0,
    page: documentsQuery.data?.meta.page || page,
    pageSize: documentsQuery.data?.meta.pageSize || pageSize,
    totalPages: documentsQuery.data?.meta.totalPages || 0,

    // Loading states
    isLoading: documentsQuery.isLoading,
    isFetching: documentsQuery.isFetching,
    isError: documentsQuery.isError,
    error: documentsQuery.error,

    // Search
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,

    // Filters
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    selectedFolder,
    setSelectedFolder,
    tags,
    setTags,

    // Sorting
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    // Pagination
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,

    // Actions
    refresh,
    clearFilters,
  };
}

/**
 * Hook for prefetching document details
 */
export function usePrefetchDocument() {
  const queryClient = useQueryClient();

  return useCallback(
    (orgId: string, documentId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['document', orgId, documentId],
        queryFn: async () => {
          const response = await apiClient.get<Document>(
            `/api/organisations/${orgId}/documents/${documentId}`,
          );
          return response.data;
        },
        staleTime: 60 * 1000, // 1 minute
      });
    },
    [queryClient],
  );
}

/**
 * Hook for invalidating document cache after mutations
 */
export function useInvalidateDocuments() {
  const queryClient = useQueryClient();

  return useCallback(
    (orgId: string) => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_KEY, orgId] });
      queryClient.invalidateQueries({ queryKey: [FOLDERS_KEY, orgId] });
    },
    [queryClient],
  );
}
