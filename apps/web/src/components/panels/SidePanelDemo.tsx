'use client';

/**
 * SIDE PANEL INTEGRATION DEMO
 *
 * This file demonstrates how to integrate the side panel system
 * into your chat result cards or any other component.
 *
 * DO NOT import this in production - it's for reference only.
 */

import React from 'react';
import { useSidePanel } from '@/hooks/useSidePanel';
import {
  SidePanel,
  InvoiceDetailPanel,
  ExpenseDetailPanel,
  ClientDetailPanel,
  TransactionDetailPanel,
  ListDetailPanel,
} from '@/components/panels';
import { Button } from '@/components/ui/button';

// Example: How to use in a chat result card component
export function ChatResultCardExample() {
  const { isOpen, panelType, panelData, openPanel, closePanel } = useSidePanel();

  // Example handlers for different entity types
  const handleViewInvoice = () => {
    openPanel('invoice', {
      id: 'inv_001',
      invoiceNumber: 'INV-2024-001',
      status: 'sent',
      issueDate: '2024-01-15',
      dueDate: '2024-02-15',
      client: {
        name: 'Acme Corp',
        email: 'billing@acme.com',
        address: '123 Business St, San Francisco, CA 94105',
      },
      lineItems: [
        {
          id: '1',
          description: 'Web Development Services',
          quantity: 40,
          unitPrice: 150,
          taxRate: 20,
          total: 7200,
        },
        {
          id: '2',
          description: 'Hosting & Maintenance',
          quantity: 1,
          unitPrice: 500,
          taxRate: 20,
          total: 600,
        },
      ],
      subtotal: 6500,
      taxTotal: 1300,
      total: 7800,
      currency: 'USD',
      timeline: [
        {
          id: '1',
          event: 'Invoice created',
          timestamp: '2024-01-15T10:00:00Z',
          user: 'John Doe',
        },
        {
          id: '2',
          event: 'Invoice sent to client',
          timestamp: '2024-01-15T10:30:00Z',
          user: 'John Doe',
        },
      ],
    });
  };

  const handleViewExpense = () => {
    openPanel('expense', {
      id: 'exp_001',
      vendor: 'Office Supplies Inc',
      amount: 245.50,
      currency: 'USD',
      date: '2024-01-20',
      category: 'Office Supplies',
      description: 'Monthly office supplies purchase',
      status: 'approved',
      taxDeductible: true,
      taxAmount: 49.10,
      receipt: {
        url: 'https://example.com/receipt.jpg',
        fileName: 'receipt_2024_01_20.jpg',
      },
      tags: ['recurring', 'office'],
      notes: 'Standard monthly office supplies order',
    });
  };

  const handleViewClient = () => {
    openPanel('client', {
      id: 'client_001',
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business St, San Francisco, CA 94105',
      type: 'customer',
      status: 'active',
      financialSummary: {
        totalRevenue: 125000,
        outstanding: 7800,
        avgPaymentTime: 28,
        currency: 'USD',
      },
      recentInvoices: [
        {
          id: 'inv_001',
          invoiceNumber: 'INV-2024-001',
          amount: 7800,
          status: 'sent',
          date: '2024-01-15',
        },
        {
          id: 'inv_002',
          invoiceNumber: 'INV-2023-045',
          amount: 5200,
          status: 'paid',
          date: '2023-12-20',
        },
      ],
      recentPayments: [
        {
          id: 'pay_001',
          amount: 5200,
          date: '2024-01-05',
          method: 'Bank Transfer',
        },
      ],
      communications: [
        {
          id: 'comm_001',
          type: 'email',
          subject: 'Invoice INV-2024-001 sent',
          date: '2024-01-15',
        },
      ],
    });
  };

  const handleViewTransaction = () => {
    openPanel('transaction', {
      id: 'txn_001',
      amount: 245.50,
      currency: 'USD',
      date: '2024-01-20',
      description: 'OFFICE SUPPLIES INC',
      account: {
        name: 'Business Checking',
        lastFour: '4567',
        type: 'checking',
      },
      type: 'debit',
      status: 'posted',
      category: 'Office Supplies',
      categoryConfidence: 87,
      matchedEntity: {
        type: 'expense',
        id: 'exp_001',
        number: 'EXP-2024-001',
        amount: 245.50,
        matchConfidence: 95,
      },
      merchantInfo: {
        name: 'Office Supplies Inc',
        location: 'San Francisco, CA',
        category: 'Retail',
      },
    });
  };

  const handleViewList = () => {
    openPanel('list', {
      title: 'All Outstanding Invoices',
      columns: [
        { key: 'invoiceNumber', label: 'Invoice #', sortable: true },
        { key: 'client', label: 'Client', sortable: true },
        { key: 'amount', label: 'Amount', sortable: true },
        { key: 'dueDate', label: 'Due Date', sortable: true },
        { key: 'status', label: 'Status' },
      ],
      data: [
        {
          id: '1',
          invoiceNumber: 'INV-2024-001',
          client: 'Acme Corp',
          amount: '$7,800.00',
          dueDate: '2024-02-15',
          status: 'Sent',
        },
        {
          id: '2',
          invoiceNumber: 'INV-2024-002',
          client: 'Beta LLC',
          amount: '$3,200.00',
          dueDate: '2024-02-20',
          status: 'Overdue',
        },
      ],
      bulkActions: [
        { label: 'Send Reminder', value: 'send_reminder' },
        { label: 'Mark as Paid', value: 'mark_paid' },
        { label: 'Delete', value: 'delete', variant: 'destructive' as const },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Example trigger buttons */}
      <div className="flex gap-2">
        <Button onClick={handleViewInvoice}>View Invoice Details</Button>
        <Button onClick={handleViewExpense}>View Expense Details</Button>
        <Button onClick={handleViewClient}>View Client Details</Button>
        <Button onClick={handleViewTransaction}>View Transaction Details</Button>
        <Button onClick={handleViewList}>View List Details</Button>
      </div>

      {/* Render the appropriate panel based on type */}
      {panelType === 'invoice' && panelData && (
        <SidePanel
          isOpen={isOpen}
          onClose={closePanel}
          title="Invoice Details"
          subtitle={`#${panelData.invoiceNumber}`}
          width="lg"
        >
          <InvoiceDetailPanel
            invoice={panelData}
            onSend={() => console.log('Send invoice')}
            onDownload={() => console.log('Download invoice')}
            onEdit={() => console.log('Edit invoice')}
            onDuplicate={() => console.log('Duplicate invoice')}
            onDelete={() => console.log('Delete invoice')}
          />
        </SidePanel>
      )}

      {panelType === 'expense' && panelData && (
        <SidePanel
          isOpen={isOpen}
          onClose={closePanel}
          title="Expense Details"
          subtitle={panelData.vendor}
          width="lg"
        >
          <ExpenseDetailPanel
            expense={panelData}
            onEdit={() => console.log('Edit expense')}
            onDelete={() => console.log('Delete expense')}
            onSplit={() => console.log('Split expense')}
            onRecategorize={() => console.log('Recategorize expense')}
            onToggleTaxDeductible={() => console.log('Toggle tax deductible')}
          />
        </SidePanel>
      )}

      {panelType === 'client' && panelData && (
        <SidePanel
          isOpen={isOpen}
          onClose={closePanel}
          title="Client Details"
          subtitle={panelData.email}
          width="lg"
        >
          <ClientDetailPanel
            client={panelData}
            onEdit={() => console.log('Edit client')}
            onCreateInvoice={() => console.log('Create invoice')}
            onSendEmail={() => console.log('Send email')}
          />
        </SidePanel>
      )}

      {panelType === 'transaction' && panelData && (
        <SidePanel
          isOpen={isOpen}
          onClose={closePanel}
          title="Transaction Details"
          subtitle={panelData.description}
          width="lg"
        >
          <TransactionDetailPanel
            transaction={panelData}
            onMatch={() => console.log('Match transaction')}
            onIgnore={() => console.log('Ignore transaction')}
            onCategorize={() => console.log('Categorize transaction')}
            onSplit={() => console.log('Split transaction')}
          />
        </SidePanel>
      )}

      {panelType === 'list' && panelData && (
        <SidePanel
          isOpen={isOpen}
          onClose={closePanel}
          title={panelData.title}
          width="xl"
        >
          <ListDetailPanel
            title={panelData.title}
            columns={panelData.columns}
            data={panelData.data}
            bulkActions={panelData.bulkActions}
            onRowClick={(row) => console.log('Row clicked:', row)}
            onExport={(format) => console.log('Export as:', format)}
            onBulkAction={(action, rows) => console.log('Bulk action:', action, rows)}
          />
        </SidePanel>
      )}
    </div>
  );
}

/**
 * INTEGRATION PATTERN FOR CHAT RESULT CARDS
 *
 * In your actual result card components (e.g., InvoiceResultCard.tsx):
 *
 * 1. Import the hook at the top of your parent component (ChatInterface or similar):
 *    const { openPanel } = useSidePanel();
 *
 * 2. Pass openPanel down to your result cards or use context
 *
 * 3. In the "View Details" button handler:
 *    <Button onClick={() => openPanel('invoice', invoiceData)}>
 *      View Details
 *    </Button>
 *
 * 4. Render the panel conditionally in your parent component
 *    (see examples above for each panel type)
 *
 * IMPORTANT: Place the SidePanel components in your parent container
 * (e.g., ChatInterface) so they overlay correctly and don't affect layout.
 */
