'use client'

import { Check, ChevronsUpDown, Building2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/hooks/use-sidebar'
import { cn } from '@/lib/utils'


// Mock data - replace with actual data from API
const organizations = [
  { id: '1', name: 'Acme Corp', role: 'Owner' },
  { id: '2', name: 'Tech Startup GmbH', role: 'Admin' },
  { id: '3', name: 'Consulting AG', role: 'Member' },
]

export function OrgSwitcher() {
  const { isOpen: isSidebarOpen } = useSidebar()
  const [selectedOrg, setSelectedOrg] = useState(organizations[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'justify-between w-full',
            !isSidebarOpen && 'px-2'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            {isSidebarOpen && selectedOrg && (
              <span className="truncate">{selectedOrg.name}</span>
            )}
          </div>
          {isSidebarOpen && (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => setSelectedOrg(org)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{org.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {org.role}
              </span>
            </div>
            {selectedOrg && selectedOrg.id === org.id && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
