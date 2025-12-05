'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { useBreadcrumbs } from '@/hooks/use-breadcrumbs'

export function Breadcrumbs() {
  const breadcrumbs = useBreadcrumbs()

  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
          )}
          {breadcrumb.isCurrentPage ? (
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {breadcrumb.label}
            </span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
