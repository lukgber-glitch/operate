'use client';

import { Plus, Download, Search, Filter, Camera } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useExpenses } from '@/hooks/use-expenses';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import type { CurrencyCode } from '@/types/currency';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';

const statusColors = {
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { expenses, total, isLoading, error, fetchExpenses, totalPages, approveExpense, rejectExpense } = useExpenses({
    page: currentPage,
    pageSize,
    status: statusFilter || undefined,
    search: searchTerm || undefined,
    categoryId: categoryFilter || undefined,
  });

  useEffect(() => {
    fetchExpenses({
      page: currentPage,
      pageSize,
      status: statusFilter || undefined,
      search: searchTerm || undefined,
      categoryId: categoryFilter || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, statusFilter, searchTerm, categoryFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const toggleExpense = (id: string) => {
    setSelectedExpenses((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedExpenses.length === expenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(expenses.map((e) => e.id));
    }
  };

  const handleBulkApprove = async () => {
    try {
      for (const id of selectedExpenses) {
        await approveExpense(id);
      }
      setSelectedExpenses([]);
      fetchExpenses({
        page: currentPage,
        pageSize,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        categoryId: categoryFilter || undefined,
      });
    } catch (error) {
      console.error('Failed to approve expenses:', error);
    }
  };

  const handleBulkReject = async () => {
    try {
      for (const id of selectedExpenses) {
        await rejectExpense(id, 'Bulk rejection');
      }
      setSelectedExpenses([]);
      fetchExpenses({
        page: currentPage,
        pageSize,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        categoryId: categoryFilter || undefined,
      });
    } catch (error) {
      console.error('Failed to reject expenses:', error);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl text-white font-semibold tracking-tight">Expenses</h1>
        <p className="text-white/70">Manage and track expense reports</p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button asChild variant="outline">
          <Link href="/finance/expenses/scan">
            <Camera className="mr-2 h-4 w-4" />
            Scan Receipt
          </Link>
        </Button>
        <Button asChild>
          <Link href="/finance/expenses/new">
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </Link>
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp}>
        <GlassCard padding="lg">
          <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              <Input
                placeholder="Search by description or submitter..."
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
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedExpenses.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">
                {selectedExpenses.length} selected
              </span>
              <Button size="sm" onClick={handleBulkApprove}>
                Approve Selected
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkReject}
              >
                Reject Selected
              </Button>
            </div>
          )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Expenses Table */}
      <motion.div variants={fadeUp}>
        <GlassCard padding="lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-white/70">Loading expenses...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => fetchExpenses({
                    page: currentPage,
                    pageSize,
                    status: statusFilter || undefined,
                    search: searchTerm || undefined,
                    categoryId: categoryFilter || undefined,
                  })}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-6 pt-6">
                <p className="text-sm text-white/70">
                  Showing {expenses.length} of {total} expenses
                </p>

              <div className="flex items-center gap-2">
                <span className="text-sm text-white/70">
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
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-white/70"
                    >
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedExpenses.includes(expense.id)}
                          onCheckedChange={() => toggleExpense(expense.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/finance/expenses/${expense.id}`}
                          className="hover:underline"
                        >
                          {expense.description}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        <CurrencyDisplay
                          amount={expense.totalAmount}
                          currency={expense.currency as CurrencyCode || 'EUR'}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {expense.category?.name || 'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                      <TableCell>{expense.vendorName}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            statusColors[
                              expense.status as keyof typeof statusColors
                            ]
                          }
                        >
                          {expense.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/finance/expenses/${expense.id}`}>
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
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
