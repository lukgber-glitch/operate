'use client';

import { Check, Building2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Organization {
  id: string;
  name: string;
  role: string;
}

interface OrganizationSwitcherProps {
  currentOrgId?: string;
  organizations?: Organization[];
  onSwitchOrg?: (orgId: string) => void;
}

export function OrganizationSwitcher({
  currentOrgId,
  organizations = [],
  onSwitchOrg,
}: OrganizationSwitcherProps) {
  const router = useRouter();

  const handleSwitchOrg = (orgId: string) => {
    if (onSwitchOrg) {
      onSwitchOrg(orgId);
    } else {
      // Default behavior: reload the page with the new org context
      window.location.href = '/';
    }
  };

  const handleCreateOrg = () => {
    router.push('/settings/organizations/new');
  };

  // Only show if user has multiple organizations
  if (!organizations || organizations.length <= 1) {
    return null;
  }

  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Building2 className="mr-2 h-4 w-4" />
          <span>Switch Organization</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-56">
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSwitchOrg(org.id)}
              className="flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium">{org.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {org.role.toLowerCase()}
                </span>
              </div>
              {org.id === currentOrgId && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCreateOrg}>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  );
}
