/**
 * EntityPreview Component
 * Shows a preview panel when entities are mentioned in chat
 * Displays invoice, bill, transaction, or client details inline
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Receipt,
  CreditCard,
  Users,
  ExternalLink,
  Eye,
  Download,
  Send,
  Calendar,
  DollarSign,
  Building2,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

/**
 * Supported entity types
 */
export type EntityType = 'invoice' | 'bill' | 'transaction' | 'client' | 'vendor';

/**
 * Base entity interface
 */
interface BaseEntity {
  id: string;
  type: EntityType;
}

/**
 * Invoice entity
 */
interface InvoiceEntity extends BaseEntity {
  type: 'invoice';
  number: string;
  customerName: string;
  customerId?: string;
  amount: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  issueDate: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

/**
 * Bill entity
 */
interface BillEntity extends BaseEntity {
  type: 'bill';
  number: string;
  vendorName: string;
  vendorId?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'OVERDUE' | 'REJECTED';
  dueDate: string;
  receivedDate: string;
  category?: string;
}

/**
 * Transaction entity
 */
interface TransactionEntity extends BaseEntity {
  type: 'transaction';
  description: string;
  amount: number;
  currency: string;
  date: string;
  type_detail: 'DEBIT' | 'CREDIT';
  category?: string;
  merchant?: string;
  accountName?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

/**
 * Client entity
 */
interface ClientEntity extends BaseEntity {
  type: 'client';
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalInvoiced?: number;
  totalPaid?: number;
  outstandingBalance?: number;
  currency?: string;
  invoiceCount?: number;
}

/**
 * Vendor entity
 */
interface VendorEntity extends BaseEntity {
  type: 'vendor';
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalBilled?: number;
  totalPaid?: number;
  outstandingBalance?: number;
  currency?: string;
  billCount?: number;
}

/**
 * Union type of all entities
 */
export type Entity = InvoiceEntity | BillEntity | TransactionEntity | ClientEntity | VendorEntity;

/**
 * Props for EntityPreview
 */
export interface EntityPreviewProps {
  /**
   * Whether the preview is open
   */
  open: boolean;

  /**
   * Callback when preview state changes
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Entity type
   */
  entityType: EntityType;

  /**
   * Entity ID to fetch and display
   */
  entityId: string;

  /**
   * Optional pre-loaded entity data
   */
  entity?: Entity;

