'use client';

import React from 'react';
import { Link2, Tag, Split, Eye, EyeOff, Building2, Calendar, Hash, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';

interface TransactionDetailPanelProps {
  transaction: {
    id: string;
    amount: number;
    currency: string;
    date: string;
    description: string;
    account: {
      name: string;
      lastFour: string;
      type: 'checking' | 'savings' | 'credit';
    };
    type: 'debit' | 'credit';
    status: 'pending' | 'posted';
    category?: string;
    categoryConfidence?: number;
    matchedEntity?: {
      type: 'invoice' | 'expense';
      id: string;
      number: string;
      amount: number;
      matchConfidence: number;
    };
    splits?: Array<{
      id: string;
      amount: number;
      category: string;
      description: string;
    }>;
    merchantInfo?: {
      name: string;
      location?: string;
      category?: string;
    };
  };
  onMatch?: () => void;
  onIgnore?: () => void;
  onCategorize?: () => void;
  onSplit?: () => void;
}

export function TransactionDetailPanel({
  transaction,
  onMatch,
  onIgnore,
  onCategorize,
  onSplit,
}: TransactionDetailPanelProps) {
  const isDebit = transaction.type === 'debit';
  const confidenceColor =
    (transaction.categoryConfidence || 0) >= 80
      ? 'text-emerald-400'
      : (transaction.categoryConfidence || 0) >= 60
      ? 'text-yellow-400'
      : 'text-red-400';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={transaction.status === 'posted' ? 'default' : 'secondary'}>
            {transaction.status === 'posted' ? 'Posted' : 'Pending'}
          </Badge>
          <Badge variant={isDebit ? 'destructive' : 'default'}>
            {isDebit ? 'Debit' : 'Credit'}
          </Badge>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-white">{transaction.description}</h3>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold ${
                isDebit ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {isDebit ? '-' : '+'}
              {formatCurrency(transaction.amount, transaction.currency)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(transaction.date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Account Information */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Account</h3>
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-zinc-500" />
            <div>
              <p className="text-sm font-medium text-white">{transaction.account.name}</p>
              <p className="text-xs text-zinc-500">
                {transaction.account.type} •••• {transaction.account.lastFour}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Merchant Information */}
      {transaction.merchantInfo && (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Merchant Details
            </h3>
            <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 space-y-2">
              <p className="text-sm font-medium text-white">{transaction.merchantInfo.name}</p>
              {transaction.merchantInfo.location && (
                <p className="text-xs text-zinc-500">{transaction.merchantInfo.location}</p>
              )}
              {transaction.merchantInfo.category && (
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                  {transaction.merchantInfo.category}
                </Badge>
              )}
            </div>
          </div>
          <Separator className="bg-zinc-800" />
        </>
      )}

      {/* Categorization */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
          Categorization
        </h3>
        {transaction.category ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                  <Tag className="h-3 w-3 mr-1" />
                  {transaction.category}
                </Badge>
                {transaction.categoryConfidence && (
                  <span className={`text-xs font-medium ${confidenceColor}`}>
                    {transaction.categoryConfidence}% confidence
                  </span>
                )}
              </div>
              {transaction.categoryConfidence && (
                <Progress
                  value={transaction.categoryConfidence}
                  className="h-1.5 bg-zinc-800"
                />
              )}
            </div>
            {onCategorize && (
              <Button size="sm" variant="outline" onClick={onCategorize} className="w-full">
                <Tag className="h-4 w-4 mr-2" />
                Change Category
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-yellow-950/30 border border-yellow-800/30">
            <p className="text-sm text-yellow-400 mb-3">No category assigned</p>
            {onCategorize && (
              <Button size="sm" variant="outline" onClick={onCategorize} className="w-full">
                <Tag className="h-4 w-4 mr-2" />
                Categorize
              </Button>
            )}
          </div>
        )}
      </div>

      <Separator className="bg-zinc-800" />

      {/* Matched Entity */}
      {transaction.matchedEntity ? (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Matched {transaction.matchedEntity.type === 'invoice' ? 'Invoice' : 'Expense'}
            </h3>
            <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-800/30 space-y-3">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-white font-medium">
                  #{transaction.matchedEntity.number}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Amount</span>
                <span className="text-sm text-white font-medium">
                  {formatCurrency(transaction.matchedEntity.amount, transaction.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Match Confidence</span>
                <span className="text-sm text-emerald-400 font-medium">
                  {transaction.matchedEntity.matchConfidence}%
                </span>
              </div>
              <Progress
                value={transaction.matchedEntity.matchConfidence}
                className="h-1.5 bg-zinc-800"
              />
            </div>
          </div>
          <Separator className="bg-zinc-800" />
        </>
      ) : (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Matching</h3>
            <div className="p-4 rounded-lg bg-yellow-950/30 border border-yellow-800/30">
              <p className="text-sm text-yellow-400 mb-3">Not matched to any invoice or expense</p>
              {onMatch && (
                <Button size="sm" variant="outline" onClick={onMatch} className="w-full">
                  <Link2 className="h-4 w-4 mr-2" />
                  Find Match
                </Button>
              )}
            </div>
          </div>
          <Separator className="bg-zinc-800" />
        </>
      )}

      {/* Split Transactions */}
      {transaction.splits && transaction.splits.length > 0 && (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Split Transactions
            </h3>
            <div className="space-y-2">
              {transaction.splits.map((split) => (
                <div
                  key={split.id}
                  className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{split.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-zinc-700">
                          {split.category}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-sm text-white font-semibold ml-3">
                      {formatCurrency(split.amount, transaction.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Separator className="bg-zinc-800" />
        </>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        {onSplit && !transaction.splits && (
          <Button onClick={onSplit} className="w-full" variant="outline">
            <Split className="h-4 w-4 mr-2" />
            Split
          </Button>
        )}
        {onIgnore && (
          <Button onClick={onIgnore} className="w-full" variant="outline">
            <EyeOff className="h-4 w-4 mr-2" />
            Ignore
          </Button>
        )}
      </div>
    </div>
  );
}
