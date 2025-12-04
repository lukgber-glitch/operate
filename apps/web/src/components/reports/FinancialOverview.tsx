'use client';

import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FinancialData {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
  cashFlow: number;
  outstandingInvoices: number;
}

interface FinancialOverviewProps {
  data: FinancialData;
}

export function FinancialOverview({ data }: FinancialOverviewProps) {
  const profitChange = data.profit > 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{data.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              For selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{data.expenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Operating costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {profitChange ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitChange ? 'text-green-600' : 'text-red-600'}`}>
              €{data.profit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {profitChange ? 'Profitable period' : 'Loss period'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Of total revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses Trend</CardTitle>
          <CardDescription>Monthly comparison over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {/* Chart Placeholder - Will be replaced with recharts */}
            <div className="flex h-full items-center justify-center rounded-lg border bg-muted/30">
              <div className="text-center">
                <TrendingUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Revenue vs Expenses Line/Bar Chart
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Install recharts to display interactive chart
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>Available liquid funds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">€{data.cashFlow.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Current cash position
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outstanding Invoices</CardTitle>
            <CardDescription>Pending receivables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              €{data.outstandingInvoices.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Awaiting payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>Detailed monthly financial summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left font-medium">Month</th>
                  <th className="pb-3 text-right font-medium">Revenue</th>
                  <th className="pb-3 text-right font-medium">Expenses</th>
                  <th className="pb-3 text-right font-medium">Profit</th>
                  <th className="pb-3 text-right font-medium">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyTrend.map((month) => {
                  const profit = month.revenue - month.expenses;
                  const margin = ((profit / month.revenue) * 100).toFixed(1);
                  return (
                    <tr key={month.month} className="border-b">
                      <td className="py-3 font-medium">{month.month}</td>
                      <td className="py-3 text-right">€{month.revenue.toLocaleString()}</td>
                      <td className="py-3 text-right">€{month.expenses.toLocaleString()}</td>
                      <td className={`py-3 text-right ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        €{profit.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">{margin}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t font-bold">
                  <td className="pt-3">Total</td>
                  <td className="pt-3 text-right">€{data.revenue.toLocaleString()}</td>
                  <td className="pt-3 text-right">€{data.expenses.toLocaleString()}</td>
                  <td className={`pt-3 text-right ${data.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{data.profit.toLocaleString()}
                  </td>
                  <td className="pt-3 text-right">{data.profitMargin.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
