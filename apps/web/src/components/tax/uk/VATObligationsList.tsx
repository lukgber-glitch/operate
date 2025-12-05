'use client';

import { useVATObligations } from '@/hooks/useHMRC';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Calendar, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

interface VATObligationsListProps {
  onSelectObligation?: (periodKey: string) => void;
}

export function VATObligationsList({ onSelectObligation }: VATObligationsListProps) {
  const { obligations, isLoading, error, refetch } = useVATObligations();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>VAT Obligations</CardTitle>
          <CardDescription>Your VAT return periods from HMRC</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Failed to load VAT obligations. Please try again.
          </p>
          <div className="flex justify-center">
            <Button variant="outline" onClick={refetch}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const openObligations = obligations.filter(o => o.status === 'O');
  const fulfilledObligations = obligations.filter(o => o.status === 'F');

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Open Obligations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Open VAT Returns</CardTitle>
              <CardDescription>Returns that need to be filed</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {openObligations.length} open
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {openObligations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-muted-foreground">No open VAT returns</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openObligations.map((obligation) => (
                <div
                  key={obligation.periodKey}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${isOverdue(obligation.due) ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                      <Calendar className={`h-5 w-5 ${isOverdue(obligation.due) ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{obligation.periodKey}</h4>
                        {isOverdue(obligation.due) && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Period: {formatDate(obligation.start)} - {formatDate(obligation.end)}</p>
                        <p className={isOverdue(obligation.due) ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                          Due: {formatDate(obligation.due)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {onSelectObligation ? (
                      <Button
                        size="sm"
                        onClick={() => onSelectObligation(obligation.periodKey)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        File Return
                      </Button>
                    ) : (
                      <Link href={`/tax/vat/uk/${obligation.periodKey}`}>
                        <Button size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          File Return
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fulfilled Obligations */}
      {fulfilledObligations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fulfilled VAT Returns</CardTitle>
                <CardDescription>Previously submitted returns</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {fulfilledObligations.length} fulfilled
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period Key</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fulfilledObligations.map((obligation) => (
                  <TableRow key={obligation.periodKey}>
                    <TableCell className="font-medium">{obligation.periodKey}</TableCell>
                    <TableCell>
                      {formatDate(obligation.start)} - {formatDate(obligation.end)}
                    </TableCell>
                    <TableCell>{formatDate(obligation.due)}</TableCell>
                    <TableCell>
                      {obligation.received ? formatDate(obligation.received) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Fulfilled
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
