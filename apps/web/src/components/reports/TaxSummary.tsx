'use client';

import { FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TaxDeadline {
  type: string;
  dueDate: string;
  status: 'upcoming' | 'due-soon' | 'overdue';
  description: string;
}

interface TaxData {
  vatCollected: number;
  vatPaid: number;
  vatOwed: number;
  estimatedTaxLiability: number;
  deductions: number;
  upcomingDeadlines: TaxDeadline[];
  breakdown: Array<{
    category: string;
    amount: number;
    period: string;
  }>;
}

export interface TaxSummaryProps {
  data: TaxData;
}

export function TaxSummary({ data }: TaxSummaryProps) {
  const getDeadlineStatusColor = (status: TaxDeadline['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'due-soon':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'overdue':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getDeadlineIcon = (status: TaxDeadline['status']) => {
    switch (status) {
      case 'upcoming':
        return <CheckCircle className="h-4 w-4" />;
      case 'due-soon':
        return <Clock className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* VAT Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VAT Collected</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{data.vatCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              On sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VAT Paid</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{data.vatPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              On purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net VAT Owed</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              €{data.vatOwed.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              To be paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Liability</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{data.estimatedTaxLiability.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* VAT Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>VAT Overview</CardTitle>
          <CardDescription>Collected vs Paid comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {/* Chart Placeholder - Will be replaced with recharts */}
            <div className="flex h-full items-center justify-center rounded-lg border bg-muted/30">
              <div className="text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  VAT Collected vs Paid Bar Chart
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Install recharts to display interactive chart
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tax Deadlines</CardTitle>
          <CardDescription>Important dates and submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.upcomingDeadlines.length > 0 ? (
              data.upcomingDeadlines.map((deadline, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getDeadlineIcon(deadline.status)}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{deadline.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {deadline.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due: {deadline.dueDate}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={getDeadlineStatusColor(deadline.status)}
                  >
                    {deadline.status === 'upcoming' && 'Upcoming'}
                    {deadline.status === 'due-soon' && 'Due Soon'}
                    {deadline.status === 'overdue' && 'Overdue'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="mb-4 h-12 w-12 text-green-600" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground">
                  No upcoming tax deadlines at the moment
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tax Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Breakdown</CardTitle>
          <CardDescription>Detailed category breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left font-medium">Category</th>
                  <th className="pb-3 text-left font-medium">Period</th>
                  <th className="pb-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.breakdown.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 font-medium">{item.category}</td>
                    <td className="py-3 text-muted-foreground">{item.period}</td>
                    <td className={`py-3 text-right font-medium ${
                      item.amount < 0 ? 'text-green-600' : 'text-slate-900 dark:text-white'
                    }`}>
                      {item.amount < 0 ? '-' : ''}€{Math.abs(item.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-bold">
                  <td className="pt-3">Total Deductions</td>
                  <td className="pt-3"></td>
                  <td className="pt-3 text-right text-green-600">
                    -€{data.deductions.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
