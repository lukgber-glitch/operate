'use client';

import { Users, TrendingUp, DollarSign, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Client {
  id: string;
  name: string;
  revenue: number;
  invoiceCount: number;
  paymentStatus: 'excellent' | 'good' | 'fair' | 'poor';
}

interface ClientMetricsData {
  totalClients: number;
  activeClients: number;
  newClientsThisPeriod: number;
  clientGrowthRate: number;
  topClients: Client[];
  averageRevenuePerClient: number;
  clientRetentionRate: number;
  paymentBehavior: {
    onTime: number;
    late: number;
    overdue: number;
  };
}

export interface ClientMetricsProps {
  data: ClientMetricsData;
}

export function ClientMetrics({ data }: ClientMetricsProps) {
  const getPaymentStatusColor = (status: Client['paymentStatus']) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'good':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'fair':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'poor':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPaymentStatusLabel = (status: Client['paymentStatus']) => {
    switch (status) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Client Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.activeClients} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{data.newClientsThisPeriod}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.clientGrowthRate > 0 ? '+' : ''}{data.clientGrowthRate.toFixed(1)}% growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue/Client</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{data.averageRevenuePerClient.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per client
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.clientRetentionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Client loyalty
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients by Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Top Clients by Revenue</CardTitle>
          <CardDescription>Your most valuable clients this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topClients.map((client, index) => (
              <div
                key={client.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {client.invoiceCount} invoice{client.invoiceCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-bold">€{client.revenue.toLocaleString()}</p>
                    <Badge
                      variant="secondary"
                      className={getPaymentStatusColor(client.paymentStatus)}
                    >
                      {getPaymentStatusLabel(client.paymentStatus)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Client Growth Trend</CardTitle>
          <CardDescription>New clients over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {/* Chart Placeholder - Will be replaced with recharts */}
            <div className="flex h-full items-center justify-center rounded-lg border bg-muted/30">
              <div className="text-center">
                <TrendingUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Client Growth Line Chart
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Install recharts to display interactive chart
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Behavior Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Behavior</CardTitle>
          <CardDescription>Client payment patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 rounded-full bg-green-600"></div>
                <div>
                  <p className="font-medium">On-Time Payments</p>
                  <p className="text-sm text-muted-foreground">
                    Paid within due date
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{data.paymentBehavior.onTime}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 rounded-full bg-yellow-600"></div>
                <div>
                  <p className="font-medium">Late Payments</p>
                  <p className="text-sm text-muted-foreground">
                    Paid 1-30 days late
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{data.paymentBehavior.late}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 rounded-full bg-red-600"></div>
                <div>
                  <p className="font-medium">Overdue Payments</p>
                  <p className="text-sm text-muted-foreground">
                    More than 30 days late
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{data.paymentBehavior.overdue}%</p>
              </div>
            </div>
          </div>

          {/* Payment Behavior Chart */}
          <div className="mt-6 h-[250px]">
            <div className="flex h-full items-center justify-center rounded-lg border bg-muted/30">
              <div className="text-center">
                <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Payment Behavior Pie Chart
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Install recharts to display interactive chart
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
