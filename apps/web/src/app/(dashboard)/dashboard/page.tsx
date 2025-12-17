'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import { CashBalanceCard } from '@/components/dashboard/CashBalanceCard';
import { ArApSummaryCard } from '@/components/dashboard/ArApSummaryCard';
import { RunwayCard } from '@/components/dashboard/RunwayCard';
import { UpcomingItems } from '@/components/dashboard/UpcomingItems';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { EmailReviewQueue } from '@/components/dashboard/EmailReviewQueue';
import { TrustBadges } from '@/components/dashboard/TrustBadges';
import { UserStats } from '@/components/dashboard/UserStats';
import { AutopilotIndicator } from '@/components/dashboard/AutopilotIndicator';
import { TestimonialsCarousel } from '@/components/dashboard/TestimonialsCarousel';
import { BusinessHealthScore } from '@/components/dashboard/BusinessHealthScore';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load chart components for better performance
const RevenueChart = dynamic(
  () => import('@/components/dashboard/RevenueChart').then(m => ({ default: m.RevenueChart })),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-[16px]" /> }
);

const ExpenseBreakdown = dynamic(
  () => import('@/components/dashboard/ExpenseBreakdown').then(m => ({ default: m.ExpenseBreakdown })),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-[16px]" /> }
);

function DashboardContent() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-gray-300">Overview of your business metrics and activities</p>
        </div>
        <TrustBadges variant="compact" className="lg:ml-auto" />
      </div>

      {/* Autopilot indicator */}
      <div>
        <AutopilotIndicator />
      </div>

      {/* Top row: Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <CashBalanceCard />
        <ArApSummaryCard type="receivables" />
        <ArApSummaryCard type="payables" />
        <RunwayCard />
      </div>

      {/* Business Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <RevenueChart />
            <ExpenseBreakdown />
          </div>
        </div>
        <div>
          <BusinessHealthScore />
        </div>
      </div>

      {/* Bottom row: Action items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <UpcomingItems type="invoices" title="Überfällige Rechnungen" />
        <UpcomingItems type="bills" title="Anstehende Zahlungen" />
        <QuickActions />
      </div>

      {/* Email Review Queue */}
      <div>
        <EmailReviewQueue limit={5} showHeader={true} />
      </div>

      {/* Trust elements row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <UserStats />
        <TestimonialsCarousel />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
