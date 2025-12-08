/**
 * ConfirmDialog - Usage Examples
 *
 * This file contains example implementations showing how to integrate
 * the ConfirmDialog component in various scenarios throughout the app.
 */

import { useState } from 'react';
import { ConfirmDialog, useConfirmDialog } from './confirm-dialog';
import { Button } from './button';
import { Trash2, LogOut, CreditCard, UserMinus } from 'lucide-react';

/**
 * Example 1: Delete Invoice
 * Destructive action requiring confirmation
 */
export function DeleteInvoiceExample() {
  const deleteDialog = useConfirmDialog();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // API call to delete invoice
      await fetch('/api/v1/invoices/123', { method: 'DELETE' });
      // Success handling
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={deleteDialog.open}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Invoice
      </Button>

      <ConfirmDialog
        {...deleteDialog.props}
        variant="destructive"
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone and all associated data will be permanently removed."
        confirmLabel="Delete Invoice"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}

/**
 * Example 2: Process Payment
 * Warning dialog for financial actions
 */
export function ProcessPaymentExample() {
  const paymentDialog = useConfirmDialog();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      await fetch('/api/v1/payments', {
        method: 'POST',
        body: JSON.stringify({ amount: 1000, invoiceId: '123' }),
      });
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button onClick={paymentDialog.open}>
        <CreditCard className="h-4 w-4 mr-2" />
        Process Payment
      </Button>

      <ConfirmDialog
        {...paymentDialog.props}
        variant="warning"
        title="Process Payment"
        description="You are about to process a payment of €1,000.00. Please confirm that all details are correct before proceeding."
        confirmLabel="Confirm Payment"
        cancelLabel="Review Details"
        onConfirm={handlePayment}
        isLoading={isProcessing}
      />
    </>
  );
}

/**
 * Example 3: Remove Team Member
 * Destructive action with user confirmation
 */
export function RemoveTeamMemberExample() {
  const removeDialog = useConfirmDialog();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await fetch('/api/v1/team/members/456', { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to remove team member:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={removeDialog.open}>
        <UserMinus className="h-4 w-4 mr-2" />
        Remove Member
      </Button>

      <ConfirmDialog
        {...removeDialog.props}
        variant="destructive"
        title="Remove Team Member"
        description="Are you sure you want to remove this team member? They will lose access to all resources and data."
        confirmLabel="Remove Member"
        cancelLabel="Keep Member"
        onConfirm={handleRemove}
        isLoading={isRemoving}
      />
    </>
  );
}

/**
 * Example 4: Logout Confirmation
 * Info variant for general confirmations
 */
export function LogoutExample() {
  const logoutDialog = useConfirmDialog();

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <>
      <Button variant="ghost" onClick={logoutDialog.open}>
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>

      <ConfirmDialog
        {...logoutDialog.props}
        variant="info"
        title="Confirm Logout"
        description="Are you sure you want to logout? Any unsaved changes will be lost."
        confirmLabel="Logout"
        cancelLabel="Stay Logged In"
        onConfirm={handleLogout}
      />
    </>
  );
}

/**
 * Example 5: Bulk Delete Operation
 * Destructive action with count information
 */
export function BulkDeleteExample() {
  const bulkDeleteDialog = useConfirmDialog();
  const [isDeleting, setIsDeleting] = useState(false);
  const selectedCount = 5;

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch('/api/v1/invoices/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: ['1', '2', '3', '4', '5'] }),
      });
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={bulkDeleteDialog.open}
        disabled={selectedCount === 0}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete {selectedCount} Selected
      </Button>

      <ConfirmDialog
        {...bulkDeleteDialog.props}
        variant="destructive"
        title={`Delete ${selectedCount} Invoices`}
        description={`You are about to delete ${selectedCount} invoices. This action cannot be undone. All associated data will be permanently removed.`}
        confirmLabel={`Delete ${selectedCount} Invoices`}
        cancelLabel="Cancel"
        onConfirm={handleBulkDelete}
        isLoading={isDeleting}
      />
    </>
  );
}

/**
 * Integration Guide:
 *
 * 1. Import the hook and component:
 *    import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';
 *
 * 2. Initialize the dialog hook in your component:
 *    const deleteDialog = useConfirmDialog();
 *
 * 3. Add the trigger button:
 *    <Button onClick={deleteDialog.open}>Delete</Button>
 *
 * 4. Add the ConfirmDialog component:
 *    <ConfirmDialog
 *      {...deleteDialog.props}
 *      variant="destructive"
 *      title="Delete Item"
 *      description="Are you sure?"
 *      onConfirm={handleDelete}
 *    />
 *
 * Variants:
 * - destructive: Red, for delete/remove operations
 * - warning: Orange, for risky actions (payments, data changes)
 * - info: Blue, for general confirmations (logout, navigate away)
 */
