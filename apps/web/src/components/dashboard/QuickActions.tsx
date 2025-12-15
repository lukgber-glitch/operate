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
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  color: string;
  action?: () => Promise<void>;
  comingSoon?: boolean;
}

export function QuickActions() {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Action handlers
  const handleExportData = async () => {
    setLoadingAction('export');
    try {
      // Navigate to exports/settings page
      router.push('/settings/exports');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleViewTransactions = async () => {
    setLoadingAction('transactions');
    try {
      // Navigate to banking page where transactions are shown
      router.push('/finance/banking');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load transactions.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleViewReports = async () => {
    setLoadingAction('reports');
    try {
      router.push('/reports');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load reports.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSendPayment = async () => {
    setLoadingAction('payment');
    try {
      // Navigate to banking page where payment functionality will be available
      router.push('/finance/banking');
      toast({
        title: 'Payment Feature',
        description: 'Bank payment integration is being configured. You can view your connected accounts.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to navigate to payments.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const actions: QuickAction[] = [
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
      color: 'text-orange-400',
    },
    {
      icon: TrendingUp,
      label: 'Transaktionen',
      action: handleViewTransactions,
      color: 'text-green-400',
    },
    {
      icon: FileSpreadsheet,
      label: 'Bericht erstellen',
      action: handleViewReports,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: Send,
      label: 'Zahlungen senden',
      action: handleSendPayment,
      color: 'text-pink-600 dark:text-pink-400',
    },
    {
      icon: Download,
      label: 'Daten exportieren',
      action: handleExportData,
      color: 'text-indigo-600 dark:text-indigo-400',
    },
  ];

  const handleActionClick = async (action: QuickAction) => {
    if (action.comingSoon) {
      toast({
        title: 'Coming Soon',
        description: 'This feature is coming soon!',
      });
      return;
    }

    if (action.action) {
      await action.action();
    }
  };

  return (
    <Card className="rounded-[24px] bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-lg">Schnellaktionen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            const isLoading = loadingAction === action.label;
            const isDisabled = action.comingSoon || isLoading;

            // If action has href, use Link
            if (action.href && !action.action) {
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
            }

            // If action has custom handler
            return (
              <Button
                key={action.label}
                variant="outline"
                className="justify-start h-auto py-3 px-3"
                onClick={() => handleActionClick(action)}
                disabled={isDisabled}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Icon className={`h-4 w-4 mr-2 ${action.color}`} />
                )}
                <span className="text-xs">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
