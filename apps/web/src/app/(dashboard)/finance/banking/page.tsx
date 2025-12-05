'use client';

import { Plus, CreditCard, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banking</h1>
          <p className="text-muted-foreground">
            Manage your bank accounts and transactions
          </p>
        </div>

        <Button asChild>
          <Link href="/finance/banking/connect">
            <Plus className="mr-2 h-4 w-4" />
            Connect Account
          </Link>
        </Button>
      </div>

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
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-sm text-muted-foreground mb-4">No bank accounts found</p>
            <Button asChild>
              <Link href="/finance/banking/connect">
                <Plus className="mr-2 h-4 w-4" />
                Connect Account
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Total Balance Card */}
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm opacity-90">Total Balance</p>
                <p className="text-4xl font-bold">{formatCurrency(totalBalance)}</p>
                <p className="text-sm opacity-75">
                  Across {accounts.length} accounts
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bank Accounts Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {accounts.map((account) => (
          <Card key={account.id} className="relative hover:shadow-lg transition-shadow">
            {account.isPrimary && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  Primary
                </Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                {account.accountName}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
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

            </CardContent>
          </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalBalance)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {accounts.filter((acc) => acc.isActive).length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {accounts.length}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
