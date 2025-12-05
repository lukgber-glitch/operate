'use client';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ReconciliationTransaction, SuggestedMatch } from '@/hooks/use-reconciliation';

import { TransactionRow } from './TransactionRow';

interface TransactionListProps {
  transactions: ReconciliationTransaction[];
  selectedIds: string[];
  onToggleTransaction: (id: string) => void;
  onToggleAll: () => void;
  onIgnore: (transaction: ReconciliationTransaction) => void;
  onApplyMatch: (transaction: ReconciliationTransaction, match: SuggestedMatch) => void;
  applyingMatch: boolean;
}

export function TransactionList({
  transactions,
  selectedIds,
  onToggleTransaction,
  onToggleAll,
  onIgnore,
  onApplyMatch,
  applyingMatch,
}: TransactionListProps) {
  const allSelected = transactions.length > 0 && selectedIds.length === transactions.length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
              />
            </TableHead>
            <TableHead className="w-[30px]" />
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[130px]">Amount</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[140px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <td colSpan={8} className="text-center py-8 text-muted-foreground">
                No transactions found
              </td>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                isSelected={selectedIds.includes(transaction.id)}
                onToggle={onToggleTransaction}
                onIgnore={onIgnore}
                onApplyMatch={onApplyMatch}
                applyingMatch={applyingMatch}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
