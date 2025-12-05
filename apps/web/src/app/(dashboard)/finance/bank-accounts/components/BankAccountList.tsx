'use client';

import { ChevronDown, ChevronRight, CreditCard, Wallet, TrendingUp, DollarSign, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BankConnection } from '@/lib/api/bank-connections';

interface BankAccountListProps {
  connection: BankConnection;
}

const accountTypeConfig = {
  CHECKING: {
    icon: Wallet,
    label: 'Checking',
    color: 'text-blue-600 dark:text-blue-400',
  },
  SAVINGS: {
    icon: TrendingUp,
    label: 'Savings',
    color: 'text-green-600 dark:text-green-400',
  },
  CREDIT: {
    icon: CreditCard,
    label: 'Credit',
    color: 'text-purple-600 dark:text-purple-400',
  },
  INVESTMENT: {
    icon: TrendingUp,
    label: 'Investment',
    color: 'text-orange-600 dark:text-orange-400',
  },
  OTHER: {
    icon: DollarSign,
    label: 'Other',
    color: 'text-gray-600 dark:text-gray-400',
  },
};

export function BankAccountList({ connection }: BankAccountListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const maskAccountNumber = (number: string) => {
    if (number.length <= 4) return number;
    return `****${number.slice(-4)}`;
  };

  if (connection.accounts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
            {connection.bankName} Accounts
          </CardTitle>
          <Badge variant="secondary">{connection.accounts.length}</Badge>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {connection.accounts.map((account) => {
              const typeInfo = accountTypeConfig[account.type];
              const TypeIcon = typeInfo.icon;

              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg bg-accent ${typeInfo.color}`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">
                          {account.accountName}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {typeInfo.label}
                        </Badge>
                        {!account.isActive && (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                            Inactive
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {account.iban ? (
                          <span className="font-mono">{account.iban}</span>
                        ) : (
                          <span className="font-mono">
                            {maskAccountNumber(account.accountNumber)}
                          </span>
                        )}
                      </div>

                      {account.availableBalance !== undefined &&
                        account.availableBalance !== account.balance && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Available: {formatCurrency(account.availableBalance, account.currency)}
                          </p>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">{account.currency}</p>
                    </div>

                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/finance/transactions?accountId=${account.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
