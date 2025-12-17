'use client';

import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
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
import { useExportReport } from '@/hooks/use-reports';
import { reportsApi, type InvoiceReportData } from '@/lib/api/reports';
import { useToast } from '@/components/ui/use-toast';

// Convert date range string to actual dates
const convertDateRange = (dateRange: string): { fromDate?: string; toDate?: string } => {
  const today = new Date();
  const year = today.getFullYear();

  switch (dateRange) {
    case 'q1-2024':
      return { fromDate: '2024-01-01', toDate: '2024-03-31' };
    case 'q2-2024':
      return { fromDate: '2024-04-01', toDate: '2024-06-30' };
    case 'q3-2024':
      return { fromDate: '2024-07-01', toDate: '2024-09-30' };
    case 'q4-2024':
      return { fromDate: '2024-10-01', toDate: '2024-12-31' };
    case 'ytd-2024':
      return { fromDate: '2024-01-01', toDate: today.toISOString().split('T')[0] };
    case '2023':
      return { fromDate: '2023-01-01', toDate: '2023-12-31' };
    default:
      return { fromDate: `${year}-01-01`, toDate: today.toISOString().split('T')[0] };
  }
};

export default function SalesReportPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('q3-2024');
  const [isExporting, setIsExporting] = useState(false);

  const { exportReport } = useExportReport();

  // Fetch invoice report data (sales data)
  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['invoice-report', dateRange],
    queryFn: async () => {
      const dates = convertDateRange(dateRange);
      return await reportsApi.getInvoiceReport({
        ...dates,
        currency: 'EUR',
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleExport = async (format: 'pdf' | 'csv' | 'xlsx') => {
    setIsExporting(true);
    try {
      const response = await exportReport('invoices', format, { dateRange });
      toast({
        title: 'Export Initiated',
        description: `Your ${format.toUpperCase()} will be ready in ${response.estimatedCompletionTime}.`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export report. Please try again.',
        variant: 'destructive',
      });
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
          <h1 className="text-2xl text-white font-semibold tracking-tight">Sales Report</h1>
          <p className="text-muted-foreground">
            Invoice analytics, payment tracking, and sales performance metrics
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
      <Card className="rounded-[16px]">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Export Options</p>
              <p className="text-xs text-muted-foreground">
                Download this sales report in your preferred format
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
        <Card className="rounded-[16px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading sales report...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Card className="rounded-[16px]">
          <CardContent className="p-6">
            <div className="text-center py-12">
              <p className="text-sm text-red-600">Failed to load sales report</p>
              <p className="text-xs text-muted-foreground mt-2">Please try again later</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {!isLoading && !isError && report && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-[16px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-white font-bold">
                  {report.summary.totalInvoices}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Invoices issued
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[16px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-white font-bold">
                  €{report.summary.totalAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Total invoiced</span>
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[16px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-white font-bold text-green-600">
                  €{report.summary.paidAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully collected
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[16px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-white font-bold text-orange-600">
                  €{report.summary.outstandingAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Status Breakdown */}
          <Card className="rounded-[16px]">
            <CardHeader>
              <CardTitle>Invoice Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(report.byStatus).map(([status, data]) => {
                  const statusConfig = {
                    paid: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900' },
                    sent: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900' },
                    overdue: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900' },
                    draft: { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900' },
                    cancelled: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900' },
                  };

                  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
                  const Icon = config.icon;

                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.bg}`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{status}</p>
                          <p className="text-xs text-muted-foreground">{data.count} invoices</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${config.color}`}>
                          €{data.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Aging Report */}
          <Card className="rounded-[16px]">
            <CardHeader>
              <CardTitle>Invoice Aging Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Current (Not Due)</p>
                    <p className="text-xs text-muted-foreground">{report.aging.current.count} invoices</p>
                  </div>
                  <p className="text-sm font-bold text-green-600">
                    €{report.aging.current.amount.toLocaleString()}
                  </p>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">1-30 Days Overdue</p>
                    <p className="text-xs text-muted-foreground">{report.aging.days_1_30.count} invoices</p>
                  </div>
                  <p className="text-sm font-bold text-yellow-600">
                    €{report.aging.days_1_30.amount.toLocaleString()}
                  </p>
                </div>

                <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">31-60 Days Overdue</p>
                    <p className="text-xs text-muted-foreground">{report.aging.days_31_60.count} invoices</p>
                  </div>
                  <p className="text-sm font-bold text-orange-600">
                    €{report.aging.days_31_60.amount.toLocaleString()}
                  </p>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">60+ Days Overdue</p>
                    <p className="text-xs text-muted-foreground">{report.aging.days_60_plus.count} invoices</p>
                  </div>
                  <p className="text-sm font-bold text-red-600">
                    €{report.aging.days_60_plus.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Performance */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-[16px]">
              <CardHeader>
                <CardTitle>Payment Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Payment Time</span>
                  <span className="text-sm font-bold">
                    {report.averagePaymentTime} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Collection Rate</span>
                  <span className="text-sm font-bold text-green-600">
                    {((report.summary.paidAmount / report.summary.totalAmount) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Overdue Rate</span>
                  <span className="text-sm font-bold text-red-600">
                    {((report.summary.overdueAmount / report.summary.totalAmount) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[16px]">
              <CardHeader>
                <CardTitle>Quick Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Invoiced</span>
                  <span className="text-sm font-medium">
                    €{report.summary.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Paid</span>
                  <span className="text-sm font-medium text-green-600">
                    €{report.summary.paidAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Still Outstanding</span>
                  <span className="text-sm font-medium text-orange-600">
                    €{report.summary.outstandingAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Overdue Amount</span>
                  <span className="text-sm font-bold text-red-600">
                    €{report.summary.overdueAmount.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}
