'use client';

import {
  Euro,
  TrendingUp,
  AlertCircle,
  Receipt,
  Plus,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useExpenses } from '@/hooks/use-expenses';
import { useFinanceStats } from '@/hooks/use-finance-stats';
import { useInvoices } from '@/hooks/use-invoices';
import { formatCurrency } from '@/lib/utils/currency';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';

const statusColors = {
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function FinancePage() {
  const { stats, isLoading: statsLoading, error: statsError, fetchStats } = useFinanceStats();
  const { invoices, isLoading: invoicesLoading, error: invoicesError, fetchInvoices } = useInvoices({ pageSize: 4 });
  const { expenses, isLoading: expensesLoading, error: expensesError, fetchExpenses } = useExpenses({ pageSize: 4 });

  useEffect(() => {
    fetchStats();
    fetchInvoices({ pageSize: 4 });
    fetchExpenses({ pageSize: 4 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const isLoading = statsLoading || invoicesLoading || expensesLoading;
  const hasError = statsError || invoicesError || expensesError;
  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl text-white font-semibold tracking-tight">Finance</h1>
        <p className="text-white/70">Manage invoices, expenses, and banking</p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-2">
        <Button asChild>
          <Link href="/finance/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/finance/expenses/new">
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </Link>
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-white/70">Loading finance overview...</p>
          </div>
        </div>
      ) : hasError ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{statsError || invoicesError || expensesError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                fetchStats();
                fetchInvoices({ pageSize: 4 });
                fetchExpenses({ pageSize: 4 });
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div variants={fadeUp}>
              <GlassCard padding="lg">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="text-sm font-medium text-white/70">
                      Total Revenue
                    </div>
                    <Euro className="h-4 w-4 text-white/70" />
                  </div>
                  <div className="text-2xl text-white font-bold">
                    {stats ? formatCurrency(stats.totalRevenue, stats.currency) : '-'}
                  </div>
                  <p className="mt-1 text-xs text-white/70">
                    Year to date
                  </p>
              </GlassCard>
            </motion.div>

            <motion.div variants={fadeUp}>
              <GlassCard padding="lg">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="text-sm font-medium text-white/70">
                      Outstanding
                    </div>
                    <TrendingUp className="h-4 w-4 text-white/70" />
                  </div>
                  <div className="text-2xl text-white font-bold">
                    {stats ? formatCurrency(stats.outstandingInvoices, stats.currency) : '-'}
                  </div>
                  <p className="mt-1 text-xs text-white/70">
                    Pending invoices
                  </p>
              </GlassCard>
            </motion.div>

            <motion.div variants={fadeUp}>
              <GlassCard padding="lg">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="text-sm font-medium text-white/70">
                      Overdue
                    </div>
                    <AlertCircle className="h-4 w-4 text-white/70" />
                  </div>
                  <div className="text-2xl text-white font-bold text-red-400">
                    {stats ? formatCurrency(stats.overdueInvoices, stats.currency) : '-'}
                  </div>
                  <p className="mt-1 text-xs text-white/70">
                    Overdue invoices
                  </p>
              </GlassCard>
            </motion.div>

            <motion.div variants={fadeUp}>
              <GlassCard padding="lg">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="text-sm font-medium text-white/70">
                      Total Expenses
                    </div>
                    <Receipt className="h-4 w-4 text-white/70" />
                  </div>
                  <div className="text-2xl text-white font-bold">
                    {stats ? formatCurrency(stats.totalExpenses, stats.currency) : '-'}
                  </div>
                  <p className="mt-1 text-xs text-white/70">
                    {stats ? formatCurrency(stats.pendingExpenses, stats.currency) : '-'} pending
                  </p>
              </GlassCard>
            </motion.div>
          </div>

      {/* Recent Invoices and Expenses */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <motion.div variants={fadeUp}>
          <GlassCard padding="lg">
            <div className="flex flex-row items-center justify-between pb-3">
            <div>
              <div className="text-lg font-semibold">Recent Invoices</div>
              <p className="text-sm text-white/70 mt-1">
                Latest invoice activity
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/finance/invoices">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-white/70">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/finance/invoices/${invoice.id}`}
                          className="hover:underline"
                        >
                          {invoice.number}
                        </Link>
                      </TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>{formatCurrency(invoice.totalAmount, invoice.currency)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusColors[invoice.status as keyof typeof statusColors]}
                        >
                          {invoice.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </GlassCard>
        </motion.div>

        {/* Recent Expenses */}
        <motion.div variants={fadeUp}>
          <GlassCard padding="lg">
            <div className="flex flex-row items-center justify-between pb-3">
            <div>
              <div className="text-lg font-semibold">Recent Expenses</div>
              <p className="text-sm text-white/70 mt-1">
                Latest expense submissions
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/finance/expenses">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-white/70">
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/finance/expenses/${expense.id}`}
                          className="hover:underline"
                        >
                          {expense.description}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category?.name || 'Uncategorized'}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(expense.totalAmount, expense.currency)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusColors[expense.status as keyof typeof statusColors]}
                        >
                          {expense.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </GlassCard>
        </motion.div>
      </div>
        </>
      )}
    </motion.div>
  );
}
