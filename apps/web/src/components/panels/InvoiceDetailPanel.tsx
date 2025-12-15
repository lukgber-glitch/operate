'use client';

import React from 'react';
import { FileText, Download, Send, Copy, Edit, Trash2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';

interface InvoiceDetailPanelProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    issueDate: string;
    dueDate: string;
    paidDate?: string;
    client: {
      name: string;
      email: string;
      address?: string;
    };
    lineItems: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      total: number;
    }>;
    subtotal: number;
    taxTotal: number;
    total: number;
    currency: string;
    payments?: Array<{
      id: string;
      date: string;
      amount: number;
      method: string;
    }>;
    timeline?: Array<{
      id: string;
      event: string;
      timestamp: string;
      user?: string;
    }>;
  };
  onSend?: () => void;
  onDownload?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

const statusConfig = {
  draft: { label: 'Draft', icon: FileText, color: 'bg-zinc-700 text-zinc-200' },
  sent: { label: 'Sent', icon: Send, color: 'bg-blue-600 text-white' },
  paid: { label: 'Paid', icon: CheckCircle2, color: 'bg-emerald-600 text-white' },
  overdue: { label: 'Overdue', icon: AlertCircle, color: 'bg-red-600 text-white' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, color: 'bg-zinc-600 text-zinc-300' },
};

export function InvoiceDetailPanel({
  invoice,
  onSend,
  onDownload,
  onEdit,
  onDuplicate,
  onDelete,
}: InvoiceDetailPanelProps) {
  const status = statusConfig[invoice.status];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge className={status.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
          <span className="text-sm text-zinc-400">#{invoice.invoiceNumber}</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {formatCurrency(invoice.total, invoice.currency)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</span>
            <span>•</span>
            <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
          </div>
          {invoice.paidDate && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Paid on {new Date(invoice.paidDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Client Information */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Client</h3>
        <div className="space-y-1">
          <p className="text-white font-medium">{invoice.client.name}</p>
          <p className="text-sm text-zinc-400">{invoice.client.email}</p>
          {invoice.client.address && (
            <p className="text-sm text-zinc-500">{invoice.client.address}</p>
          )}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Line Items */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Line Items</h3>
        <div className="space-y-2">
          {invoice.lineItems.map((item) => (
            <div key={item.id} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm text-white font-medium">{item.description}</span>
                <span className="text-sm text-white font-semibold">
                  {formatCurrency(item.total, invoice.currency)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span>{item.quantity} × {formatCurrency(item.unitPrice, invoice.currency)}</span>
                {item.taxRate > 0 && <span>•</span>}
                {item.taxRate > 0 && <span>Tax: {item.taxRate}%</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Totals */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Subtotal</span>
          <span className="text-white">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Tax</span>
          <span className="text-white">{formatCurrency(invoice.taxTotal, invoice.currency)}</span>
        </div>
        <Separator className="bg-zinc-800" />
        <div className="flex justify-between text-base font-semibold">
          <span className="text-white">Total</span>
          <span className="text-white">{formatCurrency(invoice.total, invoice.currency)}</span>
        </div>
      </div>

      {/* Payment History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <>
          <Separator className="bg-zinc-800" />
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Payment History
            </h3>
            <div className="space-y-2">
              {invoice.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex justify-between items-center p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/30"
                >
                  <div>
                    <p className="text-sm text-white font-medium">
                      {formatCurrency(payment.amount, invoice.currency)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(payment.date).toLocaleDateString()} • {payment.method}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Timeline */}
      {invoice.timeline && invoice.timeline.length > 0 && (
        <>
          <Separator className="bg-zinc-800" />
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Timeline</h3>
            <div className="space-y-3">
              {invoice.timeline.map((event, index) => (
                <div key={event.id} className="flex gap-3">
                  <div className="relative">
                    <div className="h-2 w-2 rounded-full bg-zinc-600 mt-1.5" />
                    {index < invoice.timeline!.length - 1 && (
                      <div className="absolute top-3 left-1 w-px h-full bg-zinc-800" />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="text-sm text-white">{event.event}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(event.timestamp).toLocaleString()}
                      {event.user && ` • ${event.user}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <Separator className="bg-zinc-800" />
      <div className="grid grid-cols-2 gap-2">
        {onSend && (
          <Button onClick={onSend} className="w-full" variant="default">
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        )}
        {onDownload && (
          <Button onClick={onDownload} className="w-full" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
        {onEdit && (
          <Button onClick={onEdit} className="w-full" variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        {onDuplicate && (
          <Button onClick={onDuplicate} className="w-full" variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
        )}
      </div>
      {onDelete && (
        <Button onClick={onDelete} className="w-full" variant="destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Invoice
        </Button>
      )}
    </div>
  );
}