  /**
   * Organization ID for API calls
   */
  orgId?: string;
}

/**
 * EntityPreview - Slide-out panel showing entity details
 *
 * Features:
 * - Displays invoice, bill, transaction, or client/vendor details
 * - Fetches data from API if not provided
 * - Shows loading skeleton while fetching
 * - Quick actions (view, download, send, etc.)
 * - Deep links to full entity page
 *
 * @example
 * ```tsx
 * <EntityPreview
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   entityType="invoice"
 *   entityId="inv_123"
 *   orgId="org_abc"
 * />
 * ```
 */
export function EntityPreview({
  open,
  onOpenChange,
  entityType,
  entityId,
  entity: providedEntity,
  orgId,
}: EntityPreviewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [entity, setEntity] = useState<Entity | null>(providedEntity || null);
  const [isLoading, setIsLoading] = useState(!providedEntity);
  const [error, setError] = useState<string | null>(null);

  // Fetch entity data when opened
  useEffect(() => {
    if (!open || providedEntity) return;

    const fetchEntity = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Construct API endpoint based on entity type
        const endpoint = getEntityEndpoint(entityType, entityId, orgId);
        const response = await fetch(endpoint, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${entityType}`);
        }

        const data = await response.json();
        setEntity(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load entity';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntity();
  }, [open, entityType, entityId, orgId, providedEntity, toast]);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      if (!providedEntity) {
        setEntity(null);
        setIsLoading(true);
      }
      setError(null);
    }
  }, [open, providedEntity]);

  // Handle view full details
  const handleViewFull = () => {
    const url = getEntityUrl(entityType, entityId, orgId);
    router.push(url);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {getEntityIcon(entityType)}
            <SheetTitle>{getEntityTitle(entityType)}</SheetTitle>
          </div>
          <SheetDescription>
            {isLoading ? 'Loading details...' : entity ? getEntityDescription(entity) : 'Entity details'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Loading state */}
          {isLoading && <EntityPreviewSkeleton />}

          {/* Error state */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-900 dark:text-red-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <p className="font-medium">Failed to load {entityType}</p>
              </div>
              <p className="mt-1 text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Entity content */}
          {!isLoading && !error && entity && (
            <>
              {entity.type === 'invoice' && <InvoicePreviewContent invoice={entity} />}
              {entity.type === 'bill' && <BillPreviewContent bill={entity} />}
              {entity.type === 'transaction' && <TransactionPreviewContent transaction={entity} />}
              {entity.type === 'client' && <ClientPreviewContent client={entity} />}
              {entity.type === 'vendor' && <VendorPreviewContent vendor={entity} />}

              {/* Quick actions */}
              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button onClick={handleViewFull} className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Full Details
                </Button>
                {(entity.type === 'invoice' || entity.type === 'bill') && (
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Invoice preview content
 */
function InvoicePreviewContent({ invoice }: { invoice: InvoiceEntity }) {
  const statusConfig = getInvoiceStatusConfig(invoice.status);
  const daysInfo = getDaysInfo(invoice.dueDate);

  return (
    <div className="space-y-4">
      {/* Header with status */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">{invoice.number}</h3>
          <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
        </div>
        <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
      </div>

      {/* Amount */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
        <p className="text-3xl font-bold">
          {formatCurrency(invoice.amount, invoice.currency)}
        </p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Issue Date
          </p>
          <p className="font-medium">{formatDate(invoice.issueDate)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Due Date
          </p>
          <p className="font-medium flex items-center gap-1.5">
            {formatDate(invoice.dueDate)}
            {daysInfo.isOverdue && invoice.status !== 'PAID' && (
              <AlertCircle className="h-3.5 w-3.5 text-red-600" />
            )}
          </p>
        </div>
      </div>

      {/* Due date warning */}
      {!['PAID', 'CANCELLED'].includes(invoice.status) && (
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
            daysInfo.isOverdue
              ? 'bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100 border border-red-200'
              : 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 border border-blue-200'
          )}
        >
          <Calendar className="h-4 w-4" />
          <span className="font-medium">{daysInfo.label}</span>
        </div>
      )}

      {/* Line items */}
      {invoice.lineItems && invoice.lineItems.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold mb-3">Line Items</h4>
            <div className="space-y-2">
              {invoice.lineItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.quantity} × {formatCurrency(item.rate, invoice.currency)}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.amount, invoice.currency)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Bill preview content
 */
function BillPreviewContent({ bill }: { bill: BillEntity }) {
  const statusConfig = getBillStatusConfig(bill.status);
  const daysInfo = getDaysInfo(bill.dueDate);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">{bill.number}</h3>
          <p className="text-sm text-muted-foreground">{bill.vendorName}</p>
        </div>
        <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
        <p className="text-3xl font-bold">
          {formatCurrency(bill.amount, bill.currency)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Received</p>
          <p className="font-medium">{formatDate(bill.receivedDate)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Due Date</p>
          <p className="font-medium">{formatDate(bill.dueDate)}</p>
        </div>
      </div>

      {bill.category && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Category</p>
          <Badge variant="outline">{bill.category}</Badge>
        </div>
      )}
    </div>
  );
}

/**
 * Transaction preview content
 */
function TransactionPreviewContent({ transaction }: { transaction: TransactionEntity }) {
  const isDebit = transaction.type_detail === 'DEBIT';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{transaction.description}</h3>
          {transaction.merchant && (
            <p className="text-sm text-muted-foreground">{transaction.merchant}</p>
          )}
        </div>
        <Badge variant={isDebit ? 'destructive' : 'default'}>
          {isDebit ? 'Debit' : 'Credit'}
        </Badge>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground mb-1">Amount</p>
        <p className={cn('text-3xl font-bold', isDebit ? 'text-red-600' : 'text-green-600')}>
          {isDebit ? '-' : '+'}
          {formatCurrency(transaction.amount, transaction.currency)}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Date</p>
          <p className="font-medium">{formatDate(transaction.date)}</p>
        </div>
        {transaction.accountName && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Account</p>
            <p className="font-medium">{transaction.accountName}</p>
          </div>
        )}
        {transaction.category && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Category</p>
            <Badge variant="outline">{transaction.category}</Badge>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Client preview content
 */
function ClientPreviewContent({ client }: { client: ClientEntity }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold">{client.name}</h3>
        <p className="text-sm text-muted-foreground">Client</p>
      </div>

      {/* Contact info */}
      <div className="space-y-2">
        {client.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${client.email}`} className="hover:underline">
              {client.email}
            </a>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${client.phone}`} className="hover:underline">
              {client.phone}
            </a>
          </div>
        )}
        {client.address && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{client.address}</span>
          </div>
        )}
      </div>

      {/* Financial summary */}
      {client.totalInvoiced !== undefined && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Financial Summary</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Invoiced</p>
                <p className="text-lg font-bold">
                  {formatCurrency(client.totalInvoiced, client.currency || 'USD')}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(client.totalPaid || 0, client.currency || 'USD')}
                </p>
              </div>
            </div>
            {client.outstandingBalance !== undefined && client.outstandingBalance > 0 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-3">
                <p className="text-xs text-muted-foreground mb-1">Outstanding Balance</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(client.outstandingBalance, client.currency || 'USD')}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Vendor preview content
 */
function VendorPreviewContent({ vendor }: { vendor: VendorEntity }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold">{vendor.name}</h3>
        <p className="text-sm text-muted-foreground">Vendor</p>
      </div>

      <div className="space-y-2">
        {vendor.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${vendor.email}`} className="hover:underline">
              {vendor.email}
            </a>
          </div>
        )}
        {vendor.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${vendor.phone}`} className="hover:underline">
              {vendor.phone}
            </a>
          </div>
        )}
        {vendor.address && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{vendor.address}</span>
          </div>
        )}
      </div>

      {vendor.totalBilled !== undefined && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Financial Summary</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Billed</p>
                <p className="text-lg font-bold">
                  {formatCurrency(vendor.totalBilled, vendor.currency || 'USD')}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(vendor.totalPaid || 0, vendor.currency || 'USD')}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Loading skeleton
 */
function EntityPreviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

/**
 * Helper functions
 */

function getEntityIcon(type: EntityType) {
  const iconMap: Record<EntityType, React.ReactNode> = {
    invoice: <FileText className="h-5 w-5" />,
    bill: <Receipt className="h-5 w-5" />,
    transaction: <CreditCard className="h-5 w-5" />,
    client: <Users className="h-5 w-5" />,
    vendor: <Building2 className="h-5 w-5" />,
  };
  return iconMap[type];
}

function getEntityTitle(type: EntityType): string {
  const titleMap: Record<EntityType, string> = {
    invoice: 'Invoice Details',
    bill: 'Bill Details',
    transaction: 'Transaction Details',
    client: 'Client Details',
    vendor: 'Vendor Details',
  };
  return titleMap[type];
}

function getEntityDescription(entity: Entity): string {
  switch (entity.type) {
    case 'invoice':
      return `Invoice ${entity.number} for ${entity.customerName}`;
    case 'bill':
      return `Bill ${entity.number} from ${entity.vendorName}`;
    case 'transaction':
      return entity.description;
    case 'client':
      return `Client: ${entity.name}`;
    case 'vendor':
      return `Vendor: ${entity.name}`;
  }
}

function getEntityEndpoint(type: EntityType, id: string, orgId?: string): string {
  const base = orgId ? `/api/v1/organisations/${orgId}` : '/api/v1';
  const endpointMap: Record<EntityType, string> = {
    invoice: `${base}/invoices/${id}`,
    bill: `${base}/bills/${id}`,
    transaction: `${base}/banking/transactions/${id}`,
    client: `${base}/clients/${id}`,
    vendor: `${base}/vendors/${id}`,
  };
  return endpointMap[type];
}

function getEntityUrl(type: EntityType, id: string, orgId?: string): string {
  const urlMap: Record<EntityType, string> = {
    invoice: `/finance/invoices/${id}`,
    bill: `/finance/expenses/${id}`,
    transaction: `/finance/banking?transaction=${id}`,
    client: `/clients/${id}`,
    vendor: `/vendors/${id}`,
  };
  return urlMap[type];
}

function getInvoiceStatusConfig(status: InvoiceEntity['status']) {
  const configMap: Record<
    InvoiceEntity['status'],
    { label: string; className: string }
  > = {
    DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
    SENT: { label: 'Sent', className: 'bg-blue-100 text-blue-700' },
    PAID: { label: 'Paid', className: 'bg-green-100 text-green-700' },
    OVERDUE: { label: 'Overdue', className: 'bg-red-100 text-red-700' },
    CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500' },
  };
  return configMap[status];
}

function getBillStatusConfig(status: BillEntity['status']) {
  const configMap: Record<BillEntity['status'], { label: string; className: string }> = {
    PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
    APPROVED: { label: 'Approved', className: 'bg-blue-100 text-blue-700' },
    PAID: { label: 'Paid', className: 'bg-green-100 text-green-700' },
    OVERDUE: { label: 'Overdue', className: 'bg-red-100 text-red-700' },
    REJECTED: { label: 'Rejected', className: 'bg-gray-100 text-gray-500' },
  };
  return configMap[status];
}

function getDaysInfo(dueDate: string): { days: number; isOverdue: boolean; label: string } {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays < 0;

  let label = '';
  if (diffDays === 0) {
    label = 'Due today';
  } else if (diffDays === 1) {
    label = 'Due tomorrow';
  } else if (diffDays > 1) {
    label = `Due in ${diffDays} days`;
  } else if (diffDays === -1) {
    label = '1 day overdue';
  } else {
    label = `${Math.abs(diffDays)} days overdue`;
  }

  return { days: diffDays, isOverdue, label };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
