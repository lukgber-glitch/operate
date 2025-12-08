'use client';

import { CashBalanceCard } from '@/components/dashboard/CashBalanceCard';
import { ArApSummaryCard } from '@/components/dashboard/ArApSummaryCard';
import { RunwayCard } from '@/components/dashboard/RunwayCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ExpenseBreakdown } from '@/components/dashboard/ExpenseBreakdown';
import { UpcomingItems } from '@/components/dashboard/UpcomingItems';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { TrustBadges } from '@/components/dashboard/TrustBadges';
import { UserStats } from '@/components/dashboard/UserStats';
import { AutopilotIndicator } from '@/components/dashboard/AutopilotIndicator';
import { TestimonialsCarousel } from '@/components/dashboard/TestimonialsCarousel';

export default function DashboardPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your business metrics and activities</p>
        </div>
        <TrustBadges variant="compact" className="lg:ml-auto" />
      </div>

      {/* Autopilot indicator */}
      <AutopilotIndicator />

      {/* Top row: Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <CashBalanceCard />
        <ArApSummaryCard type="receivables" />
        <ArApSummaryCard type="payables" />
        <RunwayCard />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <RevenueChart />
        <ExpenseBreakdown />
      </div>

      {/* Bottom row: Action items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <UpcomingItems type="invoices" title="Überfällige Rechnungen" />
        <UpcomingItems type="bills" title="Anstehende Zahlungen" />
        <QuickActions />
      </div>

      {/* Trust elements row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <UserStats />
        <TestimonialsCarousel />
      </div>
    </div>
  );
}
