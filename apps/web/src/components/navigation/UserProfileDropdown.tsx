'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Settings,
  Building2,
  CreditCard,
  HelpCircle,
  Keyboard,
  Globe,
  LogOut,
  ChevronDown,
  CircleDot,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/use-auth';
import { ThemeToggleMenuItem } from './ThemeToggle';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';

interface UserProfileDropdownProps {
  organizations?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  currentOrgName?: string;
  onSwitchOrg?: (orgId: string) => void;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

export function UserProfileDropdown({
  organizations = [],
  currentOrgName,
  onSwitchOrg,
  showOnlineStatus = true,
  isOnline = true,
}: UserProfileDropdownProps) {
  const { user, isLoading } = useCurrentUser();
  const { logout } = useAuth();
  const router = useRouter();
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleShowShortcuts = () => {
    setShortcutsOpen(true);
  };

  if (isLoading || !user) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Avatar className="h-8 w-8">
          <AvatarFallback>...</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 gap-2 px-2 hover:bg-accent"
          >
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              {showOnlineStatus && (
                <span
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                  aria-label={isOnline ? 'Online' : 'Offline'}
                />
              )}
            </div>
            <div className="hidden md:flex md:flex-col md:items-start md:text-left">
              <span className="text-sm font-medium">{user.fullName}</span>
              <span className="text-xs text-muted-foreground">
                {currentOrgName || user.email}
              </span>
            </div>
            <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.fullName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              {currentOrgName && (
                <div className="flex items-center gap-1.5 pt-1">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{currentOrgName}</p>
                </div>
              )}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground capitalize">
                  Role: {user.role.toLowerCase()}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/settings/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/account" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/organization" className="cursor-pointer">
                <Building2 className="mr-2 h-4 w-4" />
                <span>Organization Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/billing" className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link
                href="https://docs.operateos.com"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShowShortcuts}>
              <Keyboard className="mr-2 h-4 w-4" />
              <span>Keyboard Shortcuts</span>
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+/</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <ThemeToggleMenuItem />

          <OrganizationSwitcher
            currentOrgId={user.orgId}
            organizations={organizations}
            onSwitchOrg={onSwitchOrg}
          />

          <DropdownMenuSeparator />

          {showOnlineStatus && (
            <>
              <DropdownMenuItem disabled>
                <CircleDot
                  className={`mr-2 h-4 w-4 ${isOnline ? 'text-green-500' : 'text-gray-400'}`}
                />
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </>
  );
}
