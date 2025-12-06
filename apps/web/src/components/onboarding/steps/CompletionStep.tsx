/**
 * CompletionStep Component
 * Final step of the onboarding wizard - success message and next steps
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  LayoutDashboard,
  FileText,
  Users,
  TrendingUp,
  BookOpen,
  ArrowRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const NEXT_STEPS = [
  {
    icon: LayoutDashboard,
    title: 'Explore Your Dashboard',
    description: 'Get an overview of your business metrics and recent activity',
    action: 'Go to Dashboard',
    href: '/dashboard',
  },
  {
    icon: FileText,
    title: 'Create Your First Invoice',
    description: 'Start invoicing clients and tracking payments',
    action: 'Create Invoice',
    href: '/finance/invoices/new',
  },
  {
    icon: Users,
    title: 'Add Team Members',
    description: 'Invite employees and manage their access permissions',
    action: 'Add Employees',
    href: '/hr/employees',
  },
  {
    icon: TrendingUp,
    title: 'Review Financial Reports',
    description: 'Analyze your income, expenses, and profit margins',
    action: 'View Reports',
    href: '/reports',
  },
]

const RESOURCES = [
  {
    icon: BookOpen,
    title: 'Settings & Configuration',
    description: 'Customize your account preferences',
    href: '/settings',
  },
  {
    icon: FileText,
    title: 'Manage Documents',
    description: 'Upload and organize your files',
    href: '/documents',
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Add and manage your clients',
    href: '/clients',
  },
]

interface CompletionStepProps {
  companyName?: string
  setupCompleted?: {
    banking?: boolean
    email?: boolean
    tax?: boolean
    accounting?: boolean
  }
}

export function CompletionStep({ companyName, setupCompleted }: CompletionStepProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = React.useState(false)

  const handleGoToDashboard = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsNavigating(true)

    try {
      // Call API to ensure onboarding is marked complete
      const response = await fetch('/api/v1/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      // Set cookie regardless of API response (API may return 409 if already complete)
      document.cookie = 'onboarding_complete=true; path=/; max-age=31536000; SameSite=Lax'

      // Clear localStorage progress
      localStorage.removeItem('operate_onboarding_progress')

      // Navigate to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      // Still try to navigate - set cookie and go
      document.cookie = 'onboarding_complete=true; path=/; max-age=31536000; SameSite=Lax'
      localStorage.removeItem('operate_onboarding_progress')
      router.push('/dashboard')
    }
  }

  const handleNavigate = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(href)
  }

  const completedIntegrations = Object.values(setupCompleted || {}).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-500" />
          </div>
          <div>
            <CardTitle className="text-2xl text-green-900 dark:text-green-100">
              Setup Complete!
            </CardTitle>
            <CardDescription className="text-base mt-2 text-green-700 dark:text-green-300">
              {companyName
                ? `Welcome aboard, ${companyName}! Your account is ready to use.`
                : 'Your account is ready to use.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>
              <strong>{completedIntegrations}</strong> integration
              {completedIntegrations !== 1 ? 's' : ''} connected
            </span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 max-w-md mx-auto">
            You&apos;re all set! Your business is now connected to Operate and ready to streamline
            your operations.
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">What Would You Like to Do First?</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {NEXT_STEPS.map((step) => (
            <Card
              key={step.title}
              className="border-muted hover:border-primary/50 transition-all cursor-pointer group"
              onClick={(e) => handleNavigate(e, step.href)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium group-hover:text-primary transition-colors">
                        {step.title}
                      </h4>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help Getting Started?</CardTitle>
          <CardDescription>Check out these resources to make the most of Operate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {RESOURCES.map((resource) => (
              <Button
                key={resource.title}
                type="button"
                variant="outline"
                className="h-auto flex-col items-start p-4 text-left"
                onClick={(e) => handleNavigate(e, resource.href)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <resource.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{resource.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">{resource.description}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">💡 Pro Tips</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Enable notifications to stay updated on invoices, expenses, and tax deadlines
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Connect your bank for automatic transaction reconciliation and save hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Use the mobile app to scan receipts and track expenses on the go
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Set up recurring invoices for regular clients to automate your billing
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Primary CTA */}
      <div className="flex justify-center pt-4">
        <Button type="button" size="lg" onClick={handleGoToDashboard} disabled={isNavigating} className="w-full md:w-auto">
          <LayoutDashboard className="w-4 h-4 mr-2" />
          {isNavigating ? 'Loading...' : 'Go to Dashboard'}
        </Button>
      </div>
    </div>
  )
}
