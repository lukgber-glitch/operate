'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOverdueInvoices, useUpcomingBills } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface UpcomingItemsProps {
  type: 'invoices' | 'bills';
  title: string;
}

export function UpcomingItems({ type, title }: UpcomingItemsProps) {
  const invoicesQuery = useOverdueInvoices(5);
  const billsQuery = useUpcomingBills(5);

  const { data, isLoading, error } = type === 'invoices' ? invoicesQuery : billsQuery;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Fehler beim Laden der Daten</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              {type === 'invoices' ? 'Keine überfälligen Rechnungen' : 'Keine anstehenden Zahlungen'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const linkHref = type === 'invoices' ? '/finance/invoices' : '/finance/bills';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {type === 'invoices' && 'daysOverdue' in item ? (
                    <span className="text-red-600 dark:text-red-400">
                      {item.daysOverdue} Tage überfällig
                    </span>
                  ) : (
                    <span>
                      Fällig {formatDistanceToNow(new Date(item.dueDate), { addSuffix: true, locale: de })}
                    </span>
                  )}
                </p>
              </div>
              <span className={`font-bold ml-4 ${type === 'invoices' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                €{item.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
        {data.total > data.items.length && (
          <Button variant="ghost" className="w-full mt-4" asChild>
            <Link href={linkHref}>
              Alle anzeigen ({data.total}) →
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
