/**
 * ActionResultCard Component
 * Displays the result of an executed action with optional link to created entity
 */

'use client';

import { ActionResult } from '@/types/chat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ExternalLink, FileText, Receipt, Mail, Download, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface ActionResultCardProps {
  result: ActionResult;
}

/**
 * Get the appropriate icon for entity type
 */
function getEntityIcon(entityType?: string) {
  const icons: Record<string, any> = {
    invoice: Receipt,
    expense: Receipt,
    report: FileText,
    email: Mail,
    export: Download,
    task: Calendar,
  };
  return icons[entityType || ''] || FileText;
}

/**
 * Get the route path for viewing an entity
 */
function getEntityRoute(entityType?: string, entityId?: string): string | null {
  if (!entityType || !entityId) {
    return null;
  }

  const routes: Record<string, string> = {
    invoice: `/invoices/${entityId}`,
    expense: `/expenses/${entityId}`,
    report: `/reports/${entityId}`,
    task: `/tasks/${entityId}`,
  };

  return routes[entityType] || null;
}

/**
 * Get human-readable entity type label
 */
function getEntityTypeLabel(entityType?: string): string {
  if (!entityType) {
    return 'Item';
  }

  const labels: Record<string, string> = {
    invoice: 'Invoice',
    expense: 'Expense',
    report: 'Report',
    email: 'Email',
    export: 'Export',
    task: 'Task',
  };

  return labels[entityType] || entityType;
}

export function ActionResultCard({ result }: ActionResultCardProps) {
  const Icon = getEntityIcon(result.entityType);
  const entityRoute = getEntityRoute(result.entityType, result.entityId);
  const entityLabel = getEntityTypeLabel(result.entityType);

  return (
    <Card className={result.success ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900'}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">
                {result.success ? 'Action Completed' : 'Action Failed'}
              </CardTitle>
              <CardDescription className="mt-1">{result.message}</CardDescription>
            </div>
          </div>
          <Badge variant={result.success ? 'default' : 'destructive'} className="shrink-0">
            {result.success ? 'Success' : 'Error'}
          </Badge>
        </div>
      </CardHeader>

      {/* Entity details and link */}
      {result.success && result.entityId && (
        <CardContent className="pt-0">
          <div className="flex items-center justify-between gap-3 p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entityLabel} Created</p>
                {result.data?.invoiceNumber && (
                  <p className="text-xs text-muted-foreground">
                    {result.data.invoiceNumber}
                  </p>
                )}
                {result.data?.amount && (
                  <p className="text-xs text-muted-foreground">
                    Amount: {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: result.data.currency || 'USD',
                    }).format(result.data.amount)}
                  </p>
                )}
              </div>
            </div>
            {entityRoute && (
              <Link href={entityRoute}>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  View
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>

          {/* Additional data if present */}
          {result.data && Object.keys(result.data).length > 0 && (
            <div className="mt-3 text-xs text-muted-foreground">
              <details className="cursor-pointer">
                <summary className="font-medium hover:text-foreground transition-colors">
                  View Details
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      )}

      {/* Error details */}
      {!result.success && result.error && result.error !== result.message && (
        <CardContent className="pt-0">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md">
            <p className="text-xs text-red-900 dark:text-red-100 font-mono">{result.error}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
