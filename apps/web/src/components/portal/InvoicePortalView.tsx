'use client';

import { Download, CreditCard, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import { PortalStatusBadge } from './PortalStatusBadge';
import type { PublicInvoice } from '@/hooks/use-public-invoice';
import type { CurrencyCode } from '@/types/currency';

interface InvoicePortalViewProps {
  invoice: PublicInvoice;
  onDownloadPDF: () => void;
  onPayNow: () => void;
  isDownloading?: boolean;
}

export function InvoicePortalView({
  invoice,
  onDownloadPDF,
  onPayNow,
  isDownloading = false,
}: InvoicePortalViewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID';
  const canPay = invoice.amountDue > 0 && invoice.status !== 'CANCELLED' && invoice.status !== 'PAID';

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <Card className="print:shadow-none">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              {invoice.companyInfo.logo && (
                <img
                  src={invoice.companyInfo.logo}
                  alt={invoice.companyInfo.name}
                  className="h-12 object-contain"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {invoice.companyInfo.name}
                </h1>
                {invoice.companyInfo.address && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">
                    {invoice.companyInfo.address}
                  </p>
                )}
                {invoice.companyInfo.taxId && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Tax ID: {invoice.companyInfo.taxId}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right space-y-2">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Invoice Number</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {invoice.number}
                </p>
              </div>
              <PortalStatusBadge status={invoice.status} type="invoice" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Invoice Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Bill To</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">
              {invoice.customerName}
            </p>
            {invoice.customerEmail && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {invoice.customerEmail}
              </p>
            )}
            {invoice.customerAddress && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {invoice.customerAddress.street && <p>{invoice.customerAddress.street}</p>}
                <p>
                  {invoice.customerAddress.city && `${invoice.customerAddress.city}, `}
                  {invoice.customerAddress.postalCode}
                </p>
                <p>{invoice.customerAddress.countryCode}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600 dark:text-slate-400">Issue Date:</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatDate(invoice.issueDate)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-slate-500'}`} />
              <span className="text-slate-600 dark:text-slate-400">Due Date:</span>
              <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                {formatDate(invoice.dueDate)}
                {isOverdue && ' (Overdue)'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600 dark:text-slate-400">Currency:</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {invoice.currency}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card className="print:shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Tax Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay
                      amount={item.unitPrice}
                      currency={invoice.currency as CurrencyCode}
                    />
                  </TableCell>
                  <TableCell className="text-right">{item.taxRate}%</TableCell>
                  <TableCell className="text-right font-medium">
                    <CurrencyDisplay
                      amount={item.amount}
                      currency={invoice.currency as CurrencyCode}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
              <span className="font-medium text-slate-900 dark:text-white">
                <CurrencyDisplay
                  amount={invoice.subtotal}
                  currency={invoice.currency as CurrencyCode}
                />
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Tax</span>
              <span className="font-medium text-slate-900 dark:text-white">
                <CurrencyDisplay
                  amount={invoice.taxAmount}
                  currency={invoice.currency as CurrencyCode}
                />
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span className="text-slate-900 dark:text-white">Total</span>
              <span className="text-slate-900 dark:text-white">
                <CurrencyDisplay
                  amount={invoice.totalAmount}
                  currency={invoice.currency as CurrencyCode}
                />
              </span>
            </div>
            {invoice.amountPaid > 0 && (
              <>
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Amount Paid</span>
                  <span className="font-medium">
                    <CurrencyDisplay
                      amount={invoice.amountPaid}
                      currency={invoice.currency as CurrencyCode}
                    />
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className={invoice.amountDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                    Amount Due
                  </span>
                  <span className={invoice.amountDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                    <CurrencyDisplay
                      amount={invoice.amountDue}
                      currency={invoice.currency as CurrencyCode}
                    />
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">
              {invoice.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        <Button
          variant="outline"
          size="lg"
          onClick={onDownloadPDF}
          disabled={isDownloading}
          className="flex-1"
        >
          <Download className="mr-2 h-5 w-5" />
          {isDownloading ? 'Downloading...' : 'Download PDF'}
        </Button>
        {canPay && (
          <Button
            size="lg"
            onClick={onPayNow}
            className="flex-1"
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Pay Now
          </Button>
        )}
      </div>

      {/* Company Contact Info */}
      <Card className="print:shadow-none bg-slate-50 dark:bg-slate-900/50">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            <p className="font-medium text-slate-900 dark:text-white mb-2">
              Questions about this invoice?
            </p>
            {invoice.companyInfo.email && (
              <p>
                Email: <a href={`mailto:${invoice.companyInfo.email}`} className="text-primary hover:underline">
                  {invoice.companyInfo.email}
                </a>
              </p>
            )}
            {invoice.companyInfo.phone && (
              <p>
                Phone: <a href={`tel:${invoice.companyInfo.phone}`} className="text-primary hover:underline">
                  {invoice.companyInfo.phone}
                </a>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
