'use client';

import {
  Calculator,
  TrendingDown,
  FileText,
  Calendar,
  Plus,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

import { AnimatedCard } from '@/components/ui/animated-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
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
import { useTaxReport } from '@/hooks/use-tax-reports';

const statusColors = {
  UPCOMING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DUE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SUGGESTED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function TaxPage() {
  const { report, isLoading: isLoadingReport } = useTaxReport('2024');
  const { deductions, isLoading: isLoadingDeductions } = useDeductions({ autoFetch: true });
  return (
    <div className="space-y-6">
      <HeadlineOutside
        subtitle="Manage tax liabilities, deductions, and VAT"
        actions={
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/tax/deductions/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Deduction
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tax/reports">
                <FileText className="mr-2 h-4 w-4" />
                View Reports
              </Link>
            </Button>
          </div>
        }
      >
        Tax Overview
      </HeadlineOutside>

      <AnimatedCard variant="elevated" padding="lg">
        <div className="space-y-6">

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estimated Tax Liability
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingReport ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-28" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  €{report?.summary.estimatedTax.toLocaleString('de-DE', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  For current tax year
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deductible Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingReport ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  €{report?.summary.totalDeductions.toLocaleString('de-DE', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <p className="mt-1 flex items-center text-xs text-muted-foreground">
                  Total deductions claimed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VAT Payable
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingReport ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  €{report?.summary.netVat.toLocaleString('de-DE', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Current period
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Potential Savings
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoadingDeductions ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  €{deductions
                    .filter(d => d.status === 'SUGGESTED')
                    .reduce((sum, d) => sum + d.potentialSaving, 0)
                    .toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  From suggested deductions
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deadlines and Recent Deductions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tax Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tax Deadlines</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Upcoming filing and payment dates
              </p>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingReport ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border-b pb-4 last:border-0 last:pb-0">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : !report?.deadlines || report.deadlines.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No upcoming deadlines</p>
            ) : (
              <div className="space-y-4">
                {report.deadlines.slice(0, 3).map((deadline) => (
                  <div
                    key={deadline.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{deadline.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {deadline.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Due: {new Date(deadline.dueDate).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={statusColors[deadline.status]}
                    >
                      {deadline.status.toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="mt-4 w-full" asChild>
              <Link href="/tax/reports">
                View All Deadlines
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Deductions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Deductions</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Latest tax deduction claims
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tax/deductions">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
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
                {isLoadingDeductions ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : deductions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No recent deductions
                    </TableCell>
                  </TableRow>
                ) : (
                  deductions.slice(0, 4).map((deduction) => (
                    <TableRow key={deduction.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/tax/deductions/${deduction.id}`}
                          className="hover:underline"
                        >
                          {deduction.description}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{deduction.category}</Badge>
                      </TableCell>
                      <TableCell>
                        €{deduction.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusColors[deduction.status]}
                        >
                          {deduction.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Common tax management tasks
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col items-start p-4" asChild>
              <Link href="/tax/vat">
                <FileText className="mb-2 h-5 w-5" />
                <span className="font-semibold">VAT Management</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  View VAT periods and returns
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4" asChild>
              <Link href="/tax/deductions">
                <TrendingDown className="mb-2 h-5 w-5" />
                <span className="font-semibold">Tax Deductions</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  Manage deductible expenses
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4" asChild>
              <Link href="/tax/reports">
                <Calculator className="mb-2 h-5 w-5" />
                <span className="font-semibold">Tax Reports</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  Generate tax summaries
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <AlertCircle className="mb-2 h-5 w-5" />
              <span className="font-semibold">Tax Optimizer</span>
              <span className="mt-1 text-xs text-muted-foreground">
                Get savings recommendations
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
        </div>
      </AnimatedCard>
    </div>
  );
}
