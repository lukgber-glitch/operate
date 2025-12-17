'use client';

import { Receipt, Filter, TrendingUp, Bell, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Transactions</h1>
          <p className="text-white/70">
            View and manage all financial transactions in one place
          </p>
        </div>

        <div className="flex gap-2">
          <Button disabled variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button disabled variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync
          </Button>
        </div>
      </div>

      {/* Coming Soon Card */}
      <GlassCard className="rounded-[16px] border-dashed">
          <div className="mx-auto w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <Receipt className="h-6 w-6 text-white/70" />
          </div>
          <h2 className="text-2xl text-white font-semibold text-center">Unified Transaction View Coming Soon</h2>
          <p className="text-white/70 max-w-2xl mx-auto text-center">
            We're developing a powerful unified transaction view that will consolidate all your
            financial activities in one comprehensive interface. This feature will include:
          </p>

          <div className="grid gap-4 md:grid-cols-3 text-left max-w-4xl mx-auto">
            <GlassCard padding="lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Receipt className="h-4 w-4 text-white/70" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Unified View</h3>
                    <p className="text-sm text-white/70">
                      All transactions from bank accounts, invoices, and expenses in one place
                    </p>
                  </div>
                </div>
            </GlassCard>

            <GlassCard padding="lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Filter className="h-4 w-4 text-white/70" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Advanced Filtering</h3>
                    <p className="text-sm text-white/70">
                      Filter by date range, amount, category, status, and custom tags
                    </p>
                  </div>
                </div>
            </GlassCard>

            <GlassCard padding="lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <TrendingUp className="h-4 w-4 text-white/70" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Smart Analytics</h3>
                    <p className="text-sm text-white/70">
                      Real-time insights and trends from your transaction data
                    </p>
                  </div>
                </div>
            </GlassCard>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button variant="outline" asChild>
              <Link href="mailto:support@operate.guru?subject=Transaction View Early Access">
                <Bell className="mr-2 h-4 w-4" />
                Request Early Access
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/finance">
                View Finance Overview
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <p className="text-sm text-white/70 text-center">
            Expected release: <strong>Q1 2026</strong>
          </p>
      </GlassCard>

      {/* Temporary Workaround */}
      <GlassCard padding="lg">
          <h3 className="text-lg font-semibold">View Transactions By Category</h3>
          <p className="text-sm text-white/70">
            Until the unified transaction view is ready, you can view transactions organized by their source:
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <GlassCard className="rounded-[16px] border-2">
                <h4 className="font-semibold mb-2">Bank Transactions</h4>
                <p className="text-sm text-white/70 mb-3">
                  View synced transactions from connected bank accounts
                </p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/finance/banking">
                    View Bank Transactions
                  </Link>
                </Button>
            </GlassCard>

            <GlassCard className="rounded-[16px] border-2">
                <h4 className="font-semibold mb-2">Invoice Payments</h4>
                <p className="text-sm text-white/70 mb-3">
                  Track payments received for sent invoices
                </p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/finance/invoices">
                    View Invoices
                  </Link>
                </Button>
            </GlassCard>

            <GlassCard className="rounded-[16px] border-2">
                <h4 className="font-semibold mb-2">Expense Records</h4>
                <p className="text-sm text-white/70 mb-3">
                  Review all submitted and approved expenses
                </p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/finance/expenses">
                    View Expenses
                  </Link>
                </Button>
            </GlassCard>

            <GlassCard className="rounded-[16px] border-2">
                <h4 className="font-semibold mb-2">Reconciliation</h4>
                <p className="text-sm text-white/70 mb-3">
                  Match and reconcile bank transactions
                </p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/finance/reconciliation">
                    Open Reconciliation
                  </Link>
                </Button>
            </GlassCard>
          </div>
      </GlassCard>
    </div>
  );
}
