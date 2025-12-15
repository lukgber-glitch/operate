/**
 * Wizard Panels for Side Panel Integration
 *
 * These panels provide step-by-step guided workflows that integrate with the chat interface.
 * Chat can initiate these wizards and provide contextual guidance as users progress through steps.
 */

// Types
export type {
  WizardStep,
  WizardPanelProps,
  LineItem,
  InvoiceFormData,
  CreatedInvoice,
  ExpenseFormData,
  CreatedExpense,
  ClientFormData,
  CreatedClient,
  LeaveRequestFormData,
  CreatedLeaveRequest,
} from './types';

// Wizard Panels
export { InvoiceBuilderPanel } from './InvoiceBuilderPanel';
export { ExpenseFormPanel } from './ExpenseFormPanel';
export { ClientFormPanel } from './ClientFormPanel';
export { LeaveRequestPanel } from './LeaveRequestPanel';
export { WizardPanelContainer } from './WizardPanelContainer';

/**
 * Wizard Configuration
 *
 * Maps wizard types to their components and metadata for dynamic rendering.
 */
export const WIZARD_CONFIG = {
  invoice: {
    component: 'InvoiceBuilderPanel',
    title: 'Create Invoice',
    description: 'Create a new invoice with line items',
    steps: 4,
    chatTriggers: ['create invoice', 'new invoice', 'invoice builder'],
  },
  expense: {
    component: 'ExpenseFormPanel',
    title: 'Add Expense',
    description: 'Record a new business expense',
    steps: 3,
    chatTriggers: ['add expense', 'record expense', 'log expense', 'new expense'],
  },
  client: {
    component: 'ClientFormPanel',
    title: 'Add Client',
    description: 'Add a new client to your contacts',
    steps: 4,
    chatTriggers: ['add client', 'new client', 'create client'],
  },
  vendor: {
    component: 'ClientFormPanel',
    title: 'Add Vendor',
    description: 'Add a new vendor/supplier',
    steps: 4,
    chatTriggers: ['add vendor', 'new vendor', 'add supplier'],
  },
  leave: {
    component: 'LeaveRequestPanel',
    title: 'Request Leave',
    description: 'Submit a leave request',
    steps: 3,
    chatTriggers: ['request leave', 'time off', 'vacation request', 'sick leave'],
  },
} as const;

export type WizardType = keyof typeof WIZARD_CONFIG;
