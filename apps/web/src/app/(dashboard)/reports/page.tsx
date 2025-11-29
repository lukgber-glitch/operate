'use client';

import { useState } from 'react';
import {
  FileText,
  TrendingUp,
  Users,
  PieChart,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';

// Mock data
const mockFinancialData = {
  revenue: 125600,
  expenses: 78400,
  profit: 47200,
  profitMargin: 37.6,
  monthlyTrend: [
    { month: 'Jan', revenue: 18500, expenses: 12200 },
    { month: 'Feb', revenue: 21300, expenses: 13800 },
    { month: 'Mar', revenue: 19800, expenses: 11900 },
    { month: 'Apr', revenue: 23400, expenses: 14600 },
    { month: 'May', revenue: 20800, expenses: 12700 },
    { month: 'Jun', revenue: 21800, expenses: 13200 },
  ],
};

const mockTaxData = {
  vatCollected: 23860,
  vatPaid: 14904,
  vatOwed: 8956,
  deductions: 15600,
  breakdown: [
    { category: 'VAT on Sales', amount: 23860, period: 'Q3 2024' },
    { category: 'VAT on Purchases', amount: -14904, period: 'Q3 2024' },
    { category: 'Business Deductions', amount: -15600, period: 'Q3 2024' },
  ],
};

const mockInvoiceAging = {
  total: 45800,
  current: 28500,
  days30: 12300,
  days60: 3200,
  days90: 1800,
  breakdown: [
    { customer: 'Acme Corp', amount: 5250, age: 'Current', dueDate: '2024-12-15' },
    { customer: 'Tech Solutions GmbH', amount: 3800, age: 'Current', dueDate: '2024-12-20' },
    { customer: 'Digital Services Ltd', amount: 2150, age: '30-60 days', dueDate: '2024-11-20' },
    { customer: 'Innovation Hub', amount: 4600, age: 'Current', dueDate: '2024-12-25' },
    { customer: 'StartUp Inc', amount: 1450, age: '60-90 days', dueDate: '2024-10-15' },
  ],
};

const mockExpenseAnalysis = {
  total: 78400,
  categories: [
    { name: 'Salaries & Wages', amount: 42000, percentage: 53.6, trend: 'up' },
    { name: 'Office & Rent', amount: 12000, percentage: 15.3, trend: 'stable' },
    { name: 'Software & Tools', amount: 8400, percentage: 10.7, trend: 'up' },
    { name: 'Marketing', amount: 6800, percentage: 8.7, trend: 'down' },
    { name: 'Travel', amount: 5200, percentage: 6.6, trend: 'stable' },
    { name: 'Other', amount: 4000, percentage: 5.1, trend: 'stable' },
  ],
};

const mockHRData = {
  headcount: 24,
  payrollCosts: 42000,
  avgSalary: 1750,
  departments: [
    { name: 'Engineering', employees: 12, payroll: 24000 },
    { name: 'Sales', employees: 6, payroll: 9600 },
    { name: 'Operations', employees: 4, payroll: 6000 },
    { name: 'Administration', employees: 2, payroll: 2400 },
  ],
};

type ReportType = 'financial' | 'tax' | 'aging' | 'expenses' | 'hr' | null;

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('q3-2024');
  const [expandedReport, setExpandedReport] = useState<ReportType>(null);

  const toggleReport = (report: ReportType) => {
    setExpandedReport(expandedReport === report ? null : report);
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel', reportName: string) => {
    // Simulated export
    alert(`Exporting ${reportName} as ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export business reports and analytics
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
      </div>

      {/* Report Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Financial Overview Card */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => toggleReport('financial')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <Badge variant="secondary">Financial</Badge>
            </div>
            <CardTitle className="mt-4">Financial Overview</CardTitle>
            <CardDescription>Revenue, expenses, and profit analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="font-medium">€{mockFinancialData.revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Profit</span>
                <span className="font-medium text-green-600">€{mockFinancialData.profit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Margin</span>
                <span className="font-medium">{mockFinancialData.profitMargin}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Summary Card */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => toggleReport('tax')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <FileText className="h-8 w-8 text-purple-500" />
              <Badge variant="secondary">Tax</Badge>
            </div>
            <CardTitle className="mt-4">Tax Summary</CardTitle>
            <CardDescription>VAT collected, paid, and deductions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">VAT Collected</span>
                <span className="font-medium">€{mockTaxData.vatCollected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">VAT Paid</span>
                <span className="font-medium">€{mockTaxData.vatPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Net Owed</span>
                <span className="font-medium text-orange-600">€{mockTaxData.vatOwed.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Aging Card */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => toggleReport('aging')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Calendar className="h-8 w-8 text-yellow-500" />
              <Badge variant="secondary">Receivables</Badge>
            </div>
            <CardTitle className="mt-4">Invoice Aging</CardTitle>
            <CardDescription>Outstanding invoices by age</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Outstanding</span>
                <span className="font-medium">€{mockInvoiceAging.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Current</span>
                <span className="font-medium text-green-600">€{mockInvoiceAging.current.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Overdue</span>
                <span className="font-medium text-red-600">€{(mockInvoiceAging.total - mockInvoiceAging.current).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Analysis Card */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => toggleReport('expenses')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <PieChart className="h-8 w-8 text-red-500" />
              <Badge variant="secondary">Expenses</Badge>
            </div>
            <CardTitle className="mt-4">Expense Analysis</CardTitle>
            <CardDescription>Breakdown by category and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Expenses</span>
                <span className="font-medium">€{mockExpenseAnalysis.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Top Category</span>
                <span className="font-medium">{mockExpenseAnalysis.categories?.[0]?.name ?? 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Percentage</span>
                <span className="font-medium">{mockExpenseAnalysis.categories?.[0]?.percentage ?? 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HR Summary Card */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => toggleReport('hr')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-green-500" />
              <Badge variant="secondary">HR</Badge>
            </div>
            <CardTitle className="mt-4">HR Summary</CardTitle>
            <CardDescription>Headcount and payroll costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Headcount</span>
                <span className="font-medium">{mockHRData.headcount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Payroll Costs</span>
                <span className="font-medium">€{mockHRData.payrollCosts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Salary</span>
                <span className="font-medium">€{mockHRData.avgSalary.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expanded Report Details */}
      {expandedReport === 'financial' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Financial Overview - Detailed Report</CardTitle>
                <CardDescription>Complete financial analysis for {dateRange}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('pdf', 'Financial Overview')}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('csv', 'Financial Overview')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('excel', 'Financial Overview')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleReport(null)}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">€{mockFinancialData.revenue.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">€{mockFinancialData.expenses.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold text-green-600">€{mockFinancialData.profit.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className="text-2xl font-bold">{mockFinancialData.profitMargin}%</p>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Monthly Trend</h3>
              <div className="rounded-lg border bg-muted/30 p-8 text-center">
                <PieChart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Chart visualization: Revenue vs Expenses trend over 6 months
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  (Chart component placeholder - will display interactive line/bar chart)
                </p>
              </div>
            </div>

            {/* Monthly Breakdown Table */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Monthly Breakdown</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Margin %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockFinancialData.monthlyTrend.map((month) => {
                    const profit = month.revenue - month.expenses;
                    const margin = ((profit / month.revenue) * 100).toFixed(1);
                    return (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">{month.month}</TableCell>
                        <TableCell className="text-right">€{month.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">€{month.expenses.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-green-600">€{profit.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{margin}%</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">€{mockFinancialData.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">€{mockFinancialData.expenses.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">€{mockFinancialData.profit.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{mockFinancialData.profitMargin}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {expandedReport === 'tax' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tax Summary - Detailed Report</CardTitle>
                <CardDescription>VAT and deductions for {dateRange}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('pdf', 'Tax Summary')}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('csv', 'Tax Summary')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleReport(null)}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">VAT Collected</p>
                <p className="text-2xl font-bold">€{mockTaxData.vatCollected.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">VAT Paid</p>
                <p className="text-2xl font-bold">€{mockTaxData.vatPaid.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Net VAT Owed</p>
                <p className="text-2xl font-bold text-orange-600">€{mockTaxData.vatOwed.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Deductions</p>
                <p className="text-2xl font-bold">€{mockTaxData.deductions.toLocaleString()}</p>
              </div>
            </div>

            {/* Breakdown Table */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Tax Breakdown</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTaxData.breakdown.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell>{item.period}</TableCell>
                      <TableCell className={`text-right ${item.amount < 0 ? 'text-green-600' : ''}`}>
                        {item.amount < 0 ? '-' : ''}€{Math.abs(item.amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {expandedReport === 'aging' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoice Aging - Detailed Report</CardTitle>
                <CardDescription>Outstanding invoices analysis as of today</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('pdf', 'Invoice Aging')}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('excel', 'Invoice Aging')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleReport(null)}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary by Age */}
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">€{mockInvoiceAging.total.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Current</p>
                <p className="text-2xl font-bold text-green-600">€{mockInvoiceAging.current.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">1-30 Days</p>
                <p className="text-2xl font-bold text-yellow-600">€{mockInvoiceAging.days30.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">31-60 Days</p>
                <p className="text-2xl font-bold text-orange-600">€{mockInvoiceAging.days60.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">60+ Days</p>
                <p className="text-2xl font-bold text-red-600">€{mockInvoiceAging.days90.toLocaleString()}</p>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Aging Distribution</h3>
              <div className="rounded-lg border bg-muted/30 p-8 text-center">
                <PieChart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Chart visualization: Pie chart showing distribution by age bucket
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  (Chart component placeholder - will display interactive pie chart)
                </p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Invoice Details</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Age Bucket</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoiceAging.breakdown.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.customer}</TableCell>
                      <TableCell>€{item.amount.toLocaleString()}</TableCell>
                      <TableCell>{item.dueDate}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            item.age === 'Current'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : item.age === '30-60 days'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          }
                        >
                          {item.age}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {expandedReport === 'expenses' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Expense Analysis - Detailed Report</CardTitle>
                <CardDescription>Category breakdown and trends for {dateRange}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('pdf', 'Expense Analysis')}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('csv', 'Expense Analysis')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleReport(null)}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total Summary */}
            <div className="rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-3xl font-bold">€{mockExpenseAnalysis.total.toLocaleString()}</p>
            </div>

            {/* Chart Placeholder */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Expense Distribution</h3>
              <div className="rounded-lg border bg-muted/30 p-8 text-center">
                <PieChart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Chart visualization: Pie/bar chart showing expense breakdown by category
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  (Chart component placeholder - will display interactive chart)
                </p>
              </div>
            </div>

            {/* Category Breakdown */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Category Breakdown</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                    <TableHead className="text-right">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockExpenseAnalysis.categories.map((category, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right">€{category.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{category.percentage}%</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className={
                            category.trend === 'up'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : category.trend === 'down'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                          }
                        >
                          {category.trend === 'up' ? '↑ Up' : category.trend === 'down' ? '↓ Down' : '→ Stable'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {expandedReport === 'hr' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>HR Summary - Detailed Report</CardTitle>
                <CardDescription>Headcount and payroll analysis for {dateRange}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('pdf', 'HR Summary')}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('csv', 'HR Summary')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleReport(null)}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Headcount</p>
                <p className="text-2xl font-bold">{mockHRData.headcount}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Payroll</p>
                <p className="text-2xl font-bold">€{mockHRData.payrollCosts.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Average Salary</p>
                <p className="text-2xl font-bold">€{mockHRData.avgSalary.toLocaleString()}</p>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Department Distribution</h3>
              <div className="rounded-lg border bg-muted/30 p-8 text-center">
                <PieChart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Chart visualization: Headcount and payroll by department
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  (Chart component placeholder - will display interactive bar chart)
                </p>
              </div>
            </div>

            {/* Department Breakdown */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Department Breakdown</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Employees</TableHead>
                    <TableHead className="text-right">Monthly Payroll</TableHead>
                    <TableHead className="text-right">Avg per Employee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockHRData.departments.map((dept, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="text-right">{dept.employees}</TableCell>
                      <TableCell className="text-right">€{dept.payroll.toLocaleString()}</TableCell>
                      <TableCell className="text-right">€{(dept.payroll / dept.employees).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{mockHRData.headcount}</TableCell>
                    <TableCell className="text-right">€{mockHRData.payrollCosts.toLocaleString()}</TableCell>
                    <TableCell className="text-right">€{mockHRData.avgSalary.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
