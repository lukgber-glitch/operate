/**
 * Mobile Components Usage Examples
 *
 * This file demonstrates how to use the new mobile-optimized components
 * for enhanced PWA experience.
 */

'use client';

import { useState } from 'react';
import {
  PullToRefresh,
  SwipeActions,
  SwipeActionIcons,
  BottomSheet,
  FloatingActionButton,
  type SwipeAction,
  type FABAction
} from '@/components/mobile';
import { Plus, FileText, Receipt, Clock } from 'lucide-react';

/**
 * Example 1: Pull to Refresh
 *
 * Usage in a list view or dashboard
 */
export function PullToRefreshExample() {
  const handleRefresh = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Data refreshed!');
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4">
        {/* Your content here */}
        <h2>Pull down to refresh</h2>
        <p>Your list items...</p>
      </div>
    </PullToRefresh>
  );
}

/**
 * Example 2: Swipe Actions
 *
 * Usage in list items (invoices, expenses, notifications)
 */
export function SwipeActionsExample() {
  const leftActions: SwipeAction[] = [
    {
      id: 'complete',
      label: 'Complete',
      icon: SwipeActionIcons.Check,
      color: 'green',
      onAction: () => console.log('Marked as complete'),
    },
  ];

  const rightActions: SwipeAction[] = [
    {
      id: 'delete',
      label: 'Delete',
      icon: SwipeActionIcons.Delete,
      color: 'red',
      onAction: () => console.log('Deleted'),
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: SwipeActionIcons.Archive,
      color: 'blue',
      onAction: () => console.log('Archived'),
    },
  ];

  return (
    <SwipeActions leftActions={leftActions} rightActions={rightActions}>
      <div className="border rounded-lg p-4 bg-background">
        <h3 className="font-semibold">Invoice #1234</h3>
        <p className="text-sm text-muted-foreground">Due: Dec 31, 2024</p>
      </div>
    </SwipeActions>
  );
}

/**
 * Example 3: Bottom Sheet
 *
 * Usage for mobile-friendly modals and action sheets
 */
export function BottomSheetExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Open Bottom Sheet
      </button>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Invoice Details"
        snapPoints={['peek', 'half', 'full']}
        initialSnap="peek"
        showHandle
        showClose
      >
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold">Invoice #1234</h3>
            <p className="text-sm text-muted-foreground">Client: Acme Corp</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>$1,000.00</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (19%):</span>
              <span>$190.00</span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>$1,190.00</span>
            </div>
          </div>

          {/* Content continues... */}
          <div className="h-96 bg-muted/20 rounded-lg flex items-center justify-center">
            More content here (scrollable when in half/full mode)
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

/**
 * Example 4: Floating Action Button
 *
 * Usage for quick actions on mobile
 */
export function FloatingActionButtonExample() {
  const quickActions: FABAction[] = [
    {
      id: 'new-invoice',
      label: 'New Invoice',
      icon: <FileText className="h-5 w-5" />,
      onClick: () => console.log('New invoice'),
      color: 'bg-blue-500',
    },
    {
      id: 'scan-receipt',
      label: 'Scan Receipt',
      icon: <Receipt className="h-5 w-5" />,
      onClick: () => console.log('Scan receipt'),
      color: 'bg-green-500',
    },
    {
      id: 'start-timer',
      label: 'Start Timer',
      icon: <Clock className="h-5 w-5" />,
      onClick: () => console.log('Start timer'),
      color: 'bg-purple-500',
    },
  ];

  return (
    <FloatingActionButton
      actions={quickActions}
      mainIcon={<Plus className="h-6 w-6" />}
      position="bottom-right"
      size="md"
    />
  );
}

/**
 * Combined Example: Invoice List with All Components
 *
 * Real-world usage combining multiple mobile components
 */
export function InvoiceListMobileExample() {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
  };

  const handleInvoiceClick = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsDetailsOpen(true);
  };

  const swipeRightActions: SwipeAction[] = [
    {
      id: 'delete',
      label: 'Delete',
      icon: SwipeActionIcons.Delete,
      color: 'red',
      onAction: () => console.log('Delete invoice'),
    },
  ];

  const fabActions: FABAction[] = [
    {
      id: 'new-invoice',
      label: 'New Invoice',
      icon: <FileText className="h-5 w-5" />,
      onClick: () => console.log('Create invoice'),
    },
  ];

  return (
    <div className="h-screen">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-2 p-4">
          {[1, 2, 3, 4, 5].map((id) => (
            <SwipeActions
              key={id}
              rightActions={swipeRightActions}
            >
              <div
                onClick={() => handleInvoiceClick({ id })}
                className="border rounded-lg p-4 bg-background cursor-pointer"
              >
                <h3 className="font-semibold">Invoice #{1000 + id}</h3>
                <p className="text-sm text-muted-foreground">
                  Amount: ${1000 * id}.00
                </p>
              </div>
            </SwipeActions>
          ))}
        </div>
      </PullToRefresh>

      <BottomSheet
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={`Invoice #${selectedInvoice?.id ? 1000 + selectedInvoice.id : ''}`}
        snapPoints={['peek', 'full']}
        initialSnap="peek"
      >
        <div className="p-4">
          <p>Invoice details here...</p>
        </div>
      </BottomSheet>

      <FloatingActionButton actions={fabActions} />
    </div>
  );
}
