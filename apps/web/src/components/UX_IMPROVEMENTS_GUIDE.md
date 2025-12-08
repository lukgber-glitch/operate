# UX Improvements Guide

This document describes the 4 P2 UX improvements implemented for the Operate frontend.

## M-002: Complete Frontend Quick Actions

**Location:** `apps/web/src/components/dashboard/QuickActions.tsx`

### What Changed
- Replaced "Coming Soon" placeholder for payment sending action
- Added proper navigation and toast notification for payment feature
- All 6 quick actions now have functional onClick handlers

### Usage
```tsx
import { QuickActions } from '@/components/dashboard/QuickActions';

// In your dashboard
<QuickActions />
```

The component handles:
- Invoice creation
- Expense recording
- Transaction viewing
- Report generation
- Payment navigation (navigates to banking page)
- Data export (navigates to settings/exports)

---

## M-003: Reusable ConfirmationDialog Component

**Location:** `apps/web/src/components/ui/ConfirmationDialog.tsx`

### Features
- Three variants: `danger`, `warning`, `info`
- Loading states with spinner
- Customizable labels and actions
- Optional details section
- Custom icons support
- Includes `useConfirmation` hook for easy state management

### Usage

#### Basic Example - Delete Confirmation
```tsx
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInvoice(invoiceId);
      setIsOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="destructive">
        Delete Invoice
      </Button>

      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
```

#### Using the Hook
```tsx
import { useConfirmation } from '@/components/ui/ConfirmationDialog';

function MyComponent() {
  const confirm = useConfirmation();

  const handleDelete = () => {
    confirm.open({
      title: 'Delete Invoice',
      description: 'Are you sure you want to delete this invoice?',
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await deleteInvoice(invoiceId);
        confirm.close();
      },
    });
  };

  return (
    <>
      <Button onClick={handleDelete} variant="destructive">
        Delete Invoice
      </Button>
      {confirm.dialog}
    </>
  );
}
```

#### Payment Approval Example
```tsx
confirm.open({
  title: 'Approve Payment',
  description: 'Are you sure you want to approve this payment?',
  variant: 'warning',
  confirmLabel: 'Approve Payment',
  details: (
    <div>
      <p><strong>Amount:</strong> $1,234.56</p>
      <p><strong>Vendor:</strong> Acme Corp</p>
      <p><strong>Due Date:</strong> Dec 15, 2024</p>
    </div>
  ),
  onConfirm: async () => {
    await approvePayment(paymentId);
    confirm.close();
  },
});
```

#### Bulk Operation Example
```tsx
confirm.open({
  title: 'Delete 15 Invoices',
  description: 'Are you sure you want to delete 15 selected invoices? This action cannot be undone.',
  variant: 'danger',
  confirmLabel: 'Delete All',
  details: (
    <div className="text-sm">
      <p className="font-semibold mb-2">Selected invoices:</p>
      <ul className="list-disc list-inside space-y-1">
        <li>INV-001 - $1,200</li>
        <li>INV-002 - $850</li>
        <li>And 13 more...</li>
      </ul>
    </div>
  ),
  onConfirm: async () => {
    await bulkDeleteInvoices(selectedIds);
    confirm.close();
  },
});
```

### Variants

- **danger**: Red color scheme, for destructive actions (delete, remove)
- **warning**: Orange color scheme, for potentially risky actions (approve, send)
- **info**: Blue color scheme, for informational confirmations

---

## UX-003: Dynamic Suggestion Chips

**Location:** `apps/web/src/components/chat/SuggestionChips.tsx`

### What Changed
- Now fetches suggestions from API using `useSuggestions` hook
- Context-aware suggestions based on current page
- Time-based suggestions (morning/afternoon/evening)
- Falls back to smart defaults when API is unavailable
- Shows loading skeleton during fetch

### Features
- Dynamic API-driven suggestions
- Context filtering by page/module
- Smart fallback suggestions
- Time-aware defaults
- Loading states
- Icon mapping for suggestion types

### Usage

#### Basic Usage
```tsx
import { SuggestionChips } from '@/components/chat/SuggestionChips';

function ChatInterface() {
  const handleSelect = (suggestion: string) => {
    // User clicked on a suggestion chip
    console.log('Selected:', suggestion);
  };

  return (
    <SuggestionChips
      onSelect={handleSelect}
      context="chat-interface"
    />
  );
}
```

#### With Context
```tsx
// On finance page
<SuggestionChips
  onSelect={handleSelect}
  context="finance.invoices"
/>

// On tax page
<SuggestionChips
  onSelect={handleSelect}
  context="tax.filing"
/>
```

### How It Works

1. **Fetches from API**: Calls `/api/v1/chatbot/suggestions?context=<context>`
2. **Smart Fallbacks**: If API returns empty or fails, shows context-aware defaults
3. **Time-Based**: Morning suggestions differ from evening suggestions
4. **Icon Mapping**: Maps suggestion types to appropriate icons

