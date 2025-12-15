'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';

export function PortalHeader() {
  return (
    <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold text-slate-900 dark:text-white">
              Operate
            </span>
          </Link>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Client Portal
          </div>
        </div>
      </div>
    </header>
  );
}
