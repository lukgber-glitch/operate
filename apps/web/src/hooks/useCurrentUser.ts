'use client';

import { useMemo } from 'react';
import { useAuth } from './use-auth';

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  avatarUrl?: string;
  role: string;
  orgId?: string;
  locale?: string;
}

/**
 * Hook to get the current user information
 * Returns user data from the auth context with computed fields
 *
 * OPTIMIZATION: Uses useMemo to prevent unnecessary recalculations
 * of computed fields (fullName, initials) on every render
 */
export function useCurrentUser() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Memoize the current user object to prevent re-renders
  // Dependencies: user object properties that affect computed values
  const currentUser = useMemo<CurrentUser | null>(() => {
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      initials: `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase(),
      avatarUrl: undefined, // Will be added when avatar support is implemented
      role: user.role,
      orgId: user.orgId,
      locale: 'en', // Default locale, will be updated when user preferences are implemented
    };
  }, [user?.id, user?.email, user?.firstName, user?.lastName, user?.role, user?.orgId]);

  // Memoize the return object to provide stable references
  return useMemo(() => ({
    user: currentUser,
    isLoading,
    isAuthenticated,
  }), [currentUser, isLoading, isAuthenticated]);
}
