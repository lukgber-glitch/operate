'use client';

import { FileText, DollarSign, CheckCircle, Clock, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface VendorStatsProps {
  stats?: {
    totalBills: number;
    totalOutstanding: number;
    totalPaid: number;
    averagePaymentDays?: number;
    lastBillDate?: string;
    lastPaymentDate?: string;
  };
  isLoading?: boolean;
}

export function VendorStats({ stats, isLoading }: VendorStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Bills',
      value: stats.totalBills.toString(),
      description: 'All time',
      icon: FileText,
      iconColor: 'text-blue-400',
    },
    {
      title: 'Outstanding',
      value: formatCurrency(stats.totalOutstanding),
      description: 'Amount due',
      icon: Clock,
      iconColor: 'text-orange-600',
    },
    {
      title: 'Total Paid',
      value: formatCurrency(stats.totalPaid),
      description: 'All time',
      icon: CheckCircle,
      iconColor: 'text-green-600',
    },
    {
      title: 'Avg Payment Days',
      value: stats.averagePaymentDays?.toFixed(0) || 'N/A',
      description: stats.averagePaymentDays ? 'days average' : 'No data',
      icon: TrendingUp,
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Bill Date</span>
              <span className="font-medium">{formatDate(stats.lastBillDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Payment Date</span>
              <span className="font-medium">{formatDate(stats.lastPaymentDate)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
