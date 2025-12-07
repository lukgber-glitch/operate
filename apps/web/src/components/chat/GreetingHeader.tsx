'use client';

import { useAuth } from '@/hooks/use-auth';
import { HeadlineOutside } from '@/components/ui/headline-outside';

/**
 * Get time-based greeting message
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * GreetingHeader - Dynamic greeting for chat page
 *
 * Features:
 * - Time-based greeting (morning/afternoon/evening)
 * - Personalized with user's first name
 * - Subtle fade-in animation on page load
 * - Uses HeadlineOutside component for consistent styling
 * - Graceful fallback if no user session
 *
 * @example
 * ```tsx
 * <GreetingHeader />
 * // Renders: "Good morning, Alex"
 * ```
 */
export function GreetingHeader() {
  const { user } = useAuth();

  // Extract first name from user object
  const firstName = user?.firstName || 'there';
  const greeting = getGreeting();

  return (
    <HeadlineOutside className="animate-fade-in">
      {greeting}, {firstName}
    </HeadlineOutside>
  );
}
