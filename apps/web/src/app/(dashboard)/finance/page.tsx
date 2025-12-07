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

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
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
  }, [fetchStats, fetchInvoices, fetchExpenses]);

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };


  const isLoading = statsLoading || invoicesLoading || expensesLoading;
  const hasError = statsError || invoicesError || expensesError;
  return (
    <div className="space-y-6">
      <HeadlineOutside subtitle="Manage invoices, expenses, and banking">
        Finance
      </HeadlineOutside>

      <div className="flex gap-2">
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
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading finance overview...</p>
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
            <AnimatedCard variant="elevated" padding="md">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </div>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {stats ? formatCurrency(stats.totalRevenue, stats.currency) : '-'}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Year to date
              </p>
            </AnimatedCard>

            <AnimatedCard variant="elevated" padding="md">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Outstanding
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {stats ? formatCurrency(stats.outstandingInvoices, stats.currency) : '-'}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Pending invoices
              </p>
            </AnimatedCard>

            <AnimatedCard variant="elevated" padding="md">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Overdue
                </div>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {stats ? formatCurrency(stats.overdueInvoices, stats.currency) : '-'}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Overdue invoices
              </p>
            </AnimatedCard>

            <AnimatedCard variant="elevated" padding="md">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </div>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {stats ? formatCurrency(stats.totalExpenses, stats.currency) : '-'}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats ? formatCurrency(stats.pendingExpenses, stats.currency) : '-'} pending
              </p>
            </AnimatedCard>
          </div>

      {/* Recent Invoices and Expenses */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <AnimatedCard variant="default" padding="sm">
          <div className="flex flex-row items-center justify-between p-6 pb-3">
            <div>
              <div className="text-lg font-semibold">Recent Invoices</div>
              <p className="text-sm text-muted-foreground mt-1">
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
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
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
        </AnimatedCard>

        {/* Recent Expenses */}
        <AnimatedCard variant="default" padding="sm">
          <div className="flex flex-row items-center justify-between p-6 pb-3">
            <div>
              <div className="text-lg font-semibold">Recent Expenses</div>
              <p className="text-sm text-muted-foreground mt-1">
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
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
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
        </AnimatedCard>
      </div>
        </>
      )}
    </div>
  );
}
