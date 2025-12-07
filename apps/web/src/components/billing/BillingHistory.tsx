'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Download, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { BillingInvoice, InvoiceStatus } from '@/hooks/use-subscription';

interface BillingHistoryProps {
  invoices: BillingInvoice[];
  isLoading: boolean;
}

const STATUS_CONFIG: Record<InvoiceStatus, { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  PAID: {
    icon: <CheckCircle className="h-3 w-3" />,
    variant: 'secondary',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  PENDING: {
    icon: <Clock className="h-3 w-3" />,
    variant: 'secondary',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
  FAILED: {
    icon: <XCircle className="h-3 w-3" />,
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

export function BillingHistory({ invoices, isLoading }: BillingHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const handleDownloadInvoice = (invoice: BillingInvoice) => {
    if (invoice.pdfUrl) {
      window.open(invoice.pdfUrl, '_blank');
    }
  };

  // Pagination
  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = invoices.slice(startIndex, endIndex);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
        <CardDescription>
          View and download your past invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No invoices yet</h3>
            <p className="text-sm text-muted-foreground">
              Your billing history will appear here
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentInvoices.map((invoice) => {
                    const statusConfig = STATUS_CONFIG[invoice.status];
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{invoice.number}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(invoice.periodStart), 'MMM dd')} -{' '}
                              {format(new Date(invoice.periodEnd), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{format(new Date(invoice.date), 'MMM dd, yyyy')}</p>
                            {invoice.status === 'PENDING' && (
                              <p className="text-xs text-muted-foreground">
                                Due: {format(new Date(invoice.dueDate), 'MMM dd')}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.className}>
                            <span className="flex items-center gap-1">
                              {statusConfig.icon}
                              {invoice.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice.pdfUrl ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadInvoice(invoice)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Not available
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, invoices.length)} of {invoices.length} invoices
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
