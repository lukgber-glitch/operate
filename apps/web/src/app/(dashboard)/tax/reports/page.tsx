'use client';

import { useState } from 'react';
import { Download, FileText, Calendar, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaxReport } from '@/hooks/use-tax-reports';

const statusColors = {
  UPCOMING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DUE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function TaxReportsPage() {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [reportType, setReportType] = useState('summary');
  const { report, isLoading, exportReport } = useTaxReport(selectedYear);

  const handleGenerateReport = async () => {
    try {
      await exportReport('PDF');
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tax Reports</h1>
          <p className="text-muted-foreground">
            Generate and view comprehensive tax reports
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateReport}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={handleGenerateReport}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Report Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="year">Tax Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="reportType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Tax Summary</SelectItem>
                  <SelectItem value="deductions">Deductions Report</SelectItem>
                  <SelectItem value="vat">VAT Report</SelectItem>
                  <SelectItem value="monthly">Monthly Breakdown</SelectItem>
                  <SelectItem value="annual">Annual Tax Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select defaultValue="pdf">
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Summary Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  €{report?.summary.totalIncome.toLocaleString('de-DE', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tax year {report?.summary.year || selectedYear}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Deductions
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  €{report?.summary.totalDeductions.toLocaleString('de-DE', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reducing taxable income
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estimated Tax
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
                  Total tax liability
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
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  €{report?.summary.netVat.toLocaleString('de-DE', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Current period
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Deductions by Category */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Deductions by Category</CardTitle>
              <p className="text-sm text-muted-foreground">
                Breakdown of tax-deductible expenses for {selectedYear}
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : !report?.deductionsByCategory || report.deductionsByCategory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No deductions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {report.deductionsByCategory.map((item) => (
                        <TableRow key={item.category}>
                          <TableCell className="font-medium">{item.category}</TableCell>
                          <TableCell className="text-right">{item.count}</TableCell>
                          <TableCell className="text-right font-medium">
                            €{item.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                                <div
                                  className="h-full bg-blue-600"
                                  style={{
                                    width: `${(item.totalAmount / report.deductionsByCategory.reduce((sum, i) => sum + i.totalAmount, 0)) * 100}%`
                                  }}
                                />
                              </div>
                              <span className="text-sm">
                                {((item.totalAmount / report.deductionsByCategory.reduce((sum, i) => sum + i.totalAmount, 0)) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-slate-50 dark:bg-slate-900">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">
                          {report.deductionsByCategory.reduce((sum, item) => sum + item.count, 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          €{report.deductionsByCategory
                            .reduce((sum, item) => sum + item.totalAmount, 0)
                            .toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Tax Summary Breakdown */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Tax Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : report ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Income:</span>
                    <span className="font-medium">
                      €{report.summary.totalIncome.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Deductions:</span>
                    <span className="font-medium">
                      -€{report.summary.totalDeductions.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Taxable Income:</span>
                      <span>€{report.summary.taxableIncome.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Income Tax:</span>
                      <span className="font-medium">
                        €{report.summary.estimatedTax.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-muted-foreground">VAT Payable:</span>
                      <span className="font-medium">
                        €{report.summary.netVat.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center">No data available</p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" onClick={handleGenerateReport}>
                <FileText className="mr-2 h-4 w-4" />
                Annual Tax Return
              </Button>
              <Button variant="outline" className="w-full" onClick={handleGenerateReport}>
                <Download className="mr-2 h-4 w-4" />
                Deductions Summary
              </Button>
              <Button variant="outline" className="w-full" onClick={handleGenerateReport}>
                <Calculator className="mr-2 h-4 w-4" />
                VAT Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tax Deadlines</CardTitle>
          <p className="text-sm text-muted-foreground">
            Important filing and payment dates for {selectedYear}
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Estimated Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : !report?.deadlines || report.deadlines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No upcoming deadlines
                  </TableCell>
                </TableRow>
              ) : (
                report.deadlines.map((deadline) => (
                  <TableRow key={deadline.id}>
                    <TableCell className="font-medium">
                      {deadline.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{deadline.type}</Badge>
                    </TableCell>
                    <TableCell>{new Date(deadline.dueDate).toLocaleDateString('de-DE')}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[deadline.status]}
                      >
                        {deadline.status.toLowerCase()}
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
  );
}
