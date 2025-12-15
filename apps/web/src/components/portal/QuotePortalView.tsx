'use client';

import { Download, Check, X, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import { PortalStatusBadge } from './PortalStatusBadge';
import type { PublicQuote } from '@/hooks/use-public-quote';
import type { CurrencyCode } from '@/types/currency';

interface QuotePortalViewProps {
  quote: PublicQuote;
  onDownloadPDF: () => void;
  onAccept: () => void;
  onReject: () => void;
  isDownloading?: boolean;
  isProcessing?: boolean;
}

export function QuotePortalView({
  quote,
  onDownloadPDF,
  onAccept,
  onReject,
  isDownloading = false,
  isProcessing = false,
}: QuotePortalViewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isExpired = new Date(quote.validUntil) < new Date();
  const canRespond = quote.status === 'SENT' || quote.status === 'VIEWED';
  const daysUntilExpiry = Math.ceil(
    (new Date(quote.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <Card className="print:shadow-none">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              {quote.companyInfo.logo && (
                <img
                  src={quote.companyInfo.logo}
                  alt={quote.companyInfo.name}
                  className="h-12 object-contain"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {quote.companyInfo.name}
                </h1>
                {quote.companyInfo.address && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">
                    {quote.companyInfo.address}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right space-y-2">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Quote Number</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {quote.number}
                </p>
              </div>
              <PortalStatusBadge status={quote.status} type="quote" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Expiry Warning */}
      {!isExpired && canRespond && daysUntilExpiry <= 7 && (
        <Alert className="print:hidden">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This quote will expire in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}.
            Please review and respond soon.
          </AlertDescription>
        </Alert>
      )}

      {isExpired && (
        <Alert variant="destructive" className="print:hidden">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This quote has expired. Please contact us for an updated quote.
          </AlertDescription>
        </Alert>
      )}

      {/* Quote Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Quote For</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">
              {quote.customerName}
            </p>
            {quote.customerEmail && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {quote.customerEmail}
              </p>
            )}
            {quote.customerAddress && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {quote.customerAddress.street && <p>{quote.customerAddress.street}</p>}
                <p>
                  {quote.customerAddress.city && `${quote.customerAddress.city}, `}
                  {quote.customerAddress.postalCode}
                </p>
                <p>{quote.customerAddress.countryCode}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Quote Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600 dark:text-slate-400">Issue Date:</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatDate(quote.issueDate)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className={`h-4 w-4 ${isExpired ? 'text-red-500' : 'text-slate-500'}`} />
              <span className="text-slate-600 dark:text-slate-400">Valid Until:</span>
              <span className={`font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                {formatDate(quote.validUntil)}
                {isExpired && ' (Expired)'}
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
              {quote.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay
                      amount={item.unitPrice}
                      currency={quote.currency as CurrencyCode}
                    />
                  </TableCell>
                  <TableCell className="text-right">{item.taxRate}%</TableCell>
                  <TableCell className="text-right font-medium">
                    <CurrencyDisplay
                      amount={item.amount}
                      currency={quote.currency as CurrencyCode}
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
                  amount={quote.subtotal}
                  currency={quote.currency as CurrencyCode}
                />
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Tax</span>
              <span className="font-medium text-slate-900 dark:text-white">
                <CurrencyDisplay
                  amount={quote.taxAmount}
                  currency={quote.currency as CurrencyCode}
                />
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span className="text-slate-900 dark:text-white">Total</span>
              <span className="text-slate-900 dark:text-white">
                <CurrencyDisplay
                  amount={quote.totalAmount}
                  currency={quote.currency as CurrencyCode}
                />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {quote.notes && (
        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">
              {quote.notes}
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
          disabled={isDownloading || isProcessing}
          className="flex-1"
        >
          <Download className="mr-2 h-5 w-5" />
          {isDownloading ? 'Downloading...' : 'Download PDF'}
        </Button>
        {canRespond && !isExpired && (
          <>
            <Button
              variant="outline"
              size="lg"
              onClick={onReject}
              disabled={isProcessing}
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              <X className="mr-2 h-5 w-5" />
              Decline
            </Button>
            <Button
              size="lg"
              onClick={onAccept}
              disabled={isProcessing}
              className="flex-1"
            >
              <Check className="mr-2 h-5 w-5" />
              {isProcessing ? 'Processing...' : 'Accept Quote'}
            </Button>
          </>
        )}
      </div>

      {/* Company Contact Info */}
      <Card className="print:shadow-none bg-slate-50 dark:bg-slate-900/50">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            <p className="font-medium text-slate-900 dark:text-white mb-2">
              Questions about this quote?
            </p>
            {quote.companyInfo.email && (
              <p>
                Email:{' '}
                <a
                  href={`mailto:${quote.companyInfo.email}`}
                  className="text-primary hover:underline"
                >
                  {quote.companyInfo.email}
                </a>
              </p>
            )}
            {quote.companyInfo.phone && (
              <p>
                Phone:{' '}
                <a
                  href={`tel:${quote.companyInfo.phone}`}
                  className="text-primary hover:underline"
                >
                  {quote.companyInfo.phone}
                </a>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
