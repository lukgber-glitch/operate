'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Calendar } from 'lucide-react';
import { MrrCard } from '@/components/admin/subscriptions/MrrCard';
import { MrrChart } from '@/components/admin/subscriptions/MrrChart';
import { RevenueByTierChart } from '@/components/admin/subscriptions/RevenueByTierChart';
import { ChurnIndicator } from '@/components/admin/subscriptions/ChurnIndicator';
import { SubscriptionTable } from '@/components/admin/subscriptions/SubscriptionTable';
import {
  useSubscriptionStats,
  useMrrChart,
  useRevenueByTier,
  useSubscriptions,
  useChurnMetrics,
  useExportSubscriptions,
} from '@/hooks/use-subscription-analytics';
import type { SubscriptionFilters } from '@/types/subscription-analytics';

type DateRange = '7d' | '30d' | '90d' | '1y' | 'all';

export default function SubscriptionsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SubscriptionFilters>({});

  const getDateFromRange = (range: DateRange): { dateFrom?: string; dateTo?: string } => {
    const now = new Date();
    const dateTo = now.toISOString();

    switch (range) {
      case '7d':
        return {
          dateFrom: new Date(now.setDate(now.getDate() - 7)).toISOString(),
          dateTo,
        };
      case '30d':
        return {
          dateFrom: new Date(now.setDate(now.getDate() - 30)).toISOString(),
          dateTo,
        };
      case '90d':
        return {
          dateFrom: new Date(now.setDate(now.getDate() - 90)).toISOString(),
          dateTo,
        };
      case '1y':
        return {
          dateFrom: new Date(now.setFullYear(now.getFullYear() - 1)).toISOString(),
          dateTo,
        };
      case 'all':
      default:
        return {};
    }
  };

  const { dateFrom, dateTo } = getDateFromRange(dateRange);

  // Fetch data
  const { data: stats, isLoading: statsLoading } = useSubscriptionStats(dateFrom, dateTo);
  const { data: mrrData, isLoading: mrrLoading } = useMrrChart(dateFrom, dateTo);
  const { data: revenueByTier, isLoading: revenueLoading } = useRevenueByTier(dateFrom, dateTo);
  const { data: churnMetrics, isLoading: churnLoading } = useChurnMetrics(dateFrom, dateTo);
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useSubscriptions(
    page,
    20,
    filters
  );

  const exportMutation = useExportSubscriptions();

  const handleExport = () => {
    exportMutation.mutate(filters);
  };

  const handleFilterChange = (newFilters: SubscriptionFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Analytics</h1>
          <p className="text-muted-foreground">
            Monitor MRR, churn, and subscription performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-40">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} disabled={exportMutation.isPending}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MrrCard
          title="Total MRR"
          value={stats?.totalMRR || 0}
          format="currency"
          isLoading={statsLoading}
        />
        <MrrCard
          title="Total ARR"
          value={stats?.totalARR || 0}
          format="currency"
          isLoading={statsLoading}
        />
        <MrrCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions || 0}
          format="number"
          isLoading={statsLoading}
        />
        <MrrCard
          title="Trial Conversions"
          value={stats?.trialConversions || 0}
          format="number"
          changeLabel="this month"
          isLoading={statsLoading}
        />
        <div className="md:col-span-2 lg:col-span-1">
          {churnMetrics ? (
            <ChurnIndicator metrics={churnMetrics} isLoading={churnLoading} />
          ) : (
            <MrrCard
              title="Churn Rate"
              value={stats?.churnRate || 0}
              format="percentage"
              isLoading={statsLoading || churnLoading}
            />
          )}
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <MrrCard
          title="Average Revenue Per User"
          value={stats?.averageRevenuePerUser || 0}
          format="currency"
          isLoading={statsLoading}
        />
        <MrrCard
          title="Customer Lifetime Value"
          value={stats?.lifetimeValue || 0}
          format="currency"
          isLoading={statsLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <MrrChart data={mrrData || []} isLoading={mrrLoading} />
        </div>
        <div className="lg:col-span-2">
          <RevenueByTierChart data={revenueByTier || []} isLoading={revenueLoading} />
        </div>
      </div>

      {/* Subscriptions Table */}
      <SubscriptionTable
        subscriptions={subscriptionsData?.subscriptions || []}
        isLoading={subscriptionsLoading}
        onFilterChange={handleFilterChange}
      />

      {/* Pagination */}
      {subscriptionsData && subscriptionsData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1} to{' '}
            {Math.min(page * 20, subscriptionsData.total)} of {subscriptionsData.total}{' '}
            subscriptions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(subscriptionsData.totalPages, p + 1))}
              disabled={page === subscriptionsData.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
