'use client';

import { CashBalanceCard } from '@/components/dashboard/CashBalanceCard';
import { ArApSummaryCard } from '@/components/dashboard/ArApSummaryCard';
import { RunwayCard } from '@/components/dashboard/RunwayCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ExpenseBreakdown } from '@/components/dashboard/ExpenseBreakdown';
import { UpcomingItems } from '@/components/dashboard/UpcomingItems';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { PageTransition } from '@/components/animation/PageTransition';

export default function DashboardPage() {
  return (
    <PageTransition>
      <div className="space-y-6 lg:space-y-8">
        <HeadlineOutside subtitle="Overview of your business metrics and activities">
          Dashboard
        </HeadlineOutside>

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
      </div>
    </PageTransition>
  );
}
