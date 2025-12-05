# Navigation Components

User profile dropdown and related navigation components for the Operate/CoachOS platform.

## Components

### UserProfileDropdown

Main dropdown component displaying user information and navigation options.

#### Features
- User avatar with initials fallback
- Online/offline status indicator
- User information display (name, email, organization, role)
- Navigation to settings pages
- Organization switcher (if user has multiple orgs)
- Theme toggle (light/dark/system)
- Keyboard shortcuts dialog
- Help & Support link
- Sign out functionality

#### Usage

```tsx
import { UserProfileDropdown } from '@/components/navigation';

// Basic usage
<UserProfileDropdown />

// With organizations
<UserProfileDropdown
  organizations={[
    { id: 'org-1', name: 'Acme Corp', role: 'OWNER' },
    { id: 'org-2', name: 'Test Inc', role: 'ADMIN' },
  ]}
  currentOrgName="Acme Corp"
  onSwitchOrg={(orgId) => {
    // Handle organization switch
    console.log('Switching to org:', orgId);
  }}
/>

// With online status
<UserProfileDropdown
  showOnlineStatus={true}
  isOnline={navigator.onLine}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `organizations` | `Array<{id, name, role}>` | `[]` | List of user's organizations |
| `currentOrgName` | `string` | - | Current organization name to display |
| `onSwitchOrg` | `(orgId: string) => void` | - | Handler for organization switch |
| `showOnlineStatus` | `boolean` | `true` | Show online/offline indicator |
| `isOnline` | `boolean` | `true` | Current online status |

### OrganizationSwitcher

Submenu for switching between multiple organizations.

#### Features
- List all user's organizations with roles
- Current organization indicator
- Create new organization option
- Only shows if user has multiple organizations

#### Usage

```tsx
import { OrganizationSwitcher } from '@/components/navigation';

<OrganizationSwitcher
  currentOrgId="org-1"
  organizations={organizations}
  onSwitchOrg={handleOrgSwitch}
/>
```

### ThemeToggleMenuItem

Theme switcher submenu for the dropdown.

#### Features
- Light theme option
- Dark theme option
- System theme option (follows OS preference)
- Visual indicators for current theme

#### Usage

```tsx
import { ThemeToggleMenuItem } from '@/components/navigation';

// Use within a DropdownMenu
<DropdownMenuContent>
  <ThemeToggleMenuItem />
</DropdownMenuContent>
```

### KeyboardShortcutsDialog

Modal dialog displaying all available keyboard shortcuts.

#### Features
- Grouped shortcuts by category (General, Navigation, Actions)
- Searchable/scrollable list
- Visual keyboard key representations
- Automatic shortcut formatting

#### Usage

```tsx
import { KeyboardShortcutsDialog } from '@/components/navigation';

const [open, setOpen] = useState(false);

<KeyboardShortcutsDialog
  open={open}
  onOpenChange={setOpen}
/>
```

## Integration with Navigation Bar

Example integration in a top navigation bar:

```tsx
import { UserProfileDropdown } from '@/components/navigation';

export function TopNavBar() {
  const { user } = useCurrentUser();

  return (
    <header className="border-b">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Logo />
          <NavLinks />
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <CommandPalette />
          <UserProfileDropdown
            organizations={user?.organizations}
            currentOrgName={user?.currentOrg?.name}
          />
        </div>
      </div>
    </header>
  );
}
```

## Hooks

### useCurrentUser

Hook providing current user information with computed fields.

```tsx
import { useCurrentUser } from '@/hooks/useCurrentUser';

const { user, isLoading, isAuthenticated } = useCurrentUser();

// user object includes:
// - id, email, firstName, lastName
// - fullName, initials (computed)
// - avatarUrl, role, orgId, locale
```

## Menu Items

The dropdown includes the following menu sections:

1. **User Information**
   - Name, email, organization, role

2. **Settings Navigation**
   - My Profile (`/settings/profile`)
   - Account Settings (`/settings/account`)
   - Organization Settings (`/settings/organization`)
   - Billing (`/settings/billing`)

3. **Utilities**
   - Help & Support (external link)
   - Keyboard Shortcuts (opens modal)

4. **Preferences**
   - Theme Toggle (submenu)
   - Language Selector (if enabled)

5. **Organization**
   - Organization Switcher (if multiple orgs)

6. **Status & Actions**
   - Online/Offline Status
   - Sign Out

## Keyboard Shortcuts

Global shortcut to open keyboard shortcuts dialog:
- Windows/Linux: `Ctrl + /`
- macOS: `Cmd + /`

## Styling

All components use Tailwind CSS and shadcn/ui primitives. They support:
- Light/dark mode
- Responsive design (mobile-friendly)
- Consistent spacing and typography
- Accessible focus states

## Accessibility

- Proper ARIA labels for icons and status indicators
- Keyboard navigation support
- Screen reader friendly
- Focus management for dialogs

## Future Enhancements

- [ ] Add user avatar upload functionality
- [ ] Add language switcher integration
- [ ] Add notification preferences
- [ ] Add recent activity view
- [ ] Add quick actions menu
- [ ] Add user presence indicator
- [ ] Add organization role badge styling
- [ ] Add custom keyboard shortcut configuration
