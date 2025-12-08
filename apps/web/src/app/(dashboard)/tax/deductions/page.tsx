'use client';

import { Plus, Download, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDeductions } from '@/hooks/use-deductions';

const statusColors = {
  CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SUGGESTED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const categoryColors: Record<string, string> = {
  'Office Expenses': 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400',
  Education: 'border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400',
  Travel: 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-400',
  Insurance: 'border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400',
  Utilities: 'border-cyan-200 text-cyan-700 dark:border-cyan-800 dark:text-cyan-400',
  'Meals & Entertainment': 'border-pink-200 text-pink-700 dark:border-pink-800 dark:text-pink-400',
};

export default function DeductionsPage() {
  const { deductions, isLoading, confirmDeduction: _confirmDeduction, rejectDeduction: _rejectDeduction } = useDeductions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredDeductions = useMemo(() => {
    return deductions.filter((deduction) => {
      const matchesSearch =
        deduction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deduction.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || deduction.status === statusFilter;
      const matchesCategory =
        categoryFilter === 'all' || deduction.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [deductions, searchTerm, statusFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredDeductions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const displayedDeductions = filteredDeductions.slice(
    startIndex,
    startIndex + pageSize
  );

  const totalSavings = filteredDeductions
    .filter((d) => d.status === 'CONFIRMED')
    .reduce((sum, d) => sum + d.potentialSaving, 0);

  const totalDeductions = filteredDeductions.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tax Deductions</h1>
          <p className="text-muted-foreground">Manage and track your tax-deductible expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/tax/deductions/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Deduction
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-[24px]">
        <CardContent className="p-6">
        <div className="space-y-6">

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-40" />
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-40" />
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-40" />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Deductions</p>
                <p className="text-2xl font-bold">
                  €{totalDeductions.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Potential Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  €{totalSavings.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmed Deductions</p>
                <p className="text-2xl font-bold">
                  {filteredDeductions.filter((d) => d.status === 'CONFIRMED').length}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by description or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="SUGGESTED">Suggested</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Office Expenses">Office Expenses</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Meals & Entertainment">
                    Meals & Entertainment
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deductions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-6 pt-6">
              <p className="text-sm text-muted-foreground">
                Showing {displayedDeductions.length} of {filteredDeductions.length}{' '}
                deductions
              </p>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Rows per page:
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Potential Saving</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : displayedDeductions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      No deductions found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedDeductions.map((deduction) => (
                    <TableRow key={deduction.id}>
                      <TableCell className="font-medium">
                        {deduction.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/tax/deductions/${deduction.id}`}
                          className="hover:underline"
                        >
                          {deduction.description}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={categoryColors[deduction.category] || ''}
                        >
                          {deduction.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(deduction.date).toLocaleDateString('de-DE')}</TableCell>
                      <TableCell className="font-medium">
                        €{deduction.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        €{deduction.potentialSaving.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusColors[deduction.status]}
                        >
                          {deduction.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/tax/deductions/${deduction.id}`}>
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 px-6 pb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
