# Client Invoice History Components

This directory contains components for displaying and managing a client's invoice history within the CRM module.

## Components

### 1. ClientInvoiceHistory.tsx (386 lines)
Main invoice history component with full-featured invoice management.

**Features:**
- Data table and grid view toggle
- Sortable columns (Date, Due Date, Amount, Status)
- Status filtering (All, Draft, Sent, Paid, Overdue, Cancelled)
- Pagination with prefetching
- Quick actions (View, Download PDF, Send Reminder)
- Responsive design
- Loading and error states

**Usage:**
```tsx
import { ClientInvoiceHistory } from '@/components/clients';

<ClientInvoiceHistory clientId="client-123" />
```

**Props:**
- `clientId` (string, required): The ID of the client
- `className` (string, optional): Additional CSS classes

### 2. InvoiceStatusBadge.tsx (72 lines)
Color-coded status indicator for invoices.

**Features:**
- 5 status types with unique colors and icons
- Draft (gray), Sent (blue), Paid (green), Overdue (red), Cancelled (gray)
- Icon indicators for each status
- Consistent styling with shadcn/ui Badge component

**Usage:**
```tsx
import { InvoiceStatusBadge } from '@/components/clients';

<InvoiceStatusBadge status="PAID" />
```

**Props:**
- `status` (InvoiceStatus, required): DRAFT | SENT | PAID | OVERDUE | CANCELLED
- `className` (string, optional): Additional CSS classes

### 3. InvoiceMiniCard.tsx (84 lines)
Compact invoice card for grid view display.

**Features:**
- Displays invoice number, amount, date
- Status badge integration
- Quick action buttons (View, Download)
- Hover effects and transitions
- Currency and date formatting

**Usage:**
```tsx
import { InvoiceMiniCard } from '@/components/clients';

<InvoiceMiniCard
  invoice={invoiceData}
  onView={(id) => router.push(`/invoices/${id}`)}
  onDownload={(id) => downloadPDF(id)}
/>
```

**Props:**
- `invoice` (object, required): Invoice data object
  - `id`: Invoice ID
  - `number`: Invoice number
  - `date`: Invoice date
  - `dueDate`: Payment due date
  - `total`: Total amount
  - `currency`: Currency code
  - `status`: Invoice status
- `onView` (function, optional): Callback for view action
- `onDownload` (function, optional): Callback for download action

### 4. hooks/useClientInvoices.ts (124 lines)
React Query hooks for invoice data management.

**Features:**
- Fetch client invoices with filtering and pagination
- Prefetch next page for smooth navigation
- Client invoice statistics
- Automatic cache management
- TypeScript types included

**Hooks:**

#### useClientInvoices
```tsx
const { data, isLoading, isError } = useClientInvoices(clientId, {
  status: 'PAID',
  page: 1,
  limit: 10,
  sortBy: 'date',
  sortOrder: 'desc'
});
```

#### usePrefetchClientInvoices
```tsx
const prefetchNextPage = usePrefetchClientInvoices(clientId, filters);
prefetchNextPage(2); // Prefetch page 2
```

#### useClientInvoiceStats
```tsx
const { data: stats } = useClientInvoiceStats(clientId);
```

## Utility Functions

### lib/utils/currency.ts (63 lines)
Currency formatting utilities.

**Functions:**
- `formatCurrency(amount, currency, locale)` - Full currency formatting
- `formatCurrencyCompact(amount, currency, locale)` - Compact notation for large amounts
- `getCurrencySymbol(currency)` - Get currency symbol
- `parseCurrencyAmount(value)` - Parse currency string to number

**Usage:**
```tsx
import { formatCurrency } from '@/lib/utils/currency';

formatCurrency(1234.56, 'EUR'); // "€1,234.56"
formatCurrency(1234.56, 'USD', 'en-US'); // "$1,234.56"
```

### lib/utils/date.ts (153 lines)
Date formatting and manipulation utilities.

**Functions:**
- `formatDate(date, locale, options)` - Localized date formatting
- `formatDateTime(date, locale)` - Date with time
- `formatDateISO(date)` - ISO format (YYYY-MM-DD)
- `formatRelativeDate(date)` - Relative time (e.g., "2 days ago")
- `isPast(date)` - Check if date is in the past
- `isFuture(date)` - Check if date is in the future
- `daysBetween(date1, date2)` - Calculate days between dates
- `addDays(date, days)` - Add days to date
- `subtractDays(date, days)` - Subtract days from date

**Usage:**
```tsx
import { formatDate, formatRelativeDate } from '@/lib/utils/date';

formatDate('2024-12-01'); // "Dec 1, 2024"
formatRelativeDate('2024-12-01'); // "2 days ago"
```

## API Integration

The components expect the following API endpoint structure:

```
GET /invoices/client/:clientId
Query Parameters:
  - status: InvoiceStatus (optional)
  - page: number (default: 1)
  - limit: number (default: 10)
  - sortBy: 'date' | 'dueDate' | 'total' | 'status'
  - sortOrder: 'asc' | 'desc'

Response:
{
  data: ClientInvoice[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

## TypeScript Types

All components are fully typed with TypeScript. Key types:

```typescript
type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

interface ClientInvoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  currency: string;
  status: InvoiceStatus;
  customerName: string;
  clientId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Dependencies

- React Query (@tanstack/react-query)
- shadcn/ui components (Table, Card, Button, Badge, Select)
- Lucide React icons
- Next.js router

## Integration Example

```tsx
import { ClientInvoiceHistory } from '@/components/clients';

export default function ClientProfilePage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <ClientHeader clientId={params.id} />
      <ClientOverview clientId={params.id} />
      <ClientInvoiceHistory clientId={params.id} />
    </div>
  );
}
```

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| ClientInvoiceHistory.tsx | 386 | Main invoice history component |
| InvoiceStatusBadge.tsx | 72 | Status badge component |
| InvoiceMiniCard.tsx | 84 | Compact invoice card |
| hooks/useClientInvoices.ts | 124 | React Query hooks |
| lib/utils/currency.ts | 63 | Currency utilities |
| lib/utils/date.ts | 153 | Date utilities |
| **Total** | **882** | **6 files** |

## Notes

- All components use shadcn/ui for consistent styling
- Currency and date formatting support internationalization
- Components are optimized with React Query caching and prefetching
- Fully responsive design for mobile and desktop
- Accessibility features included (keyboard navigation, ARIA labels)
