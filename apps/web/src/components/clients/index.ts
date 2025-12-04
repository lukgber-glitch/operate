/**
 * Client Components Exports
 */

// Invoice History Components
export { ClientInvoiceHistory } from './ClientInvoiceHistory';
export { InvoiceStatusBadge } from './InvoiceStatusBadge';
export { InvoiceMiniCard } from './InvoiceMiniCard';

// Client Management Components
export { AddAddressDialog } from './AddAddressDialog';
export { AddClientDialog } from './AddClientDialog';
export { AddContactDialog } from './AddContactDialog';
export { AddNoteDialog } from './AddNoteDialog';
export { ClientActivityTab } from './ClientActivityTab';
export { ClientAddressesTab } from './ClientAddressesTab';
export { ClientContactsTab } from './ClientContactsTab';
export { ClientDataTable } from './ClientDataTable';
export { ClientFilters } from './ClientFilters';
export { ClientHeader } from './ClientHeader';
export { ClientOverview } from './ClientOverview';
export { EditClientDialog } from './EditClientDialog';
export { QuickActionButton } from './QuickActionButton';

// Hooks
export { useClientInvoices, usePrefetchClientInvoices, useClientInvoiceStats } from './hooks/useClientInvoices';
export type { ClientInvoice, ClientInvoicesResponse, ClientInvoicesFilters } from './hooks/useClientInvoices';
