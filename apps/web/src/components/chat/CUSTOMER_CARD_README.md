# CustomerCard Component

## Overview

The `CustomerCard` component is a rich, interactive card designed to display customer information inline within chat messages. It provides a visually appealing way to present customer data with quick actions for common tasks.

## Location

`apps/web/src/components/chat/CustomerCard.tsx`

## Features

- **Customer Avatar**: Displays customer initials in a circular avatar
- **Customer Details**: Shows name, company, and email
- **Status Badge**: Visual indicator for ACTIVE/INACTIVE status
- **Key Metrics**: Displays total revenue and invoice count
- **Quick Actions**: Buttons for viewing profile and sending email
- **Responsive Design**: Adapts to different screen sizes
- **Dark Mode Support**: Full support for light and dark themes
- **TypeScript**: Fully typed with proper interfaces

## Props

```typescript
interface CustomerCardProps {
  customer: {
    id: string;              // Customer unique identifier
    name: string;            // Customer name (required)
    company?: string;        // Company name (optional)
    email?: string;          // Email address (optional)
    status: 'ACTIVE' | 'INACTIVE';  // Customer status
    totalRevenue?: number;   // Total revenue (optional)
    invoiceCount?: number;   // Number of invoices (optional)
    currency?: string;       // Currency code (default: USD)
  };
  onViewProfile?: (id: string) => void;     // Handler for view profile action
  onSendEmail?: (email: string) => void;    // Handler for send email action
}
```

## Usage

### Basic Usage

```tsx
import { CustomerCard } from '@/components/chat';

<CustomerCard
  customer={{
    id: 'cust_123',
    name: 'John Smith',
    company: 'Acme Corp',
    email: 'john@acme.com',
    status: 'ACTIVE',
    totalRevenue: 125000,
    invoiceCount: 24,
    currency: 'USD',
  }}
  onViewProfile={(id) => router.push(`/customers/${id}`)}
  onSendEmail={(email) => window.location.href = `mailto:${email}`}
/>
```

### Minimal Usage

```tsx
<CustomerCard
  customer={{
    id: 'cust_456',
    name: 'Jane Doe',
    status: 'INACTIVE',
  }}
/>
```

### In Chat Messages

```tsx
<ChatMessage>
  <p>Here's the customer you were looking for:</p>
  <CustomerCard
    customer={customerData}
    onViewProfile={handleViewProfile}
    onSendEmail={handleSendEmail}
  />
</ChatMessage>
```

## Design System Integration

The component uses the following UI components from the design system:

- `Card`, `CardHeader`, `CardContent` - Layout structure
- `Badge` - Status indicators
- `Button` - Action buttons
- `Avatar`, `AvatarFallback` - Customer avatar
- Icons from `lucide-react`:
  - `Building2` - Company icon
  - `Mail` - Email icon
  - `DollarSign` - Revenue icon
  - `FileText` - Invoice icon
  - `User` - Profile icon
  - `ExternalLink` - External link icon
  - `CheckCircle` - Active status icon
  - `XCircle` - Inactive status icon

## Styling

The component follows the existing design system patterns:

- Uses CSS variables for colors and spacing
- Supports dark mode via Tailwind CSS dark mode classes
- Responsive grid layout for metrics
- Hover effects for interactive elements
- Truncation for long text to prevent overflow

## Examples

See `CustomerCard.example.tsx` for comprehensive usage examples including:
- Active customer with full data
- Inactive customer
- Minimal customer data
- Customer with company but no email

## Status Variants

### ACTIVE
- Icon: Green check circle
- Colors: Green background with dark green text
- Indicates an active customer relationship

### INACTIVE
- Icon: Gray X circle
- Colors: Gray background with dark gray text
- Indicates an inactive or churned customer

## Currency Formatting

The component automatically formats currency values using `Intl.NumberFormat`:
- Default currency: USD
- Falls back to 'N/A' if revenue is undefined
- Respects the `currency` prop for different currencies

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Descriptive button labels
- Icon + text for better understanding
- Keyboard accessible buttons

## Browser Support

Works in all modern browsers that support:
- CSS Grid
- CSS Custom Properties
- ES2015+

## Related Components

- `ActionResultCard` - For displaying action results
- `TransactionInsight` - For transaction details
- `InvoicePreview` - For invoice previews
- `ClientCard` - Similar component in CRM section

## Integration Notes

This component is designed to be embedded within chat messages as part of the Document Intelligence sprint (Sprint 4). It works seamlessly with the chat interface to provide rich, interactive customer information displays.
