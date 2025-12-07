'use client';

import { Plus, CreditCard, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { useBankAccounts } from '@/hooks/use-banking';

export default function BankingPage() {
  const { accounts, isLoading, error, fetchBankAccounts } = useBankAccounts();

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  const totalBalance = accounts
    .reduce((sum, acc) => sum + acc.balance, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <HeadlineOutside subtitle="Manage your bank accounts and transactions">
        Banking
      </HeadlineOutside>

      <Button asChild>
        <Link href="/finance/banking/connect">
          <Plus className="mr-2 h-4 w-4" />
          Connect Account
        </Link>
      </Button>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading bank accounts...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => fetchBankAccounts()}
            >
              Try Again
            </Button>
          </div>
        </div>
      ) : accounts.length === 0 ? (
        <AnimatedCard variant="elevated" padding="lg">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-sm text-muted-foreground mb-4">No bank accounts found</p>
            <Button asChild>
              <Link href="/finance/banking/connect">
                <Plus className="mr-2 h-4 w-4" />
                Connect Account
              </Link>
            </Button>
          </div>
        </AnimatedCard>
      ) : (
        <>
          {/* Total Balance Card */}
          <AnimatedCard variant="elevated" padding="lg" className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
            <div className="space-y-2">
              <p className="text-sm opacity-90">Total Balance</p>
              <p className="text-4xl font-bold">{formatCurrency(totalBalance)}</p>
              <p className="text-sm opacity-75">
                Across {accounts.length} accounts
              </p>
            </div>
          </AnimatedCard>

          {/* Bank Accounts Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {accounts.map((account) => (
          <AnimatedCard key={account.id} variant="elevated" padding="lg" className="relative hover:shadow-lg transition-shadow">
            {account.isPrimary && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  Primary
                </Badge>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                {account.accountName}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium">{account.bankName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account</span>
                  <span className="font-medium">{account.accountNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="outline">{account.type}</Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p
                      className={`text-2xl font-bold ${
                        account.balance < 0
                          ? 'text-red-600 dark:text-red-400'
                          : ''
                      }`}
                    >
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/finance/banking/${account.id}`}>
                      View
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </AnimatedCard>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <AnimatedCard variant="elevated" padding="md">
              <div className="text-sm font-medium text-muted-foreground pb-3">
                Total Balance
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(totalBalance)}
              </p>
            </AnimatedCard>

            <AnimatedCard variant="elevated" padding="md">
              <div className="text-sm font-medium text-muted-foreground pb-3">
                Active Accounts
              </div>
              <p className="text-2xl font-bold">
                {accounts.filter((acc) => acc.isActive).length}
              </p>
            </AnimatedCard>

            <AnimatedCard variant="elevated" padding="md">
              <div className="text-sm font-medium text-muted-foreground pb-3">
                Total Accounts
              </div>
              <p className="text-2xl font-bold">
                {accounts.length}
              </p>
            </AnimatedCard>
          </div>
        </>
      )}
    </div>
  );
}
