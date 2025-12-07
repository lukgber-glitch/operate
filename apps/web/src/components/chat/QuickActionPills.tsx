'use client';

import { useRef, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  FileText,
  TrendingUp,
  Calculator,
  Mail,
  Building2,
  LucideIcon,
  Receipt,
  Send,
  DollarSign,
  CreditCard,
  Users,
  Calendar,
  Clock,
  FileCheck,
  AlertCircle,
  PieChart,
  Home,
  Search,
  FileSpreadsheet,
  BellRing,
} from 'lucide-react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

export interface QuickAction {
  icon: LucideIcon;
  label: string;
  action: string;
}

export type QuickActionContext =
  | 'invoices'
  | 'expenses'
  | 'hr'
  | 'dashboard'
  | 'banking'
  | 'tax'
  | 'vendors'
  | 'reports'
  | 'documents'
  | 'chat'
  | 'default';

interface QuickActionPillsProps {
  onActionClick: (action: string) => void;
  contextualActions?: QuickAction[];
  context?: QuickActionContext;
  className?: string;
}

/**
 * QuickActionPills - Contextual action suggestions above chat input
 *
 * Features (S4-05):
 * - Horizontal scrollable row of action pills
 * - Context-aware actions based on current page/route
 * - Automatic route detection via usePathname
 * - Click fills the chat input with the action text
 * - Smooth GSAP stagger animation on context change
 * - Design system compliant with CSS custom properties
 * - Touch-friendly with native scroll on mobile
 */

// Context-based action sets
const contextActions: Record<QuickActionContext, QuickAction[]> = {
  invoices: [
    { icon: FileText, label: 'Create Invoice', action: 'Create a new invoice' },
    { icon: Send, label: 'Send Reminders', action: 'Send payment reminders for overdue invoices' },
    { icon: PieChart, label: 'Revenue Report', action: 'Show revenue report for this month' },
    { icon: AlertCircle, label: 'Overdue Invoices', action: 'Show all overdue invoices' },
  ],
  expenses: [
    { icon: Receipt, label: 'Add Expense', action: 'Add a new expense' },
    { icon: FileCheck, label: 'Categorize All', action: 'Auto-categorize uncategorized expenses' },
    { icon: Calculator, label: 'Tax Deductions', action: 'Show available tax deductions' },
    { icon: PieChart, label: 'Expense Report', action: 'Generate expense report for this month' },
  ],
  hr: [
    { icon: DollarSign, label: 'Run Payroll', action: 'Run payroll for this period' },
    { icon: Calendar, label: 'Request Leave', action: 'Submit a leave request' },
    { icon: Users, label: 'Hire Employee', action: 'Start hiring a new employee' },
    { icon: Clock, label: 'Approve Leave', action: 'Show pending leave requests' },
  ],
  banking: [
    { icon: Building2, label: 'Account Balance', action: 'Show all bank account balances' },
    { icon: CreditCard, label: 'Recent Transactions', action: 'Show recent bank transactions' },
    { icon: TrendingUp, label: 'Cash Flow', action: 'Show cash flow forecast' },
    { icon: FileCheck, label: 'Reconcile', action: 'Start bank reconciliation' },
  ],
  dashboard: [
    { icon: Home, label: 'Daily Summary', action: 'Give me a daily business summary' },
    { icon: BellRing, label: 'Pending Tasks', action: 'Show all pending tasks and alerts' },
    { icon: TrendingUp, label: 'Quick Insights', action: 'Show key business insights' },
    { icon: Calendar, label: "Today's Agenda", action: "What's on my agenda today?" },
  ],
  tax: [
    { icon: Calculator, label: 'Tax Liability', action: 'What is my current tax liability?' },
    { icon: FileText, label: 'File Return', action: 'Start tax return filing' },
    { icon: Receipt, label: 'Deductions', action: 'Show all tax deductions' },
    { icon: Calendar, label: 'Deadlines', action: 'Show upcoming tax deadlines' },
  ],
  vendors: [
    { icon: Building2, label: 'All Vendors', action: 'Show all vendors' },
    { icon: FileText, label: 'Pending Bills', action: 'Show pending vendor bills' },
    { icon: DollarSign, label: 'Pay Bills', action: 'Show bills ready to pay' },
    { icon: Users, label: 'Add Vendor', action: 'Add a new vendor' },
  ],
  reports: [
    { icon: FileSpreadsheet, label: 'P&L Report', action: 'Generate profit & loss report' },
    { icon: PieChart, label: 'Balance Sheet', action: 'Show balance sheet' },
    { icon: TrendingUp, label: 'Cash Flow', action: 'Show cash flow statement' },
    { icon: FileText, label: 'Export Reports', action: 'Export financial reports' },
  ],
  documents: [
    { icon: Search, label: 'Search Docs', action: 'Search documents' },
    { icon: FileText, label: 'Recent Files', action: 'Show recent documents' },
    { icon: FileCheck, label: 'Tax Documents', action: 'Show tax-related documents' },
    { icon: Receipt, label: 'Receipts', action: 'Show all expense receipts' },
  ],
  chat: [
    { icon: FileText, label: 'Invoices', action: 'Show my invoices' },
    { icon: TrendingUp, label: 'Cash Flow', action: 'Show cash flow forecast' },
    { icon: Calculator, label: 'Tax Summary', action: 'What is my tax liability?' },
    { icon: Building2, label: 'Bank Summary', action: 'Show bank account summary' },
  ],
  default: [
    { icon: FileText, label: 'Create Invoice', action: 'Create a new invoice' },
    { icon: TrendingUp, label: 'Cash Flow', action: 'Show my cash flow forecast' },
    { icon: Calculator, label: 'Tax Summary', action: 'What is my current tax liability?' },
    { icon: Mail, label: 'Email Insights', action: 'Summarize my recent business emails' },
    { icon: Building2, label: 'Bank Summary', action: 'Show my bank account summary' },
  ],
};

