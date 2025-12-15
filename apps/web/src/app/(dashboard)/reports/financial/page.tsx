'use client';

import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animation-variants';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFinancialReport, useExportReport } from '@/hooks/use-reports';

export default function FinancialReportPage() {
  const [dateRange, setDateRange] = useState('q3-2024');
  const [isExporting, setIsExporting] = useState(false);

  const { data: report, isLoading, isError } = useFinancialReport({ dateRange });
  const { exportReport } = useExportReport();

  const handleExport = async (format: 'pdf' | 'csv' | 'xlsx') => {
    setIsExporting(true);
    try {
      const response = await exportReport('financial', format, { dateRange });
      alert(`Report export initiated! Your ${format.toUpperCase()} will be ready in ${response.estimatedCompletionTime}.`);
    } catch (error) {
      alert('Failed to export report. Please try again.');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/reports">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Reports
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">Financial Report</h1>
          <p className="text-muted-foreground">
            Comprehensive financial overview including revenue, expenses, and profitability
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q1-2024">Q1 2024</SelectItem>
              <SelectItem value="q2-2024">Q2 2024</SelectItem>
              <SelectItem value="q3-2024">Q3 2024</SelectItem>
              <SelectItem value="q4-2024">Q4 2024</SelectItem>
              <SelectItem value="ytd-2024">Year to Date 2024</SelectItem>
              <SelectItem value="2023">Full Year 2023</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Export Actions */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
      <Card className="rounded-[24px]">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Export Options</p>
              <p className="text-xs text-muted-foreground">
                Download this financial report in your preferred format
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={isExporting}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('xlsx')}
                disabled={isExporting}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <Card className="rounded-[24px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading financial report...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Card className="rounded-[24px]">
          <CardContent className="p-6">
            <div className="text-center py-12">
              <p className="text-sm text-red-600">Failed to load financial report</p>
              <p className="text-xs text-muted-foreground mt-2">Please try again later</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {!isLoading && !isError && report && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-[24px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-white font-bold">
                  €{report.revenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Revenue generated</span>
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[24px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-white font-bold">
                  €{report.expenses.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-orange-600" />
                  <span className="text-orange-600">Total costs</span>
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[24px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-white font-bold">
                  €{report.profit.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {report.profit >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  )}
                  <span className={report.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {report.profitMargin.toFixed(1)}% margin
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[24px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-white font-bold">
                  €{report.outstandingInvoices.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending collection
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Breakdown */}
            <Card className="rounded-[24px]">
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Invoiced</span>
                  <span className="text-sm font-medium">
                    €{report.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Paid</span>
                  <span className="text-sm font-medium text-green-600">
                    €{report.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Outstanding</span>
                  <span className="text-sm font-medium text-orange-600">
                    €{report.outstandingInvoices.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Overdue</span>
                  <span className="text-sm font-medium text-red-600">
                    €0
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow */}
            <Card className="rounded-[24px]">
              <CardHeader>
                <CardTitle>Cash Flow Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Inflow</span>
                  <span className="text-sm font-medium text-green-600">
                    €{report.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Outflow</span>
                  <span className="text-sm font-medium text-red-600">
                    €{report.expenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Net Cash Flow</span>
                  <span className={`text-sm font-bold ${report.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{report.cashFlow.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend */}
          {report.monthlyTrend && report.monthlyTrend.length > 0 && (
            <Card className="rounded-[24px]">
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.monthlyTrend.map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium w-16">{month.month}</span>
                      <div className="flex-1 mx-4">
                        <div className="flex gap-2">
                          <div className="flex-1 bg-green-100 dark:bg-green-900 rounded-full h-6 relative">
                            <div
                              className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${(month.revenue / 25000) * 100}%` }}
                            >
                              <span className="text-xs text-white">
                                €{month.revenue.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 bg-red-100 dark:bg-red-900 rounded-full h-6 relative">
                            <div
                              className="bg-red-500 h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${(month.expenses / 25000) * 100}%` }}
                            >
                              <span className="text-xs text-white">
                                €{month.expenses.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-xs text-muted-foreground">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-xs text-muted-foreground">Expenses</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
