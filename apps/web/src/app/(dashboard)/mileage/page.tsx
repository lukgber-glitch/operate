'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { MileageSummaryCards } from '@/components/mileage/MileageSummaryCards';
import { MileageChart } from '@/components/mileage/MileageChart';
import { MileageEntryCard } from '@/components/mileage/MileageEntryCard';
import { useMileageEntries, useMileageSummary } from '@/hooks/use-mileage';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import type { CurrencyCode } from '@/types/currency';

export default function MileagePage() {
  const { entries, fetchEntries, isLoading: entriesLoading, duplicateEntry, deleteEntry, markAsReimbursed } = useMileageEntries({ pageSize: 5 });
  const { summary, fetchSummary, isLoading: summaryLoading } = useMileageSummary();

  useEffect(() => {
    fetchEntries();
    fetchSummary();
  }, [fetchEntries, fetchSummary]);

  const handleDuplicate = async (id: string) => {
    await duplicateEntry(id);
    fetchEntries();
    fetchSummary();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await deleteEntry(id);
      fetchEntries();
      fetchSummary();
    }
  };

  const handleToggleReimbursed = async (id: string) => {
    await markAsReimbursed(id);
    fetchEntries();
    fetchSummary();
  };

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">Mileage Tracking</h1>
          <p className="text-white/70">Track and manage business mileage</p>
        </div>
        <Button asChild>
          <Link href="/mileage/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Link>
        </Button>
      </motion.div>

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : summary ? (
        <MileageSummaryCards
          totalDistance={summary.totalDistance}
          totalAmount={summary.totalAmount}
          thisMonth={summary.thisMonth}
          thisYear={summary.thisYear}
          currency={summary.currency as CurrencyCode}
          distanceUnit={summary.distanceUnit}
        />
      ) : null}

      {/* Monthly Chart */}
      {summary && summary.monthlyTrend && (
        <motion.div variants={fadeUp}>
          <MileageChart
            data={summary.monthlyTrend}
            currency={summary.currency as CurrencyCode}
            distanceUnit={summary.distanceUnit}
          />
        </motion.div>
      )}

      {/* Recent Entries */}
      <motion.div variants={fadeUp} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Recent Entries</h2>
          <Button variant="outline" asChild>
            <Link href="/mileage/entries">View All</Link>
          </Button>
        </div>

        {entriesLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/50 mb-4">No mileage entries yet</p>
            <Button asChild>
              <Link href="/mileage/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Entry
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <MileageEntryCard
                key={entry.id}
                entry={entry}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onToggleReimbursed={handleToggleReimbursed}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
