'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Receipt,
  TrendingUp,
  FileSpreadsheet,
  Send,
  Download,
} from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  const actions = [
    {
      icon: FileText,
      label: 'Rechnung erstellen',
      href: '/finance/invoices/new',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Receipt,
      label: 'Ausgabe erfassen',
      href: '/finance/expenses/new',
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      icon: TrendingUp,
      label: 'Transaktionen',
      href: '/finance/transactions',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      icon: FileSpreadsheet,
      label: 'Bericht erstellen',
      href: '/finance/reports',
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: Send,
      label: 'Zahlungen senden',
      href: '/finance/payments',
      color: 'text-pink-600 dark:text-pink-400',
    },
    {
      icon: Download,
      label: 'Daten exportieren',
      href: '/finance/exports',
      color: 'text-indigo-600 dark:text-indigo-400',
    },
  ];

  return (
    <Card className="rounded-[24px]">
      <CardHeader>
        <CardTitle className="text-lg">Schnellaktionen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                className="justify-start h-auto py-3 px-3"
                asChild
              >
                <Link href={action.href}>
                  <Icon className={`h-4 w-4 mr-2 ${action.color}`} />
                  <span className="text-xs">{action.label}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
