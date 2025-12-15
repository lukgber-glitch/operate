'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ListDetailPanelProps {
  title: string;
  columns: Column[];
  data: any[];
  totalCount?: number;
  onRowClick?: (row: any) => void;
  onExport?: (format: 'csv' | 'pdf') => void;
  onBulkAction?: (action: string, selectedRows: any[]) => void;
  bulkActions?: Array<{
    label: string;
    value: string;
    variant?: 'default' | 'destructive';
  }>;
  pageSize?: number;
  enableSearch?: boolean;
  enableFilters?: boolean;
  renderFilters?: () => React.ReactNode;
}

export function ListDetailPanel({
  title,
  columns,
  data,
  totalCount,
  onRowClick,
  onExport,
  onBulkAction,
  bulkActions,
  pageSize = 20,
  enableSearch = true,
  enableFilters = false,
  renderFilters,
}: ListDetailPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filter data based on search
  const filteredData = searchQuery
    ? data.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : data;

  // Sort data
  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const direction = sortDirection === 'asc' ? 1 : -1;
        return aVal > bVal ? direction : -direction;
      })
    : filteredData;

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map((row) => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
  };

  const allSelected =
    paginatedData.length > 0 && paginatedData.every((row) => selectedRows.has(row.id));
  const someSelected = paginatedData.some((row) => selectedRows.has(row.id)) && !allSelected;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="space-y-3">
        {/* Search & Filters */}
        <div className="flex gap-2">
          {enableSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-900 border-zinc-800"
              />
            </div>
          )}
          {enableFilters && renderFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'border-zinc-800',
                showFilters && 'bg-zinc-800'
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}
          {onExport && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('csv')}
                className="border-zinc-800"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('pdf')}
                className="border-zinc-800"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && renderFilters && (
          <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
            {renderFilters()}
          </div>
        )}

        {/* Bulk Actions */}
        {selectedRows.size > 0 && bulkActions && onBulkAction && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-950/30 border border-blue-800/30">
            <span className="text-sm text-blue-400">
              {selectedRows.size} selected
            </span>
            <div className="flex gap-2">
              {bulkActions.map((action) => (
                <Button
                  key={action.value}
                  size="sm"
                  variant={action.variant || 'outline'}
                  onClick={() =>
                    onBulkAction(
                      action.value,
                      data.filter((row) => selectedRows.has(row.id))
                    )
                  }
                  className="border-zinc-800"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
              {bulkActions && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected || (someSelected ? 'indeterminate' : false)}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.key} className="text-zinc-400">
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      {column.label}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-zinc-800 cursor-pointer hover:bg-zinc-900/50',
                  selectedRows.has(row.id) && 'bg-zinc-900/30'
                )}
              >
                {bulkActions && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedRows.has(row.id)}
                      onCheckedChange={(checked) =>
                        handleSelectRow(row.id, checked as boolean)
                      }
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.key} className="text-zinc-300">
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
            {totalCount || sortedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="border-zinc-800"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-zinc-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="border-zinc-800"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
