'use client';

import React from 'react';
import { Mail, Phone, MapPin, Edit, FileText, DollarSign, Clock, TrendingUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';

interface ClientDetailPanelProps {
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    type: 'customer' | 'vendor';
    status: 'active' | 'inactive';
    financialSummary: {
      totalRevenue: number;
      outstanding: number;
      avgPaymentTime: number;
      currency: string;
    };
    recentInvoices?: Array<{
      id: string;
      invoiceNumber: string;
      amount: number;
      status: 'draft' | 'sent' | 'paid' | 'overdue';
      date: string;
    }>;
    recentPayments?: Array<{
      id: string;
      amount: number;
      date: string;
      method: string;
    }>;
    communications?: Array<{
      id: string;
      type: 'email' | 'call' | 'meeting';
      subject: string;
      date: string;
    }>;
  };
  onEdit?: () => void;
  onCreateInvoice?: () => void;
  onSendEmail?: () => void;
}

export function ClientDetailPanel({
  client,
  onEdit,
  onCreateInvoice,
  onSendEmail,
}: ClientDetailPanelProps) {
  const invoiceStatusColors = {
    draft: 'bg-zinc-700 text-zinc-200',
    sent: 'bg-blue-600 text-white',
    paid: 'bg-emerald-600 text-white',
    overdue: 'bg-red-600 text-white',
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
            {client.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline" className="border-zinc-700 text-zinc-300">
            {client.type === 'customer' ? 'Customer' : 'Vendor'}
          </Badge>
        </div>

        <h3 className="text-2xl font-bold text-white">{client.name}</h3>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Contact Information */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
          Contact Information
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-zinc-500 flex-shrink-0" />
            <a
              href={`mailto:${client.email}`}
              className="text-sm text-blue-400 hover:underline"
            >
              {client.email}
            </a>
          </div>
          {client.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-zinc-500 flex-shrink-0" />
              <a
                href={`tel:${client.phone}`}
                className="text-sm text-blue-400 hover:underline"
              >
                {client.phone}
              </a>
            </div>
          )}
          {client.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-300">{client.address}</p>
            </div>
          )}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Financial Summary */}
      {client.type === 'customer' && (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Financial Summary
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">
                    Total Revenue
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(
                    client.financialSummary.totalRevenue,
                    client.financialSummary.currency
                  )}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">
                    Outstanding
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(
                    client.financialSummary.outstanding,
                    client.financialSummary.currency
                  )}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">
                    Avg Payment Time
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {client.financialSummary.avgPaymentTime} days
                </p>
              </div>
            </div>
          </div>
          <Separator className="bg-zinc-800" />
        </>
      )}

      {/* Recent Invoices */}
      {client.recentInvoices && client.recentInvoices.length > 0 && (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Recent Invoices
            </h3>
            <div className="space-y-2">
              {client.recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">
                        #{invoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(invoice.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={invoiceStatusColors[invoice.status]}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="text-base font-semibold text-white">
                    {formatCurrency(invoice.amount, client.financialSummary.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <Separator className="bg-zinc-800" />
        </>
      )}

      {/* Recent Payments */}
      {client.recentPayments && client.recentPayments.length > 0 && (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Recent Payments
            </h3>
            <div className="space-y-2">
              {client.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex justify-between items-center p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/30"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {formatCurrency(payment.amount, client.financialSummary.currency)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(payment.date).toLocaleDateString()} • {payment.method}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Separator className="bg-zinc-800" />
        </>
      )}

      {/* Communication History */}
      {client.communications && client.communications.length > 0 && (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Communication History
            </h3>
            <div className="space-y-3">
              {client.communications.map((comm, index) => (
                <div key={comm.id} className="flex gap-3">
                  <div className="relative">
                    <div className="h-2 w-2 rounded-full bg-zinc-600 mt-1.5" />
                    {index < client.communications!.length - 1 && (
                      <div className="absolute top-3 left-1 w-px h-full bg-zinc-800" />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs border-zinc-700">
                        {comm.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-white">{comm.subject}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(comm.date).toLocaleDateString()}
                    </p>
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
        {onEdit && (
          <Button onClick={onEdit} className="w-full" variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        {onSendEmail && (
          <Button onClick={onSendEmail} className="w-full" variant="outline">
            <Send className="h-4 w-4 mr-2" />
            Email
          </Button>
        )}
      </div>
      {onCreateInvoice && client.type === 'customer' && (
        <Button onClick={onCreateInvoice} className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      )}
    </div>
  );
}
