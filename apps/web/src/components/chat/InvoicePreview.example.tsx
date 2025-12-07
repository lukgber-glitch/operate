/**
 * InvoicePreview Component - Usage Examples
 *
 * This file demonstrates how to use the InvoicePreview component in chat messages.
 */

'use client';

import { InvoicePreview, InvoicePreviewCompact } from './InvoicePreview';

/**
 * Example 1: Full invoice preview with all actions
 */
export function FullInvoicePreviewExample() {
  const invoice = {
    id: 'inv_001',
    number: 'INV-2024-001',
    customerName: 'Acme Corporation',
    amount: 5250.00,
    currency: 'USD',
    status: 'SENT' as const,
    dueDate: '2025-12-20',
    issueDate: '2025-12-01',
    lineItemCount: 5,
  };

  const handleView = (id: string) => {
    console.log('View invoice:', id);
    // Navigate to invoice detail page
    window.location.href = `/invoices/${id}`;
  };

  const handleSend = (id: string) => {
    console.log('Send invoice:', id);
    // Trigger send invoice action
  };

  const handleDownload = (id: string) => {
    console.log('Download invoice:', id);
    // Trigger PDF download
  };

  return (
    <div className="max-w-md">
      <InvoicePreview
        invoice={invoice}
        onView={handleView}
        onSend={handleSend}
        onDownload={handleDownload}
      />
    </div>
  );
}

/**
 * Example 2: Overdue invoice
 */
export function OverdueInvoiceExample() {
  const invoice = {
    id: 'inv_002',
    number: 'INV-2024-002',
    customerName: 'Beta Industries Ltd',
    amount: 12750.00,
    currency: 'EUR',
    status: 'OVERDUE' as const,
    dueDate: '2025-11-15', // Past due date
    issueDate: '2025-11-01',
    lineItemCount: 8,
  };

  return (
    <div className="max-w-md">
      <InvoicePreview
        invoice={invoice}
        onView={(id) => console.log('View:', id)}
        onDownload={(id) => console.log('Download:', id)}
      />
    </div>
  );
}

/**
 * Example 3: Paid invoice
 */
export function PaidInvoiceExample() {
  const invoice = {
    id: 'inv_003',
    number: 'INV-2024-003',
    customerName: 'Gamma Services Inc',
    amount: 8500.00,
    currency: 'GBP',
    status: 'PAID' as const,
    dueDate: '2025-12-31',
    issueDate: '2025-12-05',
    lineItemCount: 3,
  };

  return (
    <div className="max-w-md">
      <InvoicePreview
        invoice={invoice}
        onView={(id) => console.log('View:', id)}
        onDownload={(id) => console.log('Download:', id)}
      />
    </div>
  );
}

/**
 * Example 4: Draft invoice with send action
 */
export function DraftInvoiceExample() {
  const invoice = {
    id: 'inv_004',
    number: 'INV-2024-004',
    customerName: 'Delta Tech Solutions',
    amount: 3200.00,
    currency: 'USD',
    status: 'DRAFT' as const,
    dueDate: '2026-01-15',
    issueDate: '2025-12-07',
    lineItemCount: 2,
  };

  return (
    <div className="max-w-md">
      <InvoicePreview
        invoice={invoice}
        onView={(id) => console.log('View:', id)}
        onSend={(id) => console.log('Send:', id)}
        onDownload={(id) => console.log('Download:', id)}
      />
    </div>
  );
}

/**
 * Example 5: Compact version for inline chat display
 */
export function CompactInvoiceExample() {
  const invoice = {
    id: 'inv_005',
    number: 'INV-2024-005',
    customerName: 'Epsilon Consulting Group',
    amount: 6800.00,
    currency: 'USD',
    status: 'SENT' as const,
    dueDate: '2025-12-25',
    issueDate: '2025-12-05',
    lineItemCount: 4,
  };

  return (
    <div className="max-w-md">
      <InvoicePreviewCompact
        invoice={invoice}
        onClick={() => console.log('Clicked invoice:', invoice.id)}
      />
    </div>
  );
}

/**
 * Example 6: Multiple invoice statuses
 */
export function MultipleInvoicesExample() {
  const invoices = [
    {
      id: 'inv_006',
      number: 'INV-2024-006',
      customerName: 'Client A',
      amount: 1500.00,
      currency: 'USD',
      status: 'DRAFT' as const,
      dueDate: '2026-01-10',
      issueDate: '2025-12-07',
      lineItemCount: 1,
    },
    {
      id: 'inv_007',
      number: 'INV-2024-007',
      customerName: 'Client B',
      amount: 2800.00,
      currency: 'USD',
      status: 'SENT' as const,
      dueDate: '2025-12-15',
      issueDate: '2025-12-01',
      lineItemCount: 3,
    },
    {
      id: 'inv_008',
      number: 'INV-2024-008',
      customerName: 'Client C',
      amount: 4200.00,
      currency: 'USD',
      status: 'OVERDUE' as const,
      dueDate: '2025-11-30',
      issueDate: '2025-11-15',
      lineItemCount: 5,
    },
    {
      id: 'inv_009',
      number: 'INV-2024-009',
      customerName: 'Client D',
      amount: 3600.00,
      currency: 'USD',
      status: 'PAID' as const,
      dueDate: '2025-12-10',
      issueDate: '2025-11-25',
      lineItemCount: 2,
    },
  ];

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold">Invoice List</h2>
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <InvoicePreviewCompact
            key={invoice.id}
            invoice={invoice}
            onClick={() => console.log('Clicked:', invoice.number)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Example 7: Integration in chat message
 */
export function ChatMessageWithInvoiceExample() {
  const invoice = {
    id: 'inv_010',
    number: 'INV-2024-010',
    customerName: 'Tech Innovations LLC',
    amount: 9500.00,
    currency: 'USD',
    status: 'SENT' as const,
    dueDate: '2025-12-18',
    issueDate: '2025-12-03',
    lineItemCount: 6,
  };

  return (
    <div className="max-w-2xl space-y-3">
      {/* AI Assistant Message */}
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm mb-3">
          I've created invoice INV-2024-010 for Tech Innovations LLC totaling $9,500.00.
          The invoice includes 6 line items and is due on December 18, 2025.
        </p>
        <InvoicePreview
          invoice={invoice}
          onView={(id) => window.location.href = `/invoices/${id}`}
          onSend={(id) => console.log('Send:', id)}
          onDownload={(id) => console.log('Download:', id)}
        />
      </div>
    </div>
  );
}

/**
 * Example 8: Cancelled invoice
 */
export function CancelledInvoiceExample() {
  const invoice = {
    id: 'inv_011',
    number: 'INV-2024-011',
    customerName: 'Cancelled Project Ltd',
    amount: 7200.00,
    currency: 'USD',
    status: 'CANCELLED' as const,
    dueDate: '2025-12-30',
    issueDate: '2025-12-01',
    lineItemCount: 4,
  };

  return (
    <div className="max-w-md">
      <InvoicePreview
        invoice={invoice}
        onView={(id) => console.log('View:', id)}
      />
    </div>
  );
}
