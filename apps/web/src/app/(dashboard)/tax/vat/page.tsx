'use client';

import { useState, useMemo } from 'react';
import { FileText, Download, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useVatPeriods, useCurrentVatPeriod, useVatTransactions } from '@/hooks/use-vat';

const statusColors = {
  OPEN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  FILED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function VATPage() {
  const [selectedYear, setSelectedYear] = useState('2024');
  const { periods, isLoading: isLoadingPeriods } = useVatPeriods(selectedYear);
  const { period: currentPeriod, isLoading: isLoadingCurrent } = useCurrentVatPeriod();
  const { transactions, isLoading: isLoadingTransactions } = useVatTransactions(
    currentPeriod?.id || ''
  );

  const filteredPeriods = useMemo(() => {
    return periods.filter((period) =>
      period.period.includes(selectedYear)
    );
  }, [periods, selectedYear]);

  const progressPercentage = useMemo(() => {
    if (!currentPeriod) return 0;
    return (
      ((new Date().getTime() - new Date(currentPeriod.startDate).getTime()) /
        (new Date(currentPeriod.endDate).getTime() -
          new Date(currentPeriod.startDate).getTime())) *
      100
    );
  }, [currentPeriod]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">VAT Management</h1>
          <p className="text-muted-foreground">
            Track and manage your VAT returns and payments
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export VAT Report
          </Button>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            File Return
          </Button>
        </div>
      </div>

      {/* Current Period Overview */}
      <Card>
        <CardHeader>
          {isLoadingCurrent ? (
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          ) : currentPeriod ? (
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current VAT Period</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentPeriod.period} ({new Date(currentPeriod.startDate).toLocaleDateString('de-DE')} to{' '}
                  {new Date(currentPeriod.endDate).toLocaleDateString('de-DE')})
                </p>
              </div>
              <Badge
                variant="secondary"
                className={statusColors[currentPeriod.status]}
              >
                {currentPeriod.status.toLowerCase()}
              </Badge>
            </div>
          ) : (
            <div>
              <CardTitle>Current VAT Period</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">No active period</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingCurrent ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32 mb-1" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ) : currentPeriod ? (
            <div className="space-y-6">
              {/* VAT Summary */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingDown className="h-4 w-4 text-green-600" />
                    Input VAT
                  </div>
                  <p className="text-2xl font-bold">
                    €{currentPeriod.vatRecoverable.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    VAT paid on purchases
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Output VAT
                  </div>
                  <p className="text-2xl font-bold">
                    €{currentPeriod.vatOwed.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    VAT charged to customers
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Net VAT Payable
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    €{currentPeriod.netVat.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {new Date(currentPeriod.dueDate).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>

              {/* Period Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Period Progress</span>
                  <span className="font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {transactions.length} transactions recorded
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No data available</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent VAT Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent VAT Transactions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest input and output VAT from current period
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>VAT Rate</TableHead>
                    <TableHead className="text-right">VAT Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTransactions ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.slice(0, 5).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              transaction.type === 'SALE'
                                ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400'
                                : 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-400'
                            }
                          >
                            {transaction.type === 'SALE' ? 'Output' : 'Input'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.description}
                        </TableCell>
                        <TableCell>{new Date(transaction.date).toLocaleDateString('de-DE')}</TableCell>
                        <TableCell>€{transaction.netAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{transaction.vatRate}%</TableCell>
                        <TableCell className="text-right font-medium">
                          €{transaction.vatAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* VAT Breakdown */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>VAT Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Standard Rate (19%)</span>
                    <span className="font-medium">€2,890.00</span>
                  </div>
                  <Progress value={89} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Reduced Rate (7%)</span>
                    <span className="font-medium">€360.00</span>
                  </div>
                  <Progress value={11} className="h-2" />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total Net VAT</span>
                    <span className="text-xl font-bold text-red-600">
                      €{currentPeriod?.netVat.toLocaleString('de-DE', { minimumFractionDigits: 2 }) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Filing Reminder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Due: {currentPeriod ? new Date(currentPeriod.dueDate).toLocaleDateString('de-DE') : 'N/A'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  VAT return must be filed and payment made by this date to avoid
                  penalties.
                </p>
                <Button className="w-full mt-4">
                  <FileText className="mr-2 h-4 w-4" />
                  File Return Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* VAT Periods History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>VAT Periods</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Historical VAT return periods
            </p>
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Input VAT</TableHead>
                <TableHead>Output VAT</TableHead>
                <TableHead>Net VAT</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingPeriods ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredPeriods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No VAT periods found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">{period.period}</TableCell>
                    <TableCell>{new Date(period.startDate).toLocaleDateString('de-DE')}</TableCell>
                    <TableCell>{new Date(period.endDate).toLocaleDateString('de-DE')}</TableCell>
                    <TableCell>€{period.vatRecoverable.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>€{period.vatOwed.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="font-medium">
                      €{period.netVat.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[period.status]}
                      >
                        {period.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
