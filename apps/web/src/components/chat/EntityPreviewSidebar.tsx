'use client';

import * as React from 'react';
import { X, FileText, Receipt, User, Building2, Calendar, DollarSign, ExternalLink, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export type EntityType = 'invoice' | 'expense' | 'client' | 'employee' | 'bill' | 'transaction';

export interface EntityPreviewData {
  id: string;
  type: EntityType;
  title: string;
  subtitle?: string;
  status?: string;
  metadata: Record<string, any>;
  actions?: EntityAction[];
}

export interface EntityAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'destructive';
  icon?: React.ComponentType<{ className?: string }>;
}

interface EntityPreviewSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: EntityPreviewData | null;
  isLoading?: boolean;
}

/**
 * EntityPreviewSidebar - Slide-out sidebar for quick entity previews
 *
 * Features:
 * - Displays entity details without leaving chat
 * - Support for multiple entity types (invoice, expense, client, etc.)
 * - Quick actions for common operations
 * - Link to full entity page
 * - Responsive design
 * - Loading states
 *
 * @example
 * ```tsx
 * const [previewEntity, setPreviewEntity] = useState<EntityPreviewData | null>(null);
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <EntityPreviewSidebar
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   entity={previewEntity}
 * />
 * ```
 */
export function EntityPreviewSidebar({
  open,
  onOpenChange,
  entity,
  isLoading = false,
}: EntityPreviewSidebarProps) {
  const router = useRouter();

  const handleViewFull = () => {
    if (!entity) return;
    const url = getEntityUrl(entity.type, entity.id);
    router.push(url);
    onOpenChange(false);
  };

  // Get icon based on entity type
  const EntityIcon = getEntityIcon(entity?.type);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {isLoading ? (
          <LoadingSkeleton />
        ) : entity ? (
          <>
            <SheetHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      getEntityIconBgColor(entity.type)
                    )}
                  >
                    <EntityIcon
                      className={cn('h-5 w-5', getEntityIconColor(entity.type))}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-base">{entity.title}</SheetTitle>
                    {entity.subtitle && (
                      <SheetDescription className="text-sm">
                        {entity.subtitle}
                      </SheetDescription>
                    )}
                    {entity.status && (
                      <Badge
                        variant={getStatusVariant(entity.status)}
                        className="mt-2"
                      >
                        {entity.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>

            <Separator className="my-4" />

            {/* Entity Details */}
            <div className="space-y-4">
              <EntityDetails entity={entity} />
            </div>

            <Separator className="my-4" />

            {/* Quick Actions */}
            {entity.actions && entity.actions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  {entity.actions.map((action, index) => {
                    const ActionIcon = action.icon;
                    return (
                      <Button
                        key={index}
                        variant={action.variant || 'outline'}
                        onClick={action.onClick}
                        className="justify-start"
                      >
                        {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* View Full Button */}
            <div className="mt-6">
              <Button onClick={handleViewFull} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Details
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No entity selected</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * EntityDetails - Renders entity-specific details
 */
function EntityDetails({ entity }: { entity: EntityPreviewData }) {
  const details = entity.metadata;

  return (
    <Card>
      <CardContent className="pt-6">
        <dl className="space-y-3">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex justify-between items-start gap-4">
              <dt className="text-sm text-muted-foreground capitalize">
                {formatKey(key)}
              </dt>
              <dd className="text-sm font-medium text-right">
                {formatValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

/**
 * LoadingSkeleton - Loading state for sidebar
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
      <Separator />
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

/**
 * Helper functions
 */
function getEntityIcon(type?: EntityType) {
  const icons = {
    invoice: FileText,
    expense: Receipt,
    client: Building2,
    employee: User,
    bill: Receipt,
    transaction: DollarSign,
  };
  return type ? icons[type] : FileText;
}

function getEntityIconColor(type: EntityType) {
  const colors = {
    invoice: 'text-blue-600 dark:text-blue-400',
    expense: 'text-orange-600 dark:text-orange-400',
    client: 'text-green-600 dark:text-green-400',
    employee: 'text-purple-600 dark:text-purple-400',
    bill: 'text-red-600 dark:text-red-400',
    transaction: 'text-indigo-600 dark:text-indigo-400',
  };
  return colors[type];
}

function getEntityIconBgColor(type: EntityType) {
  const colors = {
    invoice: 'bg-blue-100 dark:bg-blue-950',
    expense: 'bg-orange-100 dark:bg-orange-950',
    client: 'bg-green-100 dark:bg-green-950',
    employee: 'bg-purple-100 dark:bg-purple-950',
    bill: 'bg-red-100 dark:bg-red-950',
    transaction: 'bg-indigo-100 dark:bg-indigo-950',
  };
  return colors[type];
}

function getEntityUrl(type: EntityType, id: string): string {
  const routes = {
    invoice: `/finance/invoices/${id}`,
    expense: `/finance/expenses/${id}`,
    client: `/clients/${id}`,
    employee: `/hr/employees/${id}`,
    bill: `/finance/bills/${id}`,
    transaction: `/finance/banking?transaction=${id}`,
  };
  return routes[type];
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('paid') || statusLower.includes('approved') || statusLower.includes('complete')) {
    return 'default';
  }
  if (statusLower.includes('pending') || statusLower.includes('draft')) {
    return 'secondary';
  }
  if (statusLower.includes('overdue') || statusLower.includes('rejected') || statusLower.includes('failed')) {
    return 'destructive';
  }
  return 'outline';
}

function formatKey(key: string): string {
  // Convert camelCase to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    // Check if it looks like a currency amount
    if (Math.abs(value) > 0 && Math.abs(value) < 1000000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
      }).format(value);
    }
    return value.toLocaleString();
  }
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(value).toLocaleDateString();
  }
  return String(value);
}

/**
 * Hook for managing entity preview state
 */
export function useEntityPreview() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [entity, setEntity] = React.useState<EntityPreviewData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const showEntity = React.useCallback((entityData: EntityPreviewData) => {
    setEntity(entityData);
    setIsOpen(true);
  }, []);

  const fetchAndShowEntity = React.useCallback(async (
    type: EntityType,
    id: string,
    fetcher: (type: EntityType, id: string) => Promise<EntityPreviewData>
  ) => {
    setIsLoading(true);
    setIsOpen(true);
    try {
      const data = await fetcher(type, id);
      setEntity(data);
    } catch (error) {
      console.error('Failed to fetch entity:', error);
      setEntity(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const close = React.useCallback(() => {
    setIsOpen(false);
    // Clear entity after close animation
    setTimeout(() => {
      setEntity(null);
      setIsLoading(false);
    }, 300);
  }, []);

  return {
    isOpen,
    entity,
    isLoading,
    showEntity,
    fetchAndShowEntity,
    close,
    props: {
      open: isOpen,
      onOpenChange: setIsOpen,
      entity,
      isLoading,
    },
  };
}