/**
 * Detect context from current route pathname
 */
function detectContextFromRoute(pathname: string | null): QuickActionContext {
  if (!pathname) return 'default';

  // Remove leading slash and convert to lowercase
  const path = pathname.replace(/^\//, '').toLowerCase();

  // Map routes to contexts
  if (path.includes('invoice')) return 'invoices';
  if (path.includes('expense')) return 'expenses';
  if (path.includes('finance')) return 'expenses'; // Finance includes expenses
  if (path.includes('hr') || path.includes('payroll')) return 'hr';
  if (path.includes('bank')) return 'banking';
  if (path.includes('tax')) return 'tax';
  if (path.includes('vendor')) return 'vendors';
  if (path.includes('report')) return 'reports';
  if (path.includes('document')) return 'documents';
  if (path.includes('chat')) return 'chat';
  if (path === 'dashboard' || path === '') return 'dashboard';

  return 'default';
}

export function QuickActionPills({
  onActionClick,
  contextualActions,
  context,
  className,
}: QuickActionPillsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Determine which actions to show (priority order):
  // 1. Explicitly provided contextualActions
  // 2. Explicitly provided context
  // 3. Auto-detected context from route
  const actions =
    contextualActions && contextualActions.length > 0
      ? contextualActions
      : context
      ? contextActions[context]
      : contextActions[detectContextFromRoute(pathname)];

  // GSAP stagger animation on mount/update
  // Re-animates when actions change (context switch)
  useLayoutEffect(() => {
    if (!containerRef.current || !actions.length) return;

    const ctx = gsap.context(() => {
      const pills = containerRef.current?.querySelectorAll('.quick-action-pill');
      if (!pills || pills.length === 0) return;

      // Smooth fade-in and slide-up with stagger
      gsap.fromTo(
        pills,
        {
          opacity: 0,
          scale: 0.85,
          y: 8,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.06,
          ease: 'back.out(1.4)',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [actions]); // Re-run when actions change (context switch)

  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'py-2 px-3 md:px-4 border-t',
        className
      )}
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Desktop: ScrollArea with subtle scrollbar */}
      <div className="hidden md:block">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-rounded pb-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={`${action.action}-${index}`}
                onClick={() => onActionClick(action.action)}
                className={cn(
                  'quick-action-pill',
                  'inline-flex items-center gap-2',
                  'px-4 py-2',
                  'rounded-lg',
                  'text-sm font-medium',
                  'whitespace-nowrap',
                  'cursor-pointer',
                  'transition-all',
                  'hover:scale-105',
                  'active:scale-95',
                  'focus:outline-none focus:ring-2',
                  'bg-[#06BF9D]/10 text-[#048A71]',
                  'hover:bg-[#06BF9D] hover:text-white',
                )}
                style={{
                  borderRadius: '8px',
                  fontSize: 'var(--font-size-sm)',
                  padding: '8px 16px',
                  gap: 'var(--space-2)',
                  transition: 'var(--transition-fast)',
                }}
                aria-label={`Quick action: ${action.label}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: Native horizontal scroll with snap */}
      <div className="md:hidden -mx-3">
        <div
          className="flex gap-2 px-3 pb-2 overflow-x-auto snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={`${action.action}-${index}`}
                onClick={() => onActionClick(action.action)}
                className={cn(
                  'quick-action-pill',
                  'inline-flex items-center gap-2',
                  'px-4 py-2.5',
                  'rounded-lg',
                  'text-sm font-medium',
                  'whitespace-nowrap',
                  'cursor-pointer',
                  'transition-all',
                  'snap-start',
                  'active:scale-95',
                  'min-h-[44px]', // Touch-friendly
                  'bg-[#06BF9D]/10 text-[#048A71]',
                  'hover:bg-[#06BF9D] hover:text-white',
                )}
                style={{
                  borderRadius: '8px',
                  fontSize: 'var(--font-size-sm)',
                  padding: '10px 16px',
                  gap: 'var(--space-2)',
                  transition: 'var(--transition-fast)',
                }}
                aria-label={`Quick action: ${action.label}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional: Scroll hint for desktop */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: var(--radius-full);
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: var(--color-text-muted);
        }

        /* Focus effect */
        .quick-action-pill:focus-visible {
          outline: 2px solid #06BF9D;
          outline-offset: 2px;
        }

        /* Hide scrollbar on mobile */
        .md\\:hidden > div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
