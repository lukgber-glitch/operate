'use client';

import React, { useState } from 'react';
import { Receipt, Edit, Trash2, Split, Tag, Link2, ZoomIn, RotateCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ExpenseDetailPanelProps {
  expense: {
    id: string;
    vendor: string;
    amount: number;
    currency: string;
    date: string;
    category: string;
    description?: string;
    status: 'pending' | 'approved' | 'rejected';
    taxDeductible: boolean;
    taxAmount?: number;
    receipt?: {
      url: string;
      fileName: string;
    };
    linkedTransaction?: {
      id: string;
      description: string;
      date: string;
    };
    tags?: string[];
    notes?: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onSplit?: () => void;
  onRecategorize?: () => void;
  onToggleTaxDeductible?: () => void;
}

export function ExpenseDetailPanel({
  expense,
  onEdit,
  onDelete,
  onSplit,
  onRecategorize,
  onToggleTaxDeductible,
}: ExpenseDetailPanelProps) {
  const [receiptZoom, setReceiptZoom] = useState(false);
  const [receiptRotation, setReceiptRotation] = useState(0);

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-600 text-white' },
    approved: { label: 'Approved', color: 'bg-emerald-600 text-white' },
    rejected: { label: 'Rejected', color: 'bg-red-600 text-white' },
  };

  const status = statusConfig[expense.status];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge className={status.color}>{status.label}</Badge>
          {expense.taxDeductible && (
            <Badge variant="outline" className="border-emerald-600 text-emerald-400">
              <Check className="h-3 w-3 mr-1" />
              Tax Deductible
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-white">{expense.vendor}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {formatCurrency(expense.amount, expense.currency)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span>{new Date(expense.date).toLocaleDateString()}</span>
            <span>•</span>
            <span>{expense.category}</span>
          </div>
        </div>

        {expense.description && (
          <p className="text-sm text-zinc-400">{expense.description}</p>
        )}
      </div>

      <Separator className="bg-zinc-800" />

      {/* Receipt Image Viewer */}
      {expense.receipt && (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
                Receipt
              </h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReceiptRotation((prev) => (prev + 90) % 360)}
                  className="text-zinc-400 hover:text-white"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReceiptZoom(!receiptZoom)}
                  className="text-zinc-400 hover:text-white"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div
              className={cn(
                'relative rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900',
                receiptZoom ? 'h-96' : 'h-48'
              )}
            >
              <img
                src={expense.receipt.url}
                alt="Receipt"
                className="w-full h-full object-contain"
                style={{ transform: `rotate(${receiptRotation}deg)` }}
              />
            </div>
            <p className="text-xs text-zinc-500">{expense.receipt.fileName}</p>
          </div>
          <Separator className="bg-zinc-800" />
        </>
      )}

      {/* Tax Information */}
      {expense.taxDeductible && (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Tax Information
            </h3>
            <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-800/30 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Tax Deductible</span>
              </div>
              {expense.taxAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Tax Amount</span>
                  <span className="text-white font-medium">
                    {formatCurrency(expense.taxAmount, expense.currency)}
                  </span>
                </div>
              )}
              {onToggleTaxDeductible && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onToggleTaxDeductible}
                  className="w-full mt-2 text-xs"
                >
                  Mark as Non-Deductible
                </Button>
              )}
            </div>
          </div>
          <Separator className="bg-zinc-800" />
        </>
      )}

      {/* Linked Transaction */}
      {expense.linkedTransaction && (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Linked Transaction
            </h3>
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-white font-medium">
                  {expense.linkedTransaction.description}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                {new Date(expense.linkedTransaction.date).toLocaleDateString()}
              </p>
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-zinc-700 text-zinc-300">
            <Tag className="h-3 w-3 mr-1" />
            {expense.category}
          </Badge>
          {expense.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="border-zinc-700 text-zinc-400">
              {tag}
            </Badge>
          ))}
        </div>
        {onRecategorize && (
          <Button size="sm" variant="outline" onClick={onRecategorize} className="w-full">
            <Tag className="h-4 w-4 mr-2" />
            Recategorize
          </Button>
        )}
      </div>

      {/* Notes */}
      {expense.notes && (
        <>
          <Separator className="bg-zinc-800" />
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Notes</h3>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{expense.notes}</p>
          </div>
        </>
      )}

      {/* Actions */}
      <Separator className="bg-zinc-800" />
      <div className="grid grid-cols-2 gap-2">
        {onEdit && (
          <Button onClick={onEdit} className="w-full" variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        {onSplit && (
          <Button onClick={onSplit} className="w-full" variant="outline">
            <Split className="h-4 w-4 mr-2" />
            Split
          </Button>
        )}
      </div>
      {onDelete && (
        <Button onClick={onDelete} className="w-full" variant="destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Expense
        </Button>
      )}
    </div>
  );
}