---

## UX-004: Entity Preview Sidebar

**Location:** `apps/web/src/components/chat/EntityPreview.tsx`

### Features
- Slide-out panel showing entity details
- Supports 5 entity types: invoice, bill, transaction, client, vendor
- Fetches data from API or accepts pre-loaded data
- Loading skeleton while fetching
- Quick actions (view full, download PDF)
- Deep links to full entity pages

### Usage

#### Basic Example
```tsx
import { EntityPreview } from '@/components/chat/EntityPreview';
import { useEntityPreview } from '@/hooks/useEntityPreview';

function ChatMessage() {
  const entityPreview = useEntityPreview();

  // When user clicks on an invoice mention
  const handleInvoiceClick = (invoiceId: string) => {
    entityPreview.open('invoice', invoiceId);
  };

  return (
    <>
      <div>
        <p>I found <a onClick={() => handleInvoiceClick('inv_123')}>Invoice #INV-001</a></p>
      </div>

      <EntityPreview
        open={entityPreview.isOpen}
        onOpenChange={entityPreview.setOpen}
        entityType={entityPreview.entityType!}
        entityId={entityPreview.entityId!}
        orgId="org_abc"
      />
    </>
  );
}
```

#### With Pre-loaded Data
```tsx
// If you already have the entity data
const invoice = {
  id: 'inv_123',
  type: 'invoice' as const,
  number: 'INV-001',
  customerName: 'Acme Corp',
  amount: 1200,
  currency: 'USD',
  status: 'SENT' as const,
  dueDate: '2024-12-15',
  issueDate: '2024-11-15',
};

entityPreview.open('invoice', invoice.id, invoice);
```

#### In Chat Interface
```tsx
function ChatInterface() {
  const entityPreview = useEntityPreview();

  // Parse message for entity mentions
  const renderMessage = (content: string) => {
    // Extract entity mentions like [[invoice:inv_123]]
    const entityMentionRegex = /\[\[(\w+):(\w+)\]\]/g;

    return content.replace(entityMentionRegex, (match, type, id) => {
      return `<a onClick={() => entityPreview.open('${type}', '${id}')}>
        ${type} ${id}
      </a>`;
    });
  };

  return (
    <>
      {/* Chat messages */}
      <div>{renderMessage(message.content)}</div>

      {/* Entity preview */}
      <EntityPreview
        open={entityPreview.isOpen}
        onOpenChange={entityPreview.setOpen}
        entityType={entityPreview.entityType!}
        entityId={entityPreview.entityId!}
      />
    </>
  );
}
```

### Supported Entity Types

#### Invoice
```typescript
{
  type: 'invoice',
  number: string,
  customerName: string,
  amount: number,
  currency: string,
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED',
  dueDate: string,
  issueDate: string,
  lineItems?: Array<{...}>,
}
```

#### Bill
```typescript
{
  type: 'bill',
  number: string,
  vendorName: string,
  amount: number,
  currency: string,
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'OVERDUE' | 'REJECTED',
  dueDate: string,
  receivedDate: string,
  category?: string,
}
```

#### Transaction
```typescript
{
  type: 'transaction',
  description: string,
  amount: number,
  currency: string,
  date: string,
  type_detail: 'DEBIT' | 'CREDIT',
  category?: string,
  merchant?: string,
  accountName?: string,
}
```

#### Client
```typescript
{
  type: 'client',
  name: string,
  email?: string,
  phone?: string,
  address?: string,
  totalInvoiced?: number,
  totalPaid?: number,
  outstandingBalance?: number,
}
```

#### Vendor
```typescript
{
  type: 'vendor',
  name: string,
  email?: string,
  phone?: string,
  address?: string,
  totalBilled?: number,
  totalPaid?: number,
  outstandingBalance?: number,
}
```

### API Endpoints

The component automatically calls the correct endpoint:

- Invoice: `/api/v1/organisations/{orgId}/invoices/{id}`
- Bill: `/api/v1/organisations/{orgId}/bills/{id}`
- Transaction: `/api/v1/organisations/{orgId}/banking/transactions/{id}`
- Client: `/api/v1/organisations/{orgId}/clients/{id}`
- Vendor: `/api/v1/organisations/{orgId}/vendors/{id}`

---

## Summary

All 4 P2 UX improvements are now complete:

1. **QuickActions**: All actions functional with proper navigation
2. **ConfirmationDialog**: Reusable component for risky operations with hook support
3. **SuggestionChips**: Dynamic API-driven suggestions with smart fallbacks
4. **EntityPreview**: Comprehensive entity preview sidebar supporting 5 entity types

These components follow best practices:
- TypeScript types for type safety
- Loading states for better UX
- Error handling with toast notifications
- Responsive design
- Accessibility features (ARIA labels, keyboard navigation)
- Reusable and composable
- Well-documented with examples
