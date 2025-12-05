/**
 * Lazy-loaded components for code splitting
 *
 * This module exports dynamically imported components to reduce initial bundle size.
 * Components are loaded on-demand with loading states.
 */

import dynamic from 'next/dynamic';
import type { ComponentType, ReactElement } from 'react';

// Loading component for lazy components
export { LoadingSkeleton } from './LoadingSkeleton';
export { ChartSkeleton } from './ChartSkeleton';
export { ModalSkeleton } from './ModalSkeleton';
export { DashboardSkeleton } from './DashboardSkeleton';

// ============================================================================
// Dashboard Components
// ============================================================================

export const CashFlowChartWidget = dynamic(
  () => import('@/components/dashboard/CashFlowChartWidget').then((mod) => mod.CashFlowChartWidget),
  {
    loading: () => null, // Chart skeleton handled internally
    ssr: false, // Charts don't need SSR
  }
);

export const AIInsightsCard = dynamic(
  () => import('@/components/dashboard/AIInsightsCard').then((mod) => mod.AIInsightsCard),
  {
    loading: () => null,
    ssr: false,
  }
);

export const DashboardCustomizer = dynamic(
  () => import('@/components/dashboard/customization/DashboardCustomizer').then((mod) => mod.DashboardCustomizer),
  {
    loading: () => null,
    ssr: false,
  }
);

// ============================================================================
// Chart Components (Heavy - Recharts)
// ============================================================================

export const CashFlowChart = dynamic(
  () => import('@/components/dashboard/charts/CashFlowChart').then((mod) => ({ default: mod.CashFlowChart })),
  {
    loading: () => null,
    ssr: false,
  }
);

export const MrrChart = dynamic(
  () => import('@/components/admin/subscriptions/MrrChart').then((mod) => ({ default: mod.MrrChart })),
  {
    loading: () => null,
    ssr: false,
  }
);

export const RevenueByTierChart = dynamic(
  () => import('@/components/admin/subscriptions/RevenueByTierChart').then((mod) => ({ default: mod.RevenueByTierChart })),
  {
    loading: () => null,
    ssr: false,
  }
);

// ============================================================================
// Report Components
// ============================================================================

export const ClientMetrics = dynamic(
  () => import('@/components/reports/ClientMetrics').then((mod) => mod.ClientMetrics),
  {
    loading: () => null,
  }
);

export const FinancialOverview = dynamic(
  () => import('@/components/reports/FinancialOverview').then((mod) => mod.FinancialOverview),
  {
    loading: () => null,
  }
);

export const TaxSummary = dynamic(
  () => import('@/components/reports/TaxSummary').then((mod) => mod.TaxSummary),
  {
    loading: () => null,
  }
);

export const DocumentStats = dynamic(
  () => import('@/components/reports/DocumentStats').then((mod) => mod.DocumentStats),
  {
    loading: () => null,
  }
);

// ============================================================================
// Modal/Dialog Components
// ============================================================================

export const AddClientDialog = dynamic(
  () => import('@/components/clients/AddClientDialog').then((mod) => mod.AddClientDialog),
  {
    loading: () => null,
  }
);

export const EditClientDialog = dynamic(
  () => import('@/components/clients/EditClientDialog').then((mod) => mod.EditClientDialog),
  {
    loading: () => null,
  }
);

export const RecordPaymentDialog = dynamic(
  () => import('@/components/clients/RecordPaymentDialog').then((mod) => mod.RecordPaymentDialog),
  {
    loading: () => null,
  }
);

export const AddConnectionDialog = dynamic(
  () => import('@/components/connections/AddConnectionDialog').then((mod) => mod.AddConnectionDialog),
  {
    loading: () => null,
  }
);

// TODO: Create ConnectBankModal component
// export const ConnectBankModal = dynamic(
//   () => import('@/components/finance/bank-accounts/components/ConnectBankModal').then((mod) => mod.ConnectBankModal),
//   {
//     loading: () => null,
//   }
// );

// ============================================================================
// Command Palette
// ============================================================================

export const CommandPaletteModal = dynamic(
  () => import('@/components/command-palette/CommandPaletteModal').then((mod) => mod.CommandPaletteModal),
  {
    loading: () => null,
  }
);

// ============================================================================
// Data Tables
// ============================================================================

export const ClientDataTable = dynamic(
  () => import('@/components/clients/ClientDataTable').then((mod) => mod.ClientDataTable),
  {
    loading: () => null,
  }
);

export const SubscriptionTable = dynamic(
  () => import('@/components/admin/subscriptions/SubscriptionTable').then((mod) => mod.SubscriptionTable),
  {
    loading: () => null,
  }
);

// ============================================================================
// Email Components
// ============================================================================

// TODO: Create EmailComposer component
// export const EmailComposer = dynamic(
//   () => import('@/components/email/EmailComposer').then((mod) => mod.EmailComposer),
//   {
//     loading: () => null,
//   }
// );

// TODO: Create EmailTemplateEditor component
// export const EmailTemplateEditor = dynamic(
//   () => import('@/components/email/EmailTemplateEditor').then((mod) => mod.EmailTemplateEditor),
//   {
//     loading: () => null,
//   }
// );

// ============================================================================
// Voice Input (if using speech recognition)
// ============================================================================

export const VoiceRecorder = dynamic(
  () => import('@/components/chat/voice/VoiceRecorder').then((mod) => mod.VoiceRecorder),
  {
    loading: () => null,
    ssr: false,
  }
);

// ============================================================================
// Currency Components
// ============================================================================

export const CurrencyConverter = dynamic(
  () => import('@/components/currency/CurrencyConverter').then((mod) => mod.CurrencyConverter),
  {
    loading: () => null,
  }
);

// ============================================================================
// Helper function to create lazy component with custom loading
// ============================================================================

interface LazyOptions {
  loading?: () => ReactElement | null;
  ssr?: boolean;
}

export function createLazy<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  options?: LazyOptions
) {
  return dynamic(
    async () => {
      const mod = await importFn();
      return 'default' in mod ? mod : { default: mod as T };
    },
    {
      loading: options?.loading,
      ssr: options?.ssr ?? true,
    }
  );
}
