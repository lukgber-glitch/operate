'use client';

import { Users, CreditCard, Settings, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const adminSections = [
  {
    title: 'User Management',
    description: 'Manage user accounts, roles, and permissions',
    icon: Users,
    href: '/admin/users',
    status: 'Active',
  },
  {
    title: 'Role Management',
    description: 'Define roles and assign permissions',
    icon: Settings,
    href: '/admin/roles',
    status: 'Active',
  },
  {
    title: 'Subscriptions',
    description: 'Monitor MRR, churn, and subscription analytics',
    icon: CreditCard,
    href: '/admin/subscriptions',
    status: 'Active',
  },
  {
    title: 'Audit Logs',
    description: 'View system activity and audit trails',
    icon: FileText,
    href: '/admin/audit-logs',
    status: 'Coming Soon',
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System administration and management console
        </p>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {adminSections.map((section) => {
          const Icon = section.icon;
          const isActive = section.status === 'Active';

          return (
            <Card
              key={section.href}
              className="relative overflow-hidden transition-all hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      {section.status && (
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            isActive
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {section.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base">
                  {section.description}
                </CardDescription>

                {isActive ? (
                  <Link href={section.href}>
                    <Button variant="outline" className="w-full group">
                      Open
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Coming Soon
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Quick statistics and system health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl text-white font-bold">1,234</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              <p className="text-2xl text-white font-bold">567</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <p className="text-2xl text-white font-bold">$45,678</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">System Status</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <p className="text-2xl text-white font-bold">Healthy</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
