'use client';

import { Wallet, Plus, TrendingUp, Bell, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-white/70">
            Manage your financial accounts and account structure
          </p>
        </div>

        <Button disabled variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Coming Soon Card */}
      <GlassCard className="rounded-[24px] border-dashed">
          <div className="mx-auto w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <Wallet className="h-6 w-6 text-white/70" />
          </div>
          <h2 className="text-2xl text-white font-semibold text-center">Chart of Accounts Coming Soon</h2>
          <p className="text-white/70 max-w-2xl mx-auto text-center">
            We're building a comprehensive chart of accounts feature that will help you organize
            your financial data with precision. This feature will include:
          </p>

          <div className="grid gap-4 md:grid-cols-3 text-left max-w-4xl mx-auto">
            <GlassCard padding="lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Wallet className="h-4 w-4 text-white/70" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Account Hierarchy</h3>
                    <p className="text-sm text-white/70">
                      Multi-level account structure with parent-child relationships
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
                    <h3 className="font-semibold mb-1">Account Types</h3>
                    <p className="text-sm text-white/70">
                      Assets, liabilities, equity, income, and expense accounts
                    </p>
                  </div>
                </div>
            </GlassCard>

            <GlassCard padding="lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bell className="h-4 w-4 text-white/70" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Account Mapping</h3>
                    <p className="text-sm text-white/70">
                      Automatic transaction categorization based on account rules
                    </p>
                  </div>
                </div>
            </GlassCard>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button variant="outline" asChild>
              <Link href="mailto:support@operate.guru?subject=Chart of Accounts Early Access">
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
          <h3 className="text-lg font-semibold">In the Meantime</h3>
          <p className="text-sm text-white/70">
            You can manage your financial data using these existing features:
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" asChild>
              <Link href="/finance/banking">
                View Bank Accounts
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/finance/expenses">
                Manage Expenses
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/finance/invoices">
                View Invoices
              </Link>
            </Button>
          </div>
      </GlassCard>
    </div>
  );
}
