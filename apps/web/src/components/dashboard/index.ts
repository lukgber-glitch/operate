/**
 * Dashboard Components
 * Export all dashboard-related components
 */

// Main AI Insights Card
export { AIInsightsCard } from './AIInsightsCard';

// Insight Components
export {
  InsightItem,
  EmptyInsightsState,
  InsightsCategoryBadge,
  InsightsCompactList,
} from './insights';

// Existing Dashboard Components
export { Breadcrumbs } from './breadcrumbs';
export { Header } from './header';
export { MinimalHeader } from './MinimalHeader'; // Phase 3: Chat-centric minimal header
export { MobileNav } from './mobile-nav';
export { NavItem } from './nav-item';
export { OrgSwitcher } from './org-switcher';
export { Sidebar } from './sidebar';
export { UserMenu } from './user-menu';

// Financial Dashboard Widget Components
export { CashBalanceCard } from './CashBalanceCard';
export { ArApSummaryCard } from './ArApSummaryCard';
export { RunwayCard } from './RunwayCard';
export { RevenueChart } from './RevenueChart';
export { ExpenseBreakdown } from './ExpenseBreakdown';
export { UpcomingItems } from './UpcomingItems';
export { QuickActions } from './QuickActions';
export { EmailReviewQueue } from './EmailReviewQueue';
