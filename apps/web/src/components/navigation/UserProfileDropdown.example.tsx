/**
 * UserProfileDropdown Usage Examples
 *
 * This file demonstrates various ways to use the UserProfileDropdown component
 * in different contexts within the Operate/CoachOS application.
 */

'use client';

import * as React from 'react';
import { UserProfileDropdown } from './UserProfileDropdown';

/**
 * Example 1: Basic Usage
 * Minimal implementation with default behavior
 */
export function BasicExample() {
  return (
    <div className="flex justify-end p-4">
      <UserProfileDropdown />
    </div>
  );
}

/**
 * Example 2: With Multiple Organizations
 * Shows organization switcher for users with multiple orgs
 */
export function MultiOrgExample() {
  const [currentOrgId, setCurrentOrgId] = React.useState('org-1');

  const organizations = [
    { id: 'org-1', name: 'Acme Corporation', role: 'OWNER' },
    { id: 'org-2', name: 'Tech Startup Inc.', role: 'ADMIN' },
    { id: 'org-3', name: 'Consulting Group', role: 'MEMBER' },
  ];

  const handleSwitchOrg = (orgId: string) => {
    setCurrentOrgId(orgId);
    console.log('Switched to organization:', orgId);
    // In production: Update context, reload data, etc.
  };

  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  return (
    <div className="flex justify-end p-4">
      <UserProfileDropdown
        organizations={organizations}
        currentOrgName={currentOrg?.name}
        onSwitchOrg={handleSwitchOrg}
      />
    </div>
  );
}

/**
 * Example 3: With Online Status
 * Shows real-time online/offline status indicator
 */
export function OnlineStatusExample() {
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex justify-end p-4">
      <UserProfileDropdown
        showOnlineStatus={true}
        isOnline={isOnline}
      />
    </div>
  );
}

/**
 * Example 4: Full Navigation Bar Integration
 * Complete example with all features in a navigation bar
 */
export function NavigationBarExample() {
  const [isOnline, setIsOnline] = React.useState(true);
  const [currentOrgId, setCurrentOrgId] = React.useState('org-1');

  const organizations = [
    { id: 'org-1', name: 'Acme Corporation', role: 'OWNER' },
    { id: 'org-2', name: 'Tech Startup Inc.', role: 'ADMIN' },
  ];

  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Left: Logo and Navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary" />
            <span className="font-semibold text-lg">Operate</span>
          </div>

          <nav className="hidden md:flex items-center gap-4">
            <a href="/dashboard" className="text-sm font-medium hover:text-primary">
              Dashboard
            </a>
            <a href="/invoices" className="text-sm font-medium hover:text-primary">
              Invoices
            </a>
            <a href="/clients" className="text-sm font-medium hover:text-primary">
              Clients
            </a>
            <a href="/tax" className="text-sm font-medium hover:text-primary">
              Tax
            </a>
          </nav>
        </div>

        {/* Right: Actions and User Profile */}
        <div className="flex items-center gap-2">
          {/* Search or Command Palette */}
          <button className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border rounded-md hover:bg-accent">
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded">
              Ctrl+K
            </kbd>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-md hover:bg-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {/* User Profile Dropdown */}
          <UserProfileDropdown
            organizations={organizations}
            currentOrgName={currentOrg?.name}
            onSwitchOrg={setCurrentOrgId}
            showOnlineStatus={true}
            isOnline={isOnline}
          />
        </div>
      </div>
    </header>
  );
}

/**
 * Example 5: Mobile Responsive Layout
 * Shows how the component adapts to mobile screens
 */
export function MobileResponsiveExample() {
  return (
    <div className="space-y-4 p-4">
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="flex justify-end border rounded-lg p-4 bg-card">
          <UserProfileDropdown />
        </div>
        <p className="text-sm text-muted-foreground mt-2">Desktop view</p>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden">
        <div className="flex justify-end border rounded-lg p-4 bg-card">
          <UserProfileDropdown />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Mobile view (only shows avatar)
        </p>
      </div>
    </div>
  );
}

/**
 * Example 6: With Custom Organization Switching
 * Demonstrates custom logic when switching organizations
 */
export function CustomOrgSwitchExample() {
  const [currentOrgId, setCurrentOrgId] = React.useState('org-1');
  const [isLoading, setIsLoading] = React.useState(false);

  const organizations = [
    { id: 'org-1', name: 'Acme Corporation', role: 'OWNER' },
    { id: 'org-2', name: 'Tech Startup Inc.', role: 'ADMIN' },
  ];

  const handleSwitchOrg = async (orgId: string) => {
    setIsLoading(true);
    try {
      // Simulate API call to switch organization context
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update local state
      setCurrentOrgId(orgId);

      // In production: Update auth context, reload data, etc.
      console.log('Organization switched successfully');

      // Optionally reload the page or redirect
      // window.location.href = '/dashboard';
    } catch (error) {
      console.error('Failed to switch organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  if (isLoading) {
    return <div className="p-4">Switching organization...</div>;
  }

  return (
    <div className="flex justify-end p-4">
      <UserProfileDropdown
        organizations={organizations}
        currentOrgName={currentOrg?.name}
        onSwitchOrg={handleSwitchOrg}
      />
    </div>
  );
}
