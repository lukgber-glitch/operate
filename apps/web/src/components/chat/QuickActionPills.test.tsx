/**
 * QuickActionPills - Unit Tests (S4-05)
 *
 * Tests for context-aware quick action functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickActionPills, type QuickActionContext } from './QuickActionPills';

// Mock Next.js usePathname
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}));

// Mock GSAP
vi.mock('gsap', () => ({
  default: {
    context: vi.fn(() => ({
      revert: vi.fn(),
    })),
    fromTo: vi.fn(),
  },
}));

describe('QuickActionPills', () => {
  it('renders with default actions when no context provided', () => {
    const onActionClick = vi.fn();
    render(<QuickActionPills onActionClick={onActionClick} />);

    // Should show default actions
    expect(screen.getByText('Create Invoice')).toBeInTheDocument();
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('Tax Summary')).toBeInTheDocument();
  });

  it('renders context-specific actions for invoices', () => {
    const onActionClick = vi.fn();
    render(<QuickActionPills onActionClick={onActionClick} context="invoices" />);

    expect(screen.getByText('Create Invoice')).toBeInTheDocument();
    expect(screen.getByText('Send Reminders')).toBeInTheDocument();
    expect(screen.getByText('Revenue Report')).toBeInTheDocument();
    expect(screen.getByText('Overdue Invoices')).toBeInTheDocument();
  });

  it('renders context-specific actions for expenses', () => {
    const onActionClick = vi.fn();
    render(<QuickActionPills onActionClick={onActionClick} context="expenses" />);

    expect(screen.getByText('Add Expense')).toBeInTheDocument();
    expect(screen.getByText('Categorize All')).toBeInTheDocument();
    expect(screen.getByText('Tax Deductions')).toBeInTheDocument();
    expect(screen.getByText('Expense Report')).toBeInTheDocument();
  });

  it('renders context-specific actions for HR', () => {
    const onActionClick = vi.fn();
    render(<QuickActionPills onActionClick={onActionClick} context="hr" />);

    expect(screen.getByText('Run Payroll')).toBeInTheDocument();
    expect(screen.getByText('Request Leave')).toBeInTheDocument();
    expect(screen.getByText('Hire Employee')).toBeInTheDocument();
    expect(screen.getByText('Approve Leave')).toBeInTheDocument();
  });

  it('renders context-specific actions for banking', () => {
    const onActionClick = vi.fn();
    render(<QuickActionPills onActionClick={onActionClick} context="banking" />);

    expect(screen.getByText('Account Balance')).toBeInTheDocument();
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('Reconcile')).toBeInTheDocument();
  });

  it('renders context-specific actions for dashboard', () => {
    const onActionClick = vi.fn();
    render(<QuickActionPills onActionClick={onActionClick} context="dashboard" />);

    expect(screen.getByText('Daily Summary')).toBeInTheDocument();
    expect(screen.getByText('Pending Tasks')).toBeInTheDocument();
    expect(screen.getByText('Quick Insights')).toBeInTheDocument();
    expect(screen.getByText("Today's Agenda")).toBeInTheDocument();
  });

  it('renders context-specific actions for tax', () => {
    const onActionClick = vi.fn();
    render(<QuickActionPills onActionClick={onActionClick} context="tax" />);

    expect(screen.getByText('Tax Liability')).toBeInTheDocument();
    expect(screen.getByText('File Return')).toBeInTheDocument();
    expect(screen.getByText('Deductions')).toBeInTheDocument();
    expect(screen.getByText('Deadlines')).toBeInTheDocument();
  });

  it('calls onActionClick when a pill is clicked', () => {
    const onActionClick = vi.fn();
    render(<QuickActionPills onActionClick={onActionClick} context="invoices" />);

    const createInvoiceButton = screen.getByText('Create Invoice');
    fireEvent.click(createInvoiceButton);

    expect(onActionClick).toHaveBeenCalledWith('Create a new invoice');
  });

  it('prioritizes contextualActions over context prop', () => {
    const onActionClick = vi.fn();
    const customActions = [
      {
        icon: vi.fn() as any,
        label: 'Custom Action',
        action: 'This is custom',
      },
    ];

    render(
      <QuickActionPills
        onActionClick={onActionClick}
        context="invoices"
        contextualActions={customActions}
      />
    );

    expect(screen.getByText('Custom Action')).toBeInTheDocument();
    expect(screen.queryByText('Create Invoice')).not.toBeInTheDocument();
  });

  it('returns null when no actions are available', () => {
    const onActionClick = vi.fn();
    const { container } = render(
      <QuickActionPills onActionClick={onActionClick} contextualActions={[]} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders all context types without errors', () => {
    const onActionClick = vi.fn();
    const contexts: QuickActionContext[] = [
      'default',
      'dashboard',
      'invoices',
      'expenses',
      'hr',
      'banking',
      'tax',
      'vendors',
      'reports',
      'documents',
      'chat',
    ];

    contexts.forEach((context) => {
      const { unmount } = render(
        <QuickActionPills onActionClick={onActionClick} context={context} />
      );
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
      unmount();
    });
  });

  it('applies correct ARIA labels to pills', () => {
    const onActionClick = vi.fn();
    render(<QuickActionPills onActionClick={onActionClick} context="invoices" />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).toContain('Quick action:');
    });
  });

  it('renders both desktop and mobile versions', () => {
    const onActionClick = vi.fn();
    const { container } = render(
      <QuickActionPills onActionClick={onActionClick} context="invoices" />
    );

    // Desktop version
    const desktopContainer = container.querySelector('.hidden.md\\:block');
    expect(desktopContainer).toBeInTheDocument();

    // Mobile version
    const mobileContainer = container.querySelector('.md\\:hidden');
    expect(mobileContainer).toBeInTheDocument();
  });
});
