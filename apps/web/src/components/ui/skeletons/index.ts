/**
 * Skeleton Components Index
 *
 * Comprehensive loading skeleton components for all UI areas
 *
 * Usage:
 * - Import specific skeletons as needed
 * - Use during data fetching/loading states
 * - Match dimensions/layout of actual components
 */

// Base skeleton
export { Skeleton } from './Skeleton';

// Chat skeletons
export {
  ChatMessageSkeleton,
  ChatMessageListSkeleton,
} from './ChatMessageSkeleton';

// Suggestion skeletons
export {
  SuggestionCardSkeleton,
  SuggestionCardListSkeleton,
} from './SuggestionCardSkeleton';

// Conversation skeletons
export {
  ConversationItemSkeleton,
  ConversationListSkeleton,
} from './ConversationItemSkeleton';

// Dashboard skeletons
export {
  DashboardWidgetSkeleton,
  DashboardGridSkeleton,
} from './DashboardWidgetSkeleton';

// Onboarding skeletons
export {
  OnboardingStepSkeleton,
  OnboardingWelcomeSkeleton,
  OnboardingCompletionSkeleton,
} from './OnboardingStepSkeleton';

// Navigation skeletons
export {
  NavItemSkeleton,
  NavMenuSkeleton,
  SidebarSkeleton,
} from './NavItemSkeleton';

// Type exports
export type { ChatMessageSkeletonProps } from './ChatMessageSkeleton';
export type { SuggestionCardSkeletonProps } from './SuggestionCardSkeleton';
export type { DashboardWidgetSkeletonProps } from './DashboardWidgetSkeleton';
export type { OnboardingStepSkeletonProps } from './OnboardingStepSkeleton';
export type { NavItemSkeletonProps } from './NavItemSkeleton';
