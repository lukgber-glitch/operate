# User Profile Dropdown - Integration Guide

Quick guide for integrating the UserProfileDropdown into your navigation bar.

## Quick Start (3 Steps)

### Step 1: Import the Component

```tsx
import { UserProfileDropdown } from '@/components/navigation';
```

### Step 2: Add to Your Navigation Bar

```tsx
export function TopNavigation() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Logo and nav links */}
        </div>

        <div className="flex items-center gap-2">
          {/* Other actions (search, notifications, etc.) */}
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}
```

### Step 3: You're Done!

The component will automatically:
- Fetch current user from `useCurrentUser` hook
- Display user information
- Handle sign out
- Show all menu options

## Advanced Integration

### With Multiple Organizations

If your users can belong to multiple organizations:

```tsx
import { UserProfileDropdown } from '@/components/navigation';
import { useOrganizations } from '@/hooks/useOrganizations';

export function TopNavigation() {
  const { organizations, currentOrg, switchOrg } = useOrganizations();

  return (
    <UserProfileDropdown
      organizations={organizations}
      currentOrgName={currentOrg?.name}
      onSwitchOrg={switchOrg}
    />
  );
}
```

### With Online Status

Track and display online/offline status:

```tsx
import { UserProfileDropdown } from '@/components/navigation';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function TopNavigation() {
  const isOnline = useOnlineStatus();

  return (
    <UserProfileDropdown
      showOnlineStatus={true}
      isOnline={isOnline}
    />
  );
}
```

### Create useOnlineStatus Hook

```tsx
// hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

## Complete Navigation Bar Example

```tsx
'use client';

import { UserProfileDropdown } from '@/components/navigation';
import { CommandPalette } from '@/components/command-palette';
import { NotificationBell } from '@/components/notifications';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import Link from 'next/link';

export function TopNavigation() {
  const { organizations, currentOrg, switchOrg } = useOrganizations();
  const isOnline = useOnlineStatus();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Left: Logo & Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary" />
            <span className="font-semibold text-lg">Operate</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              href="/invoices"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Invoices
            </Link>
            <Link
              href="/clients"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Clients
            </Link>
            <Link
              href="/tax"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Tax
            </Link>
            <Link
              href="/hr"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              HR
            </Link>
          </nav>
        </div>

        {/* Right: Actions & User */}
        <div className="flex items-center gap-2">
          <CommandPalette />
          <NotificationBell />
          <UserProfileDropdown
            organizations={organizations}
            currentOrgName={currentOrg?.name}
            onSwitchOrg={switchOrg}
            showOnlineStatus={true}
            isOnline={isOnline}
          />
        </div>
      </div>
    </header>
  );
}
```

## Connecting to Your Backend

### Fetch Organizations

Create a hook to fetch user's organizations:

```tsx
// hooks/useOrganizations.ts
'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from './useCurrentUser';

interface Organization {
  id: string;
  name: string;
  role: string;
}

export function useOrganizations() {
  const { user } = useCurrentUser();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | undefined>(user?.orgId);

  useEffect(() => {
    if (user?.id) {
      fetchOrganizations();
    }
  }, [user?.id]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  const switchOrg = async (orgId: string) => {
    try {
      await fetch('/api/organizations/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });

      setCurrentOrgId(orgId);

      // Reload the page to refresh data
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  };

  const currentOrg = organizations.find(org => org.id === currentOrgId);

  return {
    organizations,
    currentOrg,
    switchOrg,
    isLoading: !organizations.length && !!user?.id,
  };
}
```

## Global Keyboard Shortcuts

Register the Ctrl+/ shortcut globally to open the shortcuts dialog:

```tsx
// app/layout.tsx or providers
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function KeyboardShortcutsProvider({ children }) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ or Cmd+/ - Show keyboard shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        // Trigger custom event that UserProfileDropdown listens to
        window.dispatchEvent(new CustomEvent('open-keyboard-shortcuts'));
      }

      // Ctrl+K or Cmd+K - Open command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Open your command palette
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <>{children}</>;
}
```

Then update UserProfileDropdown to listen for this event:

```tsx
// In UserProfileDropdown.tsx, add:
useEffect(() => {
  const handleOpenShortcuts = () => {
    setShortcutsOpen(true);
  };

  window.addEventListener('open-keyboard-shortcuts', handleOpenShortcuts);
  return () => {
    window.removeEventListener('open-keyboard-shortcuts', handleOpenShortcuts);
  };
}, []);
```

## Styling Customization

### Custom Avatar Size

```tsx
<UserProfileDropdown className="[&_.avatar]:h-10 [&_.avatar]:w-10" />
```

### Custom Dropdown Width

```tsx
// Modify in UserProfileDropdown.tsx
<DropdownMenuContent className="w-72" align="end" forceMount>
```

### Custom Colors

Use Tailwind classes or CSS variables:

```css
/* globals.css */
.user-profile-dropdown {
  --dropdown-width: 18rem;
  --avatar-size: 2.5rem;
}
```

## Testing

### Basic Test

```tsx
import { render, screen } from '@testing-library/react';
import { UserProfileDropdown } from '@/components/navigation';

describe('UserProfileDropdown', () => {
  it('renders user information', () => {
    render(<UserProfileDropdown />);

    // Should show avatar
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Integration Test

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfileDropdown } from '@/components/navigation';

describe('UserProfileDropdown', () => {
  it('opens dropdown on click', async () => {
    render(<UserProfileDropdown />);

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(await screen.findByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
  });

  it('logs out when Sign Out is clicked', async () => {
    const mockLogout = jest.fn();
    render(<UserProfileDropdown />);

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Click sign out
    const signOut = await screen.findByText('Sign Out');
    fireEvent.click(signOut);

    expect(mockLogout).toHaveBeenCalled();
  });
});
```

## Troubleshooting

### Dropdown Not Opening

Check that Radix UI DropdownMenu dependencies are installed:
```bash
npm install @radix-ui/react-dropdown-menu
```

### User Data Not Loading

Ensure `useAuth` hook is properly configured and user is authenticated:
```tsx
const { user, isLoading } = useCurrentUser();

if (isLoading) {
  return <LoadingSpinner />;
}

if (!user) {
  return <LoginButton />;
}
```

### Theme Toggle Not Working

Ensure ThemeProvider is wrapping your app:
```tsx
// app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider';

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Organizations Not Showing

The organization switcher only appears if the user has multiple organizations. Check:
```tsx
// Should have length > 1
const organizations = [
  { id: 'org-1', name: 'Org 1', role: 'OWNER' },
  { id: 'org-2', name: 'Org 2', role: 'ADMIN' },
];
```

## Support

For issues or questions:
- Check the [README.md](./README.md) for detailed documentation
- Review [examples](./UserProfileDropdown.example.tsx) for common use cases
- Check the [completion report](/W35-T7_COMPLETION_REPORT.md) for implementation details

## Next Features

Planned enhancements:
- Avatar upload functionality
- Language switcher integration
- User preferences panel
- Notification settings
- Recent activity view
- Quick actions menu
