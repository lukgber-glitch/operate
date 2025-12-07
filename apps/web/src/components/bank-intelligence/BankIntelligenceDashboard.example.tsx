'use client';

/**
 * Bank Intelligence Dashboard Example
 *
 * This file demonstrates the dashboard with mock data for testing and development.
 * To use: Import and render in a development/storybook environment.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BankIntelligenceDashboard } from './BankIntelligenceDashboard';

// Mock data
const mockSummary = {
  currentBalance: 25432.00,
  currency: 'EUR',
  balanceChange: 2150.00,
  balanceChangePercent: 9.2,
  lowCashDate: '2025-12-21',
  lowCashAmount: 850.00,
  totalRecurringMonthly: 1234.00,
  unmatchedCount: 3,
  alertsCount: {
    critical: 1,
    warning: 2,
    info: 3,
  },
};

const mockCashFlow = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);
  const baseBalance = 25000 - (i * 200) + (Math.random() * 1000);

  return {
    date: date.toISOString().split('T')[0],
    balance: baseBalance,
    inflows: Math.random() > 0.7 ? Math.random() * 5000 : 0,
    outflows: Math.random() * 500 + 200,
    items: [
      'AWS Services',
      'Client Payment',
      'Office Supplies',
    ].slice(0, Math.floor(Math.random() * 3) + 1),
  };
});

const mockRecurring = [
  {
    id: 'rec_1',
    vendorName: 'AWS',
    amount: 299.00,
    currency: 'EUR',
    frequency: 'monthly' as const,
    nextDue: '2025-12-15',
    category: 'subscriptions',
    confidence: 0.95,
  },
  {
    id: 'rec_2',
    vendorName: 'GitHub Enterprise',
    amount: 45.00,
    currency: 'EUR',
    frequency: 'monthly' as const,
    nextDue: '2025-12-10',
    category: 'subscriptions',
    confidence: 0.92,
  },
  {
    id: 'rec_3',
    vendorName: 'Office Rent',
    amount: 890.00,
    currency: 'EUR',
    frequency: 'monthly' as const,
    nextDue: '2025-12-01',
    category: 'rent',
    confidence: 0.98,
  },
  {
    id: 'rec_4',
    vendorName: 'Electricity',
    amount: 120.00,
    currency: 'EUR',
    frequency: 'monthly' as const,
    nextDue: '2025-12-08',
    category: 'utilities',
    confidence: 0.88,
  },
];

const mockTaxLiability = {
  year: 2025,
  incomeTax: 14532.00,
  vat: 2850.00,
  solidaritySurcharge: 800.00,
  totalOwed: 18182.00,
  totalPaid: 10909.00,
  nextPaymentDue: '2026-01-10',
  nextPaymentAmount: 2850.00,
};

const mockTransactions = [
  {
    id: 'txn_1',
    date: '2025-12-05',
    description: 'AWS Services',
    amount: -299.00,
    currency: 'EUR',
    category: 'Cloud Services',
    taxCategory: 'Operating Expenses',
    confidence: 0.95,
  },
  {
    id: 'txn_2',
    date: '2025-12-04',
    description: 'Client ABC Corp - Project Payment',
    amount: 5000.00,
    currency: 'EUR',
    category: 'Revenue',
    taxCategory: 'Income',
    confidence: 0.98,
    matchedTo: {
      type: 'invoice' as const,
      id: 'inv_123',
      reference: 'INV-2025-123',
    },
  },
  {
    id: 'txn_3',
    date: '2025-12-03',
    description: 'Office Supplies - Staples',
    amount: -150.00,
    currency: 'EUR',
    category: 'Office Expenses',
    taxCategory: 'Operating Expenses',
    confidence: 0.72,
  },
  {
    id: 'txn_4',
    date: '2025-12-02',
    description: 'Client XYZ Ltd',
    amount: 3200.00,
    currency: 'EUR',
    category: 'Revenue',
    taxCategory: 'Income',
    confidence: 0.91,
  },
  {
    id: 'txn_5',
    date: '2025-12-01',
    description: 'GitHub Enterprise',
    amount: -45.00,
    currency: 'EUR',
    category: 'Software Subscriptions',
    taxCategory: 'Operating Expenses',
    confidence: 0.96,
    matchedTo: {
      type: 'bill' as const,
      id: 'bill_456',
      reference: 'BILL-2025-456',
    },
  },
];

const mockUnmatched = {
  incoming: [
    {
      id: 'unm_1',
      transactionId: 'txn_100',
      date: '2025-12-03',
      description: 'Payment from XYZ Ltd',
      amount: 1500.00,
      currency: 'EUR',
      type: 'incoming' as const,
      suggestedMatches: [
        {
          id: 'inv_456',
          type: 'invoice' as const,
          reference: 'INV-2025-456',
          amount: 1500.00,
          date: '2025-11-28',
          confidence: 0.89,
          clientOrVendor: 'XYZ Ltd',
        },
      ],
    },
    {
      id: 'unm_2',
      transactionId: 'txn_101',
      date: '2025-12-01',
      description: 'Wire Transfer - Unknown',
      amount: 2200.00,
      currency: 'EUR',
      type: 'incoming' as const,
      suggestedMatches: [],
    },
  ],
  outgoing: [
    {
      id: 'unm_3',
      transactionId: 'txn_102',
      date: '2025-12-02',
      description: 'Office Depot',
      amount: -150.00,
      currency: 'EUR',
      type: 'outgoing' as const,
      suggestedMatches: [
        {
          id: 'bill_789',
          type: 'bill' as const,
          reference: 'BILL-2025-789',
          amount: 150.00,
          date: '2025-12-01',
          confidence: 0.92,
          clientOrVendor: 'Office Depot',
        },
      ],
    },
  ],
};

const mockAlerts = [
  {
    id: 'alert_1',
    type: 'low_balance' as const,
    severity: 'critical' as const,
    title: 'Low Cash Warning',
    message: 'Your balance will drop below €1,000 in 14 days. Consider reviewing upcoming expenses.',
    date: '2025-12-21',
    action: {
      label: 'View Cash Flow',
      href: '/bank-intelligence',
    },
    dismissible: false,
  },
  {
    id: 'alert_2',
    type: 'tax_deadline' as const,
    severity: 'warning' as const,
    title: 'VAT Payment Due',
    message: 'VAT payment of €2,850 is due on January 10, 2026',
    date: '2026-01-10',
    action: {
      label: 'View Tax Status',
      href: '/tax',
    },
    dismissible: true,
  },
  {
    id: 'alert_3',
    type: 'unmatched' as const,
    severity: 'info' as const,
    title: 'Unmatched Transactions',
    message: 'You have 2 unmatched incoming payments totaling €3,700',
    date: '2025-12-07',
    action: {
      label: 'Match Payments',
      href: '/reconciliation',
    },
    dismissible: true,
  },
];

// Create a query client with mock data
const createMockQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        queryFn: async ({ queryKey }) => {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 500));

          // Return mock data based on query key
          if (queryKey.includes('summary')) {
            return mockSummary;
          }
          if (queryKey.includes('cash-flow')) {
            return mockCashFlow;
          }
          if (queryKey.includes('recurring')) {
            return mockRecurring;
          }
          if (queryKey.includes('tax-liability')) {
            return mockTaxLiability;
          }
          if (queryKey.includes('transactions')) {
            return mockTransactions;
          }
          if (queryKey.includes('unmatched')) {
            return mockUnmatched;
          }
          if (queryKey.includes('alerts')) {
            return mockAlerts;
          }

          return null;
        },
      },
      mutations: {
        mutationFn: async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
          return { success: true };
        },
      },
    },
  });
};

/**
 * Example component showing the dashboard with mock data
 */
export function BankIntelligenceDashboardExample() {
  const queryClient = createMockQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background p-6">
        <BankIntelligenceDashboard />
      </div>
    </QueryClientProvider>
  );
}

/**
 * Usage:
 *
 * import { BankIntelligenceDashboardExample } from '@/components/bank-intelligence/BankIntelligenceDashboard.example';
 *
 * export default function DemoPage() {
 *   return <BankIntelligenceDashboardExample />;
 * }
 */
