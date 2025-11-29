'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

export interface Breadcrumb {
  label: string
  href: string
  isCurrentPage: boolean
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  documents: 'Documents',
  finance: 'Finance',
  invoices: 'Invoices',
  expenses: 'Expenses',
  banking: 'Banking',
  tax: 'Tax',
  reports: 'Reports',
  settings: 'Settings',
}

export function useBreadcrumbs(): Breadcrumb[] {
  const pathname = usePathname()

  return useMemo(() => {
    // Remove leading/trailing slashes and split
    const segments = pathname.split('/').filter(Boolean)

    // Build breadcrumbs array
    const breadcrumbs: Breadcrumb[] = []
    let currentPath = ''

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1

      breadcrumbs.push({
        label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
        isCurrentPage: isLast,
      })
    })

    return breadcrumbs
  }, [pathname])
}
