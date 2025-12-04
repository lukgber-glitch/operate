/**
 * Page Context Configuration
 * Maps page routes to context types and suggested actions
 */

import { PageContextConfig } from './context.types';

export const PAGE_CONTEXTS: PageContextConfig[] = [
  // Dashboard
  {
    pattern: /^\/dashboard\/?$/,
    type: 'dashboard',
    description: 'Main dashboard overview',
    relevantEntityTypes: ['invoice', 'expense', 'organization'],
    defaultSuggestions: [
      'Show me this month\'s revenue summary',
      'What expenses need approval?',
      'Generate financial report',
      'Show outstanding invoices',
      'What are my tax obligations this quarter?',
    ],
    availableActions: [
      'create-invoice',
      'create-expense',
      'view-reports',
      'export-data',
    ],
  },

  // Invoices
  {
    pattern: /^\/invoices\/?$/,
    type: 'invoice-list',
    description: 'Invoice list page',
    relevantEntityTypes: ['invoice'],
    defaultSuggestions: [
      'Show overdue invoices',
      'Create a new invoice',
      'Which invoices are due this week?',
      'Calculate total outstanding amount',
      'Send payment reminders for overdue invoices',
    ],
    availableActions: ['create-invoice', 'filter-invoices', 'export-invoices'],
  },

  {
    pattern: /^\/invoices\/([a-zA-Z0-9_-]+)\/?$/,
    type: 'invoice-detail',
    description: 'Invoice details page',
    relevantEntityTypes: ['invoice'],
    defaultSuggestions: [
      'Send payment reminder for this invoice',
      'Mark this invoice as paid',
      'Create credit note for this invoice',
      'Download invoice PDF',
      'View customer details',
    ],
    availableActions: [
      'send-reminder',
      'mark-paid',
      'create-credit-note',
      'download-pdf',
      'edit-invoice',
    ],
  },

  // Expenses
  {
    pattern: /^\/expenses\/?$/,
    type: 'expense-list',
    description: 'Expense list page',
    relevantEntityTypes: ['expense'],
    defaultSuggestions: [
      'Show expenses pending approval',
      'Create a new expense',
      'What\'s my total spending this month?',
      'Which expenses are tax deductible?',
      'Export expenses for tax filing',
    ],
    availableActions: ['create-expense', 'filter-expenses', 'export-expenses'],
  },

  {
    pattern: /^\/expenses\/([a-zA-Z0-9_-]+)\/?$/,
    type: 'expense-detail',
    description: 'Expense details page',
    relevantEntityTypes: ['expense'],
    defaultSuggestions: [
      'Approve this expense',
      'Mark as reimbursed',
      'Request receipt upload',
      'Categorize this expense',
      'Check if this expense is tax deductible',
    ],
    availableActions: [
      'approve-expense',
      'reject-expense',
      'mark-reimbursed',
      'upload-receipt',
      'edit-expense',
    ],
  },

  // Tax
  {
    pattern: /^\/tax\/?$/,
    type: 'tax-overview',
    description: 'Tax overview page',
    relevantEntityTypes: ['tax-summary', 'invoice', 'expense'],
    defaultSuggestions: [
      'Calculate VAT for this quarter',
      'Show tax obligations for this year',
      'Prepare VAT return documents',
      'What are my upcoming tax deadlines?',
      'Compare tax payments with last year',
    ],
    availableActions: [
      'calculate-vat',
      'file-vat-return',
      'export-tax-report',
      'schedule-payment',
    ],
  },

  {
    pattern: /^\/tax\/vat\/?$/,
    type: 'vat-dashboard',
    description: 'VAT management page',
    relevantEntityTypes: ['tax-summary'],
    defaultSuggestions: [
      'File VAT return for current quarter',
      'Calculate net VAT payable',
      'Show transactions with reverse charge',
      'Export VAT data for ELSTER',
      'What\'s my VAT refund amount?',
    ],
    availableActions: [
      'file-vat-return',
      'calculate-vat',
      'export-elster',
      'view-transactions',
    ],
  },

  // Reports
  {
    pattern: /^\/reports\/?$/,
    type: 'reports-overview',
    description: 'Financial reports page',
    relevantEntityTypes: ['organization', 'invoice', 'expense'],
    defaultSuggestions: [
      'Generate profit and loss statement',
      'Show revenue by customer',
      'Export financial data',
      'Create custom report',
      'Compare this month with last month',
    ],
    availableActions: [
      'generate-pl',
      'generate-balance-sheet',
      'create-custom-report',
      'export-data',
    ],
  },

  // Settings
  {
    pattern: /^\/settings\/?$/,
    type: 'settings',
    description: 'Organization settings page',
    relevantEntityTypes: ['organization'],
    defaultSuggestions: [
      'Update tax settings',
      'Configure invoice templates',
      'Set up integrations',
      'Manage team members',
      'Review subscription plan',
    ],
    availableActions: [
      'update-settings',
      'manage-integrations',
      'manage-users',
      'update-plan',
    ],
  },

  // HR (if enabled)
  {
    pattern: /^\/hr\/employees\/?$/,
    type: 'employee-list',
    description: 'Employee list page',
    relevantEntityTypes: ['employee'],
    defaultSuggestions: [
      'Show active employees',
      'Create new employee',
      'Review pending leave requests',
      'Generate payroll report',
      'View employee contracts',
    ],
    availableActions: [
      'create-employee',
      'approve-leave',
      'run-payroll',
      'export-employee-data',
    ],
  },

  // Fallback for unknown pages
  {
    pattern: /.*/,
    type: 'general',
    description: 'General page',
    relevantEntityTypes: [],
    defaultSuggestions: [
      'What can you help me with?',
      'Show me my dashboard overview',
      'What tasks need my attention?',
      'Help me understand my financial status',
    ],
    availableActions: ['navigate', 'search', 'help'],
  },
];

/**
 * Find matching page context for a route
 */
export function getPageContextConfig(route: string): PageContextConfig {
  // Find first matching pattern
  const match = PAGE_CONTEXTS.find(config => config.pattern.test(route));
  return match || PAGE_CONTEXTS[PAGE_CONTEXTS.length - 1]; // Return general as fallback
}

/**
 * Extract entity ID from route if present
 */
export function extractEntityIdFromRoute(
  route: string,
): { entityType?: string; entityId?: string } {
  // Invoice detail: /invoices/:id
  const invoiceMatch = route.match(/^\/invoices\/([a-zA-Z0-9_-]+)\/?$/);
  if (invoiceMatch) {
    return { entityType: 'invoice', entityId: invoiceMatch[1] };
  }

  // Expense detail: /expenses/:id
  const expenseMatch = route.match(/^\/expenses\/([a-zA-Z0-9_-]+)\/?$/);
  if (expenseMatch) {
    return { entityType: 'expense', entityId: expenseMatch[1] };
  }

  // Employee detail: /hr/employees/:id
  const employeeMatch = route.match(/^\/hr\/employees\/([a-zA-Z0-9_-]+)\/?$/);
  if (employeeMatch) {
    return { entityType: 'employee', entityId: employeeMatch[1] };
  }

  // Add more patterns as needed

  return {};
}
