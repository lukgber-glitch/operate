/**
 * Bank Intelligence Dashboard - Export Index
 */

export { BankIntelligenceDashboard } from './BankIntelligenceDashboard';
export { CashFlowChart } from './CashFlowChart';
export { RecurringExpensesList } from './RecurringExpensesList';
export { TaxLiabilityCard } from './TaxLiabilityCard';
export { TransactionClassificationTable } from './TransactionClassificationTable';
export { InvoiceMatchingWidget } from './InvoiceMatchingWidget';
export { BillMatchingWidget } from './BillMatchingWidget';
export { BankIntelligenceAlerts } from './BankIntelligenceAlerts';

export {
  useCashFlowForecast,
  useRecurringExpenses,
  useTaxLiability,
  useRecentTransactions,
  useUnmatchedPayments,
  useBankAlerts,
  useBankIntelligenceSummary,
  useConfirmMatch,
  useReclassifyTransaction,
  useDismissAlert,
} from './useBankIntelligence';

export type * from './types';
