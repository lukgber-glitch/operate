'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Sparkles,
  Settings,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  useUnmatchedTransactions,
  useApplyMatch,
  useIgnoreTransaction,
  useAutoReconcile,
  useReconciliationStats,
  type ReconciliationTransaction,
  type SuggestedMatch,
} from '@/hooks/use-reconciliation';

import { IgnoreDialog } from './components/IgnoreDialog';
import { MatchDialog } from './components/MatchDialog';
import { ReconciliationStats } from './components/ReconciliationStats';
import { TransactionList } from './components/TransactionList';

export default function ReconciliationPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [ignoreDialogOpen, setIgnoreDialogOpen] = useState(false);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<ReconciliationTransaction | null>(null);
  const [currentMatch, setCurrentMatch] = useState<SuggestedMatch | null>(null);

  const { transactions, total, isLoading, error, fetchTransactions } = useUnmatchedTransactions({
    status: statusFilter as any,
    pageSize: 50,
  });

  const { stats, isLoading: statsLoading, fetchStats } = useReconciliationStats();
  const { applyMatch, isLoading: applyingMatch } = useApplyMatch();
  const { ignoreTransaction, isLoading: ignoringTransaction } = useIgnoreTransaction();
  const { runAutoReconcile, isLoading: autoReconciling } = useAutoReconcile();

  // Initial load - run once on mount
  useEffect(() => {
    fetchTransactions();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter change - only trigger on statusFilter change
  useEffect(() => {
    fetchTransactions({ status: statusFilter as any });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleToggleTransaction = useCallback((id: string) => {
    setSelectedTransactions((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }, []);

  const handleToggleAll = useCallback(() => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map((t) => t.id));
    }
  }, [selectedTransactions, transactions]);

  const handleIgnoreClick = useCallback((transaction: ReconciliationTransaction) => {
    setCurrentTransaction(transaction);
    setIgnoreDialogOpen(true);
  }, []);

  const handleIgnoreConfirm = useCallback(async (reason: string) => {
    if (!currentTransaction) return;

    try {
      await ignoreTransaction({
        transactionId: currentTransaction.id,
        reason,
      });
      setIgnoreDialogOpen(false);
      setCurrentTransaction(null);
      fetchTransactions();
      fetchStats();
    } catch (error) {
      // Error handled by hook
    }
  }, [currentTransaction, ignoreTransaction, fetchTransactions, fetchStats]);

  const handleApplyMatchClick = useCallback(
    (transaction: ReconciliationTransaction, match: SuggestedMatch) => {
      setCurrentTransaction(transaction);
      setCurrentMatch(match);
      setMatchDialogOpen(true);
    },
    []
  );

  const handleMatchConfirm = useCallback(async () => {
    if (!currentTransaction || !currentMatch) return;

    try {
      await applyMatch({
        transactionId: currentTransaction.id,
        entityType: currentMatch.entityType,
        entityId: currentMatch.entityId,
      });
      setMatchDialogOpen(false);
      setCurrentTransaction(null);
      setCurrentMatch(null);
      fetchTransactions();
      fetchStats();
    } catch (error) {
      // Error handled by hook
    }
  }, [currentTransaction, currentMatch, applyMatch, fetchTransactions, fetchStats]);

  const handleAutoReconcile = useCallback(async () => {
    try {
      await runAutoReconcile({ minConfidence: 85 });
      toast({
        title: 'Auto-Reconcile Completed',
        description: 'High-confidence matches have been applied',
      });
      fetchTransactions();
      fetchStats();
    } catch (error) {
      // Error handled by hook
    }
  }, [runAutoReconcile, fetchTransactions, fetchStats, toast]);

  const handleBulkIgnore = useCallback(async () => {
    if (selectedTransactions.length === 0) return;

    try {
      for (const id of selectedTransactions) {
        await ignoreTransaction({
          transactionId: id,
          reason: 'BULK_IGNORE',
        });
      }
      toast({
        title: 'Success',
        description: `${selectedTransactions.length} transactions ignored`,
      });
      setSelectedTransactions([]);
      fetchTransactions();
      fetchStats();
    } catch (error) {
      // Error handled by hook
    }
  }, [selectedTransactions, ignoreTransaction, fetchTransactions, fetchStats, toast]);

  const unmatchedCount = stats?.unmatched || 0;
  const highConfidenceFilter = statusFilter === 'HIGH_CONFIDENCE';

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'i' && selectedTransactions.length > 0) {
        e.preventDefault();
        handleBulkIgnore();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedTransactions, handleBulkIgnore]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reconciliation</h1>
          <p className="text-white/70">
            Match bank transactions to expenses and invoices
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/finance/reconciliation/rules">
              <Settings className="mr-2 h-4 w-4" />
              Rules
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={handleAutoReconcile}
            disabled={autoReconciling || unmatchedCount === 0}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {autoReconciling ? 'Running...' : 'Auto-Reconcile'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <ReconciliationStats stats={stats} isLoading={statsLoading} />

      {/* Filters and Actions */}
      <GlassCard padding="lg">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={!statusFilter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('')}
                >
                  All
                  {!statusFilter && stats && (
                    <Badge variant="secondary" className="ml-2">
                      {stats.total}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={statusFilter === 'UNMATCHED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('UNMATCHED')}
                >
                  Unmatched
                  {stats && (
                    <Badge variant="secondary" className="ml-2">
                      {stats.unmatched}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={statusFilter === 'MATCHED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('MATCHED')}
                >
                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
                  Matched
                  {stats && (
                    <Badge variant="secondary" className="ml-2">
                      {stats.matched}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={statusFilter === 'IGNORED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('IGNORED')}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  Ignored
                  {stats && (
                    <Badge variant="secondary" className="ml-2">
                      {stats.ignored}
                    </Badge>
                  )}
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchTransactions();
                  fetchStats();
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {selectedTransactions.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg">
                <span className="text-sm text-white/70">
                  {selectedTransactions.length} selected
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkIgnore}
                  disabled={ignoringTransaction}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  Ignore Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedTransactions([])}
                >
                  Clear Selection
                </Button>
                <span className="text-xs text-white/70 ml-auto">
                  Press "I" to ignore selected
                </span>
              </div>
            )}
          </div>
      </GlassCard>

      {/* Transactions List */}
      <GlassCard padding="lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm text-white/70">Loading transactions...</p>
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
                  onClick={() => fetchTransactions()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <TransactionList
              transactions={transactions}
              selectedIds={selectedTransactions}
              onToggleTransaction={handleToggleTransaction}
              onToggleAll={handleToggleAll}
              onIgnore={handleIgnoreClick}
              onApplyMatch={handleApplyMatchClick}
              applyingMatch={applyingMatch}
            />
          )}
      </GlassCard>

      {/* Dialogs */}
      <IgnoreDialog
        open={ignoreDialogOpen}
        onOpenChange={setIgnoreDialogOpen}
        transaction={currentTransaction}
        onConfirm={handleIgnoreConfirm}
        isLoading={ignoringTransaction}
      />

      <MatchDialog
        open={matchDialogOpen}
        onOpenChange={setMatchDialogOpen}
        transaction={currentTransaction}
        match={currentMatch}
        onConfirm={handleMatchConfirm}
        isLoading={applyingMatch}
      />
    </div>
  );
}
