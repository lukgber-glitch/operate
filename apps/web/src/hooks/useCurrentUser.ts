'use client';

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
 */
export function useCurrentUser() {
  const { user, isLoading, isAuthenticated } = useAuth();

  const currentUser: CurrentUser | null = user
    ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        initials: `${user.firstName[0]}${user.lastName[0]}`.toUpperCase(),
        avatarUrl: undefined, // Will be added when avatar support is implemented
        role: user.role,
        orgId: user.orgId,
        locale: 'en', // Default locale, will be updated when user preferences are implemented
      }
    : null;

  return {
    user: currentUser,
    isLoading,
    isAuthenticated,
  };
}
