'use client';

import { useAuth } from '@/hooks/use-auth';

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
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {greeting}, {firstName}
      </h1>
    </div>
  );
}
